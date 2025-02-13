import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import Bouquet from './../models/bouquetModel.js'
import { Types } from 'mongoose'

const bouquet = {
  /**
   * @desc    Get Bouquets
   * @route   GET /api/bouquets
   * @access  Private
   */
  getBouquets: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue } = req.query

    const filter = { userId: req.user._id }

    try {
      const totalCount = await Bouquet.countDocuments(filter)

      const bouquets = await Bouquet.find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: bouquets,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),
  /**
   * @desc    Get Bouquets
   * @route   GET /api/bouquets/public/:userId
   * @access  Public
   */
  getPublicBouquets: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    try {
      const totalCount = await Bouquet.countDocuments(filter)

      const bouquets = await Bouquet.find(filter)
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: bouquets,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Add Bouquet
   * @route   POST /api/bouquets
   * @access  Private
   */
  addBouquet: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const userId = req.user._id
      await Bouquet.create({ ...req.body, userId })
      res.status(201).json({ success: true, message: 'bouquet_added' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Get Bouquet
   * @route   GET /api/bouquets/:id
   * @access  Private
   */
  getBouquet: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      const bouquet = await Bouquet.findOne({ userId: req.user._id, _id: bouquetId })
      if (bouquet) res.status(200).json({ data: bouquet })
      else res.status(400).json({ success: false, message: 'bouquet_not_found' })
    } catch (error) {
      res.status(200).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Bouquet
   * @route   PATCH /api/bouquets/:id
   * @access  Private
   */
  editBouquet: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const bouquetId = req.params.id
      await Bouquet.findByIdAndUpdate(bouquetId, req.body)
      res.status(200).json({ success: true, message: 'bouquet_edited' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Bouquet
   * @route   DELETE /api/bouquets/:id
   * @access  Private
   */
  deleteBouquet: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      await Bouquet.findByIdAndDelete(bouquetId)
      res.status(200).json({ success: true, message: 'bouquet_deleted' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default bouquet

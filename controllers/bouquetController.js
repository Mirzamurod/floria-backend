import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import bouquetModel from './../models/bouquetModel.js'

const bouquet = {
  /**
   * @desc    Get Bouquets
   * @route   GET /api/bouquets
   * @access  Private
   */
  getBouquets: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, search, category } = req.query

    const filter = { userId: req.user._id }

    if (search)
      filter.$expr = { $regexMatch: { input: { $toString: '$orderNumber' }, regex: search } }
    if (category) filter.category = category

    try {
      const totalCount = await bouquetModel.countDocuments(filter)

      const bouquets = await bouquetModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([{ path: 'category', model: 'Category' }])

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
    const { limit = 20, page = 1, category } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    if (category) filter.category = category

    try {
      const totalCount = await bouquetModel.countDocuments(filter)

      const bouquets = await bouquetModel
        .find(filter)
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([{ path: 'category', model: 'Category' }])

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
      await bouquetModel.create({ ...req.body, userId })
      res.status(201).json({ success: true, message: "Buket qo'shildi" })
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
      const bouquet = await bouquetModel.findOne({ userId: req.user._id, _id: bouquetId })
      if (bouquet) res.status(200).json({ data: bouquet })
      else res.status(400).json({ success: false, message: 'Buket topilmadi' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
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
      await bouquetModel.findByIdAndUpdate(bouquetId, req.body)
      res.status(200).json({ success: true, message: "Buket o'zgartirildi" })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Bouquet
   * @route   PATCH /api/bouquets/block/:id
   * @access  Private
   */
  editBouquetBlock: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      await bouquetModel.findByIdAndUpdate(bouquetId, req.body)
      res.status(200).json({ success: true, message: "Buket o'zgartirildi" })
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
      await bouquetModel.findByIdAndDelete(bouquetId)
      res.status(200).json({ success: true, message: "Buket o'chirildi" })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default bouquet

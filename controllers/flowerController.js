import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import Flower from '../models/flowerModel.js'

const flower = {
  /**
   * @desc    Get Flowers
   * @route   GET /api/flowers
   * @access  Private
   */
  getFlowers: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue } = req.query

    const filter = { userId: req.user._id }

    try {
      const totalCount = await Flower.countDocuments(filter)

      const flowers = await Flower.find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: flowers,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),
  /**
   * @desc    Get Flowers
   * @route   GET /api/flowers/public/:id
   * @access  Public
   */
  getPublicFlowers: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    try {
      const totalCount = await Flower.countDocuments(filter)

      const flowers = await Flower.find(filter)
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: flowers,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Add Flower
   * @route   POST /api/flowers
   * @access  Private
   */
  addFlower: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const userId = req.user._id
      await Flower.create({ ...req.body, userId })
      res.status(201).json({ success: true, message: 'flower_added' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Get Flower
   * @route   GET /api/flowers/:id
   * @access  Private
   */
  getFlower: expressAsyncHandler(async (req, res) => {
    try {
      const flowerId = req.params.id
      const flower = await Flower.findOne({ userId: req.user._id, _id: flowerId })
      if (flower) res.status(200).json({ data: flower })
      else res.status(400).json({ success: false, message: 'flower_not_found' })
    } catch (error) {
      res.status(200).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Flower
   * @route   PATCH /api/flowers/:id
   * @access  Private
   */
  editFlower: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const flowerId = req.params.id
      await Flower.findByIdAndUpdate(flowerId, req.body)
      res.status(200).json({ success: true, message: 'flower_edited' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Flower
   * @route   DELETE /api/flowers/:id
   * @access  Private
   */
  deleteFlower: expressAsyncHandler(async (req, res) => {
    try {
      const flowerId = req.params.id
      await Flower.findByIdAndDelete(flowerId)
      res.status(200).json({ success: true, message: 'flower_deleted' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default flower

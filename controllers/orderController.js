import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import orderModel from '../models/orderModel.js'

const order = {
  /**
   * @desc    Get Orders
   * @route   GET /api/orders
   * @access  Private
   */
  getOrders: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue } = req.query

    const filter = { userId: req.user._id }

    try {
      const totalCount = await orderModel.countDocuments(filter)

      const orders = await orderModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: orders,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Add Order
   * @route   POST /api/orders
   * @access  Private
   */
  addOrder: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const userId = req.user._id
      await orderModel.create({ ...req.body, userId })
      res.status(201).json({ success: true, message: 'order_added' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Get Order
   * @route   GET /api/orders/:id
   * @access  Private
   */
  getOrder: expressAsyncHandler(async (req, res) => {
    try {
      const orderId = req.params.id
      const order = await orderModel.findOne({ userId: req.user._id, _id: orderId })
      if (order) res.status(200).json({ data: order })
      else res.status(400).json({ success: false, message: 'order_not_found' })
    } catch (error) {
      res.status(200).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Order
   * @route   PATCH /api/orders/:id
   * @access  Private
   */
  editOrder: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const orderId = req.params.id
      await orderModel.findByIdAndUpdate(orderId, req.body)
      res.status(200).json({ success: true, message: 'order_edited' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Order
   * @route   DELETE /api/orders/:id
   * @access  Private
   */
  deleteOrder: expressAsyncHandler(async (req, res) => {
    try {
      const orderId = req.params.id
      await orderModel.findByIdAndDelete(orderId)
      res.status(200).json({ success: true, message: 'order_deleted' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default order

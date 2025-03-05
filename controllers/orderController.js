import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import orderModel from '../models/orderModel.js'
import { bots } from '../telegramBot.js'

const order = {
  /**
   * @desc    Get Orders
   * @route   GET /api/orders
   * @access  Private
   */
  getOrders: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, status, search } = req.query

    const filter = { userId: req.user._id, status }

    if (search)
      filter.$expr = { $regexMatch: { input: { $toString: '$orderNumber' }, regex: search } }

    try {
      const totalCount = await orderModel.countDocuments(filter)

      const orders = await orderModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([
          { path: 'bouquet.bouquets.bouquetId', model: 'Bouquet' },
          { path: 'flower.flowers.flowerId', model: 'Flower' },
          { path: 'customerId', model: 'Customer' },
          // { path: 'userId', model: 'User' },
        ])

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
      let orderNumber
      let existOrder

      do {
        orderNumber = Math.floor(100000 + Math.random() * 900000)
        existOrder = await orderModel.findOne({ userId, orderNumber })
      } while (existOrder)

      await orderModel.create({ ...req.body, userId, orderNumber })
      res.status(201).json({ success: true, message: "Zakaz qo'shildi" })
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
      const order = await orderModel.findOne({ userId: req.user._id, _id: orderId }).populate([
        { path: 'bouquet.bouquets.bouquetId', model: 'Bouquet' },
        { path: 'flower.flowers.flowerId', model: 'Flower' },
        { path: 'customerId', model: 'Customer' },
        // { path: 'userId', model: 'User' },
      ])
      if (order) res.status(200).json({ data: order })
      else res.status(400).json({ success: false, message: 'Zakaz topilmadi' })
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
      const telegramToken = req.user.telegramToken
      const location = req.user.location
      const updatedOrder = await orderModel
        .findByIdAndUpdate(orderId, req.body)
        .populate('customerId')

      // check telegram token
      if (telegramToken) {
        await bots[telegramToken].sendMessage(
          updatedOrder.customerId.chatId,
          `Sizning #No${updatedOrder.orderNumber} raqamli zakazingiz tayyor bo'ldi.`
        )
        // check delivery and location
        if (updatedOrder.delivery === 'takeaway') {
          let long_lat = location.split(', ')
          if (long_lat.length === 2) {
            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              location ? 'Zakazingizni pastdagi lokatsiyadan olib ketishingiz mumkin.' : ''
            )
            await bots[telegramToken].sendLocation(
              updatedOrder.customerId.chatId,
              long_lat[0],
              long_lat[1]
            )
          } else {
            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              location
                ? `Zakazingizni <a href='${location}'>shu yerdan</a> olib ketishingiz mumkin.`
                : '',
              { parse_mode: 'HTML' }
            )
          }

          await bots[telegramToken].sendMessage(
            updatedOrder.customerId.chatId,
            "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
            web_app
          )
        } else {
          await bots[telegramToken].sendMessage(
            updatedOrder.customerId.chatId,
            'Tez orada manzilingizga yetkazib beriladi',
            web_app
          )

          await bots[telegramToken].sendMessage(
            updatedOrder.customerId.chatId,
            "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
            web_app
          )
        }
      }
      res.status(200).json({ success: true, message: "Zakaz o'zgartirildi" })
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
      res.status(200).json({ success: true, message: "Zakaz o'chirildi" })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default order

import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import axios from 'axios'
import orderModel from '../models/orderModel.js'
import { bots } from '../telegramBot.js'
import languages from '../languages/index.js'

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
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), date: 1 })
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
      const telegramId = req.user.telegramId
      const location = req.user.location
      const { status, payment } = req.body
      const web_app = lang => {
        return {
          reply_markup: {
            keyboard: [
              [
                {
                  text: languages[lang].seebouquets,
                  web_app: { url: `${process.env.FRONT_URL}${req.user._id}` },
                },
              ],
            ],
            resize_keyboard: true,
          },
        }
      }
      const updatedOrder = await orderModel
        .findByIdAndUpdate(
          orderId,
          { ...req.body, ...(payment && payment === 'cancelled' ? { repayment: true } : {}) },
          { new: true }
        )
        .populate('customerId')

      const lang = updatedOrder.customerId.lang

      // check telegram token
      if (telegramToken) {
        if (status) {
          await bots[telegramToken].sendMessage(
            updatedOrder.customerId.chatId,
            status === 'cancelled'
              ? languages[lang].ordercancelled(updatedOrder.orderNumber)
              : languages[lang].orderdone(updatedOrder.orderNumber)
          )
          // check delivery and location
          if (updatedOrder.delivery === 'takeaway') {
            let long_lat = location.split(', ')
            if (long_lat.length === 2) {
              await bots[telegramToken].sendMessage(
                updatedOrder.customerId.chatId,
                location ? languages[lang].pickuporder : ''
              )
              await bots[telegramToken].sendLocation(
                updatedOrder.customerId.chatId,
                long_lat[0],
                long_lat[1]
              )
            } else {
              await bots[telegramToken].sendMessage(
                updatedOrder.customerId.chatId,
                location ? languages[lang].location(location) : '',
                { parse_mode: 'HTML' }
              )
            }

            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              languages[lang].seebouquetsmore,
              web_app(lang)
            )
          } else {
            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              languages[lang].deliveredsoon
            )

            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              languages[lang].seebouquetsmore
            )
          }
        } else {
          if (payment === 'accepted') {
            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              languages[lang].successpayment(updatedOrder.orderNumber)
            )

            await bots[telegramToken].sendMessage(
              updatedOrder.customerId.chatId,
              languages[lang].seebouquetsmore,
              web_app(lang)
            )
          } else if (payment === 'cancelled') {
            if (updatedOrder.prepaymentNumber >= 2) {
              await orderModel.findByIdAndUpdate(orderId, { status: 'cancelled' })

              await bots[telegramToken].sendMessage(
                updatedOrder.customerId.chatId,
                languages[lang].cancelledpayment2(updatedOrder.orderNumber)
              )

              if (telegramId) {
                let my_text = `${languages['uz'].cancelledorder(
                  updatedOrder.orderNumber
                )}%0A%0A${languages['uz'].cancelledorder(updatedOrder.orderNumber)}`
                await axios.post(
                  `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
                )
              }
            } else {
              await bots[telegramToken].sendMessage(
                updatedOrder.customerId.chatId,
                languages[lang].cancelledpayment(updatedOrder.orderNumber)
              )

              await bots[telegramToken].sendMessage(
                updatedOrder.customerId.chatId,
                languages[lang].warningpayment,
                { reply_markup: { remove_keyboard: true } }
              )
            }
          }
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

  /**
   * @desc    Unsubmitted Order
   * @route   GET /api/orders/unsubmitted/:id
   * @access  Private
   */
  unsubmittedOrder: expressAsyncHandler(async (req, res) => {
    try {
      const orderId = req.params.id
      const telegramToken = req.user.telegramToken
      const order = await orderModel.findById(orderId).populate('customerId')

      if (telegramToken && order.status === 'unsubmitted') {
        await bots[telegramToken].sendMessage(
          order.customerId.chatId,
          `Sotuvchi sizdan #No${order.orderNumber} raqamli zakazingizni oldingizmi deb so'rayapti?`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Ha', callback_data: `yes_${order._id}` },
                  { text: "Yo'q", callback_data: `no_${order._id}` },
                ],
              ],
            },
          }
        )

        res.status(200).json({ success: true, message: 'Klientga habar yuborildi.' })
      } else {
        res.status(200).json({
          success: true,
          message:
            "Zakaz 'Topshirilmagan zakazlar' bo'limida emas, 'Eski zakazlar' yoki 'Bekor bo'lganlar' bo'limidan qarab ko'ring",
        })
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default order

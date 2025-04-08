import expressAsyncHandler from 'express-async-handler'
import { addMonths } from 'date-fns'
import userModel from './../models/userModel.js'

const user = {
  /**
   * @desc    Delete User
   * @route   DELETE /api/users/delete
   * @access  Private
   */
  delete: expressAsyncHandler(async (req, res) => {
    if (req.user) {
      await userModel.findByIdAndDelete(req.user.id)
      res.status(200).json({ success: true, message: 'deletedclient' })
    } else res.status(400).json({ success: false, message: 'notfoundclient' })
  }),

  /**
   * @desc    Get Clients by Admin
   * @route   GET /api/clients
   * @access  Private
   */
  getClientsByAdmin: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, search } = req.query

    const filter = { role: 'client' }

    if (search) filter.email = { $regex: search ?? '', $options: 'i' }

    try {
      const totalCount = await userModel.countDocuments(filter)

      const clients = await userModel
        .find(filter, { password: 0 })
        .sort(sortValue ? { [sortName]: sortValue } : sortName)
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: clients,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Edit Client by Admin
   * @route   PATCH /api/clients/edit/:id
   * @access  Private
   */
  editClientByAdmin: expressAsyncHandler(async (req, res) => {
    const clientId = req.params.id
    const { block, plan, date } = req.body

    try {
      await userModel.findByIdAndUpdate(clientId, {
        block,
        plan,
        date,
        ...(plan ? { block: false } : {}),
      })
      res.status(200).json({ success: true, message: 'updateduser' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Client Telegram key
   * @route   PATCH /api/clients/telegram
   * @access  Private
   */
  editTelegramKey: expressAsyncHandler(async (req, res) => {
    try {
      const userId = req.user._id
      const { telegramToken, telegramId, location, card_number, card_name, userName, userPhone } =
        req.body
      await userModel.findByIdAndUpdate(userId, {
        telegramToken,
        telegramId,
        location,
        card_number,
        card_name,
        userName,
        userPhone,
      })

      res.status(200).json({ success: true, message: 'updateduser' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Get User
   * @route   GET /api/users/public/:id
   * @access  Public
   */
  getUser: expressAsyncHandler(async (req, res) => {
    const userId = req.params.id

    try {
      const user = await userModel.findById(userId, { location: 1, card_number: 1 })

      res.status(200).json({ data: user })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit User by Admin
   * @route   PATCH /api/client/payment/:id
   * @access  Private
   */
  paymentUser: expressAsyncHandler(async (req, res) => {
    const userId = req.params.id
    const date = req.body.date

    try {
      await userModel.findByIdAndUpdate(userId, { date: addMonths(date, 1), plan: 'month' })

      res.status(200).json({ success: true, message: 'userupdated' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default user

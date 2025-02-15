import expressAsyncHandler from 'express-async-handler'
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
      res.status(200).json({ success: true, message: 'user_deleted' })
    } else res.status(400).json({ success: false, message: 'user_not_found' })
  }),

  /**
   * @desc    Get Clients by Admin
   * @route   GET /api/client
   * @access  Private
   */
  getClientsByAdmin: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue } = req.query

    const filter = { userId: req.user._id, role: 'client' }

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
   * @desc    Edit Client Telegram key
   * @route   PATCH /api/client/telegram
   * @access  Private
   */
  editTelegramKey: expressAsyncHandler(async (req, res) => {
    try {
      const userId = req.user._id
      const { telegramToken, telegramId, location } = req.body
      await userModel.findByIdAndUpdate(userId, { telegramToken, telegramId, location })

      res.status(200).json({ success: true, message: 'user_edited' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default user

import express from 'express'
import { admin, client, protect } from '../middleware/authMiddleware.js'
import user from './../controllers/userController.js'

const router = express.Router()

router.delete('/users', protect, user.delete)
router.route('/clients').get(protect, admin, user.getClientsByAdmin)
router.patch('/clients/:id', protect, admin, user.editClientByAdmin)
router.patch('/clients/telegram', protect, client, user.editTelegramKey)

export default router

import express from 'express'
import { admin, client, protect } from '../middleware/authMiddleware.js'
import user from './../controllers/userController.js'

const router = express.Router()

router.delete('/users', protect, user.delete)
router.route('/clients').get(protect, admin, user.getClientsByAdmin)
router.patch('/clients/edit/:id', protect, admin, user.editClientByAdmin)
router.patch('/clients/telegram', protect, client, user.editTelegramKey)
router.get('/users/public/:id', user.getUser)

export default router

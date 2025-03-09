import express from 'express'
import { client, protect } from '../middleware/authMiddleware.js'
import order from '../controllers/orderController.js'

const router = express.Router()

router.route('/').get(protect, client, order.getOrders).post(protect, client, order.addOrder)
router
  .route('/:id')
  .get(protect, client, order.getOrder)
  .patch(protect, client, order.editOrder)
  .delete(protect, client, order.deleteOrder)
router.get('/unsubmmitted/:id', protect, client, order.unsubmittedOrder)

export default router

import express from 'express'
import { client, protect } from '../middleware/authMiddleware.js'
import flower from '../controllers/flowerController.js'
import { flowerAddField } from '../middleware/checkFields.js'

const router = express.Router()

router
  .route('/')
  .get(protect, client, flower.getFlowers)
  .post(protect, client, flowerAddField, flower.addFlower)
router
  .route('/:id')
  .get(protect, client, flower.getFlower)
  .patch(protect, client, flowerAddField, flower.editFlower)
  .delete(protect, client, flower.deleteFlower)
router.get('/public/:userId', flower.getPublicFlowers)

export default router

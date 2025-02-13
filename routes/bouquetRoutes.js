import express from 'express'
import { client, protect } from '../middleware/authMiddleware.js'
import bouquet from '../controllers/bouquetController.js'
import { bouquetAddField } from '../middleware/checkFields.js'

const router = express.Router()

router
  .route('/')
  .get(protect, client, bouquet.getBouquets)
  .post(protect, client, bouquetAddField, bouquet.addBouquet)
router
  .route('/:id')
  .get(protect, client, bouquet.getBouquet)
  .patch(protect, client, bouquetAddField, bouquet.editBouquet)
  .delete(protect, client, bouquet.deleteBouquet)
router.get('/public/:userId', bouquet.getPublicBouquets)

export default router

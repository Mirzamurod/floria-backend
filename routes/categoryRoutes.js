import express from 'express'
import { client, protect } from '../middleware/authMiddleware.js'
import category from '../controllers/categoryController.js'
import { categoryAddField } from '../middleware/checkFields.js'

const router = express.Router()

router
  .route('/')
  .get(protect, client, category.getCategories)
  .post(protect, client, categoryAddField, category.addCategory)
router
  .route('/:id')
  .get(protect, client, category.getCategory)
  .patch(protect, client, categoryAddField, category.editCategory)
  .delete(protect, client, category.deleteCategory)
router.patch('/block/:id', protect, client, category.editCategoryBlock)
router.get('/public/:userId', category.getPublicCategories)

export default router

import express from 'express'
import path from 'path'
import multer from 'multer'
import { client, protect } from '../middleware/authMiddleware.js'
import flower from '../controllers/flowerController.js'
import { flowerAddField } from '../middleware/checkFields.js'

const router = express.Router()

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(null, 'Images only!')
  }
}

const storage = multer.memoryStorage()
const upload = multer({ storage, fileFilter: (req, file, cb) => checkFileType(file, cb) })

router
  .route('/')
  .get(protect, client, flower.getFlowers)
  .post(protect, client, upload.single('image'), flowerAddField, flower.addFlower)
router
  .route('/:id')
  .get(protect, client, flower.getFlower)
  .patch(protect, client, upload.single('image'), flowerAddField, flower.editFlower)
  .delete(protect, client, flower.deleteFlower)
router.patch('/block/:id', protect, client, flower.editFlowerBlock)
router.get('/public/:userId', flower.getPublicFlowers)

export default router

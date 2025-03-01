import express from 'express'
import path from 'path'
import multer from 'multer'
import { client, protect } from '../middleware/authMiddleware.js'
import bouquet from '../controllers/bouquetController.js'
import { bouquetAddField } from '../middleware/checkFields.js'

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
  .get(protect, client, bouquet.getBouquets)
  .post(protect, client, upload.single('image'), bouquetAddField, bouquet.addBouquet)
router
  .route('/:id')
  .get(protect, client, bouquet.getBouquet)
  .patch(protect, client, upload.single('image'), bouquetAddField, bouquet.editBouquet)
  .delete(protect, client, bouquet.deleteBouquet)
router.patch('/block/:id', protect, client, bouquet.editBouquetBlock)
router.get('/public/:userId', bouquet.getPublicBouquets)

export default router

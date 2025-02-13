import { check } from 'express-validator'

export const bouquetAddField = [
  check('image').notEmpty().withMessage('image_required').bail().trim(),
  check('price').notEmpty().withMessage('price_required').bail().trim(),
]

export const flowerAddField = [
  check('image').notEmpty().withMessage('image_required').bail().trim(),
  check('price').notEmpty().withMessage('price_required').bail().trim(),
  check('name').notEmpty().withMessage('name_required').bail().trim(),
]

export const orderAddField = [check('phone').notEmpty().withMessage('phone_required').bail().trim()]

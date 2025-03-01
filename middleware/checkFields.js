import { check } from 'express-validator'

export const bouquetAddField = [
  // check('image').notEmpty().withMessage('Rasm majburiy').bail().trim(),
  check('price').notEmpty().withMessage('Narx majburiy').bail().trim(),
]

export const flowerAddField = [
  // check('image').notEmpty().withMessage('Rasm majburiy').bail().trim(),
  check('price').notEmpty().withMessage('Narx majburiy').bail().trim(),
  check('name').notEmpty().withMessage('Nomi majburiy').bail().trim(),
]

export const orderAddField = [
  check('phone').notEmpty().withMessage('Telefon raqam majburiy').bail().trim(),
]

export const categoryAddField = [
  check('name').notEmpty().withMessage('Nomi majburiy').bail().trim(),
]

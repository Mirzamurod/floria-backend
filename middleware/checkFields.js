import { check } from 'express-validator'

export const bouquetAddField = [
  // check('image').notEmpty().withMessage('Rasm majburiy').bail().trim(),
  check('price').notEmpty().withMessage('pricerequired').bail().trim(),
]

export const flowerAddField = [
  // check('image').notEmpty().withMessage('Rasm majburiy').bail().trim(),
  check('price').notEmpty().withMessage('pricerequired').bail().trim(),
  check('name').notEmpty().withMessage('namerequired').bail().trim(),
]

export const orderAddField = [check('phone').notEmpty().withMessage('phonerequired').bail().trim()]

export const categoryAddField = [
  check('nameUz').notEmpty().withMessage('namerequired').bail().trim(),
  check('nameRu').notEmpty().withMessage('namerequired').bail().trim(),
]

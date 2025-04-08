import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import categoryModel from '../models/categoryModel.js'

const category = {
  /**
   * @desc    Get Categories
   * @route   GET /api/category
   * @access  Private
   */
  getCategories: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, search } = req.query

    const filter = { userId: req.user._id }

    if (search) {
      filter.nameUz = { $regex: search ?? '', $options: 'i' }
      filter.nameRu = { $regex: search ?? '', $options: 'i' }
    }

    try {
      const totalCount = await categoryModel.countDocuments(filter)

      const categories = await categoryModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: categories,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Get Category
   * @route   GET /api/category/public/:userId
   * @access  Public
   */
  getPublicCategories: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    try {
      const totalCount = await categoryModel.countDocuments(filter)

      const categories = await categoryModel
        .find(filter)
        .limit(+limit)
        .skip(+limit * (+page - 1))

      res.status(200).json({
        page,
        data: categories,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Add Category
   * @route   POST /api/category
   * @access  Private
   */
  addCategory: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const userId = req.user._id
      await categoryModel.create({ ...req.body, userId })
      res.status(201).json({ success: true, message: 'addedcategory' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Get Category
   * @route   GET /api/category/:id
   * @access  Private
   */
  getCategory: expressAsyncHandler(async (req, res) => {
    try {
      const categoryId = req.params.id
      const category = await categoryModel.findById(categoryId)
      if (category) res.status(200).json({ data: category })
      else res.status(400).json({ success: false, message: 'notfoundcategory' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Category
   * @route   PATCH /api/category/:id
   * @access  Private
   */
  editCategory: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const categoryId = req.params.id
      await categoryModel.findByIdAndUpdate(categoryId, req.body)
      res.status(200).json({ success: true, message: 'editedcategory' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Category
   * @route   PATCH /api/category/block/:id
   * @access  Private
   */
  editCategoryBlock: expressAsyncHandler(async (req, res) => {
    try {
      const categoryId = req.params.id
      await categoryModel.findByIdAndUpdate(categoryId, req.body)
      res.status(200).json({ success: true, message: 'editedcategory' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Category
   * @route   DELETE /api/category/:id
   * @access  Private
   */
  deleteCategory: expressAsyncHandler(async (req, res) => {
    try {
      const categoryId = req.params.id
      await categoryModel.findByIdAndDelete(categoryId)
      res.status(200).json({ success: true, message: 'deletedcategory' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default category

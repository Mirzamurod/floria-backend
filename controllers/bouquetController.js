import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import bouquetModel from './../models/bouquetModel.js'
import userModel from '../models/userModel.js'
import minioClient from '../utils/minioClient.js'
import getPresignedUrl from '../utils/presignedUrl.js'
import { bucketName } from '../utils/constans.js'

const bouquet = {
  /**
   * @desc    Get Bouquets
   * @route   GET /api/bouquets
   * @access  Private
   */
  getBouquets: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, search, category } = req.query

    const filter = { userId: req.user._id }

    if (search)
      filter.$expr = { $regexMatch: { input: { $toString: '$orderNumber' }, regex: search } }
    if (category) filter.category = category

    try {
      const totalCount = await bouquetModel.countDocuments(filter)

      const bouquets = await bouquetModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([{ path: 'category', model: 'Category' }])

      let data = []
      for (const item of bouquets) {
        data.push({
          _id: item._id,
          price: item.price,
          name: item.name,
          info: item.info,
          block: item.block,
          category: item.category,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          image: await getPresignedUrl(item.image),
        })
      }

      res.status(200).json({
        page,
        data,
        pageLists: Math.ceil(totalCount / limit) || 1,
        count: totalCount,
      })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Get Bouquets
   * @route   GET /api/bouquets/public/:userId
   * @access  Public
   */
  getPublicBouquets: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, category } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    if (category) filter.category = category

    try {
      const user = await userModel.findOne({ _id: userId, block: false })
      if (user) {
        const totalCount = await bouquetModel.countDocuments(filter)

        const bouquets = await bouquetModel
          .find(filter)
          .limit(+limit)
          .skip(+limit * (+page - 1))
          .populate([{ path: 'category', model: 'Category' }])

        let data = []
        for (const item of bouquets) {
          data.push({
            _id: item._id,
            price: item.price,
            name: item.name,
            info: item.info,
            block: item.block,
            category: item.category,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            orgImage: item.image,
            image: await getPresignedUrl(item.image),
          })
        }

        res.status(200).json({
          page,
          data,
          pageLists: Math.ceil(totalCount / limit) || 1,
          count: totalCount,
        })
      } else res.status(200).json({ page: 1, data: [], pageLists: 1, count: 0 })
    } catch (error) {
      res.status(400).json({ message: error.message, success: false })
    }
  }),

  /**
   * @desc    Get Bouquet
   * @route   GET /api/bouquets/:id
   * @access  Private
   */
  getBouquet: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      const bouquet = await bouquetModel.findOne({ userId: req.user._id, _id: bouquetId })
      if (bouquet)
        res.status(200).json({
          data: {
            _id: bouquet._id,
            price: bouquet.price,
            name: bouquet.name,
            info: bouquet.info,
            block: bouquet.block,
            category: bouquet.category,
            createdAt: bouquet.createdAt,
            updatedAt: bouquet.updatedAt,
            image: await getPresignedUrl(bouquet.image),
          },
        })
      else res.status(400).json({ success: false, message: 'notfoundbouquet' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Add Bouquet
   * @route   POST /api/bouquets
   * @access  Private
   */
  addBouquet: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      if (req.file) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = path.extname(req.file.originalname).toLowerCase()

        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ success: false, message: 'Ruxsat etilmagan format' })
        }

        const imageName = `bouquets/${uuidv4()}${fileExtension}`

        const resizedImageBuffer = await sharp(req.file.buffer)
          .resize({ width: 540, height: 600 })
          .toBuffer()

        await minioClient.putObject(
          bucketName,
          imageName,
          resizedImageBuffer,
          resizedImageBuffer.length,
          { 'Content-Type': req.file.mimetype }
        )

        const userId = req.user._id
        await bouquetModel.create({ ...req.body, userId, image: imageName })

        res.status(201).json({ success: true, message: 'addedbouquet' })

        // if (allowedExtensions.includes(fileExtension)) {
        //   const imageName = Date.now() + path.extname(req.file.originalname)
        //   const image600 = await sharp(req.file.buffer)
        //     .resize({ width: 540, height: 600 })
        //     // .toFormat('png')
        //     .toFile('./images/' + 600 + imageName)

        //   if (image600) {
        //     const userId = req.user._id
        //     await bouquetModel.create({
        //       ...req.body,
        //       userId,
        //       image: `${process.env.IMAGE_URL}600${imageName}`,
        //     })
        //     res.status(201).json({ success: true, message: 'addedbouquet' })
        //   }
        // }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Bouquet
   * @route   PATCH /api/bouquets/:id
   * @access  Private
   */
  editBouquet: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const bouquetId = req.params.id
      const existsBouquet = await bouquetModel.findById(bouquetId)

      if (req.file) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = path.extname(req.file.originalname).toLowerCase()

        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ success: false, message: 'Ruxsat etilmagan format' })
        }

        const imageName = `bouquets/${uuidv4()}${fileExtension}`

        const resizedImageBuffer = await sharp(req.file.buffer)
          .resize({ width: 540, height: 600 })
          .toBuffer()

        await minioClient.putObject(
          bucketName,
          imageName,
          resizedImageBuffer,
          resizedImageBuffer.length,
          { 'Content-Type': req.file.mimetype }
        )

        await bouquetModel.findByIdAndUpdate(bouquetId, {
          ...req.body,
          image: imageName,
        })

        await minioClient.removeObject(bucketName, existsBouquet.image)

        // if (allowedExtensions.includes(fileExtension)) {
        //   const imageName = Date.now() + path.extname(req.file.originalname)
        //   const image600 = await sharp(req.file.buffer)
        //     .resize({ width: 540, height: 600 })
        //     .toFile('./images/' + 600 + imageName)

        //   if (image600) {
        //     await bouquetModel.findByIdAndUpdate(bouquetId, {
        //       ...req.body,
        //       image: `${process.env.IMAGE_URL}600${imageName}`,
        //     })

        //     const imageUrl = './images/'
        //     const image =
        //       imageUrl +
        //       existsBouquet?.image?.split('/')[existsBouquet?.image?.split('/').length - 1]
        //     if (existsSync(image)) unlinkSync(image)
        //     else console.log('❌ Fayl topilmadi:', image)

        res.status(200).json({ success: true, message: 'editedbouquet' })
        //   }
        // }
      } else {
        await bouquetModel.findByIdAndUpdate(bouquetId, req.body)
        res.status(200).json({ success: true, message: 'editedbouquet' })
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Bouquet
   * @route   PATCH /api/bouquets/block/:id
   * @access  Private
   */
  editBouquetBlock: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      await bouquetModel.findByIdAndUpdate(bouquetId, req.body)
      res.status(200).json({ success: true, message: 'editedbouquet' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Bouquet
   * @route   DELETE /api/bouquets/:id
   * @access  Private
   */
  deleteBouquet: expressAsyncHandler(async (req, res) => {
    try {
      const bouquetId = req.params.id
      const deletedBouquet = await bouquetModel.findByIdAndDelete(bouquetId)

      await minioClient.removeObject(bucketName, deletedBouquet.image)
      // const imageUrl = './images/'
      // const image =
      //   imageUrl + deletedBouquet?.image?.split('/')[deletedBouquet?.image?.split('/').length - 1]
      // if (existsSync(image)) unlinkSync(image)
      // else console.log('❌ Fayl topilmadi:', image)

      res.status(200).json({ success: true, message: 'deletedbouquet' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default bouquet

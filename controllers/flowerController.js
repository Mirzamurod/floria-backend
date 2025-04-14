import expressAsyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import flowerModel from '../models/flowerModel.js'
import minioClient from '../utils/minioClient.js'
import getPresignedUrl from '../utils/presignedUrl.js'
import { bucketName } from '../utils/constans.js'

const flower = {
  /**
   * @desc    Get Flowers
   * @route   GET /api/flowers
   * @access  Private
   */
  getFlowers: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sortName, sortValue, search, category } = req.query

    const filter = { userId: req.user._id }

    if (search) filter.name = { $regex: search ?? '', $options: 'i' }
    if (category) filter.category = category

    try {
      const totalCount = await flowerModel.countDocuments(filter)

      const flowers = await flowerModel
        .find(filter)
        .sort({ ...(sortValue ? { [sortName]: sortValue } : sortName), updatedAt: -1 })
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([{ path: 'category', model: 'Category' }])

      let data = []
      for (const item of flowers) {
        data.push({
          _id: item._id,
          price: item.price,
          name: item.name,
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
   * @desc    Get Flowers
   * @route   GET /api/flowers/public/:id
   * @access  Public
   */
  getPublicFlowers: expressAsyncHandler(async (req, res) => {
    const { limit = 20, page = 1, category } = req.query
    const { userId } = req.params

    const filter = { userId, block: false }

    if (category) filter.category = category

    try {
      const totalCount = await flowerModel.countDocuments(filter)

      const flowers = await flowerModel
        .find(filter)
        .limit(+limit)
        .skip(+limit * (+page - 1))
        .populate([{ path: 'category', model: 'Category' }])

      let data = []
      for (const item of flowers) {
        data.push({
          _id: item._id,
          price: item.price,
          name: item.name,
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
   * @desc    Get Flower
   * @route   GET /api/flowers/:id
   * @access  Private
   */
  getFlower: expressAsyncHandler(async (req, res) => {
    try {
      const flowerId = req.params.id
      const flower = await flowerModel.findOne({ userId: req.user._id, _id: flowerId })
      if (flower)
        res.status(200).json({
          data: {
            _id: flower._id,
            price: flower.price,
            name: flower.name,
            block: flower.block,
            category: flower.category,
            createdAt: flower.createdAt,
            updatedAt: flower.updatedAt,
            image: await getPresignedUrl(flower.image),
          },
        })
      else res.status(400).json({ success: false, message: 'notfoundflower' })
    } catch (error) {
      res.status(200).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Add Flower
   * @route   POST /api/flowers
   * @access  Private
   */
  addFlower: expressAsyncHandler(async (req, res) => {
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

        const imageName = `flowers/${uuidv4()}${fileExtension}`

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
        await flowerModel.create({ ...req.body, userId, image: imageName })

        res.status(201).json({ success: true, message: 'addedflower' })

        // if (allowedExtensions.includes(fileExtension)) {
        //   const imageName = Date.now() + path.extname(req.file.originalname)
        //   const image600 = await sharp(req.file.buffer)
        //     .resize({ width: 540, height: 600 })
        //     // .toFormat('png')
        //     .toFile('./images/' + 600 + imageName)

        //   if (image600) {
        //     const userId = req.user._id
        //     await flowerModel.create({
        //       ...req.body,
        //       userId,
        //       image: `${process.env.IMAGE_URL}600${imageName}`,
        //     })
        //     res.status(201).json({ success: true, message: 'addedflower' })
        //   }
        // }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Flower
   * @route   PATCH /api/flowers/:id
   * @access  Private
   */
  editFlower: expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ messages: errors.array(), success: false })
    }

    try {
      const flowerId = req.params.id
      const existsFlower = await flowerModel.findById(flowerId)

      if (req.file) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = path.extname(req.file.originalname).toLowerCase()

        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ success: false, message: 'Ruxsat etilmagan format' })
        }

        // Unikal fayl nomi
        const imageName = `flowers/${uuidv4()}${fileExtension}`

        // Sharp orqali o‘lcham o‘zgartirish
        const resizedImageBuffer = await sharp(req.file.buffer)
          .resize({ width: 540, height: 600 })
          .toBuffer()

        // MinIO'ga yuklash
        await minioClient.putObject(
          bucketName,
          imageName,
          resizedImageBuffer,
          resizedImageBuffer.length,
          { 'Content-Type': req.file.mimetype }
        )

        await flowerModel.findByIdAndUpdate(bouquetId, {
          ...req.body,
          image: imageName,
        })

        await minioClient.removeObject('floria', existsFlower.image)

        // if (allowedExtensions.includes(fileExtension)) {
        //   const imageName = Date.now() + path.extname(req.file.originalname)
        //   const image600 = await sharp(req.file.buffer)
        //     .resize({ width: 540, height: 600 })
        //     // .toFormat('png')
        //     .toFile('./images/' + 600 + imageName)

        //   if (image600) {
        //     await flowerModel.findByIdAndUpdate(flowerId, {
        //       ...req.body,
        //       image: `${process.env.IMAGE_URL}600${imageName}`,
        //     })

        //     const imageUrl = './images/'
        //     // const image = existsFlower?.image?.split('/')
        //     // fs.unlink(imageUrl + image[image.length - 1])
        //     const image =
        //       imageUrl + existsFlower?.image?.split('/')[existsFlower?.image?.split('/').length - 1]
        //     if (existsSync(image)) unlinkSync(image)
        //     else console.log('❌ Fayl topilmadi:', image)

        res.status(200).json({ success: true, message: 'editedflower' })
        //   }
        // }
      } else {
        await flowerModel.findByIdAndUpdate(flowerId, req.body)
        res.status(200).json({ success: true, message: 'editedflower' })
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Edit Flower
   * @route   PATCH /api/flowers/block/:id
   * @access  Private
   */
  editFlowerBlock: expressAsyncHandler(async (req, res) => {
    try {
      const flowerId = req.params.id
      await flowerModel.findByIdAndUpdate(flowerId, req.body)
      res.status(200).json({ success: true, message: 'editedflower' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),

  /**
   * @desc    Delete Flower
   * @route   DELETE /api/flowers/:id
   * @access  Private
   */
  deleteFlower: expressAsyncHandler(async (req, res) => {
    try {
      const flowerId = req.params.id
      const deletedFlower = await flowerModel.findByIdAndDelete(flowerId)

      await minioClient.removeObject('floria', deletedFlower.image)

      // const imageUrl = './images/'
      // const image =
      //   imageUrl + deletedFlower?.image?.split('/')[deletedFlower?.image?.split('/').length - 1]
      // if (existsSync(image)) unlinkSync(image)
      // else console.log('❌ Fayl topilmadi:', image)

      res.status(200).json({ success: true, message: 'deletedflower' })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }),
}

export default flower

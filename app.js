import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import connectDB from './config/db.js'
import {
  bouquetRoutes,
  orderRoutes,
  flowerRoutes,
  userRoutes,
  categoryRoutes,
} from './routes/index.js'
import { restoreBots } from './telegramBot.js'
import { checkOrders } from './checkOrders.js'
import minioClient from './utils/minioClient.js'
import { bucketName } from './utils/constans.js'

const app = express()
dotenv.config()
connectDB()

// app.use(
//   cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
// )
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: false }))
app.use(cookieParser())

minioClient.bucketExists(bucketName, (err, exists) => {
  if (err) {
    console.error('Xatolik:', err)
    return
  }

  if (!exists)
    minioClient.makeBucket(bucketName, 'us-east-1', err => {
      if (err) return console.error('Bucket yaratishda xatolik:', err)
      console.log('Bucket yaratildi')
    })
  else console.log('Bucket allaqachon mavjud')
})

// `__dirname` ni qayta yaratish
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rasmlar saqlanadigan papka
const imagesDir = join(__dirname, 'images')

// Agar papka yo'q bo'lsa
if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })

app.use('/images', express.static(path.join(__dirname, 'images')))

app.get('/', (req, res) => res.send('Hello World'))

app.use('/api', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/bouquets', bouquetRoutes)
app.use('/api/flowers', flowerRoutes)
app.use('/api/category', categoryRoutes)

const port = process.env.PORT || 5000

app.listen(port, async () => {
  console.log(`Server ishga tushdi, Port ${port}`.yellow.bold)
  await restoreBots()
  await checkOrders()

  // 📌 Har 10 soniyada tokenlarni qayta yuklash
  setInterval(restoreBots, 10000)
})

export default app

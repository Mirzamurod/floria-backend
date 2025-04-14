import { bucketName } from './constans.js'
import minioClient from './minioClient.js'

const getPresignedUrl = async filename => {
  const url = await minioClient.presignedGetObject(
    bucketName, // Bucket nomi
    filename, // Fayl nomi (to‘liq path bilan, masalan: audios/abc.mp3)
    60 // URL amal qilish vaqti (sekundlarda) – bu yerda 1 daqiqa
  )

  return url
}

export default getPresignedUrl

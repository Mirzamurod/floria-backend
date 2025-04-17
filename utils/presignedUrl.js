import { bucketName } from './constans.js'
import minioClient from './minioClient.js'

const getPresignedUrl = async filename => {
  const url = await minioClient.presignedGetObject(
    bucketName, // Bucket nomi
    filename, // Fayl nomi (to‘liq path bilan, masalan: audios/abc.mp3)
    // 60 * 5 // URL amal qilish vaqti (sekundlarda) – bu yerda 1 daqiqa
    24 * 60 * 60
  )

  // localhost:9000 ni floria.uz/images ga almashtirish
  return url.replace('http://localhost:9000/', process.env.MINIO_EXTERNAL_URL)

  // return url
}

export default getPresignedUrl

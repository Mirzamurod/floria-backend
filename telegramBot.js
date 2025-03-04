import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import User from './models/userModel.js'
import Customer from './models/customerModel.js'
import Order from './models/orderModel.js'

export const bots = {} // Xotirada botlarni saqlash

const getSum = sum => {
  return `${Number(sum).toLocaleString().replaceAll(',', ' ')} so'm`
}

// ✅ Bot yaratish va saqlash
const createBot = async (telegramToken, user) => {
  if (bots[telegramToken]) {
    return bots[telegramToken] // Agar bot allaqachon mavjud bo‘lsa, qaytaramiz
  }

  const bot = new TelegramBot(telegramToken, { polling: true })
  const { telegramId, card_name, card_number } = user

  bot.setMyCommands([{ command: '/start', description: "Buketlar haqida ma'lumot" }])

  const web_app = {
    reply_markup: {
      keyboard: [
        [{ text: "Buketlarni ko'rish", web_app: { url: `${process.env.FRONT_URL}${user._id}` } }],
      ],
      resize_keyboard: true,
    },
  }

  const locationKeyboard = {
    reply_markup: {
      keyboard: [[{ text: '📍 Manzilingizni yuborish', request_location: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  }

  const imageKeyboard = {
    reply_markup: { remove_keyboard: true },
    // reply_markup: {
    //   keyboard: [[{ text: '📸 Rasm yuborish' }]],
    //   resize_keyboard: true,
    //   one_time_keyboard: true,
    // },
  }

  bot.on('message', async msg => {
    const chatId = msg.chat.id
    const text = msg.text
    const botName = await bot.getMe()
    const customer = await Customer.findOne({ chatId })
    const photoArray = msg.photo
    const getLocation = msg.location

    if (text === '/start') {
      await bot.sendMessage(chatId, `${botName.first_name} platformasiga xush kelibsiz.`)

      if (customer?.phone) {
        await bot.sendMessage(
          chatId,
          "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
          web_app
        )
      } else {
        await bot.sendMessage(
          chatId,
          'Buket zakat qilishdan oldin telefon raqamingizni jo‘nating:',
          {
            reply_markup: {
              keyboard: [[{ text: "📲 Kontaktni jo'natish", request_contact: true }]],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          }
        )
      }
    }

    if (msg.photo) {
      const existOrder = await Order.findOne({
        customerId: customer._id,
        location: { $exists: true },
        prepayment: true,
        prepaymentImage: { $exists: false },
      }).sort({ createdAt: -1 })
      console.log(existOrder)

      if (photoArray[2].file_id && existOrder) {
        await Order.findByIdAndUpdate(existOrder._id, {
          prepaymentImage: await bot.getFileLink(photoArray[2].file_id),
        })

        await bot.sendMessage(chatId, "Rasm adminga jo'natildi. Tez orada sizga xabar beramiz.")

        await bot.sendMessage(
          chatId,
          "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
          web_app
        )

        if (existOrder && telegramId) {
          let my_text = `Yangi zakaz: <a href='${process.env.FRONT_URL}view/${existOrder._id}'>zakazni ko'rish</a>`
          await axios.post(
            `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=html`
          )
        }
      }
    }

    if (msg.contact) {
      await Customer.create({
        chatId,
        userId: user._id,
        name: msg.contact.first_name,
        phone: msg.contact.phone_number,
      })

      await bot.sendMessage(
        msg.chat.id,
        `✅ Raqamingiz qabul qilindi: ${msg.contact.first_name}. Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin`,
        web_app
      )
    }

    if (msg.web_app_data?.data) {
      try {
        const data = JSON.parse(msg.web_app_data?.data)

        if (data.userId === user._id.toString()) {
          let orderNumber
          let existOrder

          do {
            orderNumber = Math.floor(100000 + Math.random() * 900000)
            existOrder = await Order.findOne({ userId: data.userId, orderNumber })
          } while (existOrder)
          console.log(data)

          const createdOrder = await Order.create({
            ...data,
            orderNumber,
            userId: data.userId,
            customerId: customer._id,
          })

          const getOrder = await Order.findById(createdOrder._id).populate([
            { path: 'bouquet.bouquets.bouquetId', model: 'Bouquet' },
            { path: 'flower.flowers.flowerId', model: 'Flower' },
            // { path: 'userId', model: 'User' },
            { path: 'customerId', model: 'Customer' },
          ])

          await bot.sendMessage(
            chatId,
            `#No${getOrder.orderNumber} raqamli zakazingiz qabul qilindi.\nSiz zakaz bergan buketlar ro'yxati:`
          )

          if (getOrder?.bouquet?.bouquets?.length) {
            for (const item of getOrder?.bouquet?.bouquets) {
              await bot.sendPhoto(chatId, item?.bouquetId?.image, {
                caption: `${item.name ? item.name + ' - ' : ''}${item.qty}x: ${getSum(item.price)}`,
              })
            }
          }

          if (getOrder?.flower?.flowers?.length) {
            let data = []
            let sum = 0
            for (const item of getOrder?.flower?.flowers) {
              data.push(item?.flowerId?.name + ' - ' + item.qty + 'x: ' + getSum(item.price) + '\n')
              sum += +item.price
            }

            await bot.sendMessage(chatId, `Maxsus buket:\n${data.join('')}\nNarxi: ${getSum(sum)}`)
          }

          if (getOrder?.delivery === 'delivery') {
            await bot.sendMessage(
              chatId,
              'Buketlarni yetkazib berish uchun manzilingizni yuboring.',
              locationKeyboard
            )
          }
        }
      } catch (error) {
        console.log(error)
      }
    }

    if (getLocation?.latitude && getLocation?.longitude) {
      const existOrder = await Order.findOne({
        customerId: customer._id,
        location: { $exists: false },
      }).sort({ createdAt: -1 })

      console.log(existOrder)

      if (existOrder) {
        await Order.findByIdAndUpdate(existOrder._id, { location: getLocation })

        await bot.sendMessage(
          chatId,
          `Manzilingiz qabul qilindi.${
            existOrder.prepayment
              ? `\n\nShu karta raqamiga to'lov qilishingiz va rasmini bizga yuborishingiz kerak, biz to'lovni tekshirib sizga xabar beramiz.\n\`${card_number}\`\n${card_name}`
              : "Buket tayyor bo'lishi bilan manzilingizga yetkazib beramiz."
          }`,
          { ...imageKeyboard, parse_mode: 'Markdown' }
        )

        if (!existOrder.prepayment)
          await bot.sendMessage(
            chatId,
            "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
            web_app
          )
      }
    }
  })

  // Tugma bosilganda
  // bot.on('callback_query', query => {
  //   const chatId = query.message.chat.id
  //   const selectedOrder = query.data

  //   bot.sendMessage(
  //     chatId,
  //     `Siz tanladingiz: ${selectedOrder}\nEndi manzilingizni yuboring!`,
  //     locationKeyboard
  //   )

  //   // Tanlangan buyurtmani saqlab qo'yamiz (foydalanuvchidan keyin keladigan location bilan bog'lash uchun)
  //   bot.once('message', msg => {
  //     if (msg.location) {
  //       const { latitude, longitude } = msg.location

  //       bot.sendMessage(
  //         chatId,
  //         `✅ Buyurtma: ${selectedOrder}\n📍 Location:\n🌍 Latitude: ${latitude}\n📍 Longitude: ${longitude}`,
  //         web_app
  //       )
  //     }
  //   })
  // })

  bots[telegramToken] = bot
  console.log(`🚀 Bot ishga tushdi: ${telegramToken}`.green.bold)

  // ✅ Tokenni database'ga saqlaymiz
  await User.findOneAndUpdate({ telegramToken }, { telegramToken }, { upsert: true })

  return bot
}

// 🔄 **Server qayta ishga tushganda barcha botlarni tiklash**
export const restoreBots = async () => {
  const tokens = await User.find({ role: 'client', telegramToken: { $exists: true }, block: false })
  tokens.forEach(({ telegramToken, telegramId, _id, card_name, card_number }) => {
    if (!bots[telegramToken] && telegramToken)
      createBot(telegramToken, { telegramId, _id, card_name, card_number })
  })

  Object.keys(bots).forEach(telegramToken => {
    if (!tokens.some(t => t.telegramToken === telegramToken)) {
      bots[telegramToken].stopPolling()
      delete bots[telegramToken]
      console.log(`🛑 Bot to'xtatildi: ${telegramToken}`.red.bold)
    }
  })
}

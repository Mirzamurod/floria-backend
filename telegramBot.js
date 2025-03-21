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
  const { telegramId, card_name, card_number, userName, userPhone } = user

  bot.setMyCommands([
    { command: '/start', description: "Buketlar ko'rish" },
    { command: '/deleteorder', description: 'Zakazni bekor qilish' },
    { command: '/userinfo', description: "Bot egasi haqida ma'lumot" },
    { command: '/cardinfo', description: "Karta haqida ma'lumot" },
  ])

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
        const repaymentOrder = await Order.findOne({
          customerId: customer._id,
          repayment: true,
          prepaymentImage: { $exists: true },
          status: 'new',
        }).sort({ createdAt: -1 })

        if (repaymentOrder) {
          await bot.sendMessage(
            chatId,
            `Sizning #No${repaymentOrder.orderNumber} raqamli zakazingizga qilgan to'lovingiz qabul qilinmadi`
          )

          await bot.sendMessage(
            chatId,
            "To'g'ri to'lov rasmini tashlang yoki zakazingizni bekor qiling.\n\nAgar zakazingizni bekor qilmoqchi bo'lsangiz Menuni bosib \"Zakazni bekor qilish\" ni tanlab zakazingizni bekor qiling.",
            imageKeyboard
          )
        } else
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

    if (text === '/deleteorder') {
      const orders = await Order.find({ customerId: customer._id, status: 'new' })

      if (orders.length) {
        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: [
              ...orders.map(item => [
                { text: `💐 No${item.orderNumber}`, callback_data: item._id },
              ]),
              [{ text: 'Hech qaysi', callback_data: 'not_delete_order' }],
            ],
          },
        }
        await bot.sendMessage(chatId, 'Qaysi zakazni bekor qilmoqchisiz?', inlineKeyboard)
      } else {
        await bot.sendMessage(chatId, 'Hech qanday zakaz topilmadi.')
      }
    }

    if (text === '/userinfo')
      await bot.sendMessage(chatId, `Ismi: ${userName}\nTelefon raqami: ${userPhone}`)

    if (text === '/cardinfo')
      await bot.sendMessage(
        chatId,
        `Karta raqami: \`${card_number}\`\nKarta egasining ismi: ${card_name}`,
        { parse_mode: 'Markdown' }
      )

    if (msg.photo) {
      const repaymentOrder = await Order.findOne({
        customerId: customer._id,
        repayment: true,
        prepaymentImage: { $exists: true },
        status: 'new',
      }).sort({ createdAt: -1 })

      if (repaymentOrder) {
        if (photoArray[2].file_id && repaymentOrder && repaymentOrder.prepaymentNumber === 1) {
          await Order.findByIdAndUpdate(
            repaymentOrder._id,
            {
              prepaymentImage: await bot.getFileLink(photoArray[2].file_id),
              prepaymentNumber: 2,
              payment: 'pending',
            },
            { new: true }
          )

          await bot.sendMessage(
            chatId,
            "Rasm adminga jo'natildi. Tez orada sizga xabar beramiz.",
            imageKeyboard
          )

          if (repaymentOrder && telegramId) {
            let my_text = `\`${repaymentOrder.orderNumber}\` qayta to'lov qildi: [zakazni ko'rish](${process.env.FRONT_URL}view/${repaymentOrder._id})`
            await axios.post(
              // `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=html`
              `https://api.telegram.org/bot${telegramToken}/sendPhoto`,
              {
                chat_id: telegramId,
                photo: photoArray[2].file_id,
                caption: my_text,
                parse_mode: 'Markdown',
              }
            )
          }
        }
      } else {
        const existOrder = await Order.findOne({
          customerId: customer._id,
          prepayment: true,
          prepaymentImage: { $exists: false },
          status: 'new',
        }).sort({ createdAt: -1 })

        if (photoArray[2].file_id && existOrder) {
          await Order.findByIdAndUpdate(
            existOrder._id,
            {
              prepaymentImage: await bot.getFileLink(photoArray[2].file_id),
              prepaymentNumber: 1,
              payment: 'pending',
            },
            { new: true }
          )

          await bot.sendMessage(chatId, "Rasm adminga jo'natildi. Tez orada sizga xabar beramiz.")

          await bot.sendMessage(
            chatId,
            "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
            web_app
          )

          if (existOrder && telegramId) {
            let my_text = `Yangi zakaz: [zakazni ko'rish](${process.env.FRONT_URL}view/${existOrder._id})`
            await axios.post(
              // `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=html`
              `https://api.telegram.org/bot${telegramToken}/sendPhoto`,
              {
                chat_id: telegramId,
                photo: photoArray[2].file_id,
                caption: my_text,
                parse_mode: 'Markdown',
              }
            )
          }
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

          await bot.sendMessage(
            chatId,
            `**Buketlar umumiy soni**:  ${
              getOrder?.bouquet?.qty + getOrder?.flower?.qty
            } ta\n**Buketlar umumiy narxi**: ${getSum(
              getOrder?.bouquet.price + getOrder?.flower?.price
            )}`,
            { parse_mode: 'Markdown' }
          )

          if (getOrder?.delivery === 'delivery') {
            await bot.sendMessage(
              chatId,
              'Buketlarni yetkazib berish uchun manzilingizni yuboring.',
              locationKeyboard
            )
          } else if (getOrder?.delivery === 'takeaway') {
            if (getOrder.prepayment)
              await bot.sendMessage(
                chatId,
                `Pastdagi karta raqamiga to'lov qilishingiz va rasmini bizga yuborishingiz kerak, biz to'lovni tekshirib sizga xabar beramiz.\n\n\`${card_number}\`\n${card_name}`,
                { ...imageKeyboard, parse_mode: 'Markdown' }
              )
            else {
              await bot.sendMessage(
                chatId,
                "Zakazingiz qabul qilindi. Tayyor bo'lishi bilan sizga xabar beramiz"
              )

              await bot.sendMessage(
                chatId,
                "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
                web_app
              )

              if (getOrder && telegramId) {
                let my_text = `Yangi zakaz: <a href='${process.env.FRONT_URL}view/${getOrder._id}'>zakazni ko'rish</a>`
                await axios.post(
                  `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=html`
                )
              }
            }
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
        status: 'new',
      }).sort({ createdAt: -1 })

      if (existOrder) {
        await Order.findByIdAndUpdate(existOrder._id, { location: getLocation })

        if (existOrder.prepayment) {
          await bot.sendMessage(
            chatId,
            `Manzilingiz qabul qilindi.\n\nPastdagi karta raqamiga to'lov qilishingiz va rasmini bizga yuborishingiz kerak, biz to'lovni tekshirib sizga xabar beramiz.\n\n\`${card_number}\`\n${card_name}`,
            { ...imageKeyboard, parse_mode: 'Markdown' }
          )
        } else {
          await bot.sendMessage(
            chatId,
            "Manzilingiz qabul qilindi. Buket tayyor bo'lishi bilan manzilingizga yetkazib beramiz."
          )

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
    }
  })

  // Tugma bosilganda
  bot.on('callback_query', async query => {
    const chatId = query.message.chat.id
    const selectedOrder = query.data
    const customer = await Customer.findOne({ chatId })
    const messageId = query.message.message_id

    if (selectedOrder.split('_')[0] === 'yes') {
      await bot.sendMessage(chatId, 'Javobingiz uchun rahmat.')

      await bot.deleteMessage(chatId, messageId)

      await bot.sendMessage(
        chatId,
        "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
        web_app
      )

      const updatedOrder = await Order.findByIdAndUpdate(
        selectedOrder.split('_')[1],
        { status: 'old' },
        { new: true }
      )

      if (updatedOrder && telegramId) {
        let my_text = `Klient \`${updatedOrder.orderNumber}\` raqamli zakazni qabul qildi.`
        await axios.post(
          `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
        )
      }
    } else if (selectedOrder.split('_')[0] === 'no') {
      await bot.sendMessage(
        chatId,
        `Sotuvchiga telefon qilib gaplashing, nega buketingiz tayyor bo'lmaganligi haqida.\n\nIsmi: ${userName}\nTelefon raqami: ${userPhone}`
      )
    } else {
      if (selectedOrder !== 'not_delete_order') {
        const deletedOrder = await Order.findByIdAndUpdate(
          selectedOrder,
          { status: 'cancelled' },
          { new: true }
        )

        await bot.sendMessage(
          chatId,
          `No${deletedOrder.orderNumber} raqamli zakazingiz bekor qilindi.`
        )

        if (deletedOrder && telegramId) {
          let my_text = `\`${deletedOrder.orderNumber}\` raqamli zakaz bekor qilindi.`
          await axios.post(
            `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
          )
        }

        const orders = await Order.find({ customerId: customer._id, status: 'new' })

        if (orders.length) {
          await bot.editMessageReplyMarkup(
            {
              inline_keyboard: [
                ...orders.map(item => [
                  { text: `💐 No${item.orderNumber}`, callback_data: item._id },
                ]),
                [{ text: 'Hech qaysi', callback_data: 'not_delete_order' }],
              ],
            },
            { chat_id: chatId, message_id: messageId }
          )
        } else await bot.deleteMessage(chatId, messageId)
      } else await bot.deleteMessage(chatId, messageId)

      const repaymentOrder = await Order.findOne({
        customerId: customer._id,
        repayment: true,
        prepaymentImage: { $exists: true },
        status: 'new',
      }).sort({ createdAt: -1 })

      if (repaymentOrder) {
        await bot.sendMessage(
          chatId,
          `Sizning #No${repaymentOrder.orderNumber} raqamli zakazingizga qilgan to'lovingiz qabul qilinmadi`
        )

        await bot.sendMessage(
          chatId,
          "To'g'ri to'lov rasmini tashlang yoki zakazingizni bekor qiling.\n\nAgar zakazingizni bekor qilmoqchi bo'lsangiz Menuni bosib \"Zakazni bekor qilish\" ni tanlab zakazingizni bekor qiling.",
          imageKeyboard
        )
      } else
        await bot.sendMessage(
          chatId,
          "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin",
          web_app
        )
    }
  })

  bots[telegramToken] = bot
  console.log(`🚀 Bot ishga tushdi: ${telegramToken}`.green.bold)

  // ✅ Tokenni database'ga saqlaymiz
  await User.findOneAndUpdate({ telegramToken }, { telegramToken }, { upsert: true })

  return bot
}

// 🔄 **Server qayta ishga tushganda barcha botlarni tiklash**
export const restoreBots = async () => {
  const tokens = await User.find({
    block: false,
    role: 'client',
    userName: { $exists: true, $ne: '', $nin: ['', null] },
    userPhone: { $exists: true, $ne: '', $nin: ['', null] },
    card_name: { $exists: true, $ne: '', $nin: ['', null] },
    card_number: { $exists: true, $ne: '', $nin: ['', null] },
    telegramToken: { $exists: true, $ne: '', $nin: ['', null] },
  })
  tokens.forEach(
    ({ telegramToken, telegramId, _id, card_name, card_number, userName, userPhone }) => {
      if (!bots[telegramToken] && telegramToken)
        createBot(telegramToken, { telegramId, _id, card_name, card_number, userName, userPhone })
    }
  )

  Object.keys(bots).forEach(telegramToken => {
    if (!tokens.some(t => t.telegramToken === telegramToken)) {
      bots[telegramToken].stopPolling()
      delete bots[telegramToken]
      console.log(`🛑 Bot to'xtatildi: ${telegramToken}`.red.bold)
    }
  })
}

import TelegramBot from 'node-telegram-bot-api'
import User from './models/userModel.js'
import Customer from './models/customerModel.js'
import Order from './models/orderModel.js'

const bots = {} // Xotirada botlarni saqlash

const getSum = sum => {
  return `${Number(sum).toLocaleString().replaceAll(',', ' ')} so'm`
}

// ✅ Bot yaratish va saqlash
const createBot = async (telegramToken, _id) => {
  if (bots[telegramToken]) {
    return bots[telegramToken] // Agar bot allaqachon mavjud bo‘lsa, qaytaramiz
  }

  const bot = new TelegramBot(telegramToken, { polling: true })

  bot.setMyCommands([{ command: '/start', description: "Buketlar haqida ma'lumot" }])

  bot.on('message', async msg => {
    const chatId = msg.chat.id
    const text = msg.text
    const botName = await bot.getMe()
    const customer = await Customer.findOne({ chatId })

    if (text === '/start') {
      await bot.sendMessage(chatId, `${botName.first_name} platformasiga xush kelibsiz.`)

      if (customer?.phone) {
        await bot.sendMessage(
          chatId,
          "Buketlarni ko'rish knopkasini bosib buket va gullarni ko'rishingiz mumkin",
          {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: "Buketlarni ko'rish",
                    web_app: { url: `${process.env.FRONT_URL}${_id}` },
                  },
                ],
              ],
              resize_keyboard: true,
            },
          }
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

    if (msg.contact) {
      await Customer.create({
        chatId,
        userId: _id,
        name: msg.contact.first_name,
        phone: msg.contact.phone_number,
      })

      await bot.sendMessage(
        msg.chat.id,
        `✅ Raqamingiz qabul qilindi: ${msg.contact.first_name}. Buketlarni ko'rish knopkasini bosib buket va gullarni ko'rishingiz mumkin`,
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Buketlarni ko'rish",
                  web_app: { url: `${process.env.FRONT_URL}${_id}` },
                },
              ],
            ],
            resize_keyboard: true,
          },
        }
      )
    }

    if (msg.web_app_data?.data) {
      try {
        const { bouquets, flowers } = JSON.parse(msg.web_app_data?.data)
        console.log(msg.web_app_data?.data)
        console.log('data', { bouquets, flowers })

        const createdOrder = await Order.create({
          bouquets,
          flowers,
          userId: _id,
          customerId: customer._id,
        })

        const getOrder = await Order.findById(createdOrder._id).populate([
          { path: 'bouquets.bouquetId', model: 'Bouquet' },
          { path: 'flowers.flowerId', model: 'Flower' },
          { path: 'userId', model: 'User' },
          { path: 'customerId', model: 'Customer' },
        ])
        console.log(getOrder)

        await bot.sendMessage(
          chatId,
          `#No${getOrder.orderNumber} raqamli zakazingiz qabul qilindi.\nSiz zakaz bergan buketlar ro'yxati:`
        )

        if (getOrder?.bouquets?.length) {
          for (const item of getOrder.bouquets) {
            await bot.sendPhoto(chatId, item.image, {
              caption: `${item.name ? item.name + ' - ' : ''}${item.qty}x: ${getSum(item.price)}`,
            })
          }
        }

        if (getOrder?.flowers?.length) {
          let data = []
          let sum = 0
          for (const item of getOrder.flowers) {
            data.push(item?.flowerId?.name + ' - ' + item.qty + '\n')
            sum += +item.price
          }

          await bot.sendMessage(chatId, `${data.join(',')}\nNarxi: ${getSum(sum)}`)
        }
      } catch (error) {
        console.log(error)
      }
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
  const tokens = await User.find({ role: 'client', telegramToken: { $exists: true }, block: false })
  tokens.forEach(({ telegramToken, _id }) => {
    if (!bots[telegramToken]) createBot(telegramToken, _id)
  })

  Object.keys(bots).forEach(telegramToken => {
    if (!tokens.some(t => t.telegramToken === telegramToken)) {
      bots[telegramToken].stopPolling()
      delete bots[telegramToken]
      console.log(`🛑 Bot to'xtatildi: ${telegramToken}`.red.bold)
    }
  })
}

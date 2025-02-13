import TelegramBot from 'node-telegram-bot-api'
import User from './models/userModel.js'

const bots = {} // Xotirada botlarni saqlash

// ✅ Bot yaratish va saqlash
const createBot = async (telegramToken, _id) => {
  if (bots[telegramToken]) {
    return bots[telegramToken] // Agar bot allaqachon mavjud bo‘lsa, qaytaramiz
  }

  const bot = new TelegramBot(telegramToken, { polling: true })

  bot.on('message', async msg => {
    const chatId = msg.chat.id
    const text = msg.text

    if (text === '/start') {
      await bot.sendMessage(chatId, 'Flowers platformasiga xush kelibsiz.')

      await bot.sendMessage(chatId, 'Buket zakat qilishdan oldin telefon raqamingizni jo‘nating:', {
        reply_markup: {
          keyboard: [[{ text: "📲 Kontaktni jo'natish", request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      })
    }

    if (msg.contact) {
      await bot.sendMessage(
        msg.chat.id,
        `✅ Raqamingiz qabul qilindi: ${msg.contact.phone_number}. Buketlarni ko'rish knopkasini bosib buket va gullarni ko'rishingiz mumkin`,
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Buketlarni ko'rish",
                  web_app: {
                    url: `https://4d06-213-230-116-47.ngrok-free.app/orders/${_id}`,
                  },
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
        const data = JSON.parse(msg.web_app_data?.data)

        await bot.sendMessage(
          chatId,
          "Zakazingiz qabul qilindi, siz zakaz bergan buketlar ro'yxati:"
        )

        for (item of data) {
          await bot.sendPhoto(chatId, item.image, { caption: `` })
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
  const tokens = await User.find({ role: 'client', telegramToken: { $exists: true } })
  tokens.forEach(({ telegramToken, _id }) => {
    if (!bots[telegramToken]) createBot(telegramToken, _id)
  })

  Object.keys(bots).forEach(telegramToken => {
    if (!tokens.find(t => t.telegramToken === telegramToken)) {
      bots[telegramToken].stopPolling()
      delete bots[telegramToken]
      console.log(`🛑 Bot to'xtatildi: ${telegramToken}`.red.bold)
    }
  })
}

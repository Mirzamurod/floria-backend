import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import User from './models/userModel.js'
import Customer from './models/customerModel.js'
import Order from './models/orderModel.js'
import languages from './languages/index.js'

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
    {
      command: '/start',
      description: `${languages['uz'].seebouquets}\n${languages['ru'].seebouquets}`,
    },
    { command: '/deleteorder', description: 'Zakazni bekor qilish\nОтмена заказа' },
    { command: '/userinfo', description: "Bot egasi haqida ma'lumot\nИнформация о владельце бота" },
    { command: '/cardinfo', description: "Karta haqida ma'lumot\nИнформация о карте" },
    { command: '/changelanguage', description: "Tilni o'zgartirish\nИзменить язык" },
  ])

  const web_app = lang => {
    return {
      reply_markup: {
        keyboard: [
          [
            {
              text: languages[lang].seebouquets,
              web_app: { url: `${process.env.FRONT_URL}${user._id}` },
            },
          ],
        ],
        resize_keyboard: true,
      },
    }
  }

  const locationKeyboard = lang => {
    return {
      reply_markup: {
        keyboard: [[{ text: languages[lang].sendlocation, request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
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
    const lang = customer?.lang ? customer?.lang : msg?.from?.language_code === 'ru' ? 'ru' : 'uz'

    if (text === '/start') {
      // await bot.sendMessage(chatId, `${botName.first_name} platformasiga xush kelibsiz.`)
      await bot.sendMessage(chatId, languages[lang].platform(botName.first_name))

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
            languages[lang].cancelledpayment(repaymentOrder.orderNumber)
          )

          await bot.sendMessage(chatId, languages[lang].warningpayment, imageKeyboard)
        } else await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))
      } else {
        await bot.sendMessage(chatId, languages[lang].askPhone, {
          reply_markup: {
            keyboard: [[{ text: languages[lang].sendContact, request_contact: true }]],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        })
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
              [{ text: languages[lang].none, callback_data: 'not_delete_order' }],
            ],
          },
        }
        await bot.sendMessage(chatId, languages[lang].whichorder, inlineKeyboard)
      } else {
        await bot.sendMessage(chatId, languages[lang].noorders)
      }
    }

    if (text === '/userinfo')
      await bot.sendMessage(chatId, languages[lang].namephone(userName, userPhone))

    if (text === '/cardinfo')
      await bot.sendMessage(chatId, languages[lang].cardnumber(card_number, card_name), {
        parse_mode: 'Markdown',
      })

    if (text === '/changelanguage')
      await bot.sendMessage(chatId, languages[lang].changelang, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🇺🇿 Uz', callback_data: `uz` },
              { text: '🇷🇺 Ru', callback_data: `ru` },
            ],
          ],
        },
      })

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

          await bot.sendMessage(chatId, languages[lang].sentpicture, imageKeyboard)

          if (repaymentOrder && telegramId) {
            let my_text = `${languages['uz'].repayment(repaymentOrder.orderNumber)}(${
              process.env.FRONT_URL
            }view/${repaymentOrder._id})%0A%0A${languages['ru'].repayment(
              repaymentOrder.orderNumber
            )}(${process.env.FRONT_URL}view/${repaymentOrder._id})`
            await axios.post(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
              chat_id: telegramId,
              photo: photoArray[2].file_id,
              caption: my_text,
              parse_mode: 'Markdown',
            })
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

          await bot.sendMessage(chatId, languages[lang].sentpicture)

          await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))

          if (existOrder && telegramId) {
            let my_text = `${languages['uz'].neworder}(${process.env.FRONT_URL}view/${existOrder._id})%0A%0A${languages['ru'].neworder}(${process.env.FRONT_URL}view/${existOrder._id})`
            await axios.post(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
              chat_id: telegramId,
              photo: photoArray[2].file_id,
              caption: my_text,
              parse_mode: 'Markdown',
            })
          }
        }
      }
    }

    if (msg.contact) {
      let phone_number = msg.contact.phone_number
      await Customer.create({
        chatId,
        userId: user._id,
        name: msg.contact.first_name,
        phone: phone_number.charAt(0) === '+' ? phone_number : `+${phone_number}`,
      })

      await bot.sendMessage(
        msg.chat.id,
        languages[lang].acceptedphone(msg.contact.first_name),
        web_app(lang)
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

          await bot.sendMessage(chatId, languages[lang].listorders(getOrder.orderNumber))

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

            await bot.sendMessage(
              chatId,
              `${languages[lang].custombouquet}:\n${data.join('')}\n${
                languages[lang].price
              }: ${getSum(sum)}`
            )
          }

          await bot.sendMessage(
            chatId,
            `**${languages[lang].totalbouquets}**:  ${
              getOrder?.bouquet?.qty + getOrder?.flower?.qty
            } ta\n**${languages[lang].totalprice}**: ${getSum(
              getOrder?.bouquet.price + getOrder?.flower?.price
            )}`,
            { parse_mode: 'Markdown' }
          )

          if (getOrder?.delivery === 'delivery') {
            await bot.sendMessage(chatId, languages[lang].sendaddress, locationKeyboard)
          } else if (getOrder?.delivery === 'takeaway') {
            if (getOrder.prepayment)
              await bot.sendMessage(chatId, languages[lang].payment(card_number, card_name), {
                ...imageKeyboard,
                parse_mode: 'Markdown',
              })
            else {
              await bot.sendMessage(chatId, languages[lang].acceptedorder)

              await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))

              if (getOrder && telegramId) {
                let my_text = `${languages['uz'].neworder}(${process.env.FRONT_URL}view/${getOrder._id})%0A%0A${languages['ru'].neworder}(${process.env.FRONT_URL}view/${getOrder._id})`
                await axios.post(
                  `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
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
            languages[lang].acceptedlocationsendpayment(card_number, card_name),
            { ...imageKeyboard, parse_mode: 'Markdown' }
          )
        } else {
          await bot.sendMessage(chatId, languages[lang].acceptedlocation)

          await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))

          if (existOrder && telegramId) {
            let my_text = `${languages['uz'].neworder}(${process.env.FRONT_URL}view/${existOrder._id})%0A%0A${languages['ru'].neworder}(${process.env.FRONT_URL}view/${existOrder._id})`
            await axios.post(
              `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
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
    const lang = customer.lang ? customer.lang : query.from.language_code === 'ru' ? 'ru' : 'uz'

    if (selectedOrder === 'uz' || selectedOrder === 'ru') {
      await Customer.findByIdAndUpdate(customer._id, { lang: selectedOrder })

      await bot.deleteMessage(chatId, messageId)

      await bot.sendMessage(
        chatId,
        `Siz ${
          selectedOrder === 'uz' ? "o'zbek" : 'rus'
        } tilini tanladingiz, /start ni bosib hamma joydan tilni o'zgartiring.\n\nВы выбрали ${
          selectedOrder === 'uz' ? 'узбекский' : 'русский'
        } язык, измените язык где угодно, нажав /start.`
      )
    } else if (selectedOrder.split('_')[0] === 'yes') {
      await bot.sendMessage(chatId, languages[lang].thanks)

      await bot.deleteMessage(chatId, messageId)

      await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))

      const updatedOrder = await Order.findByIdAndUpdate(
        selectedOrder.split('_')[1],
        { status: 'old' },
        { new: true }
      )

      if (updatedOrder && telegramId) {
        let my_text = `${languages['uz'].acceptedclientorder(
          updatedOrder.orderNumber
        )}%0A%0A${languages['ru'].acceptedclientorder(updatedOrder.orderNumber)}`
        await axios.post(
          `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=${my_text}&parse_mode=markdown`
        )
      }
    } else if (selectedOrder.split('_')[0] === 'no') {
      await bot.sendMessage(chatId, languages[lang].askseller(userName, userPhone))
    } else {
      if (selectedOrder !== 'not_delete_order') {
        const deletedOrder = await Order.findByIdAndUpdate(
          selectedOrder,
          { status: 'cancelled' },
          { new: true }
        )

        await bot.sendMessage(chatId, languages[lang].ordercancelled(deletedOrder.orderNumber))

        if (deletedOrder && telegramId) {
          let my_text = `${languages['uz'].cancelledorder(
            deletedOrder.orderNumber
          )}%0A%0A${languages['ru'].cancelledorder(deletedOrder.orderNumber)}`
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
                  { text: `💐 #No${item.orderNumber}`, callback_data: item._id },
                ]),
                [{ text: languages[lang].none, callback_data: 'not_delete_order' }],
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
        await bot.sendMessage(chatId, languages[lang].cancelledpayment(repaymentOrder.orderNumber))

        await bot.sendMessage(chatId, languages[lang].warningpayment, imageKeyboard)
      } else await bot.sendMessage(chatId, languages[lang].seebouquetsmore, web_app(lang))
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

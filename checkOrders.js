import { toZonedTime } from 'date-fns-tz'
import { addDays, addHours, startOfDay } from 'date-fns'
import cron from 'node-cron'
import axios from 'axios'
import Order from './models/orderModel.js'
import { bots } from './telegramBot.js'

// Oʻzbekiston vaqt zonasi
const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent'

// Statusni tekshiruvchi funksiya
async function checkAndUpdateStatus() {
  try {
    // Hozirgi sanani O'zbekiston vaqtida olish
    const now = new Date()
    const nowInUzbekistan = toZonedTime(now, UZBEKISTAN_TIMEZONE) // Oʻzbekiston sanasi (00:00)
    const nextDay = addDays(addHours(startOfDay(nowInUzbekistan), 3), 1)
    console.log(nowInUzbekistan.getDate())
    console.log(nextDay.getDate())

    // Statusi active va muddati o'tgan ma'lumotlarni olish
    const expiredOrders = await Order.find({
      status: 'new',
      date: { $lt: nextDay },
    }).populate([
      { path: 'customerId', model: 'Customer' },
      { path: 'userId', model: 'User' },
    ])

    if (expiredOrders.length) {
      expiredOrders.map(async order => {
        let text = ''
        console.log(order.userId.telegramToken)
        if (
          (order.prepayment && !order.prepaymentImage) ||
          (order.prepayment &&
            order.prepayment &&
            order.prepaymentNumber === 1 &&
            order.payment === 'cancelled')
        )
          text = "oldindan to'lov qilishingiz kerak bo'lgan."
        else if (order.delivery === 'delivery' && !order.location)
          text = "manzilingizni yuborishingiz kerak bo'lgan."

        if (text) {
          // Statusni cancelled qilish
          await Order.findByIdAndUpdate(order._id, { status: 'cancelled' })

          await bots[order.userId.telegramToken].sendMessage(
            order.customerId.chatId,
            `Sizning #No${order.orderNumber} raqamli zakazing bekor qilindi, sababi ${text}`
          )

          if (order.userId.telegramId) {
            let my_text = `\`${order.orderNumber}\` raqamli zakaz bekor qilindi.`
            await axios.post(
              `https://api.telegram.org/bot${order.userId.telegramToken}/sendMessage?chat_id=${order.userId.telegramId}&text=${my_text}&parse_mode=markdown`
            )
          }
        } else {
          await bots[order.userId.telegramToken].sendMessage(
            order.customerId.chatId,
            `Siz #No${order.orderNumber} raqamli zakazingizni oldingizmi?`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Ha', callback_data: `yes_${order._id}` },
                    { text: "Yo'q", callback_data: `no_${order._id}` },
                  ],
                ],
              },
            }
          )

          await Order.findByIdAndUpdate(order._id, { status: 'unsubmitted' })

          if (order.userId.telegramId) {
            let my_text = `\`${order.orderNumber}\` raqamli zakaz tayyor bo'lish sanasidan o'tib ketdi.`
            await axios.post(
              `https://api.telegram.org/bot${order.userId.telegramToken}/sendMessage?chat_id=${order.userId.telegramId}&text=${my_text}&parse_mode=markdown`
            )
          }
        }
      })
      // Statusni cancelled qilish
      // await Order.updateMany(
      //   { _id: { $in: expiredOrders.map(order => order._id) } },
      //   { $set: { status: 'cancelled' } }
      // )
      console.log(`Updated ${expiredOrders.length} orders to 'cancelled'.`)
    }
  } catch (error) {
    console.error('Error updating order statuses:', error)
  }
}

// Har 1 soatda tekshirish uchun cron job
export const checkOrders = async () =>
  cron.schedule('0 * * * * *', () => {
    console.log('Checking for expired orders...')
    checkAndUpdateStatus()
  })

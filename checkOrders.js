import { fromZonedTime } from 'date-fns-tz'
import cron from 'node-cron'
import axios from 'axios'
import Order from './models/orderModel.js'
import User from './models/userModel.js'
import { bots } from './telegramBot.js'
import { addDays, format } from 'date-fns'
import languages from './languages/index.js'

// Oʻzbekiston vaqt zonasi
const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent'

// Statusni tekshiruvchi funksiya
async function checkAndUpdateStatus() {
  try {
    // Hozirgi sanani O'zbekiston vaqtida olish
    const now = new Date()
    const nowInUzb = fromZonedTime(now, UZBEKISTAN_TIMEZONE) // Oʻzbekiston sanasi (00:00)

    const paidUsers = await User.find({
      block: false,
      role: 'client',
      date: { $gte: nowInUzb, $lt: addDays(nowInUzb, 1) },
      plan: { $in: ['week', 'month'] },
    })
    const expiredUsers = await User.find({
      block: false,
      role: 'client',
      date: { $lt: nowInUzb },
      plan: { $in: ['week', 'month'] },
    })
    const expiredOrders = await Order.find({ status: 'new', date: { $lt: nowInUzb } }).populate([
      { path: 'customerId', model: 'Customer' },
      { path: 'userId', model: 'User' },
    ])

    if (paidUsers.length) {
      paidUsers.map(async user => {
        if (user.telegramToken && user.telegramId) {
          let my_text = `${languages['uz'].paymentreminder(
            format(addDays(nowInUzb, 1), 'dd.MM.yyyy')
          )}%0A%0A${languages['ru'].paymentreminder(format(addDays(nowInUzb, 1), 'dd.MM.yyyy'))}`
          await axios.post(
            `https://api.telegram.org/bot${user.telegramToken}/sendMessage?chat_id=${user.telegramId}&text=${my_text}`
          )
        }
      })
    }

    if (expiredUsers.length) {
      await User.updateMany(
        { _id: { $in: expiredUsers.map(user => user._id) } },
        { $set: { block: true, plan: '' } }
      )

      expiredUsers.map(async user => {
        if (user.telegramToken && user.telegramId) {
          let my_text = `${languages['uz'].blockedbot}%0A%0A${languages['ru'].blockedbot}`
          await axios.post(
            `https://api.telegram.org/bot${user.telegramToken}/sendMessage?chat_id=${user.telegramId}&text=${my_text}`
          )
        }
      })
    }

    if (expiredOrders.length) {
      expiredOrders.map(async order => {
        let text = ''
        if (
          (order.prepayment && !order.prepaymentImage) ||
          (order.prepayment &&
            order.prepayment &&
            order.prepaymentNumber === 1 &&
            order.payment === 'cancelled')
        )
          text = 1
        else if (order.delivery === 'delivery' && !order.location) text = 2

        if (text) {
          // Statusni cancelled qilish
          await Order.findByIdAndUpdate(order._id, { status: 'cancelled' })

          await bots[order.userId.telegramToken].sendMessage(
            order.customerId.chatId,
            languages[order.customerId.lang].reasoncancelled
          )

          if (order.userId.telegramId) {
            let my_text = `${languages['uz'].cancelledorder(order.orderNumber)}%0A%0A${languages[
              'ru'
            ].cancelledorder(order.orderNumber)}`
            await axios.post(
              `https://api.telegram.org/bot${order.userId.telegramToken}/sendMessage?chat_id=${order.userId.telegramId}&text=${my_text}&parse_mode=markdown`
            )
          }
        } else {
          await bots[order.userId.telegramToken].sendMessage(
            order.customerId.chatId,
            languages[order.customerId.lang].receiveorder(order.orderNumber),
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: languages[order.customerId.lang].yes,
                      callback_data: `yes_${order._id}`,
                    },
                    { text: languages[order.customerId.lang].no, callback_data: `no_${order._id}` },
                  ],
                ],
              },
            }
          )

          await Order.findByIdAndUpdate(order._id, { status: 'unsubmitted' })

          if (order.userId.telegramId) {
            let my_text = `${languages['uz'].pastduedate(order.orderNumber)}%0A%0A${languages[
              'ru'
            ].pastduedate(order.orderNumber)}`
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
  cron.schedule('0 3 * * *', () => {
    // cron.schedule('0 * * * * *', () => {
    console.log('Checking for expired orders...')
    checkAndUpdateStatus()
  })

import { addWeeks } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { model, Schema } from 'mongoose'

const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent'

const userSchema = new Schema(
  {
    email: { type: String, require: true, unique: true },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: ['admin', 'client'], default: 'client' },
    block: { type: Boolean, default: false },
    telegramToken: { type: String },
    telegramId: { type: String },
    location: { type: String },
    card_number: { type: String },
    card_name: { type: String },
    userName: { type: String },
    userPhone: { type: String },
    plan: { type: String, enum: ['week', 'month', 'vip'], default: 'week' },
    date: { type: Date, default: addWeeks(toZonedTime(new Date(), UZBEKISTAN_TIMEZONE), 2) },
  },
  { timestamps: true }
)

export default model('User', userSchema)

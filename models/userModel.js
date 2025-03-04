import { model, Schema } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, require: true, unique: true },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: ['admin', 'client'], default: 'client' },
    block: { type: Boolean, default: true },
    telegramToken: { type: String },
    telegramId: { type: String },
    location: { type: String },
    card_number: { type: String },
    card_name: { type: String },
  },
  { timestamps: true }
)

export default model('User', userSchema)

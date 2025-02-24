import { model, Schema } from 'mongoose'

const customerSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String, require: true },
    chatId: { type: String, require: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
  },
  { timestamps: true }
)

export default model('Customer', customerSchema)

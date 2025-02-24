import { model, Schema } from 'mongoose'

const categorySchema = new Schema(
  {
    name: { type: String, require: true },
    block: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
  },
  { timestamps: true }
)

export default model('Category', categorySchema)

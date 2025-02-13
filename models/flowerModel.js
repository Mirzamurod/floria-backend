import { model, Schema } from 'mongoose'

const flowerSchema = new Schema(
  {
    image: { type: String, require: true },
    price: { type: String, require: true },
    name: { type: String, require: true },
    block: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default model('Flower', flowerSchema)

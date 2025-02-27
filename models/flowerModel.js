import { model, Schema } from 'mongoose'

const flowerSchema = new Schema(
  {
    image: { type: String, require: true },
    price: { type: String, require: true },
    name: { type: String, require: true },
    block: { type: Boolean, default: false },
    category: { type: Schema.Types.ObjectId, require: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
  },
  { timestamps: true }
)

export default model('Flower', flowerSchema)

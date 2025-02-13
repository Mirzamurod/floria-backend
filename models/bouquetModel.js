import { model, Schema } from 'mongoose'

const bouquetSchema = new Schema(
  {
    image: { type: String, require: true },
    price: { type: String, require: true },
    name: { type: String },
    info: { type: String },
    block: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default model('Bouquet', bouquetSchema)

import { model, Schema } from 'mongoose'

const orderSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String, require: true },
    bouquets: [
      {
        bouquetId: { type: Schema.Types.ObjectId, ref: 'Bouquet', require: true },
        qty: { type: Number, require: true },
        price: { type: Number, require: true },
      },
    ],
    flowers: [
      {
        flowerId: { type: Schema.Types.ObjectId, ref: 'Flower', require: true },
        qty: { type: Number, require: true },
        price: { type: Number, require: true },
      },
    ],
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
  },
  { timestamps: true }
)

export default model('Order', orderSchema)

import { model, Schema } from 'mongoose'

const orderSchema = new Schema(
  {
    orderNumber: {
      type: Number,
      require: true,
      default: Math.floor(100000 + Math.random() * 900000),
    },
    bouquet: {
      bouquets: [
        {
          bouquetId: { type: Schema.Types.ObjectId, ref: 'Bouquet', require: true },
          qty: { type: Number, require: true },
          price: { type: Number, require: true },
        },
      ],
      qty: { type: Number, require: true },
      price: { type: Number, require: true },
    },
    flower: {
      flowers: [
        {
          flowerId: { type: Schema.Types.ObjectId, ref: 'Flower', require: true },
          qty: { type: Number, require: true },
          price: { type: Number, require: true },
        },
      ],
      qty: { type: Number, require: true },
      price: { type: Number, require: true },
    },
    status: { type: String, enum: ['new', 'old'], default: 'new' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', require: true },
  },
  { timestamps: true }
)

export default model('Order', orderSchema)

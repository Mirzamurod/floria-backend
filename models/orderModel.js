import { model, Schema } from 'mongoose'

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, require: true },
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
    date: { type: Date, require: true },
    prepayment: { type: Boolean, default: false },
    prepaymentImage: { type: String, default: false },
    delivery: { type: String, enum: ['delivery', 'takeaway'], default: 'takeaway' },
    status: { type: String, enum: ['new', 'old'], default: 'new' },
    location: { longitude: { type: Number }, latitude: { type: Number } },
    userId: { type: Schema.Types.ObjectId, ref: 'User', require: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', require: true },
  },
  { timestamps: true }
)

export default model('Order', orderSchema)

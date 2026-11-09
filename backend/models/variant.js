const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  colour: {
    type: String,
    required: [true, 'Colour name is required'],
    trim: true,
  },
  colourHex: {
    type: String,
    required: true,
    default: '#000000',
  },
  inventory: [
    {
      size: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 0, min: 0 }
    }
  ],
  images: [{ type: String }]
}, { timestamps: true })

module.exports = mongoose.model('Variant', variantSchema, 'variant')
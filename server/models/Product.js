const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  mainImageUrl: String,
  secondaryImageUrls: [String],
  specifications: String,
  technical_sheet: {
    file_name: String,
    url: String,
  },
  manuals: [
    {
      file_name: String,
      url: String,
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

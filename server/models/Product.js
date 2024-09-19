const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
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
  additional_info: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
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
  category: String,
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

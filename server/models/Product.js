const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String },
  brand: { type: String },
  specifications: String,
  mainImageUrl: String,
  secondaryImageUrls: [String],
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
});

module.exports = mongoose.model('Product', productSchema);

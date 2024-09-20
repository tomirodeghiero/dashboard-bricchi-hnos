const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  isMainCategory: {
    type: Boolean,
    default: true,
  },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

const mongoose = require('mongoose');

// Sub-subcategoría
const subSubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Subcategoría
const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subSubCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubSubCategory',
  }],
});

// Categoría principal
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  }],
  isMainCategory: {
    type: Boolean,
    default: true,
  },
});

const SubSubCategory = mongoose.model('SubSubCategory', subSubCategorySchema);
const SubCategory = mongoose.model('SubCategory', subCategorySchema);
const Category = mongoose.model('Category', categorySchema);

module.exports = { Category, SubCategory, SubSubCategory };

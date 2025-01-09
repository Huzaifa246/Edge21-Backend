const mongoose = require('mongoose');

const paraDetailsSchema = mongoose.Schema(
  {
    heading1: { type: String, required: true },
    para1: { type: String, required: true },
    heading2: { type: String, required: true },
    para2: { type: String, required: true },
    heading3: { type: String },
    para3: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('paraDetails', paraDetailsSchema);

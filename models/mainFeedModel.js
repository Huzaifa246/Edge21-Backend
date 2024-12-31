const mongoose = require('mongoose');

const mainFeedDetailsSchema = mongoose.Schema(
  {
    metatitle: { type: String, required: true },
    metadescription: { type: String, required: true },
    tags: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('feedDetails', mainFeedDetailsSchema);

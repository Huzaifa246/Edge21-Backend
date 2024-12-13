const mongoose = require('mongoose');

const btcSchema = new mongoose.Schema({
    Date: { type: String },
    Price: { type: String },
    percent_change_24h: { type: Number },
    percent_change_7d: { type: Number },
    percent_change_30d: { type: Number },
    change24hInUsd: { type: String },
    averagePrice7d: { type: String },
    averagePrice30d: { type: String },
    difference7d: { type: String },
    difference30d: { type: String },
});

module.exports = mongoose.model('BtcData', btcSchema);
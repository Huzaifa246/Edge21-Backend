const express = require('express');
const { fetchAndStoreBTCData, getBTCStoreData } = require('../controllers/btcStoreController');

const router = express.Router();

// Route to fetch and store BTC data
router.post('/BtcStore', fetchAndStoreBTCData);

// Route to retrieve stored BTC data
router.get('/getBtcStoreFetch', getBTCStoreData);

module.exports = router;

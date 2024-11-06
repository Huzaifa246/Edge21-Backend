const express = require('express');
const router = express.Router();
const btcController = require('../controllers/btcController');

router.get('/', btcController.getBTCData);

module.exports = router;

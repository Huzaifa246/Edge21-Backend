const express = require('express');
const { storeData, fetchDataByDate, deleteData, updateOrAddDataByDate, testBinance } = require('../controllers/mainFeedController');
const router = express.Router();

router.get('/test-binance', testBinance);
router.post('/storeFeedDetails', storeData);

router.get('/fetchFeedByDate/:date', fetchDataByDate); 
router.put('/updateFeedByDate/:date', updateOrAddDataByDate);

router.delete('/delete-Para-Details/:id', deleteData);

module.exports = router;

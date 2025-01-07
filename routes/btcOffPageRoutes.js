const express = require('express');
const { storeData, fetchDataByDate, deleteData, updateOrAddDataByDate } = require('../controllers/btcPriceOPageController');
const router = express.Router();

router.post('/storeBtcPriceDetails', storeData);

router.get('/fetchBtcPriceByDate/:date', fetchDataByDate); 
router.put('/updateBtcPriceByDate/:date', updateOrAddDataByDate);

router.delete('/delete-BtcPrice-Details/:id', deleteData);

module.exports = router;
const express = require('express');
const { storeData, fetchDataByDate, deleteData, updateOrAddDataByDate } = require('../controllers/mainFeedController');
const router = express.Router();

router.get('/test-binance', async (req, res) => {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
            params: { symbol: 'BTCUSDT' },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch Binance data', error: error.message });
    }
});
// Route to store data
router.post('/storeFeedDetails', storeData);

router.get('/fetchFeedByDate/:date', fetchDataByDate); 
router.put('/updateFeedByDate/:date', updateOrAddDataByDate);

router.delete('/delete-Para-Details/:id', deleteData);

module.exports = router;

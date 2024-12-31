const express = require('express');
const { storeData, fetchDataByDate, updateData, deleteData, updateOrAddDataByDate } = require('../controllers/mainFeedController');
const router = express.Router();

// Route to store data
router.post('/storeFeedDetails', storeData);

router.get('/fetchFeedByDate/:date', fetchDataByDate); 
router.put('/updateFeedByDate/:date', updateOrAddDataByDate);
router.put('/update-Para-Details/:id', updateData);

router.delete('/delete-Para-Details/:id', deleteData);

module.exports = router;

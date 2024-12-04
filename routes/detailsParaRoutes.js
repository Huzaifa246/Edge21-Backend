const express = require('express');
const { storeData, fetchFilteredData,fetchDataByDate, updateData, deleteData } = require('../controllers/detailsParaController');
const router = express.Router();

// Route to store data
router.post('/storeParaDetails', storeData);

router.get('/fetch-Para-Details', fetchFilteredData);
router.get('/fetchDataByDate/:date', fetchDataByDate); 

router.put('/update-Para-Details/:id', updateData);

router.delete('/delete-Para-Details/:id', deleteData);

module.exports = router;

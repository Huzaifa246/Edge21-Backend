const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const btcRoutes = require('./routes/btcRoutes');
const btcStoreRoutes = require('./routes/btcStoreRoutes');
const detailsParaRoutes = require('./routes/detailsParaRoutes');
const feedRoutes = require('./routes/mainFeedRoutes');
const btcOffRoutes = require('./routes/btcOffPageRoutes');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/btc-data', btcRoutes);
app.use('/api/btc-store', btcStoreRoutes);
app.use('/api/data', detailsParaRoutes);
app.use('/api/data', feedRoutes);
app.use('/api/data', btcOffRoutes);

cron.schedule('0 * * * *', async () => {
    console.log('Running 1-minute update for Bitcoin data...');
    try {
        const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

        // Call the API to update Bitcoin price by date
        const btcPriceUpdateResponse = await axios.put(
            `https://edge21-backend.vercel.app/api/data/updateBtcPriceByDate/${currentDate}`
        );

        console.log('Bitcoin Price Update Response:', btcPriceUpdateResponse.data);

        // Call the API to update Feed by date (if needed)
        const feedUpdateResponse = await axios.put(
            `https://edge21-backend.vercel.app/api/data/updateFeedByDate/${currentDate}`
        );

        console.log('Feed Update Response:', feedUpdateResponse.data);
    } catch (error) {
        console.error('Error during 1-minute update:', error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const btcRoutes = require('./routes/btcRoutes');
const btcStoreRoutes = require('./routes/btcStoreRoutes');
const detailsParaRoutes = require('./routes/detailsParaRoutes');
const feedRoutes = require('./routes/mainFeedRoutes');
const connectDB = require('./config/db');
const { fetchLatestBitcoinDataAndUpdate } = require('./controllers/mainFeedController');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/btc-data', btcRoutes);
app.use('/api/btc-store', btcStoreRoutes);
app.use('/api/data', detailsParaRoutes);
app.use('/api/data', feedRoutes);

cron.schedule('0 * * * *', async () => {
    console.log('Running hourly update for Bitcoin data...');
    try {
        // Calculate start and end of the current day
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        
        // Fetch and update Bitcoin data
        const result = await fetchLatestBitcoinDataAndUpdate(startOfDay, endOfDay);
        console.log('Cron Job: Successfully updated Bitcoin data:', result);
    } catch (error) {
        console.error('Error during hourly update:', error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

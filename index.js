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
// cron.schedule('*/1 * * * *', async () => {
    console.log('Running hourly update for Bitcoin data...');
    try {
        await fetchLatestBitcoinDataAndUpdate();
    } catch (error) {
        console.error('Error during hourly update:', error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

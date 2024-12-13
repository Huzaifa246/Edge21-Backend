const express = require('express');
const cors = require('cors');
require('dotenv').config();
const btcRoutes = require('./routes/btcRoutes');
const btcStoreRoutes = require('./routes/btcStoreRoutes');
const detailsParaRoutes = require('./routes/detailsParaRoutes');
const connectDB = require('./config/db'); 

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/btc-data', btcRoutes);
app.use('/api/btc-store', btcStoreRoutes);
app.use('/api/data', detailsParaRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

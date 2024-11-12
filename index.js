const express = require('express');
const cors = require('cors');
require('dotenv').config();
const btcRoutes = require('./routes/btcRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use('/api/btc-data', btcRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

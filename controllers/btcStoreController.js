const axios = require('axios');
const BtcData = require('../models/btcStoreModel');

exports.fetchAndStoreBTCData = async (req, res) => {
    try {
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        console.log('Time Start:', oneMonthAgo.toISOString());
        console.log('Time End:', now.toISOString());

        // Fetch 1-month BTC data from CoinMarketCap API
        const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical', {
            params: {
                symbol: 'BTC',
                time_start: oneMonthAgo.toISOString(),
                time_end: now.toISOString(),
                interval: 'daily',
            },
            headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
        });

        console.log('Full API Response:', JSON.stringify(response.data, null, 2));

        // Extract the BTC data for the main Bitcoin cryptocurrency
        const bitcoinEntry = response?.data?.data?.BTC?.find((entry) => entry.name === 'Bitcoin');

        if (!bitcoinEntry || !bitcoinEntry.quotes) {
            console.error('No BTC data found for Bitcoin.');
            return res.status(404).json({ error: 'No BTC data found for the specified time frame.' });
        }

        const quotes = bitcoinEntry.quotes;

        console.log('Bitcoin Quotes:', quotes);

        // Format data for MongoDB
        const formattedData = quotes.map((quote, index) => {
            const price = parseFloat(quote.quote.USD.price.toFixed(2));
            const percentChange24h = parseFloat(quote.quote.USD.percent_change_24h.toFixed(2));
            const change24hInUsd = (price * (percentChange24h / 100)).toFixed(2);

            // Extract past 7 days and 30 days prices for calculations
            const past7dPrices = quotes
                .slice(Math.max(0, index - 6), index + 1)
                .map((data) => data.quote.USD.price);
            const past30dPrices = quotes
                .slice(Math.max(0, index - 29), index + 1)
                .map((data) => data.quote.USD.price);

            const averagePrice7d =
                past7dPrices.length > 0
                    ? (past7dPrices.reduce((sum, p) => sum + p, 0) / past7dPrices.length).toFixed(2)
                    : null;

            const averagePrice30d =
                past30dPrices.length > 0
                    ? (past30dPrices.reduce((sum, p) => sum + p, 0) / past30dPrices.length).toFixed(2)
                    : null;

            const difference7d =
                past7dPrices.length > 0 ? (price - past7dPrices[0]).toFixed(2) : null;

            const difference30d =
                past30dPrices.length > 0 ? (price - past30dPrices[0]).toFixed(2) : null;

            return {
                Date: quote.timestamp.split('T')[0],
                Price: price,
                percent_change_24h: percentChange24h,
                change24hInUsd: change24hInUsd,
                averagePrice7d: averagePrice7d,
                averagePrice30d: averagePrice30d,
                difference7d: difference7d,
                difference30d: difference30d,
            };
        });

        console.log('Formatted Data:', formattedData);

        // Insert formatted data into MongoDB
        try {
            const result = await BtcData.insertMany(formattedData);
            console.log('Inserted Data:', result);
            res.status(200).json({ message: 'BTC data fetched and stored successfully!', data: formattedData });
        } catch (err) {
            console.error('Insert Error:', err.message);
            res.status(500).json({ error: 'Failed to insert data into the database.' });
        }
    } catch (error) {
        console.error('Error fetching or storing BTC data:', error.message);
        res.status(500).json({ error: error.message });
    }
};

//One Year Data
// exports.fetchAndStoreBTCData = async (req, res) => {
//     try {
//         const now = new Date();
//         const oneYearAgo = new Date();
//         oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

//         console.log('Fetching data from:', oneYearAgo.toISOString(), 'to', now.toISOString());

//         // Define chunking interval (e.g., 1 month)
//         const chunks = [];
//         let currentStart = new Date(oneYearAgo);
//         while (currentStart < now) {
//             const currentEnd = new Date(currentStart);
//             currentEnd.setMonth(currentEnd.getMonth() + 1);
//             if (currentEnd > now) {
//                 currentEnd.setTime(now.getTime());
//             }
//             chunks.push({ start: new Date(currentStart), end: new Date(currentEnd) });
//             currentStart.setMonth(currentStart.getMonth() + 1);
//         }

//         console.log('Date Chunks:', chunks);

//         let allQuotes = [];

//         // Fetch data for each chunk
//         for (const chunk of chunks) {
//             const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical', {
//                 params: {
//                     symbol: 'BTC',
//                     time_start: chunk.start.toISOString(),
//                     time_end: chunk.end.toISOString(),
//                     interval: 'daily',
//                 },
//                 headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
//             });

//             console.log(`Fetched data for chunk: ${chunk.start.toISOString()} - ${chunk.end.toISOString()}`);

//             // Extract data for Bitcoin
//             const bitcoinEntry = response?.data?.data?.BTC?.find((entry) => entry.name === 'Bitcoin');
//             if (!bitcoinEntry || !bitcoinEntry.quotes) {
//                 console.error(`No data found for chunk: ${chunk.start.toISOString()} - ${chunk.end.toISOString()}`);
//                 continue;
//             }
//             allQuotes = allQuotes.concat(bitcoinEntry.quotes);
//         }

//         console.log('Total Quotes Fetched:', allQuotes.length);

//         // Format the combined data for MongoDB
//         const formattedData = allQuotes.map((quote, index) => {
//             const price = parseFloat(quote.quote.USD.price.toFixed(2));
//             const percentChange24h = parseFloat(quote.quote.USD.percent_change_24h.toFixed(2));
//             const change24hInUsd = (price * (percentChange24h / 100)).toFixed(2);

//             // Extract past 7 days and 30 days prices for calculations
//             const past7dPrices = allQuotes
//                 .slice(Math.max(0, index - 6), index + 1)
//                 .map((data) => data.quote.USD.price);
//             const past30dPrices = allQuotes
//                 .slice(Math.max(0, index - 29), index + 1)
//                 .map((data) => data.quote.USD.price);

//             const averagePrice7d =
//                 past7dPrices.length > 0
//                     ? (past7dPrices.reduce((sum, p) => sum + p, 0) / past7dPrices.length).toFixed(2)
//                     : 0;

//             const averagePrice30d =
//                 past30dPrices.length > 0
//                     ? (past30dPrices.reduce((sum, p) => sum + p, 0) / past30dPrices.length).toFixed(2)
//                     : 0;

//             const difference7d =
//                 past7dPrices.length > 0 ? (price - past7dPrices[0]).toFixed(2) : 0;

//             const difference30d =
//                 past30dPrices.length > 0 ? (price - past30dPrices[0]).toFixed(2) : 0;

//             return {
//                 Date: quote.timestamp.split('T')[0],
//                 Price: price,
//                 percent_change_24h: percentChange24h,
//                 change24hInUsd: change24hInUsd,
//                 averagePrice7d: averagePrice7d,
//                 averagePrice30d: averagePrice30d,
//                 difference7d: difference7d,
//                 difference30d: difference30d,
//             };
//         });

//         console.log('Formatted Data:', formattedData);

//         // Insert formatted data into MongoDB
//         try {
//             const result = await BtcData.insertMany(formattedData);
//             console.log('Inserted Data:', result);
//             res.status(200).json({ message: '1Y BTC data fetched and stored successfully!', data: formattedData });
//         } catch (err) {
//             console.error('Insert Error:', err.message);
//             res.status(500).json({ error: 'Failed to insert data into the database.' });
//         }
//     } catch (error) {
//         console.error('Error fetching or storing BTC data:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// };

// Retrieve BTC data from MongoDB
exports.getBTCStoreData = async (req, res) => {
    try {
        const data = await BtcData.find().sort({ Date: -1 });
        console.log(data, "testing")
        res.status(200).json(data);
    } catch (error) {
        console.error('Error retrieving BTC data:', error.message);
        res.status(500).json({ error: error.message });
    }
};

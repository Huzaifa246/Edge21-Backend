const { getExchangeRate } = require('../services/exchangeRateService');
const { getUserCountryCode } = require('../services/geolocationService');
const { getCurrencyFromCountry } = require('../utils/currencyUtils');
const axios = require('axios');

exports.getBTCData = async (req, res) => {
    try {
        const { timeFrame, time_start, time_end, interval: queryInterval } = req.query;

        const now = new Date();
        let timeStart, timeEnd, interval;

        if (time_start && time_end) {
            timeStart = new Date(time_start).toISOString();
            timeEnd = new Date(time_end).toISOString();
            interval = queryInterval || "daily";
        }
        else {
            timeEnd = now.toISOString();
            switch (timeFrame) {
                case '1D':
                    timeStart = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'hourly';
                    break;
                case '7D':
                    timeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'daily';
                    break;
                case '1M':
                    timeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'daily';
                    break;
                case '3M':
                    timeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'daily';
                    break;
                case '1Y':
                    timeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'daily';
                    break;
                case 'YTD':
                    timeStart = new Date(now.getFullYear(), 0, 1).toISOString();
                    interval = 'daily';
                    break;
                default:
                    timeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
                    interval = 'daily';
                    break;
            }
        }
        // Get user country code and determine currency
        const countryCode = await getUserCountryCode();
        const currencyCode = getCurrencyFromCountry(countryCode);

        // Fetch exchange rate
        const exchangeRate = await getExchangeRate(currencyCode);

        // Fetch BTC data
        const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical', {
            params: {
                symbol: 'BTC',
                time_start: timeStart,
                time_end: timeEnd,
                interval: interval,
            },
            headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
        });

        const bitcoinData = response.data.data.BTC.find(coin => coin.name === "Bitcoin");
        if (!bitcoinData) {
            return res.status(404).json({ error: "Bitcoin data not found" });
        }
        const rawPrices = bitcoinData.quotes.map(quote => parseFloat(quote.quote.USD.price));
        const latestPrice = rawPrices[rawPrices.length - 1];

        // Calculate the average price for the past 7 days
        const past7dPrices = rawPrices.slice(-7);

        const price7dOldest = past7dPrices.length > 0 ? past7dPrices[0] : null;

        const averagePrice7d = price7dOldest.length > 0
            ? (past7dPrices.reduce((sum, price) => sum + price, 0) / past7dPrices.length).toFixed(2)
            : null;

        // Calculate the average price for the past 30 days
        const past30dPrices = rawPrices.slice(-30);
        const price30dOldest = past30dPrices.length > 0 ? past30dPrices[0] : null;

        const averagePrice30d = past30dPrices.length > 0
            ? (past30dPrices.reduce((sum, price) => sum + price, 0) / past30dPrices.length).toFixed(2)
            : null;

        // Calculate dollar differences
        const difference7d = price7dOldest
            ? ((latestPrice - price7dOldest) >= 0
                ? `${(latestPrice - price7dOldest).toFixed(2)}`
                : `${(latestPrice - price7dOldest).toFixed(2)}`)
            : null;

        const difference30d = price30dOldest
            ? ((latestPrice - price30dOldest) >= 0
                ? `${(latestPrice - price30dOldest).toFixed(2)}`
                : `${(latestPrice - price30dOldest).toFixed(2)}`)
            : null;

        // Format data with conversion to local currency
        const formattedData = bitcoinData.quotes.map(quoteEntry => {
            const priceInCurrency = (quoteEntry.quote.USD.price * exchangeRate).toFixed(2);
            const percentChange24h = parseFloat(quoteEntry.quote.USD.percent_change_24h);

            // Calculate the 24-hour change in USD
            const change24hInUsd = (priceInCurrency * (percentChange24h / 100)).toFixed(2);

            return {
                timestamp: quoteEntry.timestamp,
                price: priceInCurrency,
                percent_change_1h: (quoteEntry.quote.USD.percent_change_1h).toFixed(2),
                percent_change_24h: percentChange24h.toFixed(2),
                percent_change_7d: (quoteEntry.quote.USD.percent_change_7d).toFixed(2),
                percent_change_30d: (quoteEntry.quote.USD.percent_change_30d).toFixed(2),
                market_cap: (quoteEntry.quote.USD.market_cap * exchangeRate).toFixed(2),
                volume_24h: (quoteEntry.quote.USD.volume_24h * exchangeRate).toFixed(2),
                currency: currencyCode,
                change_24h_in_usd: change24hInUsd,
                latestPrice: latestPrice.toFixed(2),
                averagePrice7d,
                averagePrice30d,
                difference7d,
                difference30d,
            };
        });
        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching BTC data:", error.message);
        res.status(500).json({ error: error.message });
    }
};
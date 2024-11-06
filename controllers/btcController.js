const { getExchangeRate } = require('../services/exchangeRateService');
const { getUserCountryCode } = require('../services/geolocationService');
const { getCurrencyFromCountry } = require('../utils/currencyUtils');
const axios = require('axios');

exports.getBTCData = async (req, res) => {
    try {
        const { timeFrame } = req.query;
        const now = new Date();
        let timeStart;
        let interval;

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
                time_end: now.toISOString(),
                interval: interval,
            },
            headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
        });

        const bitcoinData = response.data.data.BTC.find(coin => coin.name === "Bitcoin");
        if (!bitcoinData) {
            return res.status(404).json({ error: "Bitcoin data not found" });
        }

        // Format data with conversion to local currency
        const formattedData = bitcoinData.quotes.map(quoteEntry => {
            const priceInCurrency = (quoteEntry.quote.USD.price * exchangeRate).toFixed(2);
            const percentChange24h = parseFloat(quoteEntry.quote.USD.percent_change_24h);

            // Calculate the 24-hour change in USD
            const change24hInUsd = ((percentChange24h / 100)).toFixed(2);

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
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching BTC data:", error.message);
        res.status(500).json({ error: error.message });
    }
};

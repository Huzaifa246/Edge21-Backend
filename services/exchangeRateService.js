const axios = require('axios');

exports.getExchangeRate = async (toCurrency) => {
    if (toCurrency === 'USD') return 1;

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
    const rate = response.data.rates[toCurrency];
    if (!rate) throw new Error(`Exchange rate for ${toCurrency} not found`);
    return rate;
};

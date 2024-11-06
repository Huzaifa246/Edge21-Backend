const getCurrencyFromCountry = (countryCode) => {
    const currencyMap = {
        'US': 'USD', 'EU': 'EUR', 'GB': 'GBP', 'AU': 'AUD', 'JP': 'JPY',
        'CA': 'CAD', 'CH': 'CHF',
    };
    return currencyMap[countryCode] || 'USD';
};

module.exports = { getCurrencyFromCountry };

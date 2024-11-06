const axios = require('axios');

exports.getUserCountryCode = async () => {
    const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEO_API_KEY}`);
    return response.data.country_code2;
};

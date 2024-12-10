const axios = require('axios');

let lastCountryCode;
exports.getUserCountryCode = async () => {
    try {
    const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEO_API_KEY}`);
    lastCountryCode = response.data.country_code2;
    return lastCountryCode;
    }
    catch (error) {
        console.error("Error fetching geolocation data:", error.message);
        if (lastCountryCode) {
            console.warn("Using last known country code:", lastCountryCode);
            return lastCountryCode;
        }
        return "US";
    }
};

const formatLargeNumber = (num) => {
    if (num >= 1e12) {
        return (num / 1e12).toFixed(0) + ' Trillion';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(0) + ' Billion';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(0) + ' Million';
    }
    return num.toFixed(0); // Return the original number if it's less than 1 million
};
const convertToLocalTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
};

module.exports = { formatLargeNumber, convertToLocalTime };
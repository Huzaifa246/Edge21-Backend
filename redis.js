const { createClient } = require('redis');

// Use the Redis URL from your environment variables
const redis = createClient({
    url: process.env.REDIS_URL,
});

redis.on('connect', () => {
    console.log('Connected to Redis successfully!');
});

redis.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

// Connect to Redis
(async () => {
    try {
        await redis.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redis;

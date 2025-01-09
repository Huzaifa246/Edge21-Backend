import axios from 'axios';
import redis from './redis'; // Import the Redis connection

export default async function handler(req, res) {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const cacheKey = `btc_price_feed_${currentDate}`;

    try {
        // Check if the data is in Redis
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached data from Redis');
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Call the first PUT API
        const btcPriceUpdateResponse = await axios.put(
            `https://edge21-backend.vercel.app/api/data/updateBtcPriceByDate/${currentDate}`
        );

        // Call the second PUT API
        const feedUpdateResponse = await axios.put(
            `https://edge21-backend.vercel.app/api/data/updateFeedByDate/${currentDate}`
        );

        console.log('Scheduled Task Success:', {
            btcPriceUpdate: btcPriceUpdateResponse.data,
            feedUpdate: feedUpdateResponse.data,
        });

        // Cache the combined response in Redis for 1 hour
        const responseData = {
            btcPriceUpdateResponse: btcPriceUpdateResponse.data,
            feedUpdateResponse: feedUpdateResponse.data,
        };

        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 3600); // Cache for 1 hour

        res.status(200).json({
            message: 'Scheduled tasks executed successfully',
            ...responseData,
        });
    } catch (error) {
        console.error('Error executing scheduled tasks:', error.message);
        res.status(500).json({ message: 'Error executing scheduled tasks', error: error.message });
    }
}

import axios from 'axios';

export default async function handler(req, res) {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    try {
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

        res.status(200).json({
            message: 'Scheduled tasks executed successfully',
            btcPriceUpdateResponse: btcPriceUpdateResponse.data,
            feedUpdateResponse: feedUpdateResponse.data,
        });
    } catch (error) {
        console.error('Error executing scheduled tasks:', error.message);
        res.status(500).json({ message: 'Error executing scheduled tasks', error: error.message });
    }
}

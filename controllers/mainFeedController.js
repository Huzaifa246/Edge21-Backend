const DataEntry = require('../models/mainFeedModel');
const axios = require('axios');
const { convertToLocalTime, formatLargeNumber } = require('../utils/reuseableFunctions');

const storeData = async (req, res) => {
    try {
        const { metatitle, metadescription, tags } = req.body;

        // Create a new data entry
        const dataEntry = new DataEntry({ metatitle, metadescription, tags });
        const savedEntry = await dataEntry.save();

        res.status(200).json(savedEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error storing data', error: error.message });
    }
};
const fetchLatestBitcoinDataAndUpdate = async (startOfDay, endOfDay) => {
    try {
        const now = new Date();

        const currentTime = now.toLocaleString('en-US', {
            timeZone: 'Asia/Karachi',
            hour12: true,
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        // Fetch Bitcoin data from CoinGecko API
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price',
            {
                params: {
                    ids: 'bitcoin',
                    vs_currencies: 'usd',
                    include_market_cap: true,
                    include_24hr_vol: true,
                },
            }
        );
        console.log("CoinGecko API response:", response.data);

        const bitcoinData = response.data.bitcoin;
        const price = bitcoinData.usd.toFixed(0);
        const marketCap = formatLargeNumber(bitcoinData.usd_market_cap.toFixed(0));
        const volume24h = formatLargeNumber(bitcoinData.usd_24h_vol.toFixed(0));

        const updatedMetaTitle = `Edge21: Trending Bitcoin News & Insights | Bitcoin Price Today USD $${price}`;
        const updatedMetaDescription = `Bitcoin Price Today: USD $${price} with a 24-hour trading volume of $${volume24h}. Current market cap of $${marketCap}. Updated on ${currentTime}.`;

        const result = { metatitle: updatedMetaTitle, metadescription: updatedMetaDescription, tags: 'Bitcoin' };

        // Update the latest entry
        const updatedEntry = await DataEntry.findOneAndUpdate(
            {
                timestamp: { $gte: startOfDay, $lt: endOfDay },
            },
            {
                metatitle: updatedMetaTitle,
                metadescription: updatedMetaDescription,
                tags: result.tags,
                timestamp: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log('Successfully updated or created entry:', updatedEntry);
        return result;
    } catch (error) {
        console.error('Error fetching Bitcoin data or updating database:', error.message);
        throw new Error('Failed to fetch or update Bitcoin data.');
    }
};

const fetchDataByDate = async (req, res) => {
    try {
        const { date } = req.params;

        // Directly parse the date from the 'YYYY-MM-DD' format
        const [year, month, day] = date.split('-').map(Number);

        // Ensure the date is valid
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return res.status(400).json({ message: 'Invalid date provided.' });
        }

        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // month - 1 for 0-based index
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        console.log("Start of day:", startOfDay);
        console.log("End of day:", endOfDay);

        // Query the database for entries that match the specified date range
        let data = await DataEntry.find({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ timestamp: -1 }); // Sort by timestamp in descending order

        if (!data || data.length === 0) {
            // If no data is found for the specific date, retrieve all data
            data = await DataEntry.find({}).sort({ timestamp: -1 });
            if (!data || data.length === 0) {
                return res.status(404).json({ message: 'No data available.' });
            }
            return res.json({ message: 'No data found for the given date. Returning all data.', data });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching data by date:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};

const updateOrAddDataByDate = async (req, res) => {
    try {
        let { date } = req.params;
        if (!date) {
            date = new Date().toISOString().split('T')[0];
        }
        const { metatitle, metadescription, tags } = req.body;

        const [year, month, day] = date.split('-').map(Number);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return res.status(400).json({ message: 'Invalid date provided.' });
        }

        // Convert input date to UTC start and end of the day
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        console.log("Start of Day (UTC):", startOfDay);
        console.log("End of Day (UTC):", endOfDay);

        // Fetch existing Bitcoin data
        const bitcoinData = await fetchLatestBitcoinDataAndUpdate(startOfDay, endOfDay);

        if (!bitcoinData) {
            return res.status(500).json({ message: 'Failed to fetch Bitcoin data.' });
        }
        const localNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
        const adjustedTimestamp = new Date(new Date(localNow).getTime() - new Date().getTimezoneOffset() * 60000);

        const updatedData = {
            metatitle: metatitle || bitcoinData.metatitle,
            metadescription: metadescription || bitcoinData.metadescription,
            tags: tags || bitcoinData.tags,
            timestamp: adjustedTimestamp,
        };

        // Find existing entry for the date
        let responseEntry = await DataEntry.findOne({
            timestamp: { $gte: startOfDay, $lt: endOfDay },
        });

        if (responseEntry) {
            // Update the existing entry
            responseEntry = await DataEntry.findByIdAndUpdate(responseEntry._id, updatedData, {
                new: true,
                runValidators: true,
            });
        } else {
            // Create a new entry
            const newEntry = new DataEntry(updatedData);
            responseEntry = await newEntry.save();
        }

        // Format response for display (convert to local timezone)
        const finalResponse = {
            ...responseEntry.toObject(),
            timestamp: convertToLocalTime(responseEntry.timestamp),
            createdAt: convertToLocalTime(responseEntry.createdAt),
            updatedAt: convertToLocalTime(responseEntry.updatedAt),
        };

        res.status(200).json(finalResponse);
    } catch (error) {
        console.error('Error updating or adding data by date:', error);
        res.status(500).json({ message: 'Error updating or adding data', error: error.message });
    }
};

const deleteData = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEntry = await DataEntry.findByIdAndDelete(id);

        if (!deletedEntry) {
            return res.status(404).json({ message: 'Data entry not found' });
        }

        res.json({ message: 'Data entry deleted successfully', deletedEntry });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting data', error: error.message });
    }
};



module.exports = { storeData, deleteData, fetchDataByDate, updateOrAddDataByDate, fetchLatestBitcoinDataAndUpdate };
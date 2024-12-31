const DataEntry = require('../models/mainFeedModel');
const axios = require('axios');
const cron = require('node-cron');

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

const fetchLatestBitcoinDataAndUpdate = async () => {
    try {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
            },
            params: {
                start: 1,
                limit: 1,
                convert: 'USD'
            }
        });
        console.log(response, "response");

        const bitcoinData = response.data.data[0]; // Assuming Bitcoin is the first entry
        console.log(bitcoinData, "bitcoinData");
        const price = bitcoinData.quote.USD.price.toFixed(2);
        console.log(price, "price");
        const marketCap = bitcoinData.quote.USD.market_cap.toFixed(2);
        const volume24h = bitcoinData.quote.USD.volume_24h.toFixed(2);
        const percentChange24h = bitcoinData.quote.USD.percent_change_24h.toFixed(2);

        const updatedMetaTitle = `Bitcoin Price USD $${price} | Live Chart & Trending News`;
        const updatedMetaDescription = `Current Bitcoin Price: USD $${price}. Last 24 hrs: ${percentChange24h > 0 ? 'up' : 'down'
            } ${Math.abs(percentChange24h)}% with $${volume24h} in trading volume. Current market cap of $${marketCap}.`;

        const result = { metatitle: updatedMetaTitle, metadescription: updatedMetaDescription, tags: 'Bitcoin' };

        // Update the latest entry
        const updatedEntry = await DataEntry.findOneAndUpdate(
            {
                timestamp: { $gte: startOfDay, $lt: endOfDay }
            },
            {
                metatitle: updatedMetaTitle,
                metadescription: updatedMetaDescription,
                tags: result.tags,
                timestamp: new Date() // Ensure timestamp is updated to the current time
            },
            { upsert: true, new: true } // Create entry if it doesn't exist
        );

        console.log('Successfully updated or created entry:', updatedEntry);
        return result;
    } catch (error) {
        console.error('Error fetching Bitcoin data or updating database:', error.message);
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

        console.log("Fetched data:", data);

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
        const { date } = req.params;

        // Parse the date from 'YYYY-MM-DD' format
        const [year, month, day] = date.split('-').map(Number);

        // Ensure the date is valid
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return res.status(400).json({ message: 'Invalid date provided.' });
        }

        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // month - 1 for 0-based index
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        console.log("Start of day:", startOfDay);
        console.log("End of day:", endOfDay);

        // Check if data for the given date exists
        const bitcoinData = await fetchLatestBitcoinDataAndUpdate();

        if (!bitcoinData) {
            return res.status(500).json({ message: 'Failed to fetch Bitcoin data.' });
        }

        // Check if data for the given date exists
        const dataForDate = await DataEntry.findOne({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        });

        if (dataForDate) {
            // Data exists, update the existing entry
            console.log(`Data found for ${date}. Updating entry.`);
            const updatedEntry = await DataEntry.findByIdAndUpdate(
                dataForDate._id,
                {
                    metatitle: bitcoinData.metatitle,
                    metadescription: bitcoinData.metadescription,
                    tags: bitcoinData.tags,
                    timestamp: new Date()
                },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                message: `Data for ${date} updated successfully.`,
                data: updatedEntry
            });
        } else {
            // No data exists for the given date, add a new entry
            console.log(`No data found for ${date}. Adding a new entry.`);

            const newEntry = new DataEntry({
                timestamp: startOfDay,
                metatitle: bitcoinData.metatitle,
                metadescription: bitcoinData.metadescription,
                tags: bitcoinData.tags
            });

            const savedEntry = await newEntry.save();

            return res.status(201).json({
                message: `No data found for ${date}. New entry added successfully.`,
                data: savedEntry
            });
        }
    } catch (error) {
        console.error('Error updating or adding data by date:', error);
        res.status(500).json({ message: 'Error updating or adding data', error: error.message });
    }
};


const updateData = async (req, res) => {
    try {
        const { id } = req.params;
        const { metatitle, metadescription, tags } = req.body;

        const updatedEntry = await DataEntry.findByIdAndUpdate(
            id,
            { metatitle, metadescription, tags },
            { new: true, runValidators: true }
        );

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Data entry not found' });
        }

        res.json(updatedEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error updating data', error: error.message });
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


module.exports = { storeData, updateData, deleteData, fetchDataByDate, updateOrAddDataByDate, fetchLatestBitcoinDataAndUpdate };
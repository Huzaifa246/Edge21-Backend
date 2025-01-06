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

const formatLargeNumber = (num) => {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + ' Billion';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + ' Million';
    }
    return num.toFixed(2); // Return the original number if it's less than 1 million
};
const convertToLocalTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
};

const fetchLatestBitcoinDataAndUpdate = async () => {
    try {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const currentTime = now.toLocaleString('en-US', {
            timeZone: 'Asia/Karachi',
            hour12: true,
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // console.log(currentTime, "currentTime");

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
        const marketCap = formatLargeNumber(bitcoinData.quote.USD.market_cap);
        const volume24h = formatLargeNumber(bitcoinData.quote.USD.volume_24h);

        const updatedMetaTitle = `Edge21: Trending Bitcoin News & Insights | Bitcoin Price Today USD $${price}`;
        const updatedMetaDescription = `Bitcoin Price Today: USD $${price} with a 24-hour trading volume of $${volume24h}. Current market cap of $${marketCap}. Updated on ${currentTime}.`;

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
                timestamp: new Date(),
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
        const { metatitle, metadescription, tags } = req.body;

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

        const updatedData = {
            metatitle: metatitle || bitcoinData.metatitle,
            metadescription: metadescription || bitcoinData.metadescription,
            tags: tags || bitcoinData.tags,
            timestamp: new Date(),
        };

        // Check if data for the given date exists
        const dataForDate = await DataEntry.findOne({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        });

        let responseEntry;
        if (dataForDate) {
            responseEntry = await DataEntry.findByIdAndUpdate(dataForDate._id, updatedData, { new: true });
        } else {
            const newEntry = new DataEntry(updatedData);
            responseEntry = await newEntry.save();
        }

        // Convert timestamps to local timezone for response
        responseEntry = {
            ...responseEntry.toObject(),
            timestamp: convertToLocalTime(responseEntry.timestamp),
            createdAt: convertToLocalTime(responseEntry.createdAt),
            updatedAt: convertToLocalTime(responseEntry.updatedAt)
        };

        res.status(200).json(responseEntry);
    } catch (error) {
        console.error('Error updating or adding data by date:', error);
        res.status(500).json({ message: 'Error updating or adding data', error: error.message });
    }
};
//         if (dataForDate) {
//             const updatedEntry = await DataEntry.findByIdAndUpdate(
//                 dataForDate._id,
//                 updatedData,
//                 { new: true, runValidators: true }
//             );

//             return res.status(200).json({
//                 message: `Data for ${date} updated successfully.`,
//                 data: updatedEntry
//             });
//         } else {
//             // No data exists for the given date, add a new entry
//             console.log(`No data found for ${date}. Adding a new entry.`);

//             const newEntry = new DataEntry({
//                 ...updatedData,
//             });
//             const savedEntry = await newEntry.save();

//             return res.status(201).json({
//                 message: `No data found for ${date}. New entry added successfully.`,
//                 data: savedEntry
//             });
//         }
//     } catch (error) {
//         console.error('Error updating or adding data by date:', error);
//         res.status(500).json({ message: 'Error updating or adding data', error: error.message });
//     }
// };


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
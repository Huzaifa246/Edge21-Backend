const DataEntry = require('../models/paraDetailsModel');

// Store Data
const storeData = async (req, res) => {
    try {
        const { heading1, para1, heading2, para2, heading3, para3 } = req.body;

        // Create a new data entry
        const dataEntry = new DataEntry({ heading1, para1, heading2, para2, heading3, para3 });
        const savedEntry = await dataEntry.save();

        res.status(200).json(savedEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error storing data', error: error.message });
    }
};

const fetchFilteredData = async (req, res) => {
    try {
        const { filter } = req.query;
        const now = new Date();

        let startDate;
        switch (filter) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
                break;
            case '10d':
                startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
                break;
            case '14d':
                startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
                break;
            case '20d':
                startDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
                break;
            case 'all':
                startDate = new Date(0); // Epoch start
                break;
            default:
                return res.status(400).json({ message: 'Invalid filter specified' });
        }

        // Fetch data based on the calculated start date
        const data = await DataEntry.find({ timestamp: { $gte: startDate } }).sort({ timestamp: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};

const fetchDataByDate = async (req, res) => {
    try {
        const { date } = req.params;
        console.log("Received date:", date);

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
        const data = await DataEntry.find({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ timestamp: -1 }); // Sort by timestamp in descending order

        console.log("Fetched data:", data);

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No data found for the given date' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching data by date:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};

const updateData = async (req, res) => {
    try {
        const { id } = req.params;
        const { heading1, para1, heading2, para2, heading3, para3 } = req.body;

        const updatedEntry = await DataEntry.findByIdAndUpdate(
            id,
            { heading1, para1, heading2, para2, heading3, para3 },
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


module.exports = { storeData, fetchFilteredData, updateData, deleteData, fetchDataByDate };

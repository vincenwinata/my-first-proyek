const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bookRoutes = require('./routes/bookRoutes');
const historyRoutes = require('./routes/historyRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const externalBooksRoute = require('./routes/externalBooksRoute');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('client'));

app.use('/api/books', bookRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/external-books', externalBooksRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

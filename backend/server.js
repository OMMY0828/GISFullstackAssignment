require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const places = require('./routes/places');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/places', places);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { console.error('Mongo connect err', err); });

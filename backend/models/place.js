const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lon, lat]
  },
  createdAt: { type: Date, default: Date.now }
});

PlaceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Place', PlaceSchema);

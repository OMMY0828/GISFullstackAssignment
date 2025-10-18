const Place = require('../models/place');

// Create place
exports.createPlace = async (req, res) => {
  try {
    const { name, type, lat, lng } = req.body;
    if (!name || lat === undefined || lng === undefined) 
      return res.status(400).json({ error: 'Missing fields' });

    const place = new Place({
      name,
      type,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    });

    const saved = await place.save();
    return res.status(201).json({ id: saved._id, createdAt: saved.createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Nearby: within radius
exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat,lng required' });

    const coords = [parseFloat(lng), parseFloat(lat)];
    const places = await Place.find({
      location: { $near: { $geometry: { type: 'Point', coordinates: coords }, $maxDistance: parseFloat(radius) } }
    });

    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Nearest
exports.getNearest = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat,lng required' });

    const coords = [parseFloat(lng), parseFloat(lat)];
    const nearest = await Place.findOne({
      location: { $near: { $geometry: { type: 'Point', coordinates: coords } } }
    });

    if (!nearest) return res.status(404).json({ error: 'No places found' });
    res.json(nearest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Distance between two places
exports.getDistance = async (req, res) => {
  try {
    // Expecting lat/lng of two points in query
    const { lat1, lng1, lat2, lng2 } = req.query;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({ error: 'lat1, lng1, lat2, lng2 are required' });
    }

    // Convert strings to numbers
    const φ1 = parseFloat(lat1) * Math.PI / 180;
    const φ2 = parseFloat(lat2) * Math.PI / 180;
    const Δφ = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
    const Δλ = (parseFloat(lng2) - parseFloat(lng1)) * Math.PI / 180;

    const R = 6371000; // Earth radius in meters
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance_meters = R * c;

    res.json({ distance_meters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find({});
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
};
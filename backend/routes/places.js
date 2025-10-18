const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');

// Routes
router.post('/', placeController.createPlace);
router.get('/nearby', placeController.getNearby);
router.get('/nearest', placeController.getNearest);
router.get('/distance', placeController.getDistance);
router.get('/all', placeController.getAllPlaces);

module.exports = router;

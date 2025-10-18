# GIS Fullstack Demo

A fullstack GIS demo using **Node.js + Express + MongoDB** for backend and **OpenLayers + Bootstrap** for frontend. Allows adding places, finding nearest and nearby locations, measuring distance, and visualizing on a map.

---

## Table of Contents

1. [Backend Setup](#backend-setup)
2. [API Endpoints](#api-endpoints)
3. [Frontend Setup (UI)](#frontend-setup-ui)
4. [Frontend Features](#frontend-features)

---

## Backend Setup

### 1. Prerequisites

* Node.js >= 16
* MongoDB running locally or on cloud

### 2. Installation

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Set your MongoDB connection:

```env
MONGO_URI=mongodb://localhost:27017/gis-demo
```

3. Install dependencies:

```bash
npm install
```

4. Start server:

```bash
npm run dev   # for development (requires nodemon)
npm start     # for production
```

5. Backend server will run at: `http://localhost:4000`

---

## API Endpoints

### 1. Add Place

* **POST** `/api/places`
* **Body Example:**

```json
{
  "name": "Central Park",
  "type": "Park",
  "lat": 40.785091,
  "lng": -73.968285
}
```

* **Response:**

```json
{
  "_id": "unique_id",
  "name": "Central Park",
  "type": "Park",
  "location": { "type": "Point", "coordinates": [-73.968285, 40.785091] }
}
```

### 2. Get All Places

* **GET** `/api/places/all`
* **Response Example:**

```json
[
  {
    "_id": "unique_id",
    "name": "Central Park",
    "type": "Park",
    "location": { "type": "Point", "coordinates": [-73.968285, 40.785091] }
  },
  {
    "_id": "unique_id2",
    "name": "Times Square",
    "type": "Tourist Spot",
    "location": { "type": "Point", "coordinates": [-73.985130, 40.758896] }
  }
]
```

### 3. Get Nearest Place

* **GET** `/api/places/nearest?lat=40.785091&lng=-73.968285`
* **Response Example:**

```json
{
  "location": {
    "name": "Nearest Place",
    "type": "Park",
    "coordinates": [-73.968285, 40.785091]
  }
}
```

### 4. Get Nearby Places

* **GET** `/api/places/nearby?lat=40.785091&lng=-73.968285&radius=5000`

  * `radius` is in meters
* **Response:** List of places within radius (same as **Get All Places** format)

### 5. Get Distance Between Two Points

* **GET** `/api/places/distance?lat1=40.785091&lng1=-73.968285&lat2=40.758896&lng2=-73.985130`
* **Response Example:**

```json
{
  "distance_meters": 3030
}
```

---

## Frontend Setup (UI)

### 1. Open the UI

* Option 1: Open `index.html` in any browser directly.
* Option 2: Run a simple local server for better performance:

```bash
npx serve .
```

Then visit `http://localhost:5000` (or the port shown in terminal).

### 2. Configuration

* Ensure backend server is running at `http://localhost:4000`.
* UI fetches data from backend APIs automatically.

---

## Frontend Features

1. **Basemap Switcher:** OSM, Carto, Esri
2. **WMS Layers:** Toggle **States** and **Cities** layers with opacity control
3. **Add Place:** Click or input lat/lng, name, type
4. **Nearest Place:** Find nearest place to a given coordinate
5. **Nearby Places:** Find all places within a given radius
6. **Distance Measurement:** Click two points on map to calculate distance
7. **Hover Popup:** Shows **Name, Type, Latitude, Longitude**
8. **All Locations:** Show all stored places on map

---

## Notes

* All coordinates are in **longitude, latitude** order.
* Distances are returned in **meters**.
* Ensure MongoDB is running before starting backend.
* UI and backend must be on the same domain/port or use CORS headers.

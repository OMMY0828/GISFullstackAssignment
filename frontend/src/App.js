import React, { useState, useRef, useCallback } from 'react'; // CHANGED: Added useCallback
import { Container, Navbar, Button, Form, Row, Col, Card } from 'react-bootstrap';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ol/ol.css';
import './App.css';

function App() {
  const [activePanel, setActivePanel] = useState(null);
  const [distanceResult, setDistanceResult] = useState('');
  const [mapClickActive, setMapClickActive] = useState(false);
  
  const mapRef = useRef();

  const handleClosePanel = () => {
    setActivePanel(null);
    setMapClickActive(false);
    setDistanceResult("");
  };

  const handleShowPanel = useCallback((panelType) => {
    if (activePanel !== panelType) {
      setActivePanel(panelType);
    }
    setMapClickActive(false);
  }, [activePanel]); 

  const handleMapClick = (coords) => {
    if (mapClickActive && activePanel) {
      if (activePanel === 'add' || activePanel === 'nearest' || activePanel === 'nearby') {
        const latInput = document.getElementById(`${activePanel}Lat`);
        const lngInput = document.getElementById(`${activePanel}Lng`);
        if (latInput && lngInput) {
          latInput.value = coords[1];
          lngInput.value = coords[0];
        }
        mapRef.current?.addTemporaryMarker([coords[0], coords[1]], 'selection');
      } else if (activePanel === 'distance') {
        const lat1Input = document.getElementById('distanceLat1');
        const lng1Input = document.getElementById('distanceLng1');
        const lat2Input = document.getElementById('distanceLat2');
        const lng2Input = document.getElementById('distanceLng2');
        
        if (!lat1Input.value || !lng1Input.value) {
          lat1Input.value = coords[1];
          lng1Input.value = coords[0];
          mapRef.current?.addTemporaryMarker([coords[0], coords[1]], 'point1');
        } else if (!lat2Input.value || !lng2Input.value) {
          lat2Input.value = coords[1];
          lng2Input.value = coords[0];
          mapRef.current?.addTemporaryMarker([coords[0], coords[1]], 'point2');
        } else {
          lat2Input.value = coords[1];
          lng2Input.value = coords[0];
          mapRef.current?.plotDistancePoints(
            [parseFloat(lng1Input.value), parseFloat(lat1Input.value)],
            [coords[0], coords[1]]
          );
        }
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!activePanel) return;

    let name, type, lat, lng, radius;

    switch (activePanel) {
      case 'add':
        name = document.getElementById('addName')?.value;
        type = document.getElementById('addType')?.value;
        lat = parseFloat(document.getElementById('addLat')?.value);
        lng = parseFloat(document.getElementById('addLng')?.value);
        
        if (!name || !lat || !lng) {
          alert('Please fill all required fields');
          return;
        }
        
        const success = await mapRef.current?.addPlace(name, type, lat, lng);
        if (success) {
          handleClosePanel();
        }
        break;
      
      case 'nearest':
        lat = parseFloat(document.getElementById('nearestLat')?.value);
        lng = parseFloat(document.getElementById('nearestLng')?.value);
        
        if (!lat || !lng) {
          alert('Please enter coordinates');
          return;
        }
        
        await mapRef.current?.findNearest(lat, lng);
        handleClosePanel();
        break;
      
      case 'nearby':
        lat = parseFloat(document.getElementById('nearbyLat')?.value);
        lng = parseFloat(document.getElementById('nearbyLng')?.value);
        radius = parseFloat(document.getElementById('nearbyRadius')?.value) || 5000;
        
        if (!lat || !lng) {
          alert('Please enter coordinates');
          return;
        }
        
        await mapRef.current?.findNearby(lat, lng, radius);
        handleClosePanel();
        break;
      
      default:
        break;
    }
  };

  const handleDistanceCalculate = async () => {
    const lat1 = parseFloat(document.getElementById('distanceLat1')?.value);
    const lng1 = parseFloat(document.getElementById('distanceLng1')?.value);
    const lat2 = parseFloat(document.getElementById('distanceLat2')?.value);
    const lng2 = parseFloat(document.getElementById('distanceLng2')?.value);

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      alert('Please enter all coordinates');
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/places/distance?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`
      );
      const data = await res.json();
      const distanceKm = (data.distance_meters / 1000).toFixed(2);
      setDistanceResult(`Distance between points: ${distanceKm} km`);
      
      mapRef.current?.plotDistancePoints([lng1, lat1], [lng2, lat2]);
    } catch (error) {
      setDistanceResult('Error calculating distance');
    }
  };

  const toggleMapClick = (e) => {
    if (e) {
      e.preventDefault();
    }
    setMapClickActive(!mapClickActive);
  };

  return (
    <div className="App">
      <Navbar bg="success" variant="dark" className="p-2">
        <Container fluid>
          <Navbar.Brand className="fs-4 fw-bold mx-auto">
            Geographic Information System
          </Navbar.Brand>
        </Container>
      </Navbar>

      <ControlPanel 
        onShowPanel={handleShowPanel}
        mapRef={mapRef}
      />

      <MapComponent 
        ref={mapRef}
        onMapClick={handleMapClick}
        mapClickActive={mapClickActive}
      />

      {activePanel && (
        <div className="floating-panel">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span className="fw-bold">
                {activePanel === 'add' && 'Add New Place'}
                {activePanel === 'nearest' && 'Find Nearest Place'}
                {activePanel === 'nearby' && 'Find Nearby Places'}
                {activePanel === 'distance' && 'Calculate Distance'}
              </span>
              <Button variant="outline-danger" size="sm" onClick={handleClosePanel}>
                ×
              </Button>
            </Card.Header>
            <Card.Body>
              {activePanel === 'add' && (
                <AddPlaceForm 
                  mapClickActive={mapClickActive}
                  onToggleMapClick={toggleMapClick}
                />
              )}
              {activePanel === 'nearest' && (
                <NearestForm 
                  mapClickActive={mapClickActive}
                  onToggleMapClick={toggleMapClick}
                />
              )}
              {activePanel === 'nearby' && (
                <NearbyForm 
                  mapClickActive={mapClickActive}
                  onToggleMapClick={toggleMapClick}
                />
              )}
              {activePanel === 'distance' && (
                <DistanceForm 
                  mapClickActive={mapClickActive}
                  onToggleMapClick={toggleMapClick}
                  distanceResult={distanceResult}
                />
              )}
            </Card.Body>
            <Card.Footer>
              {activePanel !== 'distance' ? (
                <Button variant="primary" onClick={handleFormSubmit} className="w-100">
                  {activePanel === 'add' ? 'Add Place' : 
                   activePanel === 'nearest' ? 'Find Nearest' : 'Find Nearby'}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleDistanceCalculate} className="w-100">
                  Calculate Distance
                </Button>
              )}
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );
}

const AddPlaceForm = ({ mapClickActive, onToggleMapClick }) => (
  <Form>
    <Form.Group className="mb-2">
      <Form.Label>Name *</Form.Label>
      <Form.Control type="text" id="addName" placeholder="Enter place name" />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Type</Form.Label>
      <Form.Control type="text" id="addType" placeholder="Enter place type" />
    </Form.Group>
    <Row>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Latitude *</Form.Label>
          <Form.Control type="number" id="addLat" placeholder="Latitude" step="any" />
        </Form.Group>
      </Col>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Longitude *</Form.Label>
          <Form.Control type="number" id="addLng" placeholder="Longitude" step="any" />
        </Form.Group>
      </Col>
    </Row>
    <Button 
      variant={mapClickActive ? "success" : "outline-secondary"}
      size="sm" 
      onClick={(e) => {
        e.preventDefault();
        onToggleMapClick();
      }}
      className="w-100"
      type="button" 
    >
      {mapClickActive ? '✓ Click on Map to Select' : 'Pick from Map'}
    </Button>
    {mapClickActive && (
      <div className="mt-2">
        <small className="text-muted">Click anywhere on the map to set coordinates</small>
      </div>
    )}
  </Form>
);

const NearestForm = ({ mapClickActive, onToggleMapClick }) => (
  <Form>
    <Row>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Latitude</Form.Label>
          <Form.Control type="number" id="nearestLat" placeholder="Latitude" step="any" />
        </Form.Group>
      </Col>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Longitude</Form.Label>
          <Form.Control type="number" id="nearestLng" placeholder="Longitude" step="any" />
        </Form.Group>
      </Col>
    </Row>
    <Button 
      variant={mapClickActive ? "success" : "outline-secondary"}
      size="sm" 
      onClick={(e) => {
        e.preventDefault();
        onToggleMapClick();
      }}
      className="w-100"
      type="button" 
    >
      {mapClickActive ? '✓ Click on Map to Select' : 'Pick from Map'}
    </Button>
    {mapClickActive && (
      <div className="mt-2">
        <small className="text-muted">Click anywhere on the map to set coordinates</small>
      </div>
    )}
  </Form>
);

const NearbyForm = ({ mapClickActive, onToggleMapClick }) => (
  <Form>
    <Row>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Latitude</Form.Label>
          <Form.Control type="number" id="nearbyLat" placeholder="Latitude" step="any" />
        </Form.Group>
      </Col>
      <Col>
        <Form.Group className="mb-2">
          <Form.Label>Longitude</Form.Label>
          <Form.Control type="number" id="nearbyLng" placeholder="Longitude" step="any" />
        </Form.Group>
      </Col>
    </Row>
    <Form.Group className="mb-2">
      <Form.Label>Radius (meters)</Form.Label>
      <Form.Control 
        type="number" 
        id="nearbyRadius" 
        placeholder="Enter radius" 
        defaultValue="5000" 
      />
    </Form.Group>
    <Button 
      variant={mapClickActive ? "success" : "outline-secondary"}
      size="sm" 
      onClick={(e) => {
        e.preventDefault();
        onToggleMapClick();
      }}
      className="w-100"
      type="button" 
    >
      {mapClickActive ? '✓ Click on Map to Select' : 'Pick from Map'}
    </Button>
    {mapClickActive && (
      <div className="mt-2">
        <small className="text-muted">Click anywhere on the map to set coordinates</small>
      </div>
    )}
  </Form>
);

const DistanceForm = ({ mapClickActive, onToggleMapClick, distanceResult }) => (
  <Form>
    <Row>
      <Col>
        <h6>Point 1</h6>
        <Form.Group className="mb-2">
          <Form.Label>Latitude</Form.Label>
          <Form.Control type="number" id="distanceLat1" placeholder="Latitude" step="any" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Longitude</Form.Label>
          <Form.Control type="number" id="distanceLng1" placeholder="Longitude" step="any" />
        </Form.Group>
      </Col>
      <Col>
        <h6>Point 2</h6>
        <Form.Group className="mb-2">
          <Form.Label>Latitude</Form.Label>
          <Form.Control type="number" id="distanceLat2" placeholder="Latitude" step="any" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Longitude</Form.Label>
          <Form.Control type="number" id="distanceLng2" placeholder="Longitude" step="any" />
        </Form.Group>
      </Col>
    </Row>
    <Button 
      variant={mapClickActive ? "success" : "outline-secondary"}
      size="sm" 
      onClick={(e) => {
        e.preventDefault();
        onToggleMapClick();
      }}
      className="w-100 mb-2"
      type="button" 
    >
      {mapClickActive ? '✓ Click on Map to Select Points' : 'Pick from Map'}
    </Button>
    {mapClickActive && (
      <div className="mt-2 mb-2">
        <small className="text-muted">Click on the map to set Point 1, then Point 2</small>
      </div>
    )}
    {distanceResult && (
      <div className="p-2 bg-light rounded">
        <small className="text-success">{distanceResult}</small>
      </div>
    )}
  </Form>
);

export default App;
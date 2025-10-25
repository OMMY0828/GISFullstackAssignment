import React, { useState, useRef } from 'react';
import { Container, Navbar, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ol/ol.css';
import './App.css';

function App() {
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [distanceResult, setDistanceResult] = useState('');
  
  const mapRef = useRef();

  const handleClosePlaceModal = () => {
    setShowPlaceModal(false);
  };

  const handleCloseDistanceModal = () => {
    setShowDistanceModal(false);
    setDistanceResult(''); // Clear previous result when closing
  };

  const handleShowPlaceModal = (mode) => {
    setModalMode(mode);
    setShowPlaceModal(true);
  };

  const handleShowDistanceModal = () => {
    setShowDistanceModal(true);
    setDistanceResult(''); // Clear previous result when opening
  };

  const handleFormSubmit = async () => {
    const name = document.getElementById('placeName')?.value;
    const type = document.getElementById('placeType')?.value;
    const lat = parseFloat(document.getElementById('placeLat')?.value);
    const lng = parseFloat(document.getElementById('placeLng')?.value);
    const radius = parseFloat(document.getElementById('nearbyRadius')?.value) || 5000;

    if (!lat || !lng) {
      alert('Please enter both latitude and longitude');
      return;
    }

    switch (modalMode) {
      case 'add':
        if (!name) {
          alert('Name is required');
          return;
        }
        const success = await mapRef.current?.addPlace(name, type, lat, lng);
        if (success) {
          handleClosePlaceModal();
        }
        break;
      
      case 'nearest':
        await mapRef.current?.findNearest(lat, lng);
        handleClosePlaceModal();
        break;
      
      case 'nearby':
        await mapRef.current?.findNearby(lat, lng, radius);
        handleClosePlaceModal();
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
      
      // Plot the points and line on map
      mapRef.current?.plotDistancePoints([lng1, lat1], [lng2, lat2]);
    } catch (error) {
      setDistanceResult('Error calculating distance');
    }
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
        onShowPlaceModal={handleShowPlaceModal}
        onShowDistanceModal={handleShowDistanceModal}
        mapRef={mapRef}
      />

      <MapComponent 
        ref={mapRef}
        onDistanceCalculate={setDistanceResult}
      />

      {/* Add Place Modal */}
      <Modal show={showPlaceModal} onHide={handleClosePlaceModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Add Place' : 
             modalMode === 'nearest' ? 'Find Nearest Place' : 'Find Nearby Places'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PlaceForm mode={modalMode} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePlaceModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleFormSubmit}>
            {modalMode === 'add' ? 'Add Place' : 
             modalMode === 'nearest' ? 'Find Nearest' : 'Find Nearby'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Distance Modal */}
      <Modal show={showDistanceModal} onHide={handleCloseDistanceModal}>
        <Modal.Header closeButton>
          <Modal.Title>Calculate Distance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DistanceForm onCalculate={handleDistanceCalculate} />
          {distanceResult && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Result:</h6>
              <p className="mb-0">{distanceResult}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDistanceModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleDistanceCalculate}>
            Calculate Distance
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const PlaceForm = ({ mode }) => {
  return (
    <Form>
      {(mode === 'add') && (
        <>
          <Form.Group className="mb-2">
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" id="placeName" placeholder="Enter place name" />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Type</Form.Label>
            <Form.Control type="text" id="placeType" placeholder="Enter place type" />
          </Form.Group>
        </>
      )}
      
      <Row>
        <Col>
          <Form.Group className="mb-2">
            <Form.Label>Latitude</Form.Label>
            <Form.Control type="number" id="placeLat" placeholder="Enter latitude" step="any" />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="mb-2">
            <Form.Label>Longitude</Form.Label>
            <Form.Control type="number" id="placeLng" placeholder="Enter longitude" step="any" />
          </Form.Group>
        </Col>
      </Row>

      {mode === 'nearby' && (
        <Form.Group className="mb-2">
          <Form.Label>Radius (meters)</Form.Label>
          <Form.Control 
            type="number" 
            id="nearbyRadius" 
            placeholder="Enter radius" 
            defaultValue="5000" 
          />
        </Form.Group>
      )}
    </Form>
  );
};

const DistanceForm = ({ onCalculate }) => {
  return (
    <Form>
      <Row>
        <Col>
          <h6>Point 1</h6>
          <Form.Group className="mb-2">
            <Form.Label>Latitude</Form.Label>
            <Form.Control type="number" id="distanceLat1" placeholder="Enter latitude" step="any" />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Longitude</Form.Label>
            <Form.Control type="number" id="distanceLng1" placeholder="Enter longitude" step="any" />
          </Form.Group>
        </Col>
        <Col>
          <h6>Point 2</h6>
          <Form.Group className="mb-2">
            <Form.Label>Latitude</Form.Label>
            <Form.Control type="number" id="distanceLat2" placeholder="Enter latitude" step="any" />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Longitude</Form.Label>
            <Form.Control type="number" id="distanceLng2" placeholder="Enter longitude" step="any" />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default App;
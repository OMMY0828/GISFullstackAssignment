import React, { useState } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';

const ControlPanel = ({ onShowPanel, mapRef }) => {
  const [activeBasemap, setActiveBasemap] = useState('osm');
  const [activeAction, setActiveAction] = useState(null);
  const [layerStates, setLayerStates] = useState({
    states: { visible: false, opacity: 0 },
    cities: { visible: false, opacity: 0 }
  });

  const handleBasemapChange = (basemap) => {
    setActiveBasemap(basemap);
    mapRef.current?.setBasemap(basemap);
  };

  const handleActionClick = (action) => {
    setActiveAction(action);
    switch (action) {
      case 'allshow':
        mapRef.current?.showAllLocations();
        break;
      case 'add':
        onShowPanel('add');
        break;
      case 'nearest':
        onShowPanel('nearest');
        break;
      case 'nearby':
        onShowPanel('nearby');
        break;
      case 'distance':
        onShowPanel('distance');
        break;
      case 'reset':
        mapRef.current?.resetView();
        break;
    }
  };

  const handleLayerCheckboxChange = (layerName, checked) => {
    const newOpacity = checked ? 1 : 0;
    const newState = {
      ...layerStates,
      [layerName]: {
        visible: checked,
        opacity: newOpacity
      }
    };
    setLayerStates(newState);
    
    mapRef.current?.setLayerVisibility(layerName, checked, newOpacity);
  };

  const handleLayerRangeChange = (layerName, opacityValue) => {
    const opacity = parseFloat(opacityValue);
    const visible = opacity > 0;
    
    const newState = {
      ...layerStates,
      [layerName]: {
        visible: visible,
        opacity: opacity
      }
    };
    setLayerStates(newState);
    
    mapRef.current?.setLayerVisibility(layerName, visible, opacity);
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-2 bg-light">
      <div className="d-flex align-items-center">
        <strong className="me-2">Basemap:</strong>
        <Button
          size="sm"
          variant={activeBasemap === 'osm' ? 'success' : 'primary'}
          className="mx-1"
          onClick={() => handleBasemapChange('osm')}
        >
          OSM
        </Button>
        <Button
          size="sm"
          variant={activeBasemap === 'carto' ? 'success' : 'primary'}
          className="mx-1"
          onClick={() => handleBasemapChange('carto')}
        >
          Carto
        </Button>
        <Button
          size="sm"
          variant={activeBasemap === 'esri' ? 'success' : 'primary'}
          className="mx-1"
          onClick={() => handleBasemapChange('esri')}
        >
          Esri
        </Button>
      </div>

      <div className="d-flex flex-column align-items-center">
        <h6 className="mb-2">WMS Layers</h6>
        <Row className="g-3">
          <Col>
            <Form.Group className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                id="statesLayer"
                checked={layerStates.states.visible}
                onChange={(e) => handleLayerCheckboxChange('states', e.target.checked)}
                className="me-2"
              />
              <Form.Label htmlFor="statesLayer" className="mb-0 me-2">States</Form.Label>
              <Form.Range
                min="0"
                max="1"
                step="0.05"
                value={layerStates.states.opacity}
                onChange={(e) => handleLayerRangeChange('states', e.target.value)}
                style={{ width: '100px' }}
              />
              <Form.Text className="ms-2" style={{ minWidth: '40px' }}>
                {Math.round(layerStates.states.opacity * 100)}%
              </Form.Text>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                id="citiesLayer"
                checked={layerStates.cities.visible}
                onChange={(e) => handleLayerCheckboxChange('cities', e.target.checked)}
                className="me-2"
              />
              <Form.Label htmlFor="citiesLayer" className="mb-0 me-2">Cities</Form.Label>
              <Form.Range
                min="0"
                max="1"
                step="0.05"
                value={layerStates.cities.opacity}
                onChange={(e) => handleLayerRangeChange('cities', e.target.value)}
                style={{ width: '100px' }}
              />
              <Form.Text className="ms-2" style={{ minWidth: '40px' }}>
                {Math.round(layerStates.cities.opacity * 100)}%
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="d-flex align-items-center">
        <Button
          size="sm"
          variant="success"
          className="mx-1"
          active={activeAction === 'allshow'}
          onClick={() => handleActionClick('allshow')}
          type="button"
        >
          All Locations
        </Button>
        <Button
          size="sm"
          variant="success"
          className="mx-1"
          active={activeAction === 'add'}
          onClick={() => handleActionClick('add')}
          type="button"
        >
          Add Place
        </Button>
        <Button
          size="sm"
          variant="warning"
          className="mx-1"
          active={activeAction === 'nearest'}
          onClick={() => handleActionClick('nearest')}
          type="button"
        >
          Nearest
        </Button>
        <Button
          size="sm"
          variant="info"
          className="mx-1"
          active={activeAction === 'nearby'}
          onClick={() => handleActionClick('nearby')}
          type="button"
        >
          Nearby
        </Button>
        <Button
          size="sm"
          variant="dark"
          className="mx-1"
          active={activeAction === 'distance'}
          onClick={() => handleActionClick('distance')}
          type="button"
        >
          Distance
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          className="mx-1"
          onClick={() => handleActionClick('reset')}
          type="button"
        >
          Reset View
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
import React, { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon, Stroke, Circle, Fill } from 'ol/style';
import Overlay from 'ol/Overlay';

const MapComponent = forwardRef(({ onMapClick, mapClickActive }, ref) => {
  const mapRef = useRef();
  const popupRef = useRef();
  const mapInstance = useRef(null);
  const vectorSource = useRef(new VectorSource());
  const layers = useRef({});
  const distanceLineRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Update cursor based on map click activity
  useEffect(() => {
    if (mapInstance.current && isMapReady) {
      const viewport = mapInstance.current.getViewport();
      if (mapClickActive) {
        viewport.style.cursor = 'crosshair';
      } else {
        viewport.style.cursor = '';
      }
    }
  }, [mapClickActive, isMapReady]);

  // Safe zoom function that checks if map is ready
  const safeZoomToExtent = (extent, options = {}) => {
    if (mapInstance.current && isMapReady) {
      mapInstance.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 12,
        duration: 1000,
        ...options
      });
    }
  };

  const safeAnimateTo = (center, zoom, duration = 1000) => {
    if (mapInstance.current && isMapReady) {
      mapInstance.current.getView().animate({
        center: center,
        zoom: zoom,
        duration: duration
      });
    }
  };

  // Function to add temporary marker when selecting points from map
  const addTemporaryMarker = (coords, markerType = 'selection') => {
    if (!mapInstance.current || !isMapReady) return;
    
    const marker = new Feature({
      geometry: new Point(fromLonLat(coords))
    });
    
    let style;
    if (markerType === 'selection') {
      // Red circle for coordinate selection
      style = new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    } else if (markerType === 'point1') {
      // Blue circle for distance point 1
      style = new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'blue' }),
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    } else if (markerType === 'point2') {
      // Green circle for distance point 2
      style = new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'green' }),
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    }
    
    marker.setStyle(style);
    marker.setProperties({
      name: `Selected Point`,
      lat: coords[1],
      lng: coords[0],
      temporary: true
    });
    
    vectorSource.current.addFeature(marker);
  };


  useImperativeHandle(ref, () => ({
    showAllLocations: async () => {
      vectorSource.current.clear();
      try {
        const res = await fetch('http://localhost:4000/api/places/all');
        if (!res.ok) throw new Error('Failed to fetch places');
        const places = await res.json();
        
        const features = places.map(place => {
          const [lng, lat] = place.location.coordinates;
          const feature = new Feature({
            geometry: new Point(fromLonLat([lng, lat]))
          });
          feature.setProperties({
            name: place.name,
            type: place.type,
            lat: lat,
            lng: lng
          });
          feature.setStyle(new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scale: 0.04
            })
          }));
          return feature;
        });

        vectorSource.current.addFeatures(features);
        
        // Zoom to show all locations
        if (features.length > 0) {
          setTimeout(() => {
            safeZoomToExtent(vectorSource.current.getExtent(), { maxZoom: 6 });
          }, 100);
        }
      } catch (error) {
        alert(error.message);
      }
    },

    addPlace: async (name, type, lat, lng) => {
      try {
        const res = await fetch('http://localhost:4000/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, lat, lng })
        });
        
        if (!res.ok) throw new Error('Failed to add place');
        
        const feature = new Feature({
          geometry: new Point(fromLonLat([lng, lat]))
        });
        feature.setProperties({ name, type, lat, lng });
        feature.setStyle(new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.04
          })
        }));
        vectorSource.current.addFeature(feature);

        // Zoom to the newly added place
        setTimeout(() => {
          safeAnimateTo(fromLonLat([lng, lat]), 14);
        }, 100);
        
        return true;
      } catch (error) {
        alert(error.message);
        return false;
      }
    },

    findNearest: async (lat, lng) => {
      vectorSource.current.clear();
      try {
        const res = await fetch(`http://localhost:4000/api/places/nearest?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        if (data && data.location) {
          const [lon, plat] = data.location.coordinates;
          const feature = new Feature({
            geometry: new Point(fromLonLat([lon, plat]))
          });
          feature.setProperties({
            name: data.name || "Nearest Place",
            type: data.type || "Type unknown",
            lat: plat,
            lng: lon
          });
          feature.setStyle(new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scale: 0.04
            })
          }));
          vectorSource.current.addFeature(feature);

          // Zoom to the nearest place
          setTimeout(() => {
            safeAnimateTo(fromLonLat([lon, plat]), 14);
          }, 100);
        } else {
          alert('No nearest place found');
        }
      } catch (error) {
        alert(error.message);
      }
    },

    findNearby: async (lat, lng, radius) => {
      vectorSource.current.clear();
      try {
        const res = await fetch(`http://localhost:4000/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const features = data.map(place => {
            const [lon, plat] = place.location.coordinates;
            const feature = new Feature({
              geometry: new Point(fromLonLat([lon, plat]))
            });
            feature.setProperties({
              name: place.name,
              type: place.type,
              lat: plat,
              lng: lon
            });
            feature.setStyle(new Style({
              image: new Icon({
                src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                scale: 0.04
              })
            }));
            return feature;
          });

          vectorSource.current.addFeatures(features);

          // Zoom to show all nearby places
          setTimeout(() => {
            safeZoomToExtent(vectorSource.current.getExtent(), { maxZoom: 12 });
          }, 100);
        } else {
          alert('No nearby places found');
          // Zoom to the search center point
          setTimeout(() => {
            safeAnimateTo(fromLonLat([lng, lat]), 12);
          }, 100);
        }
      } catch (error) {
        alert(error.message);
      }
    },

    plotDistancePoints: (point1, point2) => {
      // Clear previous distance markers and line
      vectorSource.current.clear();
      
      // Add first point marker
      const marker1 = new Feature({
        geometry: new Point(fromLonLat(point1))
      });
      marker1.setProperties({
        name: 'Start Point',
        lat: point1[1],
        lng: point1[0]
      });
      marker1.setStyle(new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scale: 0.04
        })
      }));
      vectorSource.current.addFeature(marker1);

      // Add second point marker
      const marker2 = new Feature({
        geometry: new Point(fromLonLat(point2))
      });
      marker2.setProperties({
        name: 'End Point',
        lat: point2[1],
        lng: point2[0]
      });
      marker2.setStyle(new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scale: 0.04
        })
      }));
      vectorSource.current.addFeature(marker2);

      // Create line between points
      const line = new Feature({
        geometry: new LineString([fromLonLat(point1), fromLonLat(point2)])
      });
      line.setStyle(new Style({
        stroke: new Stroke({
          color: 'rgba(0, 132, 255, 1)',
          width: 4
        })
      }));
      vectorSource.current.addFeature(line);
      distanceLineRef.current = line;

      // Fit view to show both points with some padding
      setTimeout(() => {
        safeZoomToExtent(vectorSource.current.getExtent(), { maxZoom: 10 });
      }, 100);
    },

    // Add temporary marker when selecting coordinates from map
    addTemporaryMarker: (coords, markerType = 'selection') => {
      addTemporaryMarker(coords, markerType);
    },

    setBasemap: (basemap) => {
      const { osm, carto, esri } = layers.current;
      if (mapInstance.current && isMapReady) {
        // Set visibility based on selected basemap
        osm.setVisible(basemap === 'osm');
        carto.setVisible(basemap === 'carto');
        esri.setVisible(basemap === 'esri');
      }
    },

    setLayerVisibility: (layerName, visible, opacity) => {
      const layer = layers.current[layerName];
      if (layer && isMapReady) {
        layer.setVisible(visible);
        layer.setOpacity(opacity);
      }
    },

    // New method to reset view to default
    resetView: () => {
      if (mapInstance.current && isMapReady) {
        mapInstance.current.getView().animate({
          center: fromLonLat([78.9629, 20.5937]),
          zoom: 5,
          duration: 1000
        });
      }
    },

    // Method to check if map is ready
    isMapReady: () => isMapReady
  }));

  useEffect(() => {
    // Initialize layers
    layers.current.osm = new TileLayer({
      source: new OSM(),
      visible: true
    });

    layers.current.carto = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
      }),
      visible: false
    });

    layers.current.esri = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      }),
      visible: false
    });

    layers.current.cities = new TileLayer({
      source: new TileWMS({
        url: 'https://ows.mundialis.de/services/service?',
        params: {
          LAYERS: 'OSM-WMS',
          FORMAT: 'image/png',
          TRANSPARENT: true,
          TILED: true
        },
        serverType: 'geoserver'
      }),
      visible: true,
      opacity: 0
    });

    layers.current.states = new TileLayer({
      source: new TileWMS({
        url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
        params: {
          LAYERS: 'Reference_Features',
          FORMAT: 'image/png',
          TRANSPARENT: true
        }
      }),
      visible: true,
      opacity: 0
    });

    // Vector layer for markers
    const vectorLayer = new VectorLayer({
      source: vectorSource.current
    });

    // Initialize map
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        layers.current.osm,
        layers.current.carto,
        layers.current.esri,
        layers.current.states,
        layers.current.cities,
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5
      })
    });

    // Set map as ready when view is ready
    mapInstance.current.once('rendercomplete', () => {
      setIsMapReady(true);
    });

    // Initialize popup
    const popup = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      stopEvent: false
    });
    mapInstance.current.addOverlay(popup);

    // Hover popup
    mapInstance.current.on('pointermove', (evt) => {
      const feature = mapInstance.current.forEachFeatureAtPixel(evt.pixel, f => f);
      if (feature) {
        const coord = feature.getGeometry().getCoordinates();
        const props = feature.getProperties();
        popup.setPosition(coord);
        popupRef.current.innerHTML = `
          <b>${props.name || ''}</b><br>
          ${props.type || ''}<br>
          Lat: ${props.lat?.toFixed(5) || ''}, Lng: ${props.lng?.toFixed(5) || ''}
        `;
      } else {
        popup.setPosition(undefined);
      }
    });

    // Map click event
    mapInstance.current.on('singleclick', async (evt) => {
      const coords = toLonLat(evt.coordinate);

      // Handle coordinate selection for forms
      if (mapClickActive) {
        onMapClick(coords);
        return;
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, [onMapClick, mapClickActive]);

  return (
    <div 
      ref={mapRef} 
      className="map-container" 
      style={{ width: '100%', height: '80vh' }}
    >
      <div ref={popupRef} className="ol-popup"></div>
      {!isMapReady && (
        <div className="map-loading-overlay">
          <div className="loading-spinner">Loading Map...</div>
        </div>
      )}
    </div>
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const buttonStyle = {
  margin: '10px',  
};

interface LandMapItem {
  id: number;
  lat: string;
  long: string;
  total_land_size_in_acres: {
    acres: number;
    guntas: number;
  };
  price_per_acre_crore: {
    lakh: number;
  };
  district: string;
  highway_facing: boolean;
}


interface Property {
  id: number;
  latitude: number;
  longitude: number;
  totalLandSizeInAcres: string;
  pricePerAcre: string;
  tooltipText: string;
  district: string;
  guntas: number;
  highwayFacing: boolean;
}

const center = {
  lat: 17.3850,  
  lng: 78.4867
};

const options = {
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy'
};

const MapComponent: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  });

  const handleViewDetailsClick = (property: Property) => {
    setSelectedProperty(property);
    setDrawerOpen(true);
  };

  useEffect(() => {
    fetch('https://prod-be.1acre.in/lands/landmaps/?seller_id=211')
      .then(response => response.json())
      .then(data => {
        const properties = data.map((item: LandMapItem) => ({
          id: item.id,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.long),
          totalLandSizeInAcres: `${item.total_land_size_in_acres.acres} Acres, ${item.total_land_size_in_acres.guntas} Guntas`,
          pricePerAcre: `₹ ${item.price_per_acre_crore.lakh * 100} lakhs per acre`,
          tooltipText: `${item.total_land_size_in_acres.acres} Acres, ${item.total_land_size_in_acres.guntas} Guntas - ₹ ${item.price_per_acre_crore.lakh * 100} lakhs per acre`,
          district: item.district,
          guntas: item.total_land_size_in_acres.guntas,
          highwayFacing: item.highway_facing
        }));
        setProperties(properties);
      })
      .catch(error => {
        console.error("Error fetching properties:", error);
        alert('Failed to fetch properties. Please try again later.');
      });
  }, []);

  useEffect(() => {
    if (isLoaded && properties.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      properties.forEach(prop => {
        bounds.extend(new google.maps.LatLng(prop.latitude, prop.longitude));
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [properties, isLoaded]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  return isLoaded ? (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        options={options}
        onLoad={handleMapLoad}
      >
        {properties.map(property => (
          <Marker
            key={property.id}
            position={{ lat: property.latitude, lng: property.longitude }}
            title={property.tooltipText}
            onClick={() => setSelectedProperty(property)}
          />
        ))}
        {selectedProperty && (
          <InfoWindow
            position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div>
              <h2>{selectedProperty.totalLandSizeInAcres} - {selectedProperty.pricePerAcre}</h2>
              <Button style={buttonStyle} variant="contained" color="primary" onClick={() => handleViewDetailsClick(selectedProperty)}>
                View Details
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedProperty && (
          <List>
            <ListItem>
              <ListItemText primary="Property Details" />
            </ListItem>
            
            <ListItem>
              <ListItemText primary={`Size: ${selectedProperty.totalLandSizeInAcres}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Price: ${selectedProperty.pricePerAcre}`} />
            </ListItem>
            
            <ListItem>
              <ListItemText primary={`Guntas: ${selectedProperty.guntas}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Highway Facing: ${selectedProperty.highwayFacing ? 'Yes' : 'No'}`} />
            </ListItem>
          </List>
        )}
      </Drawer>
    </div>
  ) : <></>;
}

export default MapComponent;

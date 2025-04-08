import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, Paper, Typography } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get token from environment variables
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'pk.eyJ1IjoidmFydW5yYXRuYWthciIsImEiOiJjamZ3MnZjNjEwNnBzMnhvOHBpdHB5NGtpIn0.Qm9PUDyLZe6rpB3P0YBUWw';

interface LocationEditorProps {
    latitude: string | null;
    longitude: string | null;
    onUpdate: (field: string, value: string) => void;
}

const LocationEditor: React.FC<LocationEditorProps> = ({ latitude, longitude, onUpdate }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);

    const [lat, setLat] = useState(latitude || '');
    const [lng, setLng] = useState(longitude || '');

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        const initialLat = parseFloat(latitude || '0') || 0;
        const initialLng = parseFloat(longitude || '0') || 0;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9', // Satellite view with terrain
            center: [initialLng, initialLat],
            zoom: 5,
            // pitch: 60 // Tilt the map to show terrain better
        });

        // Add terrain and sky layers for better visualization
        map.current.on('load', () => {
            map.current?.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });

            map.current?.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 90.0],
                    'sky-atmosphere-sun-intensity': 15
                }
            });
        });

        // Add marker
        marker.current = new mapboxgl.Marker({
            draggable: true,
            color: '#FF0000'
        })
            .setLngLat([initialLng, initialLat])
            .addTo(map.current);

        // Handle marker drag
        marker.current.on('dragend', () => {
            const position = marker.current?.getLngLat();
            if (position) {
                setLat(position.lat.toFixed(6));
                setLng(position.lng.toFixed(6));
                onUpdate('latitude', position.lat.toFixed(6));
                onUpdate('longitude', position.lng.toFixed(6));
            }
        });

        // Cleanup
        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Update marker when coordinates change via text input
    const updateLocation = (newLat: string, newLng: string) => {
        const latNum = parseFloat(newLat);
        const lngNum = parseFloat(newLng);

        if (!isNaN(latNum) && !isNaN(lngNum) && marker.current && map.current) {
            marker.current.setLngLat([lngNum, latNum]);
            map.current.flyTo({
                center: [lngNum, latNum],
                zoom: 8,
                duration: 2000
            });
        }
    };

    const handleLatChange = (value: string) => {
        setLat(value);
        onUpdate('latitude', value);
        if (lng) {
            updateLocation(value, lng);
        }
    };

    const handleLngChange = (value: string) => {
        setLng(value);
        onUpdate('longitude', value);
        if (lat) {
            updateLocation(lat, value);
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Drag the marker or enter coordinates manually
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Latitude"
                        value={lat}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLatChange(e.target.value)}
                        size="small"
                        sx={{ width: 150 }}
                    />
                    <TextField
                        label="Longitude"
                        value={lng}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLngChange(e.target.value)}
                        size="small"
                        sx={{ width: 150 }}
                    />
                </Box>
            </Paper>
            <Box
                ref={mapContainer}
                sx={{
                    height: 400,
                    borderRadius: 1,
                    overflow: 'hidden'
                }}
            />
        </Box>
    );
};

export default LocationEditor; 
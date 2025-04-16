import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getValueFromPath } from '../../utils/utils';
import { EditorProps } from '../router';

// Get token from environment variables
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'pk.eyJ1IjoidmFydW5yYXRuYWthciIsImEiOiJjamZ3MnZjNjEwNnBzMnhvOHBpdHB5NGtpIn0.Qm9PUDyLZe6rpB3P0YBUWw';


const LocationEditor: React.FC<EditorProps> = ({ dataset, path, params, onUpdate, title = '' }) => {
    const location = getValueFromPath(dataset, path);
    // Track location coordinates to detect changes
    const [coordinates, setCoordinates] = useState({
        lat: parseFloat(location.latitude || '0') || 0,
        lng: parseFloat(location.longitude || '0') || 0
    });
    
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);

    // Initialize map and marker
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        const initialLat = parseFloat(location.latitude || '0') || 0;
        const initialLng = parseFloat(location.longitude || '0') || 0;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9', // Satellite view with terrain
            center: [initialLng, initialLat],
            zoom: 8,
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
                location.latitude = position.lat.toFixed(6);
                location.longitude = position.lng.toFixed(6);
                
                // Update coordinates state to track changes
                setCoordinates({
                    lat: position.lat,
                    lng: position.lng
                });
                
                onUpdate(path, location);
            }
        });

        // Cleanup
        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Monitor location changes from outside the component
    useEffect(() => {
        const currentLat = parseFloat(location.latitude || '0') || 0;
        const currentLng = parseFloat(location.longitude || '0') || 0;
        
        // Only update if coordinates have changed from what we already know
        if (currentLat !== coordinates.lat || currentLng !== coordinates.lng) {
            setCoordinates({
                lat: currentLat,
                lng: currentLng
            });
            
            // Update the map marker and view if map is initialized
            if (marker.current && map.current) {
                marker.current.setLngLat([currentLng, currentLat]);
                map.current.flyTo({
                    center: [currentLng, currentLat],
                    zoom: 8,
                    duration: 1000
                });
            }
        }
    }, [location.latitude, location.longitude]);

    return (
        <Box
            ref={mapContainer}
            sx={{
                mt: 1,
                height: 400,
                borderRadius: 1,
                overflow: 'hidden'
            }}
        />
    );
};

export default LocationEditor; 
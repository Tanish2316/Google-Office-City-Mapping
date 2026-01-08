import { useEffect, useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { toast } from 'react-toastify';
import { CityAssignment, Office } from './types';

interface Props {
    currentOffice: Office;
    assignments: CityAssignment[];
    onAssignCity: (cityId: string) => void;
    initialSelectedCities?: string[];
}

export function CityLayer({
    currentOffice,
    assignments,
    onAssignCity,
    initialSelectedCities = []
}: Props) {
    const map = useMap();
    const [selectedUnassignedCities, setSelectedUnassignedCities] = useState<string[]>(initialSelectedCities);

    useEffect(() => {
        if (initialSelectedCities.length > 0) {
            setSelectedUnassignedCities(initialSelectedCities);
        }
    }, [initialSelectedCities]);

    const getPlaceDetails = useCallback((placeId: string) => {
        if (!map) return;

        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
            { placeId: placeId, fields: ['name', 'formatted_address'] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    console.log('=== Unassigned City Clicked ===');
                    console.log('Place ID:', placeId);
                    console.log('Name:', place.name);
                    console.log('Address:', place.formatted_address);
                    console.log('==============================');
                } else {
                    console.log('=== Unassigned City Clicked ===');
                    console.log('Place ID:', placeId);
                    console.log('Could not fetch place details');
                    console.log('==============================');
                }
            }
        );
    }, [map]);

    useEffect(() => {
        if (!map) return;

        const featureLayer = map.getFeatureLayer("LOCALITY" as google.maps.FeatureType);

        featureLayer.style = (feature) => {
            const placeId = (feature.feature as google.maps.PlaceFeature)?.placeId;
            const assignment = assignments.find(a => a.placeId === placeId);

            // Other office mapped cities - darker gray (not clickable)
            if (assignment && assignment.officeId !== currentOffice.id) {
                return {
                    fillColor: '#424242',
                    fillOpacity: 0.5,
                    strokeColor: '#212121',
                    strokeWeight: 2
                };
            }

            // Highlight selected cities (both current office and newly selected) - orange
            if (placeId && selectedUnassignedCities.includes(placeId)) {
                return {
                    fillColor: '#E65100',
                    fillOpacity: 0.7,
                    strokeColor: '#BF360C',
                    strokeWeight: 3
                };
            }

            // Unmapped cities - very light boundaries
            return {
                fillColor: '#90CAF9',
                fillOpacity: 0.05,
                strokeColor: '#BBDEFB',
                strokeOpacity: 0.2,
                strokeWeight: 1
            };
        };

        const clickListener = featureLayer.addListener(
            'click',
            (event: google.maps.FeatureMouseEvent) => {
                const placeId = (event.features?.[0] as google.maps.Feature & { placeId?: string })?.placeId;
                if (!placeId) return;

                const existing = assignments.find(a => a.placeId === placeId);

                // Block clicking on other office's cities
                if (existing && existing.officeId !== currentOffice.id) {
                    toast.warning('This city is already assigned to another office');
                    return;
                }

                // Toggle selection for both current office cities and unassigned cities
                setSelectedUnassignedCities(prev => {
                    if (prev.includes(placeId)) {
                        return prev.filter(id => id !== placeId);
                    } else {
                        // Console log the placeId and get name
                        getPlaceDetails(placeId);
                        return [...prev, placeId];
                    }
                });
            }
        );

        return () => {
            google.maps.event.removeListener(clickListener);
        };
    }, [map, assignments, currentOffice, onAssignCity, selectedUnassignedCities, getPlaceDetails]);

    return null;
}

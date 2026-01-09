import { useEffect, useState, useCallback, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { toast } from 'react-toastify';
import { CityAssignment, Office } from './types';
import { getPlaceName } from './placeDetails';
import { fetchBoundary } from './osmBoundary';
import { isBoundaryInside } from './geoUtils';
import { testWithViewportDetails } from '../utils/boundaryTest';

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
    const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
    const searchBoxRef = useRef<HTMLInputElement>(null);
    const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

    // Generate unique color for each office ID
    const generateOfficeColor = (officeId: string) => {
        let hash = 0;
        for (let i = 0; i < officeId.length; i++) {
            hash = ((hash << 5) - hash) + officeId.charCodeAt(i);
            hash = hash & hash;
        }

        const hue = Math.abs(hash) % 360;
        const saturation = 60 + (Math.abs(hash) % 20);
        const lightness = 45;

        return {
            fill: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            stroke: `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`
        };
    };

    useEffect(() => {
        if (initialSelectedCities.length > 0) {
            setSelectedUnassignedCities(initialSelectedCities);
        }
    }, [initialSelectedCities]);

    const getPlaceDetails = useCallback(async (placeId: string) => {
        if (!map) return;

        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
            { placeId: placeId, fields: ['name', 'formatted_address', 'geometry'] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    const viewport = place.geometry?.viewport;
                    const location = place.geometry?.location;

                    console.log('=== City Details ===');
                    console.log('Place ID:', placeId);
                    console.log('Name:', place.name);
                    console.log('Address:', place.formatted_address);
                    console.log('Viewport:', {
                        northeast: { lat: viewport?.getNorthEast().lat(), lng: viewport?.getNorthEast().lng() },
                        southwest: { lat: viewport?.getSouthWest().lat(), lng: viewport?.getSouthWest().lng() }
                    });
                    console.log('Location:', { lat: location?.lat(), lng: location?.lng() });
                    console.log('==================');
                } else {
                    console.log('Could not fetch place details for:', placeId);
                }
                setPendingPlaceId(null);
            }
        );
    }, [map]);

    useEffect(() => {
        if (pendingPlaceId) {
            getPlaceDetails(pendingPlaceId);
        }
    }, [pendingPlaceId, getPlaceDetails]);

    useEffect(() => {
        if (!map) return;

        // Apply styling to all feature types
        const featureTypes = ["LOCALITY", "ADMINISTRATIVE_AREA_LEVEL_1", "COUNTRY"];

        featureTypes.forEach((featureType) => {
            const featureLayer = map.getFeatureLayer(featureType as google.maps.FeatureType);

            featureLayer.style = (feature) => {
                const placeId = (feature.feature as any)?.placeId;
                const assignment = assignments.find(a => a.placeId === placeId);

                // Highlight selected features (search results or clicked cities) - orange
                if (placeId && selectedUnassignedCities.includes(placeId)) {
                    return {
                        fillColor: '#E65100',
                        fillOpacity: 0.7,
                        strokeColor: '#BF360C',
                        strokeWeight: 3
                    };
                }

                // Office-assigned cities - use dynamically generated office-specific color
                // Office-assigned cities (ONLY if not explicitly unselected)
                if (
                    featureType === "LOCALITY" &&
                    assignment &&
                    (
                        assignment.officeId !== currentOffice.id ||
                        selectedUnassignedCities.includes(placeId)
                    )
                ) {
                    const officeColor = generateOfficeColor(assignment.officeId);
                    return {
                        fillColor: officeColor.fill,
                        fillOpacity: 0.6,
                        strokeColor: officeColor.stroke,
                        strokeWeight: 2
                    };
                }


                // Default styling - very light boundaries
                return {
                    fillColor: '#90CAF9',
                    fillOpacity: 0.05,
                    strokeColor: '#BBDEFB',
                    strokeOpacity: 0.2,
                    strokeWeight: 1
                };
            };

            // Only add click listener once
            if (featureType === "LOCALITY" && !listenerRef.current) {
                listenerRef.current = featureLayer.addListener(
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

                        setSelectedUnassignedCities(prev => {
                            if (prev.includes(placeId)) {
                                return prev.filter(id => id !== placeId);
                            } else {
                                setPendingPlaceId(placeId);
                                return [...prev, placeId];
                            }
                        });
                    }
                );
            }
        });

        return () => {
            // Cleanup handled by feature layer
        };
    }, [map, assignments, currentOffice, selectedUnassignedCities]);

    useEffect(() => {
        if (!map || !searchBoxRef.current) return;

        const searchBox = new google.maps.places.SearchBox(searchBoxRef.current);

        const placesChangedListener = searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (!places || places.length === 0) return;

            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;

            console.log('=== Search Result ===');
            console.log('Name:', place.name);
            console.log('Address:', place.formatted_address);
            console.log('Place ID:', place.place_id);
            console.log('=====================');

            // Check if city belongs to another office
            const placeId = place.place_id as string;
            const existing = assignments.find(a => a.placeId === placeId);

            if (existing && existing.officeId !== currentOffice.id) {
                toast.warning('This city is already assigned to another office');
                return;
            }

            // Apply boundaries by adding placeId to selected cities
            if (place.place_id) {
                setSelectedUnassignedCities(prev => {
                    const placeId = place.place_id as string;
                    if (!prev.includes(placeId)) {
                        return [...prev, placeId];
                    }
                    return prev;
                });
            }
        });

        const boundsChangedListener = map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });

        return () => {
            google.maps.event.removeListener(placesChangedListener);
            google.maps.event.removeListener(boundsChangedListener);
        };
    }, [map, assignments, currentOffice]);

    const clearNonCitySelections = useCallback(() => {
        setSelectedUnassignedCities(prev => {
            if (prev.length === 0) return prev;
            return prev.slice(0, -1);
        });
    }, []);

    const validateCityInsideOffice = async (
        cityPlaceId: string,
        officePlaceId: string
    ) => {
        if (!map) return false;

        try {
            const cityName = await getPlaceName(map, cityPlaceId);
            const officeName = await getPlaceName(map, officePlaceId);

            if (!cityName || !officeName) return false;

            const cityBoundary = await fetchBoundary(cityName);
            const officeBoundary = await fetchBoundary(officeName);

            return isBoundaryInside(officeBoundary, cityBoundary);
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexDirection: 'row-reverse'
        }}>
            {selectedUnassignedCities.length > 0 && (
                <button
                    onClick={clearNonCitySelections}
                    style={{
                        padding: '10px 14px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Undo
                </button>
            )}
            <input
                ref={searchBoxRef}
                type="text"
                placeholder="Search for cities..."
                style={{
                    boxSizing: 'border-box',
                    border: '1px solid transparent',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    fontSize: '16px',
                    padding: '0 11px',
                    textOverflow: 'ellipsis',
                    width: '300px',
                    height: '40px'
                }}
            />
            <div style={{
                backgroundColor: 'white',
                padding: '10px 14px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 500
            }}>
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    backgroundColor: '#E65100',
                    border: `2px solid #BF360C`,
                }} />
                <span style={{
                    fontSize: '15px',
                    color: '#1a1a1a',
                    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
                    letterSpacing: '0.3px'
                }}>
                    {currentOffice.name} Cities
                </span>
            </div>
        </div>
    );
}

// testWithViewportDetails({
//     northeast: { lat: 24.712536234362236, lng: 74.47643242348471 },
//     southwest: { lat: 20.11922887217097, lng: 68.17751181716889 }
// }, {
//     northeast: { lat: 21.20444006048324, lng: 73.92528996575024 },
//     southwest: { lat: 21.16131995762501, lng: 73.88857997831327 }
// });

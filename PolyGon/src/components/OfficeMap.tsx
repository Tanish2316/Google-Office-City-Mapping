import React, { useEffect, useState } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';

interface OfficeMapProps {
    existingOffices: {
        id: string;
        boundary: { lat: number; lng: number }[];
    }[];
}

const MapContent = ({ existingOffices }: OfficeMapProps) => {
    const map = useMap();
    const [drawingManager, setDrawingManager] = useState<any>(null);

    useEffect(() => {
        if (!map || drawingManager) return;

        const dm = new window.google.maps.drawing.DrawingManager({
            drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            polygonOptions: {
                fillColor: '#2196F3',
                editable: true
            }
        });

        dm.setMap(map);
        setDrawingManager(dm);

        window.google.maps.event.addListener(dm, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
            const coords = (event.overlay as google.maps.Polygon)
                .getPath()
                .getArray()
                .map((p: google.maps.LatLng) => ({
                    lat: p.lat(),
                    lng: p.lng()
                }));

            console.log('New office boundary:', coords);
        });
    }, [map]);

    useEffect(() => {
        if (!map) return;

        // Remove previously drawn polygons if needed
        const polygons: google.maps.Polygon[] = [];

        existingOffices.forEach((office) => {
            const polygon = new window.google.maps.Polygon({
                paths: office.boundary,
                fillColor: '#808080',
                fillOpacity: 0.5,
                clickable: false,
                map: map
            });
            polygons.push(polygon);
        });

        // Cleanup polygons on unmount or when existingOffices changes
        return () => {
            polygons.forEach((polygon) => polygon.setMap(null));
        };
    }, [map, existingOffices]);

    return null;
};

const OfficeMap = ({ existingOffices }: OfficeMapProps) => {
    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Map
                defaultZoom={10}
                defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
            >
                <MapContent existingOffices={existingOffices} />
            </Map>
        </div>
    );
};

export default OfficeMap;

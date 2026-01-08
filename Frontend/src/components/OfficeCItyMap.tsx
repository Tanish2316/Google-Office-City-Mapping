import {
    APIProvider,
    Map,
    useMap
} from '@vis.gl/react-google-maps';
import { CityAssignment, Office } from './types';
import { CityLayer } from './CityLayer';

interface Props {
    apiKey: string;
    mapId: string;
    currentOffice: Office;
    assignments: CityAssignment[];
    onAssignCity: (cityId: string) => void;
    initialSelectedCities?: string[];  // Optional: cities to highlight initially
}

export default function OfficeCityMap({
    apiKey,
    mapId,
    currentOffice,
    assignments,
    onAssignCity,
    initialSelectedCities = []
}: Props) {
    return (
        <APIProvider apiKey={apiKey} libraries={['places']}>
            <Map
                mapId={mapId}
                defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                defaultZoom={5}
                tilt={0}
                heading={0}
                style={{ width: '100%', height: '100vh' }}
            >
                <CityLayer
                    currentOffice={currentOffice}
                    assignments={assignments}
                    onAssignCity={onAssignCity}
                    initialSelectedCities={initialSelectedCities}
                />
            </Map>
        </APIProvider>
    );
}
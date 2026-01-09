import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import OfficeMap from './components/OfficeMap';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key';
const API_KEY = CryptoJS.AES.decrypt(
  process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
  SECRET_KEY
).toString(CryptoJS.enc.Utf8);


const existingOffices = [
  {
    id: 'office-1',
    boundary: [
      { lat: 40.72, lng: -74.01 },
      { lat: 40.73, lng: -74.00 },
      { lat: 40.71, lng: -73.99 }
    ]
  }
];

const App = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <APIProvider
        apiKey={API_KEY}
        libraries={['drawing']}
      >
        <OfficeMap existingOffices={existingOffices} />
      </APIProvider>
    </div>
  );
};

export default App;

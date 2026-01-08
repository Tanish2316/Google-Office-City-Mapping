import { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OfficeCityMap from "./components/OfficeCItyMap";
import { CityAssignment, ApiResponse } from "./components/types";
import CryptoJS from 'crypto-js';

const getOfficeIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('officeId');
};

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key';
const API_KEY = CryptoJS.AES.decrypt(
  process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
  SECRET_KEY
).toString(CryptoJS.enc.Utf8);


export default function App() {
  const [officeId, setOfficeId] = useState<string | null>(getOfficeIdFromUrl());
  const [currentOfficeCities, setCurrentOfficeCities] = useState<CityAssignment[]>([]);
  const [otherOfficeCities, setOtherOfficeCities] = useState<CityAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!officeId) {
      setLoading(false);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get-city-office?officeId=${officeId}`);
        console.log('Fetched assignments:', response.data);
        setCurrentOfficeCities(response.data[0].currentOfficeCities || []);
        setOtherOfficeCities(response.data[0].otherOfficeCities || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast.error('Failed to fetch office data');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [officeId]);

  if (!officeId) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #3949ab 0%, #7986cb 50%, #c5cae9 100%)',
        fontFamily: "'Poppins', 'Segoe UI', sans-serif"
      }}>
        <ToastContainer position="top-center" autoClose={3000} style={{ fontSize: '18px', width: '400px' }} />

        <div style={{
          backgroundColor: 'white',
          padding: '50px 60px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.18)',
          textAlign: 'center'
        }}>
          <h2 style={{
            margin: '0 0 10px',
            color: '#1a237e',
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>🗺️ Office City Map</h2>

          <p style={{
            margin: '0 0 30px',
            color: '#666',
            fontSize: '14px'
          }}>Enter your office ID to view the map</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const id = formData.get('officeId') as string;
            if (id) {
              window.history.pushState({}, '', `?officeId=${id}`);
              setOfficeId(id);
            }
          }} style={{ display: 'flex', gap: '15px' }}>
            <input
              type="text"
              name="officeId"
              placeholder="Enter Office ID"
              style={{
                padding: '14px 20px',
                fontSize: '15px',
                width: '320px',
                borderRadius: '10px',
                border: '2px solid #c5cae9',
                outline: 'none',
                fontFamily: 'inherit',
                color: '#333'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, #3949ab, #5c6bc0)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'inherit',
                letterSpacing: '0.5px'
              }}
            >
              Load Map
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const allAssignments = [...currentOfficeCities, ...otherOfficeCities];

  const currentOfficePlaceIds = currentOfficeCities.map(city => city.placeId);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    setOfficeId(null);
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        style={{ fontSize: '18px', width: '400px' }}
      />
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '20px',
          zIndex: 1000,
          padding: '14px 28px',
          fontSize: '16px',
          background: 'white',
          color: '#1a237e',
          border: '2px solid #1a237e',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontFamily: "'Poppins', 'Segoe UI', sans-serif",
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
        }}
      >
        ← Back
      </button>
      <OfficeCityMap
        apiKey={API_KEY}
        mapId="afdbeb42fd7fb53437c9260f"
        currentOffice={{
          id: officeId,
          name: 'Current Office',
          color: '#4CAF50'
        }}
        assignments={allAssignments}
        onAssignCity={(placeId) => {
          console.log('Assign city:', placeId);
        }}
        initialSelectedCities={currentOfficePlaceIds}
      />
    </>
  );
}

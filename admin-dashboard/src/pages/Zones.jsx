/**
 * Zones Page
 * Display all zones with management options
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiRefreshCw, FiPlus, FiAlertCircle, FiVideo } from 'react-icons/fi';
import { zoneAPI } from '../api/api';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [zoneCounts, setZoneCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch zones and person counts
  const fetchZones = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await zoneAPI.getAllZones();

      if (response.success && response.data) {
        setZones(response.data);

        // Fetch person count for each zone
        const counts = {};
        for (const zone of response.data) {
          try {
            const personsData = await zoneAPI.getPersonsInZone(zone.Zone_ID);
            counts[zone.Zone_ID] = personsData.data?.length || 0;
          } catch (err) {
            counts[zone.Zone_ID] = 0;
          }
        }
        setZoneCounts(counts);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError('Failed to load zones');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchZones, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zones</h1>
          <p className="text-gray-600 mt-1">Manage tracking zones</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchZones}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div
            key={zone.Zone_ID}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiMapPin className="text-blue-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {zoneCounts[zone.Zone_ID] || 0}
                </p>
                <p className="text-xs text-gray-500">persons</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {zone.Zone_Name}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {zone.Description || 'No description'}
            </p>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Zone ID: {zone.Zone_ID}</span>
              </div>

              {/* Live View Button for Zone 1 (Main Building Floor 1) */}
              {zone.Zone_id === 1 && (
                <button
                  onClick={() => navigate('/zone1-live')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <FiVideo size={16} />
                  <span>🔴 Live View</span>
                </button>
              )}

              <Link
                to={`/zones/${zone.Zone_ID}`}
                className="block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {zones.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FiMapPin size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Zones Found</h3>
          <p className="text-gray-500">No tracking zones have been configured yet.</p>
        </div>
      )}
    </div>
  );
};

export default Zones;

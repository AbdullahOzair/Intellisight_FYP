/**
 * Dashboard Page
 * Main dashboard showing real-time zone tracking, statistics, and recent activity
 * Matches the IntelliSight design reference
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiMapPin, 
  FiClock, 
  FiRefreshCw,
  FiAlertCircle,
  FiActivity 
} from 'react-icons/fi';
import { GiTeacher } from 'react-icons/gi';
import { statsAPI, timetableAPI, zoneAPI } from '../api/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalZones: 0,
    activePersons: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [zoneOverview, setZoneOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Polling interval (5 seconds)
  const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000;

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [dashboardStats, recentData, zonesData] = await Promise.all([
        statsAPI.getDashboardStats(),
        timetableAPI.getRecentActivity(10),
        zoneAPI.getAllZones(),
      ]);

      // Update stats with defensive checks
      if (dashboardStats) {
        setStats({
          totalStudents: dashboardStats.totalStudents || 0,
          totalTeachers: dashboardStats.totalTeachers || 0,
          totalZones: dashboardStats.totalZones || 0,
          activePersons: dashboardStats.activePersons || 0,
        });
      }

      // Update recent activity with validation
      if (recentData?.success && Array.isArray(recentData.data)) {
        setRecentActivity(recentData.data.slice(0, 10));
      } else {
        setRecentActivity([]);
      }

      // Fetch persons in each zone for zone overview
      if (zonesData?.success && Array.isArray(zonesData.data)) {
        const zonePromises = zonesData.data.map(async (zone) => {
          try {
            const personsData = await zoneAPI.getPersonsInZone(zone.Zone_ID);
            return {
              ...zone,
              personCount: Array.isArray(personsData.data) ? personsData.data.length : 0,
            };
          } catch (err) {
            console.error(`Error fetching persons for zone ${zone.Zone_ID}:`, err);
            return {
              ...zone,
              personCount: 0,
            };
          }
        });

        const zonesWithCounts = await Promise.all(zonePromises);
        setZoneOverview(zonesWithCounts);
      } else {
        setZoneOverview([]);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
      setLoading(false);
      
      // Set safe defaults on error
      setStats(prev => prev.totalZones === 0 ? {
        totalStudents: 0,
        totalTeachers: 0,
        totalZones: 0,
        activePersons: 0,
      } : prev);
      setRecentActivity([]);
      setZoneOverview([]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [POLLING_INTERVAL]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading && stats.totalZones === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time zone tracking overview</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {format(lastUpdate, 'HH:mm:ss')}
          </div>
          <button
            onClick={handleRefresh}
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
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students in Department</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers in Department</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTeachers}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <GiTeacher className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        {/* Active Persons Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Currently in Building</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activePersons}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <FiActivity className="text-purple-600" size={28} />
            </div>
          </div>
        </div>

        {/* Active Zones Card */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Zones</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalZones}</p>
            </div>
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiMapPin className="text-indigo-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiClock size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Person
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentActivity.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {activity.student?.Name?.[0] || activity.teacher?.Name?.[0] || '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.student?.Name || activity.teacher?.Name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.PersonType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {activity.zone?.Zone_Name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {activity.Timestamp ? format(new Date(activity.Timestamp), 'HH:mm a') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Zone Overview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Zone Overview</h2>
          
          {zoneOverview.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiMapPin size={48} className="mx-auto mb-2 opacity-50" />
              <p>No zones configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zoneOverview.map((zone) => (
                <Link
                  key={zone.Zone_ID}
                  to={`/zones/${zone.Zone_ID}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiMapPin className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{zone.Zone_Name}</p>
                        <p className="text-xs text-gray-500">Zone {zone.Zone_ID}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{zone.personCount}</p>
                      <p className="text-xs text-gray-500">persons</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

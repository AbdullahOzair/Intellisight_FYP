/**
 * Settings Page
 * Application configuration and preferences
 */

import React, { useState } from 'react';
import { FiSettings, FiSave } from 'react-icons/fi';

const Settings = () => {
  const [settings, setSettings] = useState({
    pollingInterval: parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  });

  const handleSave = () => {
    // In a real app, this would save to backend or update environment
    alert('Settings saved! (This is a demo - actual saving would require backend implementation)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Configure dashboard preferences</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">General Settings</h2>
        
        <div className="space-y-6">
          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <input
              type="text"
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings({...settings, apiBaseUrl: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="http://localhost:3000/api"
            />
            <p className="mt-1 text-sm text-gray-500">
              The base URL for backend API endpoints
            </p>
          </div>

          {/* Polling Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Real-time Update Interval
            </label>
            <select
              value={settings.pollingInterval}
              onChange={(e) => setSettings({...settings, pollingInterval: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              How often to refresh data from the server
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiSave size={20} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">System Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Application Name</p>
            <p className="text-lg font-semibold text-gray-800">IntelliSight Dashboard</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-lg font-semibold text-gray-800">1.0.0</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current API URL</p>
            <p className="text-sm font-mono text-gray-800 break-all">{settings.apiBaseUrl}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Update Interval</p>
            <p className="text-lg font-semibold text-gray-800">{settings.pollingInterval / 1000}s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

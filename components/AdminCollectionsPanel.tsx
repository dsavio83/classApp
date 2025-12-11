import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { User } from '../types';

interface Collection {
  name: string;
  displayName: string;
  count: number;
}

interface WebmasterCredentials {
  username: string;
  password: string;
}

export const AdminCollectionsPanel: React.FC = () => {
  const { session, logout } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [importLoading, setImportLoading] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<WebmasterCredentials>({
    username: '',
    password: ''
  });
  const [importData, setImportData] = useState<Record<string, any>>({});
  const [showImportModal, setShowImportModal] = useState<string | null>(null);

  // Check if user is admin
  if (!session.user || session.user.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            Access denied. This page is restricted to admin users only.
          </p>
        </div>
      </div>
    );
  }

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  };

  const handleWebmasterAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const response = await apiCall('/auth/webmaster-login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (response.webmaster) {
        setIsAuthenticated(true);
        await loadCollections();
      }
    } catch (error: any) {
      alert(`Authentication failed: ${error.message || 'Invalid credentials'}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
  };

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/collections/list');
      setCollections(data);
    } catch (error: any) {
      console.error('Failed to load collections:', error);
      alert('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (collectionName: string) => {
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/collections/export/${collectionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`${collectionName} collection exported successfully!`);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const handleImport = async (collectionName: string) => {
    if (!importData[collectionName]) {
      alert('Please select a file to import');
      return;
    }

    setImportLoading(collectionName);
    try {
      const response = await apiCall(`/collections/import/${collectionName}`, {
        method: 'POST',
        body: JSON.stringify({
          data: importData[collectionName]
        })
      });

      if (response.success) {
        alert(`Import completed successfully!\nInserted: ${response.result.inserted}\nErrors: ${response.result.errors}`);
        await loadCollections();
        setShowImportModal(null);
        setImportData(prev => ({ ...prev, [collectionName]: null }));
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setImportLoading(null);
    }
  };

  const handleClearDatabase = async (collectionName: string) => {
    const confirmed = window.confirm(`Are you sure you want to clear all data from ${collectionName}? This action cannot be undone.`);
    if (!confirmed) return;

    setClearLoading(collectionName);
    try {
      const response = await apiCall(`/collections/clear/${collectionName}`, {
        method: 'DELETE'
      });

      if (response.success) {
        alert(`${collectionName} database cleared successfully!`);
        await loadCollections();
      }
    } catch (error: any) {
      console.error('Clear failed:', error);
      alert('Clear failed: ' + error.message);
    } finally {
      setClearLoading(null);
    }
  };

  const handleFileUpload = (collectionName: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(prev => ({ ...prev, [collectionName]: data.data || data }));
        alert('File loaded successfully. Click Import to proceed.');
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
              Webmaster Access
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              Enter webmaster credentials to access Database Management
            </p>
            <form onSubmit={handleWebmasterAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md transition duration-200"
              >
                {authLoading ? 'Authenticating...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Database Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage database collections - Export, Import and Clear data
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading collections...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Import
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Export
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Clear DB
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {collections.map((collection, index) => (
                  <tr key={collection.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                      {collection.displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                        {collection.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setShowImportModal(collection.name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition duration-200"
                      >
                        Import
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleExport(collection.name)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition duration-200"
                      >
                        Export
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleClearDatabase(collection.name)}
                        disabled={clearLoading === collection.name || collection.count === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-xs transition duration-200"
                      >
                        {clearLoading === collection.name ? 'Clearing...' : 'Clear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {collections.find(c => c.name === showImportModal)?.displayName} - Import
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select JSON file
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(showImportModal, file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {importData[showImportModal] && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    File loaded! {Array.isArray(importData[showImportModal]) ? importData[showImportModal].length : 'N/A'} records found.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleImport(showImportModal)}
                  disabled={!importData[showImportModal] || importLoading === showImportModal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  {importLoading === showImportModal ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(null);
                    setImportData(prev => ({ ...prev, [showImportModal]: null }));
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
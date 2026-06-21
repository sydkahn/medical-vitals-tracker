// App.js
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import DataEntryForm from './components/DataEntryForm';
import DataGrid from './components/DataGrid';
import ReportView from './components/ReportView';
import ImportExport from './components/ImportExport';
import axios from 'axios';

const API_BASE_URL = '/api';

const App = () => {
  const [vitalRecords, setVitalRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('entry');
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const showMessage = useCallback((type, text) => {
    setStatusMessage({ type, text });
  }, []);

  // Fetch data from the backend on initial render
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/vitals`);
        setVitalRecords(response.data);
      } catch (error) {
        console.error("Error fetching vital records:", error);
        // Handle error appropriately (e.g., show a message to the user)
        // You might want to display an error message in the UI
      } finally {
        setLoading(false); // Set loading to false regardless of success/error
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs only once on mount

  // Update vitalRecords state when a record is added/updated/deleted
  const handleSaveRecord = async (record) => {
    try {
      if (editingRecordId) {
        // Update existing record
        await axios.put(`${API_BASE_URL}/vitals/${editingRecordId}`, record);
      } else {
        // Add new record
        await axios.post(`${API_BASE_URL}/vitals`, record);
      }
      // Fetch updated data after successful add/update
      const response = await axios.get(`${API_BASE_URL}/vitals`);
      setVitalRecords(response.data);
      setEditingRecordId(null); // Clear editing state
      } catch (error) {
        console.error("Error saving vital record:", error);
        showMessage('error', 'Error saving record. Please check the console for details.');
      }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/vitals/${id}`);
        // Fetch updated data after successful deletion
        const response = await axios.get(`${API_BASE_URL}/vitals`);
        setVitalRecords(response.data);
      } catch (error) {
        console.error("Error deleting vital record:", error);
        showMessage('error', 'Error deleting record. Please check the console for details.');
      }
    }
  };

  const handleEditRecord = (id) => {
    setEditingRecordId(id);
    setActiveTab('entry');
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
  };

  if (loading) {
    return <div className="loading">Loading vital records...</div>; // Show a loading indicator
  }

  return (
    <div className="app">
      {statusMessage && (
        <div className={`status-bar ${statusMessage.type}`}>
          <span>{statusMessage.text}</span>
          <button className="status-dismiss" onClick={() => setStatusMessage(null)}>x</button>
        </div>
      )}
      <header className="app-header">
        <h1>Medical Vital Statistics Tracker</h1>
        <nav>
          <button
            className={activeTab === 'entry' ? 'active' : ''}
            onClick={() => setActiveTab('entry')}
          >
            Data Entry
          </button>
          <button
            className={activeTab === 'grid' ? 'active' : ''}
            onClick={() => setActiveTab('grid')}
          >
            Data Grid
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button
            className={activeTab === 'import' ? 'active' : ''}
            onClick={() => setActiveTab('import')}
          >
            Import/Export
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'entry' && (
          <DataEntryForm
            onSave={handleSaveRecord}
            onCancel={handleCancelEdit}
            editingRecord={vitalRecords.find(r => r.id === editingRecordId)}
            onMessage={showMessage}
          />
        )}

        {activeTab === 'grid' && (
          <DataGrid
            records={vitalRecords}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView records={vitalRecords} />
        )}

        {activeTab === 'import' && (
          <ImportExport
            records={vitalRecords}
            onMessage={showMessage}
            onImport={async (newRecords) => {
              // This is a simplified import - you might want to batch POST or validate more strictly
              try {
                 for (const record of newRecords) {
                     // Ensure the record structure matches the API expectation
                     // Omit 'id' if it exists, as the database will generate a new one
                     const { id, ...recordWithoutId } = record;
                     await axios.post(`${API_BASE_URL}/vitals`, recordWithoutId);
                 }
                  const response = await axios.get(`${API_BASE_URL}/vitals`);
                  setVitalRecords(response.data);
                  showMessage('success', `Successfully imported ${newRecords.length} records.`);
               } catch (error) {
                   console.error("Error importing records:", error);
                   showMessage('error', 'Error importing records. Please check the console for details.');
               }
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
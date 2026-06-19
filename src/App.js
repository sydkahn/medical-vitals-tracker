// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import DataEntryForm from './components/DataEntryForm';
import DataGrid from './components/DataGrid';
import ReportView from './components/ReportView';
import ImportExport from './components/ImportExport';

const App = () => {
  const [vitalRecords, setVitalRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('entry');
  const [editingRecordId, setEditingRecordId] = useState(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedRecords = localStorage.getItem('vitalRecords');
    if (savedRecords) {
      setVitalRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem('vitalRecords', JSON.stringify(vitalRecords));
  }, [vitalRecords]);

  const handleSaveRecord = (record) => {
    if (editingRecordId) {
      // Update existing record
      setVitalRecords(prev => 
        prev.map(r => r.id === editingRecordId ? { ...record, id: editingRecordId } : r)
      );
      setEditingRecordId(null);
    } else {
      // Add new record
      const newRecord = { ...record, id: Date.now() };
      setVitalRecords(prev => [...prev, newRecord]);
    }
  };

  const handleDeleteRecord = (id) => {
    setVitalRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleEditRecord = (id) => {
    setEditingRecordId(id);
    setActiveTab('entry');
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
  };

  return (
    <div className="app">
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
            onImport={setVitalRecords}
          />
        )}
      </main>
    </div>
  );
};

export default App;
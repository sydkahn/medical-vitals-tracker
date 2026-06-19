// components/ImportExport.js
import React, { useState } from 'react';

const ImportExport = ({ records, onImport }) => {
  const [importStatus, setImportStatus] = useState('');

  const exportToJSON = () => {
    // Create backup before exporting
    const backup = {
      timestamp: new Date().toISOString(),
      data: records
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vital_records_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToCSV = () => {
    // Create backup before exporting
    const headers = [
      'patientInitials',
      'dateTime',
      'glucose',
      'weight',
      'temperature',
      'temperatureUnit',
      'systolic',
      'diastolic',
      'heartRate',
      'oxygenSaturation',
      'notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => 
        headers.map(header => `"${record[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
    
    const exportFileDefaultName = `vital_records_backup_${new Date().toISOString().slice(0,10)}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importedData = [];
        
        if (file.type === 'application/json') {
          const parsed = JSON.parse(content);
          importedData = Array.isArray(parsed) ? parsed : parsed.data || [];
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          importedData = parseCSV(content);
        } else {
          throw new Error('Unsupported file format');
        }
        
        // Validate and filter out invalid records
        const validRecords = importedData.filter(record => {
          // Check required fields
          if (!record.patientInitials || typeof record.patientInitials !== 'string' || record.patientInitials.length !== 3) {
            return false;
          }
          
          // Validate date format
          if (!record.dateTime || isNaN(Date.parse(record.dateTime))) {
            return false;
          }
          
          // Additional validation could go here
          return true;
        });
        
        // Remove duplicates based on ID or combination of fields
        const existingIds = new Set(records.map(r => r.id));
        const newRecords = validRecords.filter(record => !existingIds.has(record.id));
        
        if (newRecords.length === 0) {
          setImportStatus('No new records to import (all were duplicates)');
          return;
        }
        
        // Add new records to existing ones
        const updatedRecords = [...records, ...newRecords];
        onImport(updatedRecords);
        
        setImportStatus(`Successfully imported ${newRecords.length} new records (${validRecords.length - newRecords.length} duplicates skipped)`);
      } catch (error) {
        setImportStatus(`Error importing file: ${error.message}`);
      }
    };
    
    reader.readAsText(file);
  };

  // Simple CSV parser
  const parseCSV = (csv) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      if (currentLine.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentLine[j].replace(/"/g, '').trim();
        }
        result.push(obj);
      }
    }
    return result;
  };

  return (
    <div className="import-export-container">
      <h2>Import/Export Data</h2>
      
      <div className="export-section">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <button onClick={exportToJSON} className="export-btn json-btn">Export as JSON</button>
          <button onClick={exportToCSV} className="export-btn csv-btn">Export as CSV</button>
        </div>
        <p><small>Note: All exports automatically create a backup with timestamp</small></p>
      </div>
      
      <div className="import-section">
        <h3>Import Data</h3>
        <div className="import-controls">
          <input 
            type="file" 
            accept=".json,.csv" 
            onChange={handleFileImport} 
          />
          <p><small>Supported formats: JSON, CSV</small></p>
          <p><small>Duplicate records will be automatically rejected</small></p>
        </div>
        {importStatus && (
          <div className={`import-status ${importStatus.includes('Success') ? 'success' : 'error'}`}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExport;
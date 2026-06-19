// src/components/DataGrid.js
import React, { useState } from 'react';

const DataGrid = ({ records, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Safely filter records based on search term
  const filteredRecords = records.filter(record => {
    // Ensure record is an object before accessing properties
    if (!record || typeof record !== 'object') {
      return false; // Exclude invalid records
    }

    // Normalize the search term
    const normalizedSearchTerm = searchTerm.toLowerCase();

    // Check if any searchable field contains the search term
    // Use optional chaining (?.) and nullish coalescing (??) to prevent errors
    // Adjust the fields being searched as needed (e.g., include more fields)
    return (
      (record.patient_initials ?? '').toString().toLowerCase().includes(normalizedSearchTerm) ||
      (record.datetime_recorded ?? '').toString().toLowerCase().includes(normalizedSearchTerm) ||
      // Add more fields if needed, e.g.:
      // (record.notes ?? '').toString().toLowerCase().includes(normalizedSearchTerm) ||
      false // Default if no match
    );
  });

  // Safely sort records by datetime_recorded (descending)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!a || !b) return 0; // Handle potential null records during sort
    const dateA = new Date(a.datetime_recorded);
    const dateB = new Date(b.datetime_recorded);
    // Ensure dates are valid before comparing
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        // If one date is invalid, put it at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        return isNaN(dateA.getTime()) ? 1 : -1;
    }
    return dateB - dateA; // Sort newest first
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Helper function to format date for display (adjust format as needed)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    // Example: Format to locale string (e.g., "6/19/2026, 5:21:00 PM")
    return date.toLocaleString();
  };

  // Helper function to format numbers (handle null/undefined)
  const formatNumber = (num) => {
    if (num == null) return 'N/A'; // Or return '' for empty cells
    return num;
  };

  return (
    <div className="data-grid">
      <h2>Data Grid</h2>
      <div className="grid-controls">
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      {sortedRecords.length === 0 ? (
        <p>No vital records found matching the search term.</p>
      ) : (
        <table className="records-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date/Time</th>
              <th>Glucose</th>
              <th>Weight</th>
              <th>Temp</th>
              <th>BP (Sys/Dia)</th>
              <th>HR</th>
              <th>SpO2</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.patient_initials || 'N/A'}</td>
                <td>{formatDate(record.datetime_recorded)}</td>
                <td>{formatNumber(record.glucose)}</td>
                <td>{formatNumber(record.weight)}</td>
                <td>
                  {record.temperature != null ? `${record.temperature}°${record.temperature_unit || '?'}` : 'N/A'}
                </td>
                <td>
                  {record.systolic != null && record.diastolic != null ? `${record.systolic}/${record.diastolic}` : 'N/A'}
                </td>
                <td>{formatNumber(record.heart_rate)}</td>
                <td>{record.oxygen_saturation != null ? `${record.oxygen_saturation}%` : 'N/A'}</td>
                <td>{record.notes || ''}</td>
                <td>
                  <button onClick={() => onEdit(record.id)}>Edit</button>
                  <button onClick={() => onDelete(record.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DataGrid;
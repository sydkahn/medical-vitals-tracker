// components/DataGrid.js
import React, { useState } from 'react';

const DataGrid = ({ records, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter records based on search term
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.patientInitials.toLowerCase().includes(searchLower) ||
      record.dateTime.toLowerCase().includes(searchLower) ||
      record.glucose?.toString().includes(searchLower) ||
      record.weight?.toString().includes(searchLower) ||
      record.temperature?.toString().includes(searchLower) ||
      record.systolic?.toString().includes(searchLower) ||
      record.diastolic?.toString().includes(searchLower) ||
      record.heartRate?.toString().includes(searchLower) ||
      record.oxygenSaturation?.toString().includes(searchLower) ||
      record.notes.toLowerCase().includes(searchLower)
    );
  });

  // Sort records
  const sortedRecords = [...filteredRecords];
  if (sortConfig.key) {
    sortedRecords.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedClass = (name) => {
    if (sortConfig.key === name) {
      return sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc';
    }
    return '';
  };

  return (
    <div className="data-grid-container">
      <div className="grid-controls">
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="table-responsive">
        <table className="data-grid">
          <thead>
            <tr>
              <th onClick={() => requestSort('patientInitials')} className={getSortedClass('patientInitials')}>
                Patient
              </th>
              <th onClick={() => requestSort('dateTime')} className={getSortedClass('dateTime')}>
                Date/Time
              </th>
              <th onClick={() => requestSort('glucose')} className={getSortedClass('glucose')}>
                Glucose
              </th>
              <th onClick={() => requestSort('weight')} className={getSortedClass('weight')}>
                Weight
              </th>
              <th>Temp</th>
              <th>Blood Pressure</th>
              <th onClick={() => requestSort('heartRate')} className={getSortedClass('heartRate')}>
                Heart Rate
              </th>
              <th onClick={() => requestSort('oxygenSaturation')} className={getSortedClass('oxygenSaturation')}>
                O2 Sat
              </th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length > 0 ? (
              sortedRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.patientInitials}</td>
                  <td>{new Date(record.dateTime).toLocaleString()}</td>
                  <td>{record.glucose || '-'}</td>
                  <td>{record.weight || '-'} {record.weight ? (record.weightUnit || '') : ''}</td>
                  <td>{record.temperature || '-'}°{record.temperatureUnit || 'F'}</td>
                  <td>{record.systolic ? `${record.systolic}/${record.diastolic}` : '-'}</td>
                  <td>{record.heartRate || '-'} bpm</td>
                  <td>{record.oxygenSaturation || '-'}%</td>
                  <td>{record.notes || '-'}</td>
                  <td>
                    <button onClick={() => onEdit(record.id)} className="edit-btn">Edit</button>
                    <button onClick={() => onDelete(record.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
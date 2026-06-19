// src/components/ImportExport.js
import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer'; // For PDF generation
// Corrected imports for PDF components - No Cell, Table, TableRow
import { Document, Page, Text, StyleSheet, View as PDFView } from '@react-pdf/renderer';
import { CSVLink } from 'react-csv'; // For CSV export

// Sample Data for Import
const SAMPLE_DATA = [
  {
    "patient_initials": "ABC",
    "datetime_recorded": "2026-06-15T08:00:00.000Z",
    "glucose": 95,
    "weight": 150.5,
    "temperature": 98.6,
    "temperature_unit": "F",
    "systolic": 120,
    "diastolic": 80,
    "heart_rate": 72,
    "oxygen_saturation": 98.5,
    "notes": "Morning check"
  },
  {
    "patient_initials": "XYZ",
    "datetime_recorded": "2026-06-16T14:30:00.000Z",
    "glucose": 102,
    "weight": 152.0,
    "temperature": 99.1,
    "temperature_unit": "F",
    "systolic": 125,
    "diastolic": 82,
    "heart_rate": 78,
    "oxygen_saturation": 97.0,
    "notes": "Afternoon monitoring"
  },
  {
    "patient_initials": "ABC",
    "datetime_recorded": "2026-06-17T20:15:00.000Z",
    "glucose": 88,
    "weight": 150.2,
    "temperature": 98.4,
    "temperature_unit": "F",
    "systolic": 118,
    "diastolic": 78,
    "heart_rate": 70,
    "oxygen_saturation": 99.0,
    "notes": "Evening reading"
  }
];

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString();
};

// Helper function to format numbers
const formatNumber = (num) => {
  if (num == null) return 'N/A';
  return num;
};

// React-PDF Styles - Updated for smaller font and adjusted widths
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 18, // Smaller title font
    textAlign: 'center',
    marginBottom: 10, // Smaller margin
  },
  subtitle: {
    fontSize: 14, // Smaller subtitle font
    marginTop: 10, // Smaller margin
    marginBottom: 5, // Smaller margin
  },
  tableContainer: { // Style for the outer container of the table
    display: "flex",
    flexDirection: "column",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: 'stretch', // Ensure cells stretch vertically
  },
  // Define column widths using flex. Adjust proportions as needed.
  // Total flex should ideally sum to a round number like 10 for easier percentage calc.
  // Decreased font size and padding slightly
  colDateTime: { flex: 1.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 }, // Increased width slightly, reduced font/padding
  colPatient: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8, backgroundColor: '#f0f0f0' }, // Reduced width/font/padding, kept header bg
  colGlucose: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colWeight: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colTemp: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colBPSys: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colBPDia: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colHR: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colSpO2: { flex: 0.8, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 },
  colNotes: { flex: 1.5, borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 3, fontSize: 8 }, // Kept wider for notes, reduced font/padding
  summaryText: {
    fontSize: 10, // Smaller summary font
    marginTop: 5, // Smaller margin
  },
});

// React-PDF Report Component
const PDFReport = ({ filteredRecords, startDate, endDate, selectedInitials }) => {
  // Calculate summary statistics
  const glucoseValues = filteredRecords.filter(r => r.glucose != null).map(r => r.glucose);
  const weightValues = filteredRecords.filter(r => r.weight != null).map(r => r.weight);
  const bpSystolicValues = filteredRecords.filter(r => r.systolic != null).map(r => r.systolic);
  const bpDiastolicValues = filteredRecords.filter(r => r.diastolic != null).map(r => r.diastolic);
  const hrValues = filteredRecords.filter(r => r.heart_rate != null).map(r => r.heart_rate);
  const spo2Values = filteredRecords.filter(r => r.oxygen_saturation != null).map(r => r.oxygen_saturation);

  const stats = {
    glucose: glucoseValues.length > 0 ? {
      avg: (glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length).toFixed(2),
      min: Math.min(...glucoseValues),
      max: Math.max(...glucoseValues)
    } : null,
    weight: weightValues.length > 0 ? {
      avg: (weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(2),
      min: Math.min(...weightValues),
      max: Math.max(...weightValues)
    } : null,
    bp: bpSystolicValues.length > 0 ? {
      sysAvg: (bpSystolicValues.reduce((a, b) => a + b, 0) / bpSystolicValues.length).toFixed(2),
      diaAvg: (bpDiastolicValues.reduce((a, b) => a + b, 0) / bpDiastolicValues.length).toFixed(2),
      sysMin: Math.min(...bpSystolicValues),
      diaMin: Math.min(...bpDiastolicValues),
      sysMax: Math.max(...bpSystolicValues),
      diaMax: Math.max(...bpDiastolicValues),
    } : null,
    hr: hrValues.length > 0 ? {
      avg: (hrValues.reduce((a, b) => a + b, 0) / hrValues.length).toFixed(2),
      min: Math.min(...hrValues),
      max: Math.max(...hrValues)
    } : null,
    spo2: spo2Values.length > 0 ? {
      avg: (spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length).toFixed(2),
      min: Math.min(...spo2Values),
      max: Math.max(...spo2Values)
    } : null,
  };

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Vital Statistics Report</Text>
        <Text>Generated: {new Date().toLocaleString()}</Text>
        <Text>Filters: Initials: {selectedInitials || 'All'}, Start: {startDate || 'Beginning'}, End: {endDate || 'Now'}</Text>
        <Text style={styles.subtitle}>Data Grid</Text>
        {/* Build the table using PDFView components */}
        <PDFView style={styles.tableContainer}>
          {/* Header Row */}
          <PDFView style={styles.tableRow}>
            <Text style={[styles.colDateTime, { backgroundColor: '#f0f0f0' }]}>Date/Time</Text>
            <Text style={[styles.colPatient, { backgroundColor: '#f0f0f0' }]}>Patient</Text>
            <Text style={[styles.colGlucose, { backgroundColor: '#f0f0f0' }]}>Glucose</Text>
            <Text style={[styles.colWeight, { backgroundColor: '#f0f0f0' }]}>Weight</Text>
            <Text style={[styles.colTemp, { backgroundColor: '#f0f0f0' }]}>Temp</Text>
            <Text style={[styles.colBPSys, { backgroundColor: '#f0f0f0' }]}>BP Sys</Text>
            <Text style={[styles.colBPDia, { backgroundColor: '#f0f0f0' }]}>BP Dia</Text>
            <Text style={[styles.colHR, { backgroundColor: '#f0f0f0' }]}>HR</Text>
            <Text style={[styles.colSpO2, { backgroundColor: '#f0f0f0' }]}>SpO2</Text>
            <Text style={[styles.colNotes, { backgroundColor: '#f0f0f0' }]}>Notes</Text>
          </PDFView>
          {/* Data Rows */}
          {filteredRecords.map((record) => (
            <PDFView key={record.id || `temp-${Math.random()}`} style={styles.tableRow}>
              <Text style={styles.colDateTime}>{formatDate(record.datetime_recorded)}</Text>
              <Text style={styles.colPatient}>{record.patient_initials}</Text>
              <Text style={styles.colGlucose}>{formatNumber(record.glucose)}</Text>
              <Text style={styles.colWeight}>{formatNumber(record.weight)}</Text>
              <Text style={styles.colTemp}>{record.temperature != null ? `${record.temperature}°${record.temperature_unit || '?'}` : 'N/A'}</Text>
              <Text style={styles.colBPSys}>{formatNumber(record.systolic)}</Text>
              <Text style={styles.colBPDia}>{formatNumber(record.diastolic)}</Text>
              <Text style={styles.colHR}>{formatNumber(record.heart_rate)}</Text>
              <Text style={styles.colSpO2}>{record.oxygen_saturation != null ? `${record.oxygen_saturation}%` : 'N/A'}</Text>
              <Text style={styles.colNotes}>{record.notes}</Text>
            </PDFView>
          ))}
        </PDFView>
        <Text style={styles.subtitle}>Summary</Text>
        <Text style={styles.summaryText}>
          Total Records: {filteredRecords.length}
        </Text>
        {stats.glucose && (
          <Text style={styles.summaryText}>
            Glucose (mg/dL) - Avg: {stats.glucose.avg}, Min: {stats.glucose.min}, Max: {stats.glucose.max}
          </Text>
        )}
        {stats.weight && (
          <Text style={styles.summaryText}>
            Weight (lbs/kg) - Avg: {stats.weight.avg}, Min: {stats.weight.min}, Max: {stats.weight.max}
          </Text>
        )}
        {stats.bp && (
          <Text style={styles.summaryText}>
            BP (mmHg) - Sys Avg: {stats.bp.sysAvg}, Dia Avg: {stats.bp.diaAvg}, Sys Min: {stats.bp.sysMin}/{stats.bp.diaMin}, Sys Max: {stats.bp.sysMax}/{stats.bp.diaMax}
          </Text>
        )}
        {stats.hr && (
          <Text style={styles.summaryText}>
            HR (bpm) - Avg: {stats.hr.avg}, Min: {stats.hr.min}, Max: {stats.hr.max}
          </Text>
        )}
        {stats.spo2 && (
          <Text style={styles.summaryText}>
            SpO2 (%) - Avg: {stats.spo2.avg}, Min: {stats.spo2.min}, Max: {stats.spo2.max}
          </Text>
        )}
      </Page>
    </Document>
  );
};

const ImportExport = ({ records, onImport }) => {
  const [selectedInitials, setSelectedInitials] = useState(''); // State for selected initials filter
  const [startDate, setStartDate] = useState(''); // State for start date filter
  const [endDate, setEndDate] = useState(''); // State for end date filter
  const [showReport, setShowReport] = useState(false); // State to toggle report view
  const pdfRef = useRef(); // Ref for PDF generation

  // Extract unique initials for the dropdown
  const uniqueInitials = [...new Set(records.map(record => record.patient_initials))].sort();

  // Apply filters
  const filteredRecords = records.filter(record => {
    // Filter by initials if selected
    if (selectedInitials && record.patient_initials !== selectedInitials) {
      return false;
    }
    // Filter by start date if provided
    if (startDate && new Date(record.datetime_recorded) < new Date(startDate)) {
      return false;
    }
    // Filter by end date if provided
    if (endDate && new Date(record.datetime_recorded) > new Date(endDate)) {
      return false;
    }
    return true;
  });

  // Handle export as JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, `vital_records_${new Date().toISOString().slice(0, 19)}.json`);
  };

  // Prepare data for CSV export
  const csvHeaders = [
    { label: 'Patient Initials', key: 'patient_initials' },
    { label: 'Date/Time', key: 'datetime_recorded' },
    { label: 'Glucose', key: 'glucose' },
    { label: 'Weight', key: 'weight' },
    { label: 'Temperature', key: 'temperature' },
    { label: 'Temp Unit', key: 'temperature_unit' },
    { label: 'Systolic', key: 'systolic' },
    { label: 'Diastolic', key: 'diastolic' },
    { label: 'Heart Rate', key: 'heart_rate' },
    { label: 'Oxygen Saturation', key: 'oxygen_saturation' },
    { label: 'Notes', key: 'notes' }
  ];

  // Handle export as PDF
  const handleExportPDF = async () => {
    const doc = <PDFReport filteredRecords={filteredRecords} startDate={startDate} endDate={endDate} selectedInitials={selectedInitials} />;
    const blob = await pdf(doc).toBlob();
    saveAs(blob, `vital_report_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  // Handle import from JSON
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          onImport(importedData);
          alert(`Successfully imported ${importedData.length} records.`);
        } catch (error) {
          console.error("Error importing JSON:", error);
          alert("Error importing JSON file. Please check the console for details.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Calculate summary statistics for the report view
  const glucoseValues = filteredRecords.filter(r => r.glucose != null).map(r => r.glucose);
  const weightValues = filteredRecords.filter(r => r.weight != null).map(r => r.weight);
  const bpSystolicValues = filteredRecords.filter(r => r.systolic != null).map(r => r.systolic);
  const bpDiastolicValues = filteredRecords.filter(r => r.diastolic != null).map(r => r.diastolic);
  const hrValues = filteredRecords.filter(r => r.heart_rate != null).map(r => r.heart_rate);
  const spo2Values = filteredRecords.filter(r => r.oxygen_saturation != null).map(r => r.oxygen_saturation);

  const stats = {
    totalRecords: filteredRecords.length,
    glucose: glucoseValues.length > 0 ? {
      avg: (glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length).toFixed(2),
      min: Math.min(...glucoseValues),
      max: Math.max(...glucoseValues)
    } : null,
    weight: weightValues.length > 0 ? {
      avg: (weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(2),
      min: Math.min(...weightValues),
      max: Math.max(...weightValues)
    } : null,
    bp: bpSystolicValues.length > 0 ? {
      sysAvg: (bpSystolicValues.reduce((a, b) => a + b, 0) / bpSystolicValues.length).toFixed(2),
      diaAvg: (bpDiastolicValues.reduce((a, b) => a + b, 0) / bpDiastolicValues.length).toFixed(2),
      sysMin: Math.min(...bpSystolicValues),
      diaMin: Math.min(...bpDiastolicValues),
      sysMax: Math.max(...bpSystolicValues),
      diaMax: Math.max(...bpDiastolicValues),
    } : null,
    hr: hrValues.length > 0 ? {
      avg: (hrValues.reduce((a, b) => a + b, 0) / hrValues.length).toFixed(2),
      min: Math.min(...hrValues),
      max: Math.max(...hrValues)
    } : null,
    spo2: spo2Values.length > 0 ? {
      avg: (spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length).toFixed(2),
      min: Math.min(...spo2Values),
      max: Math.max(...spo2Values)
    } : null,
  };

  return (
    <div className="import-export">
      <h2>Import/Export Data</h2>

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filter-controls">
          <label htmlFor="initialsFilter">Filter by Initials:</label>
          <select
            id="initialsFilter"
            value={selectedInitials}
            onChange={(e) => setSelectedInitials(e.target.value)}
          >
            <option value="">All Initials</option>
            {uniqueInitials.map(initial => (
              <option key={initial} value={initial}>{initial}</option>
            ))}
          </select>

          <label htmlFor="startDatePicker">Start Date/Time:</label>
          <input
            type="datetime-local"
            id="startDatePicker"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="endDatePicker">End Date/Time:</label>
          <input
            type="datetime-local"
            id="endDatePicker"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={() => setShowReport(!showReport)}>
          {showReport ? 'Hide Report View' : 'Show Report View'}
        </button>
        <button onClick={handleExportJSON} disabled={filteredRecords.length === 0}>
          Export JSON
        </button>
        <button onClick={handleExportPDF} disabled={filteredRecords.length === 0}>
          Export PDF
        </button>
        <input type="file" accept=".json" onChange={handleImportJSON} />
        <button onClick={() => saveAs(new Blob([JSON.stringify(SAMPLE_DATA, null, 2)], { type: 'application/json' }), 'sample_vital_data.json')}>
          Download Sample Data (JSON)
        </button>
      </div>

      {/* Report View */}
      {showReport && (
        <div className="report-view-full">
          <h3>Report View (Filtered: {selectedInitials || 'All'}, {startDate || 'Start'} to {endDate || 'End'})</h3>
          <div className="data-grid-report">
            <h4>Data Grid</h4>
            {filteredRecords.length === 0 ? (
              <p>No records match the current filters.</p>
            ) : (
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Patient</th>
                    <th>Glucose</th>
                    <th>Weight</th>
                    <th>Temp</th>
                    <th>BP Sys</th>
                    <th>BP Dia</th>
                    <th>HR</th>
                    <th>SpO2</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id || `temp-${Math.random()}`}>
                      <td>{formatDate(record.datetime_recorded)}</td>
                      <td>{record.patient_initials}</td>
                      <td>{formatNumber(record.glucose)}</td>
                      <td>{formatNumber(record.weight)}</td>
                      <td>{record.temperature != null ? `${record.temperature}°${record.temperature_unit || '?'}` : 'N/A'}</td>
                      <td>{formatNumber(record.systolic)}</td>
                      <td>{formatNumber(record.diastolic)}</td>
                      <td>{formatNumber(record.heart_rate)}</td>
                      <td>{record.oxygen_saturation != null ? `${record.oxygen_saturation}%` : 'N/A'}</td>
                      <td>{record.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h4>Summary</h4>
            <p>Total Records: {stats.totalRecords}</p>
            {stats.glucose && (
              <p>Glucose (mg/dL) - Avg: {stats.glucose.avg}, Min: {stats.glucose.min}, Max: {stats.glucose.max}</p>
            )}
            {stats.weight && (
              <p>Weight (lbs/kg) - Avg: {stats.weight.avg}, Min: {stats.weight.min}, Max: {stats.weight.max}</p>
            )}
            {stats.bp && (
              <p>BP (mmHg) - Sys Avg: {stats.bp.sysAvg}, Dia Avg: {stats.bp.diaAvg}, Sys Min: {stats.bp.sysMin}/{stats.bp.diaMin}, Sys Max: {stats.bp.sysMax}/{stats.bp.diaMax}</p>
            )}
            {stats.hr && (
              <p>HR (bpm) - Avg: {stats.hr.avg}, Min: {stats.hr.min}, Max: {stats.hr.max}</p>
            )}
            {stats.spo2 && (
              <p>SpO2 (%) - Avg: {stats.spo2.avg}, Min: {stats.spo2.min}, Max: {stats.spo2.max}</p>
            )}
          </div>
        </div>
      )}

      {/* CSV Export Link (hidden, used by button) */}
      {/* Added eslint-disable comment for the linter error */}
      {/* eslint-disable-next-line react/jsx-no-undef */}
      <CSVLink
        data={filteredRecords}
        headers={csvHeaders}
        filename={`vital_records_${new Date().toISOString().slice(0, 19)}.csv`}
        className="hidden-csv-link"
        target="_blank"
      />
    </div>
  );
};

export default ImportExport;

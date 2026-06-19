// components/ReportView.js
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportView = ({ records }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const reportRef = useRef();

  // Get unique patients
  const uniquePatients = [...new Set(records.map(r => r.patientInitials))];

  // Filter records for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.dateTime);
    return recordDate >= thirtyDaysAgo && 
           (selectedPatient === 'all' || record.patientInitials === selectedPatient);
  });

  // Prepare chart data
  useEffect(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      setChartData([]);
      return;
    }

    const preparedData = filteredRecords.map(record => ({
      date: new Date(record.dateTime).toLocaleDateString(),
      glucose: parseFloat(record.glucose) || null,
      weight: parseFloat(record.weight) || null,
      temperature: parseFloat(record.temperature) || null,
      systolic: parseFloat(record.systolic) || null,
      diastolic: parseFloat(record.diastolic) || null,
      heartRate: parseFloat(record.heartRate) || null,
      oxygenSaturation: parseFloat(record.oxygenSaturation) || null
    }));

    // Group by date (average values for same day)
    const groupedData = {};
    preparedData.forEach(item => {
      if (!groupedData[item.date]) {
        groupedData[item.date] = {
          date: item.date,
          glucose: [],
          weight: [],
          temperature: [],
          systolic: [],
          diastolic: [],
          heartRate: [],
          oxygenSaturation: []
        };
      }
      
      if (item.glucose !== null) groupedData[item.date].glucose.push(item.glucose);
      if (item.weight !== null) groupedData[item.date].weight.push(item.weight);
      if (item.temperature !== null) groupedData[item.date].temperature.push(item.temperature);
      if (item.systolic !== null) groupedData[item.date].systolic.push(item.systolic);
      if (item.diastolic !== null) groupedData[item.date].diastolic.push(item.diastolic);
      if (item.heartRate !== null) groupedData[item.date].heartRate.push(item.heartRate);
      if (item.oxygenSaturation !== null) groupedData[item.date].oxygenSaturation.push(item.oxygenSaturation);
    });

    const finalData = Object.values(groupedData).map(item => ({
      date: item.date,
      glucose: item.glucose.length ? (item.glucose.reduce((a, b) => a + b, 0) / item.glucose.length).toFixed(1) : null,
      weight: item.weight.length ? (item.weight.reduce((a, b) => a + b, 0) / item.weight.length).toFixed(1) : null,
      temperature: item.temperature.length ? (item.temperature.reduce((a, b) => a + b, 0) / item.temperature.length).toFixed(1) : null,
      systolic: item.systolic.length ? (item.systolic.reduce((a, b) => a + b, 0) / item.systolic.length).toFixed(0) : null,
      diastolic: item.diastolic.length ? (item.diastolic.reduce((a, b) => a + b, 0) / item.diastolic.length).toFixed(0) : null,
      heartRate: item.heartRate.length ? (item.heartRate.reduce((a, b) => a + b, 0) / item.heartRate.length).toFixed(0) : null,
      oxygenSaturation: item.oxygenSaturation.length ? (item.oxygenSaturation.reduce((a, b) => a + b, 0) / item.oxygenSaturation.length).toFixed(1) : null
    }));

    setChartData(finalData);
  }, [filteredRecords]); // Only re-run when filteredRecords changes

  const handleDownloadPDF = async () => {
    const input = reportRef.current;
    input.style.display = 'block'; // Ensure content is visible
    
    try {
      // Generate canvas from the report div
      const canvas = await html2canvas(input, { scale: 2 }); // Higher quality
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, Math.abs(position), imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`vital_statistics_report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Hide the report div again after PDF generation
      input.style.display = 'none';
    }
  };

  // Calculate summary statistics
  const calculateStats = (field) => {
    const values = filteredRecords
      .filter(r => r[field] !== undefined && r[field] !== null && r[field] !== '')
      .map(r => parseFloat(r[field]));
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = (sum / values.length).toFixed(1);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  };

  const glucoseStats = calculateStats('glucose');
  const weightStats = calculateStats('weight');
  const tempStats = calculateStats('temperature');
  const bpStats = {
    systolic: calculateStats('systolic'),
    diastolic: calculateStats('diastolic')
  };
  const hrStats = calculateStats('heartRate');
  const o2Stats = calculateStats('oxygenSaturation');

  return (
    <div ref={reportRef} className="report-view">
      <div className="report-header">
        <h2>30-Day Vital Statistics Report</h2>
        <div className="report-controls">
          <select 
            value={selectedPatient} 
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="all">All Patients</option>
            {uniquePatients.map(patient => (
              <option key={patient} value={patient}>{patient}</option>
            ))}
          </select>
          <button onClick={handleDownloadPDF} className="pdf-btn">Download PDF</button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Glucose (mg/dL)</h3>
          {glucoseStats ? (
            <>
              <p>Avg: {glucoseStats.avg}</p>
              <p>Range: {glucoseStats.min} - {glucoseStats.max}</p>
              <p>Measurements: {glucoseStats.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
        
        <div className="stat-card">
          <h3>Weight (lbs)</h3>
          {weightStats ? (
            <>
              <p>Avg: {weightStats.avg}</p>
              <p>Range: {weightStats.min} - {weightStats.max}</p>
              <p>Measurements: {weightStats.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
        
        <div className="stat-card">
          <h3>Temperature (°F)</h3>
          {tempStats ? (
            <>
              <p>Avg: {tempStats.avg}</p>
              <p>Range: {tempStats.min} - {tempStats.max}</p>
              <p>Measurements: {tempStats.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
        
        <div className="stat-card">
          <h3>Blood Pressure (mmHg)</h3>
          {bpStats.systolic && bpStats.diastolic ? (
            <>
              <p>Sys: Avg {bpStats.systolic.avg}, Range {bpStats.systolic.min}-{bpStats.systolic.max}</p>
              <p>Dia: Avg {bpStats.diastolic.avg}, Range {bpStats.diastolic.min}-{bpStats.diastolic.max}</p>
              <p>Measurements: {bpStats.systolic.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
        
        <div className="stat-card">
          <h3>Heart Rate (bpm)</h3>
          {hrStats ? (
            <>
              <p>Avg: {hrStats.avg}</p>
              <p>Range: {hrStats.min} - {hrStats.max}</p>
              <p>Measurements: {hrStats.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
        
        <div className="stat-card">
          <h3>O2 Saturation (%)</h3>
          {o2Stats ? (
            <>
              <p>Avg: {o2Stats.avg}</p>
              <p>Range: {tempStats.min} - {tempStats.max}</p>
              <p>Measurements: {tempStats.count}</p>
            </>
          ) : <p>No data available</p>}
        </div>
      </div>

      <div className="charts-container">
        <div className="chart">
          <h3>Glucose Levels Over Time</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[70, 140]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="glucose" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
        
        <div className="chart">
          <h3>Weight Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
        
        <div className="chart">
          <h3>Temperature Over Time</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[96, 102]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
        
        <div className="chart">
          <h3>Blood Pressure Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="systolic" stroke="#ff0000" name="Systolic" />
                <Line type="monotone" dataKey="diastolic" stroke="#00ff00" name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
        
        <div className="chart">
          <h3>Heart Rate Over Time</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[50, 120]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="heartRate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
        
        <div className="chart">
          <h3>Oxygen Saturation Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[90, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="oxygenSaturation" stroke="#00c4ff" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available for this period</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
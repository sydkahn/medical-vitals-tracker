// src/components/ReportView.js
import React, { useState, useEffect } from 'react';
// --- Import Chart.js components ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale, // Add TimeScale
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date-fns adapter
import { Line, Bar } from 'react-chartjs-2';
// --- End Chart.js imports ---

// Register Chart.js components - Include TimeScale
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale, // Register TimeScale
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReportView = ({ records }) => {
  const [glucoseData, setGlucoseData] = useState(null);
  const [weightData, setWeightData] = useState(null);
  const [bpData, setBpData] = useState(null); // Systolic/Diastolic
  const [hrData, setHrData] = useState(null); // Heart Rate
  const [spo2Data, setSpo2Data] = useState(null); // Oxygen Saturation

  // State for filters - NEW
  const [selectedInitials, setSelectedInitials] = useState(''); // State for selected initials filter
  const [startDate, setStartDate] = useState(''); // State for start date filter
  const [endDate, setEndDate] = useState(''); // State for end date filter

  // Extract unique initials for the dropdown - NEW
  const uniqueInitials = [...new Set(records.map(record => record.patient_initials))].sort();

  // Function to format date for display (adjust as needed)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString();
  };

  // Function to format time for display (adjust as needed)
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString();
  };

  useEffect(() => {
    // Apply filters to the records prop - MODIFIED
    let filteredRecords = records;

    if (!records || records.length === 0) {
      // No records, set data to null to trigger "No data" message
      setGlucoseData(null);
      setWeightData(null);
      setBpData(null);
      setHrData(null);
      setSpo2Data(null);
      return;
    }

    // Filter by initials if selected
    if (selectedInitials) {
      filteredRecords = filteredRecords.filter(record => record.patient_initials === selectedInitials);
    }
    // Filter by start date if provided
    if (startDate) {
      filteredRecords = filteredRecords.filter(record => new Date(record.datetime_recorded) >= new Date(startDate));
    }
    // Filter by end date if provided
    if (endDate) {
      filteredRecords = filteredRecords.filter(record => new Date(record.datetime_recorded) <= new Date(endDate));
    }

    // If no records match the filters after applying them
    if (filteredRecords.length === 0) {
       setGlucoseData(null);
       setWeightData(null);
       setBpData(null);
       setHrData(null);
       setSpo2Data(null);
       return;
    }

    // Calculate the date 30 days ago from now (in the browser's timezone for display purposes)
    // This step might be redundant if you want to plot *all* filtered records, not just the last 30 days
    // If you want to plot ALL filtered records regardless of age, remove the 30-day filter logic below
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Optionally, filter to the last 30 days from the *current date* based on the already filtered list
    // Uncomment the next line if you want to combine the custom filters with the 30-day window
    // filteredRecords = filteredRecords.filter(record => new Date(record.datetime_recorded) >= thirtyDaysAgo);

    // Sort filtered records by date (oldest first for plotting)
    const sortedRecords = filteredRecords.sort((a, b) => new Date(a.datetime_recorded) - new Date(b.datetime_recorded));

    // Prepare labels (dates) - Use the full datetime string for Chart.js TimeScale to parse
    // Chart.js TimeScale can parse ISO strings directly
    const labels = sortedRecords.map(record => record.datetime_recorded); // Use full datetime string for Chart.js

    // Prepare data points for each metric
    const glucoseValues = sortedRecords.map(record => record.glucose != null ? record.glucose : null);
    const weightValues = sortedRecords.map(record => record.weight != null ? record.weight : null);
    const systolicValues = sortedRecords.map(record => record.systolic != null ? record.systolic : null);
    const diastolicValues = sortedRecords.map(record => record.diastolic != null ? record.diastolic : null);
    const hrValues = sortedRecords.map(record => record.heart_rate != null ? record.heart_rate : null);
    const spo2Values = sortedRecords.map(record => record.oxygen_saturation != null ? record.oxygen_saturation : null);

    // --- Glucose Chart Data ---
    setGlucoseData({
      labels: labels, // Use datetime strings
      datasets: [
        {
          label: 'Glucose (mg/dL)',
          data: glucoseValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
      ],
    });

    // --- Weight Chart Data ---
    setWeightData({
      labels: labels, // Use datetime strings
      datasets: [
        {
          label: 'Weight (lbs/kg)',
          data: weightValues,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.1,
        },
      ],
    });

    // --- Blood Pressure Chart Data ---
    setBpData({
      labels: labels, // Use datetime strings
      datasets: [
        {
          label: 'Systolic (mmHg)',
          data: systolicValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          type: 'line',
          tension: 0.1,
        },
        {
          label: 'Diastolic (mmHg)',
          data: diastolicValues,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          type: 'line',
          tension: 0.1,
        },
      ],
    });

    // --- Heart Rate Chart Data ---
    setHrData({
      labels: labels, // Use datetime strings
      datasets: [
        {
          label: 'Heart Rate (bpm)',
          data: hrValues,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          tension: 0.1,
        },
      ],
    });

    // --- Oxygen Saturation Chart Data ---
    setSpo2Data({
      labels: labels, // Use datetime strings
      datasets: [
        {
          label: 'Oxygen Saturation (%)',
          data: spo2Values,
          borderColor: 'rgb(199, 199, 199)',
          backgroundColor: 'rgba(199, 199, 199, 0.5)',
          tension: 0.1,
        },
      ],
    });

  }, [records, selectedInitials, startDate, endDate]); // Re-run when records or filter states change


  // Common chart options - Configure X-axis as time
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '', // Title is set per chart below
      },
    },
    scales: {
      x: { // Configure the x-axis (time axis)
        type: 'time', // Specify time scale
        time: {
          // Format depends on how your datetime strings are formatted
          // ISO strings like "2026-06-19T17:21:00.000Z" are usually parsed automatically
          // You can specify parser if needed, but default often works for ISO
          // parser: 'YYYY-MM-DDTHH:mm:ss.SSSZ', // Example parser string if needed
          tooltipFormat: 'PPpp', // Format for tooltips (date and time)
          unit: 'day', // Granularity: minute, hour, day, month, etc.
          stepSize: 1, // How many units per step
        },
        title: {
          display: true,
          text: 'Date/Time',
        },
        ticks: {
            maxRotation: 45, // Allow some rotation if labels are long
            autoSkip: true,  // Automatically skip ticks to avoid overlap
            maxTicksLimit: 10, // Limit number of ticks
        }
      },
      y: {
        beginAtZero: false, // Usually better for health metrics not to start at zero
        title: {
            display: true,
            text: 'Value'
        }
      },
    },
  };

  // Handler functions for filter changes - NEW
  const handleInitialsChange = (e) => {
    setSelectedInitials(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  return (
    <div className="report-view">
      <h2>30-Day Trend Reports</h2>

      {/* Filters Section - ADDED */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filter-controls">
          <label htmlFor="reportInitialsFilter">Filter by Initials:</label>
          <select
            id="reportInitialsFilter"
            value={selectedInitials}
            onChange={handleInitialsChange}
          >
            <option value="">All Initials</option>
            {uniqueInitials.map(initial => (
              <option key={initial} value={initial}>{initial}</option>
            ))}
          </select>

          <label htmlFor="reportStartDatePicker">Start Date/Time:</label>
          <input
            type="datetime-local"
            id="reportStartDatePicker"
            value={startDate}
            onChange={handleStartDateChange}
          />

          <label htmlFor="reportEndDatePicker">End Date/Time:</label>
          <input
            type="datetime-local"
            id="reportEndDatePicker"
            value={endDate}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      {/* Glucose Chart */}
      <div className="chart-container">
        <h3>Glucose Levels</h3>
        {glucoseData ? (
          <Line options={{ ...chartOptions, title: { ...chartOptions.plugins.title, text: 'Glucose (mg/dL) over Last 30 Days' } }} data={glucoseData} />
        ) : (
          <p>No glucose data available for this period.</p>
        )}
      </div>

      {/* Weight Chart */}
      <div className="chart-container">
        <h3>Weight Trends</h3>
        {weightData ? (
          <Line options={{ ...chartOptions, title: { ...chartOptions.plugins.title, text: 'Weight (lbs/kg) over Last 30 Days' } }} data={weightData} />
        ) : (
          <p>No weight data available for this period.</p>
        )}
      </div>

      {/* Blood Pressure Chart */}
      <div className="chart-container">
        <h3>Blood Pressure (Systolic/Diastolic)</h3>
        {bpData ? (
          <Line options={{ ...chartOptions, title: { ...chartOptions.plugins.title, text: 'Blood Pressure (mmHg) over Last 30 Days' } }} data={bpData} />
        ) : (
          <p>No blood pressure data available for this period.</p>
        )}
      </div>

      {/* Heart Rate Chart */}
      <div className="chart-container">
        <h3>Heart Rate</h3>
        {hrData ? (
          <Line options={{ ...chartOptions, title: { ...chartOptions.plugins.title, text: 'Heart Rate (bpm) over Last 30 Days' } }} data={hrData} />
        ) : (
          <p>No heart rate data available for this period.</p>
        )}
      </div>

      {/* Oxygen Saturation Chart */}
      <div className="chart-container">
        <h3>Oxygen Saturation</h3>
        {spo2Data ? (
          <Line options={{ ...chartOptions, title: { ...chartOptions.plugins.title, text: 'Oxygen Saturation (%) over Last 30 Days' } }} data={spo2Data} />
        ) : (
          <p>No oxygen saturation data available for this period.</p>
        )}
      </div>
    </div>
  );
};

export default ReportView;
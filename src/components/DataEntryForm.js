// src/components/DataEntryForm.js
import React, { useState, useEffect } from 'react';

const DataEntryForm = ({ onSave, onCancel, editingRecord, onMessage }) => {
  const [formData, setFormData] = useState({
    dateTime: new Date().toISOString().slice(0, 16), // Default to current time, format YYYY-MM-DDTHH:mm
    patientInitials: '',
    weight: '',
    glucose: '',
    systolic: '',
    diastolic: '',
    oxygenSaturation: '',
    heartRate: '',
    temperature: '',
    temperatureUnit: 'F', // Default to Fahrenheit
    notes: ''
  });

  const [errors, setErrors] = useState({}); // State for validation errors

  // Populate form when editingRecord changes (when component receives a record to edit)
  useEffect(() => {
    if (editingRecord) {
      // Convert backend datetime (likely UTC) back to local time for display in the input
      // Assuming backend sends ISO string like "2026-06-19T22:36:00.000Z"
      const localDateTimeString = editingRecord.datetime_recorded ? new Date(editingRecord.datetime_recorded).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);

      setFormData({
        dateTime: localDateTimeString, // Use the converted local string for the input
        patientInitials: editingRecord.patient_initials || '',
        weight: editingRecord.weight != null ? editingRecord.weight.toString() : '', // Convert number to string for input
        glucose: editingRecord.glucose != null ? editingRecord.glucose.toString() : '',
        systolic: editingRecord.systolic != null ? editingRecord.systolic.toString() : '',
        diastolic: editingRecord.diastolic != null ? editingRecord.diastolic.toString() : '',
        oxygenSaturation: editingRecord.oxygen_saturation != null ? editingRecord.oxygen_saturation.toString() : '',
        heartRate: editingRecord.heart_rate != null ? editingRecord.heart_rate.toString() : '',
        temperature: editingRecord.temperature != null ? editingRecord.temperature.toString() : '',
        temperatureUnit: editingRecord.temperature_unit || 'F',
        notes: editingRecord.notes || ''
      });
    } else {
      // Reset form if not editing
      setFormData({
        dateTime: new Date().toISOString().slice(0, 16),
        patientInitials: '',
        weight: '',
        glucose: '',
        systolic: '',
        diastolic: '',
        oxygenSaturation: '',
        heartRate: '',
        temperature: '',
        temperatureUnit: 'F',
        notes: ''
      });
      setErrors({}); // Clear errors when resetting
    }
  }, [editingRecord]); // Only re-run when editingRecord prop changes


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific error when user starts typing in a field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validate Patient Initials (3 letters)
    if (!formData.patientInitials.trim()) {
      newErrors.patientInitials = 'Patient initials are required.';
    } else if (!/^[A-Za-z]{3}$/.test(formData.patientInitials.trim())) {
      newErrors.patientInitials = 'Patient initials must be exactly 3 letters.';
    }

    // Validate Date/Time
    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time are required.';
    } else {
        // Attempt to create a Date object to check validity
        const dateObj = new Date(formData.dateTime);
        if (isNaN(dateObj.getTime())) {
            newErrors.dateTime = 'Invalid date/time format.';
        }
    }

    // You can add more validations here if needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toUTCDateTime = (dateTimeStr) => {
    const localDate = new Date(dateTimeStr);
    return localDate.toISOString();
  };


  const handleSubmit = async (e) => { // Make handleSubmit async to handle the onSave promise
    e.preventDefault();

    if (!validate()) {
      console.error("Validation failed:", errors);
      onMessage('error', 'Validation failed. Please check the form for errors.');
      return;
    }

    try {
      // Transform the form data to match the backend API expectations
      const transformedData = {
        // Convert local datetime input to what the backend expects (likely UTC or consistent format)
        // Use the helper function to get the ET-based instant as an ISO string
        datetime_recorded: toUTCDateTime(formData.dateTime),
        patient_initials: formData.patientInitials.trim().toUpperCase(), // Match server column name, ensure 3 chars, uppercase
        weight: formData.weight === '' ? null : parseFloat(formData.weight), // Convert to number or null, match server column name
        glucose: formData.glucose === '' ? null : parseFloat(formData.glucose), // Match server column name
        systolic: formData.systolic === '' ? null : parseInt(formData.systolic, 10), // Convert to integer or null, match server column name
        diastolic: formData.diastolic === '' ? null : parseInt(formData.diastolic, 10), // Match server column name
        oxygen_saturation: formData.oxygenSaturation === '' ? null : parseFloat(formData.oxygenSaturation), // Convert and match server column name
        heart_rate: formData.heartRate === '' ? null : parseInt(formData.heartRate, 10), // Convert and match server column name
        temperature: formData.temperature === '' ? null : parseFloat(formData.temperature), // Match server column name
        temperature_unit: formData.temperatureUnit, // Match server column name
        notes: formData.notes // Text field, match server column name
      };

      // Call the onSave prop function passed from the parent component (App.js)
      // This function likely makes an API call (axios.post/put)
      await onSave(transformedData); // Wait for the save operation to complete

      onMessage('success', 'Record saved successfully!');

      // Clear the form *only* after successful save
      if (!editingRecord) { // Only reset if we weren't editing an existing record
        setFormData({
          dateTime: new Date().toISOString().slice(0, 16),
          patientInitials: '',
          weight: '',
          glucose: '',
          systolic: '',
          diastolic: '',
          oxygenSaturation: '',
          heartRate: '',
          temperature: '',
          temperatureUnit: 'F',
          notes: ''
        });
        setErrors({}); // Clear any lingering errors
      } else {
          // If editing, go back to the grid/list view (call onCancel)
          onCancel();
      }

    } catch (error) {
      console.error("Error saving vital record:", error);
      onMessage('error', 'Error saving record. Please check the console for details.');
    }
  };


  const handleCancel = () => {
    setErrors({}); // Clear any errors when cancelling
    onCancel(); // Call the onCancel prop passed from the parent component (App.js)
  };

  return (
    <div className="data-entry-form">
      <h2>{editingRecord ? 'Edit Vital Record' : 'Add New Vital Record'}</h2>
      <form onSubmit={handleSubmit}>
        {/* First Row: Date and Initials */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dateTime">Date and Time:</label>
            <input
              type="datetime-local"
              id="dateTime"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              required
            />
            {errors.dateTime && <span className="error">{errors.dateTime}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="patientInitials">Patient Initials (3 letters):</label>
            <input
              type="text"
              id="patientInitials"
              name="patientInitials"
              value={formData.patientInitials}
              onChange={handleChange}
              maxLength="3"
              required
            />
            {errors.patientInitials && <span className="error">{errors.patientInitials}</span>}
          </div>
        </div>

        {/* Second Row: Weight and Glucose */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="weight">Weight (lbs/kg):</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="glucose">Glucose (mg/dL):</label>
            <input
              type="number"
              id="glucose"
              name="glucose"
              value={formData.glucose}
              onChange={handleChange}
              step="0.1"
            />
          </div>
        </div>

        {/* Third Row: Systolic and Diastolic */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="systolic">Blood Pressure (Systolic):</label>
            <input
              type="number"
              id="systolic"
              name="systolic"
              value={formData.systolic}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="diastolic">Diastolic:</label>
            <input
              type="number"
              id="diastolic"
              name="diastolic"
              value={formData.diastolic}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Fourth Row: Oxygen Saturation and Heart Rate */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="oxygenSaturation">Oxygen Saturation (%):</label>
            <input
              type="number"
              id="oxygenSaturation"
              name="oxygenSaturation"
              value={formData.oxygenSaturation}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="heartRate">Heart Rate (bpm):</label>
            <input
              type="number"
              id="heartRate"
              name="heartRate"
              value={formData.heartRate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Fifth Row: Temperature and Unit */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="temperature">Temperature:</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperatureUnit">Unit:</label>
            <select
              id="temperatureUnit"
              name="temperatureUnit"
              value={formData.temperatureUnit}
              onChange={handleChange}
            >
              <option value="F">°F</option>
              <option value="C">°C</option>
            </select>
          </div>
        </div>

        {/* Sixth Row: Notes (Full Width) */}
        <div className="form-group">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="submit">{editingRecord ? 'Update Record' : 'Save Record'}</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;
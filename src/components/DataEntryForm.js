// src/components/DataEntryForm.js
import React, { useState, useEffect } from 'react';

const DataEntryForm = ({ onSave, onCancel, editingRecord }) => {
  const [formData, setFormData] = useState({
    dateTime: new Date().toISOString().slice(0, 16), // Default to current time, format YYYY-MM-DDTHH:mm
    patientInitials: '',
    weight: '',
    glucose: '',
    systolic: '',
    diastolic: '',
    oxygenSaturation: '',
    heartRate: '',
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

  // Helper function to convert local time to Eastern Time (ET) and then to ISO string
  // This function assumes the input dateTimeStr is in the format provided by datetime-local input (e.g., "2026-06-19T17:36")
  // It calculates the equivalent time in ET and returns an ISO string in UTC format for the backend.
  const convertToLocalETISOString = (dateTimeStr) => {
    // Create a Date object from the input string (interpreted as LOCAL time by the browser)
    const localDate = new Date(dateTimeStr);

    // Get the offset for Eastern Time (ET) in minutes for the specific date
    // getTimezoneOffset() returns the offset from UTC *to* the local time in minutes (negative for east of GMT, positive for west)
    // EST offset is +300 minutes (UTC-5), EDT offset is +240 minutes (UTC-4)
    // Using US Eastern Time zone explicitly
    const etZone = 'America/New_York';
    const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const etDate = new Date(localDate.toLocaleString('en-US', { timeZone: etZone }));
    const offsetMinutes = (localDate.getTime() - etDate.getTime()) / (1000 * 60);

    // Calculate the time in ET's equivalent UTC
    // The formula adjusts the local time to what UTC would be if ET was the local time
    const etAsUtc = new Date(localDate.getTime() + offsetMinutes * 60000);

    // Return the ISO string representation of the calculated ET time in UTC format
    // The backend expects an ISO string, ideally in UTC or a consistent timezone format it can parse.
    // Returning the ISO string with 'Z' suffix indicates UTC, which is standard.
    // Note: This calculation aims to represent the ET moment in time as a UTC timestamp.
    // The backend might need to store/display based on its own timezone handling.
    // For simplicity here, we'll calculate the equivalent UTC instant.
    // A more robust solution might involve sending the original local time and timezone info to the backend.
    // But for now, assuming backend expects a standard ISO string representing the instant in time.

    // A simpler approach using Intl.DateTimeFormat to get ET components and construct ISO string:
    const etDateTime = new Date(localDate.toLocaleString("en-US", {timeZone: etZone}));
    const year = etDateTime.getFullYear();
    const month = String(etDateTime.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(etDateTime.getDate()).padStart(2, '0');
    const hours = String(etDateTime.getHours()).padStart(2, '0');
    const minutes = String(etDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(etDateTime.getSeconds()).padStart(2, '0');

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds)).toISOString(); // Returns UTC ISO string representing the ET instant

    // Alternative, more direct calculation based on offset:
    // const offsetET = new Date().toLocaleString('en', { timeZone: 'America/New_York', timeZoneName: 'longOffset' }).split(' ').pop();
    // const offsetMs = parseFloat(offsetET) * 60 * 60 * 1000; // Convert fraction of day to milliseconds
    // const etInstant = new Date(localDate.getTime() + offsetMs);
    // return etInstant.toISOString(); // This also returns a UTC ISO string
  };


  const handleSubmit = async (e) => { // Make handleSubmit async to handle the onSave promise
    e.preventDefault();

    if (!validate()) {
      console.error("Validation failed:", errors);
      alert("Validation failed. Please check the form for errors.");
      return; // Don't submit if validation fails
    }

    try {
      // Transform the form data to match the backend API expectations
      const transformedData = {
        // Convert local datetime input to what the backend expects (likely UTC or consistent format)
        // Use the helper function to get the ET-based instant as an ISO string
        datetime_recorded: convertToLocalETISOString(formData.dateTime),
        patient_initials: formData.patientInitials.trim().toUpperCase(), // Match server column name, ensure 3 chars, uppercase
        weight: formData.weight === '' ? null : parseFloat(formData.weight), // Convert to number or null, match server column name
        glucose: formData.glucose === '' ? null : parseFloat(formData.glucose), // Match server column name
        systolic: formData.systolic === '' ? null : parseInt(formData.systolic, 10), // Convert to integer or null, match server column name
        diastolic: formData.diastolic === '' ? null : parseInt(formData.diastolic, 10), // Match server column name
        oxygen_saturation: formData.oxygenSaturation === '' ? null : parseFloat(formData.oxygenSaturation), // Convert and match server column name
        heart_rate: formData.heartRate === '' ? null : parseInt(formData.heartRate, 10), // Convert and match server column name
        notes: formData.notes // Text field, match server column name
      };

      // Call the onSave prop function passed from the parent component (App.js)
      // This function likely makes an API call (axios.post/put)
      await onSave(transformedData); // Wait for the save operation to complete

      // If we reach this point, the save was successful
      alert("Record saved successfully!");
      console.log("Record saved successfully!"); // Optional: log success

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
          notes: ''
        });
        setErrors({}); // Clear any lingering errors
      } else {
          // If editing, go back to the grid/list view (call onCancel)
          onCancel();
      }

    } catch (error) {
      console.error("Error saving vital record:", error);
      // Handle error appropriately (e.g., show a message to the user)
      alert("Error saving record. Please check the console for details.");
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
        {/* Date and Time Field - FIRST */}
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

        {/* Patient Initials Field - SECOND */}
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

        {/* Weight Field - THIRD */}
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

        {/* Glucose Field - FOURTH */}
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

        {/* Blood Pressure Fields (Systolic/Diastolic) - FIFTH */}
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

        {/* Oxygen Saturation Field - SIXTH */}
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

        {/* Heart Rate Field - SEVENTH */}
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

        {/* Notes Field - EIGHTH */}
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
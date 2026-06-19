// components/DataEntryForm.js
import React, { useState, useEffect } from 'react';

const DataEntryForm = ({ onSave, onCancel, editingRecord }) => {
  const [formData, setFormData] = useState({
    patientInitials: '',
    dateTime: new Date().toISOString().slice(0, 16),
    glucose: '',
    weight: '',
    temperature: '',
    temperatureUnit: 'F',
    systolic: '',
    diastolic: '',
    heartRate: '',
    oxygenSaturation: '',
    notes: ''
  });

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        patientInitials: editingRecord.patientInitials,
        dateTime: editingRecord.dateTime,
        glucose: editingRecord.glucose,
        weight: editingRecord.weight,
        temperature: editingRecord.temperature,
        temperatureUnit: editingRecord.temperatureUnit || 'F',
        systolic: editingRecord.systolic,
        diastolic: editingRecord.diastolic,
        heartRate: editingRecord.heartRate,
        oxygenSaturation: editingRecord.oxygenSaturation,
        notes: editingRecord.notes
      });
    } else {
      setFormData({
        patientInitials: '',
        dateTime: new Date().toISOString().slice(0, 16),
        glucose: '',
        weight: '',
        temperature: '',
        temperatureUnit: 'F',
        systolic: '',
        diastolic: '',
        heartRate: '',
        oxygenSaturation: '',
        notes: ''
      });
    }
  }, [editingRecord]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patientInitials || formData.patientInitials.length !== 3) {
      alert('Patient initials must be exactly 3 characters');
      return;
    }
    
    // Validate numeric fields
    const numericFields = ['glucose', 'weight', 'temperature', 'systolic', 'diastolic', 'heartRate', 'oxygenSaturation'];
    for (const field of numericFields) {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        alert(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`);
        return;
      }
    }
    
    // Validate blood pressure format
    if ((formData.systolic && !formData.diastolic) || (!formData.systolic && formData.diastolic)) {
      alert('Both systolic and diastolic values must be provided for blood pressure');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="form-container">
      <h2>{editingRecord ? 'Edit Vital Record' : 'Add New Vital Record'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Patient Initials (3 letters)</label>
            <input
              type="text"
              name="patientInitials"
              value={formData.patientInitials}
              onChange={handleChange}
              maxLength="3"
              placeholder="ABC"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Glucose (mg/dL)</label>
            <input
              type="number"
              name="glucose"
              value={formData.glucose}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="70-140"
            />
          </div>
          
          <div className="form-group">
            <label>Weight (lbs/kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="150"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Temperature</label>
            <div className="temp-input-group">
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                min="90"
                max="110"
                step="0.1"
                placeholder="98.6"
              />
              <select
                name="temperatureUnit"
                value={formData.temperatureUnit}
                onChange={handleChange}
              >
                <option value="F">°F</option>
                <option value="C">°C</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Blood Pressure</label>
            <div className="bp-input-group">
              <input
                type="number"
                name="systolic"
                value={formData.systolic}
                onChange={handleChange}
                min="0"
                placeholder="Systolic"
              />
              <span>/</span>
              <input
                type="number"
                name="diastolic"
                value={formData.diastolic}
                onChange={handleChange}
                min="0"
                placeholder="Diastolic"
              />
            </div>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Heart Rate (bpm)</label>
            <input
              type="number"
              name="heartRate"
              value={formData.heartRate}
              onChange={handleChange}
              min="0"
              max="300"
              placeholder="72"
            />
          </div>
          
          <div className="form-group">
            <label>Oxygen Saturation (%)</label>
            <input
              type="number"
              name="oxygenSaturation"
              value={formData.oxygenSaturation}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="98"
            />
          </div>
        </div>
        
        <div className="form-group full-width">
          <label>Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional observations..."
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button type="submit">{editingRecord ? 'Update Record' : 'Save Record'}</button>
          {editingRecord && <button type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;
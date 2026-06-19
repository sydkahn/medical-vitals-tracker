const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Use verbose mode for better error reporting
const path = require('path'); // For serving the React build

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, '../vitals.db'); // Path to your database file

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust as needed for production security)
app.use(express.json()); // Parse JSON request bodies

// Connect to SQLite Database
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create the table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS vital_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_initials TEXT NOT NULL CHECK(length(patient_initials) = 3),
                datetime_recorded TEXT NOT NULL,
                glucose REAL,
                weight REAL,
                temperature REAL,
                temperature_unit TEXT DEFAULT 'F',
                systolic INTEGER,
                diastolic INTEGER,
                heart_rate INTEGER,
                oxygen_saturation REAL,
                notes TEXT
            );
        `, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                console.log('Table "vital_records" is ready.');
            }
        });
    }
});

// API Routes

// GET /api/vitals - Fetch all records (with optional limit/offset for pagination later)
app.get('/api/vitals', (req, res) => {
    const sql = 'SELECT * FROM vital_records ORDER BY datetime_recorded DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/vitals/:id - Fetch a single record by ID
app.get('/api/vitals/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM vital_records WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Record not found.' });
        }
    });
});

// POST /api/vitals - Create a new record
app.post('/api/vitals', (req, res) => {
    const { patient_initials, datetime_recorded, glucose, weight, temperature, temperature_unit, systolic, diastolic, heart_rate, oxygen_saturation, notes } = req.body;

    // Basic validation (more thorough validation might be needed)
    if (!patient_initials || patient_initials.length !== 3 || !datetime_recorded) {
         res.status(400).json({ error: 'Patient initials (3 chars) and datetime are required.' });
         return;
    }

    const sql = `
        INSERT INTO vital_records (
            patient_initials, datetime_recorded, glucose, weight, temperature, temperature_unit,
            systolic, diastolic, heart_rate, oxygen_saturation, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [patient_initials, datetime_recorded, glucose, weight, temperature, temperature_unit, systolic, diastolic, heart_rate, oxygen_saturation, notes];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID }); // Return the ID of the newly created record
    });
});

// PUT /api/vitals/:id - Update an existing record
app.put('/api/vitals/:id', (req, res) => {
    const id = req.params.id;
    const { patient_initials, datetime_recorded, glucose, weight, temperature, temperature_unit, systolic, diastolic, heart_rate, oxygen_saturation, notes } = req.body;

    // Basic validation (more thorough validation might be needed)
    if (!patient_initials || patient_initials.length !== 3 || !datetime_recorded) {
         res.status(400).json({ error: 'Patient initials (3 chars) and datetime are required.' });
         return;
    }

    const sql = `
        UPDATE vital_records SET
            patient_initials = ?, datetime_recorded = ?, glucose = ?, weight = ?, temperature = ?, temperature_unit = ?,
            systolic = ?, diastolic = ?, heart_rate = ?, oxygen_saturation = ?, notes = ?
        WHERE id = ?
    `;
    const params = [patient_initials, datetime_recorded, glucose, weight, temperature, temperature_unit, systolic, diastolic, heart_rate, oxygen_saturation, notes, id];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Record not found.' });
        } else {
             res.json({ message: 'Record updated successfully.', id: id });
        }
    });
});

// DELETE /api/vitals/:id - Delete a record
app.delete('/api/vitals/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM vital_records WHERE id = ?';

    db.run(sql, id, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Record not found.' });
        } else {
             res.json({ message: 'Record deleted successfully.', id: id });
        }
    });
});

// Serve React Build Folder (Static Files)
app.use(express.static(path.join(__dirname, '../build')));

// Handle Client-Side Routing (e.g., /reports, /grid)
// This ensures that React Router works correctly after deployment
app.get(/(.*)/, (req, res) => { // <-- Use regex instead of '*'
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log(`Serving API at http://0.0.0.0:${PORT}/api/vitals`);
    console.log(`Serving React app from http://0.0.0.0:${PORT}/`);
});

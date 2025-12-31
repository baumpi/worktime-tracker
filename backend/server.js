const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/worktime.db';

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    startTime TEXT,
    endTime TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// Get all entries
app.get('/api/entries', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM entries ORDER BY date ASC, id ASC').all();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add entry
app.post('/api/entries', (req, res) => {
  try {
    const { date, hours, category, note, startTime, endTime } = req.body;
    const stmt = db.prepare(
      'INSERT INTO entries (date, hours, category, note, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(date, hours, category, note || null, startTime || null, endTime || null);
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update entry
app.put('/api/entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, hours, category, note, startTime, endTime } = req.body;
    const stmt = db.prepare(
      'UPDATE entries SET date = ?, hours = ?, category = ?, note = ?, startTime = ?, endTime = ? WHERE id = ?'
    );
    stmt.run(date, hours, category, note || null, startTime || null, endTime || null, id);
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entry
app.delete('/api/entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save settings
app.post('/api/settings', (req, res) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
        stmt.run(key, val);
      }
    });
    transaction(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import data
app.post('/api/import', (req, res) => {
  try {
    const { entries: importEntries, settings } = req.body;
    
    const insertStmt = db.prepare(
      'INSERT INTO entries (date, hours, category, note, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?)'
    );
    
    const settingsStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    const transaction = db.transaction(() => {
      // Clear existing entries
      db.prepare('DELETE FROM entries').run();
      
      // Import entries
      for (const entry of importEntries) {
        insertStmt.run(
          entry.date,
          entry.hours,
          entry.category,
          entry.note || null,
          entry.startTime || null,
          entry.endTime || null
        );
      }
      
      // Import settings if provided
      if (settings) {
        for (const [key, value] of Object.entries(settings)) {
          const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
          settingsStmt.run(key, val);
        }
      }
    });
    
    transaction();
    
    const entries = db.prepare('SELECT * FROM entries ORDER BY date ASC, id ASC').all();
    res.json({ entries, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data
app.get('/api/export', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM entries ORDER BY date ASC').all();
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    res.json({ entries, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🕐 Worktime Tracker running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

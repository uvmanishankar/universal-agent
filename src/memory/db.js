const path = require('path');
const { app } = require('electron');

let db = null;
let sqlite3;

try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.warn('sqlite3 not available, using in-memory fallback');
}

const DB_PATH = path.join(app.getPath('userData'), 'agent-history.db');

// In-memory fallback if sqlite3 isn't available
const memoryStore = [];

async function init() {
  if (!sqlite3) return;

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) { console.error('DB open error:', err); reject(err); return; }

      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          app_name TEXT,
          window_title TEXT,
          mode TEXT,
          user_prompt TEXT,
          response TEXT,
          ocr_preview TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )`, resolve);
      });
    });
  });
}

function saveHistory({ context, mode, userPrompt, response }) {
  const record = {
    timestamp: Date.now(),
    app_name: context?.app || '',
    window_title: context?.title || '',
    mode: mode || 'explain',
    user_prompt: userPrompt || '',
    response: response || '',
    ocr_preview: (context?.ocrText || '').slice(0, 200),
  };

  if (db) {
    db.run(
      `INSERT INTO history (timestamp, app_name, window_title, mode, user_prompt, response, ocr_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.timestamp, record.app_name, record.window_title, record.mode,
       record.user_prompt, record.response, record.ocr_preview]
    );
  } else {
    memoryStore.unshift(record);
    if (memoryStore.length > 200) memoryStore.pop();
  }
}

function getHistory(limit = 20) {
  if (db) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM history ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });
  }
  return Promise.resolve(memoryStore.slice(0, limit));
}

function clearHistory(callback = () => {}) {
  if (db) {
    db.run('DELETE FROM history', callback);
  } else {
    memoryStore.length = 0;
    callback();
  }
}

module.exports = { init, saveHistory, getHistory, clearHistory };

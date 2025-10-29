from flask import Flask, jsonify, request, send_from_directory, g
import sqlite3, os
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "attendance.db")

app = Flask(__name__, static_folder="static", static_url_path="/static")

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH, check_same_thread=False)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    db.execute("""CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        badge TEXT,
        notes TEXT
    )""")
    db.execute("""CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        note TEXT,
        FOREIGN KEY(agent_id) REFERENCES agents(id)
    )""")
    db.commit()

@app.before_first_request
def startup():
    init_db()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('static', path)

# Agents
@app.route('/api/agents', methods=['GET', 'POST'])
def agents():
    db = get_db()
    if request.method == 'GET':
        cur = db.execute('SELECT * FROM agents ORDER BY name')
        rows = cur.fetchall()
        return jsonify([dict(r) for r in rows])
    else:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        badge = (data.get('badge') or '').strip()
        notes = (data.get('notes') or '').strip()
        if not name:
            return jsonify({'error': 'name required'}), 400
        cur = db.execute('INSERT INTO agents (name, badge, notes) VALUES (?, ?, ?)', (name, badge, notes))
        db.commit()
        agent_id = cur.lastrowid
        cur = db.execute('SELECT * FROM agents WHERE id = ?', (agent_id,))
        row = cur.fetchone()
        return jsonify(dict(row)), 201

@app.route('/api/agents/<int:agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    db = get_db()
    db.execute('DELETE FROM agents WHERE id = ?', (agent_id,))
    db.execute('DELETE FROM attendance WHERE agent_id = ?', (agent_id,))
    db.commit()
    return jsonify({'ok': True})

# Attendance
@app.route('/api/attendance', methods=['POST'])
def log_attendance():
    db = get_db()
    data = request.get_json() or {}
    agent_id = data.get('agent_id')
    action = data.get('action')
    lat = data.get('latitude')
    lon = data.get('longitude')
    note = (data.get('note') or '').strip()
    if not agent_id or action not in ('checkin', 'checkout'):
        return jsonify({'error': 'agent_id and valid action required'}), 400
    timestamp = datetime.utcnow().isoformat() + 'Z'
    db.execute('INSERT INTO attendance (agent_id, action, timestamp, latitude, longitude, note) VALUES (?, ?, ?, ?, ?, ?)',
               (agent_id, action, timestamp, lat, lon, note))
    db.commit()
    return jsonify({'ok': True, 'timestamp': timestamp})

@app.route('/api/attendance/<int:agent_id>', methods=['GET'])
def get_attendance(agent_id):
    db = get_db()
    cur = db.execute('SELECT * FROM attendance WHERE agent_id = ? ORDER BY timestamp DESC', (agent_id,))
    rows = cur.fetchall()
    return jsonify([dict(r) for r in rows])

if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=5000, debug=True)

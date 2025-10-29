const api = async (path, method='GET', body) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:res.statusText}));
    throw err;
  }
  return res.json();
};

const agentsList = document.getElementById('agents-list');
const agentForm = document.getElementById('agent-form');
const agentName = document.getElementById('agent-name');
const agentBadge = document.getElementById('agent-badge');
const agentSelect = document.getElementById('agent-select');
const agentLogSelect = document.getElementById('agent-log-select');
const checkinBtn = document.getElementById('checkin-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const attendanceNote = document.getElementById('attendance-note');
const geoStatus = document.getElementById('geo-status');
const attendanceLog = document.getElementById('attendance-log');

async function loadAgents() {
  const agents = await api('/api/agents');
  agentsList.innerHTML = '';
  agentSelect.innerHTML = '<option value="">-- Seleziona --</option>';
  agentLogSelect.innerHTML = '<option value="">-- Seleziona --</option>';
  agents.forEach(a => {
    const div = document.createElement('div');
    div.className = 'agent';
    div.innerHTML = `<div>
      <strong>${escapeHtml(a.name)}</strong>
      ${a.badge? `<span class="badge">${escapeHtml(a.badge)}</span>` : ''}
    </div>
    <div>
      <button class="delete-btn" data-id="${a.id}">Elimina</button>
    </div>`;
    agentsList.appendChild(div);

    const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.name;
    agentSelect.appendChild(opt);
    const opt2 = opt.cloneNode(true); agentLogSelect.appendChild(opt2);
  });
}

agentForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const name = agentName.value.trim();
  if (!name) return;
  await api('/api/agents', 'POST', { name, badge: agentBadge.value.trim() });
  agentName.value=''; agentBadge.value='';
  await loadAgents();
});

agentsList.addEventListener('click', async (ev) => {
  const id = ev.target.dataset?.id;
  if (!id) return;
  if (!confirm('Eliminare agente e tutte le sue presenze?')) return;
  await api(`/api/agents/${id}`, 'DELETE');
  await loadAgents();
});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

async function performAction(action) {
  const agentId = agentSelect.value;
  if (!agentId) { alert('Seleziona un agente'); return; }
  let coords = {};
  if (navigator.geolocation) {
    geoStatus.textContent = 'Richiedo posizione…';
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:8000}));
      coords.latitude = pos.coords.latitude;
      coords.longitude = pos.coords.longitude;
      geoStatus.textContent = `Posizione catturata (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`;
    } catch (e) {
      geoStatus.textContent = 'Posizione non disponibile (consenti geolocalizzazione)';
    }
  } else {
    geoStatus.textContent = 'Geolocalizzazione non supportata';
  }

  await api('/api/attendance', 'POST', {
    agent_id: Number(agentId),
    action,
    latitude: coords.latitude,
    longitude: coords.longitude,
    note: attendanceNote.value.trim()
  });
  attendanceNote.value='';
  await loadLogForAgent(agentLogSelect.value || agentId);
  alert('Presenza registrata: ' + action);
}

checkinBtn.addEventListener('click', ()=>performAction('checkin'));
checkoutBtn.addEventListener('click', ()=>performAction('checkout'));

agentLogSelect.addEventListener('change', (ev)=>{
  loadLogForAgent(ev.target.value);
});

async function loadLogForAgent(agentId) {
  attendanceLog.innerHTML = '';
  if (!agentId) return;
  const rows = await api(`/api/attendance/${agentId}`);
  if (!rows.length) { attendanceLog.innerHTML = '<div class="muted small">Nessuna registrazione</div>'; return; }
  rows.forEach(r => {
    const d = new Date(r.timestamp);
    const li = document.createElement('div');
    li.className = 'agent';
    li.innerHTML = `<div>
      <strong>${r.action === 'checkin' ? 'Check-in' : 'Check-out'}</strong>
      <div class="small muted">${d.toLocaleString()}</div>
      ${r.latitude ? `<div class="small">Lat ${Number(r.latitude).toFixed(5)}, Lon ${Number(r.longitude).toFixed(5)}</div>` : ''}
      ${r.note ? `<div class="small">Nota: ${escapeHtml(r.note)}</div>` : ''}
    </div>`;
    attendanceLog.appendChild(li);
  });
}

(async function init(){
  await loadAgents();
})();

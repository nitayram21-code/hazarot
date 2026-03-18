// ===== Profile =====

const PROFILES_KEY = 'hazarot_profiles';
const ACTIVE_IDX_KEY = 'hazarot_active_profile';

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; } catch { return []; }
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function getActiveIndex() {
  const profiles = loadProfiles();
  if (!profiles.length) return -1;
  const idx = parseInt(localStorage.getItem(ACTIVE_IDX_KEY) || '0');
  return Math.min(idx, profiles.length - 1);
}

function setActiveIndex(idx) {
  localStorage.setItem(ACTIVE_IDX_KEY, String(idx));
}

function loadProfile() {
  const profiles = loadProfiles();
  const idx = getActiveIndex();
  return idx >= 0 ? profiles[idx] : null;
}

let profileModalMode = 'add';

function openProfile(mode = 'edit') {
  // If no profiles exist yet, treat any open as a new registration
  if (loadProfiles().length === 0) mode = 'add';
  profileModalMode = mode;
  const title = document.querySelector('.profile-modal-head h2');
  if (title) title.textContent = mode === 'add' ? 'הוסף הרכב' : 'ערוך פרופיל';

  if (mode === 'edit') {
    const p = loadProfile();
    if (p) {
      document.getElementById('p-first').value = p.firstName || '';
      document.getElementById('p-last').value = p.lastName || '';
      document.getElementById('p-band').value = p.bandName || '';
      document.getElementById('p-email').value = p.email || '';
    }
  } else {
    document.getElementById('p-first').value = '';
    document.getElementById('p-last').value = '';
    document.getElementById('p-band').value = '';
    document.getElementById('p-email').value = '';
  }
  document.getElementById('profile-overlay').classList.remove('hidden');
}

function goHome() {
  closeProfile();
  resetForm();
}

function renderLanding() {
  const profiles = loadProfiles();
  const activeIdx = getActiveIndex();
  const content = document.getElementById('landing-content');

  if (profiles.length > 0) {
    const activeProfile = profiles[activeIdx];
    const cardsHtml = profiles.map((p, i) => `
      <div class="profile-card ${i === activeIdx ? 'active' : ''}" onclick="switchProfile(${i})">
        <div class="profile-card-band">${p.bandName || p.firstName}</div>
        <div class="profile-card-name">${p.firstName} ${p.lastName}</div>
        <div class="profile-card-actions">
          <button class="profile-card-edit" onclick="editProfile(${i}, event)">ערוך</button>
          <button class="profile-card-delete" onclick="deleteProfile(${i}, event)">מחק</button>
        </div>
      </div>
    `).join('');

    content.innerHTML = `
      <p class="step-label">שלום,</p>
      <h1>${activeProfile.firstName}</h1>
      <p class="sub">בחרו הרכב או הוסיפו חדש</p>
      <div class="profile-cards">
        ${cardsHtml}
        <div class="profile-card profile-card-add" onclick="openProfile('add')">
          <div class="profile-card-add-icon">+</div>
          <div class="profile-card-band">הוסף הרכב</div>
        </div>
      </div>
      <button class="next-btn landing-main-btn" onclick="continueAsExisting()">המשך לחיפוש חדר</button>
      <button class="landing-guest-btn" onclick="continueAsGuest()">כניסה כאורח</button>
    `;
  } else {
    content.innerHTML = `
      <p class="step-label">ברוכים הבאים</p>
      <h1>HAZAROT</h1>
      <p class="sub">קבעו חזרות בקליק</p>
      <button class="next-btn landing-main-btn" onclick="continueAsGuest()">כניסה כאורח</button>
      <button class="landing-guest-btn" onclick="openProfile('add')">הרשמה לחיסכון בזמן ←</button>
    `;
  }
}

function switchProfile(index) {
  setActiveIndex(index);
  updateProfileBtn(loadProfile());
  renderLanding();
}

let isEditingProfile = false;

function editProfile(index, event) {
  event.stopPropagation();
  setActiveIndex(index);
  updateProfileBtn(loadProfile());

  const profile = loadProfile();
  state.bandName        = profile?.bandName || '';
  state.memberCount     = profile?.memberCount || 1;
  state.instruments     = [...(profile?.instruments || [])];
  state.specialRequests = profile?.specialRequests || '';

  document.getElementById('band-name').value         = state.bandName;
  document.getElementById('member-count').textContent = state.memberCount;
  renderInstruments();
  document.getElementById('special-requests').value  = state.specialRequests;

  isEditingProfile = true;
  document.querySelector('#step-3 .next-btn').textContent = 'שמור שינויים';
  goToStep(1);
}

function deleteProfile(index, event) {
  event.stopPropagation();
  const profiles = loadProfiles();
  profiles.splice(index, 1);
  saveProfiles(profiles);
  let activeIdx = getActiveIndex();
  if (activeIdx >= profiles.length) setActiveIndex(Math.max(0, profiles.length - 1));
  updateProfileBtn(loadProfile());
  renderLanding();
}

function continueAsExisting() {
  const profile = loadProfile();
  state.bandName        = profile?.bandName || '';
  state.memberCount     = profile?.memberCount || 1;
  state.instruments     = [...(profile?.instruments || [])];
  state.specialRequests = profile?.specialRequests || '';

  document.getElementById('band-name').value          = state.bandName;
  document.getElementById('member-count').textContent  = state.memberCount;
  renderInstruments();
  document.getElementById('special-requests').value   = state.specialRequests;
  document.getElementById('rehearsal-date').min = new Date().toISOString().split('T')[0];
  goToStep(4);
}

function continueAsGuest() {
  document.getElementById('band-name').value = '';
  goToStep(1);
}

function closeProfile() {
  document.getElementById('profile-overlay').classList.add('hidden');
}

function saveProfileForm() {
  const firstName = document.getElementById('p-first').value.trim();
  const lastName  = document.getElementById('p-last').value.trim();
  const bandName  = document.getElementById('p-band').value.trim();
  const email     = document.getElementById('p-email').value.trim();

  if (!firstName) { shake('p-first'); return; }
  if (!email)     { shake('p-email'); return; }

  const profiles = loadProfiles();
  const newProfile = { firstName, lastName, bandName, email };

  if (profileModalMode === 'add' || profiles.length === 0) {
    profiles.push(newProfile);
    setActiveIndex(profiles.length - 1);
  } else {
    profiles[getActiveIndex()] = newProfile;
  }

  saveProfiles(profiles);
  updateProfileBtn(loadProfile());
  closeProfile();

  if (profileModalMode === 'add') {
    // First time with this profile — go through the full flow
    document.getElementById('band-name').value = bandName;
    goToStep(1);
  } else {
    const bandInput = document.getElementById('band-name');
    if (bandName && !bandInput.value) bandInput.value = bandName;
    if (document.getElementById('step-home').classList.contains('active')) {
      renderLanding();
    }
  }
}

function updateProfileBtn(profile) {
  const btn = document.getElementById('profile-btn');
  if (profile) {
    const initials = ((profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')).toUpperCase();
    btn.innerHTML = `<span class="profile-initials">${initials || '?'}</span>`;
    btn.classList.add('has-profile');
    btn.title = `${profile.firstName} ${profile.lastName}`;
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
}

// ===== Theme =====

function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  localStorage.setItem('hazarot_theme', next);
}

document.addEventListener('DOMContentLoaded', () => {
  // Init theme
  const savedTheme = localStorage.getItem('hazarot_theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;

  // Migrate old single-profile format
  const oldProfile = localStorage.getItem('hazarot_profile');
  if (oldProfile && !localStorage.getItem(PROFILES_KEY)) {
    try {
      const p = JSON.parse(oldProfile);
      if (p) { saveProfiles([p]); setActiveIndex(0); }
    } catch {}
    localStorage.removeItem('hazarot_profile');
  }

  const profile = loadProfile();
  if (profile) {
    updateProfileBtn(profile);
    if (profile.bandName) document.getElementById('band-name').value = profile.bandName;
  }
  renderLanding();
});

// ===== State =====

const state = {
  bandName: '',
  memberCount: 1,
  instruments: [],
  specialRequests: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  roomNameQuery: '',
  selectedRoom: null
};

const roomsDB = {
  'tel-aviv': [
    { id: 1, name: 'סטודיו TLV', address: 'רחוב דיזנגוף 150, תל אביב', size: '40 מ"ר', capacity: 8, equipment: ['תופים', 'מגברים', 'PA'], pricePerHour: 120 },
    { id: 2, name: 'הרוק שוק', address: 'רחוב הרצל 22, תל אביב', size: '30 מ"ר', capacity: 6, equipment: ['תופים', 'מגברים'], pricePerHour: 80 },
    { id: 3, name: 'סאונד בייס', address: 'שדרות בן גוריון 5, תל אביב', size: '55 מ"ר', capacity: 12, equipment: ['תופים', 'מגברים', 'PA', 'מיקרופונים'], pricePerHour: 160 }
  ],
  'jerusalem': [
    { id: 4, name: 'ירושלים סטודיו', address: 'רחוב יפו 90, ירושלים', size: '35 מ"ר', capacity: 7, equipment: ['תופים', 'מגברים', 'PA'], pricePerHour: 100 },
    { id: 5, name: 'מוזיקה בירה', address: 'רחוב המלך ג׳ורג׳ 44, ירושלים', size: '28 מ"ר', capacity: 5, equipment: ['תופים', 'מגברים'], pricePerHour: 70 }
  ],
  'haifa': [
    { id: 6, name: 'כרמל ביט', address: 'רחוב הנשיא 12, חיפה', size: '45 מ"ר', capacity: 10, equipment: ['תופים', 'מגברים', 'PA', 'מיקרופונים'], pricePerHour: 110 },
    { id: 7, name: 'פורט רוק', address: 'רחוב פלי"ם 3, חיפה', size: '32 מ"ר', capacity: 6, equipment: ['תופים', 'מגברים'], pricePerHour: 75 }
  ],
  'ramat-gan': [
    { id: 8, name: 'גבעתיים גרוב', address: 'רחוב קרליבך 8, גבעתיים', size: '38 מ"ר', capacity: 8, equipment: ['תופים', 'מגברים', 'PA'], pricePerHour: 95 }
  ],
  'beersheba': [
    { id: 9, name: 'דסרט סאונד', address: 'רחוב הנגב 25, באר שבע', size: '50 מ"ר', capacity: 10, equipment: ['תופים', 'מגברים', 'PA', 'מיקרופונים'], pricePerHour: 90 }
  ]
};

const locationNames = {
  'tel-aviv': 'תל אביב',
  'jerusalem': 'ירושלים',
  'haifa': 'חיפה',
  'ramat-gan': 'רמת גן / גבעתיים',
  'beersheba': 'באר שבע'
};

// ===== Navigation =====

function goToStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));

  document.getElementById('step-' + n)?.classList.add('active');
  const dot = document.getElementById('dot-' + n);
  if (dot) dot.classList.add('active');
}

function goToStep2() {
  const val = document.getElementById('band-name').value.trim();
  if (!val) { shake('band-name'); return; }
  state.bandName = val;
  goToStep(2);
}

function goToStep3() {
  state.memberCount = parseInt(document.getElementById('member-count').textContent);
  goToStep(3);
}

function goToStep4() {
  state.specialRequests = document.getElementById('special-requests').value.trim();

  // Save preferences to active profile (always)
  const profiles = loadProfiles();
  const idx = getActiveIndex();
  if (idx >= 0 && profiles[idx]) {
    profiles[idx].bandName        = state.bandName;
    profiles[idx].memberCount     = state.memberCount;
    profiles[idx].instruments     = [...state.instruments];
    profiles[idx].specialRequests = state.specialRequests;
    saveProfiles(profiles);
  }

  if (isEditingProfile) {
    isEditingProfile = false;
    document.querySelector('#step-3 .next-btn').textContent = 'המשך';
    resetForm();
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rehearsal-date').min = today;
  goToStep(4);
}

// ===== Room Search =====

function searchRooms() {
  const date = document.getElementById('rehearsal-date').value;
  const startTime = document.getElementById('start-time').value;
  const endTime = document.getElementById('end-time').value;
  const location = document.getElementById('location-select').value;
  const roomNameQuery = document.getElementById('room-name-search').value.trim();

  if (!date) { shake('rehearsal-date'); return; }
  if (!startTime) { shake('start-time'); return; }
  if (!endTime) { shake('end-time'); return; }
  if (!location && !roomNameQuery) {
    shake('location-select');
    shake('room-name-search');
    return;
  }

  state.date = date;
  state.startTime = startTime;
  state.endTime = endTime;
  state.location = location;
  state.roomNameQuery = roomNameQuery;

  const allRooms = Object.values(roomsDB).flat();
  let rooms;

  if (roomNameQuery) {
    // Search by name across all rooms, optionally filtered by location too
    const q = roomNameQuery.toLowerCase();
    rooms = allRooms.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(q);
      const locationMatch = !location || Object.entries(roomsDB).some(
        ([key, list]) => key === location && list.find(lr => lr.id === r.id)
      );
      return nameMatch && locationMatch;
    });
  } else {
    rooms = roomsDB[location] || [];
  }

  // Show step 5 with dot 4 active
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
  document.getElementById('step-5').classList.add('active');
  document.getElementById('dot-4').classList.add('active');

  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const locationLabel = location ? locationNames[location] : 'כל האזורים';
  const nameLabel = roomNameQuery ? ` · "${roomNameQuery}"` : '';
  document.getElementById('results-sub').textContent =
    `${locationLabel}${nameLabel} · ${dateFormatted} · ${startTime}–${endTime}`;

  renderRooms(rooms);
}

let currentRooms = [];
let currentSort = 'none';

function renderRooms(rooms) {
  currentRooms = rooms;
  currentSort = 'none';
  applySort();
}

function setSort(type) {
  currentSort = type;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sort-' + type)?.classList.add('active');
  applySort();
}

function applySort() {
  const list = document.getElementById('rooms-list');

  if (!currentRooms.length) {
    list.innerHTML = `<div class="no-results">לא נמצאו חדרים באזור זה כרגע</div>`;
    return;
  }

  let sorted = [...currentRooms];
  if (currentSort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'he'));
  if (currentSort === 'price') sorted.sort((a, b) => a.pricePerHour - b.pricePerHour);

  list.innerHTML = sorted.map(room => `
    <div class="room-card">
      <div class="room-header">
        <div class="room-name">${room.name}</div>
        <div class="room-price">₪${room.pricePerHour}<span class="room-price-unit">/שעה</span></div>
      </div>
      <div class="room-meta">${room.size} · עד ${room.capacity} נגנים</div>
      <div class="room-address">${room.address}</div>
      <div class="room-equipment">
        ${room.equipment.map(e => `<span class="eq-chip">${e}</span>`).join('')}
      </div>
      <button class="select-room-btn" onclick="selectRoom(${room.id})">בחרו חדר זה</button>
    </div>
  `).join('');
}

function selectRoom(id) {
  const allRooms = Object.values(roomsDB).flat();
  state.selectedRoom = allRooms.find(r => r.id === id);
  submitBooking();
}

// ===== Confirmation =====

function submitBooking() {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
  document.getElementById('step-confirm').classList.add('active');

  const instList = state.instruments.length
    ? state.instruments.join('، ')
    : 'לא צוינו כלים';

  const dateFormatted = new Date(state.date + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const profile = loadProfile();

  document.getElementById('summary').innerHTML = `
    <div><strong>הרכב</strong><br>${state.bandName}</div>
    <div><strong>נגנים</strong><br>${state.memberCount}</div>
    <div><strong>כלים</strong><br>${instList}</div>
    ${state.specialRequests ? `<div><strong>בקשות מיוחדות</strong><br>${state.specialRequests}</div>` : ''}
    <div class="summary-divider"></div>
    <div><strong>חדר</strong><br>${state.selectedRoom?.name}</div>
    <div><strong>כתובת</strong><br>${state.selectedRoom?.address}</div>
    <div><strong>תאריך</strong><br>${dateFormatted}</div>
    <div><strong>שעות</strong><br>${state.startTime}–${state.endTime}</div>
    ${profile?.email ? `<div class="summary-divider"></div><div class="summary-email"><strong>אישור ישלח לאימייל</strong><br>${profile.email}</div>` : ''}
  `;
}

function resetForm() {
  state.bandName = '';
  state.memberCount = 1;
  state.instruments = [];
  state.specialRequests = '';
  state.date = '';
  state.startTime = '';
  state.endTime = '';
  state.location = '';
  state.selectedRoom = null;

  document.getElementById('band-name').value = '';
  document.getElementById('member-count').textContent = '1';
  document.getElementById('instrument-list').innerHTML = '';
  document.getElementById('instrument-input').value = '';
  document.getElementById('special-requests').value = '';
  document.getElementById('rehearsal-date').value = '';
  document.getElementById('start-time').value = '';
  document.getElementById('end-time').value = '';
  document.getElementById('location-select').value = '';
  document.getElementById('room-name-search').value = '';

  const profile = loadProfile();
  if (profile?.bandName) document.getElementById('band-name').value = profile.bandName;

  renderLanding();
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
  document.getElementById('step-home').classList.add('active');
}

// ===== Counter =====

function changeCount(delta) {
  const el = document.getElementById('member-count');
  let val = parseInt(el.textContent) + delta;
  if (val < 1) val = 1;
  if (val > 20) val = 20;
  el.textContent = val;
}

// ===== Instruments =====

function addInstrument() {
  const input = document.getElementById('instrument-input');
  const val = input.value.trim();
  if (!val) return;
  state.instruments.push(val);
  renderInstruments();
  input.value = '';
  input.focus();
}

function removeInstrument(i) {
  state.instruments.splice(i, 1);
  renderInstruments();
}

function renderInstruments() {
  const list = document.getElementById('instrument-list');
  list.innerHTML = state.instruments.map((ins, i) =>
    `<span class="instrument-tag">${ins}<button onclick="removeInstrument(${i})">×</button></span>`
  ).join('');
}

// ===== Enter key =====

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('.step.active');
  if (!active) return;

  if (active.id === 'step-1') goToStep2();
  else if (active.id === 'step-2') {
    const inp = document.getElementById('instrument-input');
    if (document.activeElement === inp && inp.value.trim()) addInstrument();
    else goToStep3();
  } else if (active.id === 'step-3') goToStep4();
  else if (active.id === 'step-4') searchRooms();
});

// ===== Shake =====

function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#e55';
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' }
  ], { duration: 300, easing: 'ease' });
  setTimeout(() => el.style.borderColor = '', 800);
}

// ── Complaints Page — Public + Admin (Saffron Edition) ───────────────
import { navigate } from '../router.js';

const API_URL = 'http://localhost:8000';
const ADMIN_PASSWORD = 'narad2026';

export function complaintsPage(app) {
  var isAdmin = localStorage.getItem('narad_admin') === 'true';

  app.innerHTML = `
  <div class="flex flex-col min-h-screen">
    <!-- TopNavBar -->
    <header class="bg-[#000e25] flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50">
      <div class="flex items-center gap-8">
        <span class="text-2xl font-black tracking-tighter text-[#ff9933] uppercase cursor-pointer" id="nav-home">NARAD AI</span>
        <nav class="hidden md:flex gap-6 items-center">
          <a href="#/" class="tracking-tight text-[#d6e3ff] hover:text-[#ff9933] transition-colors duration-200 cursor-pointer">Voice Agent</a>
          <a href="#/complaints" class="tracking-tight text-[#ff9933] border-b-2 border-[#ff9933] pb-1 transition-colors duration-200 cursor-pointer">Complaints</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        ${isAdmin
          ? '<div class="flex items-center gap-3"><span class="text-[10px] font-black tracking-widest uppercase text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/20">Admin Mode</span><button id="logout-btn" class="text-[10px] font-bold tracking-widest uppercase text-error/60 hover:text-error transition-colors cursor-pointer">Logout</button></div>'
          : '<button id="admin-btn" class="bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-bold text-sm tracking-tight hover:bg-primary transition-all active:scale-95 duration-150">ADMIN ACCESS</button>'
        }
      </div>
    </header>

    <main class="flex-grow pt-24 pb-16 px-8 max-w-7xl mx-auto w-full">

      <!-- Search Section -->
      <section class="mb-12">
        <div class="text-center mb-8">
          <span class="bg-tertiary-container/10 text-tertiary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-tertiary/20">
            Grievance Tracker
          </span>
          <h1 class="text-4xl md:text-5xl font-black tracking-tighter mt-4 text-on-surface uppercase leading-tight">
            Track Your <span class="text-primary-container">Complaint</span>
          </h1>
          <p class="text-sm text-on-surface-variant max-w-lg mx-auto mt-2 leading-relaxed">
            Enter your complaint token ID to check its current status, or browse all registered complaints below.
          </p>
        </div>

        <div class="max-w-2xl mx-auto relative">
          <input type="text" id="search-input" placeholder="Enter Token ID (e.g. NRD-A1B2C3)"
            class="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-5 py-4 text-lg font-mono tracking-widest text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container/50 transition-all">
          <button id="search-btn" class="absolute right-2 top-2 bottom-2 saffron-gradient px-6 rounded-lg font-black text-sm tracking-widest uppercase text-on-primary-container flex items-center gap-2 transition-all active:scale-95">
            <span class="material-symbols-outlined text-lg">search</span> Search
          </button>
        </div>

        <!-- Search Result -->
        <div id="search-result" class="hidden max-w-2xl mx-auto mt-6"></div>
      </section>

      <!-- All Complaints Table -->
      <section>
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-container text-lg">assignment</span>
            <h2 class="text-xs font-black tracking-[0.2em] uppercase text-on-surface">All Registered Complaints</h2>
          </div>
          <span id="complaint-count" class="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Loading...</span>
        </div>

        <div id="complaints-list" class="space-y-3">
          <div class="flex items-center justify-center py-16 opacity-30">
            <span class="material-symbols-outlined text-4xl animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        </div>
      </section>

    </main>

    <!-- Admin Login Modal -->
    <div id="admin-login-modal" class="hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="glass-panel border border-outline-variant/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center" style="animation:slideUp 0.3s ease">
        <span class="material-symbols-outlined text-5xl text-[#ff9933] mb-4">admin_panel_settings</span>
        <h3 class="text-lg font-black text-on-surface uppercase tracking-widest mb-2">Admin Login</h3>
        <p class="text-xs text-on-surface-variant/60 mb-6">Enter admin password to access management tools.</p>
        <input type="password" id="admin-password" placeholder="Enter password"
          class="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container/50 transition-all mb-3 text-center tracking-widest font-mono">
        <p id="admin-error" class="text-xs text-error font-bold mb-3 hidden">Incorrect password. Try again.</p>
        <div class="flex gap-3">
          <button id="admin-login-cancel" class="flex-1 py-3 rounded-lg border border-outline-variant/20 text-on-surface-variant text-sm font-bold uppercase tracking-widest hover:bg-surface-bright/50 transition-all cursor-pointer">Cancel</button>
          <button id="admin-login-submit" class="flex-1 py-3 rounded-lg saffron-gradient text-on-primary-container text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary-container/20 transition-all active:scale-95 cursor-pointer">Login</button>
        </div>
      </div>
    </div>

    <!-- Resolution Modal -->
    <div id="resolve-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="glass-panel border border-outline-variant/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 class="text-lg font-black text-on-surface uppercase tracking-widest mb-6">Resolve Complaint</h3>
        <p class="text-xs text-on-surface-variant mb-4">Token: <span id="modal-token" class="font-mono text-primary-container font-bold"></span></p>

        <label class="block text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1">Resolution Note</label>
        <textarea id="modal-note" rows="3" class="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container/50 transition-all mb-4" placeholder="Describe what was done..."></textarea>

        <label class="block text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1">Proof Image</label>
        <div id="upload-area" class="border-2 border-dashed border-outline-variant/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary-container/40 transition-colors mb-4">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">cloud_upload</span>
          <p class="text-xs text-on-surface-variant/50">Click to upload proof image</p>
          <input type="file" id="modal-image" accept="image/*" class="hidden">
          <img id="image-preview" class="hidden mt-4 rounded-lg max-h-40 mx-auto border border-outline-variant/10">
        </div>

        <div class="flex gap-3">
          <button id="modal-cancel" class="flex-1 py-3 rounded-lg border border-outline-variant/20 text-on-surface-variant text-sm font-bold uppercase tracking-widest hover:bg-surface-bright/50 transition-all">Cancel</button>
          <button id="modal-submit" class="flex-1 py-3 rounded-lg saffron-gradient text-on-primary-container text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary-container/20 transition-all active:scale-95">Resolve</button>
        </div>
      </div>
    </div>
  </div>
  `;

  // Add slideUp animation
  var animStyle = document.createElement('style');
  animStyle.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(animStyle);

  // ── DOM refs ──
  var searchInput = document.getElementById('search-input');
  var searchBtn = document.getElementById('search-btn');
  var searchResult = document.getElementById('search-result');
  var complaintsList = document.getElementById('complaints-list');
  var complaintCount = document.getElementById('complaint-count');
  var resolveModal = document.getElementById('resolve-modal');
  var modalToken = document.getElementById('modal-token');
  var modalNote = document.getElementById('modal-note');
  var modalImage = document.getElementById('modal-image');
  var modalSubmit = document.getElementById('modal-submit');
  var modalCancel = document.getElementById('modal-cancel');
  var uploadArea = document.getElementById('upload-area');
  var imagePreview = document.getElementById('image-preview');
  var adminLoginModal = document.getElementById('admin-login-modal');
  var adminPassword = document.getElementById('admin-password');
  var adminError = document.getElementById('admin-error');
  var adminLoginSubmit = document.getElementById('admin-login-submit');
  var adminLoginCancel = document.getElementById('admin-login-cancel');

  // Nav
  document.getElementById('nav-home').addEventListener('click', function () { navigate('/'); });

  // ── Admin Login Flow ──
  var adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    adminBtn.addEventListener('click', function () {
      adminLoginModal.classList.remove('hidden');
      adminPassword.value = '';
      adminError.classList.add('hidden');
      adminPassword.focus();
    });
  }

  if (adminLoginCancel) {
    adminLoginCancel.addEventListener('click', function () {
      adminLoginModal.classList.add('hidden');
    });
  }

  if (adminLoginSubmit) {
    adminLoginSubmit.addEventListener('click', function () {
      if (adminPassword.value === ADMIN_PASSWORD) {
        localStorage.setItem('narad_admin', 'true');
        adminLoginModal.classList.add('hidden');
        // Re-render page with admin mode
        complaintsPage(app);
      } else {
        adminError.classList.remove('hidden');
        adminPassword.value = '';
        adminPassword.focus();
      }
    });
  }

  if (adminPassword) {
    adminPassword.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') adminLoginSubmit.click();
    });
  }

  // ── Admin Logout ──
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('narad_admin');
      complaintsPage(app);
    });
  }

  // ── Search ──
  async function doSearch() {
    var id = searchInput.value.trim().toUpperCase();
    if (!id) return;
    searchResult.classList.remove('hidden');
    searchResult.innerHTML = '<div class="flex justify-center py-4"><span class="material-symbols-outlined animate-spin text-primary-container">progress_activity</span></div>';
    try {
      var res = await fetch(API_URL + '/complaint/' + encodeURIComponent(id));
      if (!res.ok) throw new Error('Not found');
      var c = await res.json();
      searchResult.innerHTML = buildComplaintCard(c, true);
    } catch (e) {
      searchResult.innerHTML = '<div class="glass-panel border border-error/20 rounded-xl p-6 text-center"><span class="material-symbols-outlined text-error text-3xl mb-2">search_off</span><p class="text-sm text-error font-bold">No complaint found with this token.</p><p class="text-xs text-on-surface-variant mt-1">Please double-check the token ID.</p></div>';
    }
  }
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') doSearch(); });

  // ── Load all complaints ──
  async function loadComplaints() {
    try {
      var res = await fetch(API_URL + '/complaints');
      var data = await res.json();
      var list = data.complaints || [];
      complaintCount.textContent = list.length + ' COMPLAINTS';

      if (list.length === 0) {
        complaintsList.innerHTML = '<div class="flex flex-col items-center justify-center py-16 opacity-20"><span class="material-symbols-outlined text-5xl text-on-surface-variant mb-4">inbox</span><p class="text-sm text-on-surface-variant">No complaints registered yet.</p></div>';
        return;
      }

      complaintsList.innerHTML = list.map(function (c) { return buildComplaintRow(c); }).join('');

      // Bind resolve buttons (admin only)
      if (isAdmin) {
        document.querySelectorAll('[data-resolve]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            openResolveModal(btn.dataset.resolve);
          });
        });
      }
    } catch (e) {
      complaintsList.innerHTML = '<div class="text-center py-8 text-error text-sm font-bold">Failed to load complaints.</div>';
    }
  }

  function statusBadge(status) {
    var colors = {
      'Pending':    'bg-[#ff9933]/10 text-[#ff9933] border-[#ff9933]/30',
      'In Progress':'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'Completed':  'bg-tertiary/10 text-tertiary border-tertiary/30',
    };
    var cls = colors[status] || colors['Pending'];
    return '<span class="px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ' + cls + '">' + (status || 'Pending') + '</span>';
  }

  function buildComplaintCard(c, detailed) {
    var proofHtml = '';
    if (c.proof_image) {
      proofHtml = '<div class="mt-4"><p class="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-2">Proof of Resolution</p><img src="' + API_URL + c.proof_image + '" class="rounded-lg max-h-48 border border-outline-variant/10"></div>';
    }
    return '<div class="glass-panel border border-outline-variant/10 rounded-xl p-6">' +
      '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
          '<span class="text-[10px] font-mono text-primary-container tracking-widest">' + (c.complaint_id || '—') + '</span>' +
          '<h3 class="text-xl font-black tracking-tight text-on-surface mt-1">' + (c.category || 'Complaint') + '</h3>' +
        '</div>' +
        statusBadge(c.status) +
      '</div>' +
      '<p class="text-sm text-on-surface-variant leading-relaxed mb-4">' + (c.summary || '—') + '</p>' +
      '<div class="grid grid-cols-3 gap-4 text-xs">' +
        '<div><span class="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest block">Citizen</span><span class="font-bold text-on-surface">' + (c.name || '—') + '</span></div>' +
        '<div><span class="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest block">Village</span><span class="font-bold text-on-surface">' + (c.village || '—') + '</span></div>' +
        '<div><span class="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest block">Filed</span><span class="font-bold text-on-surface">' + formatDate(c.timestamp) + '</span></div>' +
      '</div>' +
      (c.resolution_note ? '<div class="mt-4 pt-4 border-t border-outline-variant/10"><p class="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1">Resolution</p><p class="text-sm text-on-surface-variant">' + c.resolution_note + '</p></div>' : '') +
      proofHtml +
    '</div>';
  }

  function buildComplaintRow(c) {
    var actionCol = '';
    if (isAdmin && (!c.status || c.status === 'Pending' || c.status === 'In Progress')) {
      actionCol = '<button data-resolve="' + c.complaint_id + '" class="px-3 py-1.5 rounded-lg bg-tertiary/10 text-tertiary text-[10px] font-black uppercase tracking-widest border border-tertiary/20 hover:bg-tertiary/20 transition-all active:scale-95 flex items-center gap-1"><span class="material-symbols-outlined text-sm">check_circle</span>Resolve</button>';
    } else if (c.status === 'Completed') {
      actionCol = '<span class="flex items-center gap-1 text-tertiary text-[10px] font-bold"><span class="material-symbols-outlined text-sm">verified</span>Done</span>';
    }

    return '<div class="glass-panel border border-outline-variant/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-container/20 transition-all">' +
      '<div class="flex items-center gap-5 flex-grow">' +
        '<div class="flex-shrink-0 w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center"><span class="material-symbols-outlined text-primary-container">report</span></div>' +
        '<div class="flex-grow min-w-0">' +
          '<div class="flex items-center gap-3 mb-1">' +
            '<span class="font-mono text-[11px] text-primary-container tracking-widest font-bold">' + (c.complaint_id || '—') + '</span>' +
            statusBadge(c.status) +
          '</div>' +
          '<p class="text-sm text-on-surface font-bold truncate">' + (c.category || 'Complaint') + '</p>' +
          '<p class="text-xs text-on-surface-variant/60 truncate">' + (c.summary || '—') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-6 flex-shrink-0">' +
        '<div class="text-right hidden md:block">' +
          '<p class="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">' + (c.name || '—') + '</p>' +
          '<p class="text-[10px] text-on-surface-variant/30">' + (c.village || '') + ' • ' + formatDate(c.timestamp) + '</p>' +
        '</div>' +
        actionCol +
      '</div>' +
    '</div>';
  }

  function formatDate(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return '—'; }
  }

  // ── Resolve Modal ──
  var currentResolveId = null;

  function openResolveModal(id) {
    currentResolveId = id;
    modalToken.textContent = id;
    modalNote.value = '';
    modalImage.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.src = '';
    resolveModal.classList.remove('hidden');
  }

  modalCancel.addEventListener('click', function () {
    resolveModal.classList.add('hidden');
    currentResolveId = null;
  });

  uploadArea.addEventListener('click', function () { modalImage.click(); });
  modalImage.addEventListener('change', function () {
    if (modalImage.files && modalImage.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(modalImage.files[0]);
    }
  });

  modalSubmit.addEventListener('click', async function () {
    if (!currentResolveId) return;
    modalSubmit.disabled = true;
    modalSubmit.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span>';

    try {
      var formData = new FormData();
      formData.append('resolution_note', modalNote.value);
      if (modalImage.files && modalImage.files[0]) {
        formData.append('proof_image', modalImage.files[0]);
      }
      var res = await fetch(API_URL + '/complaint/' + currentResolveId + '/resolve', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed');
      resolveModal.classList.add('hidden');
      currentResolveId = null;
      loadComplaints(); // Refresh
    } catch (e) {
      alert('Failed to resolve complaint. Please try again.');
    } finally {
      modalSubmit.disabled = false;
      modalSubmit.textContent = 'Resolve';
    }
  });

  // Init
  loadComplaints();

  return function cleanup() {};
}

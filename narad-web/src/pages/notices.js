// ── Notices Page — Public Announcements (Saffron Edition) ────────────
import { navigate } from '../router.js';

const API_URL = 'http://localhost:8000';

export function noticesPage(app) {
  app.innerHTML = `
  <div class="flex flex-col min-h-screen">
    <!-- TopNavBar -->
    <header class="bg-[#000e25] flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50">
      <div class="flex items-center gap-8">
        <span class="text-2xl font-black tracking-tighter text-[#ff9933] uppercase cursor-pointer" id="nav-home">NARAD AI</span>
        <nav class="hidden md:flex gap-6 items-center">
          <a href="#/" class="tracking-tight text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Voice Agent</a>
          <a href="#/notices" class="tracking-tight text-[#ff9933] border-b-2 border-[#ff9933] pb-1 transition-colors duration-200 cursor-pointer">Notices</a>
          <a href="#/complaints" class="tracking-tight text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Complaints</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <button id="admin-btn" class="bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-bold text-sm tracking-tight hover:bg-primary transition-all active:scale-95 duration-150">
          ADMIN ACCESS
        </button>
      </div>
    </header>

    <main class="flex-grow pt-24 pb-16 px-8 max-w-5xl mx-auto w-full">

      <!-- Page Header -->
      <section class="mb-10">
        <div class="text-center mb-8">
          <span class="bg-tertiary-container/10 text-tertiary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-tertiary/20">
            सार्वजनिक सूचना
          </span>
          <h1 class="text-4xl md:text-5xl font-black tracking-tighter mt-4 text-on-surface uppercase leading-tight">
            Public <span class="text-primary-container">Notices</span>
          </h1>
          <p class="text-sm text-on-surface-variant max-w-lg mx-auto mt-2 leading-relaxed">
            Official announcements published by the administration for rural citizens.
          </p>
        </div>
      </section>

      <!-- Notices List -->
      <section>
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-container text-lg" style="font-variation-settings: 'FILL' 1;">campaign</span>
            <h2 class="text-xs font-black tracking-[0.2em] uppercase text-on-surface">All Announcements</h2>
          </div>
          <span id="notice-count" class="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Loading...</span>
        </div>

        <div id="notices-list" class="space-y-4">
          <div class="flex items-center justify-center py-16 opacity-30">
            <span class="material-symbols-outlined text-4xl animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        </div>
      </section>

    </main>
  </div>
  `;

  // Nav
  document.getElementById('nav-home').addEventListener('click', function () { navigate('/'); });
  document.getElementById('admin-btn').addEventListener('click', function () { navigate('/login'); });

  // Load notices
  loadNotices();

  async function loadNotices() {
    var noticesList = document.getElementById('notices-list');
    var noticeCount = document.getElementById('notice-count');

    try {
      var res = await fetch(API_URL + '/announcements');
      var data = await res.json();
      var list = data.announcements || [];
      noticeCount.textContent = list.length + ' NOTICES';

      if (list.length === 0) {
        noticesList.innerHTML =
          '<div class="flex flex-col items-center justify-center py-20 opacity-20">' +
            '<span class="material-symbols-outlined text-5xl text-on-surface-variant mb-4">notifications_off</span>' +
            '<p class="text-sm text-on-surface-variant">No public notices yet.</p>' +
          '</div>';
        return;
      }

      var urgencyConfig = {
        'urgent':    { color: 'border-l-red-500', bg: 'bg-red-500/5',        badge: 'bg-error/10 text-error border-error/30',                              label: '🚨 अत्यावश्यक', icon: 'warning' },
        'important': { color: 'border-l-[#ff9933]', bg: 'bg-[#ff9933]/5',    badge: 'bg-primary-container/10 text-primary-container border-primary-container/30', label: '⚠️ महत्वपूर्ण', icon: 'priority_high' },
        'normal':    { color: 'border-l-blue-400', bg: 'bg-blue-400/5',      badge: 'bg-blue-400/10 text-blue-400 border-blue-400/30',                       label: '📢 सामान्य', icon: 'info' },
      };

      noticesList.innerHTML = list.map(function (a, i) {
        var cfg = urgencyConfig[a.urgency] || urgencyConfig['normal'];
        return (
          '<div class="glass-panel border border-outline-variant/10 rounded-xl overflow-hidden ' + cfg.bg + ' border-l-4 ' + cfg.color + '" style="animation:slideUp 0.3s ease ' + (i * 0.05) + 's both">' +

            // Header bar
            '<div class="px-6 py-4 flex items-center justify-between border-b border-outline-variant/5">' +
              '<div class="flex items-center gap-3">' +
                '<span class="material-symbols-outlined text-primary-container" style="font-variation-settings:\'FILL\' 1;">campaign</span>' +
                '<span class="text-[10px] font-bold uppercase tracking-widest text-primary-container">' + (a.department || 'Government') + '</span>' +
              '</div>' +
              '<div class="flex items-center gap-3">' +
                '<span class="px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ' + cfg.badge + '">' + cfg.label + '</span>' +
                '<span class="text-[10px] text-on-surface-variant/30 font-semibold">' + formatDate(a.timestamp) + '</span>' +
              '</div>' +
            '</div>' +

            // Body
            '<div class="px-6 py-5">' +
              '<h3 class="text-lg font-black text-on-surface tracking-tight mb-3 leading-snug">' + (a.title || '') + '</h3>' +
              '<p class="text-sm text-on-surface/80 leading-relaxed whitespace-pre-line">' + (a.body || '') + '</p>' +
              (a.footer ? '<p class="mt-4 pt-3 border-t border-outline-variant/10 text-[10px] text-on-surface/40 font-semibold uppercase tracking-widest">' + a.footer + '</p>' : '') +
            '</div>' +

          '</div>'
        );
      }).join('');

    } catch (e) {
      noticesList.innerHTML =
        '<div class="text-center py-8 text-error text-sm font-bold">Failed to load notices.</div>';
    }
  }

  function formatDate(ts) {
    if (!ts) return '';
    try {
      var d = new Date(ts);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  // Add animation
  var animStyle = document.createElement('style');
  animStyle.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(animStyle);

  return function cleanup() {};
}

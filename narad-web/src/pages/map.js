// ── Geospatial Map Page (Saffron Edition) ─────────────────────────────
import { navigate } from '../router.js';

export function mapPage(app) {
  app.innerHTML = `
  <div class="flex h-screen overflow-hidden">
    <!-- TopNavBar (fixed) -->
    <header class="fixed top-0 z-50 bg-[#00132e] shadow-[0_32px_0_0_rgba(0,14,37,0.06)] w-full px-8 py-4 flex justify-between items-center tracking-tight">
      <div class="flex items-center gap-8">
        <div class="text-2xl font-black tracking-tighter text-[#ff9933] uppercase cursor-pointer" id="map-nav-home">NARAD AI</div>
        <nav class="hidden md:flex gap-6">
          <a id="map-nav-dash" class="text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Dashboard</a>
          <a class="text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Reports</a>
          <a class="text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Policy</a>
          <a class="text-[#d6e3ff] hover:text-[#ffc08d] transition-colors duration-200 cursor-pointer">Archive</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-surface-bright rounded-full transition-colors duration-200">
          <span class="material-symbols-outlined text-[#ff9933]">notifications</span>
        </button>
        <button class="p-2 hover:bg-surface-bright rounded-full transition-colors duration-200">
          <span class="material-symbols-outlined text-[#ff9933]">account_circle</span>
        </button>
      </div>
    </header>

    <div class="flex pt-[72px] w-full h-full">
      <!-- SideNavBar -->
      <aside class="hidden md:flex flex-col h-full py-6 bg-[#000e25] w-64 border-r border-[#554336]/15 uppercase tracking-widest text-xs shrink-0">
        <div class="px-6 mb-8">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg saffron-gradient flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-container text-lg" style="font-variation-settings: 'FILL' 1;">shield</span>
            </div>
            <div>
              <div class="text-[#ff9933] font-bold">Narad AI</div>
              <div class="text-[10px] text-[#d6e3ff]/60">Editorial Sovereignty</div>
            </div>
          </div>
        </div>
        <div class="flex-1 space-y-1">
          <a id="side-nav-dash" class="flex items-center gap-3 text-[#d6e3ff] mx-2 px-4 py-3 hover:bg-[#23395d]/50 hover:text-[#ff9933] transition-all duration-300 cursor-pointer">
            <span class="material-symbols-outlined">dashboard</span>
            <span>Overview</span>
          </a>
          <a class="flex items-center gap-3 bg-[#23395d] text-[#ff9933] rounded-lg mx-2 px-4 py-3 border-l-4 border-[#ff9933] transition-all duration-300 cursor-pointer">
            <span class="material-symbols-outlined">map</span>
            <span>Geospatial</span>
          </a>
          <a class="flex items-center gap-3 text-[#d6e3ff] mx-2 px-4 py-3 hover:bg-[#23395d]/50 hover:text-[#ff9933] transition-all duration-300 cursor-pointer">
            <span class="material-symbols-outlined">construction</span>
            <span>Public Works</span>
          </a>
          <a class="flex items-center gap-3 text-[#d6e3ff] mx-2 px-4 py-3 hover:bg-[#23395d]/50 hover:text-[#ff9933] transition-all duration-300 cursor-pointer">
            <span class="material-symbols-outlined">payments</span>
            <span>Finance</span>
          </a>
          <a class="flex items-center gap-3 text-[#d6e3ff] mx-2 px-4 py-3 hover:bg-[#23395d]/50 hover:text-[#ff9933] transition-all duration-300 cursor-pointer">
            <span class="material-symbols-outlined">gavel</span>
            <span>Grievances</span>
          </a>
        </div>
        <div class="px-4 mt-auto space-y-1">
          <button id="map-scrape-btn" class="w-full saffron-gradient text-on-primary-container font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-4 hover:scale-95 transition-transform duration-150">
            <span class="material-symbols-outlined">bolt</span>
            <span>New Entry</span>
          </button>
          <a class="flex items-center gap-3 text-[#d6e3ff] px-4 py-2 hover:text-[#ff9933] transition-colors cursor-pointer">
            <span class="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a id="map-nav-logout" class="flex items-center gap-3 text-[#d6e3ff] px-4 py-2 hover:text-[#ff9933] transition-colors cursor-pointer">
            <span class="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 relative bg-surface-container-lowest overflow-hidden">
        <!-- Map Container -->
        <div id="map-container" class="absolute inset-0 z-0"></div>

        <!-- UI Overlay: Top Search & Stats -->
        <div class="absolute top-8 left-8 right-[340px] flex justify-between items-start pointer-events-none z-10">
          <div class="glass-panel p-1 rounded-full border border-[#554336]/15 flex items-center gap-2 px-4 w-96 pointer-events-auto">
            <span class="material-symbols-outlined text-[#ff9933]">search</span>
            <input class="bg-transparent border-none focus:ring-0 text-sm w-full py-2 placeholder-[#d6e3ff]/30 text-on-surface" placeholder="Search Geospatial Data Nodes..." type="text" />
          </div>
          <div class="flex gap-4 pointer-events-auto">
            <div class="glass-panel px-6 py-4 rounded-xl border border-[#554336]/10 text-center">
              <div class="text-[10px] font-bold uppercase tracking-widest text-[#ff9933] mb-1">Total Assets</div>
              <div id="stat-total" class="text-2xl font-black">--</div>
            </div>
            <div class="glass-panel px-6 py-4 rounded-xl border border-[#554336]/10 text-center">
              <div class="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">Stable Nodes</div>
              <div id="stat-stable" class="text-2xl font-black">--</div>
            </div>
          </div>
        </div>

        <!-- AI Governance Insight Card -->
        <div class="absolute bottom-8 left-8 w-[400px] z-10">
          <div class="glass-panel p-6 rounded-xl border-t-4 border-[#ff9933] shadow-2xl relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-32 h-32 bg-[#ff9933]/5 rounded-full blur-3xl"></div>
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-[#ff9933]/10 rounded-lg">
                <span class="material-symbols-outlined text-[#ff9933]">psychology</span>
              </div>
              <h3 class="text-lg font-bold tracking-tight">AI Governance Insight</h3>
            </div>
            <p id="ai-insight" class="text-sm leading-relaxed text-on-surface/80 mb-6">
              Loading geospatial intelligence data...
            </p>
            <div class="flex items-center justify-between">
              <div class="flex gap-2">
                <span class="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase">Reliability: 98%</span>
              </div>
              <button class="text-primary text-xs font-bold border-b-2 border-primary/30 hover:border-primary transition-all">View Full Analysis</button>
            </div>
          </div>
        </div>

        <!-- Right Filter Panel -->
        <div class="absolute inset-y-8 right-8 w-[300px] flex flex-col gap-4 z-10">
          <div class="glass-panel flex-1 rounded-xl border border-[#554336]/15 flex flex-col p-6 shadow-2xl overflow-y-auto">
            <div class="flex items-center gap-2 mb-8">
              <span class="material-symbols-outlined text-[#ff9933]">filter_list</span>
              <h2 class="text-sm font-bold uppercase tracking-widest">Map Configuration</h2>
            </div>
            <div class="space-y-8 flex-1 overflow-y-auto pr-2">
              <!-- Sensitivity Level -->
              <section>
                <label class="text-[10px] font-black text-[#ff9933] uppercase tracking-tighter mb-4 block">Sensitivity Level</label>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input checked class="w-4 h-4 rounded border-[#ff9933]/40 bg-transparent text-[#ff9933] focus:ring-[#ff9933]" type="checkbox" data-filter="high" />
                    <span class="text-sm text-on-surface/70 group-hover:text-[#ff9933] transition-colors">High Sensitivity</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-[#ff9933]"></span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input checked class="w-4 h-4 rounded border-orange-400 bg-transparent text-orange-500 focus:ring-orange-500" type="checkbox" data-filter="medium" />
                    <span class="text-sm text-on-surface/70 group-hover:text-orange-500 transition-colors">Medium Concern</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-orange-500"></span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input checked class="w-4 h-4 rounded border-[#78e562]/40 bg-transparent text-[#78e562] focus:ring-[#78e562]" type="checkbox" data-filter="stable" />
                    <span class="text-sm text-on-surface/70 group-hover:text-[#78e562] transition-colors">Stable Regions</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-[#78e562]"></span>
                  </label>
                </div>
              </section>
              <!-- Departments -->
              <section>
                <label class="text-[10px] font-black text-[#ff9933] uppercase tracking-tighter mb-4 block">Departments</label>
                <div class="grid grid-cols-1 gap-2">
                  <button class="text-left px-4 py-2 rounded-lg bg-surface-bright/50 border border-[#ff9933]/10 text-xs font-medium hover:bg-surface-bright transition-colors">Infrastructure & Works</button>
                  <button class="text-left px-4 py-2 rounded-lg bg-transparent border border-white/5 text-xs font-medium hover:bg-surface-bright transition-colors">Defense & Border</button>
                  <button class="text-left px-4 py-2 rounded-lg bg-transparent border border-white/5 text-xs font-medium hover:bg-surface-bright transition-colors">Natural Resources</button>
                  <button class="text-left px-4 py-2 rounded-lg bg-transparent border border-white/5 text-xs font-medium hover:bg-surface-bright transition-colors">Urban Development</button>
                </div>
              </section>
              <!-- Layer Density -->
              <section>
                <label class="text-[10px] font-black text-[#ff9933] uppercase tracking-tighter mb-4 block">Data Density</label>
                <input class="w-full accent-[#ff9933] bg-surface-container-highest rounded-lg appearance-none h-1" type="range" />
                <div class="flex justify-between text-[8px] text-on-surface/50 mt-2 font-bold uppercase">
                  <span>Minimum</span>
                  <span>Real-time</span>
                </div>
              </section>
            </div>
            <div class="mt-8 pt-6 border-t border-[#554336]/20">
              <button id="map-trigger-scrape" class="w-full saffron-gradient text-on-primary-container font-black py-4 rounded-xl shadow-lg shadow-[#ff9933]/20 flex items-center justify-center gap-3 group hover:scale-[1.02] transition-transform duration-200">
                <span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">sync</span>
                <span class="tracking-tight uppercase text-sm">Trigger Web Scrape</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  `;

  // ── Navigation ──
  document.getElementById('map-nav-home').addEventListener('click', () => navigate('/'));
  document.getElementById('map-nav-dash').addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('side-nav-dash').addEventListener('click', () => navigate('/dashboard'));
  document.getElementById('map-nav-logout').addEventListener('click', () => navigate('/'));

  // ── Initialize Leaflet Map ──
  const L = window.L;
  if (!L) {
    // Load Leaflet JS dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);
  } else {
    initMap();
  }

  function initMap() {
    const L = window.L;
    const map = L.map('map-container', {
      zoomControl: true,
      attributionControl: false,
    }).setView([22.5, 82.0], 5);

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Sample complaint data points (matches complaint_data_with_coords.json structure)
    const samplePoints = [
      { lat: 28.6139, lon: 77.2090, topic: 'Infrastructure Deficit', brief: 'Pothole-ridden roads from Connaught Place to India Gate causing frequent accidents.', sentiment: -0.7, votes: 142, location: 'Delhi' },
      { lat: 26.8467, lon: 80.9462, topic: 'Water Supply Crisis', brief: 'Borewells running dry in Lucknow suburbs, residents facing acute water shortage.', sentiment: -0.85, votes: 89, location: 'Lucknow' },
      { lat: 19.0760, lon: 72.8777, topic: 'Public Transport Overcrowding', brief: 'Local trains running at 200% capacity during peak hours creating safety hazard.', sentiment: -0.6, votes: 231, location: 'Mumbai' },
      { lat: 12.9716, lon: 77.5946, topic: 'Digital Literacy Program', brief: 'Government-run free coding bootcamp for rural youth showing 85% placement rate.', sentiment: 0.8, votes: 67, location: 'Bangalore' },
      { lat: 22.5726, lon: 88.3639, topic: 'Flood Relief Coordination', brief: 'AI-based early warning system successfully evacuated 12,000 residents before Cyclone Mocha.', sentiment: 0.5, votes: 178, location: 'Kolkata' },
      { lat: 17.3850, lon: 78.4867, topic: 'Ration Card Delays', brief: 'New applicants waiting 6+ months for ration card processing in old city area.', sentiment: -0.9, votes: 156, location: 'Hyderabad' },
      { lat: 23.2599, lon: 77.4126, topic: 'Solar Energy Adoption', brief: 'Bhopal solar farm initiative powering 5,000 rural households with clean energy.', sentiment: 0.7, votes: 45, location: 'Bhopal' },
      { lat: 26.9124, lon: 75.7873, topic: 'Heritage Conservation', brief: 'Citizens demand better protection for 200-year-old step wells being damaged by construction.', sentiment: -0.4, votes: 98, location: 'Jaipur' },
      { lat: 21.1702, lon: 72.8311, topic: 'Industrial Pollution', brief: 'Chemical factory runoff contaminating Tapi River affecting downstream villages.', sentiment: -0.95, votes: 312, location: 'Surat' },
      { lat: 30.7333, lon: 76.7794, topic: 'Smart City Progress', brief: 'Chandigarh smart city project on track — 70% of IoT sensors deployed citywide.', sentiment: 0.6, votes: 52, location: 'Chandigarh' },
    ];

    // Color helper
    function sentimentColor(score) {
      if (score < -0.5) return '#ff4444';
      if (score < -0.2) return '#ff9933';
      if (score < 0.2) return '#ffbb33';
      return '#78e562';
    }

    function sentimentLevel(score) {
      if (score < -0.5) return 'high';
      if (score < 0) return 'medium';
      return 'stable';
    }

    // Add markers
    const markers = [];
    samplePoints.forEach(pt => {
      const color = sentimentColor(pt.sentiment);
      const radius = Math.max(6, Math.log(pt.votes + 1) * 3);
      const marker = L.circleMarker([pt.lat, pt.lon], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.75,
        weight: 2,
      }).addTo(map);

      marker._data = { ...pt, level: sentimentLevel(pt.sentiment) };

      marker.bindPopup(
        '<div style="font-family: \'Public Sans\', sans-serif; min-width: 220px; padding: 4px;">' +
          '<div style="font-size: 13px; font-weight: 700; color: ' + color + '; margin-bottom: 4px;">' + pt.topic + '</div>' +
          '<div style="font-size: 11px; color: #d6e3ff; line-height: 1.5; margin-bottom: 8px;">' + pt.brief + '</div>' +
          '<hr style="border-color: #554336; margin: 6px 0;" />' +
          '<div style="font-size: 11px; color: #d6e3ff;">' +
            '📍 ' + pt.location + ' &nbsp;|&nbsp; ' +
            '⬆ ' + pt.votes + ' votes &nbsp;|&nbsp; ' +
            'Sentiment: <b>' + pt.sentiment.toFixed(2) + '</b>' +
          '</div>' +
        '</div>'
      , { maxWidth: 280 });

      marker.bindTooltip(pt.topic + ' — ' + pt.location, {
        className: 'glass-panel',
        direction: 'top',
        offset: [0, -10],
      });

      markers.push(marker);
    });

    // Update stats
    document.getElementById('stat-total').textContent = samplePoints.length.toLocaleString();
    const stableCount = samplePoints.filter(p => p.sentiment > 0).length;
    document.getElementById('stat-stable').textContent = Math.round((stableCount / samplePoints.length) * 100) + '%';

    // AI insight
    const negatives = samplePoints.filter(p => p.sentiment < -0.5);
    if (negatives.length > 0) {
      const worst = negatives.sort((a, b) => a.sentiment - b.sentiment)[0];
      document.getElementById('ai-insight').textContent =
        'Sentinel analysis detected ' + negatives.length + ' high-sensitivity nodes across the network. ' +
        'Critical alert in ' + worst.location + ': "' + worst.topic + '" with sentiment score ' + worst.sentiment.toFixed(2) + '. ' +
        'Recommend triggering a focused web scrape to cross-reference local sentiment data.';
    }

    // Filter functionality
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const activeFilters = [...document.querySelectorAll('[data-filter]:checked')].map(c => c.dataset.filter);
        markers.forEach(m => {
          const isVisible = activeFilters.includes(m._data.level);
          if (isVisible) {
            m.addTo(map);
          } else {
            map.removeLayer(m);
          }
        });
      });
    });

    // Fix map size on next tick
    setTimeout(() => map.invalidateSize(), 100);
  }

  // Cleanup function for when user navigates away
  return () => {
    // Leaflet cleanup if needed
    const container = document.getElementById('map-container');
    if (container && container._leaflet_id) {
      // Map will be cleaned up when DOM is replaced
    }
  };
}

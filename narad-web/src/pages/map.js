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

  // Scrape button
  document.getElementById('map-trigger-scrape').addEventListener('click', async () => {
    const btn = document.getElementById('map-trigger-scrape');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> <span>Scraping...</span>';
    
    try {
        const res = await fetch('http://localhost:8000/scrape', { method: 'POST' });
        const result = await res.json();
        
        if (result.status === "success") {
            alert(`Successfully scraped ${result.count} complaints!`);
            window.location.reload(); // Refresh to show new points on map
        }
    } catch (e) {
        alert("Connection to Voice API failed.");
    } finally {
        btn.innerHTML = originalContent;
    }
  });

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

  async function initMap() {
    const L = window.L;
    const map = L.map('map-container', {
      zoomControl: true,
      attributionControl: false,
    }).setView([22.5, 82.0], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

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

    const markers = [];

    try {
        const response = await fetch('http://localhost:8000/get-map-data');
        const data = await response.json();

        if (data.length === 0) {
            document.getElementById('ai-insight').textContent = "No data available.";
            return;
        }

        data.forEach(post => {
            (post.coords || []).forEach(coord => {
                const color = sentimentColor(post.sentiment_score);
                const votes = post.Votes || post.votes || 0;
                const radius = Math.max(6, Math.log(votes + 1) * 4);

                const marker = L.circleMarker([coord.lat, coord.lon], {
                    radius: radius,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.75,
                    weight: 2,
                }).addTo(map);

                marker._data = { level: sentimentLevel(post.sentiment_score) };

                // 1. Define the Popup Content
                const popupContent = `
                    <div style="font-family: 'Public Sans', sans-serif; min-width: 220px; padding: 4px;">
                      <div style="font-size: 13px; font-weight: 700; color: ${color}; margin-bottom: 4px;">
                        ${post.topic}
                      </div>
                      <div style="font-size: 11px; color: #d6e3ff; line-height: 1.5; margin-bottom: 8px;">
                        ${post.brief}
                      </div>
                      <hr style="border-color: #554336; margin: 6px 0;" />
                      <div style="font-size: 11px; color: #d6e3ff;">
                        📍 ${coord.name} &nbsp;|&nbsp; 
                        ⬆ ${votes} votes &nbsp;|&nbsp; 
                        Sentiment: <b>${post.sentiment_score.toFixed(2)}</b>
                      </div>
                    </div>
                `;

                // 2. Bind the popup but disable auto-panning and close buttons for a smooth hover experience
                marker.bindPopup(popupContent, {
                    maxWidth: 280,
                    closeButton: false, 
                    autoPan: false,
                    offset: [0, -5] 
                });

                // 3. ADD HOVER LISTENERS
                marker.on('mouseover', function (e) {
                    this.openPopup();
                });
                
                marker.on('mouseout', function (e) {
                    this.closePopup();
                });

                markers.push(marker);
            });
        });

        // Update UI Stats
        document.getElementById('stat-total').textContent = data.length;
        const stableCount = data.filter(post => post.sentiment_score > 0).length;
        document.getElementById('stat-stable').textContent = Math.round((stableCount / data.length) * 100) + '%';
        
        // AI insight logic
        const negatives = data.filter(p => p.sentiment_score < -0.5);
        if (negatives.length > 0) {
          const worst = negatives.sort((a, b) => a.sentiment_score - b.sentiment_score)[0];
          document.getElementById('ai-insight').textContent = 
            `Sentinel detected ${negatives.length} high-sensitivity nodes. Critical alert in ${worst.location || 'system'}: "${worst.topic}"`;
        } else {
          document.getElementById('ai-insight').textContent = `System processed ${data.length} complaints. Geospatial mapping active.`;
        }

    } catch (err) {
        console.error("Failed to load map data:", err);
    }

    // Filter functionality (remains the same)
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const activeFilters = [...document.querySelectorAll('[data-filter]:checked')].map(c => c.dataset.filter);
        markers.forEach(m => {
          const isVisible = activeFilters.includes(m._data.level);
          if (isVisible) { m.addTo(map); } else { map.removeLayer(m); }
        });
      });
    });

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

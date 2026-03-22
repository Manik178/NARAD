// ── Admin Dashboard Page (Saffron Edition) ───────────────────────────
import { navigate } from '../router.js';

export function dashboardPage(app) {
  app.innerHTML = `
  <div class="flex min-h-screen">
    <!-- SideNavBar -->
    <aside class="hidden md:flex flex-col h-screen w-64 border-r border-outline-variant/15 bg-surface-container-lowest py-6 shrink-0 sticky top-0">
      <div class="px-6 mb-10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg saffron-gradient flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary-container text-xl" style="font-variation-settings: 'FILL' 1;">shield</span>
          </div>
          <div>
            <h1 class="text-primary-container font-bold tracking-tighter text-lg uppercase cursor-pointer" id="nav-home">NARAD AI</h1>
            <p class="text-[10px] text-on-surface-variant tracking-[0.2em] font-medium uppercase leading-none mt-1">Editorial Sovereignty</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 space-y-1">
        <a class="bg-surface-bright text-primary-container rounded-lg mx-2 px-4 py-3 border-l-4 border-primary-container flex items-center gap-4 transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">dashboard</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Overview</span>
        </a>
        <a id="nav-map" class="text-on-surface/70 mx-2 px-4 py-3 flex items-center gap-4 hover:bg-surface-bright/50 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined">map</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Geospatial</span>
        </a>
        <a class="text-on-surface/70 mx-2 px-4 py-3 flex items-center gap-4 hover:bg-surface-bright/50 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined">construction</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Public Works</span>
        </a>
        <a class="text-on-surface/70 mx-2 px-4 py-3 flex items-center gap-4 hover:bg-surface-bright/50 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined">payments</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Finance</span>
        </a>
        <a class="text-on-surface/70 mx-2 px-4 py-3 flex items-center gap-4 hover:bg-surface-bright/50 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined">gavel</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Grievances</span>
        </a>
        <a class="text-on-surface/70 mx-2 px-4 py-3 flex items-center gap-4 hover:bg-surface-bright/50 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined">analytics</span>
          <span class="uppercase tracking-widest text-xs font-semibold">Analytics</span>
        </a>
      </nav>
      <div class="px-4 py-4">
        <button class="w-full saffron-gradient text-on-primary-container font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
          <span class="material-symbols-outlined">add</span>
          <span class="uppercase tracking-widest text-xs font-bold">New Entry</span>
        </button>
      </div>
      <div class="mt-auto space-y-1 pt-4 border-t border-outline-variant/10">
        <a class="text-on-surface/50 mx-2 px-4 py-2 flex items-center gap-4 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined text-sm">settings</span>
          <span class="uppercase tracking-widest text-[10px] font-semibold">Settings</span>
        </a>
        <a id="nav-logout" class="text-on-surface/50 mx-2 px-4 py-2 flex items-center gap-4 hover:text-primary-container transition-all duration-300 cursor-pointer">
          <span class="material-symbols-outlined text-sm">logout</span>
          <span class="uppercase tracking-widest text-[10px] font-semibold">Logout</span>
        </a>
      </div>
    </aside>

    <main class="flex-1 flex flex-col">
      <!-- TopNavBar -->
      <header class="bg-surface-container-lowest shadow-[0_32px_0_0_rgba(0,14,37,0.06)] flex justify-between items-center w-full px-8 py-4 sticky top-0 z-10">
        <div class="flex items-center gap-8">
          <div class="md:hidden">
            <h1 class="text-primary-container font-black tracking-tighter text-2xl uppercase">NARAD AI</h1>
          </div>
          <nav class="hidden md:flex gap-6 items-center">
            <a class="text-primary-container border-b-2 border-primary-container pb-1 tracking-tight hover:text-primary transition-colors duration-200 cursor-pointer">Dashboard</a>
            <a class="text-on-surface tracking-tight hover:text-primary transition-colors duration-200 cursor-pointer">Reports</a>
            <a class="text-on-surface tracking-tight hover:text-primary transition-colors duration-200 cursor-pointer">Policy</a>
            <a class="text-on-surface tracking-tight hover:text-primary transition-colors duration-200 cursor-pointer">Archive</a>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <button id="scrape-btn" class="flex items-center gap-2 bg-surface-bright px-4 py-2 rounded-lg border border-primary-container/20 group hover:border-primary-container transition-all">
            <span class="material-symbols-outlined text-primary-container group-hover:rotate-180 transition-transform duration-500">sync</span>
            <span class="text-primary-container font-bold text-xs uppercase tracking-wider">Trigger Web Scrape</span>
          </button>
          <div class="flex items-center gap-2 text-on-surface ml-4">
            <span class="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">notifications</span>
            <span class="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">account_circle</span>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="p-8 space-y-8 max-w-7xl mx-auto w-full">
        <!-- Page Header -->
        <div class="flex justify-between items-end">
          <div>
            <p class="text-primary font-label text-xs tracking-widest uppercase mb-1">Central Intelligence Hub</p>
            <h2 class="text-4xl font-black text-on-surface tracking-tighter">Operational Overview</h2>
          </div>
          <div class="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full border border-outline-variant/15">
            <div class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <span class="text-xs font-semibold text-tertiary uppercase tracking-tighter">System Live: 99.8% Reach</span>
          </div>
        </div>

        <!-- Bento Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Large Card -->
          <div class="md:col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div>
              <span class="material-symbols-outlined text-primary-container mb-4 text-3xl">hub</span>
              <h3 class="text-on-surface/60 font-label text-[10px] tracking-[0.2em] uppercase">Active Neural Queries</h3>
              <p id="metric-queries" class="text-5xl font-black text-on-surface mt-2 tracking-tighter">1,284</p>
            </div>
            <div class="mt-8 flex items-center justify-between">
              <div class="flex -space-x-2">
                <div class="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-bright flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary-container text-xs">person</span>
                </div>
                <div class="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-xs">person</span>
                </div>
                <div class="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-bright flex items-center justify-center text-[10px] font-bold text-primary">+12</div>
              </div>
              <span class="text-tertiary text-xs font-bold">+12% from yesterday</span>
            </div>
          </div>
          <!-- Small Card 1 -->
          <div class="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between hover:bg-surface-bright transition-colors cursor-pointer group">
            <div>
              <span class="material-symbols-outlined text-primary-container mb-4 text-3xl group-hover:scale-110 transition-transform">agriculture</span>
              <h3 class="text-on-surface/60 font-label text-[10px] tracking-[0.2em] uppercase">Rural Outreach</h3>
            </div>
            <div>
              <p class="text-3xl font-black text-on-surface tracking-tighter">84.2%</p>
              <div class="w-full bg-surface-container-highest h-1 mt-3 rounded-full overflow-hidden">
                <div class="bg-primary-container h-full w-[84%]"></div>
              </div>
            </div>
          </div>
          <!-- Small Card 2 -->
          <div class="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between hover:bg-surface-bright transition-colors cursor-pointer group">
            <div>
              <span class="material-symbols-outlined text-primary-container mb-4 text-3xl group-hover:scale-110 transition-transform">database</span>
              <h3 class="text-on-surface/60 font-label text-[10px] tracking-[0.2em] uppercase">Data Harvested</h3>
            </div>
            <div>
              <p class="text-3xl font-black text-on-surface tracking-tighter">42.8 GB</p>
              <p class="text-[10px] text-tertiary font-bold mt-1 uppercase tracking-widest">Optimized Streams</p>
            </div>
          </div>
        </div>

        <!-- Intelligence Stream Table -->
        <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/5">
          <div class="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 class="text-xl font-bold text-on-surface">Intelligence Stream</h3>
              <p class="text-xs text-on-surface/50 mt-1 uppercase tracking-widest font-semibold">Real-time routing and source analysis</p>
            </div>
            <div class="flex gap-2">
              <div class="relative">
                <input class="bg-surface-container-highest border-none text-xs rounded-lg px-10 py-2.5 w-64 focus:ring-1 focus:ring-primary-container text-on-surface placeholder:text-on-surface/30" placeholder="Search Queries..." type="text" />
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface/30 text-sm">search</span>
              </div>
              <button class="bg-surface-bright text-on-surface p-2.5 rounded-lg hover:text-primary-container transition-colors">
                <span class="material-symbols-outlined text-sm">filter_list</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low">
                  <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Topic / Query</th>
                  <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Source Intelligence</th>
                  <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Dept Routing</th>
                  <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface/40 text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody id="intel-tbody" class="divide-y divide-outline-variant/10">
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-6 py-5">
                    <p class="text-sm font-bold text-on-surface">Soil health subsidies (Kharif season)</p>
                    <p class="text-[10px] text-on-surface/40 mt-1">#Agriculture #Sustainability</p>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <span class="material-symbols-outlined text-xs">person</span>
                      </div>
                      <span class="text-xs font-semibold text-on-surface/80">Rural User (Direct)</span>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-[10px] font-bold bg-surface-bright px-3 py-1 rounded-full text-primary tracking-widest uppercase">Panchayat Raj</span>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <span class="text-[10px] font-bold text-tertiary uppercase tracking-widest">Verified</span>
                  </td>
                </tr>
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-6 py-5">
                    <p class="text-sm font-bold text-on-surface">Market price fluctuations: r/IndiaFinance</p>
                    <p class="text-[10px] text-on-surface/40 mt-1">#Economics #Sentiment</p>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-xs">public</span>
                      </div>
                      <span class="text-xs font-semibold text-on-surface/80">Reddit Scrape</span>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-[10px] font-bold bg-surface-bright px-3 py-1 rounded-full text-primary tracking-widest uppercase">Fin-Intell</span>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <span class="text-[10px] font-bold text-primary-container/60 uppercase tracking-widest italic">Analysing...</span>
                  </td>
                </tr>
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-6 py-5">
                    <p class="text-sm font-bold text-on-surface">Digital infrastructure gap - Vidarbha region</p>
                    <p class="text-[10px] text-on-surface/40 mt-1">#IT #RuralGrowth</p>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <span class="material-symbols-outlined text-xs">person</span>
                      </div>
                      <span class="text-xs font-semibold text-on-surface/80">Rural User (IVR)</span>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-[10px] font-bold bg-surface-bright px-3 py-1 rounded-full text-primary tracking-widest uppercase">Telecom Dept</span>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <span class="text-[10px] font-bold text-tertiary uppercase tracking-widest">Routed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-4 bg-surface-container-low flex justify-center">
            <button class="text-xs font-bold text-primary-container/80 hover:text-primary uppercase tracking-widest py-2 px-6">Load Expanded Archive</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="bg-surface-container-lowest border-t border-outline-variant/15 flex flex-col md:flex-row justify-between items-center px-12 py-8 mt-auto">
        <p class="text-sm text-on-surface/60">© 2024 Narad AI. Under Editorial Sovereignty.</p>
        <div class="flex gap-8 mt-4 md:mt-0">
          <a class="text-sm text-on-surface/60 hover:text-primary-container transition-colors cursor-pointer">Privacy Policy</a>
          <a class="text-sm text-on-surface/60 hover:text-primary-container transition-colors cursor-pointer">Terms of Service</a>
          <a class="text-sm text-on-surface/60 hover:text-primary-container transition-colors cursor-pointer">Governance Standards</a>
        </div>
      </footer>
    </main>

    <!-- FAB -->
    <div class="fixed bottom-8 right-8 z-20">
      <button class="w-14 h-14 rounded-full saffron-gradient shadow-2xl flex items-center justify-center text-on-primary-container group hover:scale-110 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">bolt</span>
        <div class="absolute right-full mr-4 bg-surface-bright px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-primary-container/20 pointer-events-none shadow-lg">
          <span class="text-xs font-bold text-primary uppercase tracking-widest">Rapid Intervention</span>
        </div>
      </button>
    </div>
  </div>
  `;

  // ── Navigation ──
  document.getElementById('nav-map').addEventListener('click', () => navigate('/map'));
  document.getElementById('nav-home').addEventListener('click', () => navigate('/'));
  document.getElementById('nav-logout').addEventListener('click', () => navigate('/'));

  // ── Trigger Web Scrape ──
  document.getElementById('scrape-btn').addEventListener('click', async () => {
    const btn = document.getElementById('scrape-btn');
    const icon = btn.querySelector('.material-symbols-outlined');
    icon.classList.add('animate-spin');
    btn.querySelector('span:last-child').textContent = 'Scraping...';

    try {
      const res = await fetch('http://localhost:8000/scrape', { method: 'POST' });
      const data = await res.json();
      icon.classList.remove('animate-spin');
      btn.querySelector('span:last-child').textContent = 'Scraped ' + (data.scraped || 0) + ' items';
      setTimeout(() => {
        btn.querySelector('span:last-child').textContent = 'Trigger Web Scrape';
      }, 3000);
    } catch (e) {
      icon.classList.remove('animate-spin');
      btn.querySelector('span:last-child').textContent = 'API Unreachable';
      setTimeout(() => {
        btn.querySelector('span:last-child').textContent = 'Trigger Web Scrape';
      }, 3000);
    }
  });
}

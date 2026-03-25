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
      </nav>
      <div class="px-4 py-4">
        <button id="announce-fab-side" class="w-full saffron-gradient text-on-primary-container font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
          <span class="material-symbols-outlined">campaign</span>
          <span class="uppercase tracking-widest text-xs font-bold">New Announcement</span>
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
      <button id="announce-fab" class="w-14 h-14 rounded-full saffron-gradient shadow-2xl flex items-center justify-center text-on-primary-container group hover:scale-110 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">campaign</span>
        <div class="absolute right-full mr-4 bg-surface-bright px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-primary-container/20 pointer-events-none shadow-lg">
          <span class="text-xs font-bold text-primary uppercase tracking-widest">Generate Announcement</span>
        </div>
      </button>
    </div>
  </div>

  <!-- ── Announcement Generator Modal ── -->
  <div id="announce-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4">
    <!-- Backdrop -->
    <div id="announce-backdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

    <!-- Panel -->
    <div class="relative bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">

      <!-- Modal Header -->
      <div class="saffron-gradient px-6 py-5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-on-primary-container text-2xl" style="font-variation-settings: 'FILL' 1;">campaign</span>
          <div>
            <h2 class="text-on-primary-container font-black tracking-tighter text-lg uppercase">सार्वजनिक घोषणा</h2>
            <p class="text-on-primary-container/70 text-[10px] uppercase tracking-[0.2em] font-semibold">Public Announcement Generator</p>
          </div>
        </div>
        <button id="announce-close" class="text-on-primary-container/70 hover:text-on-primary-container transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Modal Body — scrollable -->
      <div class="overflow-y-auto flex-1 p-6 space-y-5">

        <!-- Prompt Input -->
        <div>
          <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/50 block mb-2">Announcement Topic / Brief</label>
          <textarea
            id="announce-prompt"
            rows="3"
            placeholder="e.g. Vaccination camp on 28 March at the Panchayat office, all children under 5 must attend"
            class="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary-container/50 resize-none transition-all"
          ></textarea>
        </div>

        <!-- Options Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/50 block mb-2">Department</label>
            <select id="announce-dept" class="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50">
              <option value="Gram Panchayat">Gram Panchayat</option>
              <option value="Swasthya Vibhag">स्वास्थ्य विभाग (Health)</option>
              <option value="Krishi Vibhag">कृषि विभाग (Agriculture)</option>
              <option value="Jal Jeevan Mission">जल जीवन मिशन</option>
              <option value="Shiksha Vibhag">शिक्षा विभाग (Education)</option>
              <option value="Bijli Vibhag">बिजली विभाग (Electricity)</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/50 block mb-2">Urgency</label>
            <select id="announce-urgency" class="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50">
              <option value="normal">सामान्य (Normal)</option>
              <option value="important">महत्वपूर्ण (Important)</option>
              <option value="urgent">अत्यावश्यक (Urgent)</option>
            </select>
          </div>
        </div>

        <!-- Generate Button -->
        <button id="announce-generate-btn" class="w-full saffron-gradient text-on-primary-container font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
          <span class="material-symbols-outlined" id="generate-icon">auto_awesome</span>
          <span id="generate-label" class="uppercase tracking-widest text-sm">Generate Announcement</span>
        </button>

        <!-- Output Section -->
        <div id="announce-output" class="hidden space-y-4">
          <!-- Divider -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-outline-variant/20"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Generated Announcement</span>
            <div class="flex-1 h-px bg-outline-variant/20"></div>
          </div>

          <!-- Announcement Card -->
          <div class="bg-surface-container-low rounded-xl border border-primary-container/15 overflow-hidden">
            <!-- Card header bar -->
            <div class="bg-primary-container/10 border-b border-primary-container/10 px-5 py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-sm" style="font-variation-settings: 'FILL' 1;">campaign</span>
                <span id="output-dept-label" class="text-[10px] font-bold uppercase tracking-widest text-primary-container">Gram Panchayat</span>
              </div>
              <span id="output-urgency-badge" class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-surface-bright text-on-surface/60"></span>
            </div>
            <!-- Announcement text -->
            <div class="p-5">
              <p id="output-title" class="text-base font-black text-on-surface tracking-tight mb-3 leading-snug"></p>
              <p id="output-body" class="text-sm text-on-surface/80 leading-relaxed whitespace-pre-line"></p>
              <div id="output-meta" class="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <p id="output-footer" class="text-[10px] text-on-surface/40 font-semibold uppercase tracking-widest"></p>
                <p class="text-[10px] text-on-surface/30 font-semibold">नारद AI द्वारा निर्मित</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button id="copy-btn" class="flex-1 flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-colors">
              <span class="material-symbols-outlined text-sm">content_copy</span>
              Copy Text
            </button>
            <button id="regenerate-btn" class="flex-1 flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-colors">
              <span class="material-symbols-outlined text-sm">refresh</span>
              Regenerate
            </button>
            <button id="publish-btn" class="flex-1 flex items-center justify-center gap-2 saffron-gradient rounded-xl py-3 text-xs font-black uppercase tracking-widest text-on-primary-container hover:opacity-90 transition-all active:scale-95">
              <span class="material-symbols-outlined text-sm">publish</span>
              Publish
            </button>
          </div>
        </div>

      </div>
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

  // ── Announcement Modal ──
  const modal = document.getElementById('announce-modal');
  const backdrop = document.getElementById('announce-backdrop');

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  document.getElementById('announce-fab').addEventListener('click', openModal);
  document.getElementById('announce-fab-side').addEventListener('click', openModal);
  document.getElementById('announce-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // ── Announcement Generation ──
  async function generateAnnouncement() {
    const prompt = document.getElementById('announce-prompt').value.trim();
    if (!prompt) {
      document.getElementById('announce-prompt').focus();
      return;
    }

    const dept = document.getElementById('announce-dept').value;
    const urgency = document.getElementById('announce-urgency').value;

    const urgencyMap = {
      normal: { label: 'सामान्य सूचना', emoji: '📢' },
      important: { label: 'महत्वपूर्ण सूचना', emoji: '⚠️' },
      urgent: { label: 'अत्यावश्यक सूचना', emoji: '🚨' },
    };

    // Set loading state
    const btn = document.getElementById('announce-generate-btn');
    const icon = document.getElementById('generate-icon');
    const label = document.getElementById('generate-label');
    btn.disabled = true;
    icon.classList.add('animate-spin');
    label.textContent = 'Generating...';
    document.getElementById('announce-output').classList.add('hidden');

    const systemPrompt = `You are a government announcement writer for rural India. 
Generate a structured public announcement in simple, clear Hindi (Devanagari script only — no Roman, no English words).
The announcement must be easy for a village resident with basic literacy to understand.

Output ONLY a JSON object with these keys:
- "title": A short, attention-grabbing headline (1 line, max 12 words)
- "body": The full announcement body (3-5 sentences covering: what, when, where, who should attend/act, and any action required)
- "footer": A closing line with department name and date if mentioned

Department: ${dept}
Urgency: ${urgencyMap[urgency].label}
Keep language simple, warm, and authoritative. Use respectful address like "ग्राम वासियों" or "प्रिय नागरिकों".`;

    try {
      const res = await fetch('http://localhost:8000/generate_announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic: ${prompt}` },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      // Populate output
      document.getElementById('output-dept-label').textContent = dept;
      document.getElementById('output-urgency-badge').textContent = urgencyMap[urgency].label;
      document.getElementById('output-urgency-badge').className =
        `text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${urgency === 'urgent' ? 'bg-error/10 text-error' :
          urgency === 'important' ? 'bg-primary-container/10 text-primary-container' :
            'bg-surface-bright text-on-surface/60'
        }`;
      document.getElementById('output-title').textContent = `${urgencyMap[urgency].emoji} ${parsed.title}`;
      document.getElementById('output-body').textContent = parsed.body;
      document.getElementById('output-footer').textContent = parsed.footer || `— ${dept}`;

      document.getElementById('announce-output').classList.remove('hidden');

    } catch (err) {
      console.error(err);
      document.getElementById('announce-output').classList.remove('hidden');
      document.getElementById('output-title').textContent = '⚠️ त्रुटि हुई';
      document.getElementById('output-body').textContent =
        'घोषणा तैयार करने में समस्या आई। कृपया पुनः प्रयास करें।\n\nError: ' + err.message;
      document.getElementById('output-footer').textContent = '';
      document.getElementById('output-dept-label').textContent = dept;
      document.getElementById('output-urgency-badge').textContent = '';
    } finally {
      btn.disabled = false;
      icon.classList.remove('animate-spin');
      label.textContent = 'Generate Announcement';
    }
  }

  document.getElementById('announce-generate-btn').addEventListener('click', generateAnnouncement);
  document.getElementById('regenerate-btn').addEventListener('click', generateAnnouncement);

  // Allow Ctrl+Enter to generate
  document.getElementById('announce-prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generateAnnouncement();
  });

  // ── Copy to clipboard ──
  document.getElementById('copy-btn').addEventListener('click', () => {
    const title = document.getElementById('output-title').textContent;
    const body = document.getElementById('output-body').textContent;
    const footer = document.getElementById('output-footer').textContent;
    const full = `${title}\n\n${body}\n\n${footer}`;
    navigator.clipboard.writeText(full).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.querySelector('span.material-symbols-outlined').textContent = 'check';
      btn.querySelector('span:last-child').textContent = 'Copied!';
      setTimeout(() => {
        btn.querySelector('span.material-symbols-outlined').textContent = 'content_copy';
        btn.querySelector('span:last-child').textContent = 'Copy Text';
      }, 2000);
    });
  });

  // ── Publish announcement to public notice ──
  document.getElementById('publish-btn').addEventListener('click', async () => {
    const title = document.getElementById('output-title').textContent;
    const body = document.getElementById('output-body').textContent;
    const footer = document.getElementById('output-footer').textContent;
    const dept = document.getElementById('output-dept-label').textContent;
    const urgency = document.getElementById('announce-urgency').value;
    const btn = document.getElementById('publish-btn');
    btn.disabled = true;
    btn.querySelector('span:last-child').textContent = 'Publishing...';
    try {
      const res = await fetch('http://localhost:8000/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, footer, department: dept, urgency }),
      });
      if (!res.ok) throw new Error('Failed');
      btn.querySelector('span.material-symbols-outlined').textContent = 'check_circle';
      btn.querySelector('span:last-child').textContent = 'Published!';
      setTimeout(() => {
        btn.querySelector('span.material-symbols-outlined').textContent = 'publish';
        btn.querySelector('span:last-child').textContent = 'Publish';
      }, 3000);
    } catch (e) {
      alert('Failed to publish. Please try again.');
    } finally {
      btn.disabled = false;
    }
  });
}
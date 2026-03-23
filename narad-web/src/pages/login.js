// ── Admin Login Page (Saffron Edition) ────────────────────────────────
import { navigate } from '../router.js';

export function loginPage(app) {
  app.innerHTML = `
  <div class="flex flex-col min-h-screen">
    <main class="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <!-- Background Ambient Elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-primary-container opacity-[0.03] rounded-full blur-[100px]"></div>
        <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary-container opacity-[0.02] rounded-full blur-[120px]"></div>
      </div>

      <div class="w-full max-w-md z-10">
        <!-- Brand Identity Anchor -->
        <div class="flex flex-col items-center mb-10 text-center">
          <div class="mb-6 flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-highest shadow-2xl">
            <span class="material-symbols-outlined text-4xl text-primary-container" style="font-variation-settings: 'FILL' 1;">policy</span>
          </div>
          <h1 class="font-headline text-3xl font-black tracking-tighter text-on-surface uppercase mb-2">
            NARAD AI
          </h1>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/15">
            <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            <span class="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">Editorial Sovereignty</span>
          </div>
        </div>

        <!-- Login Card -->
        <div class="glass-panel border border-outline-variant/10 rounded-xl p-8 shadow-[0_32px_64px_-16px_rgba(0,14,37,0.4)]">
          <div class="mb-8">
            <h2 class="font-headline text-xl font-bold text-primary mb-1">Admin Access</h2>
            <p class="text-on-surface-variant text-sm font-medium">Authorized Personnel Only</p>
          </div>

          <form id="login-form" class="space-y-6">
            <!-- Input: Username -->
            <div class="space-y-1.5">
              <label class="block font-label text-[11px] uppercase tracking-widest text-primary/80 font-bold" for="username">
                Official Identifier
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-sm text-on-surface-variant group-focus-within:text-primary transition-colors">badge</span>
                </div>
                <input class="block w-full pl-11 pr-4 py-3 bg-surface-container-highest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:bg-surface-bright transition-all" id="username" name="username" placeholder="Enter Admin ID" type="text" />
                <div class="absolute bottom-0 left-0 h-0.5 bg-primary-container w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
            </div>

            <!-- Input: Password -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label class="block font-label text-[11px] uppercase tracking-widest text-primary/80 font-bold" for="password">
                  Access Key
                </label>
                <a class="text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors font-bold cursor-pointer">Lost Access?</a>
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-sm text-on-surface-variant group-focus-within:text-primary transition-colors">key</span>
                </div>
                <input class="block w-full pl-11 pr-4 py-3 bg-surface-container-highest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:bg-surface-bright transition-all" id="password" name="password" placeholder="••••••••" type="password" />
                <div class="absolute bottom-0 left-0 h-0.5 bg-primary-container w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
            </div>

            <!-- Security Checkbox -->
            <div class="flex items-center gap-3 py-2">
              <input class="w-5 h-5 rounded bg-surface-container-highest border-outline-variant/30 text-tertiary focus:ring-0 focus:ring-offset-0 transition-colors" id="secure" type="checkbox" />
              <label class="text-xs text-on-surface-variant font-medium select-none cursor-pointer" for="secure">
                Maintain secure session on this device
              </label>
            </div>

            <!-- Primary Action -->
            <button id="login-btn" class="saffron-gradient w-full py-4 rounded-lg font-headline font-extrabold text-on-primary-container uppercase tracking-widest text-sm shadow-xl shadow-primary-container/10 hover:shadow-primary-container/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" type="submit">
              Sign In
              <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">login</span>
            </button>
          </form>

          <!-- Tricolor Accent -->
          <div class="mt-10 flex items-center justify-center gap-4">
            <div class="h-[2px] flex-grow bg-gradient-to-r from-transparent to-outline-variant/10"></div>
            <div class="flex gap-1.5">
              <div class="w-4 h-1 bg-primary-container rounded-full opacity-60"></div>
              <div class="w-4 h-1 bg-on-surface rounded-full opacity-20"></div>
              <div class="w-4 h-1 bg-tertiary-container rounded-full opacity-60"></div>
            </div>
            <div class="h-[2px] flex-grow bg-gradient-to-l from-transparent to-outline-variant/10"></div>
          </div>
        </div>

        <!-- Footer Meta -->
        <p class="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-medium">
          © 2024 NARAD AI • SECURE GOVERNMENT PORTAL
        </p>

        <!-- Back link -->
        <div class="mt-4 text-center">
          <a id="back-link" class="text-xs text-primary/60 hover:text-primary cursor-pointer transition-colors">← Back to Voice Agent</a>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-surface-container-lowest border-t border-outline-variant/10 py-8 px-12 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-sm text-on-surface-variant/60">© 2024 Narad AI. Under Editorial Sovereignty.</p>
        <div class="flex gap-8">
          <a class="text-sm text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
          <a class="text-sm text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
          <a class="text-sm text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer">Governance Standards</a>
        </div>
      </div>
    </footer>
  </div>
  `;

  // ── Events ──
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Simple demo auth — redirect to dashboard
    const btn = document.getElementById('login-btn');
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Authenticating...';
    setTimeout(() => {
      localStorage.setItem('narad_admin', 'true');
      navigate('/dashboard');
    }, 800);
  });

  document.getElementById('back-link').addEventListener('click', () => {
    navigate('/');
  });
}

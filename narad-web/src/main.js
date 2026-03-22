import { route, startRouter } from './router.js';
import { landingPage } from './pages/landing.js';
import { loginPage } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { mapPage } from './pages/map.js';

// Register routes
route('/', landingPage);
route('/login', loginPage);
route('/dashboard', dashboardPage);
route('/map', mapPage);

// Start the router
startRouter();

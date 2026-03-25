import { route, startRouter } from './router.js';
import { landingPage } from './pages/landing.js';
import { loginPage } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { mapPage } from './pages/map.js';
import { complaintsPage } from './pages/complaints.js';
import { noticesPage } from './pages/notices.js';

// Register routes
route('/', landingPage);
route('/login', loginPage);
route('/dashboard', dashboardPage);
route('/map', mapPage);
route('/complaints', complaintsPage);
route('/notices', noticesPage);

// Start the router
startRouter();

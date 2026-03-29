import './css/style.css';
import { Router } from './router.js';
import { onAuth } from './auth.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderSheet } from './pages/sheet.js';
import { renderNotesPage } from './pages/notes.js';

const app = document.getElementById('app');
let router;
let currentUser = null;

function setupRouter() {
  router = new Router([
    {
      path: '/login',
      handler: () => {
        if (currentUser) { router.navigate('/'); return; }
        renderLogin(app);
      },
    },
    {
      path: '/',
      handler: () => {
        if (!currentUser) { router.navigate('/login'); return; }
        renderDashboard(app, router);
      },
    },
    {
      path: '/sheet/:id',
      handler: (params) => {
        if (!currentUser) { router.navigate('/login'); return; }
        renderSheet(app, router, params.id);
      },
    },
    {
      path: '/notes/:id',
      handler: (params) => {
        if (!currentUser) { router.navigate('/login'); return; }
        renderNotesPage(app, router, params.id);
      },
    },
  ]);
}

onAuth((user) => {
  currentUser = user;
  if (!router) {
    setupRouter();
  }
  if (user) {
    const hash = window.location.hash.slice(1);
    if (!hash || hash === '/login') {
      router.navigate('/');
    } else {
      router.resolve();
    }
  } else {
    router.navigate('/login');
  }
});

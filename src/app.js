// Punto de entrada de la aplicación — Routing SPA con History API (Etapa 5)

import { initChat, selectCharacter, refreshChatView } from './chat.js';

const ROUTES = {
  '/': 'home',
  '/chat': 'chat',
  '/about': 'about',
};

const DEFAULT_PATH = '/';

function renderRoute() {
  const path = window.location.pathname;
  const activeSectionId = ROUTES[path] ?? ROUTES[DEFAULT_PATH];

  document.querySelectorAll('.page').forEach((section) => {
    section.hidden = section.id !== activeSectionId;
  });

  refreshChatView();
}

function navigateTo(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  renderRoute();
}

function handleNavClick(event) {
  const link = event.target.closest('[data-link]');
  if (!link) return;

  event.preventDefault();
  navigateTo(link.getAttribute('href'));
}

function handleCharacterCardClick(event) {
  const button = event.target.closest('.select-character-btn');
  if (!button) return;

  selectCharacter(button.dataset.character);
  navigateTo('/chat');
}

function initRouter() {
  // Si el usuario entra por una URL que no reconocemos, la corregimos
  // con replaceState (sin agregar una entrada extra al historial).
  if (!(window.location.pathname in ROUTES)) {
    window.history.replaceState({}, '', DEFAULT_PATH);
  }

  document.addEventListener('click', handleNavClick);
  document.addEventListener('click', handleCharacterCardClick);
  window.addEventListener('popstate', renderRoute);

  initChat();
  renderRoute();
}

initRouter();

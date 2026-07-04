// Punto de entrada de la aplicación — Routing SPA con History API (Etapa 5)

import { getCharacterById } from './characters.js';

const ROUTES = {
  '/': 'home',
  '/chat': 'chat',
  '/about': 'about',
};

const DEFAULT_PATH = '/';

// Personaje elegido en la sesión actual (todavía no hay chat real: esto
// es solo el estado mínimo necesario para dar feedback de qué personaje
// se seleccionó antes de llegar a la Etapa 6).
let selectedCharacterId = null;

function updateChatHeading() {
  const heading = document.getElementById('chat-character-name');
  if (!heading) return;

  const character = selectedCharacterId ? getCharacterById(selectedCharacterId) : null;
  heading.textContent = character
    ? `Chateando con ${character.name}`
    : 'Elegí un personaje para empezar';
}

function renderRoute() {
  const path = window.location.pathname;
  const activeSectionId = ROUTES[path] ?? ROUTES[DEFAULT_PATH];

  document.querySelectorAll('.page').forEach((section) => {
    section.hidden = section.id !== activeSectionId;
  });

  updateChatHeading();
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

  // Guardamos qué personaje se eligió para poder mostrar feedback
  // ("Chateando con X") al llegar a /chat. El chat en sí (mensajes,
  // historial, Gemini) se implementa recién en la Etapa 6 y siguientes.
  selectedCharacterId = button.dataset.character;
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

  renderRoute();
}

initRouter();

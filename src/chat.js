// Lógica del chat local (Etapa 6): mensajes en memoria, sin IA todavía.
// La integración real con Gemini se agrega en la Etapa 8.

import { getCharacterById } from './characters.js';

const FAKE_REPLIES = [
  '¡Já! Buena esa.',
  'Mirá, no tengo ni idea, pero sigamos hablando.',
  'Eso me recuerda a una vez que... nah, mejor no.',
  'Decime más, esto se está poniendo interesante.',
  'Ajá, ajá... seguí, seguí.',
];

// Historial en memoria, separado por personaje, para que cambiar de
// personaje no mezcle las conversaciones.
const messagesByCharacter = {};

let selectedCharacterId = null;

function getMessages(characterId) {
  if (!messagesByCharacter[characterId]) {
    messagesByCharacter[characterId] = [];
  }
  return messagesByCharacter[characterId];
}

function getRandomFakeReply() {
  const index = Math.floor(Math.random() * FAKE_REPLIES.length);
  return FAKE_REPLIES[index];
}

function updateChatHeading() {
  const heading = document.getElementById('chat-character-name');
  if (!heading) return;

  const character = selectedCharacterId ? getCharacterById(selectedCharacterId) : null;
  heading.textContent = character
    ? `Chateando con ${character.name}`
    : 'Elegí un personaje para empezar';
}

function renderMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = '';

  if (!selectedCharacterId) return;

  getMessages(selectedCharacterId).forEach((message) => {
    const bubble = document.createElement('div');
    bubble.classList.add('message', `message-${message.role}`);
    bubble.textContent = message.text;
    container.appendChild(bubble);
  });

  // Scroll automático: siempre mostrar el mensaje más reciente.
  container.scrollTop = container.scrollHeight;
}

function addMessage(role, text) {
  if (!selectedCharacterId) return;
  getMessages(selectedCharacterId).push({ role, text });
  renderMessages();
}

function handleChatSubmit(event) {
  event.preventDefault();

  if (!selectedCharacterId) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';

  // Respuesta simulada (fake): todavía no hay conexión con Gemini.
  addMessage('character', getRandomFakeReply());
}

export function selectCharacter(characterId) {
  selectedCharacterId = characterId;
  updateChatHeading();
  renderMessages();
}

export function refreshChatView() {
  updateChatHeading();
  renderMessages();
}

export function initChat() {
  const form = document.getElementById('chat-form');
  if (!form) return;

  form.addEventListener('submit', handleChatSubmit);
}

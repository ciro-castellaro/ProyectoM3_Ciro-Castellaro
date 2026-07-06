// Lógica del chat (Etapa 6: mensajes en memoria; Etapa 8: integración
// real con Gemini a través de la Serverless Function api/functions.js).

import { getCharacterById } from './characters.js';

// Historial en memoria, separado por personaje, para que cambiar de
// personaje no mezcle las conversaciones.
const messagesByCharacter = {};

let selectedCharacterId = null;

// Evita mandar un segundo mensaje mientras todavía se espera la
// respuesta de Gemini.
let isWaitingForReply = false;

function getMessages(characterId) {
  if (!messagesByCharacter[characterId]) {
    messagesByCharacter[characterId] = [];
  }
  return messagesByCharacter[characterId];
}

async function fetchCharacterReply(systemPrompt, history, message) {
  const response = await fetch('/api/functions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, history, message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Gemini devolvió un error.');
  }

  if (!data.reply) {
    throw new Error('Gemini no devolvió una respuesta válida.');
  }

  return data.reply;
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

// Muestra un error como burbuja, sin guardarlo en messagesByCharacter:
// un error de red no es parte de la conversación real, y si se
// guardara se mandaría como si fuera parte del historial en el
// próximo request a Gemini.
function appendErrorBubble(text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.classList.add('message', 'message-error');
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// Indicador de "escribiendo...": tampoco se guarda en el historial,
// por la misma razón que appendErrorBubble.
function appendTypingIndicator(characterName) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.id = 'typing-indicator';
  bubble.classList.add('message', 'message-character', 'message-typing');
  bubble.textContent = `${characterName} está escribiendo...`;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

function setFormDisabled(disabled) {
  const input = document.getElementById('chat-input');
  const button = document.getElementById('send-btn');
  if (input) input.disabled = disabled;
  if (button) button.disabled = disabled;
}

async function handleChatSubmit(event) {
  event.preventDefault();

  if (!selectedCharacterId || isWaitingForReply) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const character = getCharacterById(selectedCharacterId);
  // Snapshot del historial ANTES de agregar el mensaje nuevo: el
  // servidor espera el historial previo y el último mensaje por
  // separado (Etapa 9).
  const history = [...getMessages(selectedCharacterId)];

  addMessage('user', text);
  input.value = '';

  isWaitingForReply = true;
  setFormDisabled(true);
  appendTypingIndicator(character.name);

  try {
    const reply = await fetchCharacterReply(character.systemPrompt, history, text);
    removeTypingIndicator();
    addMessage('character', reply);
  } catch (error) {
    console.error('Error al obtener respuesta de Gemini:', error);
    removeTypingIndicator();
    appendErrorBubble('Uy, se me cruzaron los cables. Probá de nuevo en un rato.');
  } finally {
    isWaitingForReply = false;
    setFormDisabled(false);
  }
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

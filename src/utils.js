// Funciones utilitarias reutilizables: sin manipulación de DOM, para
// que sean directamente testeables (Etapa 12).

export function getChatHeadingText(character) {
  return character
    ? `Chateando con ${character.name}`
    : 'Elegí un personaje para empezar';
}

export function isValidMessage(text) {
  return typeof text === 'string' && text.trim().length > 0;
}

export function sanitizeMessage(text) {
  return text.trim();
}

export async function fetchCharacterReply(systemPrompt, history, message) {
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

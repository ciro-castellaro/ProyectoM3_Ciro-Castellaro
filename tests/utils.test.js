import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getChatHeadingText,
  isValidMessage,
  isMessageTooLong,
  sanitizeMessage,
  resolveActiveSectionId,
  fetchCharacterReply,
  MAX_MESSAGE_LENGTH,
} from '../src/utils.js';

describe('getChatHeadingText', () => {
  it('devuelve el mensaje genérico cuando no hay personaje elegido', () => {
    // Caso límite: sin personaje (null), como al entrar a /chat sin
    // pasar por Home primero.
    expect(getChatHeadingText(null)).toBe('Elegí un personaje para empezar');
  });

  it('devuelve "Chateando con {nombre}" cuando hay un personaje elegido', () => {
    expect(getChatHeadingText({ name: 'Peter Griffin' })).toBe(
      'Chateando con Peter Griffin',
    );
  });
});

describe('isValidMessage', () => {
  it('rechaza strings vacíos o que son solo espacios', () => {
    // Caso límite importante: un usuario que aprieta "Enviar" sin
    // escribir nada, o solo con espacios, no debería mandar un mensaje.
    expect(isValidMessage('')).toBe(false);
    expect(isValidMessage('   ')).toBe(false);
  });

  it('acepta strings con contenido real', () => {
    expect(isValidMessage('Hola, ¿cómo estás?')).toBe(true);
  });
});

describe('isMessageTooLong', () => {
  it('rechaza mensajes que superan el límite máximo', () => {
    // Caso límite importante: protege tanto la UX (feedback claro al
    // usuario) como el costo/uso de tokens de Gemini.
    const textoLargo = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
    expect(isMessageTooLong(textoLargo)).toBe(true);
  });

  it('acepta mensajes dentro del límite', () => {
    expect(isMessageTooLong('Hola')).toBe(false);
    expect(isMessageTooLong('a'.repeat(MAX_MESSAGE_LENGTH))).toBe(false);
  });
});

describe('sanitizeMessage', () => {
  it('saca los espacios al principio y al final', () => {
    expect(sanitizeMessage('  hola  ')).toBe('hola');
  });
});

describe('resolveActiveSectionId', () => {
  it('resuelve las rutas conocidas a su id de sección', () => {
    expect(resolveActiveSectionId('/')).toBe('home');
    expect(resolveActiveSectionId('/chat')).toBe('chat');
    expect(resolveActiveSectionId('/about')).toBe('about');
  });

  it('resuelve /home como alias de / (misma sección "home")', () => {
    expect(resolveActiveSectionId('/home')).toBe('home');
  });

  it('usa la ruta por defecto (home) para rutas desconocidas', () => {
    // Caso límite: el usuario escribe una URL inválida a mano, o queda
    // una entrada vieja del historial que ya no existe.
    expect(resolveActiveSectionId('/no-existe')).toBe('home');
  });
});

describe('fetchCharacterReply', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve el texto de reply cuando la respuesta es exitosa', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Hola, ¿qué contás?' }),
    });

    const reply = await fetchCharacterReply('system prompt', [], 'hola');

    expect(reply).toBe('Hola, ¿qué contás?');
    expect(fetch).toHaveBeenCalledWith(
      '/api/functions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza un error con el mensaje del servidor cuando la respuesta no es ok', async () => {
    // Caso límite: el servidor responde con un status de error (ej.
    // 429 de cuota, 500 de Gemini) — el mensaje real debe propagarse.
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Cuota excedida.' }),
    });

    await expect(fetchCharacterReply('system prompt', [], 'hola')).rejects.toThrow(
      'Cuota excedida.',
    );
  });

  it('lanza un error si la respuesta no trae "reply"', async () => {
    // Caso límite: la API responde 200 pero con un cuerpo inesperado.
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await expect(fetchCharacterReply('system prompt', [], 'hola')).rejects.toThrow(
      'Gemini no devolvió una respuesta válida.',
    );
  });
});

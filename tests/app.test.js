import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCharacterById } from '../src/characters.js';

// vi.hoisted asegura que generateContentMock exista antes de que
// vi.mock('@google/genai', ...) se ejecute (los vi.mock se elevan al
// principio del archivo, antes de cualquier import).
const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  // Tiene que ser un "function" (no arrow function) para que se pueda
  // invocar con "new" — así es como api/functions.js usa GoogleGenAI.
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent: generateContentMock } };
  }),
}));

const { default: handler, mapRoleToGemini, buildContents } = await import(
  '../api/functions.js'
);

function mockRes() {
  return {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
}

describe('getCharacterById', () => {
  it('devuelve el personaje correcto para un id válido', () => {
    const character = getCharacterById('peter');
    expect(character).toBeDefined();
    expect(character.name).toBe('Peter Griffin');
  });

  it('devuelve undefined para un id que no existe', () => {
    // Caso límite: un data-character mal escrito, o un personaje
    // eliminado del array pero todavía referenciado en el HTML.
    expect(getCharacterById('no-existe')).toBeUndefined();
  });
});

describe('mapRoleToGemini', () => {
  it('mapea el rol "user" del chat local al "user" que espera Gemini', () => {
    expect(mapRoleToGemini('user')).toBe('user');
  });

  it('mapea cualquier rol que no sea "user" (ej. "character") a "model"', () => {
    // Gemini solo entiende 'user' y 'model'; nuestro chat local usa
    // 'character' para el personaje, así que tiene que traducirse.
    expect(mapRoleToGemini('character')).toBe('model');
  });
});

describe('buildContents', () => {
  it('arma el array de contents con el historial y el último mensaje en orden', () => {
    const history = [
      { role: 'user', text: 'Hola' },
      { role: 'character', text: 'Hola, ¿cómo estás?' },
    ];

    const contents = buildContents(history, '¿Qué hacés?');

    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'Hola' }] },
      { role: 'model', parts: [{ text: 'Hola, ¿cómo estás?' }] },
      { role: 'user', parts: [{ text: '¿Qué hacés?' }] },
    ]);
  });

  it('funciona con historial vacío (primer mensaje de la conversación)', () => {
    // Caso límite: el primer mensaje de una conversación nueva no
    // tiene historial previo que mapear.
    const contents = buildContents([], 'Hola');
    expect(contents).toEqual([{ role: 'user', parts: [{ text: 'Hola' }] }]);
  });
});

describe('handler (api/functions.js, con el SDK de Gemini mockeado)', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'fake-key-de-test');
    generateContentMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rechaza métodos que no sean POST', async () => {
    const res = mockRes();
    await handler({ method: 'GET' }, res);

    expect(res.statusCode).toBe(405);
  });

  it('devuelve 500 si falta GEMINI_API_KEY', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = mockRes();

    await handler(
      { method: 'POST', body: { systemPrompt: 'x', message: 'hola' } },
      res,
    );

    expect(res.statusCode).toBe(500);
  });

  it('devuelve 400 si falta systemPrompt o message', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { systemPrompt: 'x' } }, res);

    expect(res.statusCode).toBe(400);
  });

  it('devuelve 400 si el mensaje supera el límite máximo de longitud', async () => {
    // Validación del lado del servidor: protege aunque alguien llame
    // a /api/functions directamente, sin pasar por el frontend.
    const res = mockRes();

    await handler(
      { method: 'POST', body: { systemPrompt: 'x', message: 'a'.repeat(2001) } },
      res,
    );

    expect(res.statusCode).toBe(400);
  });

  it('devuelve el reply cuando Gemini responde correctamente', async () => {
    generateContentMock.mockResolvedValue({ text: 'Hola, ¿cómo estás?' });
    const res = mockRes();

    await handler(
      {
        method: 'POST',
        body: { systemPrompt: 'Sos un test', history: [], message: 'hola' },
      },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: 'Hola, ¿cómo estás?' });
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        contents: expect.any(Array),
        config: { systemInstruction: 'Sos un test' },
      }),
    );
  });

  it('devuelve 502 si Gemini responde sin texto', async () => {
    // Caso límite: la respuesta llega pero sin contenido usable.
    generateContentMock.mockResolvedValue({ text: undefined });
    const res = mockRes();

    await handler(
      {
        method: 'POST',
        body: { systemPrompt: 'x', history: [], message: 'hola' },
      },
      res,
    );

    expect(res.statusCode).toBe(502);
  });

  it('devuelve 500 si el SDK de Gemini lanza un error', async () => {
    generateContentMock.mockRejectedValue(new Error('Cuota excedida'));
    const res = mockRes();

    await handler(
      {
        method: 'POST',
        body: { systemPrompt: 'x', history: [], message: 'hola' },
      },
      res,
    );

    expect(res.statusCode).toBe(500);
  });
});

import { describe, it, expect } from 'vitest';
import { getCharacterById } from '../src/characters.js';
import { mapRoleToGemini, buildContents } from '../api/functions.js';

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

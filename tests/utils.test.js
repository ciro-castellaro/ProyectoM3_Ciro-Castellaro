import { describe, it, expect } from 'vitest';
import {
  getChatHeadingText,
  isValidMessage,
  sanitizeMessage,
  resolveActiveSectionId,
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

  it('usa la ruta por defecto (home) para rutas desconocidas', () => {
    // Caso límite: el usuario escribe una URL inválida a mano, o queda
    // una entrada vieja del historial que ya no existe.
    expect(resolveActiveSectionId('/no-existe')).toBe('home');
  });
});

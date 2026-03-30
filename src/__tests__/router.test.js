// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Router } from '../router.js';

describe('Router._match', () => {
  const router = new Router([]);

  it('match exact sur /login', () => {
    const result = router._match('/login', '/login');
    expect(result).toEqual({ params: {} });
  });

  it('match la racine /', () => {
    const result = router._match('/', '/');
    expect(result).toEqual({ params: {} });
  });

  it('extrait un paramètre :id', () => {
    const result = router._match('/sheet/:id', '/sheet/abc123');
    expect(result).toEqual({ params: { id: 'abc123' } });
  });

  it('extrait plusieurs paramètres', () => {
    const result = router._match('/a/:x/b/:y', '/a/1/b/2');
    expect(result).toEqual({ params: { x: '1', y: '2' } });
  });

  it('retourne null si le nombre de segments diffère', () => {
    expect(router._match('/a/b', '/a')).toBeNull();
    expect(router._match('/a', '/a/b')).toBeNull();
  });

  it('retourne null si un segment littéral ne correspond pas', () => {
    expect(router._match('/sheet/:id', '/notes/abc')).toBeNull();
  });

  it('match /notes/:id pour la page notes', () => {
    const result = router._match('/notes/:id', '/notes/xyz789');
    expect(result).toEqual({ params: { id: 'xyz789' } });
  });
});

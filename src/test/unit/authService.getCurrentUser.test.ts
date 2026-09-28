/**
 * TEST 1: authService.getCurrentUser — Caja Blanca + Edge Cases / Error Handling
 *
 * Tipo: Caja Blanca (conocemos la lógica interna: jwtDecode + normalización de rol)
 * Técnica: Edge Cases y Error Handling
 *
 * Se prueba el flujo interno de getCurrentUser:
 *   - Happy path: token JWT válido decodificado correctamente y rol normalizado a minúsculas.
 *   - Edge case: token JWT con rol en MAYÚSCULAS → debe normalizarse a minúsculas.
 *   - Error handling: token malformado → debe retornar null sin lanzar excepción.
 *   - Boundary: localStorage vacío → debe retornar null.
 *
 * Estrategia de mock:
 *   Dado que api.ts usa `import.meta.env`, mockeamos 'axios' y '../../services/api' directamente
 *   para aislar la función getCurrentUser y controlar lo que jwtDecode devuelve.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock de jwtDecode para controlar los payloads decodificados ──────────────
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

// ─── Mock de axios (necesario porque api.ts lo importa en el nivel de módulo) ─
vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

import { jwtDecode } from 'jwt-decode';
import { authService } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────

describe('authService.getCurrentUser — Caja Blanca + Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ────────────────────────────────────────────────
  // Boundary: sin token en localStorage
  // No se llama a jwtDecode en absoluto
  // ────────────────────────────────────────────────
  it('retorna null cuando no hay token en localStorage (boundary: storage vacío)', () => {
    const user = authService.getCurrentUser();

    expect(user).toBeNull();
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────
  // Happy path: token válido con rol en minúsculas
  // ────────────────────────────────────────────────
  it('decodifica el token y retorna el usuario correctamente (happy path)', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    vi.mocked(jwtDecode).mockReturnValueOnce({
      id: 'u1',
      username: 'Dr. García',
      email: 'garcia@vet.com',
      role: 'veterinarian',
    });

    const user = authService.getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe('u1');
    expect(user?.username).toBe('Dr. García');
    expect(user?.email).toBe('garcia@vet.com');
    expect(user?.role).toBe('veterinarian');
    expect(jwtDecode).toHaveBeenCalledWith('fake.jwt.token');
  });

  // ────────────────────────────────────────────────
  // Edge case: rol en MAYÚSCULAS → debe normalizarse
  // Esta es la ruta interna de código:
  //   if (decoded && decoded.role) {
  //     decoded.role = decoded.role.toLowerCase() as User['role'];
  //   }
  // ────────────────────────────────────────────────
  it('normaliza el rol a minúsculas cuando el token lo trae en MAYÚSCULAS (edge case)', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    vi.mocked(jwtDecode).mockReturnValueOnce({
      id: 'u2',
      username: 'Admin',
      email: 'admin@agrovet.com',
      role: 'ADMINISTRATOR',
    });

    const user = authService.getCurrentUser();

    expect(user).not.toBeNull();
    // El token tenía "ADMINISTRATOR" → debe quedar "administrator"
    expect(user?.role).toBe('administrator');
  });

  // ────────────────────────────────────────────────
  // Error handling: jwtDecode lanza una excepción
  // (simula un token malformado)
  // La función debe atrapar el error y retornar null
  // ────────────────────────────────────────────────
  it('retorna null y NO lanza excepción si jwtDecode falla (error handling: token malformado)', () => {
    localStorage.setItem('token', 'malformed.token');
    vi.mocked(jwtDecode).mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    expect(() => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    }).not.toThrow();
  });
});

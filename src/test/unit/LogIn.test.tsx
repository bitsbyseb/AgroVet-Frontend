/**
 * TEST 3: <LogIn /> Component — Mock + Happy Path + Error Handling
 *
 * Tipo: Prueba de Componente con Mocks
 * Técnica: Happy Path (login exitoso) + Error Handling (respuesta con error del API)
 *
 * Se usa @testing-library/react para renderizar el componente LogIn y se mockea
 * `authService.login` para controlar las respuestas del API sin necesidad de red.
 *
 * Escenarios:
 *   1. Happy path: credenciales correctas → guarda el token en localStorage y redirige.
 *   2. Error handling (mensaje string): API retorna { error: "Credenciales inválidas" }
 *      → el componente muestra ese mensaje en pantalla.
 *   3. Error handling (array errors): API retorna { errors: ["Email requerido"] }
 *      → el componente muestra el primer error del array.
 *   4. Estado de carga: el botón muestra "Iniciando sesión..." mientras se resuelve la promesa.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

// ─── Mocks globales ──────────────────────────────────────────────────────────

// Mock del módulo completo de servicios
vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    logout: vi.fn(),
  },
  animalService: {},
  ownerService: {},
  foodService: {},
  appointmentService: {},
}));

// Mock de window.location para verificar redirecciones sin salir del jsdom
const mockLocationAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: { href: '', assign: mockLocationAssign },
  writable: true,
});

// Import después de los mocks
import LogIn from '../../pages/LogIn';
import { authService } from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderLogIn = () =>
  render(
    <MemoryRouter>
      <LogIn />
    </MemoryRouter>
  );

const fillForm = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), email);
  await userEvent.type(screen.getByLabelText(/Contraseña/i), password);
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('<LogIn /> — Mock + Happy Path + Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.location.href = '';
  });

  // ────────────────────────────────────────────────
  // Happy path: login exitoso
  // ────────────────────────────────────────────────
  it('almacena el token y redirige a "/" cuando las credenciales son válidas (happy path)', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidmV0ZXJpbmFyaWFuIn0.abc';
    vi.mocked(authService.login).mockResolvedValueOnce({ token: mockToken });

    renderLogIn();
    await fillForm('garcia@vet.com', 'AgroVet2026*');
    fireEvent.submit(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'garcia@vet.com',
        password: 'AgroVet2026*',
      });
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(window.location.href).toBe('/');
    });
  });

  // ────────────────────────────────────────────────
  // Error handling: API retorna { error: "string" }
  // ────────────────────────────────────────────────
  it('muestra el mensaje de error de la API cuando retorna { error: string } (error handling)', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: { data: { error: 'Credenciales inválidas' } },
    });

    renderLogIn();
    await fillForm('wrong@vet.com', 'badpassword');
    fireEvent.submit(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });

    // No debe haber token ni redirección
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('');
  });

  // ────────────────────────────────────────────────
  // Error handling: API retorna { errors: string[] }
  // ────────────────────────────────────────────────
  it('muestra el primer elemento del array errors cuando la API retorna { errors: string[] }', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: { data: { errors: ['El email es obligatorio', 'La contraseña es muy corta'] } },
    });

    renderLogIn();

    // Usamos fireEvent.change directamente para evitar el problema de userEvent.type con cadenas vacías
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'x' } });
    fireEvent.submit(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────
  // Estado de carga: el botón debe cambiar su texto
  // ────────────────────────────────────────────────
  it('deshabilita el botón y muestra "Iniciando sesión..." durante la carga (estado)', async () => {
    // Promesa que nunca resuelve para mantener el estado de loading
    vi.mocked(authService.login).mockReturnValueOnce(new Promise(() => {}));

    renderLogIn();
    await fillForm('test@vet.com', 'pass1234');

    const button = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.submit(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Iniciando sesión.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciando sesión.../i })).toBeDisabled();
    });
  });
});

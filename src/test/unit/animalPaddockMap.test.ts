/**
 * TEST 2: buildAnimalPaddockMap — Caja Negra + Estado (lógica pura extraída del useMemo)
 *
 * Tipo: Caja Negra (probamos entradas y salidas sin conocer la implementación interna)
 * Técnica: Happy Path + Boundary Tests + Estado
 *
 * La función `buildAnimalPaddockMap` encapsula exactamente la misma lógica del useMemo
 * dentro de AnimalsList. Se prueba que:
 *   - Happy path: un animal con pastoreo activo queda mapeado como isGrazing = true.
 *   - Estado: un animal con paddockId directo (sin pastoreo activo) queda como isGrazing = false.
 *   - Boundary: un animal sin ningún potrero asignado NO aparece en el mapa.
 *   - Boundary: una actividad de pastoreo con exitDate en el pasado se considera expirada
 *               y el animal queda sin cobertura de pastoreo.
 */

import { describe, it, expect } from 'vitest';
import type { Animal, IPaddock, IGrazingActivity } from '../../types';
import { SpeciesType, AnimalType, Gender } from '../../types';

// ─────────────────────────────────────────────────────────────
// Función bajo prueba — misma lógica que el useMemo de AnimalsList
// ─────────────────────────────────────────────────────────────
function buildAnimalPaddockMap(
  animals: Animal[],
  paddocks: IPaddock[],
  grazingActivities: IGrazingActivity[]
): Map<string, { paddock: IPaddock; isGrazing: boolean; rotationNumber?: number }> {
  const map = new Map<string, { paddock: IPaddock; isGrazing: boolean; rotationNumber?: number }>();
  const paddockLookup = new Map(paddocks.map(p => [p.id, p]));
  const activeGrazing = grazingActivities.filter(g => !g.exitDate || new Date(g.exitDate) > new Date());

  animals.forEach(animal => {
    const activeRot = activeGrazing.find(g => g.animalIds?.includes(animal.id));
    if (activeRot && paddockLookup.has(activeRot.paddockId)) {
      map.set(animal.id, {
        paddock: paddockLookup.get(activeRot.paddockId)!,
        isGrazing: true,
        rotationNumber: activeRot.rotationNumber,
      });
    } else if (animal.paddockId && paddockLookup.has(animal.paddockId)) {
      map.set(animal.id, {
        paddock: paddockLookup.get(animal.paddockId)!,
        isGrazing: false,
      });
    }
  });

  return map;
}

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────
const PADDOCK_A: IPaddock = {
  id: 'paddock-A',
  name: 'Potrero Norte',
  capacity: 10,
  status: 'ACTIVE',
};

const PADDOCK_B: IPaddock = {
  id: 'paddock-B',
  name: 'Potrero Sur',
  capacity: 5,
  status: 'RESTING',
};

const makeAnimal = (overrides: Partial<Animal> & { id: string }): Animal => ({
  name: 'Animal Test',
  species: SpeciesType.BOVINE,
  animalType: AnimalType.RURAL,
  breed: 'Holstein',
  gender: Gender.FEMALE,
  birthDate: '2020-01-01',
  color: 'blanco',
  ownerId: 'owner-1',
  status: 'active',
  paddockId: null,
  ...overrides,
});

describe('buildAnimalPaddockMap — Caja Negra + Estado + Boundary Tests', () => {
  // ────────────────────────────────────────────────
  // Happy path: pastoreo activo (sin exitDate)
  // ────────────────────────────────────────────────
  it('mapea correctamente un animal con actividad de pastoreo activa (happy path)', () => {
    const animal = makeAnimal({ id: 'a1' });

    const grazingActivity: IGrazingActivity = {
      id: 'g1',
      paddockId: 'paddock-A',
      animalIds: ['a1'],
      entryDate: '2026-09-01',
      exitDate: null,          // activo, sin fecha de salida
      rotationNumber: 3,
    };

    const result = buildAnimalPaddockMap([animal], [PADDOCK_A], [grazingActivity]);

    expect(result.has('a1')).toBe(true);
    const info = result.get('a1')!;
    expect(info.isGrazing).toBe(true);
    expect(info.rotationNumber).toBe(3);
    expect(info.paddock.name).toBe('Potrero Norte');
  });

  // ────────────────────────────────────────────────
  // Estado: paddockId directo (sin pastoreo activo)
  // ────────────────────────────────────────────────
  it('mapea un animal con paddockId directo como NO en pastoreo (estado de asignación permanente)', () => {
    const animal = makeAnimal({ id: 'a2', paddockId: 'paddock-B' });

    const result = buildAnimalPaddockMap([animal], [PADDOCK_A, PADDOCK_B], []);

    expect(result.has('a2')).toBe(true);
    const info = result.get('a2')!;
    expect(info.isGrazing).toBe(false);
    expect(info.paddock.id).toBe('paddock-B');
    expect(info.paddock.name).toBe('Potrero Sur');
  });

  // ────────────────────────────────────────────────
  // Boundary: animal sin potrero asignado
  // ────────────────────────────────────────────────
  it('NO incluye en el mapa un animal sin paddockId y sin actividad de pastoreo (boundary: sin asignación)', () => {
    const animal = makeAnimal({ id: 'a3', paddockId: null });

    const result = buildAnimalPaddockMap([animal], [PADDOCK_A], []);

    expect(result.has('a3')).toBe(false);
    expect(result.size).toBe(0);
  });

  // ────────────────────────────────────────────────
  // Boundary: pastoreo expirado (exitDate en el pasado)
  // El animal tiene paddockId directo como fallback
  // ────────────────────────────────────────────────
  it('trata como expirada una actividad con exitDate en el pasado y cae al paddockId directo (boundary: fecha expirada)', () => {
    const animal = makeAnimal({ id: 'a4', paddockId: 'paddock-B' });

    const expiredGrazing: IGrazingActivity = {
      id: 'g2',
      paddockId: 'paddock-A',
      animalIds: ['a4'],
      entryDate: '2025-01-01',
      exitDate: '2025-06-01',   // ya pasó: 2025 < 2026
      rotationNumber: 1,
    };

    const result = buildAnimalPaddockMap([animal], [PADDOCK_A, PADDOCK_B], [expiredGrazing]);

    // El pastoreo está expirado, así que usa el paddockId directo (PADDOCK_B)
    expect(result.has('a4')).toBe(true);
    const info = result.get('a4')!;
    expect(info.isGrazing).toBe(false);
    expect(info.paddock.id).toBe('paddock-B');
  });

  // ────────────────────────────────────────────────
  // Múltiples animales: mezcla de todos los escenarios
  // ────────────────────────────────────────────────
  it('procesa correctamente una lista mixta de animales con distintos estados', () => {
    const animalGrazing = makeAnimal({ id: 'a5' });
    const animalDirect  = makeAnimal({ id: 'a6', paddockId: 'paddock-B' });
    const animalNone    = makeAnimal({ id: 'a7', paddockId: null });

    const activeGrazing: IGrazingActivity = {
      id: 'g3',
      paddockId: 'paddock-A',
      animalIds: ['a5'],
      entryDate: '2026-09-01',
      exitDate: null,
      rotationNumber: 2,
    };

    const result = buildAnimalPaddockMap(
      [animalGrazing, animalDirect, animalNone],
      [PADDOCK_A, PADDOCK_B],
      [activeGrazing]
    );

    expect(result.size).toBe(2);                         // a7 no aparece
    expect(result.get('a5')?.isGrazing).toBe(true);
    expect(result.get('a6')?.isGrazing).toBe(false);
    expect(result.has('a7')).toBe(false);
  });
});

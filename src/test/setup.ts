import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupTestEnv } from './testUtils';

// Configurar variables de entorno para testing
const restoreEnv = setupTestEnv();

// Limpiar después de cada test
afterEach(() => {
    cleanup();
});

// Configuración global para todas las pruebas
beforeAll(() => {
    // Configurar timeout más largo para pruebas de BD
    expect.addSnapshotSerializer({
        test: (val): val is { _id: unknown } => val && typeof val === 'object' && '_id' in val,
        print: (val: unknown) => `ObjectId("${(val as { _id: unknown })?._id}")`,
    });
});

// Limpiar al final de todas las pruebas
afterAll(() => {
    restoreEnv();
});
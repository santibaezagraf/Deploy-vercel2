import { vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { mongo } from 'mongoose';
import type { MockedFunction } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock configuración global para MongoDB
let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;



// Setup de MongoDB en memoria para todas las pruebas
export const setupTestDB = async () => {

    if (isConnected || mongoose.connection.readyState === 1) {
        return
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create({
        binary: {
            version: '6.0.0', // Especificar versión de MongoDB
        },
        instance: {
            dbName: 'test-db',
        },
        });

        
    }
    
    const mongoUri = mongoServer.getUri();

    // Conectar mongoose a la instancia de prueba
    await mongoose.connect(mongoUri);
    isConnected = true;
};

// Limpiar base de datos después de cada prueba
export const cleanupTestDB = async () => {
    if (mongoose.connection.readyState === 1) {
        // Limpiar todas las colecciones
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
};

// Cerrar conexión y parar servidor
export const teardownTestDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
};

// Mock de la conexión a MongoDB para pruebas unitarias
export const mockMongoConnection = () => {
    const mockConnect = vi.fn().mockResolvedValue(undefined);
    const mockConnection = {
        readyState: 1, // Connected
        collections: {},
        dropDatabase: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
    };

    return {
        mockConnect,
        mockConnection,
    };
};

// Mock de modelos para pruebas unitarias sin BD
export const createMockModel = <T>(modelName: string) => {
    const mockDocument = {
        _id: 'mock-id',
        save: vi.fn().mockResolvedValue({}),
        toObject: vi.fn().mockReturnValue({}),
        toJSON: vi.fn().mockReturnValue({}),
    };

    const mockModel = {
        find: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue([mockDocument]),
                }),
                exec: vi.fn().mockResolvedValue([mockDocument]),
            }),
            limit: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue([mockDocument]),
            }),
            exec: vi.fn().mockResolvedValue([mockDocument]),
        }),
        findOne: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        findById: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        findByIdAndUpdate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        findByIdAndDelete: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        findOneAndUpdate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        findOneAndDelete: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockDocument),
        }),
        create: vi.fn().mockResolvedValue(mockDocument),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 1 }),
        countDocuments: vi.fn().mockResolvedValue(1),
        aggregate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
        }),
    };

    // Constructor mock
    const ModelConstructor = vi.fn().mockImplementation((data) => ({
        ...mockDocument,
        ...data,
    }));

    // Agregar métodos estáticos al constructor
    Object.assign(ModelConstructor, mockModel);

    return {
        mockModel: ModelConstructor,
        mockDocument,
    };
};

// Configuración de mocks para las APIs
// export const mockAPIResponse = {
//     success: (data: any) => ({
//         ok: true,
//         status: 200,
//         json: vi.fn().mockResolvedValue(data),
//     }),
//     error: (status: number, message: string) => ({
//         ok: false,
//         status,
//         json: vi.fn().mockResolvedValue({ error: message }),
//     }),
//     unauthorized: () => ({
//         ok: false,
//         status: 401,
//         json: vi.fn().mockResolvedValue({ error: 'No autorizado' }),
//     }),
//     notFound: () => ({
//         ok: false,
//         status: 404,
//         json: vi.fn().mockResolvedValue({ error: 'No encontrado' }),
//     }),
//     badRequest: (message: string = 'Datos inválidos') => ({
//         ok: false,
//         status: 400,
//         json: vi.fn().mockResolvedValue({ error: message }),
//     }),
// };

export interface MockAPIResponse {
    success: <T>(data: T) => Response;
    error: (message: string, status?: number) => Response;
    unauthorized: () => Response;
    badRequest: (message: string) => Response;
    notFound: () => Response;
}

export const mockAPIResponse: MockAPIResponse = {

    success: <T>(data: T): Response => ({
        ok: true,
        status: 200,
        json: async () => data,
        text: async () => JSON.stringify(data),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: function() { return this; },
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
    } as Response),

    error: (message: string, status = 500): Response => ({
        ok: false,
        status,
        json: async () => ({ error: message }),
        text: async () => JSON.stringify({ error: message }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        redirected: false,
        statusText: status === 500 ? 'Internal Server Error' : 'Error',
        type: 'basic',
        url: '',
        clone: function() { return this; },
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
    } as Response),

    unauthorized: () => mockAPIResponse.error('No autorizado', 401),
    badRequest: (message: string) => mockAPIResponse.error(message, 400),
    notFound: () => mockAPIResponse.error('No encontrado', 404),
};

// Función helper para crear mock de fetch tipado
export const createMockFetch = (): MockedFunction<typeof fetch> => {
    return vi.fn() as MockedFunction<typeof fetch>;
};

// Setup automático
export const setupMockFetch = (): MockedFunction<typeof fetch> => {
    const mockFetch = createMockFetch();
    global.fetch = mockFetch;
    return mockFetch;
};

// ✅ Definir interfaces para los payloads
interface TestJWTPayload extends jwt.JwtPayload {
    userId: string;
    email: string;
    username?: string;
    role?: 'user' | 'admin';
}

interface TestUser {
    _id: string;
    email: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    role?: 'user' | 'admin';
}

interface TestReview {
    _id: string;
    bookId: string;
    userId: string;
    username: string;
    rating: number;
    comment: string;
    likesCount: number;
    dislikesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

interface TestFavorite {
    _id: string;
    userId: string;
    bookId: string;
    bookData: {
        title?: string;
        authors?: string[];
        description?: string;
        publishedDate?: string;
        imageLinks?: {
            thumbnail?: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

// ✅ Actualizar createTestData con tipos específicos
export const createTestData = {
    user: (overrides: Partial<TestUser> = {}): TestUser => ({
        _id: 'user-test-id',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),
    
    review: (overrides: Partial<TestReview> = {}): TestReview => ({
        _id: 'review-test-id',
        bookId: 'book123',
        userId: 'user-test-id',
        username: 'testuser',
        rating: 5,
        comment: 'Excellent book!',
        likesCount: 0,
        dislikesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),

    jwtPayload: (overrides: Partial<TestJWTPayload> = {}): TestJWTPayload => ({
        userId: 'user-test-id',
        email: 'test@example.com',
        username: 'testuser',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...overrides,
    }),

    favorite: (overrides: Partial<TestFavorite> = {}) => ({
        _id: 'favorite-test-id',
        userId: 'user-test-id',
        bookId: 'book123',
        bookData: {
            title: 'Test Book',
            authors: ['Test Author'],
            description: 'A test book description',
            publishedDate: '2023',
            imageLinks: {
                thumbnail: 'http://example.com/thumbnail.jpg',
            },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),
};

// Helper para crear datos de prueba
// export const createTestData = {
//     user: (overrides: any = {}) => ({
//         _id: 'user-test-id',
//         email: 'test@example.com',
//         username: 'testuser',
//         password: 'hashedpassword123',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         ...overrides,
//     }),
    
//     review: (overrides: any = {}) => ({
//         _id: 'review-test-id',
//         bookId: 'book123',
//         userId: 'user-test-id',
//         username: 'testuser',
//         rating: 5,
//         comment: 'Excellent book!',
//         likesCount: 0,
//         dislikesCount: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         ...overrides,
//     }),
    
//     favorite: (overrides: any = {}) => ({
//         _id: 'favorite-test-id',
//         userId: 'user-test-id',
//         bookId: 'book123',
//         bookData: {
//             title: 'Test Book',
//             authors: ['Test Author'],
//             description: 'A test book description',
//             publishedDate: '2023',
//             imageLinks: {
//                 thumbnail: 'http://example.com/thumbnail.jpg',
//             },
//         },
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         ...overrides,
//     }),
    
//     vote: (overrides: any = {}) => ({
//         _id: 'vote-test-id',
//         userId: 'user-test-id',
//         reviewId: 'review-test-id',
//         voteType: 'like',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         ...overrides,
//     }),
// };

// Configuración de environment variables para testing
export const setupTestEnv = () => {
    const originalEnv = process.env;
    
    process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret-key',
        MONGODB_URI: 'mongodb://localhost:27017/test-db',
        BCRYPT_ROUNDS: '10',
    };
    
    return () => {
        process.env = originalEnv;
    };
};

// Helper para simular delays en operaciones async
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock de JWT para testing
export const mockJWT = {
    validToken: 'valid-jwt-token',
    expiredToken: 'expired-jwt-token',
    invalidToken: 'invalid-jwt-token',
    
    validPayload: {
        userId: 'user-test-id',
        email: 'test@example.com',
        username: 'testuser',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    },
};

export default {
    setupTestDB,
    cleanupTestDB,
    teardownTestDB,
    mockMongoConnection,
    createMockModel,
    mockAPIResponse,
    createTestData,
    setupTestEnv,
    delay,
    mockJWT,
};
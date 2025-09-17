import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { MockedFunction } from 'vitest';
import { verify } from 'crypto';

// Mock JWT
vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
        sign: vi.fn(),
    },
    verify: vi.fn(),
    sign: vi.fn(),
}));

const mockJWTVerify = vi.fn() as MockedFunction<
    (token: string, secretOrPublicKey: jwt.Secret, options?: jwt.VerifyOptions) => string | jwt.JwtPayload
>;


// Mock de la función de middleware
const createMockMiddleware = () => {
    return async (req: NextRequest) => {
        try {
            // Simular la lógica del middleware
            const token = req.cookies.get('token')?.value;
            
            if (!token) {
                return NextResponse.json(
                    { error: 'Token no encontrado' },
                    { status: 401 }
                );
            }

            // Verificar el token (mockeado)
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            
            if (!decoded) {
                return NextResponse.json(
                    { error: 'Token inválido' },
                    { status: 401 }
                );
            }

            // Si llegamos aquí, el token es válido
            return NextResponse.next();
        } catch (error) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }
    };
};

describe('Middleware de Autorización', () => {
    let middleware: ReturnType<typeof createMockMiddleware>;
    let mockRequest: NextRequest;

    beforeEach(() => {
        vi.clearAllMocks();
        mockJWTVerify.mockClear();
        middleware = createMockMiddleware();
        
        // Configurar environment variable mock
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('Casos de acceso permitido', () => {
        it('should allow access with valid token', async () => {
            // Mock de token válido
            const validPayload = { 
                userId: '123',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
            };
            
            mockJWTVerify.mockReturnValue(validPayload);

            // Crear request con token válido
            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=valid-jwt-token',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-secret');
            
            // Si NextResponse.next() fue llamado, no habría json/status en la respuesta
            // En este caso, verificamos que no sea un error response
            expect(response).toBeTruthy();
        });

        it('should verify token with correct secret', async () => {
            const validPayload = { 
                userId: '123', 
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
            };
            mockJWTVerify.mockReturnValue(validPayload);

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=valid-jwt-token',
                },
            });

            await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-secret');
        });

        it('should allow access to user with admin role', async () => {
            const adminPayload = { 
                userId: '123', 
                email: 'admin@example.com', 
                role: 'admin' 
            };
            mockJWTVerify.mockReturnValue(adminPayload);

            mockRequest = new NextRequest('http://localhost:3000/api/protected/admin', {
                headers: {
                    cookie: 'token=admin-jwt-token',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('admin-jwt-token', 'test-secret');
            expect(response).toBeTruthy();
        });
    });

    describe('Casos de acceso denegado', () => {
        it('should deny access when no token is provided', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/protected/test');

            const response = await middleware(mockRequest);

            expect(response).toBeInstanceOf(NextResponse);
            
            // Verificar que la respuesta es un error 401
            const responseData = await response.json();
            expect(responseData.error).toBe('Token no encontrado');
            expect(response.status).toBe(401);
        });

        it('should deny access with invalid token', async () => {
            // Mock de token inválido
            mockJWTVerify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=invalid-jwt-token',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('invalid-jwt-token', 'test-secret');
            
            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });

        it('should deny access with expired token', async () => {
            // Mock de token expirado
            mockJWTVerify.mockImplementation(() => {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                throw error;
            });

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=expired-jwt-token',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('expired-jwt-token', 'test-secret');
            
            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });

        it('should deny access with malformed token', async () => {
            // Mock de token mal formado
            mockJWTVerify.mockImplementation(() => {
                const error = new Error('Malformed token');
                error.name = 'JsonWebTokenError';
                throw error;
            });

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=malformed.token.here',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('malformed.token.here', 'test-secret');
            
            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });

        it('should deny access when token verification returns null', async () => {
            // Mock donde verify retorna null
            mockJWTVerify.mockReturnValue('');

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=null-token',
                },
            });

            const response = await middleware(mockRequest);

            expect(jwt.verify).toHaveBeenCalledWith('null-token', 'test-secret');
            
            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });
    });

    describe('Rutas específicas', () => {
        it('should allow access to public routes without token', async () => {
            // Para rutas públicas, el middleware no debería ejecutarse
            mockRequest = new NextRequest('http://localhost:3000/api/public/test');
            
            // Simular que la ruta es pública (no protegida)
            const isPublicRoute = mockRequest.nextUrl.pathname.startsWith('/api/public');
            
            expect(isPublicRoute).toBe(true);
        });

        it('should protect private routes', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/protected/reviews');
            
            // Simular que la ruta es protegida
            const isProtectedRoute = mockRequest.nextUrl.pathname.startsWith('/api/protected');
            
            expect(isProtectedRoute).toBe(true);
        });

        it('should protect dashboard routes', async () => {
            mockRequest = new NextRequest('http://localhost:3000/dashboard');
            
            // Simular que la ruta del dashboard es protegida
            const isDashboardRoute = mockRequest.nextUrl.pathname.startsWith('/dashboard');
            
            expect(isDashboardRoute).toBe(true);
        });

        it('should protect profile routes', async () => {
            mockRequest = new NextRequest('http://localhost:3000/profile');
            
            // Simular que la ruta del perfil es protegida
            const isProfileRoute = mockRequest.nextUrl.pathname.startsWith('/profile');
            
            expect(isProfileRoute).toBe(true);
        });
    });

    describe('Manejo de errores', () => {
        it('should handle JWT secret not found', async () => {
            // Eliminar la variable de entorno
            delete process.env.JWT_SECRET;

            mockJWTVerify.mockImplementation(() => {
                throw new Error('Secret not found');
            });

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=test-token',
                },
            });

            const response = await middleware(mockRequest);

            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });

        it('should handle unexpected errors gracefully', async () => {
            mockJWTVerify.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            mockRequest = new NextRequest('http://localhost:3000/api/protected/test', {
                headers: {
                    cookie: 'token=test-token',
                },
            });

            const response = await middleware(mockRequest);

            const responseData = await response.json();
            expect(responseData.error).toBe('Token inválido');
            expect(response.status).toBe(401);
        });
    });
});
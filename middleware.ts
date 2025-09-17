import { verifyAccessToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export default async function middleware(request: NextRequest) {
    console.log('--- Middleware triggered ---');

    const { pathname } = request.nextUrl;

    console.log('🚨 MIDDLEWARE EJECUTÁNDOSE:', pathname);
    console.log('🍪 Cookies disponibles:', request.cookies.getAll());

    // Identificar tipos de rutas
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/');
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/api/protected/');
    const isPublicRoute = request.nextUrl.pathname.startsWith('/api/public/') || request.nextUrl.pathname === '/api/test-db';

    // Rutas públicas: permitir siempre
    if (isPublicRoute) {
        console.log(`✅ Public route, allowing access: ${pathname}`)
        return NextResponse.next()
    }

    // Rutas de autenticación: permitir siempre (login, register, refresh, logout)
    if (isAuthRoute) {
        console.log(`🔐 Auth route, allowing access: ${pathname}`)
        return NextResponse.next()
    }

    // Rutas protegidas: verificar token
    if (isProtectedRoute) {
        console.log(`🚧 Protected route, verifying token: ${pathname}`);

        // intentar obtener access token de varias fuentes
        let accessToken = null;

        // 1. Authorization header (Bearer token)
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.replace('Bearer ', '');
            console.log('🔑 Token found in Authorization header');
        }

        //2. Cookie (fallback)
        if (!accessToken) {
            accessToken = request.cookies.get('access-token')?.value;
            if (accessToken) {
                console.log('🔑 Token found in cookies');
            }
        }

        // No token found
        if (!accessToken) {
            console.log('❌ No access token found, denying access');
            return NextResponse.json(
                { 
                    error: 'Access token required',
                    code: 'no_token'
                }, 
                { status: 401 }
            );
        }

        // Verificar token
        const decoded = verifyAccessToken(accessToken);
        if (!decoded) {
            console.log('❌ Invalid or expired access token, denying access');
            return NextResponse.json(
                { 
                    error: 'Invalid or expired access token',
                    code: 'invalid_token'
                }, 
                { status: 401 }
            );
        };

        // Token válido, permitir acceso
        console.log(`✅ Access token valid, allowing access to: ${pathname}`);
        
        // Pasar userId a la ruta API mediante header
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', decoded.userId); 

        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });
    }

    // Por defecto, permitir acceso
    console.log(`ℹ️ Unhandled route type, allowing access: ${pathname}`);
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/'
    ], // Aplicar middleware solo a rutas API
};
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // ✅ Configurar output para evitar problemas con rutas API
    output: 'standalone',
    
    // ✅ Configurar para que las rutas API no sean pre-renderizadas
    experimental: {
        // Configuraciones experimentales válidas pueden ir aquí
    },
    
    // ✅ Configurar rutas que no deben ser estáticas
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: '/api/:path*',
            },
        ];
    },
    
    // ✅ Variables de entorno para el cliente (solo si es necesario)
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
    
    // ✅ Configurar headers para API routes
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
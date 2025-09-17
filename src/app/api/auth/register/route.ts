import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateTokenPair } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { email, password, username } = await request.json()

        console.log('Datos recibidos:', { email, password, username })

        // Validaciones básicas
        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con este email' },
                { status: 400 }
            )
        }

        // Crear usuario (el hash se hace automáticamente por el middleware)
        const user = await User.create({
            email,
            password,
            username,
        })

        // Generar par de tokens
        const { accessToken, refreshToken } = generateTokenPair(user._id.toString())

        const response = NextResponse.json({
            message: 'Usuario creado exitosamente',
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        })

        // Establecer ambas cookies httpOnly
        response.cookies.set('access-token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 2, // 2 horas
        })

        response.cookies.set('refresh-token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 días
        })

        return response
    } catch (error) {
        console.error('Error en registro:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
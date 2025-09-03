# Etapa 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (mejora el cacheo)
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm ci --only=production=false

# Copiar el resto del código
COPY . .

# Construir la app para producción
RUN npm run build

# Etapa 2: Imagen final para producción
FROM node:20-alpine AS runner

WORKDIR /app

# Crear usuario no-root por seguridad 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV=production

# Para Next.js standalone output 
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

EXPOSE 3000
ENV PORT=3000

# Comando optimizado para Next.js standalone
CMD ["node", "server.js"]
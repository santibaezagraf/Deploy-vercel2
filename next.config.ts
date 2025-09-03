/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 🔑 Esta línea es la clave
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
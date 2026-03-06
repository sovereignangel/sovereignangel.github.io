/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: 'arc.loricorpuz.com' }],
          destination: '/arc',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'arc.loricorpuz.com' }],
          destination: '/arc/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig

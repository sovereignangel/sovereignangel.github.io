/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // alamobernal.loricorpuz.com → /alamo-bernal
        {
          source: '/',
          has: [{ type: 'host', value: 'alamobernal.loricorpuz.com' }],
          destination: '/alamo-bernal',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'alamobernal.loricorpuz.com' }],
          destination: '/alamo-bernal/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig

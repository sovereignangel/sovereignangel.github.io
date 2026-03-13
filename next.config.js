/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async rewrites() {
    return {
      beforeFiles: [
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
        {
          source: '/',
          has: [{ type: 'host', value: 'blog.loricorpuz.com' }],
          destination: '/blog',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'blog.loricorpuz.com' }],
          destination: '/blog/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig

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
        {
          source: '/',
          has: [{ type: 'host', value: 'latentspace.loricorpuz.com' }],
          destination: '/latent-space',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'latentspace.loricorpuz.com' }],
          destination: '/latent-space/:path*',
        },
        {
          source: '/',
          has: [{ type: 'host', value: 'scavengerhunt.loricorpuz.com' }],
          destination: '/scavenger-hunt',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'scavengerhunt.loricorpuz.com' }],
          destination: '/scavenger-hunt/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig

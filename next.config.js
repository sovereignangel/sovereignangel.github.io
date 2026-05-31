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
  async redirects() {
    return [
      {
        source: '/arete/mistral/:path*',
        destination: '/arete',
        permanent: true,
      },
      {
        source: '/arete/salons/:path*',
        destination: '/arete',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

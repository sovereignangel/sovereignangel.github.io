/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // The local book corpus is read by path at runtime, which makes Next's file
  // tracer pull ~72MB of source PDFs into every /api/books bundle. They are
  // gitignored and never deployed, so exclude them outright — otherwise a build
  // on a machine that has them blows past the serverless function size limit.
  experimental: {
    outputFileTracingExcludes: {
      '/api/books/**': ['./app/books/**'],
    },
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

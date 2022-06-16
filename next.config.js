const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')
const withTM = require('next-transpile-modules')
const { BASEMENT_WEBSITE_URL } = process.env

/**
 * @type {import('next').NextConfig}
 */
const config = {
  reactStrictMode: false,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
  images: {
    domains: ['avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp']
  },
  experimental: { images: { layoutRaw: true }, esmExternals: 'loose' },
  async redirects() {
    return [
      {
        source: '/experiments',
        destination: '/',
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/experiments/:path*',
        destination: `${BASEMENT_WEBSITE_URL}/lab/experiments/:path*`
      }
    ]
  }
}

module.exports = withPlugins(
  [
    withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' }),
    withTM(['ogl', 'react-ogl', '@basementstudio/definitive-scroll'])
  ],
  config
)

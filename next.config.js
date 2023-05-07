const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')

/**
 * @type {import('next').NextConfig}
 */
const config = {
  typescript: {
    ignoreBuildErrors: true
  },
  reactStrictMode: false,
  swcMinify: false,
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
  images: {
    domains: ['avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp']
  },
  experimental: { esmExternals: 'loose' },
  async redirects() {
    return [
      {
        source: '/experiments',
        destination: '/',
        permanent: true
      }
    ]
  },
  transpilePackages: ['ogl', 'react-ogl', '@basementstudio/definitive-scroll']
}

module.exports = withPlugins(
  [withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })],
  config
)

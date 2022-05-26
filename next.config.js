const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')
const withTM = require('next-transpile-modules')

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
  }
}

module.exports = withPlugins(
  [
    withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' }),
    withTM(['ogl', 'react-ogl', '@basementstudio/definitive-scroll'])
  ],
  config
)

const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')
const withTM = require('next-transpile-modules')

/**
 * @type {import('next').NextConfig}
 */
const config = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp']
  },
  experimental: { images: { layoutRaw: true } }
}

module.exports = withPlugins(
  [withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' }), withTM([])],
  config
)

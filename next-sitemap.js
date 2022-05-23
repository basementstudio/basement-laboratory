const siteURL = new URL(process.env.NEXT_PUBLIC_SITE_URL)

module.exports = {
  siteUrl: siteURL.href,
  generateRobotsTxt: true,
  exclude: []
}

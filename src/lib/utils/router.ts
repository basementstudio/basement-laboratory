import { siteOrigin } from '~/lib/constants'

export type QueryParams = { [key: string]: string | null }

/**
 * Returns pathname without query params.
 */
export const cleanPath = (href: string) => {
  const uri = new URL(href, siteOrigin)
  return uri.pathname
}

/**
 * Checks is link is external or not.
 */
export const checkIsExternal = (href: string) => {
  try {
    const url = new URL(href)
    const { hostname } = new URL(siteOrigin)
    if (url.hostname !== hostname) return true
  } catch (error) {
    // failed cause href is relative
    return false
  }
}

/**
 * Returns href with query parameters and hash. Handles overrides or deletions appropriately.
 */
export const getHrefWithQuery = (
  href: string,
  newQueryParams?: QueryParams,
  override = true
) => {
  const uri = new URL(href, siteOrigin)

  if (newQueryParams) {
    Object.keys(newQueryParams).forEach((key) => {
      const value = newQueryParams[key]
      if (value === null) {
        if (override) uri.searchParams.delete(key)
        return
      }
      if (uri.searchParams.has(key) && override) {
        uri.searchParams.delete(key)
      }
      uri.searchParams.append(key, value)
    })
  }

  return `${uri.pathname}${uri.search}${uri.hash}`
}

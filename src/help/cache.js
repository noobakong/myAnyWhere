const {cache} = require('../config/defaultConfig')
function refreshRes(stats, res) {
  const { maxAge, expires, cacheControl, lastModified, etag } = cache
  if (expires) {
    res.setHeader('Expores', (new Date(Date.now() + maxAge * 1000)).toUTCString())
  }
  if (cacheControl) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`)
  }
  if (lastModified) {
    res.setHeader('Last-Modified', stats.mtime.toUTCString())
  }
  if (etag) {
    res.setHeader('ETag', `${stats.size}-${stats.mtime.toUTCString()}`)
  }
}

module.exports = function isFresh(stats, req, res) {
  refreshRes(stats, res)

  const lastModified = req.headers['if-modified-since']
  const etag = req.headers['if-none-match']

  if (!lastModified && !etag) {
    return false
  }
  if (lastModified && lastModified !== res.getHeader('Last-Modified')) {
    return false
  }
  if (etag && res.getHeader('ETag').indexOf(etag) ) {
    return false
  }
  return true
}

const {createGzip, createDeflate} = require('zlib')
module.exports = (rs, req, res) => {
  const acceptEncoding = req.headers['accept-encoding']
  if (!acceptEncoding || !acceptEncoding.match(/\b(gzip|deflate)\b/)) {
    return
  } else if (acceptEncoding.match(/\bgzip\b/)) {
    res.setHeader('Content-Encoding', 'gzip')
    return rs.pipe(createGzip())
  } else if (acceptEncoding.match(/\bdeflate\b/)) {
    res.setHeader('Content-Encoding', 'deflate')
    return rs.pipe(createGzip())
  }
}

/*
 match() 方法可在字符串内检索指定的值，或找到一个或多个正则表达式的匹配。
 该方法类似 indexOf() 和 lastIndexOf() ，但是它返回指定的值，而不是字符串的位置。
 */

## myanywhere
> 用原生node做一个简易阉割版的anywhere，以提升对node与http的理解。

读取文件或文件夹
```javascript
const http= require('http')
const conf = require('./config/defaultConfig')
const path = require('path')
const fs = require('fs')

const server = http.createServer((req, res) => {
  const filePath = path.join(conf.root, req.url)
  // http://nodejs.cn/api/fs.html#fs_class_fs_stats
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.statusCode = 404
      res.setHeader('Content-text', 'text/plain')
      res.end(`${filePath} is not a directoru or file`)
    }
    // 如果是一个文件
    if (stats.isFile()) {
      res.statusCode = 200
      res.setHeader('Content-text', 'text/plain')
      fs.createReadStream(filePath).pipe(res)
    } else if (stats.isDirectory()) {
      fs.readdir(filePath, (err, files) => {
        res.statusCode = 200
        res.setHeader('Content-text', 'text/plain')
        res.end(files.join(','))
      })
    }
  })
})

server.listen(conf.port, conf.hostname, () => {
  const addr = `http:${conf.hostname}:${conf.port}`
  console.info(`run at ${addr}`)
})

```

异步修改

router.js
```javascript
const fs = require('fs')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

module.exports = async function (req, res, filePath) {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      res.statusCode = 200
      res.setHeader('Content-text', 'text/plain')
      fs.createReadStream(filePath).pipe(res)
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath)
      res.statusCode = 200
      res.setHeader('Content-text', 'text/plain')
      res.end(files.join(','))
    }
  } catch (error) {
    res.statusCode = 404
    res.setHeader('Content-text', 'text/plain')
    res.end(`${filePath} is not a directoru or file`)
  }
}

```

index.js
```javascript
const http= require('http')
const conf = require('./config/defaultConfig')
const path = require('path')
const route = require('./help/router')

const server = http.createServer((req, res) => {
  const filePath = path.join(conf.root, req.url)
  route(req, res, filePath)
})

server.listen(conf.port, conf.hostname, () => {
  const addr = `http:${conf.hostname}:${conf.port}`
  console.info(`run at ${addr}`)
})
```

fs promisify stats createReadStream pipe

完善可点击
使用handlebars渲染
引用handlebars
const Handlebars = require('handlebars')

创建模板html

router配置
引用时使用绝对路径
const tplPath = path.join(__dirname, '../template/dir.html')
const source = fs.readFileSync(tplPath, 'utf8')
const template = Handlebars.compile(source)

创建数据
```javascript
const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const config = require('../config/defaultConfig')

const tplPath = path.join(__dirname, '../template/dir.html')
const source = fs.readFileSync(tplPath, 'utf8')
const template = Handlebars.compile(source)

module.exports = async function (req, res, filePath) {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      res.statusCode = 200
      res.setHeader('Content-text', 'text/plain')
      fs.createReadStream(filePath).pipe(res)
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath)
      res.statusCode = 200
      res.setHeader('Content-text', 'text/html')
      const dir = path.relative(config.root, filePath)
      const data = {
        // path.basename() 方法返回一个 path 的最后一部分
        title: path.basename(filePath),
        // path.relative('/data/orandea/test/aaa',      '/data/orandea/impl/bbb');
        // 返回: '../../impl/bbb'
        dir: dir ? `/${dir}` : '',
        files
      }
      console.info(files)
      res.end(template(data))
    }
  } catch (error) {
    console.error(error)
    res.statusCode = 404
    res.setHeader('Content-text', 'text/plain')
    res.end(`${filePath} is not a directoru or file\n ${error.toString()}`)
  }
}

```

mime.js

pop() 方法将删除 arrayObject 的最后一个元素，把数组长度减 1，并且返回它删除的元素的值。如果数组已经为空，则 pop() 不改变数组，并返回 undefined 值。

```javascript
module.exports = (filePath) => {
  let ext = path.extname(filePath).toLowerCase()

  if (!ext) {
    ext = filePath
  }

  return mimeTypes[ext] || mimeTypes['.txt']
}
```
mine.js 根据文件后缀名来返回对应的mime

压缩页面优化性能

文件 对读取的stream压缩

在 defaultConfig.js中 添加 compress项
```javascript
module.exports = {
  // process.cwd() 路径能随着执行路径的改变而改变
  // process cwd() 方法返回 Node.js 进程当前工作的目录。
  root: process.cwd(),
  hostname: '127.0.0.1',
  port: 9527,
  compress: /\.(html|js|css|md)/
}

```

编写压缩处理 compress

```javascript
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

```

router.js中读取文件的更改
```javascript
      let rs = fs.createReadStream(filePath)

      if (filePath.match(config.compress)) {
        rs = compress(rs, req, res)
      }
      rs.pipe(res)
```

压缩率可达 70%

range 不太明白

缓存
用户请求 本地缓存 --no--> 请求资源 --> 协商缓存 返回响应

用户请求 本地缓存 --yes--> 判断换存是否有效 --有效-->  本地缓存
                                         --无效-->   协商缓存 返回响应

缓存header
expires 老旧 现在不用
Cache-Control 相对与上次请求的时间
If-Modified-Since  /  Last-Modified
If-None-Match / ETag

cache.js
```javascript
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


```
router.js
```javascript
    if (isFresh(stats, req, res)) {
      res.statusCode = 304
      res.end()
      return
    }
```

自动打开浏览器

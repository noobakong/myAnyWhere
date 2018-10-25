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
      const files = readdir(filePath)
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

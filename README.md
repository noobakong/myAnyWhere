# myanywhere

> 用原生node做一个简易阉割版的anywhere静态资源服务器，以提升对node与http的理解。

![demo](http://pd92xwp9t.bkt.clouddn.com/image/notes/node-anywhere.gif)

**相关知识**

- es6及es7语法
- http的相关网络知识
  - 响应头
  - 缓存相关
  - 压缩相关


- path模块

  - path.join拼接路径
  - path.relative
  - path.basename
  - path.extname

- http模块

- fs模块

  - fs.stat函数 

    > 使用 fs.stat函数取得stats来获取文件或文件夹的参数

    - stats.isFile 判断是否为文件夹

  - fs.createReadStream(filePath).pipe(res)

    > 文件可读流的形式，使读取效率更高

  - fs.readdir

  - ...

- promisify 

  - async await

## 1.实现读取文件或文件夹

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

## 2. async await异步修改

> 为了避免多层回调出现，我们使用jsasync 和 await来 改造我们的代码

**router.js**

把逻辑相关的代码从app.js中抽离出来放入router.js中，分模块开发

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

**app.js**
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



## 3. 完善可点击

> 上面的工作 已经可以让我们在页面中看到文件夹的目录，但是是文字，不可点击

**使用handlebars渲染**

- 引用handlebars

  ```javascript
  const Handlebars = require('handlebars')
  ```

- 创建模板html

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{title}}</title>
    <style>
      body {
        margin: 10px
      }
      a {
        display: block;
        margin-bottom: 10px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    {{#each files}}
      <a href="{{../dir}}/{{file}}">{{file}}</a>
    {{/each}}
  </body>
  </html>

  ```

  ​

- router.js配置

  *引用时使用绝对路径*

  ```javascript 
  const tplPath = path.join(__dirname, '../template/dir.html')
  const source = fs.readFileSync(tplPath, 'utf8')
  const template = Handlebars.compile(source)
  ```

- 创建数据 `data`

    ```javascript
    ....
    module.exports = async function (req, res, filePath) {
      try {
       ...
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
    ...
      }
    }

    ```

## 4. mime

新建mime.js文件

```javascript
const path = require('path')

const mimeTypes = {
    ....
}
module.exports = (filePath) => {
  let ext = path.extname(filePath).toLowerCase()

  if (!ext) {
    ext = filePath
  }

  return mimeTypes[ext] || mimeTypes['.txt']
}
```
mine.js 根据文件后缀名来返回对应的mime

## 5. 压缩页面优化性能

> 对读取的stream压缩

**在 defaultConfig.js中 添加 compress项**
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

**编写压缩处理 compress**

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

**router.js中读取文件的更改**
```javascript
...
let rs = fs.createReadStream(filePath)
if (filePath.match(config.compress)) {
    rs = compress(rs, req, res)
  }
rs.pipe(res)
```

文件结果compress压缩后，压缩率可达 70%

## 6.处理缓存

**缓存大致原理**

用户请求 本地缓存 --no--> 请求资源 --> 协商缓存 返回响应

用户请求 本地缓存 --yes--> 判断换存是否有效 --有效-->  本地缓存
                                         				       --无效-->   协商缓存 返回响应

**缓存header**

- expires 老旧 现在不用
- Cache-Control 相对与上次请求的时间
- If-Modified-Since  /  Last-Modified
- If-None-Match / ETag

**cache.js**
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
**router.js**

```javascript
// 如果文件是是新鲜的 不用更改，就设置响应头 直接返回
if (isFresh(stats, req, res)) {
      res.statusCode = 304
      res.end()
      return
    }
```

## 7.自动打开浏览器

**编写openUrl.js**

```javascript
const {exec} = require('child_process')

module.exports = url => {
  switch (process.platform) {
  case 'darwin':
    exec(`open ${url}`)
    break

  case 'win32':
    exec(`start ${url}`)
  }
}
```

只支持Windows和 mac系统

**在app.js中使用**

```javascript
server.listen(conf.port, conf.hostname, () => {
  const addr = `http:${conf.hostname}:${conf.port}`
  console.info(`run at ${addr}`)
  openUrl(addr)
})
```

## 总结

domo不难，但是涉及到的零碎知识点比较多，对底层的node有个更进一步了解，也感受到了node在处理网路请求这一块的强大之处，另外es6和es7的新语法很是强大，以后要多做功课。
const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const config = require('../config/defaultConfig')
const Mime = require('./mime')
const compress = require('./compress')
const range = require('./range')
const isFresh = require('./cache')

const tplPath = path.join(__dirname, '../template/dir.html')
const source = fs.readFileSync(tplPath, 'utf8')
const template = Handlebars.compile(source)

module.exports = async function (req, res, filePath) {
  try {
    const stats = await stat(filePath)
    // console.info(stats)
    if (stats.isFile()) {
      const contentType = Mime(filePath)

      res.setHeader('Content-text', contentType)

      if (isFresh(stats, req, res)) {
        res.statusCode = 304
        res.end()
        return
      }

      let rs
      const {code, start, end} = range(stats.size, req, res)
      if (code === 200) {
        res.statusCode = 200
        rs = fs.createReadStream(filePath)
      } else {
        res.statusCode = 206
        rs = fs.createReadStream(filePath, {start, end})
      }

      if (filePath.match(config.compress)) {
        rs = compress(rs, req, res)
      }
      rs.pipe(res)
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath)
      res.statusCode = 200
      res.setHeader('Content-text', 'text/html')
      const dir = path.relative(config.root, filePath)
      const data = {
        // path.basename() 方法返回一个 path 的最后一部分
        title: path.basename(filePath),
        // path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
        // 返回: '../../impl/bbb'
        dir: dir ? `/${dir}` : '',
        files: files.map(file => {
          return {
            file,
            icon: Mime(file)
          }
        })
      }
      res.end(template(data))
    }
  } catch (error) {
    console.error(error)
    res.statusCode = 404
    res.setHeader('Content-text', 'text/plain')
    res.end(`${filePath} is not a directoru or file\n ${error.toString()}`)
  }
}

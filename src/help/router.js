const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const config = require('../config/defaultConfig')
const Mime = require('./mime')

const tplPath = path.join(__dirname, '../template/dir.html')
const source = fs.readFileSync(tplPath, 'utf8')
const template = Handlebars.compile(source)

module.exports = async function (req, res, filePath) {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      const contentType = Mime(filePath)
      res.statusCode = 200
      res.setHeader('Content-text', contentType)
      fs.createReadStream(filePath).pipe(res)
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

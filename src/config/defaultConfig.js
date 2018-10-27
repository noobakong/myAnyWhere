module.exports = {
  // process.cwd() 路径能随着执行路径的改变而改变
  // process cwd() 方法返回 Node.js 进程当前工作的目录。
  root: process.cwd(),
  hostname: '127.0.0.1',
  port: 9527,
  compress: /\.(html|js|css|md)/,
  cache: {
    maxAge: 10,
    expires: true,
    cacheControl: true,
    lastModified: true,
    etag: true
  }
}

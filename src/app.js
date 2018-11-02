#!/usr/bin / env node

const http= require('http')
const conf = require('./config/defaultConfig')
const path = require('path')
const express = require('express')
const swig = require('swig')
const route = require('./help/router')
const openUrl = require('./help/openUrl')

var app = express()

// swig.setDefaults({
//   allowErrors: false,
//   autoescape: true,
//   cache: false
// })

// 静态文件托管
app.use('/template', express.static(__dirname + '/template'))
app.use('/node_modules', express.static(__dirname + '../node_modules'))

// 定义模板引擎
app.engine('html', swig.renderFile)
// 设置模板文件存放目录
app.set('views', __dirname + '/template')
// 注册模板引擎
app.set('view engine', 'html')

app.use((req, res) => {
  const filePath = path.join(conf.root, req.url)
  route(req, res, decodeURI(filePath))
})



app.listen(conf.port, function () {
  const addr = `http:${conf.hostname}:${conf.port}`
  console.info(`run at ${addr}`)
  openUrl(addr)
})




/* eslint-disable import/no-dynamic-require */

const Router = require('koa-router')
const compose = require('koa-compose')
const logger = require('bd-logger')
const path = require('path')
const fs = require('fs')

const routers = []
const loggers = {}

module.exports = loadRouterFolder

// 获取所有router文件夹
function loadRouterFolder (configs = {}, apps) {
  const loggerConfig = configs.logger || {}
  if (apps) {
    Object.entries(apps).forEach(([key, dirname]) => {
      const routesDirname = path.join(dirname, 'routes')
      if (fs.existsSync(routesDirname)) {
        if (!loggers[key]) {
          loggers[key] = logger({
            ...loggerConfig,
            app: key,
          })
        }

        routers.push(loadRouter({
          dirname,
          prefix: '',
          logger: loggers[key],
          configs,
        }))
      }
    })
  }
  return compose(routers)
}

function loadRouter ({ dirname, prefix, logger, configs }) {
  const routers = []
  // 拼接router目录
  const routesDirname = path.join(dirname, 'routes', prefix)
  // 取出path中最后边的一段，也就是app name
  const routerName = dirname.match(/\/[^/]+$/)[0]

  // `index`默认为首页，去除`index`
  // `prefix`用于`routes`文件夹中如果还存在子目录的情况。会添加对应的`path`
  const router = new Router({
    prefix: (routerName === '/index' ? '' : routerName) + prefix,
  })

  const routes = fs.readdirSync(routesDirname)
  routes.forEach(file => {
    if (file[0] === '.') return
    const filePath = path.join(routesDirname, file)
    const fileStats = fs.statSync(filePath)

    // 如果是文件夹，
    if (fileStats.isDirectory()) {
      routers.push(loadRouter({
        dirname,
        prefix: path.join(prefix, '/', file),
        logger,
        configs,
      }))
    } else {
      // 普通文件直接执行
      const route = require(filePath)
      if (typeof route === 'function') {
        route(router, logger, configs)
      }
    }
  })

  return compose(routers.concat(router.routes()))
}

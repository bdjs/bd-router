'use strict';

var Router = require('koa-router');
var compose = require('koa-compose');
var logger = require('bd-logger');
var path = require('path');
var fs = require('fs');
var assign = require('object-assign');


var routers = [];
var loggers = {};

module.exports = function(apps, configs) {
  apps = apps || {};
  configs = configs || {};
  loggerConfig = configs.logger || {};
  var keys = Object.keys(apps);
  keys.map(function(key) {
    var dirname = apps[key];
    var prefix = (key == 'index') ? '' : key;
    var router = new Router({
      prefix: '/' + prefix
    });
    var routesDirname = path.join(dirname, 'routes');
    if (fs.existsSync(routesDirname)) {
      if (!loggers[key]) {
        loggers[key] = logger(assign({
          app: key
        }, loggerConfig));
      }
      var routes = fs.readdirSync(routesDirname);
      routes.map(function(file) {
        if (file[0] === '.') {
          return;
        }
        var route = require(path.join(routesDirname, file));
        if (typeof route == 'function') {
          route(router, loggers[key], configs);
        }
      });
    }
    routers.push(router.routes());
  });
  return compose(routers);
};

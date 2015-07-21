'use strict';

var Router = require('koa-router');
var compose = require('koa-compose');
var logger = require('bd-logger');
var path = require('path');
var fs = require('fs');

var routers = [];
var loggers = {};

module.exports = function(apps) {
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
                loggers[key] = logger({
                    app: key
                });
            }
            var routes = fs.readdirSync(routesDirname);
            routes.map(function(file) {
                if (file[0] === '.') {
                    return;
                }
                var route = require(path.join(routesDirname, file));
                if (typeof route == 'function') {
                    route(router, loggers[key]);
                }
            });
        }
        routers.push(router.routes());
    });
    return compose(routers);
};
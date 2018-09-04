declare module 'bd-router'

declare function loadRouter (configs: any, apps: { [key in string]: string }): any[]

export default loadRouter

# wp-now

`wp-now` is an uber minimalistic webpack configuration designed to get you immediately coding as if the standards were built into the browser and server. Eventually you'll want to to detach your webpack config (`wp-now [-d, --detach]` (`//TODO`)), but the point is to get it up and running quickly.

So, `wp-now` requires you have a client and/or a server file. The server output file is automatically run and rerun on any changes. 

You can specify the server or the client file with `wp-now [-c, --client src/main/client.js] [-s, --server src/main/ssr.js]`, which would specify the client file to be in `src/main/client.js`. The defaults are `src/client.js` and `src/server.js`. It's probably recommendable to just use those.

Also, the client file gets the argument `process.env.BROWSER = true` and `process.env.SERVER = FALSE`, and the reverse for the server. This means you can implement server rendering. There will probably be an example, if anyone wants one. Please file an issue if you do. It'll take like 5 seconds.

If you don't have the peer dependecies, it will install them for you. If webpack can't find a dependency  it installs those automatically. It will also update dependencies if it needs a newer version.

It will output css to `/main.css`, so you should add `<link href="/main.css" rel="stylesheet" />` somewhere in your app, if you want to import css.

### Why?

So, why wouldn't I just make a repository you can clone or just use `create-react-app` or `yo` or `*`? Well, to use those things, you have to download the whole project or copy into your current project, or they're really complicated/etc. With this, you can just drop it into your project and go with basically not modifications.

### TODO

1. add production config, where you can publish
2. add detachment mechanism where you can extract the webpack config, so users can adjust it
3. make config extensible, where users can add their own configuration options
4. implement hmr
5. make auto server and client creator with/without react and with/without material design
6. split install, config, and run server logic

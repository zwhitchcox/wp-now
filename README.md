# wp-now

`wp-now` is an uber minimalistic webpack configuration designed to get you immediately codign as if the standards were built into the browser and server. Eventually you'll want to to detach your webpack config (`wp-now [-d, --detach]` (`//TODO`)), but the point is to get it up and running quickly.

So, `wp-now` requires you have a client and/or a server file. The server output file is automatically run and rerun on any changes. 

You can specify the server or the client file with `wp-now [-c, --client src/main/client.js] [-s, --server src/main/ssr.js]`, which would specify the client file to be in `src/main/client.js`. Also, the client file gets the argument `process.env.BROWSER = true` and `process.env.SERVER = FALSE`, and the reverse for the server. This means you can implement server rendering. There will probably be an example, if anyone wants one. Please file an issue if you do. It'll take like 5 seconds.

If you don't have the peer dependecies, it will install them for you. If webpack can't find a dependency  it installs those automatically.

It will output css to `/main.css`, so you should add `<link href="/main.css" rel="stylesheet" />` somewhere in your app, if you want to import css.

### TODO

1. add production config, where you can publish
2. add detachment mechanism where you can extract the webpack config, so users can adjust it
3. make config extensible, where users can add their own configuration options
4. implement hmr
5. make auto server and client creator with/without react and with/without material design

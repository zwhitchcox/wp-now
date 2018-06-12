# wp-now

`wp-now` is an uber minimalistic webpack configuration designed to get you immediately codign as if the standards were built into the browser and server. Eventually you'll want to to detach your webpack config (`wp-now [-d, --detach]` (`//TODO`)), but the point is to get it up and running quickly.

So, `wp-now` requires you have a client and/or a server file. The server output file is automatically run and rerun on any changes. 

You can specify the server or the client file with `wp-now [-c, --client src/main/client.js] [-s, --server src/main/ssr.js]`, which would specify the client file to be in `src/main/client.js`. Also, the client file gets the argument `process.env.BROWSER = true` and `process.env.SERVER = FALSE`, and the reverse for the server. This means you can implement server rendering. There will probably be an example, if anyone wants one. Please file an issue if you do. It'll take like 5 seconds.

If you don't have the peer dependecies, it will ask to install them for you. Or you can just specify `-y or --yes`, and it will install them for you. not going to maintain a list, becaus e it's easier just to let them install them.

So, I think that's it. Most of my open source is downvoted on Reddit without giving a reason, but whatever. Hopefully you like it. PRs/feedback welcome. Just file an issue. Really rough right now.

Also, can make it where it automatically installs missing dependencies in your app as an option if that is wanted.


#### Why didn't you use rollup?

I used to use rollup, but there wasn't support for code splitting, and I didn't feel like writing it. There are also many other conviences webpack adds, and they've even implemented tree shaking. I don't really like webpack, but it's probably the best solution right now.

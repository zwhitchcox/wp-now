#!/usr/bin/env node
const webpack = require('webpack')
const cp = require('child_process')
const fs = require('fs')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackSourceMapSupport = require('webpack-source-map-support')
const path = require('path')
const rimraf = require('rimraf')
const project_root = process.cwd()
const babel_preset_env = require('@babel/preset-env')
const babel_preset_react = require('@babel/preset-react')
const babel_plugin_transform_runtime = require('@babel/plugin-transform-runtime')

process.chdir(project_root)
const readline_sync = require('readline-sync')
rimraf.sync(project_root + '/build/**')

const build_path = check_args(['-b', '--build']) || project_root + '/build'
const server_path = check_args(['-s', '--server']) ||  project_root + '/server.js'
const client_path = check_args(['-c', '--client']) ||  project_root + '/client.js'
const install_auto = check_args(['-a', '--auto-install']) ||  project_root + '/client.js'
const package = require(project_root + '/package.json')

const still_required = [
  'babel-polyfill',
  'source-map-support',
  ['babel-loader', '^8.0.0-beta'],
  '@babel/core',
  '@babel/runtime',
  '@babel/plugin-proposal-decorators',
].filter(dep =>  {
  if (Array.isArray(dep))
    dep = dep[0]
    return !(dep in (package.dependencies || {}) || dep in (package.devDependencies || {}))
}).map(dep => Array.isArray(dep) && typeof dep[1] === 'string' ? dep[0] + '@' + dep[1] : dep)

;(async () => {
let l;
if (l = still_required.length) {
  const install = readline_sync.question("We've detected that you still required the dependencies " + still_required.slice(0, l - 2).join(", ") + (l > 1 ? "and " : "") + still_required[l - 1] + " would you like to install them now? y/n\n")
  if (install[0] === 'y' || check_args_bool(['--yes', '-y'])) {
    const args = [using_yarn() ? 'add' : 'i'].concat(still_required)
    await new Promise((rej, res) => {
      const proc = cp.spawn(using_yarn() ? 'yarn' : 'npm', args, {
        stdio: 'inherit',
        cwd: project_root,
      })
      proc.on('exit', res)
    }).catch(console.error)
  }
}
const babelrc_path = project_root + '/.babelrc'

const client_exists = fs.existsSync(client_path)
const server_exists = fs.existsSync(server_path)
const babelrc_exists = fs.existsSync(babelrc_path)

function Clean() {}
Clean.prototype.apply = function(compiler) {
  compiler.hooks.compile.tap('clean-webpack-plugin', () => rimraf.sync(project_root + '/build/**'))
}
let babel_opts = {
  presets: [
    babel_preset_env,
    babel_preset_react,
  ],
  plugins: [
    babel_plugin_transform_runtime,
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ],
}
if (babelrc_exists) {
  const babelrc = fs.readFileSync(babelrc_path)
  babel_opts = JSON.parse(babelrc)
}

const config = []
if (client_exists) 
  config.push({
    entry: [
      'babel-polyfill',
      client_path,
    ],
    module: {
      rules: [
        {
          test: /\.svg$/,
          use: [
            {
              loader: require("babel-loader")
            },
            {
              loader: "react-svg-loader",
              options: {
                jsx: true,
              }
            }
          ]
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babel_opts,
          },
        },
        {
          test: /\.(css)$/,
          exclude: /node_modules/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader"
          ]
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx']
    },
    output: {
      path: build_path,
      publicPath: '/',
      filename: 'client.js'
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "main.css",
        chunkFilesname: "[id].css",
      }),
      new Clean,
      new webpack.DefinePlugin({
        'process.env.BROWSER': true,
        'process.env.SERVER': false,
      }),
    ],
    stats: 'minimal',
    target: 'web',
    context: project_root,
    devtool: 'eval-source-map',
    mode: 'development',
  })

if (server_exists) 
  config.push({
    entry: [
      'babel-polyfill',
      server_path,
    ],
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babel_opts,
          },
        },
        {
          test: /\.(css)$/,
          exclude: /node_modules/,
          use: ['css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx'],
      modules: [path.resolve(__dirname, 'node_modules'), project_root + '/node_modules', project_root],
    },
    output: {
      path: project_root + '/build',
      publicPath: '/',
      filename: 'server.js'
    },
    plugins: [
      new Clean,
      new webpack.DefinePlugin({
        'process.env.BROWSER': false,
        'process.env.SERVER': true,
      }),
      new WebpackSourceMapSupport(),
    ],
    target: 'node',
    devtool: 'source-map',
    mode: 'development',
    context: project_root,
    node: {
      __dirname: false,
    },
    stats: 'minimal',
  })

if (!config.length) {
  console.log('neither client, nor server config were found')
}

let server;

function start_server() {
  kill_server()
  server = cp.spawn('node', [project_root + '/build/server'], {stdio: 'inherit', cwd: project_root})
}

process.on('exit', kill_server)

function kill_server() {
  if(server) {
    server.kill('SIGTERM')
  }
}

let server_process;
config.forEach(conf => {
  webpack(conf).watch({
    aggregateTimeout: 300,
    poll: undefined
  }, (err, stats) => {
    if (server_exists) start_server()
    if (err || stats.hasErrors()) {
      stats.toJson()
    } else {
      stats.toJson('minimal')
    }
  })
})
  
})()



function check_args(check_arg) {
  check_arg = [].concat(check_arg)
  const args = process.argv.slice(2)
  let idx;
  let passed;
  if (~(idx = args.findIndex(arg => check_arg.includes(arg)))) {
    passed = process.argv[idx + 3]
  }
  if (!passed) return
  if (passed[0] === path.delimiter) {
    return passed
  }
  return path.resolve(project_root, passed)
}

function check_args_bool(check_arg) {
  const args = process.argv.slice(2)
  return args.some(arg => check_arg.includes(arg))
}
function using_yarn() {
  if (fs.existsSync(project_root + '/yarn.lock')) return true
}




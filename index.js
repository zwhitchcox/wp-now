#!/usr/bin/env node
const webpack = require('webpack')
const cp = require('child_process')
const fs = require('fs')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackSourceMapSupport = require('webpack-source-map-support')
const NpmInstallPlugin = require('npm-install-webpack-plugin')
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
;(async () => {
  
  await try_install([
    '@babel/core',
    'babel-polyfill',
    'css-loader',
    'url-loader',
    'react-svg-loader',
    'source-map-support',
    ['babel-loader', '^8.0.0-beta'],
    '@babel/runtime',
    '@babel/preset-react',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-decorators',
  ]
    .filter(check_dep)
    .map(dep => Array.isArray(dep) && typeof dep[1] === 'string' ? dep[0] + '@' + dep[1] : dep)
  )

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
      ['@babel/plugin-proposal-class-properties', { loose: true}],
    ],
  }
  if (babelrc_exists) {
    const babelrc = fs.readFileSync(babelrc_path)
    babel_opts = JSON.parse(babelrc)
  }

  const client_config = {
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
              loader: "babel-loader"
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
      new NpmInstallPlugin({
        dev: false,
        peerDependencies: true,
        quiet: false,
        yarn: true,
      }),
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
  }

  const server_config = {
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
      new NpmInstallPlugin({
        dev: false,
        peerDependencies: true,
        quiet: false,
        yarn: true,
      }),
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
  }

  if (!(server_exists || client_exists)) {
    throw new Error('neither client, nor server files were found')
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
  if (server_exists) {
    webpack(server_config).watch({
      aggregateTimeout: 300,
      poll: undefined
    }, (err, stats) => {
      if (server_exists) start_server()
      if (err || stats.hasErrors()) {
        stats && stats.toJson()
      } else {
        stats.toJson('minimal')
      }
    })
  }
  if (client_exists) {
    webpack(client_config).watch({
      aggregateTimeout: 300,
      poll: undefined
    }, (err, stats) => {
      console.log("client built")
      if (err || stats.hasErrors()) {
        stats && stats.toJson()
      } else {
        stats.toJson('minimal')
      }
    })
  }
  
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


async function try_install(deps) {
  console.log("deps = ", deps)
  if (l = deps.length) {
    const args = [using_yarn() ? 'add' : 'i'].concat([using_yarn() ? '--dev' : '--save-dev']).concat(deps)
    await new Promise((rej, res) => {
      const proc = cp.spawn(using_yarn() ? 'yarn' : 'npm', args, {
        stdio: 'inherit',
        cwd: project_root,
      })
      proc.on('exit', () => console.log('done installing') || res())
    }).catch(console.error)
  }
}

function check_dep(dep) {
  if (Array.isArray(dep)) {
    const version = dep[1]
    dep = dep[0]
    if (dep in (package.dependencies || {})) {
      const cur_major      = +(/\d/.exec(package.dependencies[dep])[0])
      const required_major = +(/\d/.exec(version)[0])
      return cur_major <= required_major
    } else if (dep in (package.devDependencies || {})) {
      const cur_major      = +(/\d/.exec(package.devDependencies[dep])[0])
      const required_major = +(/\d/.exec(version)[0])
      return cur_major <= required_major
    } else {
      return true 
    }
  }
    else return !(dep in (package.dependencies || {}) || dep in (package.devDependencies || {}))
}

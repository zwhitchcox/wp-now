#!/usr/bin/env node
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
let foobar;
;(async () => {

  let proj_name;
  let project_root = process.cwd();
  if (proj_name = check_args(['-c', '--create'])) {
    project_root =  process.cwd() + '/' + proj_name
    await new Promise((res, rej) => {
      const mkdirp = require('mkdirp')
      mkdirp(project_root, function(err) {
        if (err) rej(err)
        else console.log('Created project directory') || res()
      })
    })
    await new Promise((res, rej) => {
      cp.spawn('npm', ['init', '-y'], {
        stdio: 'inherit',
        cwd: project_root,
      }).on('exit', err => {
        if (err) rej(err)

        else console.log('Initialized project') || res()
      })
    })
  }
  process.chdir(project_root)
  const package = require(project_root + '/package.json')
  await try_install([
    '@babel/core',
    'babel-polyfill',
    'mini-css-extract-plugin',
    'webpack-source-map-support',
    'webpack',
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/plugin-transform-runtime',
    'css-loader',
    'url-loader',
    'react-svg-loader',
    'source-map-support',
    'webpack-plugin-install-deps',
    ['babel-loader', '^8.0.0-beta'],
    '@babel/runtime',
    'clean-webpack-plugin',
    '@babel/preset-react',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-decorators',
    'webpack-node-externals',
    'ncp',
  ]
    .filter(check_dep)
    .map(dep => Array.isArray(dep) && typeof dep[1] === 'string' ? dep[0] + '@' + dep[1] : dep)
  )
  const require_root = mod => require(path.resolve(project_root, 'node_modules', mod))

  const ncp = require_root('ncp').ncp
  const webpack = require_root('webpack')
  const MiniCssExtractPlugin = require_root('mini-css-extract-plugin')
  const WebpackSourceMapSupport = require_root('webpack-source-map-support')
  const InstallDeps = require_root('webpack-plugin-install-deps')
  const Clean = require_root('clean-webpack-plugin')
  const nodeExternals = require_root('webpack-node-externals');
  const babel_preset_env = require_root('@babel/preset-env')
  const babel_preset_react = require_root('@babel/preset-react')
  const babel_plugin_transform_runtime = require_root('@babel/plugin-transform-runtime')
  const babel_plugin_proposal_class_properties = require_root('@babel/plugin-proposal-class-properties')

  let install_type;
  if (install_type = check_args(['-i', '--install'])) {
    await new Promise((res, rej) => {
      ncp(__dirname + '/sample-files/' + install_type, process.cwd() + '/src', {
        stopOnErr: true,
        clobber: false,
      }, err => {
        if (err) rej(err)
        else console.log('Created starter files') || res()
      })
    })
  }

  const build_path = check_args(['-b', '--build']) || project_root + '/build'
  const server_path = check_args(['-s', '--server']) ||  project_root + '/src/server.js'
  const client_path = check_args(['-c', '--client']) ||  project_root + '/src/client.js'
  console.log("client_path = ", client_path)
  

  const babelrc_path = project_root + '/.babelrc'

  const client_exists = fs.existsSync(client_path)
  const server_exists = fs.existsSync(server_path)
  const babelrc_exists = fs.existsSync(babelrc_path)

  const output_opts = {
    colors: { level: 3, hasBasic: true, has256: true, has16m: true },
    cached: false,
    cachedAssets: false,
    entrypoints: false,
    exclude: [ 'node_modules', 'bower_components', 'components' ],
    infoVerbosity: 'info'
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
    output: {
      path: build_path,
      publicPath: '/',
      filename: 'client.js'
    },
    plugins: [
      new InstallDeps({
        dev: false,
        peerDependencies: true,
        quiet: false,
        yarn: true,
      }),
      new MiniCssExtractPlugin({
        filename: "main.css",
        chunkFilesname: "[id].css",
      }),
      new Clean(
        ['build'],
        {
          root: process.cwd(),
          exclude: ['server.js', 'server.js.map'],
          beforeEmit: true,
          watch: true,
          verbose: false,
        },
      ),
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
    output: {
      path: build_path,
      publicPath: '/',
      filename: 'server.js'
    },
    plugins: [
      new InstallDeps({
        dev: false,
        peerDependencies: true,
        quiet: false,
        yarn: true,
      }),
      new Clean(
        ['build'],
        {
          root: process.cwd(),
          exclude: ['client.js', 'client.map.js','main.css'],
          beforeEmit: true,
          verbose: false,
          watch: true,
        },
      ),
      new webpack.DefinePlugin({
        'process.env.BROWSER': false,
        'process.env.SERVER': true,
      }),
      new WebpackSourceMapSupport(),
    ],
    target: 'node',
    externals: [nodeExternals()],
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
  } else {
    console.log('building...')
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
      console.log(stats.toString(output_opts))
      if (server_exists) start_server()
    })
  }
  if (client_exists) {
    webpack(client_config).watch({
      aggregateTimeout: 300,
      poll: undefined
    }, (err, stats) => {
      console.log(stats.toString(output_opts))
    })
  }

  function check_args(check_arg) {
    check_arg = [].concat(check_arg)
    const args = process.argv.slice(2)
    let idx;
    let passed;
    if (~(idx = args.findIndex(arg => check_arg.includes(arg)))) {
      return args[idx + 1]
    }
    if (!passed) return
    if (passed[0] === path.delimiter) {
      return passed
    }
  }

  function check_args_bool(check_arg) {
    const args = process.argv.slice(2)
    return args.some(arg => check_arg.includes(arg))
  }

  function using_yarn() {
    if (fs.existsSync(project_root + '/yarn.lock')) return true
  }


  async function try_install(deps) {
    if (l = deps.length) {
      console.log("Installing " + deps.slice(0, l - 2).join(", ") + (l > 1 ? "and " : "") + deps[l - 1])
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
        return cur_major < required_major
      } else if (dep in (package.devDependencies || {})) {
        const cur_major      = +(/\d/.exec(package.devDependencies[dep])[0])
        const required_major = +(/\d/.exec(version)[0])
        return cur_major < required_major
      } else {
        return true 
      }
    }
    else return !(dep in (package.dependencies || {}) || dep in (package.devDependencies || {}))
  }
  
})().catch(console.error)


#!/usr/bin/env node

process.title = 'pack';

const USAGE = `
  $ pack <command> [entry] [options]

  Commands:

    build           compile all files to dist/
    serve           start a development server

  Options:

    -h, --help      print usage
    -v, --version   print version
`;

const NOCOMMAND = `
  Please specify a pack command:
    $ pack <command>

  For exapmle:
    $ pack serve index.js

  Run pack --help to see all options.
`;

const NOENTRY = `
  Please specify an entry:
    $ pack <command> <entry>

  Run pack <command> --help to see all options.
`;

const BUILD_USAGE = `
  $ pack build <entries> [options]

  Options:

    -h, --help         print usage
    -p, --production
`;

const SERVE_USAGE = `
  $ pack serve <entries> [options]

  Options:

    -h, --help   print usage
    -p, --port
`;

const minimist = require('minimist');
const argv = minimist(process.argv.slice(2), {
  alias: {
    help: 'h',
    port: 'p',
    production: 'p',
    version: 'v',
  },
  boolean: [
    'help',
  ],
});

switch (argv._[0]) {
// case 'init':
//   break;
case 'build': {
  if (argv.help) {
    console.log(BUILD_USAGE);
    process.exit();
  }

  if (argv._.length < 2) {
    console.error(NOENTRY);
    process.exit(1);
  }

  if (argv.production) {
    process.env.NODE_ENV = 'production';
  }

  const path = require('path');
  const webpack = require('webpack');
  const createConfig = require('./webpack.config');

  const cfg = {
    entry: {
      app: argv._.slice(1).map(f => path.resolve(f)),
    },
    watch: false,
  };

  const wpConfig = createConfig(cfg);

  if (module.parent) return void (module.exports = {
    args: argv,
    config: cfg,
    webpackConfig: wpConfig,
  });

  webpack(wpConfig, (err, stats) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }

    if (stats.hasErrors()) {
      stats.compilation.errors.forEach(err => {
        console.error(err.message);
        if (err.details) console.error(err.details);
      });
      process.exit(1);
    }

    console.log(stats.toString(wpConfig.stats));
  });

  break;
}

case 'serve': {
  if (argv.help) {
    console.log(SERVE_USAGE);
    process.exit();
  }

  if (argv._.length < 2) {
    console.error(NOENTRY);
    process.exit(1);
  }

  const Server = require('webpack-dev-server');
  const path = require('path');
  const webpack = require('webpack');
  const createConfig = require('./webpack.config');

  const cfg = {
    entry: {
      app: argv._.slice(1).map(f => path.resolve(f)),
    },
    watch: false,
  };

  const wpConfig = createConfig(cfg);

  if (module.parent) return void (module.exports = {
    args: argv,
    config: cfg,
    webpackConfig: wpConfig,
  });

  const compiler = webpack(wpConfig);
  const server = new Server(compiler, wpConfig.devServer);

  const port = argv.port || wpConfig.devServer.port;
  server.listen(port);

  break;
}

default:
  if (argv.help) {
    console.log(USAGE);
    process.exit();
  }

  if (argv.version) {
    const { version } = require('./package');
    console.log(version);
    process.exit();
  }

  if (module.parent) return void (module.exports = {
    args: argv,
    config: null,
    webpackConfig: null,
  });

  console.error(NOCOMMAND);
  process.exit(1);
}

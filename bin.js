#!/usr/bin/env node

process.title = 'pack';

const USAGE = `
  $ pack <command> [entry] [options]

  Commands:

    init            create default configs
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
    -t, --template
`;

const SERVE_USAGE = `
  $ pack serve <entries> [options]

  Options:

    -h, --help       print usage
    -o, --open
    -p, --port
    -t, --template
`;

const minimist = require('minimist');
const argv = minimist(process.argv.slice(2), {
  alias: {
    help: 'h',
    open: 'o',
    port: 'p',
    production: 'p',
    template: 't',
    version: 'v',
  },
  boolean: [
    'help',
  ],
});

// switch (argv._[0]) {
// case 'init':
// case 'build':
// case 'serve':
// }

switch (argv._[0]) {
case 'init': {
  const chalk = require('chalk');
  const fg = require('fast-glob');
  const fs = require('fs');
  const path = require('path');
  const util = require('util');

  const blankDir = path.resolve(__dirname, 'blank');
  const rootDir = process.cwd();

  const exists = util.promisify(fs.exists);
  const mkdirp = util.promisify(require('mkdirp'));

  function copy(src, dst) {
    return exists(dst).then(dstExists => {
      if (dstExists) return false;
      return write(src, dst);
    });
  }

  function write(src, dst) {
    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(dst, 'utf8');

      ws
        .once('ready', () => fs.createReadStream(src, 'utf8').pipe(ws))
        .once('close', () => resolve(true))
        .once('error', err => {
          if (err.code === 'ENOENT') return void resolve(
            mkdirp(path.dirname(dst)).then(() => write(src, dst))
          );

          reject(err);
        });
    });
  }

  const stream = fg.stream('**/*', {
    cwd: blankDir,
    dot: true,
    onlyFiles: true,
    stats: false,
  });

  stream
    .once('error', err => console.error(err.message))
    .on('data', file => {
      const dst = path.resolve(rootDir, file);
      const src = path.resolve(blankDir, file);

      copy(src, dst)
        .then(copied => {
          console.log(`- ${file} ${copied ? chalk.green('copied') : chalk.gray('skipped')}`);
        })
        .catch(err => {
          console.error(err.message);
        });
    });

  break;
}

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

  const template = argv.template ? path.resolve(argv.template) : null;

  const cfg = {
    entry: {
      app: argv._.slice(1).map(f => path.resolve(f)),
    },
    template,
    watch: false,
  };

  const wpConfig = createConfig(cfg);

  if (module.parent) return void (module.exports = {
    args: argv,
    config: cfg,
    template,
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
  const chalk = require('chalk');
  const path = require('path');
  const webpack = require('webpack');
  const createConfig = require('./webpack.config');

  const template = argv.template ? path.resolve(argv.template) : null;

  const cfg = {
    entry: {
      app: argv._.slice(1).map(f => path.resolve(f)),
    },
    template,
    watch: false,
  };

  const wpConfig = createConfig(cfg);

  if (argv.open) wpConfig.devServer.open = argv.open;

  if (module.parent) return void (module.exports = {
    args: argv,
    config: cfg,
    template,
    webpackConfig: wpConfig,
  });

  const compiler = webpack(wpConfig);
  const app = new Server(compiler, wpConfig.devServer);

  const port = argv.port || wpConfig.devServer.port;
  const server = app.listen(port, null, () => {
    const { address, family } = server.address();
    const host = /6/.test(family) ? `[${address}]` : address;
    const url = `http://${host}:${port}/`;
    console.log(chalk.blue(`Server listening at ${url}`));

    const open = argv.open || wpConfig.devServer.open;
    if (open) {
      const opn = require('opn');

      if (typeof open === 'string') {
        opn(url, { app: open });
      } else {
        opn(url);
      }
    }
  });

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

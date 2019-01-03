const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// @todo detect package.json and use its directory as root
const rootDir = process.cwd();

module.exports = function webpackConfig(options) {
  const opts = Object.assign({
    entry: null,

    outputPath: path.resolve(rootDir, 'dist'),
    outputPublicPath: '/',

    watch: false,
  }, options);

  const isProduction = process.env.NODE_ENV === 'production';
  const libStylesPath = path.resolve(rootDir, 'lib');

  const cfg = {};

  cfg.mode = isProduction ? 'production' : 'development';

  cfg.entry = opts.entry;

  cfg.output = {
    filename: isProduction ? '[name][hash].js' : '[name].js',
    path: opts.outputPath,
    publicPath: '/',
  };

  cfg.module = {
    rules: [
      {
        test: /\.css$/,
        include: libStylesPath,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: false,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: libStylesPath,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: isProduction
                ? '_[name]-[local]__[hash:base64:5]'
                : '_[hash:base64:5]',
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(gif|jpg|png|xml)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: isProduction ? '[hash].[ext]' : '[name][hash].[ext]',
              outputPath: 'assets',
            },
          },
        ],
      },
      {
        test: /\.pug$/,
        use: 'pug-loader',
      },
    ],
  };

  cfg.resolve = {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
  };

  cfg.target = 'web';

  cfg.stats = {
    all: false,
    assets: true,
    errors: true,
    timings: true,
    warnings: true,
  };

  cfg.devServer = {
    contentBase: opts.outputPath,
    compress: false,
    open: false,
    port: 1234,
    stats: {
      all: false,
      assets: true,
      errors: true,
      timings: true,
      warnings: true,
    },
  };

  cfg.watch = opts.watch;

  cfg.optimization = {
    splitChunks: {
      cacheGroups: {
        appStyles: {
          name: 'app',
          test: m => m.constructor.name === 'CssModule' && !m.context.startsWith(libStylesPath),
          chunks: 'all',
          enforce: true,
        },
        libStyles: {
          name: 'lib',
          test: m => m.constructor.name === 'CssModule' && m.context.startsWith(libStylesPath),
          chunks: 'all',
          enforce: true,
        },
        vendor: {
          name: 'vendor',
          test: 'vendor',
          chunks: 'initial',
          enforce: true,
        },
      },
    },
  };

  cfg.plugins = [
    new MiniCssExtractPlugin({
      filename: isProduction ? '[name][contenthash].css' : '[name].css',
    }),
  ];

  return cfg;
};

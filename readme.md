# pack
Zero configuration packager for the rapid prototyping. Uses webpack internally with predefined configuration.

## assets supported
- css (with and without cssmodules)
- js (with babel)
- gif,jpg,png,xml

## usage
```
  $ pack <command> [entry] [options]

  Commands:

    init            create default configs
    build           compile all files to dist/
    serve           start a development server

  Options:

    -h, --help      print usage
    -v, --version   print version
```

## todo
- colors support
- html support

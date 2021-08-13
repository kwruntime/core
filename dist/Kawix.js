"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Kawix = exports.Installer = exports.KModule = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _module = _interopRequireDefault(require("module"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _crypto = _interopRequireDefault(require("crypto"));

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//import Child from 'child_process'
class Deferred {
  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  get promise() {
    return this._promise;
  }

}

class KModule {
  static addVirtualFile(path, filedata) {
    if (typeof filedata == "function") {
      filedata = filedata();
    }

    this.$files.set(_path.default.posix.join("/virtual", path), filedata);
  }

  static addExtensionLoader(ext, loader) {
    _module.default["_extensions"][ext] = function (module, filename) {
      let defaultPreload = function () {
        module._compile("exports.__kawix__compile = true; exports.__local__vars = { module, require, __dirname, __filename, global, Buffer }; exports.__filename = " + JSON.stringify(filename), filename);
      };

      if (loader.preload) {
        loader.preload(module, filename, defaultPreload);
      } else {
        defaultPreload();
      }
    };

    this.addExtensionLoader[ext] = loader;
    this.extensionCompilers[ext] = loader.compile;
  }

  constructor(module) {
    this.$module = module;
  }

  get extensions() {
    let item = {};

    for (let id in this.extensionCompilers) {
      item[id] = true;
    }

    return item;
  }

  get extensionCompilers() {
    return KModule.extensionCompilers;
  }

  get languages() {
    return KModule.languages;
  }
  /* backward */


  injectImport() {}

  injectImports() {}

  disableInjectImport() {}
  /* backward */


  addVirtualFile() {
    return KModule.addVirtualFile.apply(KModule, arguments);
  }

  addExtensionLoader() {
    return KModule.addExtensionLoader.apply(KModule, arguments);
  }

  import(request, parent = null) {
    if (!parent) parent = this.$module;
    return global.kawix.import(request, parent);
  }

}

exports.KModule = KModule;

_defineProperty(KModule, "languages", {
  "json": ".json",
  "javascript": ".js",
  "ecmascript": ".js",
  "typescript": ".ts"
});

_defineProperty(KModule, "extensionCompilers", {});

_defineProperty(KModule, "extensionLoaders", {});

_defineProperty(KModule, "$files", new Map());

class Installer {
  constructor(kawix) {
    this.$kawix = kawix;
  }

  getBinFolder() {
    if (_os.default.platform() == "linux") {
      if (process.getuid() == 0) {
        return "/usr/KwRuntime/bin";
      } else {
        return _path.default.join(_os.default.homedir(), "KwRuntime", "bin");
      }
    }

    if (_os.default.platform() == "win32") {
      return _path.default.join(_os.default.homedir(), "KwRuntime", "bin");
    }
  }

  install(href, name, exe = "kwrun") {
    if (_os.default.platform() == "linux" || _os.default.platform() == "darwin") {
      let bin = this.getBinFolder();

      let cmd = _path.default.join(bin, exe);

      let out = _path.default.join(bin, name);

      _fs.default.writeFileSync(out, [`#!${cmd}`, `export {default} from ${JSON.stringify(href)}`, `export * from ${JSON.stringify(href)}`].join("\n"));

      _fs.default.chmodSync(out, "775");

      console.info("Installed!");
    } else if (_os.default.platform() == "win32") {
      let bin = this.getBinFolder();

      let cmd = _path.default.join(bin, exe);

      let out = _path.default.join(bin, name + ".cmd");

      _fs.default.writeFileSync(out, [`@echo off`, `"${cmd}" "${href}" %*`].join("\n"));

      console.info("Installed!");
    }
  } // install in path


  selfInstall() {
    if (_os.default.platform() == "linux" || _os.default.platform() == "darwin") {
      return this.selfInstallUnix();
    } else if (_os.default.platform() == "win32") {
      return this.selfInstallWin32();
    }
  }

  async setExtensions(type, description, extensions, terminal = true) {
    let name = "com.kodhe.com-" + type.replace(/\//g, '-') + (terminal ? 'terminal' : '');
    let def = {
      resolve: null,
      reject: null,
      promise: null
    };
    def.promise = new Promise(function (a, b) {
      def.resolve = a;
      def.reject = b;
    });
    let extnames = [];

    for (let ext of extensions) {
      extnames.push(`HKCU\\SOFTWARE\\Classes\\${ext}`);
    }

    let WinReg = null;
    WinReg = require("winreg-vbs");
    WinReg.createKey([...extnames, `HKCU\\SOFTWARE\\Classes\\${name}`, `HKCU\\SOFTWARE\\Classes\\${name}\\DefaultIcon`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open\\command`], function (err) {
      if (err) def.reject(err);
      def.resolve();
    });
    await def.promise;
    def = {
      resolve: null,
      reject: null,
      promise: null
    };
    def.promise = new Promise(function (a, b) {
      def.resolve = a;
      def.reject = b;
    });
    let param = {};

    for (let ext of extensions) {
      param[`HKCU\\SOFTWARE\\Classes\\${ext}`] = {
        'default': {
          value: name,
          type: 'REG_DEFAULT'
        },
        'Content Type': {
          value: type,
          type: 'REG_SZ'
        }
      };
    }

    let kwrun = "%USERPROFILE%\\KwRuntime\\bin\\kwrun-gui.exe";

    if (terminal) {
      kwrun = "%USERPROFILE%\\KwRuntime\\bin\\kwrun.exe";
    }

    let iconpath = kwrun;
    WinReg.putValue({
      [`HKCU\\SOFTWARE\\Classes\\${name}`]: {
        'default': {
          value: description || `Archivo ${type}`,
          type: 'REG_DEFAULT'
        }
      },
      [`HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open\\command`]: {
        'default': {
          value: `"${kwrun}" "%1"`,
          type: 'REG_DEFAULT'
        }
      },
      [`HKCU\\SOFTWARE\\Classes\\${name}\\DefaultIcon`]: {
        'default': {
          value: `"${iconpath}",0`,
          type: 'REG_DEFAULT'
        }
      }
    }, function (err) {
      if (err) def.reject(err);
      def.resolve();
    });
    await def.promise;
  }

  async selfInstallWin32() {
    let kawixFolder = _path.default.join(_os.default.homedir(), "KwRuntime");

    if (!_fs.default.existsSync(kawixFolder)) _fs.default.mkdirSync(kawixFolder);

    let bin = _path.default.join(kawixFolder, "bin");

    if (!_fs.default.existsSync(bin)) _fs.default.mkdirSync(bin);

    let runtimeFolder = _path.default.join(kawixFolder, "runtime");

    if (!_fs.default.existsSync(runtimeFolder)) _fs.default.mkdirSync(runtimeFolder);

    if (process.env.PATH.indexOf(bin) < 0) {
      // setx path
      let child = require("child_process");

      child.execSync(`setx path "${bin};%path%"`);
    }

    let defaultExes = {
      term: _path.default.join(runtimeFolder, "default_executable.dll"),
      gui: _path.default.join(runtimeFolder, "default_gui_executable.dll")
    };
    if (!_fs.default.existsSync(defaultExes.term)) delete defaultExes.term;
    if (!_fs.default.existsSync(defaultExes.gui)) delete defaultExes.gui;

    let writeCmd = function (file, text) {
      _fs.default.writeFileSync(file, text);

      if (defaultExes.term) {
        let nfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + ".exe");

        let cfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + ".exe.config");

        try {
          _fs.default.writeFileSync(nfile, _fs.default.readFileSync(defaultExes.term));

          _fs.default.writeFileSync(cfile, `<configuration>
<startup>
    <supportedRuntime version="v4.0"/>
    <supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
                  `);
        } catch (e) {
          console.error("[WARNING] Failed writing executable wrapper:", nfile);
        }
      }

      if (defaultExes.gui) {
        let nfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + "-gui.exe");

        let cfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + "-gui.exe.config");

        try {
          _fs.default.writeFileSync(nfile, _fs.default.readFileSync(defaultExes.gui));

          _fs.default.writeFileSync(cfile, `<configuration>
<startup>
    <supportedRuntime version="v4.0"/>
    <supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
                  `);
        } catch (e) {
          console.error("[WARNING] Failed writing executable wrapper:", nfile);
        }
      }
    };

    let exe = this.$kawix.executable;
    let nodev = process.version.split(".")[0].substring(1);
    let content = `@echo off\n"${exe.cmd}" "${exe.args.join('" "')}" %*`;

    let binFile = _path.default.join(bin, "kwrun-n" + nodev + ".cmd");

    _fs.default.writeFileSync(binFile, content);

    content = `@echo off\n"${exe.cmd}" --http-parser-legacy "${exe.args.join('" "')}" %*`;
    binFile = _path.default.join(bin, "kwrun-legacy-n" + nodev + ".cmd");

    _fs.default.writeFileSync(binFile, content);

    let files = _fs.default.readdirSync(bin);

    let fileinfo = files.filter(a => a.startsWith("kwrun-") && a.endsWith(".cmd")).map(a => ({
      name: a,
      v: a.split("-").slice(-1)[0].split(".")[0].substring(1)
    }));
    fileinfo.sort((a, b) => Number(a.v) - Number(b.v));

    if (fileinfo.length) {
      let v = fileinfo[fileinfo.length - 1].v;
      writeCmd(_path.default.join(bin, "kwrun.cmd"), _fs.default.readFileSync(_path.default.join(bin, "kwrun-n" + v + ".cmd")));
      writeCmd(_path.default.join(bin, "kwrun-legacy.cmd"), _fs.default.readFileSync(_path.default.join(bin, "kwrun-legacy-n" + v + ".cmd"))); //Fs.writeFileSync(Path.join(bin, "kwrun.cmd"), )
      //Fs.writeFileSync(Path.join(bin, "kwrun-legacy.cmd"), )
    }

    await this.setExtensions("application/kwruntime.script", "Script de Kawix Runtime", [".kwts", ".kwjs"]);
    await this.setExtensions("application/kwruntime.package", "Paquete de Kawix Runtime", [".kwpkg", ".kwap"], false);
    await this.setExtensions("application/kwruntime.package.terminal", "Paquete de Kawix Runtime", [".kwckg", ".kwcpa"]);

    let Child = require("child_process");

    try {
      Child.execSync("ie4uinit.exe -ClearIconCache");
    } catch (e) {}

    try {
      Child.execSync("ie4uinit.exe -show");
    } catch (e) {}
  }

  selfInstallUnix() {
    let kawixFolder = _path.default.join(_os.default.homedir(), "KwRuntime");

    if (process.getuid() == 0) {
      kawixFolder = "/usr/KwRuntime";
      if (!_fs.default.existsSync("/usr/KwRuntime")) _fs.default.mkdirSync("/usr/KwRuntime");

      _fs.default.symlinkSync("/usr/KwRuntime", kawixFolder);

      kawixFolder = "/usr/KwRuntime";
    } else {
      if (!_fs.default.existsSync(kawixFolder)) _fs.default.mkdirSync(kawixFolder);
    }

    let bin = _path.default.join(kawixFolder, "bin");

    if (!_fs.default.existsSync(bin)) _fs.default.mkdirSync(bin); // generate 

    let exe = this.$kawix.executable;
    let nodev = process.version.split(".")[0].substring(1);
    let content = `#!${exe.cmd}\nprocess.argv[1] = ${JSON.stringify(exe.args[0])};require(process.argv[1]);`;

    let binFile = _path.default.join(bin, "kwrun-n" + nodev);

    _fs.default.writeFileSync(binFile, content);

    _fs.default.chmodSync(binFile, "775");
    /*
    if(process.getuid() == 0){
        let binFile1 = "/usr/bin/kwrun"
        Fs.symlinkSync(binFile, binFile1)
    }*/


    content = `#!${exe.cmd} --http-parser-legacy ${exe.args.join(" ")}`;
    binFile = _path.default.join(bin, "kwrun-legacy-n" + nodev);

    _fs.default.writeFileSync(binFile, content);

    _fs.default.chmodSync(binFile, "775");
    /*
    if(process.getuid() == 0){
        binFile = "/usr/bin/kwrun-legacy-n" 
        Fs.writeFileSync(binFile, content)
        Fs.chmodSync(binFile, "775")
    }*/


    let files = _fs.default.readdirSync(bin);

    let fileinfo = files.filter(a => a.startsWith("kwrun-")).map(a => ({
      name: a,
      v: a.split("-").slice(-1)[0].substring(1)
    }));
    fileinfo.sort((a, b) => Number(a.v) - Number(b.v));

    if (fileinfo.length) {
      let v = fileinfo[fileinfo.length - 1].v;

      try {
        _fs.default.unlinkSync(_path.default.join(bin, "kwrun"));
      } catch (e) {}

      try {
        _fs.default.unlinkSync(_path.default.join(bin, "kwrun-legacy"));
      } catch (e) {}

      _fs.default.symlinkSync(_path.default.join(bin, "kwrun-n" + v), _path.default.join(bin, "kwrun"));

      _fs.default.symlinkSync(_path.default.join(bin, "kwrun-legacy-n" + v), _path.default.join(bin, "kwrun-legacy"));
    } // ADD TO PATH


    let pathsToWrite = [];
    pathsToWrite.push(_path.default.join(_os.default.homedir(), ".profile"));
    pathsToWrite.push(_path.default.join(_os.default.homedir(), ".bashrc"));
    pathsToWrite.push(_path.default.join(_os.default.homedir(), ".zshrc"));

    let config = _path.default.join(_os.default.homedir(), ".config");

    if (!_fs.default.existsSync(config)) _fs.default.mkdirSync(config);
    config = _path.default.join(config, "fish");
    if (!_fs.default.existsSync(config)) _fs.default.mkdirSync(config);
    config = _path.default.join(config, "config.fish");
    pathsToWrite.push(config);

    if (process.getuid() == 0) {
      // put global 
      pathsToWrite.push("/etc/profile");
      pathsToWrite.push("/etc/bash.bashrc");
      pathsToWrite.push("/etc/fish/config.fish");
      if (!_fs.default.existsSync("/etc/fish")) _fs.default.mkdirSync("/etc/fish");
    }

    let lines = ["# KWRUNTIME PATH #", `export "PATH=${bin}:$PATH"`];

    for (let i = 0; i < pathsToWrite.length; i++) {
      let path = pathsToWrite[i];

      if (!_fs.default.existsSync(path)) {
        _fs.default.writeFileSync(path, lines.join("\n"));
      } else {
        let content = _fs.default.readFileSync(path, "utf8");

        let lns = content.split("\n");
        let i = lns.indexOf(lines[0]);

        if (i < 0) {
          lns.push(lines[0]);
          lns.push(lines[1]);
        } else {
          lns[i + 1] = lines[1];
        }

        _fs.default.writeFileSync(path, lns.join("\n"));
      }
    }

    console.info("Application added to PATH. Maybe you need restart shell.");
  }

}

exports.Installer = Installer;

class Kawix {
  constructor() {
    _defineProperty(this, "appArguments", []);

    _defineProperty(this, "optionsArguments", []);

    _defineProperty(this, "$importing", new Map());

    _defineProperty(this, "$modCache", new Map());

    _defineProperty(this, "$originals", new Map());

    _defineProperty(this, "$startParams", {});
  }

  get argv() {
    return this.appArguments;
  }

  get version() {
    return "1.1.3";
  }

  get installer() {
    if (!this.$installer) {
      this.$installer = new Installer(this);
    }

    return this.$installer;
  }

  get executable() {
    return {
      cmd: this.originalArgv[0],
      args: [this.originalArgv[1]]
    };
  }

  async main() {
    return 0;
  }

  $getCache(path) {
    let md5 = _crypto.default.createHash('md5').update(path).digest("hex");

    let file = _path.default.posix.join(this.$cacheFolder, md5 + ".json"),
        stat = null,
        data = null;

    try {
      stat = _fs.default.statSync(path);
    } catch (e) {}

    if (!stat) return null;
    if (!_fs.default.existsSync(file)) return;

    let content = _fs.default.readFileSync(file, "utf8");

    data = JSON.parse(content);
    let mtimeMs = Math.ceil(stat.mtimeMs / 1000) * 1000;

    if (data.mtimeMs == mtimeMs) {
      return data;
    }
  }

  $saveCache(path, cache) {
    let md5 = _crypto.default.createHash('md5').update(path).digest("hex");

    let file = _path.default.join(this.$cacheFolder, md5 + ".json");

    _fs.default.writeFileSync(file, JSON.stringify(cache));
  }

  $addOriginalURL(file, url) {
    this.$originals.set(file, url);

    if (this.$originals.size > 100) {
      this.$originals.delete(this.$originals.keys().next().value);
    }
  }

  async $getNetworkContent(url) {
    let uri = new URL(url);

    let id = _crypto.default.createHash("md5").update(url).digest('hex');

    let ext = _path.default.extname(uri.pathname);

    let name = _path.default.basename(uri.pathname);

    if (!ext) name += ".ts";

    let file = _path.default.join(this.$networkContentFolder, id + "-" + name);

    if (_fs.default.existsSync(file)) {
      this.$addOriginalURL(file, url);
      return {
        file
      };
    } // get if exists on $cache Folder


    let vfile = _path.default.posix.join("/virtual/$app-cache/network", id + "-" + name);

    let virtual = KModule.$files.get(vfile);

    if (virtual) {
      _fs.default.writeFileSync(file, virtual.content);

      this.$addOriginalURL(file, url);
      return {
        file,
        virtual: true
      };
    }

    let getContent = async function (url) {
      let def = {},
          redir = '';
      let promise = new Promise(function (a, b) {
        def.resolve = a;
        def.reject = b;
      });
      let items = {
        http: _http.default,
        https: _https.default
      };
      let req = items[url.startsWith("http:") ? "http" : "https"].get(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      }, function (res) {
        if (res.statusCode == 302) {
          redir = res.headers.location;
          return def.resolve();
        }

        if (res.statusCode != 200) {
          def.reject(new Error("Invalid status code from network response: " + String(res.statusCode) + " from " + url));
          return;
        }

        let buffers = [];
        res.on("data", function (bytes) {
          buffers.push(bytes);
        });
        res.on("end", function () {
          def.resolve(Buffer.concat(buffers));
        });
        res.on("error", def.reject);
      });
      req.on("error", def.reject);
      let c = await promise;

      if (redir) {
        return await getContent(redir);
      }

      return c;
    };

    let options = {
      [url]: true
    };
    let extSet = new Set();

    for (let id in KModule.extensionCompilers) {
      extSet.add(id);
    }

    for (let id in _module.default["_extensions"]) {
      extSet.add(id);
    }

    for (let ext of extSet) {
      options[`${uri.protocol}//${uri.host}${uri.pathname}${ext}${uri.search}`] = true;
    }

    let urls = Object.keys(options),
        error = null;

    for (let i = 0; i < urls.length; i++) {
      try {
        //console.log('\x1b[32m[kwruntime] Downloading:\x1b[0m', urls[i])
        let content = await getContent(urls[i]);

        _fs.default.writeFileSync(file, content);

        this.$addOriginalURL(file, urls[i]);
        return {
          file,
          content
        };
      } catch (e) {
        error = e;
      }
    }

    if (error) throw error;
  }

  requireSync(request, parent, originalRequire = null) {
    if (_module.default.builtinModules.indexOf(request) >= 0) {
      return _module.default["_load"](request, parent);
    }

    let resolv = this.importResolve(request, parent, true);
    let cached = this.$getCachedExports(resolv.request);

    if (cached) {
      return cached.data;
    }

    let getExports = () => {
      if (resolv.from == "virtual") {
        let file = resolv.virtual;
        let name = resolv.request;
        let exp = this.$modCache.get(name);
        if (exp) return exp; // module from virtual 

        let mod1 = new _module.default(name, module);
        mod1.filename = name;
        mod1["__kawix__virtual"] = true;
        let source = {
          stat: file.stat,
          content: file.content.toString()
        };

        if (file.transpiled) {
          mod1["requireSync"] = path => this.requireSync(path, mod1);

          let content = `require = module.requireSync;${source.content}`;
          mod1["_compile"](content, name);
          cached = {
            module: mod1,
            mode: 'node',
            exports: mod1.exports,
            executed: true,
            content: source.content,
            result: {
              code: source.content
            },
            filename: name
          };
        } else {
          throw new Error("Not available for require: " + name);
        }

        return mod1.exports;
      }

      if (resolv.from != "node") {
        throw new Error(`${resolv.request} not available to be required in sync mode`);
      }

      global.kawix.disableCompile = true;

      try {
        let exp = null;

        if (originalRequire) {
          exp = originalRequire(resolv.request);
        }

        exp = _module.default["_load"](resolv.request, parent);
        cached = {
          module: _module.default["_cache"][resolv.request],
          mode: 'node',
          exports: exp,
          executed: true,
          filename: resolv.request
        };
        return exp;
      } catch (e) {
        throw e;
      } finally {
        global.kawix.disableCompile = false;
      }
    };

    let exports = getExports();
    if (cached) this.$modCache.set(resolv.request, cached);
    return exports;
  }

  importResolve(request, parent = null, syncMode = false) {
    if (_module.default.builtinModules.indexOf(request) >= 0) {
      return {
        request
      };
    }

    if (!syncMode) {
      if ((request.startsWith("./") || request.startsWith("../") || request.startsWith("/")) && parent !== null && parent !== void 0 && parent.__kawix__network) {
        if (!request.startsWith("/virtual")) {
          let newUri = new URL(request, parent.__kawix__meta.uri);
          let url = `${newUri.protocol}//${newUri.host}${newUri.pathname}${newUri.search}`;
          return {
            from: "network",
            request: url
          };
        }
      }
    }

    let possibles = [];

    if ((request.startsWith("./") || request.startsWith("../")) && parent !== null && parent !== void 0 && parent.__kawix__virtual) {
      request = _path.default.posix.join(_path.default.posix.dirname(parent.filename), request);
    } else if (!_path.default.isAbsolute(request) && parent !== null && parent !== void 0 && parent.__kawix__virtual) {
      let dirname = _path.default.posix.dirname(parent.filename);

      while (dirname && dirname != "/" && dirname != ".") {
        possibles.push(_path.default.posix.join(dirname, "node_modules", request));
        dirname = _path.default.posix.dirname(dirname);
      }

      dirname = _path.default.posix.dirname(parent.filename);

      while (dirname && dirname != "/" && dirname != ".") {
        possibles.push(_path.default.posix.join(dirname, request));
        dirname = _path.default.posix.dirname(dirname);
      }
    }

    if (request.startsWith("/virtual") || possibles.length) {
      // read from virtual
      let file = null,
          name = '';
      possibles.push(request);

      for (let ext in KModule.extensionCompilers) {
        possibles.push(request + ext);
      }

      for (let i = 0; i < possibles.length; i++) {
        name = possibles[i];
        file = KModule.$files.get(name);

        if (file) {
          var _file$stat;

          if ((_file$stat = file.stat) !== null && _file$stat !== void 0 && _file$stat.isdirectory) {
            let f = _path.default.posix.join(name, "package.json");

            let psource = KModule.$files.get(f);

            if (psource) {
              let pjson = JSON.parse(psource.content.toString());
              if (pjson.main) possibles.push(_path.default.posix.join(name, pjson.main));
            }

            possibles.push(name + "/index.js");
            possibles.push(name + "/main.js");
            file = null;
            continue;
          }

          break;
        }
      }

      if (file) {
        return {
          from: "virtual",
          virtual: file,
          request: name
        };
      }
    } else if (request.startsWith("http://") || request.startsWith("https://")) {
      return {
        from: "network",
        request
      };
    } else if (request.startsWith("gh+/") || request.startsWith("github+/") || request.startsWith("github://")) {
      let parts = request.split("/");
      if (request.startsWith("github://")) parts.shift();
      let parts1 = parts[2].split("@");
      let name = parts1[0];
      let version = parts1[1] || "master";
      let url = `https://raw.githubusercontent.com/${parts[1]}/${name}/${version}/${parts.slice(3).join("/")}`;
      return {
        from: "network",
        request: url
      };
    } else if (request.startsWith("gitlab+/") || request.startsWith("gitlab://")) {
      let parts = request.split("/");
      if (request.startsWith("gitlab://")) parts.shift();
      let parts1 = parts[2].split("@");
      let name = parts1[0];
      let version = parts1[1] || "master";
      let url = `https://gitlab.com/${parts[1]}/${name}/-/raw/${version}/${parts.slice(3).join("/")}`;
      return {
        from: "network",
        request: url
      };
    }

    if (request.startsWith("npm://")) {
      return {
        from: "npm",
        request
      };
    }

    request = _module.default["_resolveFilename"](request, parent);
    return {
      from: "node",
      request
    };
  }

  $getCachedExports(request) {
    let info = this.$modCache.get(request);
    if (!info) return;

    if (info.builtin) {
      return {
        data: info.exports
      };
    }

    if (info.mode == "node") {
      if (info.location) {
        return {
          data: require(info.location.main)
        };
      }
    }

    if (info.executed) {
      return {
        data: info.module.exports
      };
    }
  }

  async import(request, parent = null, scope = null) {
    let cache = this.$getCachedExports(request);
    if (cache) return cache.data;
    let info = await this.importInfo(request, parent, scope);

    let getExportsFromInfo = async info => {
      if (info.builtin) {
        return info.exports;
      }

      if (info.mode == "node") {
        if (info.location) {
          return require(info.location.main);
        } else if (!info.executed) {
          // compile 
          info.module["requireSync"] = path => this.requireSync(path, info.module);

          info.module["_compile"](info.result.code, info.filename);
          return info.exports = info.module.exports;
        }
      }

      if (!info.executed) {
        let goodPreloadedModules = [];

        if (info.preloadedModules) {
          for (let i = 0; i < info.preloadedModules.length; i++) {
            let itemInfo = info.preloadedModules[i];
            let exp = await getExportsFromInfo(itemInfo);
            goodPreloadedModules.push(exp);
          }

          let i = info.vars.names.indexOf("preloadedModules");
          info.vars.values[i] = goodPreloadedModules;
        }

        await this.defaultExecute(info, info.module.exports);
        info.executed = true;
        info.exports = info.module.exports;
        return info.exports;
      } else {
        return info.exports || info.module.exports;
      }
    };

    return getExportsFromInfo(info);
  }

  async importInfo(request, parent = null, scope = null) {
    if (_module.default.builtinModules.indexOf(request) >= 0) {
      return {
        builtin: true,
        exports: _module.default["_load"](request, parent)
      };
    }

    if (!scope) {
      scope = new Map();
    }

    let resolv = this.importResolve(request, parent);
    let cached = this.$modCache.get(resolv.request);

    if (cached) {
      return cached;
    }

    let item = scope.get(resolv.request);
    if (item) return item; // ensure not collapsing importing the same file at time

    let importing = this.$importing.get(resolv.request);

    if (importing) {
      let def = new Deferred();
      importing.defs.push(def);
      return await def.promise;
    } else {
      let error = null,
          result = null;
      let importing = {
        defs: [],
        name: resolv.request,
        time: Date.now()
      };

      try {
        this.$importing.set(importing.name, importing);
        result = await this.$importInfo(resolv, parent, scope);
        result.request = resolv.request;
      } catch (e) {
        error = e;
      }

      if (result) {
        this.$modCache.set(resolv.request, result);
      }

      let defs = importing.defs;
      this.$importing.delete(importing.name);

      if (defs.length) {
        setImmediate(() => {
          for (let i = 0; i < defs.length; i++) {
            if (error) defs[i].reject(error);else defs[i].resolve(result);
          }
        });
      }

      if (error) throw error;
      return result;
    }
  }

  async $importInfo(resolv, parent, scope) {
    var _conv;

    let conv = null,
        meta = null;

    if (resolv.virtual) {
      let file = resolv.virtual;
      let name = resolv.request; // module from virtual 

      let mod1 = new _module.default(name, module);
      mod1.filename = name;
      mod1["__kawix__virtual"] = true;
      let source = {
        stat: file.stat,
        content: file.content.toString()
      };

      if (file.transpiled) {
        return {
          module: mod1,
          mode: 'node',
          filename: name,
          vars: {
            names: [],
            values: []
          },
          content: source.content,
          result: {
            code: `require = module.requireSync;${source.content}`
          },
          preloadedModules: []
        };
      } else {
        mod1["_compile"]("exports.__source = " + JSON.stringify(source) + ";exports.__kawix__compile = true; exports.__local__vars = { module, require, __dirname, __filename, global, Buffer }; exports.__filename = " + JSON.stringify(name), name);
        let base = {
          module: mod1,
          executed: false,
          filename: name,
          vars: {
            names: [],
            values: []
          },
          content: source.content,
          result: {
            code: `${source.content}`
          },
          requires: [],
          preloadedModules: []
        };
        scope.set(resolv.request, base);

        try {
          if (mod1.exports.__kawix__compile) {
            let result = await this.defaultCompile(mod1, null, scope);
            Object.assign(base, result);
          } else {
            base.executed = true;
          }

          return base;
        } catch (e) {
          scope.delete(resolv.request);
          throw e;
        }
      }
    } else if (resolv.request.startsWith("http://")) {
      let uri = new URL(resolv.request);
      let url = `${uri.protocol}//${uri.host}${uri.pathname}`;
      meta = {
        url,
        uri
      };
      conv = await this.$getNetworkContent(resolv.request);
    } else if (resolv.request.startsWith("https://")) {
      let uri = new URL(resolv.request);
      let url = `${uri.protocol}//${uri.host}${uri.pathname}`;
      meta = {
        url,
        uri
      };
      conv = await this.$getNetworkContent(resolv.request);
    } else if (resolv.request.startsWith("npm://")) {
      let name = resolv.request.substring(6);
      let mod = await this.import("github://kwruntime/std@1.1.0/package/yarn.ts", null, scope);
      let reg = new mod.Registry();
      let location = await reg.resolve(name); //return await reg.require(name)

      return {
        module: null,
        mode: 'node',
        location
      };
    }

    let filename = ((_conv = conv) === null || _conv === void 0 ? void 0 : _conv.file) || resolv.request;

    try {
      let module = _module.default["_cache"][filename],
          mod = null;

      if (!module) {
        mod = _module.default["_load"](filename, parent);
        module = _module.default["_cache"][filename];
      }

      let base = {
        module,
        filename,
        executed: false,
        vars: {
          names: [],
          values: []
        },
        content: '',
        result: {
          code: ''
        },
        requires: [],
        preloadedModules: []
      };
      scope.set(resolv.request, base);

      if (mod.__kawix__compile) {
        let result = await this.defaultCompile(module, meta, scope);
        Object.assign(base, result);
      } else {
        base.executed = true;
        base.content = _fs.default.readFileSync(filename, 'utf8');
        base.result.code = base.content;
      }

      return base;
    } catch (e) {
      scope.delete(resolv.request);
      throw e;
    }
  }
  /*
  async $import(resolv:any, parent, scope: Map<string, any>){
       let info = await this.$importInfo(resolv, parent, scope)
      let cached = {
          exports: await getExports(),
          time: Date.now()
      }
        
      this.$modCache.set(resolv.request, cached)
      return cached.exports
  }*/


  async compileSource(source, options) {
    let original = this.$originals.get(options.filename);
    console.log('\x1b[32m[kwruntime] Compiling:\x1b[0m', original || options.filename); // COMPILE DEFAULT TYPESCRIPT SOURCE 

    let result = null,
        requires = [],
        nhead = []; // STRIP BOM

    source = source.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm, ""); // IF #!....

    if (source.startsWith("#!")) {
      let i = source.indexOf("\r") || source.indexOf("\n");
      if (i > 0) source = source.substring(i + 1);
      if (source[0] == "\n") source = source.substring(1);
    }

    let b = "//KWCORE--STARTING--LINE\n";
    let fname = options.filename;

    if (!fname.endsWith(".ts")) {
      fname += ".ts"; // for correct transformation
    }

    result = global.Babel.transform(b + source, {
      filename: fname,
      "plugins": Object.values(global.BabelPlugins).concat(options.plugins || []),
      presets: [[global.Babel.availablePresets["env"], {
        "targets": {
          node: 8
        }
      }], global.Babel.availablePresets["typescript"]],
      compact: false
    }); // get imports 

    let aliases = {};
    let head_i = result.code.indexOf(b),
        z = 0;
    if (head_i < 0) head_i = result.code.length;

    if (head_i >= 0) {
      let head = result.code.substring(0, head_i);
      let lines = head.split(/\n/g);

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.indexOf("require(\"") >= 0) {
          let mod = line.match(/require\(\"([^\"]+)\"\)/)[1],
              alias = '';
          let i = mod.indexOf("##");

          if (i > 0) {
            alias = mod.substring(i + 2);
            mod = mod.substring(0, i);
            aliases[alias] = z;
          }

          if (aliases[mod] !== undefined) {
            line = line.replace(/require\(\"([^\"]+)\"\)/, "preloadedModules[" + aliases[mod] + "]");
          } else {
            // module to load 
            requires.push(mod);
            line = line.replace(/require\(\"([^\"]+)\"\)/, "preloadedModules[" + String(z++) + "]");
          }
        }

        nhead.push(line);
      }
    }

    if (requires.length > 0) {
      result.code = nhead.join("\n") + result.code.substring(head_i);
    }

    return {
      content: source,
      result,
      requires
    };
  }

  async defaultExecute(info, exports) {
    let func = Function(info.vars.names.join(","), info.result.code);
    await func.apply(func, info.vars.values);
    delete exports.__kawix__compile;

    if (exports.kawixPreload) {
      await exports.kawixPreload();
    }

    return exports;
  }

  async defaultCompileAndExecute(module, meta, scope = null) {
    let info = await this.defaultCompile(module, meta, scope);
    return await this.defaultExecute(info, module.exports);
  }

  async defaultCompile(module, meta = null, scope = null) {
    let data = module.exports;
    if (!scope) scope = new Map();
    module.__kawix__compiled = true;
    let filename = data.__filename;
    let cache = data.__cache,
        savecache = false;

    if (!filename.startsWith("/virtual")) {
      cache = this.$getCache(filename);
      savecache = true;
    }

    let content = null,
        requires = [],
        nhead = [],
        result = null;

    if (meta !== null && meta !== void 0 && meta.url) {
      module.__kawix__network = true;
      module.__kawix__meta = meta;
      data.__local__vars["__filename"] = `/$NETWORK/${meta.uri.protocol.replace(":", "")}${meta.uri.pathname}`;
      data.__local__vars["__dirname"] = _path.default.normalize(_path.default.join(data.__local__vars["__filename"], ".."));
      data.__local__vars["importMeta"] = {
        meta
      };
    } else {
      data.__local__vars["importMeta"] = {
        meta: {
          url: "file://" + filename
        }
      };
    }

    let kmodule = data.__local__vars["KModule"] = new KModule(module);
    data.__local__vars["asyncRequire"] = kmodule.import.bind(kmodule); //let originalRequire = data.__local__vars["require"]

    data.__local__vars["require"] = request => this.requireSync(request, module);

    let keys = Object.keys(data.__local__vars);
    let values = Object.values(data.__local__vars);
    values.push(data);
    keys.push("exports");

    if (!cache) {
      content = (data.__source || {}).content;

      if (content) {
        if (content.startsWith("// ESBUILD PACKAGE")) {
          // esbuild so ignore babel generation
          module._compile(content, filename);

          return;
        } else {
          let info = await this.compileSource(content, {
            filename
          });
          result = info.result;
          requires = info.requires;
        }
      } else {
        let compiler = null;

        for (let id in KModule.extensionCompilers) {
          if (filename.endsWith(id)) {
            compiler = KModule.extensionCompilers[id];
            break;
          }
        }

        compiler = compiler || KModule.extensionCompilers[".ts"];
        let info = await compiler(filename, module);
        if (!info) return;
        result = info.result;
        requires = info.requires;
      }

      let stat = (data.__source || {}).stat;
      if (!stat) stat = _fs.default.statSync(filename);
      cache = {
        mtimeMs: Math.ceil(stat.mtimeMs / 1000) * 1000,
        content,
        result: {
          code: result.code
        },
        requires,
        time: Date.now()
      }; // save cache

      if (savecache) this.$saveCache(filename, cache);
    } else {
      content = cache.content;
      requires = cache.requires;
      result = cache.result;
    }

    let preloadedModules = [];

    if (requires.length > 0) {
      // resolve first the requires ...
      keys.push("preloadedModules");
      values.push(preloadedModules);

      for (let i = 0; i < requires.length; i++) {
        preloadedModules.push(await this.importInfo(requires[i], module, scope));
      }
    }

    return {
      module,
      filename,
      vars: {
        names: keys,
        values
      },
      content,
      requires,
      result,
      preloadedModules
    };
  }

  $init() {
    this.originalArgv = process.argv;
    this.appArguments = process.argv.slice(2);
    let offset = 0;

    for (let i = 0; i < this.appArguments.length; i++) {
      let arg = this.appArguments[i];

      if (arg.startsWith("--")) {
        let vl = arg.split("=");
        let name = vl[0].substring(2);
        let value = (vl[1] || "").trim();
        this.$startParams[name] = value;
        this.$startParams[name + "_Array"] = this.$startParams[name + "_Array"] || [];
        this.$startParams[name + "_Array"].push(value);
        this.optionsArguments.push(arg);
        offset++;
      } else {
        this.$startParams[".values"] = this.$startParams[".values"] || [];
        this.$startParams[".values"].push(arg);
      }
    }

    if (offset > 0) this.appArguments = this.appArguments.slice(offset);
    this.mainFilename = this.appArguments[0];

    let folder = process.env.RUNTIME_CACHE_FOLDER || _path.default.join(_os.default.homedir(), ".kawi");

    if (!folder.startsWith("/virtual")) {
      if (!_fs.default.existsSync(folder)) _fs.default.mkdirSync(folder);
      this.$mainFolder = folder;
      folder = _path.default.join(folder, "genv2");
      if (!_fs.default.existsSync(folder)) _fs.default.mkdirSync(folder);
      this.$cacheFolder = folder;
      folder = _path.default.join(folder, "network");
      if (!_fs.default.existsSync(folder)) _fs.default.mkdirSync(folder);
      this.$networkContentFolder = folder;
    } else {
      this.$mainFolder = folder;
      this.$cacheFolder = _path.default.posix.join(folder, "genv2");
      this.$networkContentFolder = _path.default.posix.join(folder, "network");
    }
  }

} // register .ts, .js extension


exports.Kawix = Kawix;

async function Typescript(filename, module, options) {
  let content = _fs.default.readFileSync(filename, "utf8"); // strip - bom  & bash env


  content = content.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm, "");

  if (content.startsWith("#!")) {
    let i = content.indexOf("\r");
    if (i < 0) i = content.indexOf("\n");
    if (i > 0) content = content.substring(i + 1);
    if (content[0] == "\n") content = content.substring(1);
  }

  if (content.startsWith("// ESBUILD PACKAGE")) {
    module["_compile"](content, filename);
  } else {
    let info = await global.kawix.compileSource(content, Object.assign({}, options, {
      filename
    }));
    return info;
  }
}

KModule.addExtensionLoader(".ts", {
  compile: Typescript
});
let defaultJs = _module.default["_extensions"][".js"];
KModule.addExtensionLoader(".js", {
  compile: Typescript,
  preload: function (module, filename, defaultPreload) {
    var _module$parent;

    if ((_module$parent = module.parent) !== null && _module$parent !== void 0 && _module$parent["__kawix__compiled"] && !global.kawix.disableCompile) {
      defaultPreload();
    } else {
      defaultJs(module, filename);
    }
  }
});
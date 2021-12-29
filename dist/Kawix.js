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
    if (_os.default.platform() == "linux" || _os.default.platform() == "darwin" || _os.default.platform() == "android") {
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

  install(href, name, options) {
    if (href.endsWith(".kwt")) {}

    let exe = options.executable || "kwrun";

    if (_os.default.platform() == "linux" || _os.default.platform() == "darwin" || _os.default.platform() == "android") {
      let bin = this.getBinFolder();

      let cmd = _path.default.join(bin, exe);

      let out = _path.default.join(bin, name);

      _fs.default.writeFileSync(out, [`#!${cmd}`, `export {default} from ${JSON.stringify(href)}`, `export * from ${JSON.stringify(href)}`].join("\n"));

      _fs.default.chmodSync(out, "775");

      if (options.autostart !== undefined) {
        // start with computer 
        let folderAutoStart = _path.default.join(_os.default.homedir(), ".config", "autostart-scripts");

        if (!_fs.default.existsSync(folderAutoStart)) {
          _fs.default.mkdirSync(folderAutoStart);
        }

        _fs.default.symlinkSync(out, _path.default.join(folderAutoStart, name));
      }

      console.info("Installed!");
    } else if (_os.default.platform() == "win32") {
      let bin = this.getBinFolder();

      let cmd = _path.default.join(bin, exe);

      let out = _path.default.join(bin, name + ".cmd");

      _fs.default.writeFileSync(out, [`@echo off`, `"${cmd}" "${href}" %*`].join("\n"));

      if (options.autostart !== undefined) {// start with computer 
      }

      console.info("Installed!");
    }
  } // install in path


  async selfInstall() {
    if (_os.default.platform() == "linux" || _os.default.platform() == "darwin" || _os.default.platform() == "android") {
      this.selfInstallUnix();
      await this.installKwcore();
    } else if (_os.default.platform() == "win32") {
      return this.selfInstallWin32();
    }
  }

  setExtensions(options) {
    if (_os.default.platform() == "win32") {
      return this.setExtensionsWin32(options.type, options.description, options.extensions, options.terminal, options.appName);
    } else if (_os.default.platform() == "linux") {
      return this.setExtensionsLinux(options);
    }
  }

  $linuxGuiPaths() {
    let paths = {};

    if (process.getuid() == 0) {
      paths.mainIcon = "/usr/share/icons";

      if (!_fs.default.existsSync(paths.mainIcon)) {
        _fs.default.mkdirSync(paths.mainIcon);
      }

      paths.icon = _path.default.join(paths.mainIcon, "hicolor");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.icon = _path.default.join(paths.icon, "scalable");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.icon = _path.default.join(paths.icon, "apps");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.apps = "/usr/share/applications";
      paths.mime = "/usr/share/mime/packages";
      paths.mimeo = "/usr/share/mime";
    } else {
      paths.mainIcon = _path.default.join(_os.default.homedir(), ".local/share/icons");

      if (!_fs.default.existsSync(paths.mainIcon)) {
        _fs.default.mkdirSync(paths.mainIcon);
      }

      paths.icon = _path.default.join(paths.mainIcon, "hicolor");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.icon = _path.default.join(paths.icon, "scalable");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.icon = _path.default.join(paths.icon, "apps");

      if (!_fs.default.existsSync(paths.icon)) {
        _fs.default.mkdirSync(paths.icon);
      }

      paths.apps = _path.default.join(_os.default.homedir(), ".local/share/applications");
      paths.mime = _path.default.join(_os.default.homedir(), ".local/share/mime/packages");
      paths.mimeo = _path.default.join(_os.default.homedir(), ".local/share/mime");
    }

    if (!_fs.default.existsSync(paths.apps)) {
      _fs.default.mkdirSync(paths.apps);
    }

    if (!_fs.default.existsSync(paths.mimeo)) {
      _fs.default.mkdirSync(paths.mimeo);
    }

    if (!_fs.default.existsSync(paths.mime)) {
      _fs.default.mkdirSync(paths.mime);
    }

    return paths;
  }

  async $saveLinuxIcon() {
    let paths = this.$linuxGuiPaths();

    let iconPath = _path.default.join(paths.mainIcon, "kwruntimeapp.svg");

    _fs.default.writeFileSync(iconPath, this.$kawix.svgIcon);

    let er = null;

    try {
      // this works on ubuntu
      await new Promise(function (resolve, reject) {
        let p = require("child_process").spawn("update-icon-caches", [paths.mainIcon]);

        p.on("error", reject);
        p.on("exit", resolve);
      });
    } catch (e) {
      er = e;
    }

    if (er) {
      try {
        // this works on opensuse and maybe others
        await new Promise(function (resolve, reject) {
          let p = require("child_process").spawn("gtk-update-icon-cache", [paths.mainIcon]);

          p.on("error", reject);
          p.on("exit", resolve);
        });
      } catch (e) {}
    }
  }

  $removeMimetypes(prefix) {
    if (prefix) {
      let paths = this.$linuxGuiPaths();

      let files = _fs.default.readdirSync(paths.mime);

      let filep = files.filter(a => a.startsWith(prefix));

      for (let file of filep) {
        try {
          _fs.default.unlinkSync(_path.default.join(paths.mime, file));
        } catch (e) {}
      }
    }
  }

  async $desktopFile(config) {
    let $paths = this.$runtimePaths();
    config.appName = config.appName || "kwrun";
    let appid = config.id || config.appName + "app";

    let kwruntime = _path.default.join($paths.bin, config.appName);

    let desktopContent = `[Desktop Entry]
Terminal=${Boolean(config.terminal)}
NoDisplay=${Boolean(config.nodisplay)}
Icon=kwruntimeapp
Type=Application
Categories=Application;Network;
Exec="${kwruntime}" %F
MimeType=${config.types.join(";")};
Name=${config.title}
Comment= `;
    let paths = this.$linuxGuiPaths();

    if (!_fs.default.existsSync(paths.apps)) {
      console.info("> Warning: Detected server installation. Omiting desktop files");
    } else {
      _fs.default.writeFileSync(_path.default.join(paths.apps, appid + ".desktop"), desktopContent);
      /*desktopContent = desktopContent.replace("Terminal=false", "Terminal=true")
      //desktopContent = desktopContent.replace("NoDisplay=true", "")
      Fs.writeFileSync(Path.join(paths.apps, appid + "-terminal.desktop"), desktopContent)*/


      try {
        // this works on ubuntu
        await new Promise(function (resolve, reject) {
          let p = require("child_process").spawn("update-desktop-database", [paths.apps]);

          p.on("error", reject);
          p.on("exit", resolve);
        });
      } catch (e) {}
    }
  }

  async setExtensionsLinux(config) {
    try {
      await this.$saveLinuxIcon();
    } catch (e) {
      console.info("Warning: Failed installing icon");
    }

    let $paths = this.$runtimePaths();
    config.appName = config.appName || "kwrun";
    let appid = config.id || config.appName + "app";

    let kwruntime = _path.default.join($paths.bin, config.appName);

    let paths = this.$linuxGuiPaths();
    let scon = ['<?xml version="1.0" encoding="UTF-8"?>', '<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">'];
    scon.push(`<mime-type type="${config.type}">`);
    scon.push(`<comment xml:lang="en">${config.description}</comment>`);

    for (let ext of config.extensions) {
      scon.push(`<glob pattern="*${ext}" />`);
    }

    scon.push(`<icon name="kwruntimeapp"/>`);
    scon.push("</mime-type>");
    scon.push("</mime-info>");

    if (!_fs.default.existsSync(paths.mime)) {
      console.info("> Warning: Detected server installation. Omiting mime files");
    } else {
      _fs.default.writeFileSync(_path.default.join(paths.mime, appid + "_mimes_" + config.type.replace("/", "") + ".xml"), scon.join("\n"));

      try {
        // this works on ubuntu
        await new Promise(function (resolve, reject) {
          let p = require("child_process").spawn("update-mime-database", [paths.mimeo]);

          p.on("error", reject);
          p.on("exit", resolve);
        });
      } catch (e) {}
    }
  }

  async setExtensionsWin32(type, description, extensions, terminal = true, appName = "") {
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

    let kwrun = '';

    if (appName) {
      kwrun = "%USERPROFILE%\\KwRuntime\\bin\\" + appName + ".exe";
    } else {
      if (terminal) {
        kwrun = "%USERPROFILE%\\KwRuntime\\bin\\kwrun.exe";
      } else {
        kwrun = "%USERPROFILE%\\KwRuntime\\bin\\kwrun-gui.exe";
      }
    }

    let iconpath = kwrun;
    WinReg.putValue(Object.assign(param, {
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
    }), function (err) {
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

    await this.setExtensions({
      type: "application/kwruntime.script",
      description: "Script de Kawix Runtime",
      extensions: [".kws", ".kw.ts"],
      terminal: true
    });
    await this.setExtensions({
      type: "application/kwruntime.app",
      description: "Aplicación de Kawix Runtime",
      extensions: [".kwr"],
      terminal: false
    });
    await this.setExtensions({
      type: "application/kwruntime.package",
      description: "Paquete de Kawix Runtime",
      extensions: [".kwt"],
      terminal: false
    });

    let Child = require("child_process");

    try {
      Child.execSync("ie4uinit.exe -ClearIconCache");
    } catch (e) {}

    try {
      Child.execSync("ie4uinit.exe -show");
    } catch (e) {}
  }

  installKwcore() {
    if (_os.default.platform() == "win32") {
      return this.installKwcoreWin32();
    } else {
      return this.installKwcoreUnix();
    }
  }

  $runtimePaths() {
    let kawixFolder = _path.default.join(_os.default.homedir(), "KwRuntime");

    if (!_fs.default.existsSync(kawixFolder)) _fs.default.mkdirSync(kawixFolder);

    let bin = _path.default.join(kawixFolder, "bin");

    if (!_fs.default.existsSync(bin)) _fs.default.mkdirSync(bin);

    let runtimeFolder = _path.default.join(kawixFolder, "runtime");

    if (!_fs.default.existsSync(runtimeFolder)) _fs.default.mkdirSync(runtimeFolder);
    return {
      runtime: runtimeFolder,
      bin,
      folder: kawixFolder
    };
  }

  async installKwcoreWin32() {
    let $paths = this.$runtimePaths();
    let kawixFolder = $paths.folder;
    let bin = $paths.bin;
    let runtimeFolder = $paths.runtime;

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
        let nfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + "w.exe");

        let cfile = _path.default.join(_path.default.dirname(file), _path.default.basename(file, _path.default.extname(file)) + "w.exe.config");

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

    let binFile = _path.default.join(bin, "kwcore-n" + nodev + ".cmd");

    _fs.default.writeFileSync(binFile, content);

    content = `@echo off\n"${exe.cmd}" --http-parser-legacy "${exe.args.join('" "')}" %*`;
    binFile = _path.default.join(bin, "kwcore-legacy-n" + nodev + ".cmd");

    _fs.default.writeFileSync(binFile, content);

    let files = _fs.default.readdirSync(bin);

    let fileinfo = files.filter(a => a.startsWith("kwcore-") && a.endsWith(".cmd")).map(a => ({
      name: a,
      v: a.split("-").slice(-1)[0].split(".")[0].substring(1)
    }));
    fileinfo.sort((a, b) => Number(a.v) - Number(b.v));

    if (fileinfo.length) {
      let v = fileinfo[fileinfo.length - 1].v;
      writeCmd(_path.default.join(bin, "kwcore.cmd"), _fs.default.readFileSync(_path.default.join(bin, "kwcore-n" + v + ".cmd")));
      writeCmd(_path.default.join(bin, "kwcore-legacy.cmd"), _fs.default.readFileSync(_path.default.join(bin, "kwcore-legacy-n" + v + ".cmd"))); //Fs.writeFileSync(Path.join(bin, "kwrun.cmd"), )
      //Fs.writeFileSync(Path.join(bin, "kwrun-legacy.cmd"), )
    }

    await this.setExtensions({
      type: "application/kwcore.script",
      description: "Script de KawixCore",
      extensions: [".kwo", ".kwe"],
      terminal: true,
      appName: "kwcore"
    });
    await this.setExtensions({
      type: "application/kwcore.app",
      description: "Aplicación de KawixCore",
      extensions: [".kwa"],
      terminal: false,
      appName: "kwcorew"
    });

    let Child = require("child_process");

    try {
      Child.execSync("ie4uinit.exe -ClearIconCache");
    } catch (e) {}

    try {
      Child.execSync("ie4uinit.exe -show");
    } catch (e) {}
  }

  async installKwcoreUnix() {
    let kawixFolder = _path.default.join(_os.default.homedir(), "KwRuntime");

    if (process.getuid() == 0) {
      if (!_fs.default.existsSync("/usr/KwRuntime")) _fs.default.mkdirSync("/usr/KwRuntime");

      _fs.default.symlinkSync("/usr/KwRuntime", kawixFolder);

      kawixFolder = "/usr/KwRuntime";
    } else {
      if (!_fs.default.existsSync(kawixFolder)) _fs.default.mkdirSync(kawixFolder);
    }

    let bin = _path.default.join(kawixFolder, "bin");

    let src = _path.default.join(kawixFolder, "src");

    if (!_fs.default.existsSync(bin)) _fs.default.mkdirSync(bin);
    if (!_fs.default.existsSync(src)) _fs.default.mkdirSync(src);

    let kwcoreFolder = _path.default.join(_os.default.homedir(), "Kawix"); // download kwcore 


    let exe = this.$kawix.executable;
    let nodev = process.version.split(".")[0].substring(1);
    let content, binFile;

    let kwcoreFile = _path.default.join(src, "kwcore.app.js");

    let kwcoreCli = _path.default.join(kwcoreFolder, "core", "bin", "cli"); // download file 


    let uri = "https://raw.githubusercontent.com/kodhework/kawix/master/core/dist/kwcore.app.js";
    await new Promise(function (resolve, reject) {
      _https.default.get(uri, res => {
        try {
          let buffer = [];
          res.on("data", function (bytes) {
            buffer.push(bytes);
          });
          res.on("end", function () {
            try {
              let data = Buffer.concat(buffer);

              _fs.default.writeFileSync(kwcoreFile, data);

              resolve(null);
            } catch (e) {
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      }).on("error", reject);
    });

    let p = require("child_process").spawn(exe.cmd, [kwcoreFile]);

    await new Promise(function (resolve, reject) {
      p.on("exit", resolve);
      p.on("error", reject);
    });
    content = `#!/usr/bin/env bash\n${exe.cmd} "${kwcoreCli}" "$@"\nexit $?`;
    binFile = _path.default.join(bin, "kwcore-n" + nodev);

    _fs.default.writeFileSync(binFile, content);

    _fs.default.chmodSync(binFile, "775");

    content = `#!/usr/bin/env bash\n${exe.cmd} --http-parser-legacy "${kwcoreCli}" "$@"\nexit $?`;
    binFile = _path.default.join(bin, "kwcore-legacy-n" + nodev);

    _fs.default.writeFileSync(binFile, content);

    _fs.default.chmodSync(binFile, "775");

    let files = _fs.default.readdirSync(bin);

    let fileinfo = files.filter(a => a.startsWith("kwcore-")).map(a => ({
      name: a,
      v: a.split("-").slice(-1)[0].substring(1)
    }));
    fileinfo.sort((a, b) => Number(a.v) - Number(b.v));

    if (fileinfo.length) {
      let v = fileinfo[fileinfo.length - 1].v;

      try {
        _fs.default.unlinkSync(_path.default.join(bin, "kwcore"));
      } catch (e) {}

      try {
        _fs.default.unlinkSync(_path.default.join(bin, "kwcore-legacy"));
      } catch (e) {}

      _fs.default.symlinkSync(_path.default.join(bin, "kwcore-n" + v), _path.default.join(bin, "kwcore"));

      _fs.default.symlinkSync(_path.default.join(bin, "kwcore-legacy-n" + v), _path.default.join(bin, "kwcore-legacy"));
    }

    this.$addPathUnix(bin);
    await this.$desktopFile({
      appName: "kwcore",
      id: "kawixcoreapp-terminal",
      terminal: true,
      title: 'Kawix Core',
      types: ["application/kwcore.script"],
      nodisplay: true
    });
    await this.$desktopFile({
      appName: "kwcore",
      id: "kawixcoreapp",
      terminal: false,
      title: 'Kawix Core',
      types: ["application/kwcore.app"],
      nodisplay: true
    });
    await this.$removeMimetypes("kwcoreapp_");
    await this.setExtensions({
      appName: "kwcore",
      type: "application/kwcore.script",
      description: "Script de KawixCore",
      extensions: [".kwo", ".kwe"],
      terminal: true
    });
    await this.setExtensions({
      appName: "kwcore",
      type: "application/kwcore.app",
      description: "Aplicación de KawixCore",
      extensions: [".kwa"],
      terminal: false
    });
  }

  $addPathUnix(folder) {
    // ADD TO PATH
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

    let lines = ["# KWRUNTIME PATH #", `export "PATH=${folder}:$PATH"`];

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
  }

  async selfInstallUnix() {
    let kawixFolder = _path.default.join(_os.default.homedir(), "KwRuntime");

    if (process.getuid() == 0) {
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
    let content, binFile;
    content = `#!/usr/bin/env bash\n${exe.cmd} ${exe.args.join(" ")} "$@"\nexit $?`;
    binFile = _path.default.join(bin, "kwrun-n" + nodev);

    _fs.default.writeFileSync(binFile, content);

    _fs.default.chmodSync(binFile, "775");
    /*
    let content = `#!${exe.cmd}\nprocess.argv[1] = ${JSON.stringify(exe.args[0])};require(process.argv[1]);`
    let binFile = Path.join(bin, "kwrun-n" + nodev)
    Fs.writeFileSync(binFile, content)
    Fs.chmodSync(binFile, "775")
    */

    /*
    if(process.getuid() == 0){
        let binFile1 = "/usr/bin/kwrun"
        Fs.symlinkSync(binFile, binFile1)
    }*/


    content = `#!/usr/bin/env bash\n${exe.cmd} --http-parser-legacy ${exe.args.join(" ")} "$@"\nexit $?`;
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
    }

    this.$addPathUnix(bin);
    await this.$desktopFile({
      appName: "kwrun",
      id: "kwruntimeapp-terminal",
      title: 'Kawix Runtime',
      terminal: true,
      types: ["application/kwruntime.script"],
      nodisplay: true
    });
    await this.$desktopFile({
      appName: "kwrun",
      id: "kwruntimeapp",
      terminal: false,
      title: 'Kawix Runtime',
      types: ["application/kwruntime.app", "application/kwruntime.package"],
      nodisplay: true
    });
    await this.$removeMimetypes("kwrunapp_");
    await this.setExtensions({
      type: "application/kwruntime.script",
      description: "Script de Kawix Runtime",
      extensions: [".kws", ".kw.ts"],
      terminal: true
    });
    await this.setExtensions({
      type: "application/kwruntime.app",
      description: "Aplicación de Kawix Runtime",
      extensions: [".kwr"],
      terminal: false
    });
    await this.setExtensions({
      type: "application/kwruntime.package",
      description: "Paquete de Kawix Runtime",
      extensions: [".kwt"],
      terminal: false
    });
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

  get svgIcon() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           width="135.08963mm"
           height="135.21298mm"
           viewBox="0 0 135.08963 135.21298"
           version="1.1"
           id="svg5"
           inkscape:version="1.1.1 (3bf5ae0d25, 2021-09-20)"
           sodipodi:docname="dibujo1.svg"
           xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
           xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg">
          <sodipodi:namedview
             id="namedview7"
             pagecolor="#ffffff"
             bordercolor="#666666"
             borderopacity="1.0"
             inkscape:pageshadow="2"
             inkscape:pageopacity="0"
             inkscape:pagecheckerboard="0"
             inkscape:document-units="mm"
             showgrid="false"
             inkscape:zoom="1.5219183"
             inkscape:cx="366.97107"
             inkscape:cy="230.95852"
             inkscape:window-width="1920"
             inkscape:window-height="984"
             inkscape:window-x="0"
             inkscape:window-y="24"
             inkscape:window-maximized="1"
             inkscape:current-layer="layer1"
             objecttolerance="10000"
             guidetolerance="10000"
             fit-margin-top="0"
             fit-margin-left="0"
             fit-margin-right="0"
             fit-margin-bottom="0" />
          <defs
             id="defs2" />
          <g
             inkscape:label="Capa 1"
             inkscape:groupmode="layer"
             id="layer1"
             transform="translate(-10.895871,-22.224895)">
            <path
               style="fill:#f6f5d4;stroke-width:0.264583"
               d="m 76.399094,103.81675 c -4.08651,-0.62626 -7.5722,-2.85581 -9.91237,-6.340242 -2.342689,-3.488172 -2.871165,-8.6302 -1.31199,-12.765532 0.76278,-2.023099 1.55675,-3.225551 3.28509,-4.975209 2.6524,-2.685105 6.01676,-4.056922 9.949545,-4.056922 4.05776,0 7.3397,1.386195 10.13353,4.280096 2.80249,2.902873 4.00664,5.928222 3.96327,9.957461 -0.0315,2.924495 -0.70615,5.232378 -2.17129,7.427417 -1.28578,1.926322 -1.68323,2.372892 -3.19426,3.589041 -2.86293,2.30422 -7.1004,3.4419 -10.741525,2.88389 z"
               id="path4508" />
            <path
               id="path4506"
               style="fill:#e1e1e1;stroke-width:0.999999"
               transform="scale(0.26458333)"
               d="m 296.35156,85.279297 v 20.531253 20.53125 h 8.28906 c 2.37435,0 4.77294,0.0679 7.1875,0.18554 0.0353,-0.006 0.0737,-0.01 0.11524,-0.01 0.014,0 0.007,-1e-5 0.0215,0 0.029,-1e-5 0.0568,-1e-5 0.0859,0 0.0434,3e-5 0.0876,-0.002 0.13086,-0.002 0.0392,1e-5 0.078,-6.8e-4 0.11719,0.002 0.0468,-0.003 0.0939,-0.002 0.14062,0.002 -0.0117,0.002 -0.0153,0.003 -0.0195,0.004 0.0387,-0.002 0.22263,-0.0159 0.26563,0.0312 0.0101,-5e-5 0.0219,5e-5 0.0273,0 0.059,-2.9e-4 0.11906,-5.8e-4 0.17773,0.002 0.0735,-0.005 0.14825,-0.0101 0.22071,0.0137 0.0219,0.0233 0.15787,-0.0122 0.20508,0.0215 -0.0758,0.0117 0.11693,-0.001 0.13281,0.006 0.0449,-0.005 0.19135,-0.0185 0.22461,0.0137 0.002,0.002 10e-4,0.003 -0.004,0.004 0.0518,-9.4e-4 0.10473,-0.002 0.15625,0.004 0.008,6.5e-4 0.0291,-0.004 0.0234,0.002 -0.005,0.005 -0.0172,0.01 -0.0273,0.0117 0.0454,-0.005 0.0912,-0.0157 0.13671,-0.0195 0.0676,-0.006 0.13716,0.0271 0.20508,0.0234 0.0874,-7.6e-4 0.17434,0.002 0.26172,0.004 0.01,0 0.0312,-0.0102 0.0312,0 10e-4,0.0202 10e-4,0.0438 -0.004,0.0684 0.0182,0.001 0.0365,0.003 0.0547,0.004 0.0116,-0.0303 0.0282,-0.0532 0.0508,-0.0645 8e-4,-0.007 -2.1e-4,-0.0146 0.002,-0.0215 0.0164,0.003 0.0326,0.008 0.0488,0.01 0.0663,0.008 0.13273,0.0147 0.19921,0.0215 0.0949,0.009 0.19018,0.0187 0.28516,0.0274 0.11806,0.0107 0.20785,0.0455 0.27148,0.0918 2.27919,0.16287 4.57463,0.37784 6.88086,0.64063 0.003,-10e-4 0.006,1e-4 0.01,-0.002 0.0141,-0.003 0.032,-0.001 0.0547,0.008 7.1e-4,8e-5 -10e-5,0.0117 0.002,0.0117 0.51259,0.0586 1.03116,0.14355 1.54492,0.20703 0.0136,0 0.0273,-1e-5 0.041,0 0.0285,-1e-5 0.0576,-4.6e-4 0.0859,0 0.0422,6.1e-4 0.07,-0.009 0.11914,-0.0117 0.008,0.003 0.0155,0.009 0.0234,0.0117 -0.0172,-8.2e-4 -0.0345,0.007 -0.0508,0.0117 -0.004,0.001 -0.015,0.006 -0.0254,0.0117 0.0286,0.004 0.0574,0.008 0.0859,0.0117 0.0126,-0.006 0.0194,-0.007 0.0332,-0.0137 -0.013,-0.005 -0.026,-0.0105 -0.0391,-0.0156 0.0159,0.001 0.0312,0.01 0.0469,0.0117 0.002,1.5e-4 0.004,1e-4 0.006,0 -0.005,0.003 -0.009,0.009 -0.0137,0.0117 0.0288,0.0115 0.058,0.0226 0.0879,0.0312 0.008,9.8e-4 0.0157,5e-5 0.0234,0.002 -0.0131,-0.0103 -0.0621,-0.0336 -0.0918,-0.041 0.01,-0.005 0.0186,-0.008 0.0293,-0.0137 0.048,0.0128 0.0914,0.0335 0.13477,0.0547 h 0.0527 0.27148 c 0.14964,0 0.25772,0.0419 0.32618,0.10156 0.0223,0.002 0.0442,0.008 0.0644,0.0117 10e-4,1.6e-4 0.003,-1.7e-4 0.004,0 1.46626,0.19177 2.95227,0.48638 4.43164,0.74609 0.016,-0.0114 0.0343,-0.0171 0.0527,-0.0176 0.0258,-6.8e-4 0.0534,0.0124 0.082,0.0391 0.13764,0.0243 0.27442,0.0458 0.41211,0.0703 0.0737,-0.007 0.13966,-0.0133 0.16602,-0.006 0.0338,0.0114 0.0654,0.0319 0.0977,0.0488 h 0.002 c 0.0202,0.004 0.0403,0.008 0.0605,0.0117 -0.0294,-0.0146 -0.0634,-0.0308 -0.0801,-0.043 -0.006,-0.004 0.0127,-1.7e-4 0.0195,-0.002 0.0821,-0.011 0.16392,-0.004 0.24609,-0.004 0.0993,-0.009 0.19391,0.003 0.28711,0.0391 0.0254,0.0142 0.0869,0.0532 0.0977,0.0625 -0.0393,-0.0136 -0.0732,-0.0418 -0.11329,-0.0527 -0.0665,-0.0181 -0.11891,0.0119 -0.17382,0.041 0.076,0.009 0.15241,0.0132 0.22851,0.0215 0.0146,-7.4e-4 0.0294,-4.5e-4 0.0488,0 0.0208,4.9e-4 0.0412,0.008 0.0605,0.0156 -0.0363,-0.006 -0.0727,-0.0117 -0.10938,-0.0156 -0.0284,10e-4 -0.0487,0.005 -0.0664,0.0117 0.92945,0.16805 1.85189,0.30154 2.78125,0.46875 0.0628,-0.002 0.11771,0.009 0.1621,0.0273 h 0.002 c 0.33181,0.06 0.66684,0.14235 1,0.21289 0.11326,0.009 0.22488,0.0291 0.33594,0.0547 0.10136,0.0265 0.20311,0.0619 0.30664,0.0781 0.0754,0.009 0.13987,0.0184 0.21289,0.043 0.008,0.003 0.0246,0.009 0.0215,0.0117 h 0.002 c 0.004,9e-4 0.008,0.003 0.0117,0.004 0.0227,-0.003 0.046,-0.006 0.0684,-0.006 0.0293,-4.3e-4 0.10731,0.0283 0.16016,0.0547 0.045,0.0101 0.0897,0.0191 0.13476,0.0293 0.0221,-8.9e-4 0.0426,-0.007 0.0762,-0.008 0.0552,0.0133 0.098,0.0256 0.14453,0.0469 0.0108,-5.9e-4 0.0224,-0.002 0.0332,-0.002 0.007,2.3e-4 0.0376,0.014 0.0664,0.0273 0.0163,0.004 0.0326,0.008 0.0488,0.0117 0.005,-5e-4 0.01,-2.6e-4 0.0156,-0.002 0.0343,-0.004 0.071,0.004 0.10547,0.0137 0.0613,-0.0259 0.1065,-0.0395 0.0488,0.006 0.0352,0.004 0.23163,0.0429 0.27343,0.0781 v 0.002 c 0.0521,0.0114 0.10415,0.0219 0.15625,0.0332 0.001,2.7e-4 0.003,-2.7e-4 0.004,0 0.051,-0.001 0.10483,8.3e-4 0.10938,0.0215 0.006,0.002 0.0116,0.004 0.0176,0.006 0.17713,0.0381 0.35439,0.0775 0.53125,0.11328 0.1001,9.9e-4 0.18144,0.0209 0.24414,0.0527 30.59951,6.23195 62.21383,20.30796 88.9336,40.52539 1.18988,0.90031 2.53306,1.98722 3.98242,3.21094 0.0841,-0.0198 0.13319,-0.0483 0.11914,-0.0937 0.14634,0.15156 0.29541,0.29789 0.45508,0.43555 0.10998,0.13348 0.23634,0.30836 0.31836,0.43554 0.004,0.003 0.006,0.009 0.01,0.0117 0.10596,0.0908 0.22312,0.19692 0.33008,0.28907 0.0216,0.0124 0.0838,0.0533 0.28711,0.20117 0.12643,0.12656 0.2522,0.25431 0.37891,0.38086 0.37999,0.33062 0.76157,0.6624 1.15234,1.00781 0.003,0.002 0.005,0.009 0.006,0.0117 l 0.002,0.002 c 0.1511,0.13357 0.33195,0.32151 0.48438,0.45703 l 0.002,0.002 c 0.0346,0.0273 0.0683,0.0552 0.0996,0.0859 h 0.004 c 0.0239,0.0235 0.0439,0.0467 0.0625,0.0703 l 0.002,0.002 c 1.82514,1.62591 3.8468,3.64584 5.79492,5.48047 0.0229,-0.008 0.0478,-0.0128 0.0742,-0.0137 0.0919,-0.003 0.20367,0.0379 0.31641,0.14453 0.21857,0.20661 0.47584,0.37316 0.64062,0.48828 0.0491,0.0837 0.1225,0.14098 0.19922,0.21484 0.0113,0.011 0.0238,0.0238 0.0352,0.0332 0.0117,0.01 0.0298,0.0101 0.0449,0.0195 0.0752,0.0508 0.12526,0.0968 0.17969,0.16797 0.0144,0.0283 0.0115,0.0131 0.0742,0.0703 0.0431,0.0428 0.0858,0.0863 0.1289,0.1289 0.0419,0.0418 0.0831,0.083 0.125,0.125 0.0401,0.04 0.0791,0.0811 0.11914,0.1211 0.0457,0.0459 0.0929,0.0908 0.13867,0.13672 0.0378,0.038 0.0751,0.0753 0.11329,0.11328 0.0291,0.0321 0.0616,0.065 0.0918,0.082 0.11528,0.0724 0.21877,0.15711 0.3125,0.25586 0.0612,0.0737 0.0473,0.0525 0.1543,0.1582 0.0522,0.0556 0.10636,0.10567 0.16797,0.15039 0.0722,0.0565 0.1303,0.12852 0.19531,0.19336 0.005,0.005 0.0207,0.0234 0.0352,0.043 0.0261,0.0114 0.0515,0.023 0.0762,0.0371 0.028,0.016 0.0476,0.0445 0.0703,0.0664 0.0427,0.0424 0.074,0.0844 0.0937,0.13281 0.0104,0.009 0.0221,0.0228 0.0391,0.0391 0.11755,0.103 0.21921,0.22211 0.31446,0.3457 0.0722,0.0773 0.16149,0.13775 0.23633,0.21485 0.071,0.08 0.14864,0.15318 0.2246,0.22851 0.0745,0.0741 0.14858,0.15041 0.22266,0.22461 0.0854,0.0852 0.17044,0.16865 0.25586,0.25391 0.0949,0.0839 0.19249,0.16361 0.2832,0.25976 0.0484,0.0588 0.0253,0.0292 0.15039,0.1543 0.09,0.0902 0.17972,0.17961 0.26953,0.26953 0.12208,0.12223 0.24511,0.24496 0.36719,0.36719 0.0987,0.0923 0.17737,0.202 0.25977,0.30859 0.0745,0.0893 0.15324,0.17652 0.23828,0.25586 0.0995,0.0927 0.15085,0.18706 0.16602,0.27149 4.42412,4.38713 8.69876,8.83226 12.18945,12.75195 0.12213,0.0819 0.21895,0.20195 0.35742,0.41797 0.18503,0.2092 0.32797,0.38442 0.50781,0.58984 0.004,0.004 0.007,0.008 0.0117,0.0117 0.0144,0.0163 0.0358,0.0434 0.0566,0.0703 0.006,0.008 0.0109,0.0127 0.0176,0.0215 0.0688,0.0787 0.12734,0.14847 0.19531,0.22656 l 0.004,0.004 c 0.0646,0.0644 0.13024,0.12753 0.19336,0.19336 0.0854,0.0919 0.12168,0.12795 0.23242,0.2207 0.15345,0.16387 0.0749,0.0703 0.24609,0.3125 0.0255,0.0253 0.0327,0.0298 0.0352,0.0293 0.002,0.003 0.0172,0.0311 0.0762,0.13086 0.009,0.008 0.008,0.012 0.0195,0.0234 0.004,0.008 0.0134,0.0217 0.0195,0.0312 -0.003,-0.002 -0.007,-0.004 -0.01,-0.006 0.009,0.0109 0.0181,0.0224 0.0273,0.0332 -0.005,-0.008 -0.009,-0.0166 -0.0137,-0.0234 0.005,0.003 0.009,0.005 0.0137,0.008 0.003,0.005 0.0264,0.0251 0.0195,0.0215 -0.007,-0.004 -0.0129,-0.008 -0.0195,-0.0117 0.0153,0.0171 0.0203,0.0264 0.0352,0.0586 7.8e-4,0.002 -3e-4,0.002 0.002,0.004 0.002,9.9e-4 0.002,0.003 0.004,0.004 0.11755,0.0942 0.20536,0.17037 0.25976,0.23438 l 0.01,-0.004 c 0.0174,-0.0182 0.0358,0.0375 0.0547,0.0566 0.24087,0.26202 0.73194,0.80798 0.91601,1.01172 h -0.006 c 0.17382,0.1926 0.29054,0.38174 0.35938,0.56055 0.30513,0.37402 0.77048,0.86926 1.04687,1.2207 1.13868,1.44782 2.16671,2.98273 3.26758,4.46094 0.11916,0.10533 0.23664,0.24019 0.3457,0.41016 0.0204,0.0317 0.055,0.0577 0.0625,0.0937 -0.0494,-0.0362 -0.0639,-0.0468 -0.0801,-0.0586 0.0538,0.0418 0.13799,0.1105 0.16797,0.14258 0.0684,0.0734 0.12633,0.15601 0.17773,0.24219 0.0253,0.0421 0.0836,0.1337 0.10351,0.18164 0.0652,0.089 0.12349,0.18083 0.16797,0.27734 0.0449,0.0612 0.09,0.12231 0.13477,0.1836 l 0.006,0.002 c 0.026,0.0185 0.0558,0.0353 0.0586,0.0644 6.1e-4,0.005 -0.006,0.005 -0.0117,0.004 0.011,0.015 0.0222,0.0299 0.0332,0.0449 0.13328,0.0841 0.28976,0.147 0.37304,0.29102 0.0116,0.0156 0.2815,0.35376 0.5293,0.75195 0.033,0.0375 0.0646,0.0759 0.0977,0.11328 0.19828,0.22286 0.39968,0.44277 0.59961,0.66406 0.31117,0.34423 0.43845,0.67976 0.4375,0.95899 17.82634,25.25962 30.23829,54.47701 35.90625,84.60742 0.0333,0.1014 0.0654,0.20364 0.0937,0.30664 0.0342,0.12453 0.0365,0.22897 0.0117,0.30859 0.24723,1.33653 0.42438,2.68091 0.6543,4.01953 3.1e-4,0.001 0.002,0.003 0.002,0.004 0.005,0.0229 0.0112,0.0458 0.0195,0.0684 0.0334,0.12366 0.0607,0.24202 0.0508,0.36523 2.2e-4,10e-4 -2.1e-4,0.003 0,0.004 l 0.002,0.002 c 0.0404,0.13452 0.0421,0.10557 0.041,0.16797 -2.5e-4,0.0271 2.8e-4,0.0547 0,0.082 0.0155,0.0918 0.0277,0.18363 0.043,0.2754 0.004,0.0214 0.008,0.043 0.0117,0.0645 7.1e-4,0.002 0.0107,0.01 0.0117,0.0117 0.0788,0.25021 0.1034,0.3606 0.17383,0.63086 h 0.01 c 0.0392,0.15012 0.0246,0.26989 -0.0195,0.35156 0.24973,1.54392 0.55181,3.08241 0.75391,4.63086 0.0164,0.12578 0.0251,0.2883 0.0371,0.43359 0.004,0.0182 0.006,0.036 0.01,0.0859 0.006,0.0145 0.003,0.0278 0,0.041 v 0.002 c 0.0297,0.39388 0.0571,0.80016 0.0976,1.14844 0.001,0.004 4.6e-4,0.008 0.002,0.0117 0.0862,0.26121 0.0325,0.0589 0.0586,0.26954 0,0.007 0.0102,0.0104 0.0117,0.0176 0.0196,0.10022 0.0145,0.0801 0.0176,0.16602 -0.01,0.081 -0.01,0.16288 -0.008,0.24414 6.6e-4,0.0267 0.002,0.0534 0.002,0.0801 0.005,0.0172 0.0101,0.0387 0.0176,0.0703 0.0135,0.0484 0.009,0.0984 0,0.14648 0.006,-0.023 0.004,0.0587 0.004,0.0742 -1.4e-4,0.0434 -1.8e-4,0.0874 0,0.13086 v 0.0254 c 1.52999,14.2225 1.53938,35.18967 0.0781,49.1543 0.0285,0.0681 0.0435,0.15514 0.0351,0.26172 -0.008,0.0904 -0.0139,0.17912 -0.0215,0.26953 -0.003,0.0419 -0.008,0.085 -0.0117,0.12695 h -0.002 v 0.008 l 0.002,0.002 c 7.7e-4,0.005 -3e-4,0.0154 0,0.0117 -0.002,0.0404 -0.0351,0.1245 -0.0586,0.17773 -0.004,0.055 6.6e-4,0.0255 -0.0195,0.0996 2.5e-4,0.005 0.002,0.0104 0.002,0.0156 0,0.067 -0.0128,0.11772 -0.0293,0.18554 -0.0942,0.82835 -0.13448,1.89847 -0.24023,2.66602 -0.18605,1.35095 -0.47097,2.67026 -0.68164,4.01367 -10e-4,0.0274 -0.003,0.0542 -0.008,0.084 -0.008,0.0425 -0.0166,0.0872 -0.0273,0.1289 v 0.002 c -0.0584,0.36988 -0.12726,0.73617 -0.1875,1.10547 0.0944,-0.13446 0.0348,0.0155 -0.0234,0.14063 -0.004,0.0255 -0.009,0.0507 -0.0137,0.0762 -4.2e-4,0.0194 -7.7e-4,0.0392 -0.002,0.0566 0.006,0.0277 -0.004,0.0712 -0.0176,0.11328 v 0.002 c 0.012,0.0603 -0.005,0.13074 -0.0215,0.18945 -0.006,0.0414 -0.0152,0.0816 -0.0215,0.12305 -7.8e-4,0.005 -7.7e-4,0.0105 -0.002,0.0156 -5e-4,0.002 -7.7e-4,0.004 -0.002,0.006 -0.0107,0.0422 -0.0213,0.0845 -0.0371,0.125 -9.9e-4,0.003 -0.004,0.007 -0.006,0.01 -0.19568,1.17025 -0.47524,2.31235 -0.68945,3.47656 v 0.002 c 0.004,0.0969 0.001,0.17924 -0.0176,0.27539 0,0.0141 -0.004,0.0297 -0.0117,0.041 -0.004,0.004 -0.0151,-0.0123 -0.0156,-0.008 -0.004,0.0229 0.005,0.0457 0.008,0.0684 -0.007,0.15441 -0.0365,0.31467 -0.0879,0.46094 -0.004,-0.008 -0.004,-0.0329 -0.008,-0.0254 -0.008,0.0159 0.0405,0.25134 -0.0332,0.29102 -0.0136,-0.0159 -0.0647,0.2672 -0.0723,0.25586 -0.008,-0.008 -0.0145,-0.0212 -0.0156,-0.0137 -0.0113,0.0707 0.008,0.14619 -0.0352,0.21875 -0.003,0.0189 -0.0299,0.17617 -0.0488,0.1875 -0.002,0.002 -0.002,2.6e-4 -0.002,-0.004 2.6e-4,0.0142 -8.2e-4,0.0326 -0.004,0.0234 -0.002,-0.004 -0.006,-0.0136 -0.008,-0.0215 -5e-4,0.003 -0.005,0.005 -0.006,0.008 0.008,0.0519 0.0117,0.0577 0.0117,0.0469 6.2e-4,0.007 0.004,0.0206 0.008,0.0605 -0.004,0.0975 10e-4,0.0781 -0.0215,0.19531 -0.004,0.0113 -0.0136,0.0179 -0.0156,0.0293 -0.002,0.0113 0.0113,0.0375 0,0.0351 -0.0162,-0.004 -0.0328,-0.008 -0.0488,-0.0117 -0.004,0.0216 -0.009,0.0429 -0.0137,0.0645 0.0743,0.0264 0.092,0.0488 0.0762,0.0898 -0.001,0.006 -0.003,0.0102 -0.004,0.0156 0.002,-0.004 0.006,-0.008 0.008,-0.0117 -1.9e-4,0.003 -0.005,0.0106 -0.006,0.0156 -0.005,0.008 -0.0112,0.0161 -0.0176,0.0254 0.002,3.2e-4 0.006,-3.2e-4 0.008,0 -0.004,0.006 -0.0123,0.0223 -0.0117,0.006 -0.001,0.002 -0.004,0.004 -0.006,0.006 -0.005,0.0269 -0.0145,0.0989 -0.041,0.27734 -0.0151,0.0987 -0.022,0.19785 -0.0332,0.29688 h -0.01 c -0.0205,0.1752 -0.0915,0.28764 -0.17578,0.3418 -6.79081,33.99927 -21.49876,65.26783 -42.47656,91.65429 -0.002,0.005 -0.004,0.0102 -0.006,0.0156 -0.0472,0.0903 -0.10151,0.18663 -0.16992,0.2539 0.009,-0.0268 -0.0724,0.10377 -0.0762,0.11133 -0.008,0.008 -0.0139,0.0199 -0.0215,0.0312 -0.0608,0.085 -0.13112,0.17083 -0.18555,0.25586 -0.0487,0.11036 -0.1046,0.21442 -0.18359,0.30664 -0.0724,0.0935 -0.0187,0.0277 -0.0742,0.0957 -0.0132,0.0147 -0.0239,0.0337 -0.0391,0.0488 -0.004,0.004 -0.012,0.0167 -0.0117,0.01 -10e-4,0.005 -0.003,0.0101 -0.004,0.0156 -0.0884,0.18354 -0.22759,0.33981 -0.36328,0.49024 -0.0752,0.0729 -0.15865,0.14001 -0.21875,0.22656 -0.0714,0.0869 -0.1511,0.1644 -0.23047,0.24414 -0.0359,0.0348 -0.0772,0.0675 -0.10742,0.10156 -0.0499,0.0741 -0.10163,0.14783 -0.15039,0.22266 -0.0688,0.0843 -0.14473,0.16201 -0.2207,0.24023 -0.059,0.031 -0.12369,0.0532 -0.17774,0.0918 -0.028,0.0217 0.0643,-0.0177 0.0957,-0.0332 -8e-4,10e-4 -8.8e-4,0.003 -0.002,0.004 -0.0181,0.0246 -0.0279,0.0497 -0.043,0.0762 -0.0627,0.10809 -0.12609,0.217 -0.22852,0.29296 -0.0471,0.0889 -0.12632,0.15778 -0.19141,0.23243 -0.10242,0.11376 -0.15879,0.25114 -0.25781,0.36718 L 459.94922,476 c -0.0386,0.0385 -0.0767,0.0771 -0.11524,0.11523 -0.0521,0.0521 -0.10295,0.10329 -0.15625,0.1543 -0.0563,0.0533 -0.13629,0.15009 -0.20507,0.21094 -0.13153,0.12057 -0.27082,0.23182 -0.39063,0.36523 l -0.0195,0.0195 c -0.31871,0.37813 -0.66499,0.73341 -0.98633,1.10938 -0.0394,0.0519 -0.0775,0.10455 -0.11719,0.15625 -0.14116,0.18637 -0.29223,0.3659 -0.42187,0.56055 -0.0843,0.13519 -0.16106,0.27938 -0.28125,0.38671 -0.13773,0.13731 -0.27491,0.27453 -0.41211,0.41211 -0.0813,0.0813 -0.16439,0.16138 -0.24414,0.24415 -0.0971,0.10166 -0.19105,0.20848 -0.30859,0.2871 l -0.16797,0.16797 -0.12696,0.12696 c -0.005,0.006 -0.0108,0.0101 -0.0156,0.0156 -0.26873,0.30526 -0.54006,0.60834 -0.81055,0.91211 -0.0231,0.0413 -0.0496,0.0814 -0.084,0.11524 -0.0613,0.0773 -0.0928,0.17402 -0.16016,0.24609 -0.004,0.007 -0.0125,0.0207 -0.0332,0.0527 -0.0473,0.0729 -0.0991,0.14013 -0.1543,0.20703 -0.0423,0.0575 -0.0352,0.0502 -0.0937,0.11329 -0.002,0.002 -0.005,0.004 -0.008,0.006 0.009,-0.0203 0.0345,-0.075 0.0234,-0.0566 -0.0151,0.0234 -0.0258,0.0497 -0.0371,0.0762 -0.0166,0.0238 -0.0357,0.0496 -0.0508,0.0723 -0.10848,0.12812 -0.22287,0.24996 -0.34571,0.36524 -0.0748,0.0745 -0.14083,0.16023 -0.22851,0.2207 -0.027,0.0177 -0.15282,0.15679 -0.15235,0.125 -0.0386,0.0753 -0.0907,0.15108 -0.14062,0.1875 -0.0707,0.0964 -0.12382,0.20541 -0.2168,0.28516 -0.0741,0.0673 -0.11896,0.1514 -0.18359,0.22851 -0.0722,0.0722 -0.14385,0.14733 -0.2168,0.21875 -0.0752,0.0718 -0.0827,0.0638 -0.10156,0.10156 -0.0272,0.0435 -0.0557,0.0949 -0.0937,0.12891 -0.004,0.003 -0.013,-6e-5 -0.0156,0.004 -0.0306,0.0523 -0.0424,0.0773 -0.0449,0.0859 0.002,-5.4e-4 0.007,-0.004 0.0117,-0.01 -0.0185,0.0254 -0.029,0.0422 -0.0781,0.11133 -0.0744,0.0673 -0.13943,0.13598 -0.19726,0.21875 -0.0416,0.0367 -0.0716,0.0762 -0.10938,0.125 -0.0605,0.0548 -0.0941,0.13837 -0.16406,0.1875 -0.0412,0.0333 -0.0308,0.0171 -0.0742,0.084 -0.0571,0.0915 -0.13075,0.16849 -0.20898,0.24219 -0.0654,0.0654 -0.13031,0.12993 -0.19531,0.19531 -0.0537,0.0544 -0.10964,0.10844 -0.16407,0.16211 -0.0771,0.0775 -0.14738,0.16131 -0.23242,0.23047 -0.0646,0.0484 -0.1703,0.14674 -0.18164,0.1543 -0.0843,0.0782 -0.13106,0.18928 -0.21875,0.26562 -0.0642,0.0786 -0.1177,0.13516 -0.17969,0.2168 -0.054,0.0499 -0.0856,0.12192 -0.14453,0.16992 L 450.57422,486.5 c -0.0484,0.0491 -0.0966,0.0969 -0.14649,0.14453 -0.0638,0.0621 -0.11723,0.13535 -0.19335,0.18359 l -0.0117,0.006 c -0.003,0.002 -0.005,0.004 -0.008,0.006 -0.065,0.0578 -0.12513,0.12079 -0.1875,0.18164 -0.0151,0.0144 -0.0298,0.0298 -0.0449,0.0449 0.0401,-0.0798 0.02,-0.0356 -0.0723,0.0801 -0.0113,0.0151 -0.0298,0.0219 -0.0449,0.0332 -0.16191,0.14249 -0.22281,0.20693 -0.39062,0.36719 l -0.004,0.002 c -0.0956,0.091 -0.19014,0.13609 -0.27343,0.14844 -2.40754,2.49079 -4.88851,4.91551 -7.41797,7.29296 -0.068,0.0726 -0.13655,0.14472 -0.20508,0.2168 -0.0794,0.0775 -0.16338,0.14927 -0.23633,0.23242 0.004,-0.0113 0.0154,-0.0408 0.008,-0.0332 -0.0119,0.01 -0.0118,0.0277 -0.0156,0.0391 -0.008,0.017 -0.0198,0.0358 -0.0274,0.0547 -0.0242,0.0469 -0.05,0.0788 -0.084,0.12109 l -0.0215,0.0234 c -0.11528,0.11565 -0.2305,0.22999 -0.34766,0.34375 -0.0896,0.0903 -0.17133,0.19054 -0.27149,0.26953 -0.12849,0.10621 -0.26092,0.20951 -0.37695,0.33008 -0.0378,0.0193 -0.0754,0.0393 -0.11328,0.0586 0.002,-10e-4 0.008,0.004 0.004,0.004 -0.005,0.002 -0.0126,0.007 -0.0195,0.01 -0.0443,0.0326 -0.0853,0.072 -0.125,0.10937 -0.0763,0.0771 -0.15457,0.15293 -0.23243,0.22852 -0.10582,0.1096 -0.20012,0.23357 -0.33203,0.31445 -0.0287,0.0197 -0.0595,0.034 -0.0859,0.0566 -0.0136,0.0113 -0.0298,0.0316 -0.0449,0.043 -0.0148,0.01 -0.0337,0.0204 -0.0527,0.0312 0.004,-0.004 0.008,-0.007 0.004,-0.006 -0.009,0.005 -0.019,0.0114 -0.0273,0.0195 0.007,-0.004 0.0138,-0.007 0.0215,-0.0117 -0.004,0.003 -0.008,0.006 -0.01,0.008 -0.01,0.005 -0.01,0.005 -0.0156,0.008 -0.0287,0.0301 -0.0524,0.075 -0.0723,0.0976 -0.0868,0.033 -0.1801,0.0525 -0.26172,0.0957 -0.009,0.008 -0.0185,0.0154 -0.0273,0.0234 0.0223,0.004 0.0958,-0.007 0.125,-0.0156 0.0463,-0.0146 0.0823,-0.0484 0.0957,-0.0625 -0.007,0.0101 -0.0231,0.0309 -0.0469,0.0684 -0.1081,0.15194 -0.11798,0.14777 -0.28126,0.26758 -0.008,0.004 0.01,-0.005 0.0176,-0.008 0.0329,-0.017 0.0558,-0.0493 0.0898,-0.0645 -0.005,0.006 -0.0247,0.0267 -0.0332,0.0352 -0.0578,0.0643 -0.11398,0.12797 -0.16992,0.19336 -0.24151,0.29359 -0.55872,0.46349 -0.87695,0.66797 -0.0762,0.0487 -0.14661,0.0758 -0.21094,0.0879 -0.75338,0.67131 -1.4788,1.37 -2.24219,2.03125 -0.0247,0.0605 -0.0659,0.12369 -0.1289,0.1875 -0.008,0.0113 -0.0159,0.0198 -0.0234,0.0273 -0.14751,0.15674 -0.30112,0.30825 -0.43945,0.47266 -0.18373,0.2217 -0.37871,0.43135 -0.64063,0.5625 -0.082,0.0321 -0.0226,-9.7e-4 -0.10156,0.0859 -0.0843,0.0934 -0.18279,0.16415 -0.27539,0.24805 -0.15965,0.12586 -0.33874,0.22161 -0.49219,0.35352 -0.0933,0.0911 -0.1792,0.18713 -0.28125,0.26953 -0.0567,0.0461 -0.12186,0.0804 -0.17969,0.125 -0.0355,0.0272 -0.0695,0.0595 -0.10351,0.0859 -0.12246,0.0956 -0.23736,0.18184 -0.37305,0.25781 -0.0518,0.0291 -0.11216,0.0421 -0.16016,0.0762 -0.0219,0.0166 -0.0416,0.0436 -0.0605,0.0625 -0.12435,0.1251 -0.25148,0.26432 -0.41211,0.3418 -0.0552,0.0215 -0.0178,0.003 -0.082,0.0625 -0.11324,0.10582 -0.23264,0.21794 -0.37891,0.27539 -0.0558,0.0215 -0.10687,0.0368 -0.1582,0.0586 -10e-4,5.7e-4 -0.003,9.5e-4 -0.004,0.002 -13.40409,11.01594 -28.22153,20.54049 -44.37109,28.15821 -25.22748,11.89973 -57.90619,19.78905 -81.97071,19.78906 h -8.27734 v 20.5 l 0.0117,20.51758 11.25,-0.61719 c 16.96198,-0.93033 36.67553,-3.89496 51.89258,-7.80273 61.70689,-15.8465 116.78108,-55.75206 150.65234,-109.16211 28.50765,-44.95238 42.49468,-98.69008 39.19531,-150.5918 -1.06408,-16.73836 -1.39627,-19.44034 -4.1582,-33.86133 C 530.19343,213.05255 479.70534,147.03748 407.85547,111.77734 376.00843,96.14856 344.18842,87.972087 307.10547,85.890625 Z M 439.17188,497.46094 c 0.001,-10e-4 0.003,-0.003 0.004,-0.004 -0.004,0.002 -0.0102,0.006 -0.0137,0.008 0.002,-0.001 0.006,-0.002 0.01,-0.004 z m 0.90039,-0.80078 c 0.005,-0.004 0.01,-0.01 0.0156,-0.0137 -0.0208,0.0106 -0.0423,0.0192 -0.0625,0.0312 0.009,-0.003 0.0294,-0.01 0.0469,-0.0176 z M 331,128.77734 c 0.0123,0.002 0.0249,0.003 0.0371,0.006 0.01,0.002 0.0151,0.0128 0.0215,0.0215 -0.0196,-0.009 -0.0386,-0.019 -0.0586,-0.0273 z m 143.03711,28.42578 c 0.008,0.0106 0.0198,0.0352 0.0273,0.0527 -0.008,-0.0174 -0.016,-0.0326 -0.0273,-0.0527 z m -43.61914,16.25 c 0.0122,0.006 0.0364,0.0159 0.0781,0.0352 0.0281,0.0139 0.0609,0.0325 0.0937,0.0508 -0.0794,-0.0408 -0.14688,-0.0735 -0.17187,-0.0859 z m 12.89062,11.78126 c -0.003,2.2e-4 -0.004,0.002 0,0.004 0.0266,0.0144 0.0542,0.0253 0.082,0.0371 -0.009,-0.01 -0.0188,-0.0186 -0.0293,-0.0273 -0.0102,-0.009 -0.0431,-0.0148 -0.0527,-0.0137 z m 24.92969,28.0039 c -0.004,5.4e-4 -0.008,0.003 -0.0117,0.004 0.0537,0.0738 0.10848,0.14682 0.16211,0.2207 -0.008,-0.0333 -0.0146,-0.0648 -0.0234,-0.0996 -0.0247,-0.0968 -0.0693,-0.133 -0.12695,-0.125 z M 332.34961,299.3418 c -0.0516,0.0516 0.25111,0.45697 0.87305,1.25 0.75484,0.9625 1.5425,1.75 1.75,1.75 0.82303,0 0.29265,-0.82059 -1.37305,-2.12696 -0.79304,-0.62192 -1.19838,-0.92466 -1.25,-0.87304 z m 175.75391,65.16211 c -0.004,0.0411 -0.008,0.0684 -0.01,0.0898 0.003,-0.008 0.006,-0.0113 0.01,-0.0215 -3e-5,-0.0161 2.2e-4,-0.0563 0,-0.0684 z m -1.26954,8.84375 c -0.002,0.006 -0.004,0.0107 -0.006,0.0156 0.002,-0.002 0.004,-0.004 0.006,-0.008 0,-0.002 -1.3e-4,-0.005 0,-0.008 z m -196.1875,220.60156 c 0.0249,-1.1e-4 0.0435,0.003 0.0527,0.004 -0.008,0 -0.0276,-0.002 -0.0527,-0.004 z" />
            <path
               id="path4504"
               style="fill:#dadada;stroke-width:0.999999"
               transform="scale(0.26458333)"
               d="m 297.26953,84 c -12.549,0.01739 -25.27158,0.605744 -33.41992,1.759766 -48.24051,6.832063 -90.26607,24.704704 -127.5,54.224614 -12.98843,10.29702 -33.53848,31.47644 -43.734376,45.07031 -27.519958,36.69155 -43.454851,75.87746 -49.86914,122.63476 -2.106437,15.35506 -2.081818,48.5029 0.04687,64.15235 7.800775,57.34102 32.641016,107.72394 72.996086,148.05078 20.53827,20.52385 40.98454,35.26293 66.49024,47.93164 33.10178,16.44166 63.48456,24.37439 103.07031,26.91016 27.10566,1.73576 66.68365,-4.04093 94.69336,-13.82227 91.7246,-32.03135 155.87387,-110.58033 169.92579,-208.07031 2.3698,-16.44635 2.38768,-49.46938 0.0273,-66.5 -8.12027,-58.68378 -34.34508,-110.59567 -76.27539,-151 C 434.11418,117.17339 386.94807,94.363411 329.65625,85.667969 322.19539,84.535528 309.81854,83.982622 297.26953,84 Z m -0.91992,1.279297 10.75,0.601562 c 37.08299,2.081462 68.90299,10.25777 100.75,25.886721 27.64913,13.56873 49.98652,29.86107 71.19141,51.92578 34.31202,35.70327 56.86917,79.23925 66.14062,127.64844 2.76193,14.421 3.09415,17.12338 4.1582,33.86132 3.29949,51.90172 -10.68769,105.63942 -39.19531,150.5918 -39.05374,61.58207 -106.03914,104.72383 -177.79492,114.50781 -7.425,1.01243 -18.5625,2.1176 -24.75,2.45704 l -11.25,0.61718 v -20.36328 -20.36523 l -11.7832,-0.63282 C 207.9276,547.89532 138.73275,501.80121 104.92969,432.35352 67.547592,355.55238 79.541511,264.7132 135.62695,199.8418 c 31.1678,-36.0502 74.29275,-60.91827 121.22266,-69.90039 10.09047,-1.93127 25.60353,-3.59961 33.46094,-3.59961 h 6.03906 v -20.53125 z m 17,41.183593 c -0.25061,0 -0.46278,0.0458 -0.69141,0.0742 0.0115,0.005 0.0211,0.0106 0.0273,0.0176 0.0101,-5e-5 0.0219,5e-5 0.0273,0 0.059,-2.9e-4 0.11906,-5.8e-4 0.17773,0.002 0.0735,-0.005 0.14825,-0.0101 0.22071,0.0137 0.0219,0.0233 0.15787,-0.0122 0.20508,0.0215 -0.0758,0.0117 0.11693,-0.001 0.13281,0.006 0.0449,-0.005 0.19135,-0.0185 0.22461,0.0137 0.002,0.002 10e-4,0.003 -0.004,0.004 0.0518,-9.4e-4 0.10473,-0.002 0.15625,0.004 0.008,6.5e-4 0.0291,-0.004 0.0234,0.002 -0.005,0.005 -0.0172,0.01 -0.0273,0.0117 0.0454,-0.005 0.0912,-0.0157 0.13671,-0.0195 0.0676,-0.006 0.13716,0.0271 0.20508,0.0234 0.0874,-7.6e-4 0.17434,0.002 0.26172,0.004 0.01,0 0.0312,-0.0102 0.0312,0 0.005,0.0679 -0.018,0.16468 -0.0391,0.25782 0.0206,10e-4 0.042,0.002 0.0625,0.008 0.005,-0.11867 0.0186,-0.22808 0.0781,-0.25781 8e-4,-0.007 -2.1e-4,-0.0146 0.002,-0.0215 0.0164,0.003 0.0326,0.01 0.0488,0.0117 0.0663,0.008 0.13273,0.0147 0.19921,0.0215 0.0949,0.009 0.19018,0.0186 0.28516,0.0273 0.0515,0.005 0.0976,0.0147 0.13867,0.0273 -0.0552,-0.0199 -0.0534,-0.0378 -0.13281,-0.0586 -0.48125,-0.12574 -1.11563,-0.18945 -1.75,-0.18945 z m 1.99023,0.29688 c 0.0482,0.0294 0.084,0.0647 0.10743,0.10351 0.0104,-0.0324 -0.0381,-0.067 -0.10743,-0.10351 z m 8.00977,0.71093 c -0.18197,0 -0.34026,0.0456 -0.50195,0.084 0.01,0.01 0.0154,0.0141 0.0234,0.0215 0.0358,-1e-4 0.0715,-6.4e-4 0.10743,0 0.0414,-0.001 0.0926,-0.001 0.10546,0.004 -0.0486,1.1e-4 -0.18633,0.0544 -0.13867,0.0449 0.0925,-0.0181 0.13854,-0.053 0.20313,-0.0527 0.0215,1e-4 0.046,0.004 0.0742,0.0137 0.006,0.002 0.0121,-0.001 0.0156,0.006 0.002,0.003 -0.01,0.003 -0.008,0.004 0.0323,0.009 0.0704,-0.007 0.10351,0 h 0.002 c 0.0166,8.5e-4 0.0785,0.006 0.13867,0.01 -0.0359,0.002 -0.086,0.0143 -0.125,0.0273 h 0.0742 0.0684 0.0703 c 0.025,-0.005 0.0508,-0.01 0.0801,-0.0156 0.0102,0.006 0.018,0.0108 0.0254,0.0156 h 0.008 0.0703 c 0.0214,0 0.0433,1e-5 0.0645,0 0.0294,-10e-6 0.0584,-5e-5 0.0879,0 0.0285,-2e-5 0.0576,-4.7e-4 0.0859,0 0.0422,6.1e-4 0.07,0.001 0.11914,-0.002 0.008,0.003 0.0155,0.009 0.0234,0.0117 -0.0172,-8.2e-4 -0.0345,-0.001 -0.0508,0.006 -0.005,0.002 -0.0224,0.0117 -0.0371,0.0195 0.0168,-3.2e-4 0.0338,-0.001 0.0625,0.006 0.005,0.001 0.0148,0.003 0.0234,0.006 0.0139,-0.006 0.0261,-0.0108 0.0449,-0.0195 -0.013,-0.005 -0.026,-0.0105 -0.0391,-0.0156 0.0159,0.001 0.0312,0.01 0.0469,0.0117 0.002,1.5e-4 0.004,1e-4 0.006,0 -0.005,0.003 -0.009,0.009 -0.0137,0.0117 0.0312,0.0125 0.0633,0.0242 0.0957,0.0332 0.001,3.3e-4 0.003,-3.2e-4 0.004,0 0.0123,-2.1e-4 -0.0422,-0.0312 -0.0801,-0.041 0.01,-0.005 0.0186,-0.008 0.0293,-0.0137 0.0426,0.0113 0.0779,0.0371 0.11719,0.0547 h 0.0703 0.20508 c -0.006,-0.003 -0.005,-0.005 -0.0117,-0.008 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20898 z m 0.15234,0.13672 c 0.0526,0.004 0.10023,0.006 0.11133,0.008 -0.005,2.1e-4 -0.0297,9e-4 -0.0859,-0.004 4.7e-4,2.3e-4 0.007,0.005 0.0137,0.008 -0.0133,-0.003 -0.0257,-0.009 -0.0391,-0.0117 z m 7.84766,0.86328 c -0.39998,0 -0.77877,0.0754 -1.10352,0.1836 0.0573,0.0254 0.11063,0.0639 0.17188,0.0742 0.0461,0.008 -0.0833,-0.0447 -0.12109,-0.0723 -0.006,-0.004 0.0127,-1.5e-4 0.0195,-0.002 0.0821,-0.011 0.16392,-0.004 0.24609,-0.004 0.0993,-0.009 0.19391,0.005 0.28711,0.041 0.0254,0.0142 0.0869,0.0513 0.0977,0.0605 -0.0393,-0.0136 -0.0732,-0.0418 -0.11329,-0.0527 -0.0665,-0.0181 -0.11891,0.0119 -0.17382,0.041 0.076,0.009 0.15241,0.0132 0.22851,0.0215 0.0146,-7.5e-4 0.0294,-4.6e-4 0.0488,0 0.0208,4.9e-4 0.0412,0.008 0.0605,0.0156 -0.0363,-0.006 -0.0727,-0.0117 -0.10938,-0.0156 -0.0804,0.004 -0.10027,0.0279 -0.16015,0.0762 0.0973,-1.5e-4 0.19568,-0.009 0.29296,-0.008 0.0418,-0.007 0.0825,-0.003 0.12305,0.008 0.0527,0.0137 0.10348,0.0382 0.15235,0.0664 0.0104,0.003 0.0215,0.005 0.0312,0.008 0.007,0.002 0.0197,0.007 0.0293,0.0117 h 0.002 c 0.0224,0.004 -0.002,-2.8e-4 0.0566,0.0234 h 0.002 c 0.002,-0.011 0.0222,0.004 0.0332,0.006 -0.004,-0.003 -0.007,-0.006 -0.008,-0.008 0.005,-0.001 0.0446,0.0154 0.0723,0.0254 0.10967,0.008 0.21564,0.042 0.32227,0.0664 0.01,-6.1e-4 0.0261,-0.002 0.0312,-0.002 0.068,0.0148 0.0595,0.0127 0.084,0.0176 0.0513,-0.0184 0.17125,0.004 0.20118,0.01 0.0278,0.005 0.0455,0.0129 0.0586,0.0195 0.006,-9.4e-4 0.007,-0.003 0.0137,-0.004 0.002,-8e-5 0.002,2.6e-4 0.004,0 0.54641,-0.0837 0.82875,-0.21299 0.36914,-0.39843 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z M 331,128.77734 c 0.0123,0.002 0.0249,0.003 0.0371,0.006 0.01,0.002 0.0151,0.0128 0.0215,0.0215 -0.0196,-0.009 -0.0386,-0.019 -0.0586,-0.0273 z m 0.30469,0.13282 c 0.002,0.001 0.005,0.002 0.008,0.004 0.008,0.002 0.0217,0.005 0.0273,0.006 -0.006,-0.003 -0.011,-0.006 -0.0176,-0.008 -0.006,-0.001 -0.0118,-1.1e-4 -0.0176,-0.002 z m 4.96289,0.55468 c -0.27317,-0.0113 -0.57627,0.0659 -0.86914,0.15235 0.004,6.5e-4 0.008,2.5e-4 0.0117,0.002 0.0754,0.009 0.13987,0.0184 0.21289,0.043 0.008,0.003 0.0318,0.009 0.0234,0.0117 -0.009,0.003 -0.018,0.006 -0.0273,0.008 0.0352,-0.005 0.072,-0.009 0.10742,-0.01 0.0337,-4.9e-4 0.13412,0.0377 0.1836,0.0664 h 0.002 c 0.009,9.6e-4 0.0182,-3.2e-4 0.0273,0.002 0.0185,0.003 0.0365,0.01 0.0547,0.0156 h 0.002 c 0.0285,-0.001 0.0568,-0.002 0.10157,-0.004 0.0552,0.0133 0.098,0.0256 0.14453,0.0469 0.0108,-5.9e-4 0.0224,-0.002 0.0332,-0.002 0.009,1.5e-4 0.0616,0.0222 0.0937,0.0391 0.0114,-0.002 0.0238,-0.003 0.0371,-0.004 0.0343,-0.004 0.071,0.004 0.10547,0.0137 0.0613,-0.0259 0.1065,-0.0395 0.0488,0.006 0.0375,0.005 0.25813,0.0469 0.27929,0.084 0.009,0.0151 -0.0338,-0.009 -0.0508,-0.0137 -0.0619,0.017 -0.24772,0.0349 -0.18554,0.0508 0.0964,0.0249 0.19879,0.001 0.29882,-0.01 -0.008,0.004 0.0101,0.003 0.0371,0.002 -0.003,-10e-4 -0.007,-0.004 -0.0117,-0.006 -0.005,2.9e-4 -0.0103,0.002 -0.0156,0.002 0.003,-8e-4 0.006,-0.003 0.01,-0.004 0.002,9.9e-4 0.004,2.5e-4 0.006,0.002 0.003,-1.4e-4 0.005,1.1e-4 0.008,0 0.008,0.006 0.007,0.006 0.004,0.006 h 0.002 c 0.0182,-8.3e-4 0.0403,-0.002 0.0625,-0.002 0.0646,-0.0689 0.16843,-0.13187 0.0762,-0.22461 -0.16615,-0.16615 -0.46511,-0.25911 -0.8125,-0.27344 z m -0.13086,0.33789 c -0.018,3.8e-4 -0.0256,0.006 -0.0586,0.0195 0.036,-0.004 0.0714,-0.0121 0.10743,-0.0176 -0.0232,-0.001 -0.0385,-0.002 -0.0488,-0.002 z m 137.90039,21.40039 c 0.008,0.0106 0.0198,0.0352 0.0273,0.0527 -0.008,-0.0174 -0.016,-0.0326 -0.0273,-0.0527 z m -44.1875,21.63868 0.89062,1.05273 c 0.13146,-0.0194 0.20924,-0.0517 0.19141,-0.10937 0.14634,0.15157 0.29541,0.29788 0.45508,0.43554 0.10998,0.13349 0.23634,0.30837 0.31836,0.43555 0.0692,0.0724 0.0594,0.0598 0.1289,0.13477 0.012,0.0131 0.0437,0.0397 0.0527,0.0508 v 0.002 h 0.002 c 0.0177,0.0125 0.0333,0.0225 0.0742,0.0527 0.0277,0.0217 0.0362,0.0289 0.0566,0.0449 h 0.002 c -0.006,-0.008 0.0528,0.0293 0.31055,0.21679 0.13228,0.13242 0.26382,0.26616 0.39649,0.39844 0.0782,0.0783 0.15771,0.15603 0.23632,0.23438 0.0954,0.0943 0.18908,0.18808 0.28125,0.28515 0.0522,0.0277 0.0546,0.0342 0.21289,0.1836 0.0257,0.0264 0.0989,0.0513 0.0762,0.0801 -0.002,0.003 -0.007,0.005 -0.01,0.008 0.007,0.003 0.0123,0.006 0.0195,0.01 0.0185,-0.005 0.0361,-0.0108 0.0547,-0.0156 0.1217,0.0909 0.2262,0.2041 0.33203,0.3125 0.034,0.0415 0.0665,0.0915 0.10547,0.1289 0.0935,0.0904 0.20537,0.16187 0.30859,0.24219 8.8e-4,-0.0109 0.004,-0.0168 0.004,-0.0293 0,-0.18977 -1.01255,-1.20224 -2.25,-2.25 z m 0.56836,0.61132 c 0.0122,0.006 0.0364,0.0159 0.0781,0.0352 0.0281,0.0139 0.0609,0.0325 0.0937,0.0508 -0.0794,-0.0408 -0.14688,-0.0735 -0.17187,-0.0859 z m 6.43164,5.38868 3.55469,3.82031 c 0.0901,-1.3e-4 0.19768,0.0415 0.30664,0.14453 0.21857,0.20661 0.47584,0.37316 0.64062,0.48828 0.0491,0.0837 0.1225,0.14099 0.19922,0.21485 0.0113,0.011 0.0238,0.0238 0.0352,0.0332 0.0117,0.01 0.0298,0.0101 0.0449,0.0195 0.0752,0.0508 0.12526,0.0968 0.17969,0.16797 0.0144,0.0283 0.0115,0.0131 0.0742,0.0703 0.0431,0.0428 0.0858,0.0863 0.1289,0.12891 0.0419,0.0418 0.0831,0.083 0.125,0.125 0.0401,0.04 0.0791,0.0811 0.11914,0.12109 0.0457,0.0459 0.0929,0.0908 0.13867,0.13672 0.0378,0.038 0.0751,0.0753 0.11329,0.11328 0.0291,0.0321 0.0616,0.065 0.0918,0.082 0.11528,0.0724 0.21877,0.1571 0.3125,0.25586 0.0612,0.0737 0.0473,0.0525 0.1543,0.15821 0.0522,0.0556 0.10636,0.10567 0.16797,0.15039 0.0722,0.0565 0.1303,0.12864 0.19531,0.19335 0.005,0.005 0.0207,0.0234 0.0352,0.043 0.0261,0.0114 0.0515,0.023 0.0762,0.0371 0.028,0.016 0.0476,0.0445 0.0703,0.0664 0.0427,0.0424 0.074,0.0844 0.0937,0.13281 0.0104,0.009 0.0221,0.0228 0.0391,0.0391 0.11755,0.103 0.21921,0.22212 0.31446,0.34571 0.0722,0.0773 0.16149,0.13774 0.23633,0.21484 0.071,0.08 0.14864,0.15319 0.2246,0.22852 0.0745,0.0741 0.14858,0.15041 0.22266,0.22461 0.0854,0.0852 0.17044,0.16864 0.25586,0.2539 0.0949,0.0839 0.19249,0.16362 0.2832,0.25977 0.005,0.006 0.006,0.005 0.01,0.01 0.0102,-0.0386 0.0566,-0.0205 0.0566,-0.0762 0,-0.16339 -1.91251,-2.07587 -4.25,-4.25 z m 6.45898,6.39258 c -0.003,2.2e-4 -0.004,0.002 0,0.004 0.0266,0.0144 0.0542,0.0253 0.082,0.0371 -0.009,-0.01 -0.0188,-0.0186 -0.0293,-0.0273 -0.0102,-0.009 -0.0431,-0.0148 -0.0527,-0.0137 z m 5.54102,5.60742 3.44727,3.75 c 3.20713,3.49045 4.05273,4.20893 4.05273,3.44531 0,-0.16709 -1.68751,-1.85461 -3.75,-3.75 z m 10.96289,11.66211 c 0.039,0.046 0.099,0.12442 0.14844,0.19336 0.0378,0.0377 0.0757,0.0754 0.11328,0.11328 0.0646,0.0644 0.13024,0.12752 0.19336,0.19336 0.0854,0.0919 0.12168,0.12795 0.23242,0.2207 0.15345,0.16388 0.0749,0.0703 0.24609,0.3125 0.0255,0.0253 0.0327,0.0298 0.0352,0.0293 0.002,0.003 0.0172,0.0311 0.0762,0.13086 0.0332,0.0306 0.10317,0.10219 0.0762,0.0879 -0.007,-0.004 -0.0129,-0.008 -0.0195,-0.0117 0.0161,0.018 0.0203,0.0258 0.0371,0.0625 0.12001,0.096 0.20852,0.17339 0.26367,0.23828 l 0.004,-0.004 c 0.0174,-0.0182 0.0377,0.0374 0.0566,0.0566 0.24087,0.26202 0.73195,0.80797 0.91602,1.01172 h -0.002 c 0.026,0.0289 0.0488,0.0572 0.0723,0.0859 0.21739,-0.25254 -0.44808,-1.02736 -2.16211,-2.47852 z m 1.13867,1.33203 c -0.007,-0.005 -0.0125,-0.01 -0.0195,-0.0156 0.0174,0.0285 0.0308,0.0504 0.0527,0.0859 -0.0172,-0.036 -0.0258,-0.0542 -0.0332,-0.0703 z m -0.0195,-0.0156 c -0.011,-0.0181 -0.0238,-0.0392 -0.0332,-0.0547 -0.0457,-0.0251 -0.0913,-0.0525 -0.13672,-0.0781 0.0624,0.0487 0.11889,0.0922 0.16992,0.13281 z m -0.0332,-0.0547 c 0.005,0.003 0.0105,0.005 0.0156,0.008 -0.008,-0.009 -0.0179,-0.0189 -0.0371,-0.043 0.005,0.009 0.0155,0.0252 0.0215,0.0352 z m 6.58984,8.3711 c 0.0165,0.0248 0.0336,0.0486 0.0488,0.0742 0.0253,0.0421 0.0836,0.1337 0.10351,0.18164 0.0829,0.11315 0.15507,0.23187 0.20118,0.35742 0.0267,0.0284 0.053,0.0579 0.0801,0.0859 0.0272,0.0283 0.0783,0.0452 0.082,0.084 0.003,0.0259 -0.0931,-0.0408 -0.0742,-0.0234 0.14502,0.12881 0.36563,0.18157 0.4707,0.36329 0.0116,0.0156 0.2815,0.35375 0.5293,0.75195 0.033,0.0375 0.0645,0.0759 0.0976,0.11328 0.0589,0.0661 0.11846,0.13153 0.17774,0.19727 0.0924,-0.0431 0.14453,-0.15713 0.14453,-0.35743 0,-0.20764 -0.78751,-0.99515 -1.75,-1.75 -0.0707,-0.0555 -0.0467,-0.0277 -0.11133,-0.0781 z m 0.75,1.10156 c -0.0106,10e-4 -0.0276,0.023 -0.0391,0.0273 0.0136,0.0176 0.028,0.0361 0.041,0.0566 0.0518,0.0816 0.10328,0.16201 0.1543,0.24414 0.007,0.0115 0.0144,0.0234 0.0215,0.0352 0.002,-0.001 0.004,-0.002 0.006,-0.004 -0.017,-0.0749 -0.0358,-0.15242 -0.0566,-0.23438 -0.0247,-0.0968 -0.0693,-0.133 -0.12695,-0.125 z m -176.8887,72.2324 c -0.45312,0 -0.90625,0.0703 -1.25,0.20899 -0.68753,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.93753,-0.22651 1.25,-0.5039 -0.34375,-0.13871 -0.79688,-0.20899 -1.25,-0.20899 z m 11,0 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22651 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m -39.18945,10.8711 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.09999 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.90001 2.30859,-2 0.99553,-1.1 1.5857,-2 1.31055,-2 z m 66.18945,0 c -0.0516,0.0516 0.25111,0.45697 0.87305,1.25 0.75484,0.9625 1.54249,1.75 1.75,1.75 0.82303,0 0.29269,-0.82059 -1.37305,-2.12696 -0.79302,-0.62193 -1.19838,-0.92466 -1.25,-0.87304 z m 176.2793,2.3789 c -0.0283,0.0283 -0.0317,0.2157 -0.0547,0.2793 0.0337,0.1165 0.0639,0.23467 0.0879,0.35352 0,-0.003 -0.009,0.002 -0.008,0.004 0.005,0.01 0.01,0.0181 0.0156,0.0274 v 0.002 c 0.0122,0.0189 0.0271,0.0382 0.0371,0.0586 0.0714,0.15307 0.0895,0.20835 0.0664,0.34766 0.0974,0.29819 0.20977,0.59172 0.29297,0.89453 0.003,0.01 0.006,0.0195 0.008,0.0293 0.15773,-0.41551 0.18526,-0.99782 -0.041,-1.5625 -0.15949,-0.39888 -0.29896,-0.53874 -0.40429,-0.4336 z m -0.084,2.16211 c 0.008,0.023 0.0163,0.0365 0.0254,0.0566 -0.008,-0.018 -0.0182,-0.0364 -0.0254,-0.0566 z m -247.38476,0.45899 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.09999 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.90001 2.30859,-2 0.99549,-1.1 1.5857,-2 1.31055,-2 z m 76.68945,0.5 1.90625,2.25 c 1.79021,2.11445 2.59375,2.70454 2.59375,1.90429 0,-0.18977 -1.01251,-1.20225 -2.25,-2.25 z m 171.83008,2.93359 c 0.009,0.0253 0.0154,0.0405 0.0137,0.0195 0.0195,0.0985 0.0232,0.19755 0.0586,0.29297 0.0334,0.12366 0.0607,0.24202 0.0508,0.36523 -10e-5,0.001 1.2e-4,0.003 0,0.004 l 0.002,0.002 c 0.0404,0.13452 0.0402,0.10557 0.0391,0.16797 -4.5e-4,0.048 0.004,0.0969 -0.004,0.14453 -0.002,0.007 1e-4,0.017 0,0.0274 -2e-5,0.002 8e-5,0.004 0,0.006 0.005,0.0451 0.0105,0.0869 0.0176,0.14062 h 0.002 c 0.0365,8e-5 0.0277,0.0687 0.0391,0.10352 0.0805,0.25498 0.10472,0.36406 0.17578,0.63672 h 0.006 c 5.3e-4,0.002 5.5e-4,0.004 0.002,0.006 0.1474,-0.41628 0.17291,-0.98362 -0.0488,-1.53711 -0.13941,-0.34867 -0.25414,-0.4167 -0.35351,-0.37891 z m 0.0117,1.26953 c -0.0746,0.0292 -0.14874,0.0563 -0.22461,0.0781 2.2e-4,0.005 0.002,0.008 0.002,0.0137 0.13258,0.004 0.26689,0.0297 0.39844,0.0137 0.0227,-0.003 0.0257,-0.0682 0.004,-0.0742 -0.0588,-0.0149 -0.11941,-0.024 -0.17968,-0.0312 z m 1.125,5.75781 c -0.009,-0.003 -0.008,0.0672 -0.0156,0.0742 0.004,0.006 0.009,0.0123 0.0117,0.0195 0.0258,0.0679 0.0375,0.12468 0.0332,0.17579 0.016,0.0483 0.0132,0.0434 0.0195,0.11914 0.0118,0.0303 -0.005,0.0568 -0.0137,0.084 0.001,-0.005 0.004,-0.009 0.006,-0.0117 0.009,-0.0131 6.5e-4,0.0314 0.002,0.0469 9.3e-4,0.0408 -1e-5,0.0822 0,0.12304 7e-5,0.047 -1e-5,0.0937 0,0.14063 v 0.0625 c 0.004,0.0114 0.007,0.0214 0.01,0.0332 0.004,0.024 0.005,0.05 0.008,0.0742 -0.002,0.024 -0.003,0.0403 -0.004,0.0527 6.4e-4,0.0355 0,0.0719 0,0.10742 7e-5,0.0331 0,0.0663 0,0.0996 v 0.002 c 0.0233,0.057 0.0291,0.11762 0.0215,0.17969 0.003,-0.0152 -7.5e-4,0.0159 0.002,0.006 0.001,0.0404 0.003,0.0806 0.002,0.12109 0.002,0.008 0.0462,0.0239 0.0449,0.0449 0.005,0.005 0.0107,0.0131 0.0176,0.0234 0.0911,0.27708 0.0341,0.0601 0.0605,0.27344 0,0.007 0.0102,0.0104 0.0117,0.0176 0.0196,0.10014 0.0145,0.0801 0.0176,0.16601 -0.01,0.081 -0.01,0.16288 -0.008,0.24414 6.7e-4,0.0267 0.002,0.0534 0.002,0.0801 0.005,0.0172 0.0101,0.0387 0.0176,0.0703 0.003,0.01 0.004,0.0197 0.006,0.0293 0.17723,-0.68377 0.18619,-1.57317 -0.0547,-2.16992 -0.0692,-0.1719 -0.13679,-0.26662 -0.19726,-0.28907 z m 0.96289,9.33399 c -0.12964,0.0698 -0.22266,0.67383 -0.23438,1.70508 -0.0189,1.65001 0.18711,2.44655 0.46094,1.76953 0.27477,-0.67703 0.28836,-2.02703 0.0371,-3 -0.0953,-0.36488 -0.18581,-0.51647 -0.26367,-0.47461 z M 349.62891,331.7207 c -0.10515,0.10515 -0.17522,0.45465 -0.19922,1.03711 -0.0434,1.05417 0.19317,1.6448 0.52539,1.3125 0.33222,-0.33229 0.36803,-1.19414 0.0781,-1.91601 -0.15961,-0.39888 -0.29915,-0.53874 -0.40429,-0.4336 z m -106.8125,1.08203 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22647,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13499,-0.26662 -0.19531,-0.28907 z m 0,10 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22647,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13499,-0.26662 -0.19531,-0.28907 z m 107,1 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22651,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13511,-0.26662 -0.19531,-0.28907 z m 158.99609,9.72461 c -0.11943,0.11887 -0.2018,0.93946 -0.20898,2.31446 -0.0113,2.19997 0.18519,3.2178 0.43554,2.26172 0.24907,-0.9561 0.26305,-2.75609 0.0195,-4 -0.0896,-0.46647 -0.17466,-0.64748 -0.24609,-0.57618 z m -0.71289,11.07618 c -0.002,0.006 -0.006,0.0125 -0.008,0.0176 -0.004,0.055 6.8e-4,0.0255 -0.0195,0.0996 2.5e-4,0.005 0.002,0.0104 0.002,0.0156 0,0.0732 -0.0143,0.12485 -0.0332,0.20312 -0.0113,0.0175 -0.0276,0.0335 -0.0312,0.0527 0.004,-0.006 0.0168,-0.0258 0.0195,-0.0195 0.011,0.0249 -0.0549,0.23406 -0.0625,0.25976 -0.024,0.0883 -0.05,0.17551 -0.0762,0.26367 2.6e-4,-0.006 0.002,-0.01 0.004,-0.008 0.0287,0.0371 -0.0271,0.25895 -0.0195,0.28125 0.004,0.0488 0.007,0.0956 0.008,0.14453 -0.002,0.0417 -2.6e-4,0.0832 0,0.125 v 0.0879 0.004 c -0.008,0.0252 -0.0145,0.0509 -0.0215,0.0762 v 0.002 c 0.002,0.0368 0.004,0.0725 0.004,0.082 1.2e-4,0.0211 0.002,0.038 0.002,0.0645 0.003,0.0387 -0.009,0.0748 -0.0195,0.11133 0.005,0.13788 -0.0574,0.22592 -0.125,0.33008 0.0835,0.0945 0.18061,0.0684 0.29101,-0.20508 0.22063,-0.54677 0.21648,-1.32823 0.0859,-1.98828 z m -0.20899,0.89257 c -0.004,0.0132 -0.008,0.0259 -0.0117,0.0391 -0.004,0.008 0.008,-0.0143 0.0117,-0.0215 5.9e-4,-0.005 -1.8e-4,-0.0113 0,-0.0176 z m -0.0332,0.625 c -2.2e-4,0.005 0.002,0.0396 0.004,0.0762 10e-4,-0.0106 0.003,-0.0228 0.002,-0.0371 -0.003,-0.0337 -0.006,-0.0429 -0.006,-0.0391 z m -0.85937,5.99414 c -0.008,0.0234 -0.0159,0.0469 -0.0234,0.0703 0.002,0.0269 0.002,0.0532 0.004,0.0801 -0.0283,0.13547 -0.0318,0.27395 -0.0469,0.41016 -0.007,0.0223 -0.01,0.0373 -0.0137,0.0508 0.005,-0.01 0.008,-0.0111 0.006,0.0176 -0.004,0.0328 -0.008,0.0651 -0.0117,0.0977 -0.009,0.0485 -0.0103,0.0581 -0.0117,0.0586 l -0.002,-0.002 c 9.1e-4,-0.008 7.5e-4,-0.0188 0.002,-0.0254 -0.004,0.0217 -0.006,0.0445 -0.01,0.0664 0.1223,-0.18095 0.0363,0.0231 -0.0273,0.15625 7.7e-4,0.005 7.5e-4,0.0107 0.002,0.0156 0.003,0.0272 -7.5e-4,0.0595 -0.002,0.0859 0.006,0.0277 -0.004,0.0712 -0.0176,0.11328 v 0.002 c 0.012,0.0603 -0.005,0.13074 -0.0215,0.18945 -0.006,0.0414 -0.0152,0.0816 -0.0215,0.12305 -7.8e-4,0.005 -7.5e-4,0.0105 -0.002,0.0156 -5e-4,0.002 -7.5e-4,0.004 -0.002,0.006 -0.0107,0.0422 -0.0213,0.0845 -0.0371,0.125 -0.007,0.0181 -0.0284,0.0478 -0.0391,0.0625 -1.8e-4,0.001 -0.002,0.002 -0.002,0.004 v 0.002 c -4.1e-4,10e-4 4e-4,0.003 0,0.004 -0.002,0.006 -0.005,0.0113 -0.006,0.0176 -10e-4,0.006 -7.4e-4,0.0133 -0.002,0.0195 0.0135,-0.005 0.005,0.0196 -0.0117,0.0547 3e-5,0.017 -0.002,0.0318 -0.004,0.0469 0.0806,0.067 0.15178,0.19388 0.25781,0.0879 0.33222,-0.33222 0.36784,-1.19416 0.0781,-1.91601 -0.0141,-0.0354 -0.0213,-0.008 -0.0352,-0.0391 z m -0.0254,0.0781 c -0.005,0.0146 -0.009,0.0283 -0.0137,0.043 -0.004,0.0117 0.0119,-0.0192 0.0137,-0.0312 2.4e-4,-0.003 -3e-5,-0.008 0,-0.0117 z m -253.12305,0.64844 1.90625,2.25 c 1.04776,1.23748 2.06027,2.25 2.25,2.25 0.80024,0 0.20818,-0.80546 -1.90625,-2.59571 z m 253.00781,0.21679 c 10e-4,0.006 0.003,0.0131 0.004,0.0195 3.1e-4,-0.003 -1.2e-4,-0.005 0,-0.008 -0.002,-0.007 -0.003,-0.006 -0.004,-0.0117 z m -168.50781,0.28321 c -0.0516,-0.0514 -0.45696,0.25096 -1.25,0.87304 -0.9625,0.75489 -1.75,1.54253 -1.75,1.75 0,0.82303 0.82255,0.29249 2.12891,-1.37304 0.62194,-0.79307 0.92271,-1.19841 0.87109,-1.25 z m 168.48437,0.006 c -0.003,0.009 -0.006,0.0156 -0.01,0.0234 0.003,-0.006 0.006,-0.008 0.01,-0.0156 0,-0.002 -1.3e-4,-0.005 0,-0.008 z m -0.13671,0.50195 c -0.001,0.004 -0.001,0.0163 0.002,0.0352 4e-4,0.004 -3.1e-4,0.008 0,0.0117 0.001,-0.007 0.004,-0.012 0.004,-0.0176 -4e-5,-0.002 -3.5e-4,-0.006 0,-0.01 -3.3e-4,-0.017 -0.004,-0.0259 -0.006,-0.0195 z m -0.74415,4.21875 c -0.003,0.0104 -0.006,0.0214 -0.01,0.0312 -0.004,-0.008 -0.004,-0.0329 -0.008,-0.0254 -0.008,0.0159 0.0405,0.25133 -0.0332,0.29101 -0.0136,-0.0159 -0.0647,0.2672 -0.0723,0.25586 -0.008,-0.008 -0.0145,-0.0212 -0.0156,-0.0137 -0.0113,0.0707 0.008,0.14618 -0.0352,0.21875 -0.003,0.0189 -0.0299,0.17616 -0.0488,0.1875 -0.002,0.002 -0.002,2.8e-4 -0.002,-0.004 2.7e-4,0.0142 0.001,0.0326 -0.002,0.0234 -0.004,-0.008 -0.009,-0.0243 -0.0117,-0.0371 0.0131,0.0899 0.0137,0.0832 0.0137,0.0703 6.2e-4,0.007 0.002,0.0206 0.006,0.0605 -0.004,0.0975 10e-4,0.0781 -0.0215,0.19532 -0.004,0.0113 -0.0136,0.0179 -0.0156,0.0293 -0.002,0.0113 0.0113,0.0375 0,0.0352 -0.07,-0.0152 -0.14026,-0.0349 -0.20899,-0.0566 0.002,0.0233 0.005,0.046 0.008,0.0684 0.18515,0.0511 0.23876,0.0705 0.21485,0.13086 -0.001,0.006 -0.003,0.0102 -0.004,0.0156 0.002,-0.004 0.004,-0.008 0.006,-0.0117 -5.2e-4,0.009 -0.004,0.0287 -0.01,0.0371 0.002,-0.006 0.002,-0.0155 0.004,-0.0234 -0.005,0.008 -0.0109,0.0174 -0.0176,0.0273 0.002,3.2e-4 0.004,-3.3e-4 0.006,0 -0.004,0.006 -0.01,0.0223 -0.01,0.006 -0.001,0.002 -0.002,0.004 -0.004,0.006 -0.005,0.0269 -0.0145,0.0989 -0.041,0.27734 -0.005,0.0318 -0.008,0.0639 -0.0117,0.0957 0.0908,0.13649 0.19201,0.24547 0.32617,0.11133 0.33222,-0.33222 0.36784,-1.19416 0.0781,-1.91601 -0.0316,-0.079 -0.0502,-0.0271 -0.0801,-0.0859 z m -246.60351,0.27344 c -0.0516,0.0518 0.25111,0.45698 0.87305,1.25 1.30633,1.66575 2.12695,2.19607 2.12695,1.37304 0,-0.20749 -0.78751,-0.99515 -1.75,-1.75 -0.79304,-0.62199 -1.19838,-0.92463 -1.25,-0.87304 z m 73.81055,0 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.10003 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.89997 2.30859,-2 0.99553,-1.1 1.5857,-2 1.31055,-2 z m -41.81055,14.1289 c -0.45312,0 -0.90625,0.0703 -1.25,0.20899 -0.68753,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.93753,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79688,-0.20899 -1.25,-0.20899 z m 11,0 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m 164,75.8711 c -0.0484,-0.0484 -0.47287,0.27123 -1.17773,0.82226 -0.0616,0.10621 -0.10556,0.22375 -0.18165,0.32227 -0.0884,0.14188 -0.17234,0.29154 -0.30273,0.40039 -0.0654,0.0559 -0.0865,0.13396 -0.13867,0.20312 -0.0745,0.10583 -0.13964,0.21965 -0.22656,0.31641 -0.0745,0.0926 -0.11507,0.20509 -0.20313,0.28711 -0.0355,0.0329 -0.0818,0.0963 -0.13281,0.15039 -0.0136,0.0113 -0.18163,0.22334 -0.13477,0.15039 0.005,-0.0149 0.007,-0.0221 0.0156,-0.0449 -0.0382,0.093 -0.0986,0.16393 -0.17578,0.23242 -0.0441,0.0438 -0.0874,0.0884 -0.13086,0.13281 0.31654,0.0463 0.98607,-0.53453 1.91797,-1.72265 0.62192,-0.79302 0.92272,-1.19837 0.87109,-1.25 z m -4.18945,5 c -10e-4,0 -0.007,0.008 -0.008,0.008 -0.007,0.0126 -0.0142,0.0248 -0.0215,0.0371 -0.005,-9e-4 0.0355,-0.0449 0.0293,-0.0449 z m -0.11133,0.16992 c -0.072,0.0987 -0.15327,0.19133 -0.23438,0.28125 -0.0752,0.0729 -0.15865,0.14001 -0.21875,0.22656 -0.0714,0.0869 -0.1511,0.16439 -0.23047,0.24414 -0.0359,0.0348 -0.0772,0.0675 -0.10742,0.10156 -0.0499,0.0741 -0.10163,0.14783 -0.15039,0.22266 -0.0688,0.0843 -0.14473,0.16204 -0.2207,0.24023 -0.059,0.031 -0.12369,0.0532 -0.17774,0.0918 -0.028,0.0217 0.0643,-0.0177 0.0957,-0.0332 -8e-4,0.001 -8.8e-4,0.003 -0.002,0.004 -0.0181,0.0246 -0.0279,0.0497 -0.043,0.0762 -0.0627,0.10809 -0.12609,0.217 -0.22852,0.29297 -0.0471,0.0889 -0.12632,0.15777 -0.19141,0.23242 -0.10242,0.11376 -0.15879,0.25115 -0.25781,0.36719 l -0.13281,0.13476 c -0.0386,0.0385 -0.0767,0.0771 -0.11524,0.11524 -0.0521,0.0521 -0.10295,0.10327 -0.15625,0.15429 -0.0563,0.0533 -0.13629,0.15009 -0.20507,0.21094 -0.13153,0.12057 -0.27082,0.23182 -0.39063,0.36523 l -0.24805,0.24805 c 0.39796,-0.18962 1.14649,-0.78572 2.01563,-1.74609 0.91098,-1.00658 1.3195,-1.69478 1.19922,-1.83008 z m -4.79297,5.83008 c -0.1299,0 -1.35121,1.23357 -2.08008,1.88867 -0.0245,0.0448 -0.0528,0.0885 -0.0898,0.125 -0.0613,0.0773 -0.0928,0.17402 -0.16016,0.24609 -0.004,0.007 -0.0125,0.0207 -0.0332,0.0527 -0.0473,0.0729 -0.0991,0.14013 -0.1543,0.20703 -0.0423,0.0575 -0.0352,0.0502 -0.0937,0.11328 -0.002,0.002 -0.005,0.004 -0.008,0.006 0.009,-0.0203 0.0345,-0.075 0.0234,-0.0566 -0.0151,0.0234 -0.0258,0.0497 -0.0371,0.0762 -0.0166,0.0238 -0.0357,0.0496 -0.0508,0.0723 -0.10848,0.12812 -0.22287,0.24995 -0.34571,0.36523 -0.0748,0.0745 -0.14083,0.16023 -0.22851,0.2207 -0.027,0.0177 -0.15282,0.15679 -0.15235,0.125 -0.0386,0.0753 -0.0907,0.15108 -0.14062,0.1875 -0.0707,0.0964 -0.12382,0.20541 -0.2168,0.28516 -0.0741,0.0673 -0.11896,0.15141 -0.18359,0.22852 -0.0722,0.0722 -0.14385,0.14734 -0.2168,0.21874 -0.0752,0.0718 -0.0827,0.0638 -0.10156,0.10157 -0.0272,0.0435 -0.0557,0.0949 -0.0937,0.1289 -0.004,0.003 -0.013,-5e-5 -0.0156,0.004 -0.0306,0.0523 -0.0424,0.0773 -0.0449,0.0859 0.002,-5.4e-4 0.007,-0.004 0.0117,-0.01 -0.0185,0.0254 -0.029,0.0422 -0.0781,0.11133 -0.0744,0.0673 -0.13943,0.13598 -0.19726,0.21875 -0.0416,0.0367 -0.0716,0.0762 -0.10938,0.125 -0.0605,0.0548 -0.0941,0.13837 -0.16406,0.1875 -0.0412,0.0333 -0.0308,0.0171 -0.0742,0.084 -0.0571,0.0915 -0.13075,0.16849 -0.20898,0.24219 -0.0654,0.0654 -0.13031,0.12993 -0.19531,0.19531 -0.0434,0.044 -0.0885,0.0874 -0.13282,0.13086 0.79253,-0.72192 1.10961,-0.88495 2.16602,-1.96679 2.14821,-2.19999 3.6814,-4 3.40625,-4 z m -13.6582,13.77929 c -0.1451,0.14673 -0.28915,0.29444 -0.44141,0.4336 -0.0612,0.0556 -0.11897,0.14101 -0.17187,0.19922 -0.12208,0.13519 -0.24959,0.26609 -0.37696,0.39648 -0.15337,0.15402 -0.30333,0.31127 -0.46094,0.46094 -0.19846,0.19109 -0.38253,0.39614 -0.57226,0.5957 -0.0794,0.0775 -0.16338,0.14927 -0.23633,0.23242 0.004,-0.0113 0.0154,-0.0408 0.008,-0.0332 -0.0119,0.01 -0.0118,0.0277 -0.0156,0.0391 -0.008,0.017 -0.0198,0.0358 -0.0274,0.0547 -0.0242,0.0469 -0.05,0.0788 -0.084,0.12109 l -0.0215,0.0234 c -0.11528,0.11565 -0.2305,0.22999 -0.34766,0.34375 -0.0896,0.0903 -0.17133,0.19054 -0.27149,0.26953 -0.12849,0.10621 -0.26092,0.20951 -0.37695,0.33008 -0.0378,0.0193 -0.0754,0.0393 -0.11328,0.0586 0.002,-0.001 0.008,0.004 0.004,0.004 -0.005,0.002 -0.0126,0.007 -0.0195,0.01 -0.0443,0.0326 -0.0853,0.072 -0.125,0.10937 -0.0763,0.0771 -0.15457,0.15293 -0.23243,0.22852 -0.10582,0.1096 -0.20012,0.23357 -0.33203,0.31445 -0.0287,0.0197 -0.0595,0.034 -0.0859,0.0566 -0.0136,0.0113 -0.0298,0.0316 -0.0449,0.043 -0.0148,0.01 -0.0337,0.0204 -0.0527,0.0312 0.004,-0.004 0.008,-0.007 0.004,-0.006 -0.009,0.005 -0.019,0.0114 -0.0273,0.0195 0.007,-0.004 0.0138,-0.007 0.0215,-0.0117 -0.004,0.003 -0.008,0.006 -0.01,0.008 -0.01,0.005 -0.01,0.005 -0.0156,0.008 -0.0287,0.0301 -0.0524,0.075 -0.0723,0.0976 -0.0778,0.0296 -0.16107,0.0477 -0.23633,0.082 -0.0106,0.0129 -0.0189,0.0244 -0.0293,0.0371 0.0313,-0.002 0.0786,-0.009 0.10157,-0.0156 0.0463,-0.0146 0.0823,-0.0484 0.0957,-0.0625 -0.007,0.0101 -0.0231,0.0309 -0.0469,0.0684 -0.1081,0.15194 -0.11798,0.14777 -0.28126,0.26758 -0.008,0.004 0.01,-0.005 0.0176,-0.008 0.0329,-0.017 0.0558,-0.0493 0.0898,-0.0645 -0.005,0.006 -0.0247,0.0267 -0.0332,0.0352 -0.0578,0.0643 -0.11398,0.12797 -0.16992,0.19336 -0.12599,0.15316 -0.27309,0.27255 -0.42969,0.38086 -0.11062,0.17566 -0.78711,0.86914 -0.71875,0.86914 0.27515,0 2.02487,-1.57501 3.89063,-3.5 1.45024,-1.49628 1.95494,-2.22262 2.24805,-2.72071 z m -4.42578,4.33985 c 10e-4,-10e-4 0.003,-0.003 0.004,-0.004 -0.004,0.002 -0.0102,0.006 -0.0137,0.008 0.002,-0.001 0.006,-0.002 0.01,-0.004 z m 0.90039,-0.80078 c 0.005,-0.004 0.01,-0.01 0.0156,-0.0137 -0.0208,0.0106 -0.0423,0.0192 -0.0625,0.0312 0.009,-0.003 0.0294,-0.01 0.0469,-0.0176 z m -6.03711,4.79101 c -0.0165,0.004 -0.088,0.0838 -0.10743,0.0918 0.0377,-0.0289 0.0736,-0.0596 0.10743,-0.0918 z m -0.82227,1.33594 c -0.0122,0.01 -0.0251,0.019 -0.0371,0.0293 -0.0933,0.0911 -0.1792,0.18713 -0.28125,0.26953 -0.0567,0.0461 -0.12186,0.0804 -0.17969,0.125 -0.0355,0.0272 -0.0695,0.0595 -0.10351,0.0859 -0.12246,0.0956 -0.23736,0.18184 -0.37305,0.25781 -0.0518,0.0291 -0.11216,0.0421 -0.16016,0.0762 -0.0219,0.0166 -0.0416,0.0436 -0.0605,0.0625 -0.12435,0.1251 -0.25148,0.26432 -0.41211,0.3418 -0.0552,0.0215 -0.0178,0.003 -0.082,0.0625 -0.10167,0.095 -0.20936,0.19482 -0.33594,0.25586 -0.2306,0.35501 -0.78244,0.98828 -0.64648,0.98828 0.27477,0 1.3131,-0.90001 2.30859,-2 0.27604,-0.30504 0.15937,-0.29534 0.36328,-0.55469 z m -96.94531,45.67773 c -0.34742,-0.0151 -0.74453,0.049 -1.10547,0.19336 -0.79771,0.31937 -0.55946,0.55552 0.60547,0.60352 1.05399,0.0435 1.64472,-0.19126 1.3125,-0.52344 -0.16615,-0.1663 -0.46511,-0.2587 -0.8125,-0.27344 z m -62.48438,1.53321 c -4.1e-4,0.0227 0.001,0.0258 -0.002,0.0371 7.3e-4,-0.0113 0.002,-0.022 0.002,-0.0371 z m 49.56641,0.47265 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m -10,0.99219 c -0.63438,0 -1.26875,0.0636 -1.75,0.18945 -0.9625,0.25134 -0.17499,0.45702 1.75,0.45704 1.92499,0 2.71249,-0.20558 1.75,-0.45704 -0.48125,-0.12585 -1.11563,-0.18945 -1.75,-0.18945 z" />
            <path
               id="path4502"
               style="fill:#4bd8b0;stroke-width:0.264583"
               d="m 78.409167,33.427934 v 8.598958 8.598959 h 1.396296 c 1.67045,0 2.362314,0.421809 3.171383,1.935281 0.553069,1.034532 0.591696,1.436505 0.591696,6.13451 0,4.425479 -0.06079,5.149395 -0.507979,6.050275 -0.66484,1.339421 -1.804567,2.017183 -3.394625,2.018482 l -1.256771,0.0011 v 4.365624 4.365625 l 0.859896,0.0036 c 0.47294,0.0021 1.62306,0.183825 2.555399,0.403593 6.238279,1.470467 10.872205,7.386849 10.872205,13.88029 0,6.476939 -4.649774,12.413039 -10.872205,13.879769 -0.932339,0.21977 -2.082459,0.40159 -2.555399,0.40359 l -0.859896,0.004 v 5.15937 5.15938 h 1.692402 c 1.600351,0 1.736222,0.0499 2.499074,0.9188 1.152319,1.31241 1.361739,2.39301 1.363739,7.03782 0.0016,4.68244 -0.33075,6.15985 -1.630391,7.2533 -0.649579,0.54658 -1.069528,0.66508 -2.357477,0.66508 h -1.567347 v 7.9375 7.9375 h 1.295011 c 5.724551,0 13.676865,-1.66565 19.718176,-4.12999 C 125.02184,131.56707 139.22975,104.69062 133.42183,77.693964 129.16818,57.922072 113.65565,41.335846 94.122419,35.675342 89.8224,34.429244 83.397039,33.427934 79.704178,33.427934 Z m -2.677872,0.02945 c -0.0061,0 -0.01143,0.0011 -0.01757,0.0011 0.01029,5.8e-5 0.02072,1e-5 0.03101,0 -0.0051,-1.9e-5 -0.0084,-0.0011 -0.01344,-0.0011 z m -0.686263,0.03617 c -0.0019,1.72e-4 -0.0039,-1.3e-5 -0.0057,5.3e-4 0.0013,-2.4e-5 0.0033,-8e-6 0.0052,0 z m 1.549776,0.04496 c -7.94e-4,0.005 -0.0016,0.01037 -0.0026,0.01601 0.01479,-0.005 0.0042,-0.01042 0.0026,-0.01601 z m -6.808888,0.5364 c -0.0019,2.23e-4 -0.0034,7.94e-4 -0.0052,0.0011 2.64e-4,2.62e-4 7.93e-4,5.29e-4 0.0011,0.0011 h 5.29e-4 c 0.0021,-5.29e-4 0.0029,-0.0011 0.0036,-0.0016 z m -0.04806,0.07648 c -2.64e-4,0.0024 1.38e-4,0.0044 -5.29e-4,0.0067 5.29e-4,8.2e-5 0.0013,-7.9e-5 0.0021,0 -5.3e-4,-0.0021 -0.0011,-0.0045 -0.0016,-0.0067 z m -1.358572,0.141078 c -0.02498,0.0069 -0.04977,0.0033 -0.0739,0.01291 -0.0071,0.0029 -0.0013,0.0044 -0.0078,0.0072 0.02787,-0.0068 0.05289,-0.01294 0.08165,-0.02016 z m 0.436666,0.04289 c -0.0083,0.0034 -0.01132,0.0039 -0.01963,0.0072 -0.0084,0.0051 -0.01349,0.0088 -0.0067,0.0078 0.0073,-0.0013 0.01469,-0.0028 0.0217,-0.0052 -0.0024,-0.0039 0.0079,-0.0058 0.0047,-0.0098 z m 56.606366,7.257955 c 0.002,0.0028 0.005,0.0093 0.007,0.01394 -0.002,-0.0046 -0.004,-0.0086 -0.007,-0.01394 z m -20.00188,15.911692 c 1.01859,0 1.24821,0.149865 3.14141,2.050521 2.80924,2.820302 2.97395,4.177467 0.83406,6.866763 -1.54378,1.940131 -5.40648,5.532448 -6.6089,6.145879 -0.59923,0.305702 -1.58254,0.547254 -2.22674,0.547254 -0.946597,0 -1.357537,-0.174734 -2.290818,-0.973585 -0.62553,-0.535432 -1.59938,-1.558166 -2.164209,-2.272728 -1.950009,-2.466952 -1.367925,-4.041273 3.125909,-8.454782 3.299048,-3.240201 4.358418,-3.909322 6.189288,-3.909322 z M 76.270797,75.529238 c -0.09192,-0.0038 -0.196991,0.01294 -0.292489,0.05116 -0.211061,0.08446 -0.148035,0.146981 0.160197,0.159681 0.278961,0.01148 0.435163,-0.05057 0.347266,-0.138493 -0.04396,-0.04396 -0.123061,-0.06856 -0.214974,-0.07235 z m 34.452683,8.698696 c 4.54168,0 6.03056,0.296462 7.24658,1.443323 l 0.92036,0.868161 v 3.041677 c 0,3.451325 -0.23815,4.007096 -2.13114,4.972822 -0.90909,0.463786 -1.56039,0.521449 -5.86166,0.516247 -4.12703,-0.0049 -4.9952,-0.07748 -5.89783,-0.491958 -1.90931,-0.876763 -2.10511,-1.290609 -2.20451,-4.654497 l -0.0879,-2.98173 0.84026,-0.957048 c 1.2181,-1.387338 2.7273,-1.756997 7.17579,-1.756997 z m -46.505179,3.001883 c -0.0401,-0.0061 -0.06751,0.09055 -0.07545,0.283186 -0.01148,0.278916 0.05109,0.435186 0.139009,0.347265 0.08791,-0.08792 0.09736,-0.315949 0.02066,-0.506944 -0.03167,-0.07915 -0.06017,-0.119864 -0.08423,-0.123507 z m 0,4.497916 c -0.0401,-0.0061 -0.06751,0.09055 -0.07545,0.283186 -0.01148,0.278916 0.05109,0.435187 0.139009,0.347266 0.08791,-0.08792 0.09736,-0.315952 0.02066,-0.506944 -0.03167,-0.07915 -0.06017,-0.119864 -0.08423,-0.123508 z m 12.052496,12.111917 c -0.09192,-0.004 -0.196991,0.013 -0.292489,0.0512 -0.211061,0.0845 -0.148035,0.14699 0.160197,0.15969 0.278961,0.0115 0.435163,-0.0506 0.347266,-0.1385 -0.04396,-0.044 -0.123061,-0.0685 -0.214974,-0.0724 z m 24.225913,2.35025 c 0.42287,0.003 0.90362,0.12435 1.56218,0.31729 0.82991,0.24306 1.86617,1.07694 4.35632,3.50573 3.52708,3.44005 4.31239,4.60155 4.33979,6.41615 0.0166,1.10065 -0.0906,1.28052 -1.81023,3.02514 -1.00545,1.02007 -2.14953,2.02439 -2.54248,2.2319 -1.0953,0.57839 -2.34056,0.37398 -4.01009,-0.65784 -1.30017,-0.80355 -6.324755,-6.08765 -6.859015,-7.21351 -0.250399,-0.52768 -0.455268,-1.46993 -0.455268,-2.09341 0,-1.06784 0.127735,-1.26101 2.199865,-3.33314 1.639281,-1.63927 2.288621,-2.20524 3.218928,-2.19831 z m -66.537542,18.2547 c -0.0046,0.005 0.0613,0.0851 0.07752,0.1111 0.0083,-0.009 0.01667,-0.0245 0.02532,-0.0393 -0.02262,-0.0136 -0.09859,-0.0761 -0.102835,-0.0718 z m 1.475361,1.69602 c -0.02635,7.9e-4 -0.05271,0.001 -0.07906,0.002 l 0.07958,0.094 c 0.02405,-0.0115 0.04827,-0.0227 0.07235,-0.0341 z m 4.113445,4.34599 c -0.03576,0.0227 -0.07191,0.045 -0.108521,0.0661 0.009,0.008 0.03795,0.0399 0.04651,0.0475 0.03719,-0.0255 0.07046,-0.0504 0.10077,-0.0749 -0.0046,-0.005 -0.03331,-0.0326 -0.03876,-0.0387 z m 1.671215,1.44435 c -0.0055,0.01 -0.0113,0.0192 -0.01654,0.0289 0.01101,-0.005 0.02159,-0.0105 0.03256,-0.0155 z m 0.272851,0.231 c -0.01029,0.0454 -0.02037,0.0908 -0.03255,0.13539 l 0.01085,0.0134 c 0.0614,-0.0308 0.103552,-0.0403 0.137459,-0.046 -0.02043,-0.0175 -0.02021,-0.022 -0.04186,-0.0403 z m 24.450188,12.42508 c -0.0044,-1.2e-4 -0.0095,0.003 -0.01394,0.003 0.0036,0.001 0.0072,0.003 0.01085,0.004 0.0011,-0.002 0.0021,-0.004 0.0031,-0.006 z m 4.908743,0.93328 c -1.08e-4,0.006 2.25e-4,0.007 -5.29e-4,0.01 1.93e-4,-0.003 5.29e-4,-0.006 5.29e-4,-0.01 z" />
            <path
               id="path4500"
               style="fill:#46b898;stroke-width:0.999999"
               transform="scale(0.26458333)"
               d="m 475.39062,156.32031 c -0.0247,0.0174 -0.0484,0.0343 -0.0723,0.0527 l 0.23242,0.26172 c 0.0517,-0.0152 0.1018,-0.0291 0.14844,-0.0449 z m -1.35351,0.88281 c 0.007,0.0106 0.0207,0.0353 0.0254,0.0527 -0.009,-0.0173 -0.0149,-0.0326 -0.0254,-0.0527 z m -177.6875,34.13868 v 30.5 30.5 l 4.75,-0.004 c 6.00967,-0.005 10.3173,-2.56653 12.83008,-7.62891 1.69016,-3.40515 1.91992,-6.14096 1.91992,-22.86718 0,-17.75624 -0.14614,-19.27355 -2.23633,-23.1836 -3.0579,-5.72021 -5.67282,-7.3164 -11.98633,-7.3164 z m 102.08984,26 c -6.91982,0 -10.92349,2.52896 -23.39257,14.77539 -16.98456,16.68098 -19.18457,22.63118 -11.81446,31.95508 2.13479,2.70072 5.81548,6.56616 8.17969,8.58984 3.52736,3.01928 5.08054,3.67969 8.6582,3.67969 6.19699,0 11.22474,-2.94489 21.02539,-12.31836 14.80422,-14.15895 18.95944,-20.80323 17.54688,-28.04883 -0.4122,-2.11453 -3.1203,-5.65253 -8.33008,-10.88281 -7.1554,-7.18358 -8.02326,-7.75 -11.87305,-7.75 z m 20.04297,101 c -16.81319,0 -22.51725,1.39714 -27.12109,6.64062 l -3.17578,3.61719 0.33203,11.26953 c 0.37553,12.71391 1.1157,14.27805 8.33203,17.5918 3.41144,1.56653 6.69248,1.84085 22.29101,1.85937 16.25666,0.0195 18.71837,-0.19829 22.1543,-1.95117 7.15457,-3.64999 8.05469,-5.75054 8.05469,-18.79492 v -11.4961 l -3.47852,-3.28124 c -4.59602,-4.33458 -10.22326,-5.45508 -27.38867,-5.45508 z m -38.65234,83.00195 c -3.51611,-0.0262 -5.97031,2.11288 -12.16602,8.30859 -7.83167,7.83168 -8.31445,8.56368 -8.31445,12.59961 0,6.52902 2.5108,10.57417 13.84961,22.31055 10.40746,10.77237 14.7771,14.23196 19.91601,15.7793 6.58145,1.98172 9.16215,0.75491 18.64454,-8.86524 6.49931,-6.59384 6.90453,-7.27117 6.84179,-11.43164 -0.10367,-6.85833 -3.07165,-11.24778 -16.40234,-24.25 -9.41159,-9.17968 -13.32798,-12.33089 -16.46484,-13.25 -2.48903,-0.72921 -4.30607,-1.18926 -5.9043,-1.20117 z m -83.48047,30.99414 v 30 30 h 5.92383 c 4.86784,0 6.45505,-0.44786 8.91015,-2.51367 4.91203,-4.13318 6.16967,-9.71665 6.16211,-27.41406 -0.006,-17.55519 -0.79907,-21.63932 -5.15429,-26.59961 -2.88322,-3.28369 -3.39675,-3.47266 -9.44532,-3.47266 z m 14.29687,161.61133 c 0.0248,-1.4e-4 0.0435,0.003 0.0527,0.004 -0.008,0 -0.0277,-0.002 -0.0527,-0.004 z" />
            <path
               id="path4498"
               style="fill:#1ece9d;stroke-width:0.264583"
               d="m 78.409166,33.453771 -2.315104,0.133326 c -8.406389,0.484984 -15.004251,2.161196 -22.125265,5.620329 -4.031568,1.958391 -8.259675,4.629714 -11.172444,7.058999 -11.037133,9.205113 -17.924359,21.442867 -20.098515,35.71255 -0.594167,3.899506 -0.593686,11.66213 0.0016,15.610417 1.777341,11.793908 6.819557,22.254908 14.824935,30.756778 9.602388,10.19793 23.080184,16.59719 36.916093,17.52761 0.15308,0.0103 0.186272,0.0125 0.337962,0.0227 5.3e-4,3e-5 5.3e-4,-3e-5 0.0011,0 h 0.0062 0.01035 0.0052 c 0.01572,0 0.03012,0.001 0.04289,0.004 5.29e-4,3e-5 5.29e-4,5.2e-4 0.0011,5.2e-4 1.327639,0.0892 2.680665,0.1796 2.96881,0.19896 l 0.595312,0.0403 v -7.9375 -7.9375 h -1.481613 c -1.323171,0 -1.574864,-0.0933 -2.353861,-0.8723 -1.229331,-1.22934 -1.453494,-2.36434 -1.44849,-7.32979 0.0037,-3.68864 0.08037,-4.53418 0.497125,-5.45186 0.80141,-1.7647 1.469396,-2.22105 3.249414,-2.22105 h 1.537201 v -5.15938 -5.15937 h -1.130165 c -4.563203,0 -10.004303,-3.79268 -11.966194,-8.340579 -1.927288,-4.467672 -1.467646,-10.153634 1.125514,-13.922663 2.56091,-3.722153 7.026706,-6.31176 10.884606,-6.31176 h 1.086239 v -4.365625 -4.365625 l -1.256771,-0.0011 c -1.590061,-0.0013 -2.729785,-0.679061 -3.394625,-2.018482 -0.422579,-0.851355 -0.522663,-1.734929 -0.596863,-5.256525 -0.107339,-5.091147 0.163385,-6.631778 1.396299,-7.93905 0.795509,-0.843484 1.002408,-0.924491 2.362128,-0.924491 h 1.489832 V 42.039809 Z M 51.565327,57.505017 c 1.789777,0 2.846131,0.699648 6.26215,4.148066 4.533945,4.576945 4.879555,5.794854 2.45463,8.653219 -0.802151,0.945528 -1.802778,1.964264 -2.223638,2.263944 -0.988144,0.70362 -2.732857,0.696762 -4.084505,-0.01601 -1.172342,-0.618432 -5.060786,-4.258625 -6.554636,-6.136058 -1.257523,-1.580417 -1.698509,-3.043152 -1.290363,-4.279841 0.174691,-0.529323 1.089607,-1.644558 2.264463,-2.760557 1.848239,-1.755651 2.046552,-1.872753 3.171899,-1.872753 z m -5.469951,26.722917 c 4.242449,0 5.880444,0.370773 7.056933,1.597834 0.748466,0.780608 0.786929,0.93744 0.872299,3.546554 0.112231,3.429934 -0.192529,4.145 -2.156973,5.059638 -1.286854,0.599152 -1.658877,0.638622 -6.002219,0.635622 -5.116737,-0.0036 -6.219486,-0.260543 -7.362859,-1.714109 -0.513964,-0.653404 -0.574641,-1.051038 -0.574641,-3.772378 v -3.041677 l 0.920356,-0.868161 c 1.216023,-1.146861 2.705412,-1.443323 7.247104,-1.443323 z m 10.221598,21.960416 c 0.930365,0 1.224777,0.20105 3.223577,2.19986 2.062576,2.06257 2.199865,2.26937 2.199865,3.31763 0,0.61527 -0.250896,1.61009 -0.558107,2.21227 -0.694399,1.36113 -5.553429,6.39427 -6.982518,7.23263 -1.092509,0.64091 -2.875261,1.01033 -3.571875,0.74053 -0.66761,-0.25856 -4.262077,-3.88744 -4.53409,-4.5775 -0.172516,-0.4376 -0.151704,-1.08273 0.06408,-1.98438 0.285639,-1.19348 0.672238,-1.69538 3.627168,-4.70617 3.475477,-3.54117 4.792231,-4.43487 6.5319,-4.43487 z m 12.946496,39.33197 c -1.08e-4,0.006 -1.06e-4,0.007 -5.29e-4,0.01 1.93e-4,-0.003 5.29e-4,-0.006 5.29e-4,-0.01 z" />
            <path
               id="path4496"
               style="fill:#17a57e;stroke-width:0.999999"
               transform="scale(0.26458333)"
               d="m 290.71875,191.3418 c -5.13914,0 -5.92108,0.30618 -8.92773,3.49414 -4.65982,4.94087 -5.68304,10.76373 -5.27735,30.00586 0.37807,17.93176 1.57115,22.14676 7.25586,25.61328 1.86849,1.13943 4.94845,1.88082 7.83008,1.88281 l 4.75,0.004 v -30.5 -30.5 z m -95.82617,26 c -4.25328,0 -5.00281,0.44259 -11.98828,7.07812 -4.4404,4.21795 -7.89835,8.43302 -8.5586,10.4336 -1.5426,4.67411 0.12414,10.20255 4.87696,16.17578 5.64605,7.09581 20.34252,20.85402 24.77343,23.1914 5.10859,2.69487 11.70278,2.71995 15.4375,0.0605 1.59065,-1.13265 5.37255,-4.98299 8.4043,-8.55664 9.16507,-10.80327 7.85883,-15.40639 -9.27734,-32.70508 -12.91094,-13.03339 -16.90346,-15.67773 -23.66797,-15.67773 z m -20.67383,101 c -17.16545,0 -22.79464,1.1205 -27.39063,5.45508 l -3.47851,3.28124 v 11.4961 c 0,13.17921 1.04516,15.52075 8.42187,18.87109 3.46876,1.57543 6.69478,1.85465 21.57813,1.86524 16.41578,0.0114 17.82185,-0.13783 22.68555,-2.40235 7.42467,-3.4569 8.57652,-6.15951 8.15234,-19.12304 -0.32266,-9.86122 -0.46803,-10.45397 -3.29688,-13.4043 -4.44674,-4.63771 -10.63742,-6.03906 -26.67187,-6.03906 z m 38.63281,83 c -6.57513,0 -11.55184,3.37777 -24.6875,16.76172 -11.16824,11.37936 -12.6294,13.2761 -13.70898,17.7871 -0.81555,3.40782 -0.89421,5.84594 -0.24219,7.5 1.02808,2.60811 14.61347,16.32355 17.13672,17.30079 2.63287,1.01971 9.37083,-0.37649 13.5,-2.79883 5.40128,-3.16861 23.76612,-22.19151 26.39062,-27.33594 1.16111,-2.27596 2.10938,-6.0359 2.10938,-8.36133 0,-3.96193 -0.51889,-4.74352 -8.31445,-12.53906 -7.55451,-7.55456 -8.66726,-8.31445 -12.1836,-8.31445 z m 77.6875,31 c -6.72763,0 -9.2523,1.72483 -12.28125,8.39453 -1.57523,3.46843 -1.86379,6.66415 -1.8789,20.60547 -0.0187,18.76705 0.82832,23.05684 5.47461,27.70312 2.94425,2.94429 3.89552,3.29688 8.89648,3.29688 h 5.59961 v -30 -30 z" />
          </g>
        </svg>
        `;
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

  async getBinary(filename, name, offset = 0, count) {
    //console.info("Data:", data)
    let binary = Kawix.$binaryMetadata.get(filename);

    if (!binary) {
      let mod = await this.import(filename);
      binary = mod.__binary;

      if (binary) {
        Kawix.$binaryMetadata.set(filename, binary);
      }
    }

    if (binary) {
      let meta = binary.metadata[name];

      if (meta) {
        let boffset = meta.offset + binary.offset;
        let fd = binary.fd || 0,
            buffer = null;

        try {
          if (!fd) {
            fd = await new Promise(function (a, b) {
              _fs.default.open(binary.filename, "r", function (er, fd) {
                if (er) return b(er);
                return a(fd);
              });
            });
            if (_os.default.platform() != "win32") binary.fd = fd;
          }

          if (count == undefined) count = meta.length;
          let len = Math.min(meta.length, count);
          buffer = Buffer.allocUnsafe(len);
          await new Promise(function (a, b) {
            _fs.default.read(fd, buffer, 0, buffer.length, boffset + offset, function (er, fd) {
              if (er) return b(er);
              return a(fd);
            });
          });
        } catch (e) {
          throw e;
        } finally {
          if (fd && _os.default.platform() == "win32") {
            await new Promise(function (a, b) {
              _fs.default.close(fd, function (er) {
                if (er) return b(er);
                return a();
              });
            });
          }
        }

        return buffer;
      }
    }
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

  async importFromInfo(info) {
    if (info.builtin) {
      return info.exports;
    }

    if (info.mode == "yarn") {
      var m = null;

      for (let item of info.items) {
        if (!m) m = require(item.main);
      }

      return m;
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
          let exp = await this.importFromInfo(itemInfo);
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
  }

  async import(request, parent = null, scope = null) {
    let cache = this.$getCachedExports(request);
    if (cache) return cache.data;
    let info = await this.importInfo(request, parent, scope);
    return await this.importFromInfo(info);
  }

  async importInfo(request, parent = null, scope = null, props = {}) {
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
        result = await this.$importInfo(resolv, parent, scope, props);
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

  async $importInfo(resolv, parent, scope, props) {
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
            let result = await this.defaultCompile(mod1, props, scope);
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
      let items = await reg.resolve(name);
      if (!(items instanceof Array)) items = [items]; //return await reg.require(name)

      return {
        module: null,
        mode: 'yarn',
        items
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
        meta = Object.assign(meta || {}, props);
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
          url: "file://" + filename,
          main: meta === null || meta === void 0 ? void 0 : meta.main
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
      let kitems = {};

      for (let i = 0; i < requires.length; i++) {
        let parts = requires[i].split("/");

        if (kitems[parts[0]]) {
          let location = {};

          if (parts.length == 1) {
            location.main = kitems[parts[0]].main;
          } else {
            location.main = _path.default.join(kitems[parts[0]].folder, parts.slice(1).join("/"));
          }

          preloadedModules.push({
            mode: 'node',
            location
          });
        } else {
          let imInfo = await this.importInfo(requires[i], module, scope);

          if (imInfo.mode == "yarn") {
            for (let item of imInfo.items) {
              kitems[item.name] = item;
            }
          }

          preloadedModules.push(imInfo);
        }
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
    let offset = 0,
        yet = false;

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
        if (!yet) offset++;
      } else {
        yet = true;
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

_defineProperty(Kawix, "$binaryMetadata", new Map());

async function BinaryTypescript(filename, module, options) {
  let fd = _fs.default.openSync(filename, "r");

  let buffer = Buffer.allocUnsafe(500);

  _fs.default.readSync(fd, buffer, 0, 500, 0);

  let str = buffer.toString('binary');
  let lines = str.split("\n");
  let line = lines[0],
      offset = 0;

  if (line.startsWith("#!")) {
    offset += line.length + 1;
    line = lines[1];
  }

  offset += line.length + 1;
  let bytes = Buffer.from(line, "binary");
  let sourceLen = bytes.readInt32LE(0);
  let binaryMetaLen = bytes.readInt32LE(4);
  buffer = Buffer.allocUnsafe(sourceLen);

  _fs.default.readSync(fd, buffer, 0, buffer.length, offset);

  let source = buffer.toString();
  offset += sourceLen + 1;
  buffer = Buffer.allocUnsafe(binaryMetaLen);

  _fs.default.readSync(fd, buffer, 0, buffer.length, offset); //console.info(binaryMetaLen, buffer.toString())


  let metadata = JSON.parse(buffer.toString());
  let binary = {
    metadata,
    start: offset,
    length: 0,
    filename
  };

  let stat = _fs.default.fstatSync(fd);

  binary.length = stat.size - binary.start;
  source += `\n;exports.__binary = ${JSON.stringify(binary)}`;
  let cmeta = Kawix.$binaryMetadata.get(filename);

  if (cmeta !== null && cmeta !== void 0 && cmeta.fd) {
    _fs.default.closeSync(cmeta.fd);
  } //console.info(filename, binary)


  Kawix.$binaryMetadata.set(filename, binary);
  return await processTypescript(filename, source, options);
}

async function Typescript(filename, module, options) {
  let content = _fs.default.readFileSync(filename, "utf8"); // strip - bom  & bash env


  content = content.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm, "");

  if (content.startsWith("#!")) {
    let i = content.indexOf("\r");
    if (i < 0) i = content.indexOf("\n");
    if (i > 0) content = content.substring(i + 1);
    if (content[0] == "\n") content = content.substring(1);
  }

  return await processTypescript(filename, content, options);
}

async function processTypescript(filename, source, options) {
  if (source.startsWith("// ESBUILD PACKAGE")) {
    module["_compile"](source, filename);
  } else {
    let info = await global.kawix.compileSource(source, Object.assign({}, options, {
      filename
    }));
    return info;
  }
}

KModule.addExtensionLoader(".ts", {
  compile: Typescript
});
KModule.addExtensionLoader(".kwb", {
  compile: BinaryTypescript
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
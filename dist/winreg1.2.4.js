// ../../../../.kawi/packages/762dea0556f8631b7056a919b23156c5/node_modules/winreg/lib/registry.js
var util = require("util");
var path = require("path");
var spawn = require("child_process").spawn;
var log = function() {
};
var HKLM = "HKLM";
var HKCU = "HKCU";
var HKCR = "HKCR";
var HKU = "HKU";
var HKCC = "HKCC";
var HIVES = [HKLM, HKCU, HKCR, HKU, HKCC];
var REG_SZ = "REG_SZ";
var REG_MULTI_SZ = "REG_MULTI_SZ";
var REG_EXPAND_SZ = "REG_EXPAND_SZ";
var REG_DWORD = "REG_DWORD";
var REG_QWORD = "REG_QWORD";
var REG_BINARY = "REG_BINARY";
var REG_NONE = "REG_NONE";
var REG_TYPES = [REG_SZ, REG_MULTI_SZ, REG_EXPAND_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_NONE];
var DEFAULT_VALUE = "";
var KEY_PATTERN = /(\\[a-zA-Z0-9_\s]+)*/;
var PATH_PATTERN = /^(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG)(.*)$/;
var ITEM_PATTERN = /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/;
function ProcessUncleanExitError(message, code) {
  if (!(this instanceof ProcessUncleanExitError))
    return new ProcessUncleanExitError(message, code);
  Error.captureStackTrace(this, ProcessUncleanExitError);
  this.__defineGetter__("name", function() {
    return ProcessUncleanExitError.name;
  });
  this.__defineGetter__("message", function() {
    return message;
  });
  this.__defineGetter__("code", function() {
    return code;
  });
}
util.inherits(ProcessUncleanExitError, Error);
function captureOutput(child) {
  var output = { "stdout": "", "stderr": "" };
  child.stdout.on("data", function(data) {
    output["stdout"] += data.toString();
  });
  child.stderr.on("data", function(data) {
    output["stderr"] += data.toString();
  });
  return output;
}
function mkErrorMsg(registryCommand, code, output) {
  var stdout = output["stdout"].trim();
  var stderr = output["stderr"].trim();
  var msg = util.format("%s command exited with code %d:\n%s\n%s", registryCommand, code, stdout, stderr);
  return new ProcessUncleanExitError(msg, code);
}
function convertArchString(archString) {
  if (archString == "x64") {
    return "64";
  } else if (archString == "x86") {
    return "32";
  } else {
    throw new Error("illegal architecture: " + archString + " (use x86 or x64)");
  }
}
function pushArch(args, arch) {
  if (arch) {
    args.push("/reg:" + convertArchString(arch));
  }
}
function getRegExePath() {
  if (process.platform === "win32") {
    return path.join(process.env.windir, "system32", "reg.exe");
  } else {
    return "REG";
  }
}
function RegistryItem(host, hive, key, name, type, value, arch) {
  if (!(this instanceof RegistryItem))
    return new RegistryItem(host, hive, key, name, type, value, arch);
  var _host = host, _hive = hive, _key = key, _name = name, _type = type, _value = value, _arch = arch;
  this.__defineGetter__("host", function() {
    return _host;
  });
  this.__defineGetter__("hive", function() {
    return _hive;
  });
  this.__defineGetter__("key", function() {
    return _key;
  });
  this.__defineGetter__("name", function() {
    return _name;
  });
  this.__defineGetter__("type", function() {
    return _type;
  });
  this.__defineGetter__("value", function() {
    return _value;
  });
  this.__defineGetter__("arch", function() {
    return _arch;
  });
}
util.inherits(RegistryItem, Object);
function Registry(options) {
  if (!(this instanceof Registry))
    return new Registry(options);
  var _options = options || {}, _host = "" + (_options.host || ""), _hive = "" + (_options.hive || HKLM), _key = "" + (_options.key || ""), _arch = _options.arch || null;
  this.__defineGetter__("host", function() {
    return _host;
  });
  this.__defineGetter__("hive", function() {
    return _hive;
  });
  this.__defineGetter__("key", function() {
    return _key;
  });
  this.__defineGetter__("path", function() {
    return (_host.length == 0 ? "" : "\\\\" + _host + "\\") + _hive + _key;
  });
  this.__defineGetter__("arch", function() {
    return _arch;
  });
  this.__defineGetter__("parent", function() {
    var i = _key.lastIndexOf("\\");
    return new Registry({
      host: this.host,
      hive: this.hive,
      key: i == -1 ? "" : _key.substring(0, i),
      arch: this.arch
    });
  });
  if (HIVES.indexOf(_hive) == -1)
    throw new Error("illegal hive specified.");
  if (!KEY_PATTERN.test(_key))
    throw new Error("illegal key specified.");
  if (_arch && _arch != "x64" && _arch != "x86")
    throw new Error("illegal architecture specified (use x86 or x64)");
}
Registry.HKLM = HKLM;
Registry.HKCU = HKCU;
Registry.HKCR = HKCR;
Registry.HKU = HKU;
Registry.HKCC = HKCC;
Registry.HIVES = HIVES;
Registry.REG_SZ = REG_SZ;
Registry.REG_MULTI_SZ = REG_MULTI_SZ;
Registry.REG_EXPAND_SZ = REG_EXPAND_SZ;
Registry.REG_DWORD = REG_DWORD;
Registry.REG_QWORD = REG_QWORD;
Registry.REG_BINARY = REG_BINARY;
Registry.REG_NONE = REG_NONE;
Registry.REG_TYPES = REG_TYPES;
Registry.DEFAULT_VALUE = DEFAULT_VALUE;
Registry.prototype.values = function values(cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["QUERY", this.path];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), buffer = "", self = this, error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("QUERY", code, output), null);
    } else {
      var items = [], result = [], lines = buffer.split("\n"), lineNumber = 0;
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i].trim();
        if (line.length > 0) {
          log(line);
          if (lineNumber != 0) {
            items.push(line);
          }
          ++lineNumber;
        }
      }
      for (var i = 0, l = items.length; i < l; i++) {
        var match = ITEM_PATTERN.exec(items[i]), name, type, value;
        if (match) {
          name = match[1].trim();
          type = match[2].trim();
          value = match[3];
          result.push(new RegistryItem(self.host, self.hive, self.key, name, type, value, self.arch));
        }
      }
      cb(null, result);
    }
  });
  proc.stdout.on("data", function(data) {
    buffer += data.toString();
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.keys = function keys(cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["QUERY", this.path];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), buffer = "", self = this, error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("QUERY", code, output), null);
    }
  });
  proc.stdout.on("data", function(data) {
    buffer += data.toString();
  });
  proc.stdout.on("end", function() {
    var items = [], result = [], lines = buffer.split("\n");
    for (var i = 0, l = lines.length; i < l; i++) {
      var line = lines[i].trim();
      if (line.length > 0) {
        log(line);
        items.push(line);
      }
    }
    for (var i = 0, l = items.length; i < l; i++) {
      var match = PATH_PATTERN.exec(items[i]), hive, key;
      if (match) {
        hive = match[1];
        key = match[2];
        if (key && key !== self.key) {
          result.push(new Registry({
            host: self.host,
            hive: self.hive,
            key,
            arch: self.arch
          }));
        }
      }
    }
    cb(null, result);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.get = function get(name, cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["QUERY", this.path];
  if (name == "")
    args.push("/ve");
  else
    args = args.concat(["/v", name]);
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), buffer = "", self = this, error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("QUERY", code, output), null);
    } else {
      var items = [], result = null, lines = buffer.split("\n"), lineNumber = 0;
      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i].trim();
        if (line.length > 0) {
          log(line);
          if (lineNumber != 0) {
            items.push(line);
          }
          ++lineNumber;
        }
      }
      var item = items[items.length - 1] || "", match = ITEM_PATTERN.exec(item), name2, type, value;
      if (match) {
        name2 = match[1].trim();
        type = match[2].trim();
        value = match[3];
        result = new RegistryItem(self.host, self.hive, self.key, name2, type, value, self.arch);
      }
      cb(null, result);
    }
  });
  proc.stdout.on("data", function(data) {
    buffer += data.toString();
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.set = function set(name, type, value, cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  if (REG_TYPES.indexOf(type) == -1)
    throw Error("illegal type specified.");
  var args = ["ADD", this.path];
  if (name == "")
    args.push("/ve");
  else
    args = args.concat(["/v", name]);
  args = args.concat(["/t", type, "/d", value, "/f"]);
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("ADD", code, output, null));
    } else {
      cb(null);
    }
  });
  proc.stdout.on("data", function(data) {
    log("" + data);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.remove = function remove(name, cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = name ? ["DELETE", this.path, "/f", "/v", name] : ["DELETE", this.path, "/f", "/ve"];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("DELETE", code, output), null);
    } else {
      cb(null);
    }
  });
  proc.stdout.on("data", function(data) {
    log("" + data);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.clear = function clear(cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["DELETE", this.path, "/f", "/va"];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("DELETE", code, output), null);
    } else {
      cb(null);
    }
  });
  proc.stdout.on("data", function(data) {
    log("" + data);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.erase = Registry.prototype.clear;
Registry.prototype.destroy = function destroy(cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["DELETE", this.path, "/f"];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("DELETE", code, output), null);
    } else {
      cb(null);
    }
  });
  proc.stdout.on("data", function(data) {
    log("" + data);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.create = function create(cb) {
  if (typeof cb !== "function")
    throw new TypeError("must specify a callback");
  var args = ["ADD", this.path, "/f"];
  pushArch(args, this.arch);
  var proc = spawn(getRegExePath(), args, {
    cwd: void 0,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }), error = null;
  var output = captureOutput(proc);
  proc.on("close", function(code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log("process exited with code " + code);
      cb(mkErrorMsg("ADD", code, output), null);
    } else {
      cb(null);
    }
  });
  proc.stdout.on("data", function(data) {
    log("" + data);
  });
  proc.on("error", function(err) {
    error = err;
    cb(err);
  });
  return this;
};
Registry.prototype.keyExists = function keyExists(cb) {
  this.values(function(err, items) {
    if (err) {
      if (err.code == 1) {
        return cb(null, false);
      }
      return cb(err);
    }
    cb(null, true);
  });
  return this;
};
Registry.prototype.valueExists = function valueExists(name, cb) {
  this.get(name, function(err, item) {
    if (err) {
      if (err.code == 1) {
        return cb(null, false);
      }
      return cb(err);
    }
    cb(null, true);
  });
  return this;
};
module.exports = Registry;

var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/ms/index.js
var require_ms = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/common.js
var require_common = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug2(...args) {
          if (!debug2.enabled) {
            return;
          }
          const self = debug2;
          const curr = Number(new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug2.namespace = namespace;
        debug2.useColors = createDebug.useColors();
        debug2.color = createDebug.selectColor(namespace);
        debug2.extend = extend;
        debug2.destroy = createDebug.destroy;
        Object.defineProperty(debug2, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug2);
        }
        return debug2;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        let i;
        const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
        const len = split.length;
        for (i = 0; i < len; i++) {
          if (!split[i]) {
            continue;
          }
          namespaces = split[i].replace(/\*/g, ".*?");
          if (namespaces[0] === "-") {
            createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
          } else {
            createDebug.names.push(new RegExp("^" + namespaces + "$"));
          }
        }
      }
      function disable() {
        const namespaces = [
          ...createDebug.names.map(toNamespace),
          ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        if (name[name.length - 1] === "*") {
          return true;
        }
        let i;
        let len;
        for (i = 0, len = createDebug.skips.length; i < len; i++) {
          if (createDebug.skips[i].test(name)) {
            return false;
          }
        }
        for (i = 0, len = createDebug.names.length; i < len; i++) {
          if (createDebug.names[i].test(name)) {
            return true;
          }
        }
        return false;
      }
      function toNamespace(regexp) {
        return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/node.js
var require_node = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util2 = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util2.deprecate(() => {
    }, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} [0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return new Date().toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.format(...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/index.js
var require_src = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/errors.js
var require_errors = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/errors.js"(exports2, module2) {
    var errors2 = {};
    errors2[25121] = new Error("missing arguments");
    errors2[25121].code = 25121;
    errors2[25122] = new Error("unsupported hive");
    errors2[25122].code = 25122;
    errors2[25123] = new Error("expected to have groups of 4 arguments for each value that is written to the registry");
    errors2[25123].code = 25123;
    errors2[25124] = new Error('missing or invalid architecture from arguments, use "A" (agnostic), "S" (specific), "32" or "64"');
    errors2[25124].code = 25124;
    errors2[25125] = new Error("missing OSArchitecture global. Forgot to load util.vbs? submit an issue asap with steps to recreate");
    errors2[25125].code = 25125;
    errors2[25126] = new Error("invalid os architecture detected");
    errors2[25126].code = 25126;
    errors2[25127] = new Error("empty line written to vbscript stdin");
    errors2[25127].code = 25127;
    errors2[5] = new Error("access is denied");
    errors2[5].code = 5;
    errors2[2] = new Error("registry path does not exist");
    errors2[2].code = 2;
    var e0 = new Error("wbemErrFailed");
    e0.description = "The call failed.";
    e0.code = 2147749889;
    errors2[2147749889] = e0;
    var e1 = new Error("wbemErrNotFound");
    e1.description = "The object could not be found.";
    e1.code = 2147749890;
    errors2[2147749890] = e1;
    var e2 = new Error("wbemErrAccessDenied");
    e2.description = "The current user does not have permission to perform the action.";
    e2.code = 2147749891;
    errors2[2147749891] = e2;
    var e3 = new Error("wbemErrProviderFailure");
    e3.description = "The provider has failed at some time other than during initialization.";
    e3.code = 2147749892;
    errors2[2147749892] = e3;
    var e4 = new Error("wbemErrTypeMismatch");
    e4.description = "A type mismatch occurred.";
    e4.code = 2147749893;
    errors2[2147749893] = e4;
    var e5 = new Error("wbemErrOutOfMemory");
    e5.description = "There was not enough memory for the operation.";
    e5.code = 2147749894;
    errors2[2147749894] = e5;
    var e6 = new Error("wbemErrInvalidContext");
    e6.description = "The SWbemNamedValue object is not valid.";
    e6.code = 2147749895;
    errors2[2147749895] = e6;
    var e7 = new Error("wbemErrInvalidParameter");
    e7.description = "One of the parameters to the call is not correct.";
    e7.code = 2147749896;
    errors2[2147749896] = e7;
    var e8 = new Error("wbemErrNotAvailable");
    e8.description = "The resource, typically a remote server, is not currently available.";
    e8.code = 2147749897;
    errors2[2147749897] = e8;
    var e9 = new Error("wbemErrCriticalError");
    e9.description = "An internal, critical, and unexpected error occurred. Report this error to Microsoft Technical Support.";
    e9.code = 2147749898;
    errors2[2147749898] = e9;
    var e10 = new Error("wbemErrInvalidStream");
    e10.description = "One or more network packets were corrupted during a remote session.";
    e10.code = 2147749899;
    errors2[2147749899] = e10;
    var e11 = new Error("wbemErrNotSupported");
    e11.description = "The feature or operation is not supported.";
    e11.code = 2147749900;
    errors2[2147749900] = e11;
    var e12 = new Error("wbemErrInvalidSuperclass");
    e12.description = "The parent class specified is not valid.";
    e12.code = 2147749901;
    errors2[2147749901] = e12;
    var e13 = new Error("wbemErrInvalidNamespace");
    e13.description = "The namespace specified could not be found.";
    e13.code = 2147749902;
    errors2[2147749902] = e13;
    var e14 = new Error("wbemErrInvalidObject");
    e14.description = "The specified instance is not valid.";
    e14.code = 2147749903;
    errors2[2147749903] = e14;
    var e15 = new Error("wbemErrInvalidClass");
    e15.description = "The specified class is not valid.";
    e15.code = 2147749904;
    errors2[2147749904] = e15;
    var e16 = new Error("wbemErrProviderNotFound");
    e16.description = "A provider referenced in the schema does not have a corresponding registration.";
    e16.code = 2147749905;
    errors2[2147749905] = e16;
    var e17 = new Error("wbemErrInvalidProviderRegistration");
    e17.description = "A provider referenced in the schema has an incorrect or incomplete registration. This error may be caused by a missing pragma namespace command in the MOF file used to register the provider, resulting in the provider being registered in the wrong WMI namespace. This error may also be caused by a corrupt repository, which may be fixed by deleting it and recompiling the MOF files.";
    e17.code = 2147749906;
    errors2[2147749906] = e17;
    var e18 = new Error("wbemErrProviderLoadFailure");
    e18.description = "COM cannot locate a provider referenced in the schema. This error may be caused by any of the following:";
    e18.code = 2147749907;
    errors2[2147749907] = e18;
    var e19 = new Error("wbemErrInitializationFailure");
    e19.description = "A component, such as a provider, failed to initialize for internal reasons.";
    e19.code = 2147749908;
    errors2[2147749908] = e19;
    var e20 = new Error("wbemErrTransportFailure");
    e20.description = "A networking error occurred, preventing normal operation.";
    e20.code = 2147749909;
    errors2[2147749909] = e20;
    var e21 = new Error("wbemErrInvalidOperation");
    e21.description = "The requested operation is not valid. This error usually applies to invalid attempts to delete classes or properties.";
    e21.code = 2147749910;
    errors2[2147749910] = e21;
    var e22 = new Error("wbemErrInvalidQuery");
    e22.description = "The requested operation is not valid. This error usually applies to invalid attempts to delete classes or properties.";
    e22.code = 2147749911;
    errors2[2147749911] = e22;
    var e23 = new Error("wbemErrInvalidQueryType");
    e23.description = "The requested query language is not supported.";
    e23.code = 2147749912;
    errors2[2147749912] = e23;
    var e24 = new Error("wbemErrAlreadyExists");
    e24.description = "In a put operation, the wbemChangeFlagCreateOnly flag was specified, but the instance already exists.";
    e24.code = 2147749913;
    errors2[2147749913] = e24;
    var e25 = new Error("wbemErrOverrideNotAllowed");
    e25.description = "It is not possible to perform the add operation on this qualifier because the owning object does not permit overrides.";
    e25.code = 2147749914;
    errors2[2147749914] = e25;
    var e26 = new Error("wbemErrPropagatedQualifier");
    e26.description = "The user attempted to delete a qualifier that was not owned. The qualifier was inherited from a parent class.";
    e26.code = 2147749915;
    errors2[2147749915] = e26;
    var e27 = new Error("wbemErrPropagatedProperty");
    e27.description = "The user attempted to delete a property that was not owned. The property was inherited from a parent class.";
    e27.code = 2147749916;
    errors2[2147749916] = e27;
    var e28 = new Error("wbemErrUnexpected");
    e28.description = "The client made an unexpected and illegal sequence of calls, such as calling EndEnumeration before calling BeginEnumeration.";
    e28.code = 2147749917;
    errors2[2147749917] = e28;
    var e29 = new Error("wbemErrIllegalOperation");
    e29.description = "The user requested an illegal operation, such as spawning a class from an instance.";
    e29.code = 2147749918;
    errors2[2147749918] = e29;
    var e30 = new Error("wbemErrCannotBeKey");
    e30.description = "There was an illegal attempt to specify a key qualifier on a property that cannot be a key. The keys are specified in the class definition for an object, and cannot be altered on a per-instance basis.";
    e30.code = 2147749919;
    errors2[2147749919] = e30;
    var e31 = new Error("wbemErrIncompleteClass");
    e31.description = "The current object is not a valid class definition. Either it is incomplete, or it has not been registered with WMI using SWbemObject.Put_.";
    e31.code = 2147749920;
    errors2[2147749920] = e31;
    var e32 = new Error("wbemErrInvalidSyntax");
    e32.description = "The syntax of an input parameter is incorrect for the applicable data structure. For example, when a CIM datetime structure does not have the correct format when passed to SWbemDateTime.SetFileTime.";
    e32.code = 2147749921;
    errors2[2147749921] = e32;
    var e33 = new Error("wbemErrNondecoratedObject");
    e33.description = "Reserved for future use.";
    e33.code = 2147749922;
    errors2[2147749922] = e33;
    var e34 = new Error("wbemErrReadOnly");
    e34.description = "The property that you are attempting to modify is read-only.";
    e34.code = 2147749923;
    errors2[2147749923] = e34;
    var e35 = new Error("wbemErrProviderNotCapable");
    e35.description = "The provider cannot perform the requested operation. This would include a query that is too complex, retrieving an instance, creating or updating a class, deleting a class, or enumerating a class.";
    e35.code = 2147749924;
    errors2[2147749924] = e35;
    var e36 = new Error("wbemErrClassHasChildren");
    e36.description = "An attempt was made to make a change that would invalidate a subclass.";
    e36.code = 2147749925;
    errors2[2147749925] = e36;
    var e37 = new Error("wbemErrClassHasInstances");
    e37.description = "An attempt has been made to delete or modify a class that has instances.";
    e37.code = 2147749926;
    errors2[2147749926] = e37;
    var e38 = new Error("wbemErrQueryNotImplemented");
    e38.description = "Reserved for future use.";
    e38.code = 2147749927;
    errors2[2147749927] = e38;
    var e39 = new Error("wbemErrIllegalNull");
    e39.description = "A value of Nothing was specified for a property that may not be Nothing, such as one that is marked by a Key, Indexed, or Not_Null qualifier.";
    e39.code = 2147749928;
    errors2[2147749928] = e39;
    var e40 = new Error("wbemErrInvalidQualifierType");
    e40.description = "The CIM type specified for a property is not valid.";
    e40.code = 2147749929;
    errors2[2147749929] = e40;
    var e41 = new Error("wbemErrInvalidPropertyType");
    e41.description = "The CIM type specified for a property is not valid.";
    e41.code = 2147749930;
    errors2[2147749930] = e41;
    var e42 = new Error("wbemErrValueOutOfRange");
    e42.description = "The request was made with an out-of-range value, or is incompatible with the type.";
    e42.code = 2147749931;
    errors2[2147749931] = e42;
    var e43 = new Error("wbemErrCannotBeSingleton");
    e43.description = "An illegal attempt was made to make a class singleton, such as when the class is derived from a non-singleton class.";
    e43.code = 2147749932;
    errors2[2147749932] = e43;
    var e44 = new Error("wbemErrInvalidCimType");
    e44.description = "The CIM type specified is not valid.";
    e44.code = 2147749933;
    errors2[2147749933] = e44;
    var e45 = new Error("wbemErrInvalidMethod");
    e45.description = "The requested method is not available.";
    e45.code = 2147749934;
    errors2[2147749934] = e45;
    var e46 = new Error("wbemErrInvalidMethodParameters");
    e46.description = "The parameters provided for the method are not valid.";
    e46.code = 2147749935;
    errors2[2147749935] = e46;
    var e47 = new Error("wbemErrSystemProperty");
    e47.description = "There was an attempt to get qualifiers on a system property.";
    e47.code = 2147749936;
    errors2[2147749936] = e47;
    var e48 = new Error("wbemErrInvalidProperty");
    e48.description = "The property type is not recognized.";
    e48.code = 2147749937;
    errors2[2147749937] = e48;
    var e49 = new Error("wbemErrCallCancelled");
    e49.description = "An asynchronous process has been canceled internally or by the user. Note that due to the timing and nature of the asynchronous operation the operation may not have been truly canceled.";
    e49.code = 2147749938;
    errors2[2147749938] = e49;
    var e50 = new Error("wbemErrShuttingDown");
    e50.description = "The user has requested an operation while WMI is in the process of shutting down.";
    e50.code = 2147749939;
    errors2[2147749939] = e50;
    var e51 = new Error("wbemErrPropagatedMethod");
    e51.description = "An attempt was made to reuse an existing method name from a parent class, and the signatures did not match.";
    e51.code = 2147749940;
    errors2[2147749940] = e51;
    var e52 = new Error("wbemErrUnsupportedParameter");
    e52.description = "One or more parameter values, such as a query text, is too complex or unsupported. WMI is therefore requested to retry the operation with simpler parameters.";
    e52.code = 2147749941;
    errors2[2147749941] = e52;
    var e53 = new Error("wbemErrMissingParameter");
    e53.description = "A parameter was missing from the method call.";
    e53.code = 2147749942;
    errors2[2147749942] = e53;
    var e54 = new Error("wbemErrInvalidParameterId");
    e54.description = "A method parameter has an ID qualifier that is not valid.";
    e54.code = 2147749943;
    errors2[2147749943] = e54;
    var e55 = new Error("wbemErrNonConsecutiveParameterIds");
    e55.description = "One or more of the method parameters have ID qualifiers that are out of sequence.";
    e55.code = 2147749944;
    errors2[2147749944] = e55;
    var e56 = new Error("wbemErrParameterIdOnRetval");
    e56.description = "The return value for a method has an ID qualifier.";
    e56.code = 2147749945;
    errors2[2147749945] = e56;
    var e57 = new Error("wbemErrInvalidObjectPath");
    e57.description = "The specified object path was not valid.";
    e57.code = 2147749946;
    errors2[2147749946] = e57;
    var e58 = new Error("wbemErrOutOfDiskSpace");
    e58.description = "Windows Server 2003:  Disk is out of space or the 4 GB limit on WMI repository (CIM repository) size is reached.";
    e58.code = 2147749947;
    errors2[2147749947] = e58;
    var e59 = new Error("wbemErrBufferTooSmall");
    e59.description = "The supplied buffer was too small to hold all the objects in the enumerator or to read a string property.";
    e59.code = 2147749948;
    errors2[2147749948] = e59;
    var e60 = new Error("wbemErrUnsupportedPutExtension");
    e60.description = "The provider does not support the requested put operation.";
    e60.code = 2147749949;
    errors2[2147749949] = e60;
    var e61 = new Error("wbemErrUnknownObjectType");
    e61.description = "An object with an incorrect type or version was encountered during marshaling.";
    e61.code = 2147749950;
    errors2[2147749950] = e61;
    var e62 = new Error("wbemErrUnknownPacketType");
    e62.description = "A packet with an incorrect type or version was encountered during marshaling.";
    e62.code = 2147749951;
    errors2[2147749951] = e62;
    var e63 = new Error("wbemErrMarshalVersionMismatch");
    e63.description = "The packet has an unsupported version.";
    e63.code = 2147749952;
    errors2[2147749952] = e63;
    var e64 = new Error("wbemErrMarshalInvalidSignature");
    e64.description = "The packet appears to be corrupted.";
    e64.code = 2147749953;
    errors2[2147749953] = e64;
    var e65 = new Error("wbemErrInvalidQualifier");
    e65.description = "An attempt has been made to mismatch qualifiers, such as putting [key] on an object instead of a property.";
    e65.code = 2147749954;
    errors2[2147749954] = e65;
    var e66 = new Error("wbemErrInvalidDuplicateParameter");
    e66.description = "A duplicate parameter has been declared in a CIM method.";
    e66.code = 2147749955;
    errors2[2147749955] = e66;
    var e67 = new Error("wbemErrTooMuchData");
    e67.description = "Reserved for future use.";
    e67.code = 2147749956;
    errors2[2147749956] = e67;
    var e68 = new Error("wbemErrServerTooBusy");
    e68.description = "A call to IWbemObjectSink::Indicate has failed. The provider may choose to refire the event.";
    e68.code = 2147749957;
    errors2[2147749957] = e68;
    var e69 = new Error("wbemErrInvalidFlavor");
    e69.description = "The specified flavor was not valid.";
    e69.code = 2147749958;
    errors2[2147749958] = e69;
    var e70 = new Error("wbemErrCircularReference");
    e70.description = "An attempt has been made to create a reference that is circular (for example, deriving a class from itself).";
    e70.code = 2147749959;
    errors2[2147749959] = e70;
    var e71 = new Error("wbemErrUnsupportedClassUpdate");
    e71.description = "The specified class is not supported.";
    e71.code = 2147749960;
    errors2[2147749960] = e71;
    var e72 = new Error("wbemErrCannotChangeKeyInheritance");
    e72.description = "An attempt was made to change a key when instances or subclasses are already using the key.";
    e72.code = 2147749961;
    errors2[2147749961] = e72;
    var e73 = new Error("wbemErrCannotChangeIndexInheritance");
    e73.description = "An attempt was made to change an index when instances or subclasses are already using the index.";
    e73.code = 2147749968;
    errors2[2147749968] = e73;
    var e74 = new Error("wbemErrTooManyProperties");
    e74.description = "An attempt was made to create more properties than the current version of the class supports.";
    e74.code = 2147749969;
    errors2[2147749969] = e74;
    var e75 = new Error("wbemErrUpdateTypeMismatch");
    e75.description = "A property was redefined with a conflicting type in a derived class.";
    e75.code = 2147749970;
    errors2[2147749970] = e75;
    var e76 = new Error("wbemErrUpdateOverrideNotAllowed");
    e76.description = "An attempt was made in a derived class to override a non-overrideable qualifier.";
    e76.code = 2147749971;
    errors2[2147749971] = e76;
    var e77 = new Error("wbemErrUpdatePropagatedMethod");
    e77.description = "A method was redeclared with a conflicting signature in a derived class.";
    e77.code = 2147749972;
    errors2[2147749972] = e77;
    var e78 = new Error("wbemErrMethodNotImplemented");
    e78.description = "An attempt was made to execute a method not marked with [implemented] in any relevant class.";
    e78.code = 2147749973;
    errors2[2147749973] = e78;
    var e79 = new Error("wbemErrMethodDisabled");
    e79.description = "An attempt was made to execute a method marked with [disabled].";
    e79.code = 2147749974;
    errors2[2147749974] = e79;
    var e80 = new Error("wbemErrRefresherBusy");
    e80.description = "The refresher is busy with another operation.";
    e80.code = 2147749975;
    errors2[2147749975] = e80;
    var e81 = new Error("wbemErrUnparsableQuery");
    e81.description = "The filtering query is syntactically not valid.";
    e81.code = 2147749976;
    errors2[2147749976] = e81;
    var e82 = new Error("wbemErrNotEventClass");
    e82.description = "The FROM clause of a filtering query references a class that is not an event class (not derived from __Event).";
    e82.code = 2147749977;
    errors2[2147749977] = e82;
    var e83 = new Error("wbemErrMissingGroupWithin");
    e83.description = "A GROUP BY clause was used without the corresponding GROUP WITHIN clause.";
    e83.code = 2147749978;
    errors2[2147749978] = e83;
    var e84 = new Error("wbemErrMissingAggregationList");
    e84.description = "A GROUP BY clause was used. Aggregation on all properties is not supported.";
    e84.code = 2147749979;
    errors2[2147749979] = e84;
    var e85 = new Error("wbemErrPropertyNotAnObject");
    e85.description = "Dot notation was used on a property that is not an embedded object.";
    e85.code = 2147749980;
    errors2[2147749980] = e85;
    var e86 = new Error("wbemErrAggregatingByObject");
    e86.description = "A GROUP BY clause references a property that is an embedded object without using dot notation.";
    e86.code = 2147749981;
    errors2[2147749981] = e86;
    var e87 = new Error("wbemErrUninterpretableProviderQuery");
    e87.description = "An event provider registration query ( __EventProviderRegistration) did not specify the classes for which events were provided.";
    e87.code = 2147749983;
    errors2[2147749983] = e87;
    var e88 = new Error("wbemErrBackupRestoreWinmgmtRunning");
    e88.description = "An request was made to back up or restore the repository while WMI was using it.";
    e88.code = 2147749984;
    errors2[2147749984] = e88;
    var e89 = new Error("wbemErrQueueOverflow");
    e89.description = "The asynchronous delivery queue overflowed due to the event consumer being too slow.";
    e89.code = 2147749985;
    errors2[2147749985] = e89;
    var e90 = new Error("wbemErrPrivilegeNotHeld");
    e90.description = "The operation failed because the client did not have the necessary security privilege.";
    e90.code = 2147749986;
    errors2[2147749986] = e90;
    var e91 = new Error("wbemErrInvalidOperator");
    e91.description = "The operator is not valid for this property type.";
    e91.code = 2147749987;
    errors2[2147749987] = e91;
    var e92 = new Error("wbemErrLocalCredentials");
    e92.description = "The user specified a username, password or authority for a local connection. The user must use a blank username/password and rely on default security.";
    e92.code = 2147749988;
    errors2[2147749988] = e92;
    var e93 = new Error("wbemErrCannotBeAbstract");
    e93.description = "The class was made abstract when its parent class is not abstract.";
    e93.code = 2147749989;
    errors2[2147749989] = e93;
    var e94 = new Error("wbemErrAmendedObject");
    e94.description = "An amended object was put without the wbemFlagUseAmendedQualifiers flag being specified.";
    e94.code = 2147749990;
    errors2[2147749990] = e94;
    var e95 = new Error("wbemErrClientTooSlow");
    e95.description = "Windows Server 2003:  The client was not retrieving objects quickly enough from an enumeration. This constant is returned when a client creates an enumeration object but does not retrieve objects from the enumerator in a timely fashion, causing the enumerator's object caches to get backed up.";
    e95.code = 2147749991;
    errors2[2147749991] = e95;
    var e96 = new Error("wbemErrNullSecurityDescriptor");
    e96.description = "Windows Server 2003:  A null security descriptor was used.";
    e96.code = 2147749992;
    errors2[2147749992] = e96;
    var e97 = new Error("wbemErrTimeout");
    e97.description = "Windows Server 2003:  The operation timed out.";
    e97.code = 2147749993;
    errors2[2147749993] = e97;
    var e98 = new Error("wbemErrInvalidAssociation");
    e98.description = "Windows Server 2003:  The association being used is not valid.";
    e98.code = 2147749994;
    errors2[2147749994] = e98;
    var e99 = new Error("wbemErrAmbiguousOperation");
    e99.description = "Windows Server 2003:  The operation was ambiguous.";
    e99.code = 2147749995;
    errors2[2147749995] = e99;
    var e100 = new Error("wbemErrQuotaViolation");
    e100.description = "Windows Server 2003:  WMI is taking up too much memory. This could be caused either by low memory availability or excessive memory consumption by WMI.";
    e100.code = 2147749996;
    errors2[2147749996] = e100;
    var e101 = new Error("wbemErrTransactionConflict");
    e101.description = "Windows Server 2003:  The operation resulted in a transaction conflict.";
    e101.code = 2147749997;
    errors2[2147749997] = e101;
    var e102 = new Error("wbemErrForcedRollback");
    e102.description = "Windows Server 2003:  The transaction forced a rollback.";
    e102.code = 2147749998;
    errors2[2147749998] = e102;
    var e103 = new Error("wbemErrUnsupportedLocale");
    e103.description = "Windows Server 2003:  The locale used in the call is not supported.";
    e103.code = 2147749999;
    errors2[2147749999] = e103;
    var e104 = new Error("wbemErrHandleOutOfDate");
    e104.description = "Windows Server 2003:  The object handle is out of date.";
    e104.code = 214775e4;
    errors2[214775e4] = e104;
    var e105 = new Error("wbemErrConnectionFailed");
    e105.description = "Windows Server 2003:  Indicates that the connection to the SQL database failed.";
    e105.code = 2147750001;
    errors2[2147750001] = e105;
    var e106 = new Error("wbemErrInvalidHandleRequest");
    e106.description = "Windows Server 2003:  The handle request was not valid.";
    e106.code = 2147750002;
    errors2[2147750002] = e106;
    var e107 = new Error("wbemErrPropertyNameTooWide");
    e107.description = "Windows Server 2003:  The property name contains more than 255 characters.";
    e107.code = 2147750003;
    errors2[2147750003] = e107;
    var e108 = new Error("wbemErrClassNameTooWide");
    e108.description = "Windows Server 2003:  The class name contains more than 255 characters.";
    e108.code = 2147750004;
    errors2[2147750004] = e108;
    var e109 = new Error("wbemErrMethodNameTooWide");
    e109.description = "Windows Server 2003:  The method name contains more than 255 characters.";
    e109.code = 2147750005;
    errors2[2147750005] = e109;
    var e110 = new Error("wbemErrQualifierNameTooWide");
    e110.description = "Windows Server 2003:  The qualifier name contains more than 255 characters.";
    e110.code = 2147750006;
    errors2[2147750006] = e110;
    var e111 = new Error("wbemErrRerunCommand");
    e111.description = "Windows Server 2003:  Indicates that an SQL command should be rerun because there is a deadlock in SQL. This can be returned only when data is being stored in an SQL database.";
    e111.code = 2147750007;
    errors2[2147750007] = e111;
    var e112 = new Error("wbemErrDatabaseVerMismatch");
    e112.description = "Windows Server 2003:  The database version does not match the version that the repository driver processes.";
    e112.code = 2147750008;
    errors2[2147750008] = e112;
    var e113 = new Error("wbemErrVetoDelete");
    e113.description = "Windows Server 2003:  WMI cannot do the delete operation because the provider does not allow it.";
    e113.code = 2147750010;
    errors2[2147750010] = e113;
    var e114 = new Error("wbemErrVetoPut");
    e114.description = "Windows Server 2003:  WMI cannot do the put operation because the provider does not allow it.";
    e114.code = 2147750010;
    errors2[2147750010] = e114;
    var e115 = new Error("wbemErrInvalidLocale");
    e115.description = "Windows Server 2003:  The specified locale identifier was not valid for the operation.";
    e115.code = 2147750016;
    errors2[2147750016] = e115;
    var e116 = new Error("wbemErrProviderSuspended");
    e116.description = "Windows Server 2003:  The provider is suspended.";
    e116.code = 2147750017;
    errors2[2147750017] = e116;
    var e117 = new Error("wbemErrSynchronizationRequired");
    e117.description = "Windows Server 2003:  The object must be committed and retrieved again before the requested operation can succeed. This constant is returned when an object must be committed and re-retrieved to see the property value.";
    e117.code = 2147750018;
    errors2[2147750018] = e117;
    var e118 = new Error("wbemErrNoSchema");
    e118.description = "Windows Server 2003:  The operation cannot be completed because no schema is available.";
    e118.code = 2147750019;
    errors2[2147750019] = e118;
    var e119 = new Error("wbemErrProviderAlreadyRegistered");
    e119.description = "Windows Server 2003:  The provider registration cannot be done because the provider is already registered.";
    e119.code = 2147750020;
    errors2[2147750020] = e119;
    var e120 = new Error("wbemErrProviderNotRegistered");
    e120.description = "Windows Server 2003:  The provider for the requested data is not registered.";
    e120.code = 2147750021;
    errors2[2147750021] = e120;
    var e121 = new Error("wbemErrFatalTransportError");
    e121.description = "Windows Server 2003:  A fatal transport error occurred and other transport will not be attempted.";
    e121.code = 2147750022;
    errors2[2147750022] = e121;
    var e122 = new Error("wbemErrEncryptedConnectionRequired");
    e122.description = "Windows Server 2003:  The client connection to WINMGMT must be encrypted for this operation. The IWbemServices proxy security settings should be adjusted and the operation retried.";
    e122.code = 2147750023;
    errors2[2147750023] = e122;
    var e123 = new Error("wbemErrRegistrationTooBroad");
    e123.description = "Windows Server 2003:  The provider registration overlaps with the system event domain.";
    e123.code = 2147753985;
    errors2[2147753985] = e123;
    var e124 = new Error("wbemErrRegistrationTooPrecise");
    e124.description = "Windows Server 2003:  A WITHIN clause was not used in this query.";
    e124.code = 2147753986;
    errors2[2147753986] = e124;
    var e125 = new Error("wbemErrTimedout");
    e125.description = "Windows Server 2003:  Automation-specific error.";
    e125.code = 2147758081;
    errors2[2147758081] = e125;
    var e126 = new Error("wbemErrResetToDefault");
    e126.description = "undefined";
    e126.code = 2147758082;
    errors2[2147758082] = e126;
    module2.exports = errors2;
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/stream-slicer/index.js
var require_stream_slicer = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/stream-slicer/index.js"(exports2, module2) {
    var Transform = require("stream").Transform;
    var $u = require("util");
    $u.inherits(StreamSlicer2, Transform);
    function StreamSlicer2(options) {
      if (!(this instanceof StreamSlicer2))
        return new StreamSlicer2(options);
      Transform.call(this, options);
      this._buffer = [];
      this._currentLength = 0;
      if (options && options.sliceBy)
        this._sliceBy = options.sliceBy;
      else
        this._sliceBy = "\n";
      if (options && options.replaceWith)
        this.replaceWith = new Buffer(options.replaceWith);
    }
    StreamSlicer2.prototype._transform = function(chunk, encoding, callback) {
      chunk = String(chunk);
      var start = 0;
      var index = -1;
      while ((index = chunk.indexOf(this._sliceBy, start)) > -1) {
        var miniChunk = chunk.substring(start, index);
        this._append(miniChunk);
        this._separatorFlush();
        start = index + this._sliceBy.length;
      }
      var trailing = chunk.substring(start);
      if (trailing.length > 0)
        this._append(trailing);
      callback();
    };
    StreamSlicer2.prototype._append = function(str) {
      var chunk = new Buffer(str);
      this._buffer.push(chunk);
      this._currentLength += chunk.length;
    };
    StreamSlicer2.prototype._separatorFlush = function(transformFlush) {
      if (this.replaceWith && !transformFlush) {
        this._buffer.push(this.replaceWith);
        this._currentLength += this.replaceWith.length;
      }
      var data = Buffer.concat(this._buffer, this._currentLength);
      this._buffer = [];
      this._currentLength = 0;
      this.push(data);
      this.emit("slice", data);
    };
    StreamSlicer2.prototype._flush = function(callback) {
      this._separatorFlush(true);
      if (callback)
        callback();
    };
    module2.exports = StreamSlicer2;
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/core-util-is/lib/util.js
var require_util = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/core-util-is/lib/util.js"(exports2) {
    function isArray(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString(arg) === "[object Array]";
    }
    exports2.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports2.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports2.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports2.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports2.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports2.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports2.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports2.isUndefined = isUndefined;
    function isRegExp(re) {
      return objectToString(re) === "[object RegExp]";
    }
    exports2.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports2.isObject = isObject;
    function isDate(d) {
      return objectToString(d) === "[object Date]";
    }
    exports2.isDate = isDate;
    function isError(e) {
      return objectToString(e) === "[object Error]" || e instanceof Error;
    }
    exports2.isError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports2.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports2.isPrimitive = isPrimitive;
    exports2.isBuffer = Buffer.isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/inherits/inherits_browser.js"(exports2, module2) {
    if (typeof Object.create === "function") {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/inherits/inherits.js"(exports2, module2) {
    try {
      util2 = require("util");
      if (typeof util2.inherits !== "function")
        throw "";
      module2.exports = util2.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util2;
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/isarray/index.js
var require_isarray = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/isarray/index.js"(exports2, module2) {
    module2.exports = Array.isArray || function(arr) {
      return Object.prototype.toString.call(arr) == "[object Array]";
    };
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    module2.exports = Readable;
    var isArray = require_isarray();
    var Buffer2 = require("buffer").Buffer;
    Readable.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    if (!EE.listenerCount)
      EE.listenerCount = function(emitter, type) {
        return emitter.listeners(type).length;
      };
    var Stream = require("stream");
    var util2 = require_util();
    util2.inherits = require_inherits();
    var StringDecoder;
    util2.inherits(Readable, Stream);
    function ReadableState(options, stream) {
      options = options || {};
      var hwm = options.highWaterMark;
      this.highWaterMark = hwm || hwm === 0 ? hwm : 16 * 1024;
      this.highWaterMark = ~~this.highWaterMark;
      this.buffer = [];
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = false;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.calledRead = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.objectMode = !!options.objectMode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.ranOut = false;
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder)
          StringDecoder = require("string_decoder/").StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      if (!(this instanceof Readable))
        return new Readable(options);
      this._readableState = new ReadableState(options, this);
      this.readable = true;
      Stream.call(this);
    }
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      if (typeof chunk === "string" && !state.objectMode) {
        encoding = encoding || state.defaultEncoding;
        if (encoding !== state.encoding) {
          chunk = new Buffer2(chunk, encoding);
          encoding = "";
        }
      }
      return readableAddChunk(this, state, chunk, encoding, false);
    };
    Readable.prototype.unshift = function(chunk) {
      var state = this._readableState;
      return readableAddChunk(this, state, chunk, "", true);
    };
    function readableAddChunk(stream, state, chunk, encoding, addToFront) {
      var er = chunkInvalid(state, chunk);
      if (er) {
        stream.emit("error", er);
      } else if (chunk === null || chunk === void 0) {
        state.reading = false;
        if (!state.ended)
          onEofChunk(stream, state);
      } else if (state.objectMode || chunk && chunk.length > 0) {
        if (state.ended && !addToFront) {
          var e = new Error("stream.push() after EOF");
          stream.emit("error", e);
        } else if (state.endEmitted && addToFront) {
          var e = new Error("stream.unshift() after end event");
          stream.emit("error", e);
        } else {
          if (state.decoder && !addToFront && !encoding)
            chunk = state.decoder.write(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) {
            state.buffer.unshift(chunk);
          } else {
            state.reading = false;
            state.buffer.push(chunk);
          }
          if (state.needReadable)
            emitReadable(stream);
          maybeReadMore(stream, state);
        }
      } else if (!addToFront) {
        state.reading = false;
      }
      return needMoreData(state);
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder)
        StringDecoder = require("string_decoder/").StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
    };
    var MAX_HWM = 8388608;
    function roundUpToNextPowerOf2(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        for (var p = 1; p < 32; p <<= 1)
          n |= n >> p;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (state.length === 0 && state.ended)
        return 0;
      if (state.objectMode)
        return n === 0 ? 0 : 1;
      if (n === null || isNaN(n)) {
        if (state.flowing && state.buffer.length)
          return state.buffer[0].length;
        else
          return state.length;
      }
      if (n <= 0)
        return 0;
      if (n > state.highWaterMark)
        state.highWaterMark = roundUpToNextPowerOf2(n);
      if (n > state.length) {
        if (!state.ended) {
          state.needReadable = true;
          return 0;
        } else
          return state.length;
      }
      return n;
    }
    Readable.prototype.read = function(n) {
      var state = this._readableState;
      state.calledRead = true;
      var nOrig = n;
      var ret;
      if (typeof n !== "number" || n > 0)
        state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        ret = null;
        if (state.length > 0 && state.decoder) {
          ret = fromList(n, state);
          state.length -= ret.length;
        }
        if (state.length === 0)
          endReadable(this);
        return ret;
      }
      var doRead = state.needReadable;
      if (state.length - n <= state.highWaterMark)
        doRead = true;
      if (state.ended || state.reading)
        doRead = false;
      if (doRead) {
        state.reading = true;
        state.sync = true;
        if (state.length === 0)
          state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
      }
      if (doRead && !state.reading)
        n = howMuchToRead(nOrig, state);
      if (n > 0)
        ret = fromList(n, state);
      else
        ret = null;
      if (ret === null) {
        state.needReadable = true;
        n = 0;
      }
      state.length -= n;
      if (state.length === 0 && !state.ended)
        state.needReadable = true;
      if (state.ended && !state.endEmitted && state.length === 0)
        endReadable(this);
      return ret;
    };
    function chunkInvalid(state, chunk) {
      var er = null;
      if (!Buffer2.isBuffer(chunk) && typeof chunk !== "string" && chunk !== null && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      return er;
    }
    function onEofChunk(stream, state) {
      if (state.decoder && !state.ended) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      if (state.length > 0)
        emitReadable(stream);
      else
        endReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (state.emittedReadable)
        return;
      state.emittedReadable = true;
      if (state.sync)
        process.nextTick(function() {
          emitReadable_(stream);
        });
      else
        emitReadable_(stream);
    }
    function emitReadable_(stream) {
      stream.emit("readable");
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        process.nextTick(function() {
          maybeReadMore_(stream, state);
        });
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        stream.read(0);
        if (len === state.length)
          break;
        else
          len = state.length;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n) {
      this.emit("error", new Error("not implemented"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : cleanup;
      if (state.endEmitted)
        process.nextTick(endFn);
      else
        src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable) {
        if (readable !== src)
          return;
        cleanup();
      }
      function onend() {
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      function cleanup() {
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", cleanup);
        if (!dest._writableState || dest._writableState.needDrain)
          ondrain();
      }
      function onerror(er) {
        unpipe();
        dest.removeListener("error", onerror);
        if (EE.listenerCount(dest, "error") === 0)
          dest.emit("error", er);
      }
      if (!dest._events || !dest._events.error)
        dest.on("error", onerror);
      else if (isArray(dest._events.error))
        dest._events.error.unshift(onerror);
      else
        dest._events.error = [onerror, dest._events.error];
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        this.on("readable", pipeOnReadable);
        state.flowing = true;
        process.nextTick(function() {
          flow(src);
        });
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function() {
        var dest = this;
        var state = src._readableState;
        state.awaitDrain--;
        if (state.awaitDrain === 0)
          flow(src);
      };
    }
    function flow(src) {
      var state = src._readableState;
      var chunk;
      state.awaitDrain = 0;
      function write(dest, i, list) {
        var written = dest.write(chunk);
        if (written === false) {
          state.awaitDrain++;
        }
      }
      while (state.pipesCount && (chunk = src.read()) !== null) {
        if (state.pipesCount === 1)
          write(state.pipes, 0, null);
        else
          forEach(state.pipes, write);
        src.emit("data", chunk);
        if (state.awaitDrain > 0)
          return;
      }
      if (state.pipesCount === 0) {
        state.flowing = false;
        if (EE.listenerCount(src, "data") > 0)
          emitDataEvents(src);
        return;
      }
      state.ranOut = true;
    }
    function pipeOnReadable() {
      if (this._readableState.ranOut) {
        this._readableState.ranOut = false;
        flow(this);
      }
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      if (state.pipesCount === 0)
        return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes)
          return this;
        if (!dest)
          dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        this.removeListener("readable", pipeOnReadable);
        state.flowing = false;
        if (dest)
          dest.emit("unpipe", this);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        this.removeListener("readable", pipeOnReadable);
        state.flowing = false;
        for (var i = 0; i < len; i++)
          dests[i].emit("unpipe", this);
        return this;
      }
      var i = indexOf(state.pipes, dest);
      if (i === -1)
        return this;
      state.pipes.splice(i, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1)
        state.pipes = state.pipes[0];
      dest.emit("unpipe", this);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      if (ev === "data" && !this._readableState.flowing)
        emitDataEvents(this);
      if (ev === "readable" && this.readable) {
        var state = this._readableState;
        if (!state.readableListening) {
          state.readableListening = true;
          state.emittedReadable = false;
          state.needReadable = true;
          if (!state.reading) {
            this.read(0);
          } else if (state.length) {
            emitReadable(this, state);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.resume = function() {
      emitDataEvents(this);
      this.read(0);
      this.emit("resume");
    };
    Readable.prototype.pause = function() {
      emitDataEvents(this, true);
      this.emit("pause");
    };
    function emitDataEvents(stream, startPaused) {
      var state = stream._readableState;
      if (state.flowing) {
        throw new Error("Cannot switch to old mode now.");
      }
      var paused = startPaused || false;
      var readable = false;
      stream.readable = true;
      stream.pipe = Stream.prototype.pipe;
      stream.on = stream.addListener = Stream.prototype.on;
      stream.on("readable", function() {
        readable = true;
        var c;
        while (!paused && (c = stream.read()) !== null)
          stream.emit("data", c);
        if (c === null) {
          readable = false;
          stream._readableState.needReadable = true;
        }
      });
      stream.pause = function() {
        paused = true;
        this.emit("pause");
      };
      stream.resume = function() {
        paused = false;
        if (readable)
          process.nextTick(function() {
            stream.emit("readable");
          });
        else
          this.read(0);
        this.emit("resume");
      };
      stream.emit("readable");
    }
    Readable.prototype.wrap = function(stream) {
      var state = this._readableState;
      var paused = false;
      var self = this;
      stream.on("end", function() {
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length)
            self.push(chunk);
        }
        self.push(null);
      });
      stream.on("data", function(chunk) {
        if (state.decoder)
          chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0))
          return;
        else if (!state.objectMode && (!chunk || !chunk.length))
          return;
        var ret = self.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (typeof stream[i] === "function" && typeof this[i] === "undefined") {
          this[i] = function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      var events = ["error", "close", "destroy", "pause", "resume"];
      forEach(events, function(ev) {
        stream.on(ev, self.emit.bind(self, ev));
      });
      self._read = function(n) {
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return self;
    };
    Readable._fromList = fromList;
    function fromList(n, state) {
      var list = state.buffer;
      var length = state.length;
      var stringMode = !!state.decoder;
      var objectMode = !!state.objectMode;
      var ret;
      if (list.length === 0)
        return null;
      if (length === 0)
        ret = null;
      else if (objectMode)
        ret = list.shift();
      else if (!n || n >= length) {
        if (stringMode)
          ret = list.join("");
        else
          ret = Buffer2.concat(list, length);
        list.length = 0;
      } else {
        if (n < list[0].length) {
          var buf = list[0];
          ret = buf.slice(0, n);
          list[0] = buf.slice(n);
        } else if (n === list[0].length) {
          ret = list.shift();
        } else {
          if (stringMode)
            ret = "";
          else
            ret = new Buffer2(n);
          var c = 0;
          for (var i = 0, l = list.length; i < l && c < n; i++) {
            var buf = list[0];
            var cpy = Math.min(n - c, buf.length);
            if (stringMode)
              ret += buf.slice(0, cpy);
            else
              buf.copy(ret, c, 0, cpy);
            if (cpy < buf.length)
              list[0] = buf.slice(cpy);
            else
              list.shift();
            c += cpy;
          }
        }
      }
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0)
        throw new Error("endReadable called on non-empty stream");
      if (!state.endEmitted && state.calledRead) {
        state.ended = true;
        process.nextTick(function() {
          if (!state.endEmitted && state.length === 0) {
            state.endEmitted = true;
            stream.readable = false;
            stream.emit("end");
          }
        });
      }
    }
    function forEach(xs, f) {
      for (var i = 0, l = xs.length; i < l; i++) {
        f(xs[i], i);
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x)
          return i;
      }
      return -1;
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    module2.exports = Writable;
    var Buffer2 = require("buffer").Buffer;
    Writable.WritableState = WritableState;
    var util2 = require_util();
    util2.inherits = require_inherits();
    var Stream = require("stream");
    util2.inherits(Writable, Stream);
    function WriteReq(chunk, encoding, cb) {
      this.chunk = chunk;
      this.encoding = encoding;
      this.callback = cb;
    }
    function WritableState(options, stream) {
      options = options || {};
      var hwm = options.highWaterMark;
      this.highWaterMark = hwm || hwm === 0 ? hwm : 16 * 1024;
      this.objectMode = !!options.objectMode;
      this.highWaterMark = ~~this.highWaterMark;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.buffer = [];
      this.errorEmitted = false;
    }
    function Writable(options) {
      var Duplex = require_stream_duplex();
      if (!(this instanceof Writable) && !(this instanceof Duplex))
        return new Writable(options);
      this._writableState = new WritableState(options, this);
      this.writable = true;
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit("error", new Error("Cannot pipe. Not readable."));
    };
    function writeAfterEnd(stream, state, cb) {
      var er = new Error("write after end");
      stream.emit("error", er);
      process.nextTick(function() {
        cb(er);
      });
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      if (!Buffer2.isBuffer(chunk) && typeof chunk !== "string" && chunk !== null && chunk !== void 0 && !state.objectMode) {
        var er = new TypeError("Invalid non-string/buffer chunk");
        stream.emit("error", er);
        process.nextTick(function() {
          cb(er);
        });
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (Buffer2.isBuffer(chunk))
        encoding = "buffer";
      else if (!encoding)
        encoding = state.defaultEncoding;
      if (typeof cb !== "function")
        cb = function() {
        };
      if (state.ended)
        writeAfterEnd(this, state, cb);
      else if (validChunk(this, state, chunk, cb))
        ret = writeOrBuffer(this, state, chunk, encoding, cb);
      return ret;
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = new Buffer2(chunk, encoding);
      }
      return chunk;
    }
    function writeOrBuffer(stream, state, chunk, encoding, cb) {
      chunk = decodeChunk(state, chunk, encoding);
      if (Buffer2.isBuffer(chunk))
        encoding = "buffer";
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret)
        state.needDrain = true;
      if (state.writing)
        state.buffer.push(new WriteReq(chunk, encoding, cb));
      else
        doWrite(stream, state, len, chunk, encoding, cb);
      return ret;
    }
    function doWrite(stream, state, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      if (sync)
        process.nextTick(function() {
          cb(er);
        });
      else
        cb(er);
      stream._writableState.errorEmitted = true;
      stream.emit("error", er);
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er)
        onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(stream, state);
        if (!finished && !state.bufferProcessing && state.buffer.length)
          clearBuffer(stream, state);
        if (sync) {
          process.nextTick(function() {
            afterWrite(stream, state, finished, cb);
          });
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished)
        onwriteDrain(stream, state);
      cb();
      if (finished)
        finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      for (var c = 0; c < state.buffer.length; c++) {
        var entry = state.buffer[c];
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state.objectMode ? 1 : chunk.length;
        doWrite(stream, state, len, chunk, encoding, cb);
        if (state.writing) {
          c++;
          break;
        }
      }
      state.bufferProcessing = false;
      if (c < state.buffer.length)
        state.buffer = state.buffer.slice(c);
      else
        state.buffer.length = 0;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error("not implemented"));
    };
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (typeof chunk !== "undefined" && chunk !== null)
        this.write(chunk, encoding);
      if (!state.ending && !state.finished)
        endWritable(this, state, cb);
    };
    function needFinish(stream, state) {
      return state.ending && state.length === 0 && !state.finished && !state.writing;
    }
    function finishMaybe(stream, state) {
      var need = needFinish(stream, state);
      if (need) {
        state.finished = true;
        stream.emit("finish");
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished)
          process.nextTick(cb);
        else
          stream.once("finish", cb);
      }
      state.ended = true;
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    module2.exports = Duplex;
    var objectKeys = Object.keys || function(obj) {
      var keys = [];
      for (var key in obj)
        keys.push(key);
      return keys;
    };
    var util2 = require_util();
    util2.inherits = require_inherits();
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    util2.inherits(Duplex, Readable);
    forEach(objectKeys(Writable.prototype), function(method) {
      if (!Duplex.prototype[method])
        Duplex.prototype[method] = Writable.prototype[method];
    });
    function Duplex(options) {
      if (!(this instanceof Duplex))
        return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      if (options && options.readable === false)
        this.readable = false;
      if (options && options.writable === false)
        this.writable = false;
      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false)
        this.allowHalfOpen = false;
      this.once("end", onend);
    }
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended)
        return;
      process.nextTick(this.end.bind(this));
    }
    function forEach(xs, f) {
      for (var i = 0, l = xs.length; i < l; i++) {
        f(xs[i], i);
      }
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    module2.exports = Transform;
    var Duplex = require_stream_duplex();
    var util2 = require_util();
    util2.inherits = require_inherits();
    util2.inherits(Transform, Duplex);
    function TransformState(options, stream) {
      this.afterTransform = function(er, data) {
        return afterTransform(stream, er, data);
      };
      this.needTransform = false;
      this.transforming = false;
      this.writecb = null;
      this.writechunk = null;
    }
    function afterTransform(stream, er, data) {
      var ts = stream._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb)
        return stream.emit("error", new Error("no writecb in Transform class"));
      ts.writechunk = null;
      ts.writecb = null;
      if (data !== null && data !== void 0)
        stream.push(data);
      if (cb)
        cb(er);
      var rs = stream._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        stream._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform))
        return new Transform(options);
      Duplex.call(this, options);
      var ts = this._transformState = new TransformState(options, this);
      var stream = this;
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      this.once("finish", function() {
        if (typeof this._flush === "function")
          this._flush(function(er) {
            done(stream, er);
          });
        else
          done(stream);
      });
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark)
          this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    function done(stream, er) {
      if (er)
        return stream.emit("error", er);
      var ws = stream._writableState;
      var rs = stream._readableState;
      var ts = stream._transformState;
      if (ws.length)
        throw new Error("calling transform done when ws.length != 0");
      if (ts.transforming)
        throw new Error("calling transform done when still transforming");
      return stream.push(null);
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/transform.js
var require_transform = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/readable-stream/transform.js"(exports2, module2) {
    module2.exports = require_stream_transform();
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/xtend/immutable.js
var require_immutable = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/xtend/immutable.js"(exports2, module2) {
    module2.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend() {
      var target = {};
      for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/through2/through2.js
var require_through2 = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/through2/through2.js"(exports2, module2) {
    var Transform = require_transform();
    var inherits = require("util").inherits;
    var xtend = require_immutable();
    function DestroyableTransform(opts) {
      Transform.call(this, opts);
      this._destroyed = false;
    }
    inherits(DestroyableTransform, Transform);
    DestroyableTransform.prototype.destroy = function(err) {
      if (this._destroyed)
        return;
      this._destroyed = true;
      var self = this;
      process.nextTick(function() {
        if (err)
          self.emit("error", err);
        self.emit("close");
      });
    };
    function noop(chunk, enc, callback) {
      callback(null, chunk);
    }
    function through22(construct) {
      return function(options, transform, flush) {
        if (typeof options == "function") {
          flush = transform;
          transform = options;
          options = {};
        }
        if (typeof transform != "function")
          transform = noop;
        if (typeof flush != "function")
          flush = null;
        return construct(options, transform, flush);
      };
    }
    module2.exports = through22(function(options, transform, flush) {
      var t2 = new DestroyableTransform(options);
      t2._transform = transform;
      if (flush)
        t2._flush = flush;
      return t2;
    });
    module2.exports.ctor = through22(function(options, transform, flush) {
      function Through2(override) {
        if (!(this instanceof Through2))
          return new Through2(override);
        this.options = xtend(options, override);
        DestroyableTransform.call(this, this.options);
      }
      inherits(Through2, DestroyableTransform);
      Through2.prototype._transform = transform;
      if (flush)
        Through2.prototype._flush = flush;
      return Through2;
    });
    module2.exports.obj = through22(function(options, transform, flush) {
      var t2 = new DestroyableTransform(xtend({ objectMode: true, highWaterMark: 16 }, options));
      t2._transform = transform;
      if (flush)
        t2._flush = flush;
      return t2;
    });
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/helper.js
var require_helper = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/helper.js"(exports2, module2) {
    var debug2 = require_src()("regedit");
    var DOUBLY_ESCAPED_WIN_EOL = module2.exports.DOUBLY_ESCAPED_WIN_EOL = "\\\\r\\\\n";
    var DOUBLY_ESCAPED_WIN_EOL_MATCHER = module2.exports.DOUBLY_ESCAPED_WIN_EOL_MATCHER = /\\\\r\\\\n/g;
    var ESCAPED_WIN_EOL = module2.exports.ESCAPED_WIN_EOL = "\\r\\n";
    var WIN_EOL = module2.exports.WIN_EOL = "\r\n";
    module2.exports.encode = function(str) {
      return escape(str) + WIN_EOL;
    };
    module2.exports.writeArrayToStream = function(arr, stream, optionalCallback) {
      var encoding = "utf8";
      var member = arr.pop();
      function write(m) {
        if (m !== void 0) {
          var b = module2.exports.encode(m);
          debug2(b);
          return stream.write(b);
        }
        return false;
      }
      while (write(member)) {
        member = arr.pop();
      }
      if (arr.length === 0) {
        stream.write(WIN_EOL, optionalCallback);
        return;
      }
      stream.once("drain", function() {
        module2.exports.writeArrayToStream(arr, stream, optionalCallback);
      });
    };
    module2.exports.vbsOutputTransform = function(chunk, enc, callback) {
      try {
        if (enc === "buffer") {
          chunk = chunk.toString();
        } else {
          chunk = chunk.toString(enc);
        }
        this.push(JSON.parse(chunk));
      } catch (e) {
        return callback(e);
      }
      return callback();
    };
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/execFile.js
var require_execFile = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/execFile.js"(exports2, module2) {
    var childProcess2 = require("child_process");
    module2.exports = function(options) {
      options = options || {};
      return function execFile2() {
        var child = childProcess2.execFile.apply(childProcess2, arguments);
        if (!options.bufferStdout) {
          child.stdout.removeAllListeners("data");
        }
        if (!options.bufferStderr) {
          child.stderr.removeAllListeners("data");
        }
        return child;
      };
    };
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/if-async/index.js
var require_if_async = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/if-async/index.js"(exports2, module2) {
    var util2 = require("util");
    module2.exports = ifAsync;
    var OK = 0;
    var EXPECT_THEN = 1;
    function ifAsync() {
      var clauses = toArray(arguments);
      var elseClause = elseNoop;
      var fluentState = OK;
      if (clauses.length === 0) {
        throw new Error("at least one predicate and one consequent are required");
      }
      if (clauses.length === 1) {
        fluentState = EXPECT_THEN;
      } else if (clauses.length % 2 === 1) {
        elseClause = clauses.pop();
      }
      var functor = function() {
        if (fluentState !== OK) {
          throw new Error("missing at least one consequent, you forgot to call then() ?");
        }
        var args = arguments;
        var callback = args[args.length - 1];
        if (typeof callback !== "function") {
          throw new Error("missing callback argument");
        }
        var predicate = clauses.shift();
        if (!predicate) {
          return elseClause.apply(null, args);
        }
        var consequent = clauses.shift();
        var replacedCallbackArgs = toArray(args);
        replacedCallbackArgs.pop();
        replacedCallbackArgs.push(predicateCallback);
        predicate.apply(null, replacedCallbackArgs);
        function predicateCallback(err, result) {
          if (err)
            return callback(err);
          if (result) {
            return consequent.apply(null, args);
          } else {
            functor.apply(null, args);
          }
        }
      };
      functor.then = function(fn) {
        if (fluentState !== EXPECT_THEN) {
          throw new Error("not expecting a then() call now");
        }
        fluentState = OK;
        clauses.push(fn);
        return functor;
      };
      functor.and = function(fn) {
        var predicate = clauses.pop();
        clauses.push(ifAsync(predicate).then(fn).else(callbackFalse));
        return functor;
      };
      functor.and.not = function(predicate) {
        return functor.and(not(predicate));
      };
      functor.or = function(fn) {
        var predicate = clauses.pop();
        clauses.push(ifAsync(predicate).then(callbackTrue).elseIf(fn).then(callbackTrue).else(callbackFalse));
        return functor;
      };
      functor.or.not = function(predicate) {
        return functor.or(not(predicate));
      };
      functor.else = function(predicate) {
        if (fluentState === EXPECT_THEN) {
          throw new Error("only then() may be called after elseIf()");
        }
        elseClause = predicate;
        return functor;
      };
      functor.elseif = functor.elseIf = function(predicate) {
        if (fluentState === EXPECT_THEN) {
          throw new Error("only then() may be called after elseIf()");
        }
        clauses.push(predicate);
        fluentState = EXPECT_THEN;
        return functor;
      };
      functor.elseif.not = function(predicate) {
        return functor.elseIf(not(predicate));
      };
      return functor;
    }
    ifAsync.not = function(predicate) {
      if (typeof predicate !== "function") {
        throw new Error("argument must be a predicate function");
      }
      return ifAsync(not(predicate));
    };
    function not(predicate) {
      return function() {
        var args = toArray(arguments);
        var callback = args.pop();
        if (typeof callback !== "function") {
          throw new Error("expected a callback but instead got " + typeof callback);
        }
        args.push(function(err, result) {
          callback(err, !result);
        });
        predicate.apply(null, args);
      };
    }
    function elseNoop() {
      var args = toArray(arguments);
      var callback = args.pop();
      args.unshift(null);
      if (typeof callback !== "function") {
        throw new Error("expected a callback function");
      }
      setImmediate(function() {
        callback.apply(null, args);
      });
    }
    function callbackTrue() {
      var callback = arguments[arguments.length - 1];
      if (typeof callback !== "function") {
        throw new Error("expected a callback function");
      }
      callback(null, true);
    }
    function callbackFalse() {
      var callback = arguments[arguments.length - 1];
      if (typeof callback !== "function") {
        throw new Error("expected a callback function");
      }
      callback(null, false);
    }
    function toArray(args) {
      return Array.prototype.slice.call(args, 0);
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/cscript.js
var require_cscript = __commonJS({
  "../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/lib/cscript.js"(exports2, module2) {
    var ifAsync;
    var fs2;
    var execFile2;
    var debug2;
    var init;
    function resetDependencies() {
      init = false;
      ifAsync = require_if_async();
      fs2 = require("fs");
      execFile2 = require_execFile()({ bufferStdout: true, bufferStderr: true });
      debug2 = require_src()("regedit:cscript");
    }
    resetDependencies();
    var CSCRIPT_NOT_FOUND = module2.exports.CSCRIPT_NOT_FOUND = "INFO: Could not find files for the given pattern(s).";
    var CSCRIPT_EXPECTED_OUTPUT = module2.exports.CSCRIPT_EXPECTED_OUTPUT = "Microsoft (R) Windows Script Host Version";
    var cscript2 = "cscript.exe";
    module2.exports.path = function() {
      if (init === false) {
        throw new Error("must initialize first");
      }
      debug2(cscript2);
      return cscript2;
    };
    module2.exports.init = function(callback) {
      debug2("init()");
      if (init) {
        debug2("already initialized");
        return setImmediate(callback);
      }
      var functor = ifAsync(spawnCScriptSucceeded).or(whereCScriptSucceeded).or(fsStatCScriptSucceeded).then(function(cb) {
        init = true;
        cb();
      }).else(callbackWithError);
      functor(function(err) {
        if (err) {
          return callback(err);
        }
        callback();
      });
    };
    module2.exports._mock = function(_fs, _execFile, _init) {
      fs2 = _fs;
      execFile2 = _execFile;
      init = _init;
    };
    module2.exports._mockReset = resetDependencies;
    function spawnCScriptSucceeded(callback) {
      debug2("spawnCScriptSucceeded()");
      execFile2("cscript.exe", function(err, stdout, stderr) {
        if (err) {
          if (err.code === "ENOENT") {
            return callback(null, false);
          }
          return callback(err);
        }
        cscript2 = "cscript.exe";
        callback(null, stdout.indexOf(CSCRIPT_EXPECTED_OUTPUT) > -1);
      });
    }
    function whereCScriptSucceeded(callback) {
      debug2("whereCScriptSucceeded()");
      execFile2("where cscript.exe", function(err, stdout, stderr) {
        if (err) {
          if (err.code === "ENOENT") {
            return callback(null, false);
          }
          return callback(err);
        }
        if (typeof stdout !== "string") {
          return callback(null, false);
        }
        if (stdout.indexOf(CSCRIPT_NOT_FOUND) > -1) {
          return callback(null, false);
        }
        cscript2 = stdout.trim();
        callback(null, true);
      });
    }
    function fsStatCScriptSucceeded(callback) {
      debug2("fsStatCScriptSucceeded()");
      fs2.stat("c:\\windows\\system32\\cscript.exe", function(err, stat) {
        if (err) {
          if (err.code === "ENOENT") {
            return callback(null, false);
          }
          return callback(err);
        }
        cscript2 = "c:\\windows\\system32\\cscript.exe";
        callback(null, true);
      });
    }
    function callbackWithError(cb) {
      cb(new Error("cscript not found"));
    }
  }
});

// ../../../../.kawi/packages/00a90b6be35255356ba2351a52f92ae2/node_modules/winreg-vbs/index.js
var fs = require("fs");
var util = require("util");
var childProcess = require("child_process");
var path = require("path");
var debug = require_src()("regedit");
var errors = require_errors();
var os = require("os");
var StreamSlicer = require_stream_slicer();
var through2 = require_through2();
var helper = require_helper();
var execFile = require_execFile()();
var cscript = require_cscript();
var OS_ARCH_AGNOSTIC = "A";
var OS_ARCH_SPECIFIC = "S";
var OS_ARCH_32BIT = "32";
var OS_ARCH_64BIT = "64";
var externalVBSFolderLocation = void 0;
module.exports.setExternalVBSLocation = function(newLocation) {
  if (fs.existsSync(newLocation)) {
    externalVBSFolderLocation = newLocation;
    return "Folder found and set";
  }
  return "Folder not found";
};
module.exports.list = function(keys, architecture, callback) {
  if (architecture === void 0) {
    callback = void 0;
    architecture = OS_ARCH_AGNOSTIC;
  } else if (typeof architecture === "function") {
    callback = architecture;
    architecture = OS_ARCH_AGNOSTIC;
  }
  if (typeof keys === "string") {
    keys = [keys];
  }
  if (typeof callback === "function") {
    execute(toCommandArgs("regList.wsf", architecture, keys), callback);
  } else {
    const outputStream = through2.obj(helper.vbsOutputTransform);
    cscript.init(function(err) {
      if (err) {
        return outputStream.emit("error", err);
      }
      const args = baseCommand("regListStream.wsf", architecture);
      const child = execFile(cscript.path(), args, { encoding: "utf8" }, function(err2) {
        if (err2) {
          outputStream.emit("error", err2);
        }
      });
      child.stderr.pipe(process.stderr);
      const slicer = new StreamSlicer({ sliceBy: helper.WIN_EOL });
      child.stdout.pipe(slicer).pipe(outputStream);
      helper.writeArrayToStream(keys, child.stdin);
    });
    return outputStream;
  }
};
module.exports.createKey = function(keys, architecture, callback) {
  if (typeof architecture === "function") {
    callback = architecture;
    architecture = OS_ARCH_AGNOSTIC;
  }
  if (typeof keys === "string") {
    keys = [keys];
  }
  const args = baseCommand("regCreateKey.wsf", architecture);
  spawnEx(args, keys, callback);
};
module.exports.deleteKey = function(keys, architecture, callback) {
  if (typeof architecture === "function") {
    callback = architecture;
    architecture = OS_ARCH_AGNOSTIC;
  }
  if (typeof keys === "string") {
    keys = [keys];
  }
  const args = baseCommand("regDeleteKey.wsf", architecture);
  spawnEx(args, keys, callback);
};
module.exports.deleteValue = function(keys, architecture, callback) {
  if (typeof architecture === "function") {
    callback = architecture;
    architecture = OS_ARCH_AGNOSTIC;
  }
  if (typeof keys === "string") {
    keys = [keys];
  }
  var args = baseCommand("regDeleteValue.wsf", architecture);
  spawnEx(args, keys, callback);
};
module.exports.putValue = function(map, architecture, callback) {
  if (typeof architecture === "function") {
    callback = architecture;
    architecture = OS_ARCH_AGNOSTIC;
  }
  const args = baseCommand("regPutValue.wsf", architecture);
  let values = [];
  for (const key in map) {
    const keyValues = map[key];
    for (const valueName in keyValues) {
      const entry = keyValues[valueName];
      values.push(entry.type);
      values.push(renderValueByType(entry.value, entry.type));
      values.push(valueName);
      values.push(key);
    }
  }
  spawnEx(args, values, callback);
};
module.exports.promisified = {
  list: function(keys, architecture = OS_ARCH_AGNOSTIC) {
    return new Promise(function(resolve, reject) {
      module.exports.list(keys, architecture, function(err, res) {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  },
  createKey: function(keys, architecture = OS_ARCH_AGNOSTIC) {
    return new Promise(function(resolve, reject) {
      module.exports.createKey(keys, architecture, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  },
  deleteKey: function(keys, architecture = OS_ARCH_AGNOSTIC) {
    return new Promise(function(resolve, reject) {
      module.exports.deleteKey(keys, architecture, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  },
  deleteValue: function(keys, architecture = OS_ARCH_AGNOSTIC) {
    return new Promise(function(resolve, reject) {
      module.exports.deleteValue(keys, architecture, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  },
  putValue: function(map, architecture = OS_ARCH_AGNOSTIC) {
    return new Promise(function(resolve, reject) {
      module.exports.putValue(map, architecture, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }
};
module.exports.arch = {};
module.exports.arch.list = function(keys, callback) {
  return module.exports.list(keys, OS_ARCH_SPECIFIC, callback);
};
module.exports.arch.list32 = function(keys, callback) {
  return module.exports.list(keys, OS_ARCH_32BIT, callback);
};
module.exports.arch.list64 = function(keys, callback) {
  return module.exports.list(keys, OS_ARCH_64BIT, callback);
};
module.exports.arch.createKey = function(keys, callback) {
  return module.exports.createKey(keys, OS_ARCH_SPECIFIC, callback);
};
module.exports.arch.createKey32 = function(keys, callback) {
  return module.exports.createKey(keys, OS_ARCH_32BIT, callback);
};
module.exports.arch.createKey64 = function(keys, callback) {
  return module.exports.createKey(keys, OS_ARCH_64BIT, callback);
};
module.exports.arch.deleteKey = function(keys, callback) {
  return module.exports.deleteKey(keys, OS_ARCH_SPECIFIC, callback);
};
module.exports.arch.deleteKey32 = function(keys, callback) {
  return module.exports.deleteKey(keys, OS_ARCH_32BIT, callback);
};
module.exports.arch.deleteKey64 = function(keys, callback) {
  return module.exports.deleteKey(keys, OS_ARCH_64BIT, callback);
};
module.exports.arch.deleteValue = function(keys, callback) {
  return module.exports.deleteValue(keys, OS_ARCH_SPECIFIC, callback);
};
module.exports.arch.deleteValue32 = function(keys, callback) {
  return module.exports.deleteValue(keys, OS_ARCH_32BIT, callback);
};
module.exports.arch.deleteValue64 = function(keys, callback) {
  return module.exports.deleteValue(keys, OS_ARCH_64BIT, callback);
};
module.exports.arch.putValue = function(keys, callback) {
  return module.exports.putValue(keys, OS_ARCH_SPECIFIC, callback);
};
module.exports.arch.putValue32 = function(keys, callback) {
  return module.exports.putValue(keys, OS_ARCH_32BIT, callback);
};
module.exports.arch.putValue64 = function(keys, callback) {
  return module.exports.putValue(keys, OS_ARCH_64BIT, callback);
};
module.exports.arch.promisified = {
  list: function(keys) {
    return module.exports.promisified.list(keys, OS_ARCH_SPECIFIC);
  },
  list32: function(keys) {
    return module.exports.promisified.list(keys, OS_ARCH_32BIT);
  },
  list64: function(keys) {
    return module.exports.promisified.list(keys, OS_ARCH_64BIT);
  },
  createKey: function(keys) {
    return module.exports.promisified.createKey(keys, OS_ARCH_SPECIFIC);
  },
  createKey32: function(keys) {
    return module.exports.promisified.createKey(keys, OS_ARCH_32BIT);
  },
  createKey64: function(keys) {
    return module.exports.promisified.createKey(keys, OS_ARCH_64BIT);
  },
  deleteKey: function(keys) {
    return module.exports.promisified.deleteKey(keys, OS_ARCH_SPECIFIC);
  },
  deleteKey32: function(keys) {
    return module.exports.promisified.deleteKey(keys, OS_ARCH_32BIT);
  },
  deleteKey64: function(keys) {
    return module.exports.promisified.deleteKey(keys, OS_ARCH_64BIT);
  },
  deleteValue: function(keys) {
    return module.exports.promisified.deleteValue(keys, OS_ARCH_SPECIFIC);
  },
  deleteValue32: function(keys) {
    return module.exports.promisified.deleteValue(keys, OS_ARCH_32BIT);
  },
  deleteValue64: function(keys) {
    return module.exports.promisified.deleteValue(keys, OS_ARCH_64BIT);
  },
  putValue: function(keys) {
    return module.exports.promisified.putValue(keys, OS_ARCH_SPECIFIC);
  },
  putValue32: function(keys) {
    return module.exports.promisified.putValue(keys, OS_ARCH_32BIT);
  },
  putValue64: function(keys) {
    return module.exports.promisified.putValue(keys, OS_ARCH_64BIT);
  }
};
function execute(args, callback) {
  if (typeof callback !== "function") {
    throw new Error("missing callback");
  }
  debug(args);
  cscript.init(function(err) {
    if (err) {
      return callback(err);
    }
    childProcess.execFile(cscript.path(), args, function(err2, stdout, stderr) {
      if (err2) {
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.error(stderr);
        }
        if (err2.code in errors) {
          return callback(errors[err2.code]);
        }
        return callback(err2);
      }
      if (stderr) {
        return callback(new Error(stderr));
      }
      if (!stdout) {
        return callback();
      }
      debug(stdout);
      let result;
      err2 = null;
      try {
        result = JSON.parse(stdout);
      } catch (e) {
        e.stdout = stdout;
        err2 = e;
      }
      callback(err2, result);
    });
  });
}
function spawnEx(args, keys, callback) {
  cscript.init(function(err) {
    if (err) {
      return callback(err);
    }
    debug(args);
    const child = execFile(cscript.path(), args, { encoding: "utf8" });
    handleErrorsAndClose(child, callback);
    helper.writeArrayToStream(keys, child.stdin);
  });
}
function handleErrorsAndClose(child, callback) {
  let error;
  child.once("error", function(e) {
    debug("process error %s", e);
    error = e;
  });
  child.once("close", function(code) {
    debug("process exit with code %d", code);
    if (error) {
      if (error.code in errors) {
        return callback(errors[error.code]);
      }
      return callback(error);
    }
    if (code !== 0) {
      if (code in errors) {
        return callback(errors[code]);
      }
      return callback(new Error("vbscript process reported unknown error code " + code));
    }
    callback();
  });
}
function renderValueByType(value, type) {
  type = type.toUpperCase();
  switch (type) {
    case "REG_NONE":
      if (value === "") {
        return "\0";
      }
      return value;
    case "REG_BINARY":
      if (!util.isArray(value)) {
        throw new Error("invalid value type " + typeof value + " for registry type REG_BINARY, please use an array of numbers");
      }
      return value.join(",");
    case "REG_MULTI_SZ":
      if (!util.isArray(value)) {
        throw new Error("invalid value type " + typeof value + " for registry type REG_BINARY, please use an array of strings");
      }
      return value.join(",");
    case "REG_SZ":
      if (value === "") {
        return "\0";
      }
      return value;
    default:
      return value;
  }
}
function toCommandArgs(cmd, arch, keys) {
  let result = baseCommand(cmd, arch);
  if (typeof keys === "string") {
    result.push(keys);
  } else if (util.isArray(keys)) {
    result = result.concat(keys);
  } else {
    debug("creating command without using keys %s", keys ? keys : "");
  }
  return result;
}
function baseCommand(cmd, arch) {
  let scriptPath;
  if (externalVBSFolderLocation && typeof externalVBSFolderLocation === "string") {
    scriptPath = externalVBSFolderLocation;
  } else {
    scriptPath = path.join(__dirname, "vbs");
  }
  return ["//Nologo", path.join(scriptPath, cmd), arch];
}

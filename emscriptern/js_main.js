var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = function print(x) {
  process["stdout"].write(x + "\n");
 };
 if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
  process["stderr"].write(x + "\n");
 };
 var nodeFS = require("fs");
 var nodePath = require("path");
 Module["read"] = function read(filename, binary) {
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  if (!ret && filename != nodePath["resolve"](filename)) {
   filename = path.join(__dirname, "..", "src", filename);
   ret = nodeFS["readFileSync"](filename);
  }
  if (ret && !binary) ret = ret.toString();
  return ret;
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 if (!Module["thisProgram"]) {
  if (process["argv"].length > 1) {
   Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  } else {
   Module["thisProgram"] = "unknown-program";
  }
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available (jsc?)";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  var data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.log(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WORKER) {
  Module["load"] = importScripts;
 }
 if (typeof Module["setWindowTitle"] === "undefined") {
  Module["setWindowTitle"] = (function(title) {
   document.title = title;
  });
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
 Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 STACK_ALIGN: 16,
 prepVararg: (function(ptr, type) {
  if (type === "double" || type === "i64") {
   if (ptr & 7) {
    assert((ptr & 7) === 4);
    ptr += 4;
   }
  } else {
   assert((ptr & 3) === 0);
  }
  return ptr;
 }),
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   if (!args.splice) args = Array.prototype.slice.call(args);
   args.splice(0, 0, ptr);
   return Module["dynCall_" + sig].apply(null, args);
  } else {
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[sig]) {
   Runtime.funcWrappers[sig] = {};
  }
  var sigCache = Runtime.funcWrappers[sig];
  if (!sigCache[func]) {
   sigCache[func] = function dynCall_wrapper() {
    return Runtime.dynCall(sig, func, arguments);
   };
  }
  return sigCache[func];
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 15 & -16;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size | 0;
  STATICTOP = STATICTOP + 15 & -16;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = DYNAMICTOP;
  DYNAMICTOP = DYNAMICTOP + size | 0;
  DYNAMICTOP = DYNAMICTOP + 15 & -16;
  if (DYNAMICTOP >= TOTAL_MEMORY) {
   var success = enlargeMemory();
   if (!success) {
    DYNAMICTOP = ret;
    return 0;
   }
  }
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
var globalScope = this;
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var JSfuncs = {
  "stackSave": (function() {
   Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore();
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = Runtime.stackAlloc((str.length << 2) + 1);
    writeStringToMemory(str, ret);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) {
   if (opts && opts.async) {
    EmterpreterAsync.asyncFinalizers.push((function() {
     Runtime.stackRestore(stack);
    }));
    return;
   }
   Runtime.stackRestore(stack);
  }
  return ret;
 };
 var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = {};
 for (var fun in JSfuncs) {
  if (JSfuncs.hasOwnProperty(fun)) {
   JSsource[fun] = parseJSFunc(JSfuncs[fun]);
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  argTypes = argTypes || [];
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   funcstr += "var stack = " + JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=" + convertCode.returnValue + ";";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  if (!numericArgs) {
   funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
 if (!staticSealed) return Runtime.staticAlloc(size);
 if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = HEAP8[ptr++ >> 0];
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
function UTF8ArrayToString(u8Array, idx) {
 var u0, u1, u2, u3, u4, u5;
 var str = "";
 while (1) {
  u0 = u8Array[idx++];
  if (!u0) return str;
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  u1 = u8Array[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  u2 = u8Array[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u3 = u8Array[idx++] & 63;
   if ((u0 & 248) == 240) {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
   } else {
    u4 = u8Array[idx++] & 63;
    if ((u0 & 252) == 248) {
     u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
    } else {
     u5 = u8Array[idx++] & 63;
     u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
    }
   }
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
function UTF16ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var codeUnit = HEAP16[ptr + i * 2 >> 1];
  if (codeUnit == 0) return str;
  ++i;
  str += String.fromCharCode(codeUnit);
 }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;
function lengthBytesUTF16(str) {
 return str.length * 2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;
function UTF32ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) return str;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;
function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;
function demangle(func) {
 var hasLibcxxabi = !!Module["___cxa_demangle"];
 if (hasLibcxxabi) {
  try {
   var buf = _malloc(func.length);
   writeStringToMemory(func.substr(1), buf);
   var status = _malloc(4);
   var ret = Module["___cxa_demangle"](buf, 0, 0, status);
   if (getValue(status, "i32") === 0 && ret) {
    return Pointer_stringify(ret);
   }
  } catch (e) {} finally {
   if (buf) _free(buf);
   if (status) _free(status);
   if (ret) _free(ret);
  }
 }
 var i = 3;
 var basicTypes = {
  "v": "void",
  "b": "bool",
  "c": "char",
  "s": "short",
  "i": "int",
  "l": "long",
  "f": "float",
  "d": "double",
  "w": "wchar_t",
  "a": "signed char",
  "h": "unsigned char",
  "t": "unsigned short",
  "j": "unsigned int",
  "m": "unsigned long",
  "x": "long long",
  "y": "unsigned long long",
  "z": "..."
 };
 var subs = [];
 var first = true;
 function dump(x) {
  if (x) Module.print(x);
  Module.print(func);
  var pre = "";
  for (var a = 0; a < i; a++) pre += " ";
  Module.print(pre + "^");
 }
 function parseNested() {
  i++;
  if (func[i] === "K") i++;
  var parts = [];
  while (func[i] !== "E") {
   if (func[i] === "S") {
    i++;
    var next = func.indexOf("_", i);
    var num = func.substring(i, next) || 0;
    parts.push(subs[num] || "?");
    i = next + 1;
    continue;
   }
   if (func[i] === "C") {
    parts.push(parts[parts.length - 1]);
    i += 2;
    continue;
   }
   var size = parseInt(func.substr(i));
   var pre = size.toString().length;
   if (!size || !pre) {
    i--;
    break;
   }
   var curr = func.substr(i + pre, size);
   parts.push(curr);
   subs.push(curr);
   i += pre + size;
  }
  i++;
  return parts;
 }
 function parse(rawList, limit, allowVoid) {
  limit = limit || Infinity;
  var ret = "", list = [];
  function flushList() {
   return "(" + list.join(", ") + ")";
  }
  var name;
  if (func[i] === "N") {
   name = parseNested().join("::");
   limit--;
   if (limit === 0) return rawList ? [ name ] : name;
  } else {
   if (func[i] === "K" || first && func[i] === "L") i++;
   var size = parseInt(func.substr(i));
   if (size) {
    var pre = size.toString().length;
    name = func.substr(i + pre, size);
    i += pre + size;
   }
  }
  first = false;
  if (func[i] === "I") {
   i++;
   var iList = parse(true);
   var iRet = parse(true, 1, true);
   ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">";
  } else {
   ret = name;
  }
  paramLoop : while (i < func.length && limit-- > 0) {
   var c = func[i++];
   if (c in basicTypes) {
    list.push(basicTypes[c]);
   } else {
    switch (c) {
    case "P":
     list.push(parse(true, 1, true)[0] + "*");
     break;
    case "R":
     list.push(parse(true, 1, true)[0] + "&");
     break;
    case "L":
     {
      i++;
      var end = func.indexOf("E", i);
      var size = end - i;
      list.push(func.substr(i, size));
      i += size + 2;
      break;
     }
    case "A":
     {
      var size = parseInt(func.substr(i));
      i += size.toString().length;
      if (func[i] !== "_") throw "?";
      i++;
      list.push(parse(true, 1, true)[0] + " [" + size + "]");
      break;
     }
    case "E":
     break paramLoop;
    default:
     ret += "?" + c;
     break paramLoop;
    }
   }
  }
  if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
  if (rawList) {
   if (ret) {
    list.push(ret + "?");
   }
   return list;
  } else {
   return ret + flushList();
  }
 }
 var parsed = func;
 try {
  if (func == "Object._main" || func == "_main") {
   return "main()";
  }
  if (typeof func === "number") func = Pointer_stringify(func);
  if (func[0] !== "_") return func;
  if (func[1] !== "_") return func;
  if (func[2] !== "Z") return func;
  switch (func[3]) {
  case "n":
   return "operator new()";
  case "d":
   return "operator delete()";
  }
  parsed = parse();
 } catch (e) {
  parsed += "?";
 }
 if (parsed.indexOf("?") >= 0 && !hasLibcxxabi) {
  Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 }
 return parsed;
}
function demangleAll(text) {
 return text.replace(/__Z[\w\d_]+/g, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
 if (x % 4096 > 0) {
  x += 4096 - x % 4096;
 }
 return x;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function abortOnCannotGrowMemory() {
 abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}
function enlargeMemory() {
 abortOnCannotGrowMemory();
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 2e7;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
 if (totalMemory < 16 * 1024 * 1024) {
  totalMemory *= 2;
 } else {
  totalMemory += 16 * 1024 * 1024;
 }
}
if (totalMemory !== TOTAL_MEMORY) {
 TOTAL_MEMORY = totalMemory;
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
var buffer;
buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Runtime.dynCall("v", func);
   } else {
    Runtime.dynCall("vi", func, [ callback.arg ]);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 var array = intArrayFromString(string, dontAddNull);
 var i = 0;
 while (i < array.length) {
  var chr = array[i];
  HEAP8[buffer + i >> 0] = chr;
  i = i + 1;
 }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 for (var i = 0; i < array.length; i++) {
  HEAP8[buffer++ >> 0] = array[i];
 }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function unSign(value, bits, ignore) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}
function reSign(value, bits, ignore) {
 if (value <= 0) {
  return value;
 }
 var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
 if (value >= half && (bits <= 32 || value > half)) {
  value = -2 * half + value;
 }
 return value;
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
 x = x >>> 0;
 for (var i = 0; i < 32; i++) {
  if (x & 1 << 31 - i) return i;
 }
 return 32;
});
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
 return id;
}
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [ (function($0, $1) {
 dbgPolyStart($0, $1);
}), (function($0, $1) {
 dbgPolyPoint($0, $1);
}), (function() {
 dbgPolyEnd();
}), (function($0, $1, $2, $3, $4) {
 drawImg($0, $1, Pointer_stringify($2), $3, $4);
}), (function($0, $1, $2) {
 drawCircle($0, $1, null, HOVER_OUTLINE_COL, $2 + HOVER_OUTLINE_OFFSET);
}), (function($0, $1, $2) {
 drawCircle($0, $1, "#ffffff", null, $2 + HOVER_OUTLINE_ERASE);
}), (function($0, $1, $2) {
 drawCircle($0, $1, HOVER_MASK_COL, null, $2);
}), (function($0, $1, $2, $3) {
 drawCircle($0, $1, Pointer_stringify($2), null, $3);
}) ];
function _emscripten_asm_const_0(code) {
 return ASM_CONSTS[code]();
}
function _emscripten_asm_const_2(code, a0, a1) {
 return ASM_CONSTS[code](a0, a1);
}
function _emscripten_asm_const_3(code, a0, a1, a2) {
 return ASM_CONSTS[code](a0, a1, a2);
}
function _emscripten_asm_const_4(code, a0, a1, a2, a3) {
 return ASM_CONSTS[code](a0, a1, a2, a3);
}
function _emscripten_asm_const_5(code, a0, a1, a2, a3, a4) {
 return ASM_CONSTS[code](a0, a1, a2, a3, a4);
}
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 14e3;
__ATINIT__.push({
 func: (function() {
  __GLOBAL__sub_I_js_main_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_bind_cpp();
 })
});
allocate([ 24, 6, 0, 0, 187, 11, 0, 0, 64, 6, 0, 0, 173, 11, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 206, 11, 0, 0, 64, 6, 0, 0, 195, 11, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 228, 11, 0, 0, 64, 6, 0, 0, 212, 11, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 146, 14, 0, 0, 248, 0, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 160, 14, 0, 0, 248, 0, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 176, 14, 0, 0, 248, 0, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 193, 14, 0, 0, 64, 6, 0, 0, 211, 14, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 237, 14, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 8, 15, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 26, 15, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 54, 15, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 73, 15, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 98, 15, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 109, 31, 0, 0, 24, 6, 0, 0, 98, 31, 0, 0, 24, 6, 0, 0, 118, 31, 0, 0, 104, 6, 0, 0, 63, 37, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 1, 0, 0, 0, 0, 0, 0, 104, 6, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 1, 0, 0, 0, 0, 0, 0, 104, 6, 0, 0, 155, 36, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 1, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 136, 36, 0, 0, 24, 6, 0, 0, 105, 36, 0, 0, 24, 6, 0, 0, 74, 36, 0, 0, 24, 6, 0, 0, 43, 36, 0, 0, 24, 6, 0, 0, 12, 36, 0, 0, 24, 6, 0, 0, 237, 35, 0, 0, 24, 6, 0, 0, 206, 35, 0, 0, 24, 6, 0, 0, 175, 35, 0, 0, 24, 6, 0, 0, 144, 35, 0, 0, 24, 6, 0, 0, 113, 35, 0, 0, 24, 6, 0, 0, 82, 35, 0, 0, 24, 6, 0, 0, 51, 35, 0, 0, 24, 6, 0, 0, 20, 35, 0, 0, 24, 6, 0, 0, 218, 36, 0, 0, 64, 6, 0, 0, 126, 37, 0, 0, 216, 1, 0, 0, 0, 0, 0, 0, 24, 6, 0, 0, 139, 37, 0, 0, 24, 6, 0, 0, 152, 37, 0, 0, 64, 6, 0, 0, 165, 37, 0, 0, 224, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 198, 37, 0, 0, 232, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 12, 38, 0, 0, 232, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 232, 37, 0, 0, 8, 2, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 46, 38, 0, 0, 232, 1, 0, 0, 0, 0, 0, 0, 252, 5, 0, 0, 86, 38, 0, 0, 252, 5, 0, 0, 88, 38, 0, 0, 252, 5, 0, 0, 90, 38, 0, 0, 252, 5, 0, 0, 92, 38, 0, 0, 252, 5, 0, 0, 94, 38, 0, 0, 252, 5, 0, 0, 96, 38, 0, 0, 252, 5, 0, 0, 98, 38, 0, 0, 252, 5, 0, 0, 100, 38, 0, 0, 252, 5, 0, 0, 102, 38, 0, 0, 252, 5, 0, 0, 104, 38, 0, 0, 252, 5, 0, 0, 106, 38, 0, 0, 252, 5, 0, 0, 108, 38, 0, 0, 252, 5, 0, 0, 110, 38, 0, 0, 64, 6, 0, 0, 112, 38, 0, 0, 248, 1, 0, 0, 0, 0, 0, 0, 64, 6, 0, 0, 149, 38, 0, 0, 248, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 137, 136, 136, 60, 6, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 56, 2, 0, 0, 64, 2, 0, 0, 56, 2, 0, 0, 144, 2, 0, 0, 144, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 32, 0, 0, 0, 64, 0, 0, 0, 96, 0, 0, 0, 128, 0, 0, 0, 160, 0, 0, 0, 192, 0, 0, 0, 224, 0, 0, 0, 0, 1, 0, 0, 64, 1, 0, 0, 128, 1, 0, 0, 192, 1, 0, 0, 0, 2, 0, 0, 128, 2, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 1, 0, 0, 0, 180, 3, 0, 0, 192, 5, 0, 0, 0, 0, 0, 0, 136, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 152, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 168, 0, 0, 0, 6, 0, 0, 0, 10, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 216, 0, 0, 0, 7, 0, 0, 0, 10, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 232, 0, 0, 0, 8, 0, 0, 0, 10, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 184, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 200, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 18, 0, 0, 0, 19, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 96, 0, 0, 0, 18, 0, 0, 0, 20, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 12, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 112, 0, 0, 0, 18, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 13, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 22, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 8, 1, 0, 0, 23, 0, 0, 0, 24, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 200, 1, 0, 0, 25, 0, 0, 0, 26, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 2, 0, 0, 27, 0, 0, 0, 28, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 248, 1, 0, 0, 27, 0, 0, 0, 31, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 160, 2, 0, 0, 27, 0, 0, 0, 32, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 176, 2, 0, 0, 27, 0, 0, 0, 33, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 7, 0, 0, 176, 7, 0, 0, 176, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 140, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 9, 0, 0, 0, 132, 48, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 98, 103, 80, 111, 108, 121, 83, 116, 97, 114, 116, 40, 36, 48, 44, 32, 36, 49, 41, 0, 100, 98, 103, 80, 111, 108, 121, 80, 111, 105, 110, 116, 40, 36, 48, 44, 32, 36, 49, 41, 0, 100, 98, 103, 80, 111, 108, 121, 69, 110, 100, 40, 41, 0, 110, 111, 114, 109, 95, 114, 101, 100, 0, 110, 111, 114, 109, 95, 103, 114, 101, 101, 110, 0, 110, 111, 114, 109, 95, 98, 108, 117, 101, 0, 100, 114, 97, 119, 73, 109, 103, 40, 36, 48, 44, 32, 36, 49, 44, 32, 80, 111, 105, 110, 116, 101, 114, 95, 115, 116, 114, 105, 110, 103, 105, 102, 121, 40, 36, 50, 41, 44, 32, 36, 51, 44, 32, 36, 52, 41, 0, 100, 114, 97, 119, 67, 105, 114, 99, 108, 101, 40, 36, 48, 44, 32, 36, 49, 44, 32, 110, 117, 108, 108, 44, 32, 72, 79, 86, 69, 82, 95, 79, 85, 84, 76, 73, 78, 69, 95, 67, 79, 76, 44, 32, 36, 50, 43, 72, 79, 86, 69, 82, 95, 79, 85, 84, 76, 73, 78, 69, 95, 79, 70, 70, 83, 69, 84, 41, 0, 100, 114, 97, 119, 67, 105, 114, 99, 108, 101, 40, 36, 48, 44, 32, 36, 49, 44, 32, 34, 35, 102, 102, 102, 102, 102, 102, 34, 44, 32, 110, 117, 108, 108, 44, 32, 36, 50, 43, 72, 79, 86, 69, 82, 95, 79, 85, 84, 76, 73, 78, 69, 95, 69, 82, 65, 83, 69, 41, 0, 100, 114, 97, 119, 67, 105, 114, 99, 108, 101, 40, 36, 48, 44, 32, 36, 49, 44, 32, 72, 79, 86, 69, 82, 95, 77, 65, 83, 75, 95, 67, 79, 76, 44, 32, 110, 117, 108, 108, 44, 32, 36, 50, 41, 0, 41, 0, 100, 114, 97, 119, 67, 105, 114, 99, 108, 101, 40, 36, 48, 44, 32, 36, 49, 44, 32, 80, 111, 105, 110, 116, 101, 114, 95, 115, 116, 114, 105, 110, 103, 105, 102, 121, 40, 36, 50, 41, 44, 32, 110, 117, 108, 108, 44, 32, 36, 51, 41, 0, 105, 110, 105, 116, 83, 116, 97, 114, 116, 0, 99, 112, 112, 95, 112, 114, 111, 103, 114, 101, 115, 115, 0, 99, 112, 112, 95, 100, 114, 97, 119, 0, 109, 111, 117, 115, 101, 95, 104, 111, 118, 101, 114, 0, 109, 111, 117, 115, 101, 95, 117, 112, 0, 49, 49, 74, 115, 68, 101, 98, 117, 103, 68, 114, 97, 119, 0, 54, 98, 50, 68, 114, 97, 119, 0, 57, 66, 108, 97, 115, 116, 65, 110, 105, 109, 0, 52, 65, 110, 105, 109, 0, 49, 51, 77, 111, 117, 115, 101, 67, 97, 108, 108, 98, 97, 99, 107, 0, 49, 53, 98, 50, 81, 117, 101, 114, 121, 67, 97, 108, 108, 98, 97, 99, 107, 0, 66, 85, 71, 33, 0, 114, 103, 98, 97, 40, 0, 44, 0, 118, 105, 0, 105, 105, 0, 118, 105, 102, 102, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 49, 49, 98, 50, 69, 100, 103, 101, 83, 104, 97, 112, 101, 0, 49, 51, 98, 50, 67, 105, 114, 99, 108, 101, 83, 104, 97, 112, 101, 0, 49, 52, 98, 50, 80, 111, 108, 121, 103, 111, 110, 83, 104, 97, 112, 101, 0, 49, 53, 98, 50, 67, 111, 110, 116, 97, 99, 116, 70, 105, 108, 116, 101, 114, 0, 50, 51, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 50, 52, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 49, 53, 98, 50, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 50, 53, 98, 50, 80, 111, 108, 121, 103, 111, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 49, 54, 98, 50, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 50, 50, 98, 50, 69, 100, 103, 101, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 50, 51, 98, 50, 69, 100, 103, 101, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 83, 104, 97, 112, 101, 115, 47, 98, 50, 67, 104, 97, 105, 110, 83, 104, 97, 112, 101, 46, 99, 112, 112, 0, 48, 32, 60, 32, 115, 105, 122, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 109, 109, 111, 110, 47, 98, 50, 66, 108, 111, 99, 107, 65, 108, 108, 111, 99, 97, 116, 111, 114, 46, 99, 112, 112, 0, 65, 108, 108, 111, 99, 97, 116, 101, 0, 48, 32, 60, 61, 32, 105, 110, 100, 101, 120, 32, 38, 38, 32, 105, 110, 100, 101, 120, 32, 60, 32, 98, 50, 95, 98, 108, 111, 99, 107, 83, 105, 122, 101, 115, 0, 98, 108, 111, 99, 107, 67, 111, 117, 110, 116, 32, 42, 32, 98, 108, 111, 99, 107, 83, 105, 122, 101, 32, 60, 61, 32, 98, 50, 95, 99, 104, 117, 110, 107, 83, 105, 122, 101, 0, 48, 32, 60, 61, 32, 105, 110, 100, 101, 120, 32, 38, 38, 32, 105, 110, 100, 101, 120, 32, 60, 32, 109, 95, 99, 111, 117, 110, 116, 32, 45, 32, 49, 0, 71, 101, 116, 67, 104, 105, 108, 100, 69, 100, 103, 101, 0, 82, 97, 121, 67, 97, 115, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 83, 104, 97, 112, 101, 115, 47, 98, 50, 80, 111, 108, 121, 103, 111, 110, 83, 104, 97, 112, 101, 46, 99, 112, 112, 0, 83, 101, 116, 0, 102, 97, 108, 115, 101, 0, 97, 114, 101, 97, 32, 62, 32, 49, 46, 49, 57, 50, 48, 57, 50, 56, 57, 53, 53, 48, 55, 56, 49, 50, 53, 101, 45, 48, 55, 70, 0, 48, 46, 48, 102, 32, 60, 61, 32, 108, 111, 119, 101, 114, 32, 38, 38, 32, 108, 111, 119, 101, 114, 32, 60, 61, 32, 105, 110, 112, 117, 116, 46, 109, 97, 120, 70, 114, 97, 99, 116, 105, 111, 110, 0, 109, 95, 99, 111, 117, 110, 116, 32, 62, 61, 32, 51, 0, 67, 111, 109, 112, 117, 116, 101, 77, 97, 115, 115, 0, 48, 32, 60, 61, 32, 112, 114, 111, 120, 121, 73, 100, 32, 38, 38, 32, 112, 114, 111, 120, 121, 73, 100, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 68, 121, 110, 97, 109, 105, 99, 84, 114, 101, 101, 46, 99, 112, 112, 0, 109, 95, 110, 111, 100, 101, 115, 91, 112, 114, 111, 120, 121, 73, 100, 93, 46, 73, 115, 76, 101, 97, 102, 40, 41, 0, 48, 32, 60, 61, 32, 110, 111, 100, 101, 73, 100, 32, 38, 38, 32, 110, 111, 100, 101, 73, 100, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 70, 114, 101, 101, 78, 111, 100, 101, 0, 48, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 111, 117, 110, 116, 0, 77, 111, 118, 101, 80, 114, 111, 120, 121, 0, 100, 101, 110, 32, 62, 32, 48, 46, 48, 102, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 67, 111, 108, 108, 105, 100, 101, 69, 100, 103, 101, 46, 99, 112, 112, 0, 98, 50, 67, 111, 108, 108, 105, 100, 101, 69, 100, 103, 101, 65, 110, 100, 67, 105, 114, 99, 108, 101, 0, 48, 32, 60, 61, 32, 101, 100, 103, 101, 49, 32, 38, 38, 32, 101, 100, 103, 101, 49, 32, 60, 32, 112, 111, 108, 121, 49, 45, 62, 109, 95, 99, 111, 117, 110, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 67, 111, 108, 108, 105, 100, 101, 80, 111, 108, 121, 103, 111, 110, 46, 99, 112, 112, 0, 98, 50, 70, 105, 110, 100, 73, 110, 99, 105, 100, 101, 110, 116, 69, 100, 103, 101, 0, 48, 32, 60, 61, 32, 105, 110, 100, 101, 120, 32, 38, 38, 32, 105, 110, 100, 101, 120, 32, 60, 32, 99, 104, 97, 105, 110, 45, 62, 109, 95, 99, 111, 117, 110, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 68, 105, 115, 116, 97, 110, 99, 101, 46, 99, 112, 112, 0, 98, 50, 68, 105, 115, 116, 97, 110, 99, 101, 0, 71, 101, 116, 67, 108, 111, 115, 101, 115, 116, 80, 111, 105, 110, 116, 0, 48, 32, 60, 61, 32, 105, 110, 100, 101, 120, 32, 38, 38, 32, 105, 110, 100, 101, 120, 32, 60, 32, 109, 95, 99, 111, 117, 110, 116, 0, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 92, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 68, 105, 115, 116, 97, 110, 99, 101, 46, 104, 0, 71, 101, 116, 86, 101, 114, 116, 101, 120, 0, 71, 101, 116, 87, 105, 116, 110, 101, 115, 115, 80, 111, 105, 110, 116, 115, 0, 71, 101, 116, 77, 101, 116, 114, 105, 99, 0, 109, 95, 110, 111, 100, 101, 67, 111, 117, 110, 116, 32, 61, 61, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 65, 108, 108, 111, 99, 97, 116, 101, 78, 111, 100, 101, 0, 99, 104, 105, 108, 100, 49, 32, 33, 61, 32, 40, 45, 49, 41, 0, 73, 110, 115, 101, 114, 116, 76, 101, 97, 102, 0, 99, 104, 105, 108, 100, 50, 32, 33, 61, 32, 40, 45, 49, 41, 0, 105, 65, 32, 33, 61, 32, 40, 45, 49, 41, 0, 66, 97, 108, 97, 110, 99, 101, 0, 48, 32, 60, 61, 32, 105, 66, 32, 38, 38, 32, 105, 66, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 48, 32, 60, 61, 32, 105, 67, 32, 38, 38, 32, 105, 67, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 48, 32, 60, 61, 32, 105, 70, 32, 38, 38, 32, 105, 70, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 48, 32, 60, 61, 32, 105, 71, 32, 38, 38, 32, 105, 71, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 109, 95, 110, 111, 100, 101, 115, 91, 67, 45, 62, 112, 97, 114, 101, 110, 116, 93, 46, 99, 104, 105, 108, 100, 50, 32, 61, 61, 32, 105, 65, 0, 48, 32, 60, 61, 32, 105, 68, 32, 38, 38, 32, 105, 68, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 48, 32, 60, 61, 32, 105, 69, 32, 38, 38, 32, 105, 69, 32, 60, 32, 109, 95, 110, 111, 100, 101, 67, 97, 112, 97, 99, 105, 116, 121, 0, 109, 95, 110, 111, 100, 101, 115, 91, 66, 45, 62, 112, 97, 114, 101, 110, 116, 93, 46, 99, 104, 105, 108, 100, 50, 32, 61, 61, 32, 105, 65, 0, 116, 97, 114, 103, 101, 116, 32, 62, 32, 116, 111, 108, 101, 114, 97, 110, 99, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 84, 105, 109, 101, 79, 102, 73, 109, 112, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 84, 105, 109, 101, 79, 102, 73, 109, 112, 97, 99, 116, 0, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 0, 106, 32, 60, 32, 98, 50, 95, 98, 108, 111, 99, 107, 83, 105, 122, 101, 115, 0, 98, 50, 66, 108, 111, 99, 107, 65, 108, 108, 111, 99, 97, 116, 111, 114, 0, 70, 114, 101, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 67, 111, 109, 109, 111, 110, 47, 98, 50, 83, 116, 97, 99, 107, 65, 108, 108, 111, 99, 97, 116, 111, 114, 46, 99, 112, 112, 0, 109, 95, 101, 110, 116, 114, 121, 67, 111, 117, 110, 116, 32, 60, 32, 98, 50, 95, 109, 97, 120, 83, 116, 97, 99, 107, 69, 110, 116, 114, 105, 101, 115, 0, 109, 95, 101, 110, 116, 114, 121, 67, 111, 117, 110, 116, 32, 62, 32, 48, 0, 112, 32, 61, 61, 32, 101, 110, 116, 114, 121, 45, 62, 100, 97, 116, 97, 0, 98, 100, 45, 62, 112, 111, 115, 105, 116, 105, 111, 110, 46, 73, 115, 86, 97, 108, 105, 100, 40, 41, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 98, 50, 66, 111, 100, 121, 46, 99, 112, 112, 0, 98, 50, 66, 111, 100, 121, 0, 98, 100, 45, 62, 108, 105, 110, 101, 97, 114, 86, 101, 108, 111, 99, 105, 116, 121, 46, 73, 115, 86, 97, 108, 105, 100, 40, 41, 0, 98, 50, 73, 115, 86, 97, 108, 105, 100, 40, 98, 100, 45, 62, 97, 110, 103, 108, 101, 41, 0, 98, 50, 73, 115, 86, 97, 108, 105, 100, 40, 98, 100, 45, 62, 97, 110, 103, 117, 108, 97, 114, 86, 101, 108, 111, 99, 105, 116, 121, 41, 0, 98, 50, 73, 115, 86, 97, 108, 105, 100, 40, 98, 100, 45, 62, 97, 110, 103, 117, 108, 97, 114, 68, 97, 109, 112, 105, 110, 103, 41, 32, 38, 38, 32, 98, 100, 45, 62, 97, 110, 103, 117, 108, 97, 114, 68, 97, 109, 112, 105, 110, 103, 32, 62, 61, 32, 48, 46, 48, 102, 0, 98, 50, 73, 115, 86, 97, 108, 105, 100, 40, 98, 100, 45, 62, 108, 105, 110, 101, 97, 114, 68, 97, 109, 112, 105, 110, 103, 41, 32, 38, 38, 32, 98, 100, 45, 62, 108, 105, 110, 101, 97, 114, 68, 97, 109, 112, 105, 110, 103, 32, 62, 61, 32, 48, 46, 48, 102, 0, 109, 95, 119, 111, 114, 108, 100, 45, 62, 73, 115, 76, 111, 99, 107, 101, 100, 40, 41, 32, 61, 61, 32, 102, 97, 108, 115, 101, 0, 109, 95, 116, 121, 112, 101, 32, 61, 61, 32, 98, 50, 95, 100, 121, 110, 97, 109, 105, 99, 66, 111, 100, 121, 0, 82, 101, 115, 101, 116, 77, 97, 115, 115, 68, 97, 116, 97, 0, 109, 95, 73, 32, 62, 32, 48, 46, 48, 102, 0, 67, 114, 101, 97, 116, 101, 70, 105, 120, 116, 117, 114, 101, 0, 68, 101, 115, 116, 114, 111, 121, 0, 83, 101, 116, 84, 114, 97, 110, 115, 102, 111, 114, 109, 0, 115, 95, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 61, 61, 32, 116, 114, 117, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 48, 32, 60, 61, 32, 116, 121, 112, 101, 65, 32, 38, 38, 32, 116, 121, 112, 101, 66, 32, 60, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 116, 121, 112, 101, 67, 111, 117, 110, 116, 0, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 92, 66, 111, 120, 50, 68, 47, 67, 111, 108, 108, 105, 115, 105, 111, 110, 47, 98, 50, 68, 121, 110, 97, 109, 105, 99, 84, 114, 101, 101, 46, 104, 0, 71, 101, 116, 70, 97, 116, 65, 65, 66, 66, 0, 48, 32, 60, 61, 32, 116, 121, 112, 101, 49, 32, 38, 38, 32, 116, 121, 112, 101, 49, 32, 60, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 116, 121, 112, 101, 67, 111, 117, 110, 116, 0, 67, 114, 101, 97, 116, 101, 0, 48, 32, 60, 61, 32, 116, 121, 112, 101, 50, 32, 38, 38, 32, 116, 121, 112, 101, 50, 32, 60, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 116, 121, 112, 101, 67, 111, 117, 110, 116, 0, 109, 97, 110, 105, 102, 111, 108, 100, 45, 62, 112, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 62, 32, 48, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 67, 111, 110, 116, 97, 99, 116, 83, 111, 108, 118, 101, 114, 46, 99, 112, 112, 0, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 86, 101, 108, 111, 99, 105, 116, 121, 67, 111, 110, 115, 116, 114, 97, 105, 110, 116, 115, 0, 112, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 61, 61, 32, 49, 32, 124, 124, 32, 112, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 61, 61, 32, 50, 0, 83, 111, 108, 118, 101, 86, 101, 108, 111, 99, 105, 116, 121, 67, 111, 110, 115, 116, 114, 97, 105, 110, 116, 115, 0, 97, 46, 120, 32, 62, 61, 32, 48, 46, 48, 102, 32, 38, 38, 32, 97, 46, 121, 32, 62, 61, 32, 48, 46, 48, 102, 0, 116, 111, 105, 73, 110, 100, 101, 120, 65, 32, 60, 32, 109, 95, 98, 111, 100, 121, 67, 111, 117, 110, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 98, 50, 73, 115, 108, 97, 110, 100, 46, 99, 112, 112, 0, 83, 111, 108, 118, 101, 84, 79, 73, 0, 116, 111, 105, 73, 110, 100, 101, 120, 66, 32, 60, 32, 109, 95, 98, 111, 100, 121, 67, 111, 117, 110, 116, 0, 73, 115, 76, 111, 99, 107, 101, 100, 40, 41, 32, 61, 61, 32, 102, 97, 108, 115, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 98, 50, 87, 111, 114, 108, 100, 46, 99, 112, 112, 0, 67, 114, 101, 97, 116, 101, 66, 111, 100, 121, 0, 98, 45, 62, 73, 115, 65, 99, 116, 105, 118, 101, 40, 41, 32, 61, 61, 32, 116, 114, 117, 101, 0, 83, 111, 108, 118, 101, 0, 109, 95, 98, 111, 100, 121, 67, 111, 117, 110, 116, 32, 60, 32, 109, 95, 98, 111, 100, 121, 67, 97, 112, 97, 99, 105, 116, 121, 0, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 92, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 98, 50, 73, 115, 108, 97, 110, 100, 46, 104, 0, 65, 100, 100, 0, 109, 95, 99, 111, 110, 116, 97, 99, 116, 67, 111, 117, 110, 116, 32, 60, 32, 109, 95, 99, 111, 110, 116, 97, 99, 116, 67, 97, 112, 97, 99, 105, 116, 121, 0, 115, 116, 97, 99, 107, 67, 111, 117, 110, 116, 32, 60, 32, 115, 116, 97, 99, 107, 83, 105, 122, 101, 0, 109, 95, 106, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 60, 32, 109, 95, 106, 111, 105, 110, 116, 67, 97, 112, 97, 99, 105, 116, 121, 0, 116, 121, 112, 101, 65, 32, 61, 61, 32, 98, 50, 95, 100, 121, 110, 97, 109, 105, 99, 66, 111, 100, 121, 32, 124, 124, 32, 116, 121, 112, 101, 66, 32, 61, 61, 32, 98, 50, 95, 100, 121, 110, 97, 109, 105, 99, 66, 111, 100, 121, 0, 97, 108, 112, 104, 97, 48, 32, 60, 32, 49, 46, 48, 102, 0, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 92, 66, 111, 120, 50, 68, 47, 67, 111, 109, 109, 111, 110, 47, 98, 50, 77, 97, 116, 104, 46, 104, 0, 65, 100, 118, 97, 110, 99, 101, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 65, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 99, 104, 97, 105, 110, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 66, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 99, 105, 114, 99, 108, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 67, 104, 97, 105, 110, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 66, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 112, 111, 108, 121, 103, 111, 110, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 65, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 99, 105, 114, 99, 108, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 65, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 112, 111, 108, 121, 103, 111, 110, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 80, 111, 108, 121, 103, 111, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 80, 111, 108, 121, 103, 111, 110, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 109, 95, 102, 105, 120, 116, 117, 114, 101, 65, 45, 62, 71, 101, 116, 84, 121, 112, 101, 40, 41, 32, 61, 61, 32, 98, 50, 83, 104, 97, 112, 101, 58, 58, 101, 95, 101, 100, 103, 101, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 69, 100, 103, 101, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 69, 100, 103, 101, 65, 110, 100, 67, 105, 114, 99, 108, 101, 67, 111, 110, 116, 97, 99, 116, 0, 46, 47, 46, 46, 47, 66, 111, 120, 50, 68, 45, 109, 97, 115, 116, 101, 114, 47, 66, 111, 120, 50, 68, 47, 66, 111, 120, 50, 68, 47, 68, 121, 110, 97, 109, 105, 99, 115, 47, 67, 111, 110, 116, 97, 99, 116, 115, 47, 98, 50, 69, 100, 103, 101, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 46, 99, 112, 112, 0, 98, 50, 69, 100, 103, 101, 65, 110, 100, 80, 111, 108, 121, 103, 111, 110, 67, 111, 110, 116, 97, 99, 116, 0, 112, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 62, 32, 48, 0, 98, 50, 67, 111, 110, 116, 97, 99, 116, 83, 111, 108, 118, 101, 114, 0, 57, 98, 50, 67, 111, 110, 116, 97, 99, 116, 0, 55, 98, 50, 83, 104, 97, 112, 101, 0, 49, 55, 98, 50, 67, 111, 110, 116, 97, 99, 116, 76, 105, 115, 116, 101, 110, 101, 114, 0, 71, 101, 116, 85, 115, 101, 114, 68, 97, 116, 97, 0, 112, 99, 45, 62, 112, 111, 105, 110, 116, 67, 111, 117, 110, 116, 32, 62, 32, 48, 0, 69, 118, 97, 108, 117, 97, 116, 101, 0, 70, 105, 110, 100, 77, 105, 110, 83, 101, 112, 97, 114, 97, 116, 105, 111, 110, 0, 48, 32, 60, 32, 99, 111, 117, 110, 116, 32, 38, 38, 32, 99, 111, 117, 110, 116, 32, 60, 32, 51, 0, 99, 97, 99, 104, 101, 45, 62, 99, 111, 117, 110, 116, 32, 60, 61, 32, 51, 0, 82, 101, 97, 100, 67, 97, 99, 104, 101, 0, 118, 111, 105, 100, 0, 98, 111, 111, 108, 0, 99, 104, 97, 114, 0, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 115, 104, 111, 114, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 0, 105, 110, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 0, 108, 111, 110, 103, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 0, 102, 108, 111, 97, 116, 0, 100, 111, 117, 98, 108, 101, 0, 115, 116, 100, 58, 58, 115, 116, 114, 105, 110, 103, 0, 115, 116, 100, 58, 58, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 115, 116, 100, 58, 58, 119, 115, 116, 114, 105, 110, 103, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 118, 97, 108, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 102, 108, 111, 97, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 100, 111, 117, 98, 108, 101, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 32, 100, 111, 117, 98, 108, 101, 62, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 101, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 100, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 102, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 109, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 108, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 106, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 105, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 116, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 115, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 104, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 97, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 99, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 51, 118, 97, 108, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 119, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 119, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 119, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 50, 49, 95, 95, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 104, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 104, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 104, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 99, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 99, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 99, 69, 69, 69, 69, 0, 83, 116, 57, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 83, 116, 57, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 57, 95, 95, 112, 111, 105, 110, 116, 101, 114, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 112, 98, 97, 115, 101, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 51, 95, 95, 102, 117, 110, 100, 97, 109, 101, 110, 116, 97, 108, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 118, 0, 98, 0, 99, 0, 104, 0, 97, 0, 115, 0, 116, 0, 105, 0, 106, 0, 108, 0, 109, 0, 102, 0, 100, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 49, 95, 95, 118, 109, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 33, 34, 118, 101, 99, 116, 111, 114, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 67, 58, 92, 108, 105, 98, 92, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 92, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 92, 49, 46, 51, 53, 46, 48, 92, 115, 121, 115, 116, 101, 109, 92, 105, 110, 99, 108, 117, 100, 101, 92, 108, 105, 98, 99, 120, 120, 92, 118, 101, 99, 116, 111, 114, 0, 95, 95, 116, 104, 114, 111, 119, 95, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 0, 112, 116, 104, 114, 101, 97, 100, 95, 111, 110, 99, 101, 32, 102, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 95, 102, 97, 115, 116, 40, 41, 0, 115, 116, 100, 58, 58, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 116, 101, 114, 109, 105, 110, 97, 116, 101, 95, 104, 97, 110, 100, 108, 101, 114, 32, 117, 110, 101, 120, 112, 101, 99, 116, 101, 100, 108, 121, 32, 114, 101, 116, 117, 114, 110, 101, 100, 0, 99, 97, 110, 110, 111, 116, 32, 99, 114, 101, 97, 116, 101, 32, 112, 116, 104, 114, 101, 97, 100, 32, 107, 101, 121, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 99, 97, 110, 110, 111, 116, 32, 122, 101, 114, 111, 32, 111, 117, 116, 32, 116, 104, 114, 101, 97, 100, 32, 118, 97, 108, 117, 101, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 108, 101 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
allocate([ 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 67, 58, 92, 108, 105, 98, 92, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 92, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 92, 49, 46, 51, 53, 46, 48, 92, 115, 121, 115, 116, 101, 109, 92, 105, 110, 99, 108, 117, 100, 101, 92, 108, 105, 98, 99, 120, 120, 92, 115, 116, 114, 105, 110, 103, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 111, 117, 116, 95, 111, 102, 95, 114, 97, 110, 103, 101, 34, 0, 95, 95, 116, 104, 114, 111, 119, 95, 111, 117, 116, 95, 111, 102, 95, 114, 97, 110, 103, 101, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 58, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 102, 111, 114, 101, 105, 103, 110, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 0, 117, 110, 99, 97, 117, 103, 104, 116, 0, 84, 33, 34, 25, 13, 1, 2, 3, 17, 75, 28, 12, 16, 4, 11, 29, 18, 30, 39, 104, 110, 111, 112, 113, 98, 32, 5, 6, 15, 19, 20, 21, 26, 8, 22, 7, 40, 36, 23, 24, 9, 10, 14, 27, 31, 37, 35, 131, 130, 125, 38, 42, 43, 60, 61, 62, 63, 67, 71, 74, 77, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 114, 115, 116, 121, 122, 123, 124, 0, 73, 108, 108, 101, 103, 97, 108, 32, 98, 121, 116, 101, 32, 115, 101, 113, 117, 101, 110, 99, 101, 0, 68, 111, 109, 97, 105, 110, 32, 101, 114, 114, 111, 114, 0, 82, 101, 115, 117, 108, 116, 32, 110, 111, 116, 32, 114, 101, 112, 114, 101, 115, 101, 110, 116, 97, 98, 108, 101, 0, 78, 111, 116, 32, 97, 32, 116, 116, 121, 0, 80, 101, 114, 109, 105, 115, 115, 105, 111, 110, 32, 100, 101, 110, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 110, 111, 116, 32, 112, 101, 114, 109, 105, 116, 116, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 105, 108, 101, 32, 111, 114, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 78, 111, 32, 115, 117, 99, 104, 32, 112, 114, 111, 99, 101, 115, 115, 0, 70, 105, 108, 101, 32, 101, 120, 105, 115, 116, 115, 0, 86, 97, 108, 117, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 32, 102, 111, 114, 32, 100, 97, 116, 97, 32, 116, 121, 112, 101, 0, 78, 111, 32, 115, 112, 97, 99, 101, 32, 108, 101, 102, 116, 32, 111, 110, 32, 100, 101, 118, 105, 99, 101, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 98, 117, 115, 121, 0, 73, 110, 116, 101, 114, 114, 117, 112, 116, 101, 100, 32, 115, 121, 115, 116, 101, 109, 32, 99, 97, 108, 108, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 116, 101, 109, 112, 111, 114, 97, 114, 105, 108, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 73, 110, 118, 97, 108, 105, 100, 32, 115, 101, 101, 107, 0, 67, 114, 111, 115, 115, 45, 100, 101, 118, 105, 99, 101, 32, 108, 105, 110, 107, 0, 82, 101, 97, 100, 45, 111, 110, 108, 121, 32, 102, 105, 108, 101, 32, 115, 121, 115, 116, 101, 109, 0, 68, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 111, 116, 32, 101, 109, 112, 116, 121, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 112, 101, 101, 114, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 116, 105, 109, 101, 100, 32, 111, 117, 116, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 102, 117, 115, 101, 100, 0, 72, 111, 115, 116, 32, 105, 115, 32, 100, 111, 119, 110, 0, 72, 111, 115, 116, 32, 105, 115, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 65, 100, 100, 114, 101, 115, 115, 32, 105, 110, 32, 117, 115, 101, 0, 66, 114, 111, 107, 101, 110, 32, 112, 105, 112, 101, 0, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 32, 111, 114, 32, 97, 100, 100, 114, 101, 115, 115, 0, 66, 108, 111, 99, 107, 32, 100, 101, 118, 105, 99, 101, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 0, 78, 111, 116, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 73, 115, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 84, 101, 120, 116, 32, 102, 105, 108, 101, 32, 98, 117, 115, 121, 0, 69, 120, 101, 99, 32, 102, 111, 114, 109, 97, 116, 32, 101, 114, 114, 111, 114, 0, 73, 110, 118, 97, 108, 105, 100, 32, 97, 114, 103, 117, 109, 101, 110, 116, 0, 65, 114, 103, 117, 109, 101, 110, 116, 32, 108, 105, 115, 116, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 121, 109, 98, 111, 108, 105, 99, 32, 108, 105, 110, 107, 32, 108, 111, 111, 112, 0, 70, 105, 108, 101, 110, 97, 109, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 111, 112, 101, 110, 32, 102, 105, 108, 101, 115, 32, 105, 110, 32, 115, 121, 115, 116, 101, 109, 0, 78, 111, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 66, 97, 100, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 0, 78, 111, 32, 99, 104, 105, 108, 100, 32, 112, 114, 111, 99, 101, 115, 115, 0, 66, 97, 100, 32, 97, 100, 100, 114, 101, 115, 115, 0, 70, 105, 108, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 105, 110, 107, 115, 0, 78, 111, 32, 108, 111, 99, 107, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 100, 101, 97, 100, 108, 111, 99, 107, 32, 119, 111, 117, 108, 100, 32, 111, 99, 99, 117, 114, 0, 83, 116, 97, 116, 101, 32, 110, 111, 116, 32, 114, 101, 99, 111, 118, 101, 114, 97, 98, 108, 101, 0, 80, 114, 101, 118, 105, 111, 117, 115, 32, 111, 119, 110, 101, 114, 32, 100, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 99, 97, 110, 99, 101, 108, 101, 100, 0, 70, 117, 110, 99, 116, 105, 111, 110, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100, 0, 78, 111, 32, 109, 101, 115, 115, 97, 103, 101, 32, 111, 102, 32, 100, 101, 115, 105, 114, 101, 100, 32, 116, 121, 112, 101, 0, 73, 100, 101, 110, 116, 105, 102, 105, 101, 114, 32, 114, 101, 109, 111, 118, 101, 100, 0, 68, 101, 118, 105, 99, 101, 32, 110, 111, 116, 32, 97, 32, 115, 116, 114, 101, 97, 109, 0, 78, 111, 32, 100, 97, 116, 97, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 68, 101, 118, 105, 99, 101, 32, 116, 105, 109, 101, 111, 117, 116, 0, 79, 117, 116, 32, 111, 102, 32, 115, 116, 114, 101, 97, 109, 115, 32, 114, 101, 115, 111, 117, 114, 99, 101, 115, 0, 76, 105, 110, 107, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 115, 101, 118, 101, 114, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 101, 114, 114, 111, 114, 0, 66, 97, 100, 32, 109, 101, 115, 115, 97, 103, 101, 0, 70, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 32, 105, 110, 32, 98, 97, 100, 32, 115, 116, 97, 116, 101, 0, 78, 111, 116, 32, 97, 32, 115, 111, 99, 107, 101, 116, 0, 68, 101, 115, 116, 105, 110, 97, 116, 105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 77, 101, 115, 115, 97, 103, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 32, 102, 111, 114, 32, 115, 111, 99, 107, 101, 116, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 116, 121, 112, 101, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 78, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 65, 100, 100, 114, 101, 115, 115, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 98, 121, 32, 112, 114, 111, 116, 111, 99, 111, 108, 0, 65, 100, 100, 114, 101, 115, 115, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 78, 101, 116, 119, 111, 114, 107, 32, 105, 115, 32, 100, 111, 119, 110, 0, 78, 101, 116, 119, 111, 114, 107, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 110, 101, 116, 119, 111, 114, 107, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 97, 98, 111, 114, 116, 101, 100, 0, 78, 111, 32, 98, 117, 102, 102, 101, 114, 32, 115, 112, 97, 99, 101, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 83, 111, 99, 107, 101, 116, 32, 105, 115, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 110, 111, 116, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 67, 97, 110, 110, 111, 116, 32, 115, 101, 110, 100, 32, 97, 102, 116, 101, 114, 32, 115, 111, 99, 107, 101, 116, 32, 115, 104, 117, 116, 100, 111, 119, 110, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 97, 108, 114, 101, 97, 100, 121, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 83, 116, 97, 108, 101, 32, 102, 105, 108, 101, 32, 104, 97, 110, 100, 108, 101, 0, 82, 101, 109, 111, 116, 101, 32, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 81, 117, 111, 116, 97, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0, 78, 111, 32, 109, 101, 100, 105, 117, 109, 32, 102, 111, 117, 110, 100, 0, 87, 114, 111, 110, 103, 32, 109, 101, 100, 105, 117, 109, 32, 116, 121, 112, 101, 0, 78, 111, 32, 101, 114, 114, 111, 114, 32, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10240);
allocate([ 17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 40, 110, 117, 108, 108, 41, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 105, 110, 102, 0, 73, 78, 70, 0, 110, 97, 110, 0, 78, 65, 78, 0, 46, 0, 37, 100, 0, 37, 102, 0 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 13444);
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}
function copyTempDouble(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
 HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
 HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
 HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
 HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}
var _cosf = Math_cos;
Module["_i64Subtract"] = _i64Subtract;
var _floorf = Math_floor;
function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}
function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body);
}
function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, (function(message) {
  this.name = errorName;
  this.message = message;
  var stack = (new Error(message)).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 }));
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = (function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 });
 return errorClass;
}
var BindingError = undefined;
function throwBindingError(message) {
 throw new BindingError(message);
}
var InternalError = undefined;
function throwInternalError(message) {
 throw new InternalError(message);
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach((function(type) {
  typeDependencies[type] = dependentTypes;
 }));
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push((function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   }));
  }
 }));
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}
function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach((function(cb) {
   cb();
  }));
 }
}
function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": (function() {
   return undefined;
  }),
  "toWireType": (function(destructors, o) {
   return undefined;
  })
 });
}
function __ZSt18uncaught_exceptionv() {
 return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: (function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var ptr in EXCEPTIONS.infos) {
   var info = EXCEPTIONS.infos[ptr];
   if (info.adjusted === adjusted) {
    return ptr;
   }
  }
  return adjusted;
 }),
 addRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 }),
 decRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0) {
   if (info.destructor) {
    Runtime.dynCall("vi", info.destructor, [ ptr ]);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 }),
 clearRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 })
};
function ___resumeException(ptr) {
 if (!EXCEPTIONS.last) {
  EXCEPTIONS.last = ptr;
 }
 EXCEPTIONS.clearRef(EXCEPTIONS.deAdjust(ptr));
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
function ___cxa_find_matching_catch() {
 var thrown = EXCEPTIONS.last;
 if (!thrown) {
  return (asm["setTempRet0"](0), 0) | 0;
 }
 var info = EXCEPTIONS.infos[thrown];
 var throwntype = info.type;
 if (!throwntype) {
  return (asm["setTempRet0"](0), thrown) | 0;
 }
 var typeArray = Array.prototype.slice.call(arguments);
 var pointer = Module["___cxa_is_pointer_type"](throwntype);
 if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
 HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
 thrown = ___cxa_find_matching_catch.buffer;
 for (var i = 0; i < typeArray.length; i++) {
  if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
   thrown = HEAP32[thrown >> 2];
   info.adjusted = thrown;
   return (asm["setTempRet0"](typeArray[i]), thrown) | 0;
  }
 }
 thrown = HEAP32[thrown >> 2];
 return (asm["setTempRet0"](throwntype), thrown) | 0;
}
function ___cxa_throw(ptr, type, destructor) {
 EXCEPTIONS.infos[ptr] = {
  ptr: ptr,
  adjusted: ptr,
  type: type,
  destructor: destructor,
  refcount: 0
 };
 EXCEPTIONS.last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exception = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exception++;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
Module["_memset"] = _memset;
var _BDtoILow = true;
function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;
 case 2:
  return 1;
 case 4:
  return 2;
 case 8:
  return 3;
 default:
  throw new TypeError("Unknown type size: " + size);
 }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(wt) {
   return !!wt;
  }),
  "toWireType": (function(destructors, o) {
   return o ? trueValue : falseValue;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": (function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  }),
  destructorFunction: null
 });
}
Module["_bitshift64Shl"] = _bitshift64Shl;
function _abort() {
 Module["abort"]();
}
function _free() {}
Module["_free"] = _free;
function _malloc(bytes) {
 var ptr = Runtime.dynamicAlloc(bytes + 8);
 return ptr + 8 & 4294967288;
}
Module["_malloc"] = _malloc;
function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}
function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   function getTAElement(ta, index) {
    return ta[index];
   }
   function getStringElement(string, index) {
    return string.charCodeAt(index);
   }
   var getElement;
   if (value instanceof Uint8Array) {
    getElement = getTAElement;
   } else if (value instanceof Int8Array) {
    getElement = getTAElement;
   } else if (typeof value === "string") {
    getElement = getStringElement;
   } else {
    throwBindingError("Cannot pass non-string to std::string");
   }
   var length = value.length;
   var ptr = _malloc(4 + length);
   HEAPU32[ptr >> 2] = length;
   for (var i = 0; i < length; ++i) {
    var charCode = getElement(value, i);
    if (charCode > 255) {
     _free(ptr);
     throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
    }
    HEAPU8[ptr + 4 + i] = charCode;
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var getHeap, shift;
 if (charSize === 2) {
  getHeap = (function() {
   return HEAPU16;
  });
  shift = 1;
 } else if (charSize === 4) {
  getHeap = (function() {
   return HEAPU32;
  });
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var HEAP = getHeap();
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   var start = value + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAP[start + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   var HEAP = getHeap();
   var length = value.length;
   var ptr = _malloc(4 + length * charSize);
   HEAPU32[ptr >> 2] = length;
   var start = ptr + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    HEAP[start + i] = value.charCodeAt(i);
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 Runtime.dynCall("v", func);
 _pthread_once.seen[ptr] = 1;
}
var _sqrtf = Math_sqrt;
function ___unlock() {}
var _emscripten_asm_const_int = true;
var _emscripten_asm_const = true;
function ___assert_fail(condition, filename, line, func) {
 ABORT = true;
 throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ] + " at " + stackTrace();
}
var PTHREAD_SPECIFIC = {};
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function ___lock() {}
function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}
function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };
 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };
 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };
 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = (function(value) {
  return value;
 });
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = (function(value) {
   return value << bitshift >>> bitshift;
  });
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return value | 0;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}
var ERRNO_MESSAGES = {
 0: "Success",
 1: "Not super-user",
 2: "No such file or directory",
 3: "No such process",
 4: "Interrupted system call",
 5: "I/O error",
 6: "No such device or address",
 7: "Arg list too long",
 8: "Exec format error",
 9: "Bad file number",
 10: "No children",
 11: "No more processes",
 12: "Not enough core",
 13: "Permission denied",
 14: "Bad address",
 15: "Block device required",
 16: "Mount device busy",
 17: "File exists",
 18: "Cross-device link",
 19: "No such device",
 20: "Not a directory",
 21: "Is a directory",
 22: "Invalid argument",
 23: "Too many open files in system",
 24: "Too many open files",
 25: "Not a typewriter",
 26: "Text file busy",
 27: "File too large",
 28: "No space left on device",
 29: "Illegal seek",
 30: "Read only file system",
 31: "Too many links",
 32: "Broken pipe",
 33: "Math arg out of domain of func",
 34: "Math result not representable",
 35: "File locking deadlock error",
 36: "File or path name too long",
 37: "No record locks available",
 38: "Function not implemented",
 39: "Directory not empty",
 40: "Too many symbolic links",
 42: "No message of desired type",
 43: "Identifier removed",
 44: "Channel number out of range",
 45: "Level 2 not synchronized",
 46: "Level 3 halted",
 47: "Level 3 reset",
 48: "Link number out of range",
 49: "Protocol driver not attached",
 50: "No CSI structure available",
 51: "Level 2 halted",
 52: "Invalid exchange",
 53: "Invalid request descriptor",
 54: "Exchange full",
 55: "No anode",
 56: "Invalid request code",
 57: "Invalid slot",
 59: "Bad font file fmt",
 60: "Device not a stream",
 61: "No data (for no delay io)",
 62: "Timer expired",
 63: "Out of streams resources",
 64: "Machine is not on the network",
 65: "Package not installed",
 66: "The object is remote",
 67: "The link has been severed",
 68: "Advertise error",
 69: "Srmount error",
 70: "Communication error on send",
 71: "Protocol error",
 72: "Multihop attempted",
 73: "Cross mount point (not really error)",
 74: "Trying to read unreadable message",
 75: "Value too large for defined data type",
 76: "Given log. name not unique",
 77: "f.d. invalid for this operation",
 78: "Remote address changed",
 79: "Can   access a needed shared lib",
 80: "Accessing a corrupted shared lib",
 81: ".lib section in a.out corrupted",
 82: "Attempting to link in too many libs",
 83: "Attempting to exec a shared library",
 84: "Illegal byte sequence",
 86: "Streams pipe error",
 87: "Too many users",
 88: "Socket operation on non-socket",
 89: "Destination address required",
 90: "Message too long",
 91: "Protocol wrong type for socket",
 92: "Protocol not available",
 93: "Unknown protocol",
 94: "Socket type not supported",
 95: "Not supported",
 96: "Protocol family not supported",
 97: "Address family not supported by protocol family",
 98: "Address already in use",
 99: "Address not available",
 100: "Network interface is not configured",
 101: "Network is unreachable",
 102: "Connection reset by network",
 103: "Connection aborted",
 104: "Connection reset by peer",
 105: "No buffer space available",
 106: "Socket is already connected",
 107: "Socket is not connected",
 108: "Can't send after socket shutdown",
 109: "Too many references",
 110: "Connection timed out",
 111: "Connection refused",
 112: "Host is down",
 113: "Host is unreachable",
 114: "Socket already connected",
 115: "Connection already in progress",
 116: "Stale file handle",
 122: "Quota exceeded",
 123: "No medium (in tape drive)",
 125: "Operation canceled",
 130: "Previous owner died",
 131: "State not recoverable"
};
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}
var TTY = {
 ttys: [],
 init: (function() {}),
 shutdown: (function() {}),
 register: (function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 }),
 stream_ops: {
  open: (function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   stream.tty = tty;
   stream.seekable = false;
  }),
  close: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  flush: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  read: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  }),
  write: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   for (var i = 0; i < length; i++) {
    try {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  })
 },
 default_tty_ops: {
  get_char: (function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = new Buffer(BUFSIZE);
     var bytesRead = 0;
     var fd = process.stdin.fd;
     var usingDevice = false;
     try {
      fd = fs.openSync("/dev/stdin", "r");
      usingDevice = true;
     } catch (e) {}
     bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
     if (usingDevice) {
      fs.closeSync(fd);
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  }),
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["print"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    Module["print"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 },
 default_tty1_ops: {
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["printErr"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    Module["printErr"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 }
};
var MEMFS = {
 ops_table: null,
 mount: (function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 getFileDataAsRegularArray: (function(node) {
  if (node.contents && node.contents.subarray) {
   var arr = [];
   for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
   return arr;
  }
  return node.contents;
 }),
 getFileDataAsTypedArray: (function(node) {
  if (!node.contents) return new Uint8Array;
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 }),
 expandFileStorage: (function(node, newCapacity) {
  if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
   node.contents = MEMFS.getFileDataAsRegularArray(node);
   node.usedBytes = node.contents.length;
  }
  if (!node.contents || node.contents.subarray) {
   var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
   if (prevCapacity >= newCapacity) return;
   var CAPACITY_DOUBLING_MAX = 1024 * 1024;
   newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
   if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
   var oldContents = node.contents;
   node.contents = new Uint8Array(newCapacity);
   if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
   return;
  }
  if (!node.contents && newCapacity > 0) node.contents = [];
  while (node.contents.length < newCapacity) node.contents.push(0);
 }),
 resizeFileStorage: (function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
   return;
  }
  if (!node.contents || node.contents.subarray) {
   var oldContents = node.contents;
   node.contents = new Uint8Array(new ArrayBuffer(newSize));
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
   return;
  }
  if (!node.contents) node.contents = [];
  if (node.contents.length > newSize) node.contents.length = newSize; else while (node.contents.length < newSize) node.contents.push(0);
  node.usedBytes = newSize;
 }),
 node_ops: {
  getattr: (function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  }),
  lookup: (function(parent, name) {
   throw FS.genericErrors[ERRNO_CODES.ENOENT];
  }),
  mknod: (function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  }),
  rename: (function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   old_node.parent = new_dir;
  }),
  unlink: (function(parent, name) {
   delete parent.contents[name];
  }),
  rmdir: (function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
   }
   delete parent.contents[name];
  }),
  readdir: (function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  }),
  symlink: (function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  }),
  readlink: (function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return node.link;
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  }),
  write: (function(stream, buffer, offset, length, position, canOwn) {
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  }),
  allocate: (function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  }),
  mmap: (function(stream, buffer, offset, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = _malloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
    }
    buffer.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  }),
  msync: (function(stream, buffer, offset, length, mmapFlags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   if (mmapFlags & 2) {
    return 0;
   }
   var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  })
 }
};
var IDBFS = {
 dbs: {},
 indexedDB: (function() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  var ret = null;
  if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
 }),
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: (function(mount) {
  return MEMFS.mount.apply(null, arguments);
 }),
 syncfs: (function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, (function(err, local) {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, (function(err, remote) {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   }));
  }));
 }),
 getDB: (function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  req.onupgradeneeded = (function(e) {
   var db = e.target.result;
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   if (!fileStore.indexNames.contains("timestamp")) {
    fileStore.createIndex("timestamp", "timestamp", {
     unique: false
    });
   }
  });
  req.onsuccess = (function() {
   db = req.result;
   IDBFS.dbs[name] = db;
   callback(null, db);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 getLocalSet: (function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return (function(p) {
    return PATH.join2(root, p);
   });
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    timestamp: stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 }),
 getRemoteSet: (function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, (function(err, db) {
   if (err) return callback(err);
   var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
   transaction.onerror = (function(e) {
    callback(this.error);
    e.preventDefault();
   });
   var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
   var index = store.index("timestamp");
   index.openKeyCursor().onsuccess = (function(event) {
    var cursor = event.target.result;
    if (!cursor) {
     return callback(null, {
      type: "remote",
      db: db,
      entries: entries
     });
    }
    entries[cursor.primaryKey] = {
     timestamp: cursor.key
    };
    cursor.continue();
   });
  }));
 }),
 loadLocalEntry: (function(path, callback) {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode,
    contents: node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 }),
 storeLocalEntry: (function(path, entry, callback) {
  try {
   if (FS.isDir(entry.mode)) {
    FS.mkdir(path, entry.mode);
   } else if (FS.isFile(entry.mode)) {
    FS.writeFile(path, entry.contents, {
     encoding: "binary",
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.chmod(path, entry.mode);
   FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 removeLocalEntry: (function(path, callback) {
  try {
   var lookup = FS.lookupPath(path);
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 loadRemoteEntry: (function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = (function(event) {
   callback(null, event.target.result);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 storeRemoteEntry: (function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 removeRemoteEntry: (function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 reconcile: (function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach((function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e.timestamp > e2.timestamp) {
    create.push(key);
    total++;
   }
  }));
  var remove = [];
  Object.keys(dst.entries).forEach((function(key) {
   var e = dst.entries[key];
   var e2 = src.entries[key];
   if (!e2) {
    remove.push(key);
    total++;
   }
  }));
  if (!total) {
   return callback(null);
  }
  var errored = false;
  var completed = 0;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= total) {
    return callback(null);
   }
  }
  transaction.onerror = (function(e) {
   done(this.error);
   e.preventDefault();
  });
  create.sort().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    }));
   } else {
    IDBFS.loadLocalEntry(path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    }));
   }
  }));
  remove.sort().reverse().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  }));
 })
};
var NODEFS = {
 isWindows: false,
 staticInit: (function() {
  NODEFS.isWindows = !!process.platform.match(/^win/);
 }),
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_NODE);
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 }),
 getMode: (function(path) {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 146) >> 1;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(ERRNO_CODES[e.code]);
  }
  return stat.mode;
 }),
 realPath: (function(node) {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 }),
 flagsToPermissionStringMap: {
  0: "r",
  1: "r+",
  2: "r+",
  64: "r",
  65: "r+",
  66: "r+",
  129: "rx+",
  193: "rx+",
  514: "w+",
  577: "w",
  578: "w+",
  705: "wx",
  706: "wx+",
  1024: "a",
  1025: "a",
  1026: "a+",
  1089: "a",
  1090: "a+",
  1153: "ax",
  1154: "ax+",
  1217: "ax",
  1218: "ax+",
  4096: "rs",
  4098: "rs+"
 },
 flagsToPermissionString: (function(flags) {
  flags &= ~32768;
  if (flags in NODEFS.flagsToPermissionStringMap) {
   return NODEFS.flagsToPermissionStringMap[flags];
  } else {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
 }),
 node_ops: {
  getattr: (function(node) {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  }),
  setattr: (function(node, attr) {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  lookup: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  }),
  mknod: (function(parent, name, mode, dev) {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return node;
  }),
  rename: (function(oldNode, newDir, newName) {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  unlink: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  rmdir: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readdir: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  symlink: (function(parent, newName, oldPath) {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readlink: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    path = fs.readlinkSync(path);
    path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
    return path;
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  })
 },
 stream_ops: {
  open: (function(stream) {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  close: (function(stream) {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  read: (function(stream, buffer, offset, length, position) {
   if (length === 0) return 0;
   var nbuffer = new Buffer(length);
   var res;
   try {
    res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (res > 0) {
    for (var i = 0; i < res; i++) {
     buffer[offset + i] = nbuffer[i];
    }
   }
   return res;
  }),
  write: (function(stream, buffer, offset, length, position) {
   var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
   var res;
   try {
    res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return res;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
var WORKERFS = {
 DIR_MODE: 16895,
 FILE_MODE: 33279,
 reader: null,
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_WORKER);
  if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
  var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
  var createdParents = {};
  function ensureParent(path) {
   var parts = path.split("/");
   var parent = root;
   for (var i = 0; i < parts.length - 1; i++) {
    var curr = parts.slice(0, i + 1).join("/");
    if (!createdParents[curr]) {
     createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0);
    }
    parent = createdParents[curr];
   }
   return parent;
  }
  function base(path) {
   var parts = path.split("/");
   return parts[parts.length - 1];
  }
  Array.prototype.forEach.call(mount.opts["files"] || [], (function(file) {
   WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
  }));
  (mount.opts["blobs"] || []).forEach((function(obj) {
   WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
  }));
  (mount.opts["packages"] || []).forEach((function(pack) {
   pack["metadata"].files.forEach((function(file) {
    var name = file.filename.substr(1);
    WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
   }));
  }));
  return root;
 }),
 createNode: (function(parent, name, mode, dev, contents, mtime) {
  var node = FS.createNode(parent, name, mode);
  node.mode = mode;
  node.node_ops = WORKERFS.node_ops;
  node.stream_ops = WORKERFS.stream_ops;
  node.timestamp = (mtime || new Date).getTime();
  assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
  if (mode === WORKERFS.FILE_MODE) {
   node.size = contents.size;
   node.contents = contents;
  } else {
   node.size = 4096;
   node.contents = {};
  }
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 node_ops: {
  getattr: (function(node) {
   return {
    dev: 1,
    ino: undefined,
    mode: node.mode,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: undefined,
    size: node.size,
    atime: new Date(node.timestamp),
    mtime: new Date(node.timestamp),
    ctime: new Date(node.timestamp),
    blksize: 4096,
    blocks: Math.ceil(node.size / 4096)
   };
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
  }),
  lookup: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }),
  mknod: (function(parent, name, mode, dev) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rename: (function(oldNode, newDir, newName) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  unlink: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rmdir: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readdir: (function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  symlink: (function(parent, newName, oldPath) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readlink: (function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   if (position >= stream.node.size) return 0;
   var chunk = stream.node.contents.slice(position, position + length);
   var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
   buffer.set(new Uint8Array(ab), offset);
   return chunk.size;
  }),
  write: (function(stream, buffer, offset, length, position) {
   throw new FS.ErrnoError(ERRNO_CODES.EIO);
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.size;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
var _stdin = allocate(1, "i32*", ALLOC_STATIC);
var _stdout = allocate(1, "i32*", ALLOC_STATIC);
var _stderr = allocate(1, "i32*", ALLOC_STATIC);
var FS = {
 root: null,
 mounts: [],
 devices: [ null ],
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 handleFSError: (function(e) {
  if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
 }),
 lookupPath: (function(path, opts) {
  path = PATH.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
  }
  var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 }),
 getPath: (function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 }),
 hashName: (function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 }),
 hashAddNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 }),
 hashRemoveNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 }),
 lookupNode: (function(parent, name) {
  var err = FS.mayLookup(parent);
  if (err) {
   throw new FS.ErrnoError(err, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 }),
 createNode: (function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
   FS.FSNode = (function(parent, name, mode, rdev) {
    if (!parent) {
     parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
   });
   FS.FSNode.prototype = {};
   var readMode = 292 | 73;
   var writeMode = 146;
   Object.defineProperties(FS.FSNode.prototype, {
    read: {
     get: (function() {
      return (this.mode & readMode) === readMode;
     }),
     set: (function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
     })
    },
    write: {
     get: (function() {
      return (this.mode & writeMode) === writeMode;
     }),
     set: (function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
     })
    },
    isFolder: {
     get: (function() {
      return FS.isDir(this.mode);
     })
    },
    isDevice: {
     get: (function() {
      return FS.isChrdev(this.mode);
     })
    }
   });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 }),
 destroyNode: (function(node) {
  FS.hashRemoveNode(node);
 }),
 isRoot: (function(node) {
  return node === node.parent;
 }),
 isMountpoint: (function(node) {
  return !!node.mounted;
 }),
 isFile: (function(mode) {
  return (mode & 61440) === 32768;
 }),
 isDir: (function(mode) {
  return (mode & 61440) === 16384;
 }),
 isLink: (function(mode) {
  return (mode & 61440) === 40960;
 }),
 isChrdev: (function(mode) {
  return (mode & 61440) === 8192;
 }),
 isBlkdev: (function(mode) {
  return (mode & 61440) === 24576;
 }),
 isFIFO: (function(mode) {
  return (mode & 61440) === 4096;
 }),
 isSocket: (function(mode) {
  return (mode & 49152) === 49152;
 }),
 flagModes: {
  "r": 0,
  "rs": 1052672,
  "r+": 2,
  "w": 577,
  "wx": 705,
  "xw": 705,
  "w+": 578,
  "wx+": 706,
  "xw+": 706,
  "a": 1089,
  "ax": 1217,
  "xa": 1217,
  "a+": 1090,
  "ax+": 1218,
  "xa+": 1218
 },
 modeStringToFlags: (function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 }),
 flagsToPermissionString: (function(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 }),
 nodePermissions: (function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 mayLookup: (function(dir) {
  var err = FS.nodePermissions(dir, "x");
  if (err) return err;
  if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
  return 0;
 }),
 mayCreate: (function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return ERRNO_CODES.EEXIST;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 }),
 mayDelete: (function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var err = FS.nodePermissions(dir, "wx");
  if (err) {
   return err;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return ERRNO_CODES.ENOTDIR;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return ERRNO_CODES.EBUSY;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return 0;
 }),
 mayOpen: (function(node, flags) {
  if (!node) {
   return ERRNO_CODES.ENOENT;
  }
  if (FS.isLink(node.mode)) {
   return ERRNO_CODES.ELOOP;
  } else if (FS.isDir(node.mode)) {
   if ((flags & 2097155) !== 0 || flags & 512) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 }),
 MAX_OPEN_FDS: 4096,
 nextfd: (function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
 }),
 getStream: (function(fd) {
  return FS.streams[fd];
 }),
 createStream: (function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = (function() {});
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: (function() {
      return this.node;
     }),
     set: (function(val) {
      this.node = val;
     })
    },
    isRead: {
     get: (function() {
      return (this.flags & 2097155) !== 1;
     })
    },
    isWrite: {
     get: (function() {
      return (this.flags & 2097155) !== 0;
     })
    },
    isAppend: {
     get: (function() {
      return this.flags & 1024;
     })
    }
   });
  }
  var newStream = new FS.FSStream;
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 }),
 closeStream: (function(fd) {
  FS.streams[fd] = null;
 }),
 chrdev_stream_ops: {
  open: (function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  }),
  llseek: (function() {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  })
 },
 major: (function(dev) {
  return dev >> 8;
 }),
 minor: (function(dev) {
  return dev & 255;
 }),
 makedev: (function(ma, mi) {
  return ma << 8 | mi;
 }),
 registerDevice: (function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 }),
 getDevice: (function(dev) {
  return FS.devices[dev];
 }),
 getMounts: (function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 }),
 syncfs: (function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= mounts.length) {
    callback(null);
   }
  }
  mounts.forEach((function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  }));
 }),
 mount: (function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 }),
 unmount: (function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach((function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  }));
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 }),
 lookup: (function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 }),
 mknod: (function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var err = FS.mayCreate(parent, name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 }),
 create: (function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 }),
 mkdir: (function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 }),
 mkdev: (function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 }),
 symlink: (function(oldpath, newpath) {
  if (!PATH.resolve(oldpath)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  var newname = PATH.basename(newpath);
  var err = FS.mayCreate(parent, newname);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 }),
 rename: (function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
   lookup = FS.lookupPath(old_path, {
    parent: true
   });
   old_dir = lookup.node;
   lookup = FS.lookupPath(new_path, {
    parent: true
   });
   new_dir = lookup.node;
  } catch (e) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  relative = PATH.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err = FS.mayDelete(old_dir, old_name, isdir);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (new_dir !== old_dir) {
   err = FS.nodePermissions(old_dir, "w");
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 }),
 rmdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, true);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  return node.node_ops.readdir(node);
 }),
 unlink: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, false);
  if (err) {
   if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readlink: (function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 }),
 stat: (function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return node.node_ops.getattr(node);
 }),
 lstat: (function(path) {
  return FS.stat(path, true);
 }),
 chmod: (function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 }),
 lchmod: (function(path, mode) {
  FS.chmod(path, mode, true);
 }),
 fchmod: (function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chmod(stream.node, mode);
 }),
 chown: (function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 }),
 lchown: (function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 }),
 fchown: (function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chown(stream.node, uid, gid);
 }),
 truncate: (function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var err = FS.nodePermissions(node, "w");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 }),
 ftruncate: (function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  FS.truncate(stream.node, len);
 }),
 utime: (function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 }),
 open: (function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  if (!created) {
   var err = FS.mayOpen(node, flags);
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    Module["printErr"]("read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 }),
 close: (function(stream) {
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
 }),
 llseek: (function(stream, offset, whence) {
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 }),
 read: (function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 }),
 write: (function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if (stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 }),
 allocate: (function(stream, offset, length) {
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
  }
  stream.stream_ops.allocate(stream, offset, length);
 }),
 mmap: (function(stream, buffer, offset, length, position, prot, flags) {
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EACCES);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
 }),
 msync: (function(stream, buffer, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 }),
 munmap: (function(stream) {
  return 0;
 }),
 ioctl: (function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 }),
 readFile: (function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 }),
 writeFile: (function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  opts.encoding = opts.encoding || "utf8";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var stream = FS.open(path, opts.flags, opts.mode);
  if (opts.encoding === "utf8") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
  } else if (opts.encoding === "binary") {
   FS.write(stream, data, 0, data.length, 0, opts.canOwn);
  }
  FS.close(stream);
 }),
 cwd: (function() {
  return FS.currentPath;
 }),
 chdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  var err = FS.nodePermissions(lookup.node, "x");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  FS.currentPath = lookup.path;
 }),
 createDefaultDirectories: (function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 }),
 createDefaultDevices: (function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: (function() {
    return 0;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    return length;
   })
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto !== "undefined") {
   var randomBuffer = new Uint8Array(1);
   random_device = (function() {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0];
   });
  } else if (ENVIRONMENT_IS_NODE) {
   random_device = (function() {
    return require("crypto").randomBytes(1)[0];
   });
  } else {
   random_device = (function() {
    return Math.random() * 256 | 0;
   });
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 }),
 createSpecialDirectories: (function() {
  FS.mkdir("/proc");
  FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: (function() {
    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: (function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: (function() {
         return stream.path;
        })
       }
      };
      ret.parent = ret;
      return ret;
     })
    };
    return node;
   })
  }, {}, "/proc/self/fd");
 }),
 createStandardStreams: (function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", "r");
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  var stdout = FS.open("/dev/stdout", "w");
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  var stderr = FS.open("/dev/stderr", "w");
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 }),
 ensureErrnoError: (function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.node = node;
   this.setErrno = (function(errno) {
    this.errno = errno;
    for (var key in ERRNO_CODES) {
     if (ERRNO_CODES[key] === errno) {
      this.code = key;
      break;
     }
    }
   });
   this.setErrno(errno);
   this.message = ERRNO_MESSAGES[errno];
  };
  FS.ErrnoError.prototype = new Error;
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ ERRNO_CODES.ENOENT ].forEach((function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  }));
 }),
 staticInit: (function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "IDBFS": IDBFS,
   "NODEFS": NODEFS,
   "WORKERFS": WORKERFS
  };
 }),
 init: (function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 }),
 quit: (function() {
  FS.init.initialized = false;
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 }),
 getMode: (function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 }),
 joinPath: (function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/") path = path.substr(1);
  return path;
 }),
 absolutePath: (function(relative, base) {
  return PATH.resolve(base, relative);
 }),
 standardizePath: (function(path) {
  return PATH.normalize(path);
 }),
 findObject: (function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   ___setErrNo(ret.error);
   return null;
  }
 }),
 analyzePath: (function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 }),
 createFolder: (function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
 }),
 createPath: (function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 }),
 createFile: (function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 }),
 createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, "w");
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 }),
 createDevice: (function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: (function(stream) {
    stream.seekable = false;
   }),
   close: (function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   }),
   read: (function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   })
  });
  return FS.mkdev(path, mode, dev);
 }),
 createLink: (function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
 }),
 forceLoadFile: (function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (Module["read"]) {
   try {
    obj.contents = intArrayFromString(Module["read"](obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    success = false;
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success) ___setErrNo(ERRNO_CODES.EIO);
  return success;
 }),
 createLazyFile: (function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest;
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   });
   var lazyArray = this;
   lazyArray.setDataGetter((function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   }));
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array;
   Object.defineProperty(lazyArray, "length", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._length;
    })
   });
   Object.defineProperty(lazyArray, "chunkSize", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._chunkSize;
    })
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperty(node, "usedBytes", {
   get: (function() {
    return this.contents.length;
   })
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach((function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    if (!FS.forceLoadFile(node)) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    return fn.apply(null, arguments);
   };
  }));
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   if (!FS.forceLoadFile(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EIO);
   }
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 }),
 createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   var handled = false;
   Module["preloadPlugins"].forEach((function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, (function() {
      if (onerror) onerror();
      removeRunDependency(dep);
     }));
     handled = true;
    }
   }));
   if (!handled) finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
   Browser.asyncLoad(url, (function(byteArray) {
    processData(byteArray);
   }), onerror);
  } else {
   processData(url);
  }
 }),
 indexedDB: (function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 }),
 DB_NAME: (function() {
  return "EM_FS_" + window.location.pathname;
 }),
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   console.log("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }),
 loadFilesFromDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 })
};
var PATH = {
 splitPath: (function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 }),
 normalizeArray: (function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (; up--; up) {
    parts.unshift("..");
   }
  }
  return parts;
 }),
 normalize: (function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 }),
 dirname: (function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 }),
 basename: (function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 }),
 extname: (function(path) {
  return PATH.splitPath(path)[3];
 }),
 join: (function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 }),
 join2: (function(l, r) {
  return PATH.normalize(l + "/" + r);
 }),
 resolve: (function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
   return !!p;
  })), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 }),
 relative: (function(from, to) {
  from = PATH.resolve(from).substr(1);
  to = PATH.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (; start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (; end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 })
};
function _emscripten_set_main_loop_timing(mode, value) {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   setTimeout(Browser.mainLoop.runner, value);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (!window["setImmediate"]) {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "__emcc";
   function Browser_setImmediate_messageHandler(event) {
    if (event.source === window && event.data === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   }
   window.addEventListener("message", Browser_setImmediate_messageHandler, true);
   window["setImmediate"] = function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    window.postMessage(emscriptenMainLoopMessageId, "*");
   };
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   window["setImmediate"](Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
 Module["noExitRuntime"] = true;
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = func;
 Browser.mainLoop.arg = arg;
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
   Browser.mainLoop.updateStatus();
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  }
  if (Browser.mainLoop.method === "timeout" && Module.ctx) {
   Module.printErr("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
   Browser.mainLoop.method = "";
  }
  Browser.mainLoop.runIter((function() {
   if (typeof arg !== "undefined") {
    Runtime.dynCall("vi", func, [ arg ]);
   } else {
    Runtime.dynCall("v", func);
   }
  }));
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "SimulateInfiniteLoop";
 }
}
var Browser = {
 mainLoop: {
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause: (function() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  }),
  resume: (function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  }),
  updateStatus: (function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  }),
  runIter: (function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   try {
    func();
   } catch (e) {
    if (e instanceof ExitStatus) {
     return;
    } else {
     if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
     throw e;
    }
   }
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  })
 },
 isFullScreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: (function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob;
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
   console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     Runtime.warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder;
    bb.append((new Uint8Array(byteArray)).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   var img = new Image;
   img.onload = function img_onload() {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    Module["preloadedImages"][name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = function img_onerror(event) {
    console.log("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = new Audio;
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var audio = new Audio;
    audio.addEventListener("canplaythrough", (function() {
     finish(audio);
    }), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
        leftbits -= 6;
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    Browser.safeSetTimeout((function() {
     finish(audio);
    }), 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  var canvas = Module["canvas"];
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === canvas || document["mozPointerLockElement"] === canvas || document["webkitPointerLockElement"] === canvas || document["msPointerLockElement"] === canvas;
  }
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (function() {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (function() {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", (function(ev) {
     if (!Browser.pointerLock && canvas.requestPointerLock) {
      canvas.requestPointerLock();
      ev.preventDefault();
     }
    }), false);
   }
  }
 }),
 createContext: (function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   contextHandle = GL.createContext(canvas, contextAttributes);
   if (contextHandle) {
    ctx = GL.getContext(contextHandle).GLctx;
   }
   canvas.style.backgroundColor = "black";
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach((function(callback) {
    callback();
   }));
   Browser.init();
  }
  return ctx;
 }),
 destroyContext: (function(canvas, useWebGL, setInModule) {}),
 fullScreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullScreen: (function(lockPointer, resizeCanvas, vrDevice) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  Browser.vrDevice = vrDevice;
  if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
  if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
  var canvas = Module["canvas"];
  function fullScreenChange() {
   Browser.isFullScreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.cancelFullScreen = document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["webkitCancelFullScreen"] || document["msExitFullscreen"] || document["exitFullscreen"] || (function() {});
    canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullScreen = true;
    if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullScreen);
   Browser.updateCanvasDimensions(canvas);
  }
  if (!Browser.fullScreenHandlersInstalled) {
   Browser.fullScreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullScreenChange, false);
   document.addEventListener("mozfullscreenchange", fullScreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
   document.addEventListener("MSFullscreenChange", fullScreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullScreen = canvasContainer["requestFullScreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullScreen"] ? (function() {
   canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  }) : null);
  if (vrDevice) {
   canvasContainer.requestFullScreen({
    vrDisplay: vrDevice
   });
  } else {
   canvasContainer.requestFullScreen();
  }
 }),
 nextRAF: 0,
 fakeRequestAnimationFrame: (function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 }),
 requestAnimationFrame: function requestAnimationFrame(func) {
  if (typeof window === "undefined") {
   Browser.fakeRequestAnimationFrame(func);
  } else {
   if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || Browser.fakeRequestAnimationFrame;
   }
   window.requestAnimationFrame(func);
  }
 },
 safeCallback: (function(func) {
  return (function() {
   if (!ABORT) return func.apply(null, arguments);
  });
 }),
 allowAsyncCallbacks: true,
 queuedAsyncCallbacks: [],
 pauseAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = false;
 }),
 resumeAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = true;
  if (Browser.queuedAsyncCallbacks.length > 0) {
   var callbacks = Browser.queuedAsyncCallbacks;
   Browser.queuedAsyncCallbacks = [];
   callbacks.forEach((function(func) {
    func();
   }));
  }
 }),
 safeRequestAnimationFrame: (function(func) {
  return Browser.requestAnimationFrame((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }));
 }),
 safeSetTimeout: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setTimeout((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }), timeout);
 }),
 safeSetInterval: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setInterval((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   }
  }), timeout);
 }),
 getMimetype: (function(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 }),
 getUserMedia: (function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 }),
 getMovementX: (function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 }),
 getMovementY: (function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 }),
 getMouseWheelDelta: (function(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail;
   break;
  case "mousewheel":
   delta = event.wheelDelta;
   break;
  case "wheel":
   delta = event["deltaY"];
   break;
  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 }),
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: (function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 }),
 xhrLoad: (function(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
   } else {
    onerror();
   }
  };
  xhr.onerror = onerror;
  xhr.send(null);
 }),
 asyncLoad: (function(url, onload, onerror, noRunDep) {
  Browser.xhrLoad(url, (function(arrayBuffer) {
   assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
   onload(new Uint8Array(arrayBuffer));
   if (!noRunDep) removeRunDependency("al " + url);
  }), (function(event) {
   if (onerror) {
    onerror();
   } else {
    throw 'Loading data file "' + url + '" failed.';
   }
  }));
  if (!noRunDep) addRunDependency("al " + url);
 }),
 resizeListeners: [],
 updateResizeListeners: (function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach((function(listener) {
   listener(canvas.width, canvas.height);
  }));
 }),
 setCanvasSize: (function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 }),
 windowedWidth: 0,
 windowedHeight: 0,
 setFullScreenCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags | 8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 setWindowedCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags & ~8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 updateCanvasDimensions: (function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }),
 wgetRequests: {},
 nextWgetRequestHandle: 0,
 getNextWgetRequestHandle: (function() {
  var handle = Browser.nextWgetRequestHandle;
  Browser.nextWgetRequestHandle++;
  return handle;
 })
};
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
var emval_free_list = [];
var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];
function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}
function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}
function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}
function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}
function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }
 case null:
  {
   return 2;
  }
 case true:
  {
   return 3;
  }
 case false:
  {
   return 4;
  }
 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}
function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  }),
  "toWireType": (function(destructors, value) {
   return __emval_register(value);
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 mappings: {},
 umask: 511,
 calculateAt: (function(dirfd, path) {
  if (path[0] !== "/") {
   var dir;
   if (dirfd === -100) {
    dir = FS.cwd();
   } else {
    var dirstream = FS.getStream(dirfd);
    if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
    dir = dirstream.path;
   }
   path = PATH.join2(dir, path);
  }
  return path;
 }),
 doStat: (function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -ERRNO_CODES.ENOTDIR;
   }
   throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 4 >> 2] = 0;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAP32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  HEAP32[buf + 32 >> 2] = 0;
  HEAP32[buf + 36 >> 2] = stat.size;
  HEAP32[buf + 40 >> 2] = 4096;
  HEAP32[buf + 44 >> 2] = stat.blocks;
  HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
  HEAP32[buf + 52 >> 2] = 0;
  HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
  HEAP32[buf + 60 >> 2] = 0;
  HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
  HEAP32[buf + 68 >> 2] = 0;
  HEAP32[buf + 72 >> 2] = stat.ino;
  return 0;
 }),
 doMsync: (function(addr, stream, len, flags) {
  var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
  FS.msync(stream, buffer, 0, len, flags);
 }),
 doMkdir: (function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 }),
 doMknod: (function(path, mode, dev) {
  switch (mode & 61440) {
  case 32768:
  case 8192:
  case 24576:
  case 4096:
  case 49152:
   break;
  default:
   return -ERRNO_CODES.EINVAL;
  }
  FS.mknod(path, mode, dev);
  return 0;
 }),
 doReadlink: (function(path, buf, bufsize) {
  if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
  var ret = FS.readlink(path);
  ret = ret.slice(0, Math.max(0, bufsize));
  writeStringToMemory(ret, buf, true);
  return ret.length;
 }),
 doAccess: (function(path, amode) {
  if (amode & ~7) {
   return -ERRNO_CODES.EINVAL;
  }
  var node;
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  node = lookup.node;
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 doDup: (function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest) FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
 }),
 doReadv: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.read(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
   if (curr < len) break;
  }
  return ret;
 }),
 doWritev: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.write(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
  }
  return ret;
 }),
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 getStreamFromFD: (function() {
  var stream = FS.getStream(SYSCALLS.get());
  if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return stream;
 }),
 getSocketFromFD: (function() {
  var socket = SOCKFS.getSocket(SYSCALLS.get());
  if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return socket;
 }),
 getSocketAddress: (function(allowNull) {
  var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
  if (allowNull && addrp === 0) return null;
  var info = __read_sockaddr(addrp, addrlen);
  if (info.errno) throw new FS.ErrnoError(info.errno);
  info.addr = DNS.lookup_addr(info.addr) || info.addr;
  return info;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
  switch (op) {
  case 21505:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }
  case 21506:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }
  case 21519:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    var argp = SYSCALLS.get();
    HEAP32[argp >> 2] = 0;
    return 0;
   }
  case 21520:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return -ERRNO_CODES.EINVAL;
   }
  case 21531:
   {
    var argp = SYSCALLS.get();
    return FS.ioctl(stream, op, argp);
   }
  default:
   abort("bad ioctl syscall " + op);
  }
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function _sysconf(name) {
 switch (name) {
 case 30:
  return PAGE_SIZE;
 case 85:
  return totalMemory / PAGE_SIZE;
 case 132:
 case 133:
 case 12:
 case 137:
 case 138:
 case 15:
 case 235:
 case 16:
 case 17:
 case 18:
 case 19:
 case 20:
 case 149:
 case 13:
 case 10:
 case 236:
 case 153:
 case 9:
 case 21:
 case 22:
 case 159:
 case 154:
 case 14:
 case 77:
 case 78:
 case 139:
 case 80:
 case 81:
 case 82:
 case 68:
 case 67:
 case 164:
 case 11:
 case 29:
 case 47:
 case 48:
 case 95:
 case 52:
 case 51:
 case 46:
  return 200809;
 case 79:
  return 0;
 case 27:
 case 246:
 case 127:
 case 128:
 case 23:
 case 24:
 case 160:
 case 161:
 case 181:
 case 182:
 case 242:
 case 183:
 case 184:
 case 243:
 case 244:
 case 245:
 case 165:
 case 178:
 case 179:
 case 49:
 case 50:
 case 168:
 case 169:
 case 175:
 case 170:
 case 171:
 case 172:
 case 97:
 case 76:
 case 32:
 case 173:
 case 35:
  return -1;
 case 176:
 case 177:
 case 7:
 case 155:
 case 8:
 case 157:
 case 125:
 case 126:
 case 92:
 case 93:
 case 129:
 case 130:
 case 131:
 case 94:
 case 91:
  return 1;
 case 74:
 case 60:
 case 69:
 case 70:
 case 4:
  return 1024;
 case 31:
 case 42:
 case 72:
  return 32;
 case 87:
 case 26:
 case 33:
  return 2147483647;
 case 34:
 case 1:
  return 47839;
 case 38:
 case 36:
  return 99;
 case 43:
 case 37:
  return 2048;
 case 0:
  return 2097152;
 case 3:
  return 65536;
 case 28:
  return 32768;
 case 44:
  return 32767;
 case 75:
  return 16384;
 case 39:
  return 1e3;
 case 89:
  return 700;
 case 71:
  return 256;
 case 40:
  return 255;
 case 2:
  return 100;
 case 180:
  return 64;
 case 25:
  return 20;
 case 5:
  return 16;
 case 6:
  return 6;
 case 73:
  return 4;
 case 84:
  {
   if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
   return 1;
  }
 }
 ___setErrNo(ERRNO_CODES.EINVAL);
 return -1;
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;
function ___cxa_pure_virtual() {
 ABORT = true;
 throw "Pure virtual function called!";
}
function _pthread_cleanup_pop() {
 assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
 __ATEXIT__.pop();
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return (function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  });
 case 3:
  return (function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  });
 default:
  throw new TypeError("Unknown float type: " + name);
 }
}
function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   return value;
  }),
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}
var _BDtoIHigh = true;
function _pthread_cleanup_push(routine, arg) {
 __ATEXIT__.push((function() {
  Runtime.dynCall("vi", routine, [ arg ]);
 }));
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function() {}));
 dummy.prototype = constructor.prototype;
 var obj = new dummy;
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}
function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 var returns = argTypes[0].name !== "void";
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}
function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = (function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  });
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}
function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}
function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}
function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
 }
}
function requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction);
 }
 var fp;
 if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
  fp = Module["FUNCTION_TABLE_" + signature][rawFunction];
 } else if (typeof FUNCTION_TABLE !== "undefined") {
  fp = FUNCTION_TABLE[rawFunction];
 } else {
  var dc = asm["dynCall_" + signature];
  if (dc === undefined) {
   dc = asm["dynCall_" + signature.replace(/f/g, "d")];
   if (dc === undefined) {
    throwBindingError("No dynCall invoker for signature: " + signature);
   }
  }
  fp = makeDynCaller(dc);
 }
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}
var UnboundTypeError = undefined;
function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}
function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
 var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 name = readLatin1String(name);
 rawInvoker = requireFunction(signature, rawInvoker);
 exposePublicSymbol(name, (function() {
  throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
 }), argCount - 1);
 whenDependentTypesAreResolved([], argTypes, (function(argTypes) {
  var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
  replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
  return [];
 }));
}
Module["_i64Add"] = _i64Add;
function ___cxa_begin_catch(ptr) {
 __ZSt18uncaught_exceptionv.uncaught_exception--;
 EXCEPTIONS.caught.push(ptr);
 EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
 return ptr;
}
var _sinf = Math_sin;
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function _sbrk(bytes) {
 var self = _sbrk;
 if (!self.called) {
  DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
  self.called = true;
  assert(Runtime.dynamicAlloc);
  self.alloc = Runtime.dynamicAlloc;
  Runtime.dynamicAlloc = (function() {
   abort("cannot dynamically allocate, sbrk now has control");
  });
 }
 var ret = DYNAMICTOP;
 if (bytes != 0) {
  var success = self.alloc(bytes);
  if (!success) return -1 >>> 0;
 }
 return ret;
}
Module["_memmove"] = _memmove;
var _BItoD = true;
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(heap["buffer"], data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}
function _time(ptr) {
 var ret = Date.now() / 1e3 | 0;
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}
function _pthread_self() {
 return 0;
}
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  assert(offset_high === 0);
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  return SYSCALLS.doWritev(stream, iov, iovcnt);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
 Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
FS.staticInit();
__ATINIT__.unshift((function() {
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
}));
__ATMAIN__.push((function() {
 FS.ignorePermissions = false;
}));
__ATEXIT__.push((function() {
 FS.quit();
}));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function() {
 TTY.init();
}));
__ATEXIT__.push((function() {
 TTY.shutdown();
}));
if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var NODEJS_PATH = require("path");
 NODEFS.staticInit();
}
init_emval();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var cttz_i8 = allocate([ 8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0 ], "i8", ALLOC_DYNAMIC);
function invoke_iiii(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 try {
  Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_i(index) {
 try {
  return Module["dynCall_i"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vii(index, a1, a2) {
 try {
  Module["dynCall_vii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viidii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viidii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vidd(index, a1, a2, a3) {
 try {
  Module["dynCall_vidd"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_ii(index, a1) {
 try {
  return Module["dynCall_ii"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viidi(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viidi"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vdd(index, a1, a2) {
 try {
  Module["dynCall_vdd"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_v(index) {
 try {
  Module["dynCall_v"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viid(index, a1, a2, a3) {
 try {
  Module["dynCall_viid"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiii(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iii(index, a1, a2) {
 try {
  return Module["dynCall_iii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 try {
  return Module["dynCall_iiiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viii(index, a1, a2, a3) {
 try {
  Module["dynCall_viii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity
};
Module.asmLibraryArg = {
 "abort": abort,
 "assert": assert,
 "invoke_iiii": invoke_iiii,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_i": invoke_i,
 "invoke_vi": invoke_vi,
 "invoke_vii": invoke_vii,
 "invoke_viidii": invoke_viidii,
 "invoke_vidd": invoke_vidd,
 "invoke_ii": invoke_ii,
 "invoke_viidi": invoke_viidi,
 "invoke_vdd": invoke_vdd,
 "invoke_v": invoke_v,
 "invoke_viid": invoke_viid,
 "invoke_viiii": invoke_viiii,
 "invoke_iii": invoke_iii,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_viii": invoke_viii,
 "_pthread_cleanup_pop": _pthread_cleanup_pop,
 "floatReadValueFromPointer": floatReadValueFromPointer,
 "simpleReadValueFromPointer": simpleReadValueFromPointer,
 "_cosf": _cosf,
 "_sqrtf": _sqrtf,
 "__embind_register_memory_view": __embind_register_memory_view,
 "throwInternalError": throwInternalError,
 "get_first_emval": get_first_emval,
 "_abort": _abort,
 "___cxa_pure_virtual": ___cxa_pure_virtual,
 "_pthread_key_create": _pthread_key_create,
 "___setErrNo": ___setErrNo,
 "extendError": extendError,
 "__embind_register_integer": __embind_register_integer,
 "__embind_register_void": __embind_register_void,
 "___assert_fail": ___assert_fail,
 "___cxa_allocate_exception": ___cxa_allocate_exception,
 "___cxa_find_matching_catch": ___cxa_find_matching_catch,
 "getShiftFromSize": getShiftFromSize,
 "__embind_register_function": __embind_register_function,
 "__embind_register_emval": __embind_register_emval,
 "throwBindingError": throwBindingError,
 "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing,
 "__emval_register": __emval_register,
 "_sbrk": _sbrk,
 "__embind_register_std_wstring": __embind_register_std_wstring,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "__embind_register_bool": __embind_register_bool,
 "___resumeException": ___resumeException,
 "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
 "_sysconf": _sysconf,
 "_embind_repr": _embind_repr,
 "___cxa_begin_catch": ___cxa_begin_catch,
 "_pthread_getspecific": _pthread_getspecific,
 "createNamedFunction": createNamedFunction,
 "_sinf": _sinf,
 "embind_init_charCodes": embind_init_charCodes,
 "readLatin1String": readLatin1String,
 "throwUnboundTypeError": throwUnboundTypeError,
 "_pthread_self": _pthread_self,
 "craftInvokerFunction": craftInvokerFunction,
 "__emval_decref": __emval_decref,
 "_pthread_once": _pthread_once,
 "__embind_register_float": __embind_register_float,
 "_floorf": _floorf,
 "makeLegalFunctionName": makeLegalFunctionName,
 "___syscall54": ___syscall54,
 "___unlock": ___unlock,
 "heap32VectorToArray": heap32VectorToArray,
 "init_emval": init_emval,
 "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
 "_emscripten_set_main_loop": _emscripten_set_main_loop,
 "__embind_register_std_string": __embind_register_std_string,
 "getTypeName": getTypeName,
 "_pthread_setspecific": _pthread_setspecific,
 "integerReadValueFromPointer": integerReadValueFromPointer,
 "registerType": registerType,
 "___cxa_throw": ___cxa_throw,
 "_emscripten_asm_const_3": _emscripten_asm_const_3,
 "___lock": ___lock,
 "___syscall6": ___syscall6,
 "_pthread_cleanup_push": _pthread_cleanup_push,
 "ensureOverloadTable": ensureOverloadTable,
 "count_emval_handles": count_emval_handles,
 "_time": _time,
 "requireFunction": requireFunction,
 "runDestructors": runDestructors,
 "new_": new_,
 "___syscall140": ___syscall140,
 "exposePublicSymbol": exposePublicSymbol,
 "_emscripten_asm_const_5": _emscripten_asm_const_5,
 "_emscripten_asm_const_4": _emscripten_asm_const_4,
 "replacePublicSymbol": replacePublicSymbol,
 "_emscripten_asm_const_2": _emscripten_asm_const_2,
 "___syscall146": ___syscall146,
 "_emscripten_asm_const_0": _emscripten_asm_const_0,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "cttz_i8": cttz_i8
};
// EMSCRIPTEN_START_ASM

var asm = (function(global,env,buffer) {

  'use asm';
  
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_i=env.invoke_i;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_viidii=env.invoke_viidii;
  var invoke_vidd=env.invoke_vidd;
  var invoke_ii=env.invoke_ii;
  var invoke_viidi=env.invoke_viidi;
  var invoke_vdd=env.invoke_vdd;
  var invoke_v=env.invoke_v;
  var invoke_viid=env.invoke_viid;
  var invoke_viiii=env.invoke_viiii;
  var invoke_iii=env.invoke_iii;
  var invoke_iiiiii=env.invoke_iiiiii;
  var invoke_viii=env.invoke_viii;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var _cosf=env._cosf;
  var _sqrtf=env._sqrtf;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var _abort=env._abort;
  var ___cxa_pure_virtual=env.___cxa_pure_virtual;
  var _pthread_key_create=env._pthread_key_create;
  var ___setErrNo=env.___setErrNo;
  var extendError=env.extendError;
  var __embind_register_integer=env.__embind_register_integer;
  var __embind_register_void=env.__embind_register_void;
  var ___assert_fail=env.___assert_fail;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var getShiftFromSize=env.getShiftFromSize;
  var __embind_register_function=env.__embind_register_function;
  var __embind_register_emval=env.__embind_register_emval;
  var throwBindingError=env.throwBindingError;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var __emval_register=env.__emval_register;
  var _sbrk=env._sbrk;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var _sysconf=env._sysconf;
  var _embind_repr=env._embind_repr;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _pthread_getspecific=env._pthread_getspecific;
  var createNamedFunction=env.createNamedFunction;
  var _sinf=env._sinf;
  var embind_init_charCodes=env.embind_init_charCodes;
  var readLatin1String=env.readLatin1String;
  var throwUnboundTypeError=env.throwUnboundTypeError;
  var _pthread_self=env._pthread_self;
  var craftInvokerFunction=env.craftInvokerFunction;
  var __emval_decref=env.__emval_decref;
  var _pthread_once=env._pthread_once;
  var __embind_register_float=env.__embind_register_float;
  var _floorf=env._floorf;
  var makeLegalFunctionName=env.makeLegalFunctionName;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var heap32VectorToArray=env.heap32VectorToArray;
  var init_emval=env.init_emval;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var __embind_register_std_string=env.__embind_register_std_string;
  var getTypeName=env.getTypeName;
  var _pthread_setspecific=env._pthread_setspecific;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var registerType=env.registerType;
  var ___cxa_throw=env.___cxa_throw;
  var _emscripten_asm_const_3=env._emscripten_asm_const_3;
  var ___lock=env.___lock;
  var ___syscall6=env.___syscall6;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var ensureOverloadTable=env.ensureOverloadTable;
  var count_emval_handles=env.count_emval_handles;
  var _time=env._time;
  var requireFunction=env.requireFunction;
  var runDestructors=env.runDestructors;
  var new_=env.new_;
  var ___syscall140=env.___syscall140;
  var exposePublicSymbol=env.exposePublicSymbol;
  var _emscripten_asm_const_5=env._emscripten_asm_const_5;
  var _emscripten_asm_const_4=env._emscripten_asm_const_4;
  var replacePublicSymbol=env.replacePublicSymbol;
  var _emscripten_asm_const_2=env._emscripten_asm_const_2;
  var ___syscall146=env.___syscall146;
  var _emscripten_asm_const_0=env._emscripten_asm_const_0;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function _malloc(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0;
 do if (i2 >>> 0 < 245) {
  i14 = i2 >>> 0 < 11 ? 16 : i2 + 11 & -8;
  i2 = i14 >>> 3;
  i8 = HEAP32[520] | 0;
  i3 = i8 >>> i2;
  if (i3 & 3) {
   i2 = (i3 & 1 ^ 1) + i2 | 0;
   i4 = i2 << 1;
   i3 = 2120 + (i4 << 2) | 0;
   i4 = 2120 + (i4 + 2 << 2) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   i6 = i5 + 8 | 0;
   i7 = HEAP32[i6 >> 2] | 0;
   do if ((i3 | 0) != (i7 | 0)) {
    if (i7 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
    i1 = i7 + 12 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i5 | 0)) {
     HEAP32[i1 >> 2] = i3;
     HEAP32[i4 >> 2] = i7;
     break;
    } else _abort();
   } else HEAP32[520] = i8 & ~(1 << i2); while (0);
   i38 = i2 << 3;
   HEAP32[i5 + 4 >> 2] = i38 | 3;
   i38 = i5 + (i38 | 4) | 0;
   HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
   i38 = i6;
   return i38 | 0;
  }
  i7 = HEAP32[522] | 0;
  if (i14 >>> 0 > i7 >>> 0) {
   if (i3) {
    i4 = 2 << i2;
    i4 = i3 << i2 & (i4 | 0 - i4);
    i4 = (i4 & 0 - i4) + -1 | 0;
    i9 = i4 >>> 12 & 16;
    i4 = i4 >>> i9;
    i5 = i4 >>> 5 & 8;
    i4 = i4 >>> i5;
    i6 = i4 >>> 2 & 4;
    i4 = i4 >>> i6;
    i3 = i4 >>> 1 & 2;
    i4 = i4 >>> i3;
    i2 = i4 >>> 1 & 1;
    i2 = (i5 | i9 | i6 | i3 | i2) + (i4 >>> i2) | 0;
    i4 = i2 << 1;
    i3 = 2120 + (i4 << 2) | 0;
    i4 = 2120 + (i4 + 2 << 2) | 0;
    i6 = HEAP32[i4 >> 2] | 0;
    i9 = i6 + 8 | 0;
    i5 = HEAP32[i9 >> 2] | 0;
    do if ((i3 | 0) != (i5 | 0)) {
     if (i5 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
     i1 = i5 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i6 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i4 >> 2] = i5;
      i10 = HEAP32[522] | 0;
      break;
     } else _abort();
    } else {
     HEAP32[520] = i8 & ~(1 << i2);
     i10 = i7;
    } while (0);
    i38 = i2 << 3;
    i7 = i38 - i14 | 0;
    HEAP32[i6 + 4 >> 2] = i14 | 3;
    i8 = i6 + i14 | 0;
    HEAP32[i6 + (i14 | 4) >> 2] = i7 | 1;
    HEAP32[i6 + i38 >> 2] = i7;
    if (i10) {
     i5 = HEAP32[525] | 0;
     i3 = i10 >>> 3;
     i1 = i3 << 1;
     i4 = 2120 + (i1 << 2) | 0;
     i2 = HEAP32[520] | 0;
     i3 = 1 << i3;
     if (i2 & i3) {
      i2 = 2120 + (i1 + 2 << 2) | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
       i11 = i2;
       i12 = i1;
      }
     } else {
      HEAP32[520] = i2 | i3;
      i11 = 2120 + (i1 + 2 << 2) | 0;
      i12 = i4;
     }
     HEAP32[i11 >> 2] = i5;
     HEAP32[i12 + 12 >> 2] = i5;
     HEAP32[i5 + 8 >> 2] = i12;
     HEAP32[i5 + 12 >> 2] = i4;
    }
    HEAP32[522] = i7;
    HEAP32[525] = i8;
    i38 = i9;
    return i38 | 0;
   }
   i2 = HEAP32[521] | 0;
   if (i2) {
    i3 = (i2 & 0 - i2) + -1 | 0;
    i37 = i3 >>> 12 & 16;
    i3 = i3 >>> i37;
    i36 = i3 >>> 5 & 8;
    i3 = i3 >>> i36;
    i38 = i3 >>> 2 & 4;
    i3 = i3 >>> i38;
    i2 = i3 >>> 1 & 2;
    i3 = i3 >>> i2;
    i4 = i3 >>> 1 & 1;
    i4 = HEAP32[2384 + ((i36 | i37 | i38 | i2 | i4) + (i3 >>> i4) << 2) >> 2] | 0;
    i3 = (HEAP32[i4 + 4 >> 2] & -8) - i14 | 0;
    i2 = i4;
    while (1) {
     i1 = HEAP32[i2 + 16 >> 2] | 0;
     if (!i1) {
      i1 = HEAP32[i2 + 20 >> 2] | 0;
      if (!i1) {
       i9 = i3;
       break;
      }
     }
     i2 = (HEAP32[i1 + 4 >> 2] & -8) - i14 | 0;
     i38 = i2 >>> 0 < i3 >>> 0;
     i3 = i38 ? i2 : i3;
     i2 = i1;
     i4 = i38 ? i1 : i4;
    }
    i6 = HEAP32[524] | 0;
    if (i4 >>> 0 < i6 >>> 0) _abort();
    i8 = i4 + i14 | 0;
    if (i4 >>> 0 >= i8 >>> 0) _abort();
    i7 = HEAP32[i4 + 24 >> 2] | 0;
    i3 = HEAP32[i4 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i4 | 0)) {
     i2 = i4 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i4 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i13 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if (i5) {
       i1 = i5;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if (!i5) break; else {
       i1 = i5;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i6 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i13 = i1;
      break;
     }
    } else {
     i5 = HEAP32[i4 + 8 >> 2] | 0;
     if (i5 >>> 0 < i6 >>> 0) _abort();
     i1 = i5 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i4 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i4 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i5;
      i13 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i7) {
     i1 = HEAP32[i4 + 28 >> 2] | 0;
     i2 = 2384 + (i1 << 2) | 0;
     if ((i4 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i13;
      if (!i13) {
       HEAP32[521] = HEAP32[521] & ~(1 << i1);
       break;
      }
     } else {
      if (i7 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
      i1 = i7 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i4 | 0)) HEAP32[i1 >> 2] = i13; else HEAP32[i7 + 20 >> 2] = i13;
      if (!i13) break;
     }
     i2 = HEAP32[524] | 0;
     if (i13 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i13 + 24 >> 2] = i7;
     i1 = HEAP32[i4 + 16 >> 2] | 0;
     do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i13 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i13;
      break;
     } while (0);
     i1 = HEAP32[i4 + 20 >> 2] | 0;
     if (i1) if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
      HEAP32[i13 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i13;
      break;
     }
    } while (0);
    if (i9 >>> 0 < 16) {
     i38 = i9 + i14 | 0;
     HEAP32[i4 + 4 >> 2] = i38 | 3;
     i38 = i4 + (i38 + 4) | 0;
     HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
    } else {
     HEAP32[i4 + 4 >> 2] = i14 | 3;
     HEAP32[i4 + (i14 | 4) >> 2] = i9 | 1;
     HEAP32[i4 + (i9 + i14) >> 2] = i9;
     i1 = HEAP32[522] | 0;
     if (i1) {
      i6 = HEAP32[525] | 0;
      i3 = i1 >>> 3;
      i1 = i3 << 1;
      i5 = 2120 + (i1 << 2) | 0;
      i2 = HEAP32[520] | 0;
      i3 = 1 << i3;
      if (i2 & i3) {
       i1 = 2120 + (i1 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
        i15 = i1;
        i16 = i2;
       }
      } else {
       HEAP32[520] = i2 | i3;
       i15 = 2120 + (i1 + 2 << 2) | 0;
       i16 = i5;
      }
      HEAP32[i15 >> 2] = i6;
      HEAP32[i16 + 12 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i16;
      HEAP32[i6 + 12 >> 2] = i5;
     }
     HEAP32[522] = i9;
     HEAP32[525] = i8;
    }
    i38 = i4 + 8 | 0;
    return i38 | 0;
   } else i16 = i14;
  } else i16 = i14;
 } else if (i2 >>> 0 <= 4294967231) {
  i2 = i2 + 11 | 0;
  i12 = i2 & -8;
  i11 = HEAP32[521] | 0;
  if (i11) {
   i3 = 0 - i12 | 0;
   i2 = i2 >>> 8;
   if (i2) if (i12 >>> 0 > 16777215) i10 = 31; else {
    i16 = (i2 + 1048320 | 0) >>> 16 & 8;
    i21 = i2 << i16;
    i15 = (i21 + 520192 | 0) >>> 16 & 4;
    i21 = i21 << i15;
    i10 = (i21 + 245760 | 0) >>> 16 & 2;
    i10 = 14 - (i15 | i16 | i10) + (i21 << i10 >>> 15) | 0;
    i10 = i12 >>> (i10 + 7 | 0) & 1 | i10 << 1;
   } else i10 = 0;
   i2 = HEAP32[2384 + (i10 << 2) >> 2] | 0;
   L123 : do if (!i2) {
    i5 = 0;
    i2 = 0;
    i21 = 86;
   } else {
    i7 = i3;
    i5 = 0;
    i8 = i12 << ((i10 | 0) == 31 ? 0 : 25 - (i10 >>> 1) | 0);
    i9 = i2;
    i2 = 0;
    while (1) {
     i6 = HEAP32[i9 + 4 >> 2] & -8;
     i3 = i6 - i12 | 0;
     if (i3 >>> 0 < i7 >>> 0) if ((i6 | 0) == (i12 | 0)) {
      i6 = i9;
      i2 = i9;
      i21 = 90;
      break L123;
     } else i2 = i9; else i3 = i7;
     i21 = HEAP32[i9 + 20 >> 2] | 0;
     i9 = HEAP32[i9 + 16 + (i8 >>> 31 << 2) >> 2] | 0;
     i5 = (i21 | 0) == 0 | (i21 | 0) == (i9 | 0) ? i5 : i21;
     if (!i9) {
      i21 = 86;
      break;
     } else {
      i7 = i3;
      i8 = i8 << 1;
     }
    }
   } while (0);
   if ((i21 | 0) == 86) {
    if ((i5 | 0) == 0 & (i2 | 0) == 0) {
     i2 = 2 << i10;
     i2 = i11 & (i2 | 0 - i2);
     if (!i2) {
      i16 = i12;
      break;
     }
     i2 = (i2 & 0 - i2) + -1 | 0;
     i13 = i2 >>> 12 & 16;
     i2 = i2 >>> i13;
     i11 = i2 >>> 5 & 8;
     i2 = i2 >>> i11;
     i15 = i2 >>> 2 & 4;
     i2 = i2 >>> i15;
     i16 = i2 >>> 1 & 2;
     i2 = i2 >>> i16;
     i5 = i2 >>> 1 & 1;
     i5 = HEAP32[2384 + ((i11 | i13 | i15 | i16 | i5) + (i2 >>> i5) << 2) >> 2] | 0;
     i2 = 0;
    }
    if (!i5) {
     i8 = i3;
     i9 = i2;
    } else {
     i6 = i5;
     i21 = 90;
    }
   }
   if ((i21 | 0) == 90) while (1) {
    i21 = 0;
    i16 = (HEAP32[i6 + 4 >> 2] & -8) - i12 | 0;
    i5 = i16 >>> 0 < i3 >>> 0;
    i3 = i5 ? i16 : i3;
    i2 = i5 ? i6 : i2;
    i5 = HEAP32[i6 + 16 >> 2] | 0;
    if (i5) {
     i6 = i5;
     i21 = 90;
     continue;
    }
    i6 = HEAP32[i6 + 20 >> 2] | 0;
    if (!i6) {
     i8 = i3;
     i9 = i2;
     break;
    } else i21 = 90;
   }
   if ((i9 | 0) != 0 ? i8 >>> 0 < ((HEAP32[522] | 0) - i12 | 0) >>> 0 : 0) {
    i5 = HEAP32[524] | 0;
    if (i9 >>> 0 < i5 >>> 0) _abort();
    i7 = i9 + i12 | 0;
    if (i9 >>> 0 >= i7 >>> 0) _abort();
    i6 = HEAP32[i9 + 24 >> 2] | 0;
    i3 = HEAP32[i9 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i9 | 0)) {
     i2 = i9 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i9 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i14 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (i4) {
       i1 = i4;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (!i4) break; else {
       i1 = i4;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i5 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i14 = i1;
      break;
     }
    } else {
     i4 = HEAP32[i9 + 8 >> 2] | 0;
     if (i4 >>> 0 < i5 >>> 0) _abort();
     i1 = i4 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i9 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i4;
      i14 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i6) {
     i1 = HEAP32[i9 + 28 >> 2] | 0;
     i2 = 2384 + (i1 << 2) | 0;
     if ((i9 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i14;
      if (!i14) {
       HEAP32[521] = HEAP32[521] & ~(1 << i1);
       break;
      }
     } else {
      if (i6 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
      i1 = i6 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) HEAP32[i1 >> 2] = i14; else HEAP32[i6 + 20 >> 2] = i14;
      if (!i14) break;
     }
     i2 = HEAP32[524] | 0;
     if (i14 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i14 + 24 >> 2] = i6;
     i1 = HEAP32[i9 + 16 >> 2] | 0;
     do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i14 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i14;
      break;
     } while (0);
     i1 = HEAP32[i9 + 20 >> 2] | 0;
     if (i1) if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
      HEAP32[i14 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i14;
      break;
     }
    } while (0);
    L199 : do if (i8 >>> 0 >= 16) {
     HEAP32[i9 + 4 >> 2] = i12 | 3;
     HEAP32[i9 + (i12 | 4) >> 2] = i8 | 1;
     HEAP32[i9 + (i8 + i12) >> 2] = i8;
     i1 = i8 >>> 3;
     if (i8 >>> 0 < 256) {
      i2 = i1 << 1;
      i4 = 2120 + (i2 << 2) | 0;
      i3 = HEAP32[520] | 0;
      i1 = 1 << i1;
      if (i3 & i1) {
       i1 = 2120 + (i2 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
        i18 = i1;
        i19 = i2;
       }
      } else {
       HEAP32[520] = i3 | i1;
       i18 = 2120 + (i2 + 2 << 2) | 0;
       i19 = i4;
      }
      HEAP32[i18 >> 2] = i7;
      HEAP32[i19 + 12 >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i19;
      HEAP32[i9 + (i12 + 12) >> 2] = i4;
      break;
     }
     i1 = i8 >>> 8;
     if (i1) if (i8 >>> 0 > 16777215) i4 = 31; else {
      i37 = (i1 + 1048320 | 0) >>> 16 & 8;
      i38 = i1 << i37;
      i36 = (i38 + 520192 | 0) >>> 16 & 4;
      i38 = i38 << i36;
      i4 = (i38 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i36 | i37 | i4) + (i38 << i4 >>> 15) | 0;
      i4 = i8 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } else i4 = 0;
     i1 = 2384 + (i4 << 2) | 0;
     HEAP32[i9 + (i12 + 28) >> 2] = i4;
     HEAP32[i9 + (i12 + 20) >> 2] = 0;
     HEAP32[i9 + (i12 + 16) >> 2] = 0;
     i2 = HEAP32[521] | 0;
     i3 = 1 << i4;
     if (!(i2 & i3)) {
      HEAP32[521] = i2 | i3;
      HEAP32[i1 >> 2] = i7;
      HEAP32[i9 + (i12 + 24) >> 2] = i1;
      HEAP32[i9 + (i12 + 12) >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i7;
      break;
     }
     i1 = HEAP32[i1 >> 2] | 0;
     L217 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i8 | 0)) {
      i4 = i8 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if (!i3) break;
       if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i8 | 0)) {
        i24 = i3;
        break L217;
       } else {
        i4 = i4 << 1;
        i1 = i3;
       }
      }
      if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
       HEAP32[i2 >> 2] = i7;
       HEAP32[i9 + (i12 + 24) >> 2] = i1;
       HEAP32[i9 + (i12 + 12) >> 2] = i7;
       HEAP32[i9 + (i12 + 8) >> 2] = i7;
       break L199;
      }
     } else i24 = i1; while (0);
     i1 = i24 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i38 = HEAP32[524] | 0;
     if (i2 >>> 0 >= i38 >>> 0 & i24 >>> 0 >= i38 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i7;
      HEAP32[i1 >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i2;
      HEAP32[i9 + (i12 + 12) >> 2] = i24;
      HEAP32[i9 + (i12 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i38 = i8 + i12 | 0;
     HEAP32[i9 + 4 >> 2] = i38 | 3;
     i38 = i9 + (i38 + 4) | 0;
     HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
    } while (0);
    i38 = i9 + 8 | 0;
    return i38 | 0;
   } else i16 = i12;
  } else i16 = i12;
 } else i16 = -1; while (0);
 i3 = HEAP32[522] | 0;
 if (i3 >>> 0 >= i16 >>> 0) {
  i1 = i3 - i16 | 0;
  i2 = HEAP32[525] | 0;
  if (i1 >>> 0 > 15) {
   HEAP32[525] = i2 + i16;
   HEAP32[522] = i1;
   HEAP32[i2 + (i16 + 4) >> 2] = i1 | 1;
   HEAP32[i2 + i3 >> 2] = i1;
   HEAP32[i2 + 4 >> 2] = i16 | 3;
  } else {
   HEAP32[522] = 0;
   HEAP32[525] = 0;
   HEAP32[i2 + 4 >> 2] = i3 | 3;
   i38 = i2 + (i3 + 4) | 0;
   HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
  }
  i38 = i2 + 8 | 0;
  return i38 | 0;
 }
 i2 = HEAP32[523] | 0;
 if (i2 >>> 0 > i16 >>> 0) {
  i37 = i2 - i16 | 0;
  HEAP32[523] = i37;
  i38 = HEAP32[526] | 0;
  HEAP32[526] = i38 + i16;
  HEAP32[i38 + (i16 + 4) >> 2] = i37 | 1;
  HEAP32[i38 + 4 >> 2] = i16 | 3;
  i38 = i38 + 8 | 0;
  return i38 | 0;
 }
 do if (!(HEAP32[638] | 0)) {
  i2 = _sysconf(30) | 0;
  if (!(i2 + -1 & i2)) {
   HEAP32[640] = i2;
   HEAP32[639] = i2;
   HEAP32[641] = -1;
   HEAP32[642] = -1;
   HEAP32[643] = 0;
   HEAP32[631] = 0;
   HEAP32[638] = (_time(0) | 0) & -16 ^ 1431655768;
   break;
  } else _abort();
 } while (0);
 i9 = i16 + 48 | 0;
 i8 = HEAP32[640] | 0;
 i10 = i16 + 47 | 0;
 i7 = i8 + i10 | 0;
 i8 = 0 - i8 | 0;
 i11 = i7 & i8;
 if (i11 >>> 0 <= i16 >>> 0) {
  i38 = 0;
  return i38 | 0;
 }
 i2 = HEAP32[630] | 0;
 if ((i2 | 0) != 0 ? (i19 = HEAP32[628] | 0, i24 = i19 + i11 | 0, i24 >>> 0 <= i19 >>> 0 | i24 >>> 0 > i2 >>> 0) : 0) {
  i38 = 0;
  return i38 | 0;
 }
 L258 : do if (!(HEAP32[631] & 4)) {
  i2 = HEAP32[526] | 0;
  L260 : do if (i2) {
   i5 = 2528;
   while (1) {
    i3 = HEAP32[i5 >> 2] | 0;
    if (i3 >>> 0 <= i2 >>> 0 ? (i17 = i5 + 4 | 0, (i3 + (HEAP32[i17 >> 2] | 0) | 0) >>> 0 > i2 >>> 0) : 0) {
     i6 = i5;
     i2 = i17;
     break;
    }
    i5 = HEAP32[i5 + 8 >> 2] | 0;
    if (!i5) {
     i21 = 174;
     break L260;
    }
   }
   i3 = i7 - (HEAP32[523] | 0) & i8;
   if (i3 >>> 0 < 2147483647) {
    i5 = _sbrk(i3 | 0) | 0;
    i24 = (i5 | 0) == ((HEAP32[i6 >> 2] | 0) + (HEAP32[i2 >> 2] | 0) | 0);
    i2 = i24 ? i3 : 0;
    if (i24) {
     if ((i5 | 0) != (-1 | 0)) {
      i22 = i5;
      i15 = i2;
      i21 = 194;
      break L258;
     }
    } else i21 = 184;
   } else i2 = 0;
  } else i21 = 174; while (0);
  do if ((i21 | 0) == 174) {
   i6 = _sbrk(0) | 0;
   if ((i6 | 0) != (-1 | 0)) {
    i2 = i6;
    i3 = HEAP32[639] | 0;
    i5 = i3 + -1 | 0;
    if (!(i5 & i2)) i3 = i11; else i3 = i11 - i2 + (i5 + i2 & 0 - i3) | 0;
    i2 = HEAP32[628] | 0;
    i5 = i2 + i3 | 0;
    if (i3 >>> 0 > i16 >>> 0 & i3 >>> 0 < 2147483647) {
     i24 = HEAP32[630] | 0;
     if ((i24 | 0) != 0 ? i5 >>> 0 <= i2 >>> 0 | i5 >>> 0 > i24 >>> 0 : 0) {
      i2 = 0;
      break;
     }
     i5 = _sbrk(i3 | 0) | 0;
     i24 = (i5 | 0) == (i6 | 0);
     i2 = i24 ? i3 : 0;
     if (i24) {
      i22 = i6;
      i15 = i2;
      i21 = 194;
      break L258;
     } else i21 = 184;
    } else i2 = 0;
   } else i2 = 0;
  } while (0);
  L280 : do if ((i21 | 0) == 184) {
   i6 = 0 - i3 | 0;
   do if (i9 >>> 0 > i3 >>> 0 & (i3 >>> 0 < 2147483647 & (i5 | 0) != (-1 | 0)) ? (i20 = HEAP32[640] | 0, i20 = i10 - i3 + i20 & 0 - i20, i20 >>> 0 < 2147483647) : 0) if ((_sbrk(i20 | 0) | 0) == (-1 | 0)) {
    _sbrk(i6 | 0) | 0;
    break L280;
   } else {
    i3 = i20 + i3 | 0;
    break;
   } while (0);
   if ((i5 | 0) != (-1 | 0)) {
    i22 = i5;
    i15 = i3;
    i21 = 194;
    break L258;
   }
  } while (0);
  HEAP32[631] = HEAP32[631] | 4;
  i21 = 191;
 } else {
  i2 = 0;
  i21 = 191;
 } while (0);
 if ((((i21 | 0) == 191 ? i11 >>> 0 < 2147483647 : 0) ? (i22 = _sbrk(i11 | 0) | 0, i23 = _sbrk(0) | 0, i22 >>> 0 < i23 >>> 0 & ((i22 | 0) != (-1 | 0) & (i23 | 0) != (-1 | 0))) : 0) ? (i25 = i23 - i22 | 0, i26 = i25 >>> 0 > (i16 + 40 | 0) >>> 0, i26) : 0) {
  i15 = i26 ? i25 : i2;
  i21 = 194;
 }
 if ((i21 | 0) == 194) {
  i2 = (HEAP32[628] | 0) + i15 | 0;
  HEAP32[628] = i2;
  if (i2 >>> 0 > (HEAP32[629] | 0) >>> 0) HEAP32[629] = i2;
  i7 = HEAP32[526] | 0;
  L299 : do if (i7) {
   i6 = 2528;
   do {
    i2 = HEAP32[i6 >> 2] | 0;
    i3 = i6 + 4 | 0;
    i5 = HEAP32[i3 >> 2] | 0;
    if ((i22 | 0) == (i2 + i5 | 0)) {
     i27 = i2;
     i28 = i3;
     i29 = i5;
     i30 = i6;
     i21 = 204;
     break;
    }
    i6 = HEAP32[i6 + 8 >> 2] | 0;
   } while ((i6 | 0) != 0);
   if (((i21 | 0) == 204 ? (HEAP32[i30 + 12 >> 2] & 8 | 0) == 0 : 0) ? i7 >>> 0 < i22 >>> 0 & i7 >>> 0 >= i27 >>> 0 : 0) {
    HEAP32[i28 >> 2] = i29 + i15;
    i38 = (HEAP32[523] | 0) + i15 | 0;
    i37 = i7 + 8 | 0;
    i37 = (i37 & 7 | 0) == 0 ? 0 : 0 - i37 & 7;
    i36 = i38 - i37 | 0;
    HEAP32[526] = i7 + i37;
    HEAP32[523] = i36;
    HEAP32[i7 + (i37 + 4) >> 2] = i36 | 1;
    HEAP32[i7 + (i38 + 4) >> 2] = 40;
    HEAP32[527] = HEAP32[642];
    break;
   }
   i2 = HEAP32[524] | 0;
   if (i22 >>> 0 < i2 >>> 0) {
    HEAP32[524] = i22;
    i2 = i22;
   }
   i3 = i22 + i15 | 0;
   i6 = 2528;
   while (1) {
    if ((HEAP32[i6 >> 2] | 0) == (i3 | 0)) {
     i5 = i6;
     i3 = i6;
     i21 = 212;
     break;
    }
    i6 = HEAP32[i6 + 8 >> 2] | 0;
    if (!i6) {
     i3 = 2528;
     break;
    }
   }
   if ((i21 | 0) == 212) if (!(HEAP32[i3 + 12 >> 2] & 8)) {
    HEAP32[i5 >> 2] = i22;
    i13 = i3 + 4 | 0;
    HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + i15;
    i13 = i22 + 8 | 0;
    i13 = (i13 & 7 | 0) == 0 ? 0 : 0 - i13 & 7;
    i10 = i22 + (i15 + 8) | 0;
    i10 = (i10 & 7 | 0) == 0 ? 0 : 0 - i10 & 7;
    i1 = i22 + (i10 + i15) | 0;
    i12 = i13 + i16 | 0;
    i14 = i22 + i12 | 0;
    i11 = i1 - (i22 + i13) - i16 | 0;
    HEAP32[i22 + (i13 + 4) >> 2] = i16 | 3;
    L324 : do if ((i1 | 0) != (i7 | 0)) {
     if ((i1 | 0) == (HEAP32[525] | 0)) {
      i38 = (HEAP32[522] | 0) + i11 | 0;
      HEAP32[522] = i38;
      HEAP32[525] = i14;
      HEAP32[i22 + (i12 + 4) >> 2] = i38 | 1;
      HEAP32[i22 + (i38 + i12) >> 2] = i38;
      break;
     }
     i8 = i15 + 4 | 0;
     i3 = HEAP32[i22 + (i8 + i10) >> 2] | 0;
     if ((i3 & 3 | 0) == 1) {
      i9 = i3 & -8;
      i6 = i3 >>> 3;
      L332 : do if (i3 >>> 0 >= 256) {
       i7 = HEAP32[i22 + ((i10 | 24) + i15) >> 2] | 0;
       i4 = HEAP32[i22 + (i15 + 12 + i10) >> 2] | 0;
       do if ((i4 | 0) == (i1 | 0)) {
        i5 = i10 | 16;
        i4 = i22 + (i8 + i5) | 0;
        i3 = HEAP32[i4 >> 2] | 0;
        if (!i3) {
         i4 = i22 + (i5 + i15) | 0;
         i3 = HEAP32[i4 >> 2] | 0;
         if (!i3) {
          i35 = 0;
          break;
         }
        }
        while (1) {
         i5 = i3 + 20 | 0;
         i6 = HEAP32[i5 >> 2] | 0;
         if (i6) {
          i3 = i6;
          i4 = i5;
          continue;
         }
         i5 = i3 + 16 | 0;
         i6 = HEAP32[i5 >> 2] | 0;
         if (!i6) break; else {
          i3 = i6;
          i4 = i5;
         }
        }
        if (i4 >>> 0 < i2 >>> 0) _abort(); else {
         HEAP32[i4 >> 2] = 0;
         i35 = i3;
         break;
        }
       } else {
        i5 = HEAP32[i22 + ((i10 | 8) + i15) >> 2] | 0;
        if (i5 >>> 0 < i2 >>> 0) _abort();
        i2 = i5 + 12 | 0;
        if ((HEAP32[i2 >> 2] | 0) != (i1 | 0)) _abort();
        i3 = i4 + 8 | 0;
        if ((HEAP32[i3 >> 2] | 0) == (i1 | 0)) {
         HEAP32[i2 >> 2] = i4;
         HEAP32[i3 >> 2] = i5;
         i35 = i4;
         break;
        } else _abort();
       } while (0);
       if (!i7) break;
       i2 = HEAP32[i22 + (i15 + 28 + i10) >> 2] | 0;
       i3 = 2384 + (i2 << 2) | 0;
       do if ((i1 | 0) != (HEAP32[i3 >> 2] | 0)) {
        if (i7 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
        i2 = i7 + 16 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) HEAP32[i2 >> 2] = i35; else HEAP32[i7 + 20 >> 2] = i35;
        if (!i35) break L332;
       } else {
        HEAP32[i3 >> 2] = i35;
        if (i35) break;
        HEAP32[521] = HEAP32[521] & ~(1 << i2);
        break L332;
       } while (0);
       i3 = HEAP32[524] | 0;
       if (i35 >>> 0 < i3 >>> 0) _abort();
       HEAP32[i35 + 24 >> 2] = i7;
       i1 = i10 | 16;
       i2 = HEAP32[i22 + (i1 + i15) >> 2] | 0;
       do if (i2) if (i2 >>> 0 < i3 >>> 0) _abort(); else {
        HEAP32[i35 + 16 >> 2] = i2;
        HEAP32[i2 + 24 >> 2] = i35;
        break;
       } while (0);
       i1 = HEAP32[i22 + (i8 + i1) >> 2] | 0;
       if (!i1) break;
       if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
        HEAP32[i35 + 20 >> 2] = i1;
        HEAP32[i1 + 24 >> 2] = i35;
        break;
       }
      } else {
       i4 = HEAP32[i22 + ((i10 | 8) + i15) >> 2] | 0;
       i5 = HEAP32[i22 + (i15 + 12 + i10) >> 2] | 0;
       i3 = 2120 + (i6 << 1 << 2) | 0;
       do if ((i4 | 0) != (i3 | 0)) {
        if (i4 >>> 0 < i2 >>> 0) _abort();
        if ((HEAP32[i4 + 12 >> 2] | 0) == (i1 | 0)) break;
        _abort();
       } while (0);
       if ((i5 | 0) == (i4 | 0)) {
        HEAP32[520] = HEAP32[520] & ~(1 << i6);
        break;
       }
       do if ((i5 | 0) == (i3 | 0)) i31 = i5 + 8 | 0; else {
        if (i5 >>> 0 < i2 >>> 0) _abort();
        i2 = i5 + 8 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) {
         i31 = i2;
         break;
        }
        _abort();
       } while (0);
       HEAP32[i4 + 12 >> 2] = i5;
       HEAP32[i31 >> 2] = i4;
      } while (0);
      i1 = i22 + ((i9 | i10) + i15) | 0;
      i5 = i9 + i11 | 0;
     } else i5 = i11;
     i1 = i1 + 4 | 0;
     HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & -2;
     HEAP32[i22 + (i12 + 4) >> 2] = i5 | 1;
     HEAP32[i22 + (i5 + i12) >> 2] = i5;
     i1 = i5 >>> 3;
     if (i5 >>> 0 < 256) {
      i2 = i1 << 1;
      i4 = 2120 + (i2 << 2) | 0;
      i3 = HEAP32[520] | 0;
      i1 = 1 << i1;
      do if (!(i3 & i1)) {
       HEAP32[520] = i3 | i1;
       i36 = 2120 + (i2 + 2 << 2) | 0;
       i37 = i4;
      } else {
       i1 = 2120 + (i2 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 >= (HEAP32[524] | 0) >>> 0) {
        i36 = i1;
        i37 = i2;
        break;
       }
       _abort();
      } while (0);
      HEAP32[i36 >> 2] = i14;
      HEAP32[i37 + 12 >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i37;
      HEAP32[i22 + (i12 + 12) >> 2] = i4;
      break;
     }
     i1 = i5 >>> 8;
     do if (!i1) i4 = 0; else {
      if (i5 >>> 0 > 16777215) {
       i4 = 31;
       break;
      }
      i36 = (i1 + 1048320 | 0) >>> 16 & 8;
      i37 = i1 << i36;
      i35 = (i37 + 520192 | 0) >>> 16 & 4;
      i37 = i37 << i35;
      i4 = (i37 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i35 | i36 | i4) + (i37 << i4 >>> 15) | 0;
      i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } while (0);
     i1 = 2384 + (i4 << 2) | 0;
     HEAP32[i22 + (i12 + 28) >> 2] = i4;
     HEAP32[i22 + (i12 + 20) >> 2] = 0;
     HEAP32[i22 + (i12 + 16) >> 2] = 0;
     i2 = HEAP32[521] | 0;
     i3 = 1 << i4;
     if (!(i2 & i3)) {
      HEAP32[521] = i2 | i3;
      HEAP32[i1 >> 2] = i14;
      HEAP32[i22 + (i12 + 24) >> 2] = i1;
      HEAP32[i22 + (i12 + 12) >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i14;
      break;
     }
     i1 = HEAP32[i1 >> 2] | 0;
     L418 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
      i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if (!i3) break;
       if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
        i38 = i3;
        break L418;
       } else {
        i4 = i4 << 1;
        i1 = i3;
       }
      }
      if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
       HEAP32[i2 >> 2] = i14;
       HEAP32[i22 + (i12 + 24) >> 2] = i1;
       HEAP32[i22 + (i12 + 12) >> 2] = i14;
       HEAP32[i22 + (i12 + 8) >> 2] = i14;
       break L324;
      }
     } else i38 = i1; while (0);
     i1 = i38 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i37 = HEAP32[524] | 0;
     if (i2 >>> 0 >= i37 >>> 0 & i38 >>> 0 >= i37 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i14;
      HEAP32[i1 >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i2;
      HEAP32[i22 + (i12 + 12) >> 2] = i38;
      HEAP32[i22 + (i12 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i38 = (HEAP32[523] | 0) + i11 | 0;
     HEAP32[523] = i38;
     HEAP32[526] = i14;
     HEAP32[i22 + (i12 + 4) >> 2] = i38 | 1;
    } while (0);
    i38 = i22 + (i13 | 8) | 0;
    return i38 | 0;
   } else i3 = 2528;
   while (1) {
    i2 = HEAP32[i3 >> 2] | 0;
    if (i2 >>> 0 <= i7 >>> 0 ? (i1 = HEAP32[i3 + 4 >> 2] | 0, i4 = i2 + i1 | 0, i4 >>> 0 > i7 >>> 0) : 0) break;
    i3 = HEAP32[i3 + 8 >> 2] | 0;
   }
   i5 = i2 + (i1 + -39) | 0;
   i2 = i2 + (i1 + -47 + ((i5 & 7 | 0) == 0 ? 0 : 0 - i5 & 7)) | 0;
   i5 = i7 + 16 | 0;
   i2 = i2 >>> 0 < i5 >>> 0 ? i7 : i2;
   i1 = i2 + 8 | 0;
   i3 = i22 + 8 | 0;
   i3 = (i3 & 7 | 0) == 0 ? 0 : 0 - i3 & 7;
   i38 = i15 + -40 - i3 | 0;
   HEAP32[526] = i22 + i3;
   HEAP32[523] = i38;
   HEAP32[i22 + (i3 + 4) >> 2] = i38 | 1;
   HEAP32[i22 + (i15 + -36) >> 2] = 40;
   HEAP32[527] = HEAP32[642];
   i3 = i2 + 4 | 0;
   HEAP32[i3 >> 2] = 27;
   HEAP32[i1 >> 2] = HEAP32[632];
   HEAP32[i1 + 4 >> 2] = HEAP32[633];
   HEAP32[i1 + 8 >> 2] = HEAP32[634];
   HEAP32[i1 + 12 >> 2] = HEAP32[635];
   HEAP32[632] = i22;
   HEAP32[633] = i15;
   HEAP32[635] = 0;
   HEAP32[634] = i1;
   i1 = i2 + 28 | 0;
   HEAP32[i1 >> 2] = 7;
   if ((i2 + 32 | 0) >>> 0 < i4 >>> 0) do {
    i38 = i1;
    i1 = i1 + 4 | 0;
    HEAP32[i1 >> 2] = 7;
   } while ((i38 + 8 | 0) >>> 0 < i4 >>> 0);
   if ((i2 | 0) != (i7 | 0)) {
    i6 = i2 - i7 | 0;
    HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & -2;
    HEAP32[i7 + 4 >> 2] = i6 | 1;
    HEAP32[i2 >> 2] = i6;
    i1 = i6 >>> 3;
    if (i6 >>> 0 < 256) {
     i2 = i1 << 1;
     i4 = 2120 + (i2 << 2) | 0;
     i3 = HEAP32[520] | 0;
     i1 = 1 << i1;
     if (i3 & i1) {
      i1 = 2120 + (i2 + 2 << 2) | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
       i32 = i1;
       i33 = i2;
      }
     } else {
      HEAP32[520] = i3 | i1;
      i32 = 2120 + (i2 + 2 << 2) | 0;
      i33 = i4;
     }
     HEAP32[i32 >> 2] = i7;
     HEAP32[i33 + 12 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i33;
     HEAP32[i7 + 12 >> 2] = i4;
     break;
    }
    i1 = i6 >>> 8;
    if (i1) if (i6 >>> 0 > 16777215) i4 = 31; else {
     i37 = (i1 + 1048320 | 0) >>> 16 & 8;
     i38 = i1 << i37;
     i36 = (i38 + 520192 | 0) >>> 16 & 4;
     i38 = i38 << i36;
     i4 = (i38 + 245760 | 0) >>> 16 & 2;
     i4 = 14 - (i36 | i37 | i4) + (i38 << i4 >>> 15) | 0;
     i4 = i6 >>> (i4 + 7 | 0) & 1 | i4 << 1;
    } else i4 = 0;
    i3 = 2384 + (i4 << 2) | 0;
    HEAP32[i7 + 28 >> 2] = i4;
    HEAP32[i7 + 20 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    i1 = HEAP32[521] | 0;
    i2 = 1 << i4;
    if (!(i1 & i2)) {
     HEAP32[521] = i1 | i2;
     HEAP32[i3 >> 2] = i7;
     HEAP32[i7 + 24 >> 2] = i3;
     HEAP32[i7 + 12 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i7;
     break;
    }
    i1 = HEAP32[i3 >> 2] | 0;
    L459 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i6 | 0)) {
     i4 = i6 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
     while (1) {
      i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if (!i3) break;
      if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i6 | 0)) {
       i34 = i3;
       break L459;
      } else {
       i4 = i4 << 1;
       i1 = i3;
      }
     }
     if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i1;
      HEAP32[i7 + 12 >> 2] = i7;
      HEAP32[i7 + 8 >> 2] = i7;
      break L299;
     }
    } else i34 = i1; while (0);
    i1 = i34 + 8 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    i38 = HEAP32[524] | 0;
    if (i2 >>> 0 >= i38 >>> 0 & i34 >>> 0 >= i38 >>> 0) {
     HEAP32[i2 + 12 >> 2] = i7;
     HEAP32[i1 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i2;
     HEAP32[i7 + 12 >> 2] = i34;
     HEAP32[i7 + 24 >> 2] = 0;
     break;
    } else _abort();
   }
  } else {
   i38 = HEAP32[524] | 0;
   if ((i38 | 0) == 0 | i22 >>> 0 < i38 >>> 0) HEAP32[524] = i22;
   HEAP32[632] = i22;
   HEAP32[633] = i15;
   HEAP32[635] = 0;
   HEAP32[529] = HEAP32[638];
   HEAP32[528] = -1;
   i1 = 0;
   do {
    i38 = i1 << 1;
    i37 = 2120 + (i38 << 2) | 0;
    HEAP32[2120 + (i38 + 3 << 2) >> 2] = i37;
    HEAP32[2120 + (i38 + 2 << 2) >> 2] = i37;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != 32);
   i38 = i22 + 8 | 0;
   i38 = (i38 & 7 | 0) == 0 ? 0 : 0 - i38 & 7;
   i37 = i15 + -40 - i38 | 0;
   HEAP32[526] = i22 + i38;
   HEAP32[523] = i37;
   HEAP32[i22 + (i38 + 4) >> 2] = i37 | 1;
   HEAP32[i22 + (i15 + -36) >> 2] = 40;
   HEAP32[527] = HEAP32[642];
  } while (0);
  i1 = HEAP32[523] | 0;
  if (i1 >>> 0 > i16 >>> 0) {
   i37 = i1 - i16 | 0;
   HEAP32[523] = i37;
   i38 = HEAP32[526] | 0;
   HEAP32[526] = i38 + i16;
   HEAP32[i38 + (i16 + 4) >> 2] = i37 | 1;
   HEAP32[i38 + 4 >> 2] = i16 | 3;
   i38 = i38 + 8 | 0;
   return i38 | 0;
  }
 }
 HEAP32[(___errno_location() | 0) >> 2] = 12;
 i38 = 0;
 return i38 | 0;
}

function _printf_core(i49, i2, i50, i51, i52) {
 i49 = i49 | 0;
 i2 = i2 | 0;
 i50 = i50 | 0;
 i51 = i51 | 0;
 i52 = i52 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i53 = 0;
 i53 = STACKTOP;
 STACKTOP = STACKTOP + 624 | 0;
 i44 = i53 + 24 | 0;
 i46 = i53 + 16 | 0;
 i45 = i53 + 588 | 0;
 i39 = i53 + 576 | 0;
 i43 = i53;
 i36 = i53 + 536 | 0;
 i48 = i53 + 8 | 0;
 i47 = i53 + 528 | 0;
 i27 = (i49 | 0) != 0;
 i28 = i36 + 40 | 0;
 i35 = i28;
 i36 = i36 + 39 | 0;
 i37 = i48 + 4 | 0;
 i38 = i39 + 12 | 0;
 i39 = i39 + 11 | 0;
 i40 = i45;
 i41 = i38;
 i42 = i41 - i40 | 0;
 i29 = -2 - i40 | 0;
 i30 = i41 + 2 | 0;
 i31 = i44 + 288 | 0;
 i32 = i45 + 9 | 0;
 i33 = i32;
 i34 = i45 + 8 | 0;
 i1 = 0;
 i12 = i2;
 i3 = 0;
 i2 = 0;
 L1 : while (1) {
  do if ((i1 | 0) > -1) if ((i3 | 0) > (2147483647 - i1 | 0)) {
   HEAP32[(___errno_location() | 0) >> 2] = 75;
   i1 = -1;
   break;
  } else {
   i1 = i3 + i1 | 0;
   break;
  } while (0);
  i3 = HEAP8[i12 >> 0] | 0;
  if (!(i3 << 24 >> 24)) {
   i26 = 245;
   break;
  } else i4 = i12;
  L9 : while (1) {
   switch (i3 << 24 >> 24) {
   case 37:
    {
     i3 = i4;
     i26 = 9;
     break L9;
    }
   case 0:
    {
     i3 = i4;
     break L9;
    }
   default:
    {}
   }
   i25 = i4 + 1 | 0;
   i3 = HEAP8[i25 >> 0] | 0;
   i4 = i25;
  }
  L12 : do if ((i26 | 0) == 9) while (1) {
   i26 = 0;
   if ((HEAP8[i3 + 1 >> 0] | 0) != 37) break L12;
   i4 = i4 + 1 | 0;
   i3 = i3 + 2 | 0;
   if ((HEAP8[i3 >> 0] | 0) == 37) i26 = 9; else break;
  } while (0);
  i14 = i4 - i12 | 0;
  if (i27 ? (HEAP32[i49 >> 2] & 32 | 0) == 0 : 0) ___fwritex(i12, i14, i49) | 0;
  if ((i4 | 0) != (i12 | 0)) {
   i12 = i3;
   i3 = i14;
   continue;
  }
  i7 = i3 + 1 | 0;
  i4 = HEAP8[i7 >> 0] | 0;
  i5 = (i4 << 24 >> 24) + -48 | 0;
  if (i5 >>> 0 < 10) {
   i25 = (HEAP8[i3 + 2 >> 0] | 0) == 36;
   i7 = i25 ? i3 + 3 | 0 : i7;
   i4 = HEAP8[i7 >> 0] | 0;
   i10 = i25 ? i5 : -1;
   i2 = i25 ? 1 : i2;
  } else i10 = -1;
  i3 = i4 << 24 >> 24;
  L25 : do if ((i3 & -32 | 0) == 32) {
   i5 = 0;
   while (1) {
    if (!(1 << i3 + -32 & 75913)) {
     i8 = i5;
     i3 = i7;
     break L25;
    }
    i5 = 1 << (i4 << 24 >> 24) + -32 | i5;
    i7 = i7 + 1 | 0;
    i4 = HEAP8[i7 >> 0] | 0;
    i3 = i4 << 24 >> 24;
    if ((i3 & -32 | 0) != 32) {
     i8 = i5;
     i3 = i7;
     break;
    }
   }
  } else {
   i8 = 0;
   i3 = i7;
  } while (0);
  do if (i4 << 24 >> 24 == 42) {
   i5 = i3 + 1 | 0;
   i4 = (HEAP8[i5 >> 0] | 0) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i3 + 2 >> 0] | 0) == 36 : 0) {
    HEAP32[i52 + (i4 << 2) >> 2] = 10;
    i2 = 1;
    i3 = i3 + 3 | 0;
    i4 = HEAP32[i51 + ((HEAP8[i5 >> 0] | 0) + -48 << 3) >> 2] | 0;
   } else {
    if (i2) {
     i1 = -1;
     break L1;
    }
    if (!i27) {
     i13 = i8;
     i3 = i5;
     i2 = 0;
     i25 = 0;
     break;
    }
    i2 = (HEAP32[i50 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i4 = HEAP32[i2 >> 2] | 0;
    HEAP32[i50 >> 2] = i2 + 4;
    i2 = 0;
    i3 = i5;
   }
   if ((i4 | 0) < 0) {
    i13 = i8 | 8192;
    i25 = 0 - i4 | 0;
   } else {
    i13 = i8;
    i25 = i4;
   }
  } else {
   i5 = (i4 << 24 >> 24) + -48 | 0;
   if (i5 >>> 0 < 10) {
    i4 = 0;
    do {
     i4 = (i4 * 10 | 0) + i5 | 0;
     i3 = i3 + 1 | 0;
     i5 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
    } while (i5 >>> 0 < 10);
    if ((i4 | 0) < 0) {
     i1 = -1;
     break L1;
    } else {
     i13 = i8;
     i25 = i4;
    }
   } else {
    i13 = i8;
    i25 = 0;
   }
  } while (0);
  L46 : do if ((HEAP8[i3 >> 0] | 0) == 46) {
   i5 = i3 + 1 | 0;
   i4 = HEAP8[i5 >> 0] | 0;
   if (i4 << 24 >> 24 != 42) {
    i7 = (i4 << 24 >> 24) + -48 | 0;
    if (i7 >>> 0 < 10) {
     i3 = i5;
     i4 = 0;
    } else {
     i3 = i5;
     i7 = 0;
     break;
    }
    while (1) {
     i4 = (i4 * 10 | 0) + i7 | 0;
     i3 = i3 + 1 | 0;
     i7 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
     if (i7 >>> 0 >= 10) {
      i7 = i4;
      break L46;
     }
    }
   }
   i5 = i3 + 2 | 0;
   i4 = (HEAP8[i5 >> 0] | 0) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i3 + 3 >> 0] | 0) == 36 : 0) {
    HEAP32[i52 + (i4 << 2) >> 2] = 10;
    i3 = i3 + 4 | 0;
    i7 = HEAP32[i51 + ((HEAP8[i5 >> 0] | 0) + -48 << 3) >> 2] | 0;
    break;
   }
   if (i2) {
    i1 = -1;
    break L1;
   }
   if (i27) {
    i3 = (HEAP32[i50 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i7 = HEAP32[i3 >> 2] | 0;
    HEAP32[i50 >> 2] = i3 + 4;
    i3 = i5;
   } else {
    i3 = i5;
    i7 = 0;
   }
  } else i7 = -1; while (0);
  i9 = 0;
  while (1) {
   i4 = (HEAP8[i3 >> 0] | 0) + -65 | 0;
   if (i4 >>> 0 > 57) {
    i1 = -1;
    break L1;
   }
   i5 = i3 + 1 | 0;
   i4 = HEAP8[13452 + (i9 * 58 | 0) + i4 >> 0] | 0;
   i8 = i4 & 255;
   if ((i8 + -1 | 0) >>> 0 < 8) {
    i3 = i5;
    i9 = i8;
   } else {
    i24 = i5;
    break;
   }
  }
  if (!(i4 << 24 >> 24)) {
   i1 = -1;
   break;
  }
  i5 = (i10 | 0) > -1;
  do if (i4 << 24 >> 24 == 19) if (i5) {
   i1 = -1;
   break L1;
  } else i26 = 52; else {
   if (i5) {
    HEAP32[i52 + (i10 << 2) >> 2] = i8;
    i22 = i51 + (i10 << 3) | 0;
    i23 = HEAP32[i22 + 4 >> 2] | 0;
    i26 = i43;
    HEAP32[i26 >> 2] = HEAP32[i22 >> 2];
    HEAP32[i26 + 4 >> 2] = i23;
    i26 = 52;
    break;
   }
   if (!i27) {
    i1 = 0;
    break L1;
   }
   _pop_arg(i43, i8, i50);
  } while (0);
  if ((i26 | 0) == 52 ? (i26 = 0, !i27) : 0) {
   i12 = i24;
   i3 = i14;
   continue;
  }
  i10 = HEAP8[i3 >> 0] | 0;
  i10 = (i9 | 0) != 0 & (i10 & 15 | 0) == 3 ? i10 & -33 : i10;
  i5 = i13 & -65537;
  i23 = (i13 & 8192 | 0) == 0 ? i13 : i5;
  L75 : do switch (i10 | 0) {
  case 110:
   switch (i9 | 0) {
   case 0:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 1:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 2:
    {
     i12 = HEAP32[i43 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 3:
    {
     HEAP16[HEAP32[i43 >> 2] >> 1] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 4:
    {
     HEAP8[HEAP32[i43 >> 2] >> 0] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 6:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 7:
    {
     i12 = HEAP32[i43 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   default:
    {
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   }
  case 112:
   {
    i9 = i23 | 8;
    i7 = i7 >>> 0 > 8 ? i7 : 8;
    i10 = 120;
    i26 = 64;
    break;
   }
  case 88:
  case 120:
   {
    i9 = i23;
    i26 = 64;
    break;
   }
  case 111:
   {
    i5 = i43;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if ((i4 | 0) == 0 & (i5 | 0) == 0) i3 = i28; else {
     i3 = i28;
     do {
      i3 = i3 + -1 | 0;
      HEAP8[i3 >> 0] = i4 & 7 | 48;
      i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 3) | 0;
      i5 = tempRet0;
     } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    }
    if (!(i23 & 8)) {
     i4 = i23;
     i9 = 0;
     i8 = 13932;
     i26 = 77;
    } else {
     i9 = i35 - i3 + 1 | 0;
     i4 = i23;
     i7 = (i7 | 0) < (i9 | 0) ? i9 : i7;
     i9 = 0;
     i8 = 13932;
     i26 = 77;
    }
    break;
   }
  case 105:
  case 100:
   {
    i4 = i43;
    i3 = HEAP32[i4 >> 2] | 0;
    i4 = HEAP32[i4 + 4 >> 2] | 0;
    if ((i4 | 0) < 0) {
     i3 = _i64Subtract(0, 0, i3 | 0, i4 | 0) | 0;
     i4 = tempRet0;
     i5 = i43;
     HEAP32[i5 >> 2] = i3;
     HEAP32[i5 + 4 >> 2] = i4;
     i5 = 1;
     i8 = 13932;
     i26 = 76;
     break L75;
    }
    if (!(i23 & 2048)) {
     i8 = i23 & 1;
     i5 = i8;
     i8 = (i8 | 0) == 0 ? 13932 : 13934;
     i26 = 76;
    } else {
     i5 = 1;
     i8 = 13933;
     i26 = 76;
    }
    break;
   }
  case 117:
   {
    i4 = i43;
    i3 = HEAP32[i4 >> 2] | 0;
    i4 = HEAP32[i4 + 4 >> 2] | 0;
    i5 = 0;
    i8 = 13932;
    i26 = 76;
    break;
   }
  case 99:
   {
    HEAP8[i36 >> 0] = HEAP32[i43 >> 2];
    i12 = i36;
    i4 = 1;
    i9 = 0;
    i10 = 13932;
    i3 = i28;
    break;
   }
  case 109:
   {
    i3 = _strerror(HEAP32[(___errno_location() | 0) >> 2] | 0) | 0;
    i26 = 82;
    break;
   }
  case 115:
   {
    i3 = HEAP32[i43 >> 2] | 0;
    i3 = (i3 | 0) != 0 ? i3 : 13942;
    i26 = 82;
    break;
   }
  case 67:
   {
    HEAP32[i48 >> 2] = HEAP32[i43 >> 2];
    HEAP32[i37 >> 2] = 0;
    HEAP32[i43 >> 2] = i48;
    i7 = -1;
    i26 = 86;
    break;
   }
  case 83:
   {
    if (!i7) {
     _pad(i49, 32, i25, 0, i23);
     i3 = 0;
     i26 = 98;
    } else i26 = 86;
    break;
   }
  case 65:
  case 71:
  case 70:
  case 69:
  case 97:
  case 103:
  case 102:
  case 101:
   {
    d6 = +HEAPF64[i43 >> 3];
    HEAP32[i46 >> 2] = 0;
    HEAPF64[tempDoublePtr >> 3] = d6;
    if ((HEAP32[tempDoublePtr + 4 >> 2] | 0) >= 0) if (!(i23 & 2048)) {
     i22 = i23 & 1;
     i21 = i22;
     i22 = (i22 | 0) == 0 ? 13950 : 13955;
    } else {
     i21 = 1;
     i22 = 13952;
    } else {
     d6 = -d6;
     i21 = 1;
     i22 = 13949;
    }
    HEAPF64[tempDoublePtr >> 3] = d6;
    i20 = HEAP32[tempDoublePtr + 4 >> 2] & 2146435072;
    do if (i20 >>> 0 < 2146435072 | (i20 | 0) == 2146435072 & 0 < 0) {
     d11 = +_frexpl(d6, i46) * 2.0;
     i4 = d11 != 0.0;
     if (i4) HEAP32[i46 >> 2] = (HEAP32[i46 >> 2] | 0) + -1;
     i18 = i10 | 32;
     if ((i18 | 0) == 97) {
      i12 = i10 & 32;
      i14 = (i12 | 0) == 0 ? i22 : i22 + 9 | 0;
      i13 = i21 | 2;
      i3 = 12 - i7 | 0;
      do if (!(i7 >>> 0 > 11 | (i3 | 0) == 0)) {
       d6 = 8.0;
       do {
        i3 = i3 + -1 | 0;
        d6 = d6 * 16.0;
       } while ((i3 | 0) != 0);
       if ((HEAP8[i14 >> 0] | 0) == 45) {
        d6 = -(d6 + (-d11 - d6));
        break;
       } else {
        d6 = d11 + d6 - d6;
        break;
       }
      } else d6 = d11; while (0);
      i4 = HEAP32[i46 >> 2] | 0;
      i3 = (i4 | 0) < 0 ? 0 - i4 | 0 : i4;
      i3 = _fmt_u(i3, ((i3 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i3 | 0) == (i38 | 0)) {
       HEAP8[i39 >> 0] = 48;
       i3 = i39;
      }
      HEAP8[i3 + -1 >> 0] = (i4 >> 31 & 2) + 43;
      i9 = i3 + -2 | 0;
      HEAP8[i9 >> 0] = i10 + 15;
      i8 = (i7 | 0) < 1;
      i5 = (i23 & 8 | 0) == 0;
      i4 = i45;
      while (1) {
       i22 = ~~d6;
       i3 = i4 + 1 | 0;
       HEAP8[i4 >> 0] = HEAPU8[13916 + i22 >> 0] | i12;
       d6 = (d6 - +(i22 | 0)) * 16.0;
       do if ((i3 - i40 | 0) == 1) {
        if (i5 & (i8 & d6 == 0.0)) break;
        HEAP8[i3 >> 0] = 46;
        i3 = i4 + 2 | 0;
       } while (0);
       if (!(d6 != 0.0)) break; else i4 = i3;
      }
      i7 = (i7 | 0) != 0 & (i29 + i3 | 0) < (i7 | 0) ? i30 + i7 - i9 | 0 : i42 - i9 + i3 | 0;
      i5 = i7 + i13 | 0;
      _pad(i49, 32, i25, i5, i23);
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i14, i13, i49) | 0;
      _pad(i49, 48, i25, i5, i23 ^ 65536);
      i3 = i3 - i40 | 0;
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i45, i3, i49) | 0;
      i4 = i41 - i9 | 0;
      _pad(i49, 48, i7 - (i3 + i4) | 0, 0, 0);
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i9, i4, i49) | 0;
      _pad(i49, 32, i25, i5, i23 ^ 8192);
      i3 = (i5 | 0) < (i25 | 0) ? i25 : i5;
      break;
     }
     i3 = (i7 | 0) < 0 ? 6 : i7;
     if (i4) {
      i4 = (HEAP32[i46 >> 2] | 0) + -28 | 0;
      HEAP32[i46 >> 2] = i4;
      d6 = d11 * 268435456.0;
     } else {
      d6 = d11;
      i4 = HEAP32[i46 >> 2] | 0;
     }
     i20 = (i4 | 0) < 0 ? i44 : i31;
     i19 = i20;
     i4 = i20;
     do {
      i17 = ~~d6 >>> 0;
      HEAP32[i4 >> 2] = i17;
      i4 = i4 + 4 | 0;
      d6 = (d6 - +(i17 >>> 0)) * 1.0e9;
     } while (d6 != 0.0);
     i5 = i4;
     i4 = HEAP32[i46 >> 2] | 0;
     if ((i4 | 0) > 0) {
      i8 = i20;
      while (1) {
       i9 = (i4 | 0) > 29 ? 29 : i4;
       i7 = i5 + -4 | 0;
       do if (i7 >>> 0 < i8 >>> 0) i7 = i8; else {
        i4 = 0;
        do {
         i17 = _bitshift64Shl(HEAP32[i7 >> 2] | 0, 0, i9 | 0) | 0;
         i17 = _i64Add(i17 | 0, tempRet0 | 0, i4 | 0, 0) | 0;
         i4 = tempRet0;
         i16 = ___uremdi3(i17 | 0, i4 | 0, 1e9, 0) | 0;
         HEAP32[i7 >> 2] = i16;
         i4 = ___udivdi3(i17 | 0, i4 | 0, 1e9, 0) | 0;
         i7 = i7 + -4 | 0;
        } while (i7 >>> 0 >= i8 >>> 0);
        if (!i4) {
         i7 = i8;
         break;
        }
        i7 = i8 + -4 | 0;
        HEAP32[i7 >> 2] = i4;
       } while (0);
       while (1) {
        if (i5 >>> 0 <= i7 >>> 0) break;
        i4 = i5 + -4 | 0;
        if (!(HEAP32[i4 >> 2] | 0)) i5 = i4; else break;
       }
       i4 = (HEAP32[i46 >> 2] | 0) - i9 | 0;
       HEAP32[i46 >> 2] = i4;
       if ((i4 | 0) > 0) i8 = i7; else break;
      }
     } else i7 = i20;
     if ((i4 | 0) < 0) {
      i14 = ((i3 + 25 | 0) / 9 | 0) + 1 | 0;
      i15 = (i18 | 0) == 102;
      i12 = i7;
      while (1) {
       i13 = 0 - i4 | 0;
       i13 = (i13 | 0) > 9 ? 9 : i13;
       do if (i12 >>> 0 < i5 >>> 0) {
        i4 = (1 << i13) + -1 | 0;
        i8 = 1e9 >>> i13;
        i7 = 0;
        i9 = i12;
        do {
         i17 = HEAP32[i9 >> 2] | 0;
         HEAP32[i9 >> 2] = (i17 >>> i13) + i7;
         i7 = Math_imul(i17 & i4, i8) | 0;
         i9 = i9 + 4 | 0;
        } while (i9 >>> 0 < i5 >>> 0);
        i4 = (HEAP32[i12 >> 2] | 0) == 0 ? i12 + 4 | 0 : i12;
        if (!i7) {
         i7 = i4;
         break;
        }
        HEAP32[i5 >> 2] = i7;
        i7 = i4;
        i5 = i5 + 4 | 0;
       } else i7 = (HEAP32[i12 >> 2] | 0) == 0 ? i12 + 4 | 0 : i12; while (0);
       i4 = i15 ? i20 : i7;
       i5 = (i5 - i4 >> 2 | 0) > (i14 | 0) ? i4 + (i14 << 2) | 0 : i5;
       i4 = (HEAP32[i46 >> 2] | 0) + i13 | 0;
       HEAP32[i46 >> 2] = i4;
       if ((i4 | 0) >= 0) {
        i12 = i7;
        break;
       } else i12 = i7;
      }
     } else i12 = i7;
     do if (i12 >>> 0 < i5 >>> 0) {
      i4 = (i19 - i12 >> 2) * 9 | 0;
      i8 = HEAP32[i12 >> 2] | 0;
      if (i8 >>> 0 < 10) break; else i7 = 10;
      do {
       i7 = i7 * 10 | 0;
       i4 = i4 + 1 | 0;
      } while (i8 >>> 0 >= i7 >>> 0);
     } else i4 = 0; while (0);
     i16 = (i18 | 0) == 103;
     i17 = (i3 | 0) != 0;
     i7 = i3 - ((i18 | 0) != 102 ? i4 : 0) + ((i17 & i16) << 31 >> 31) | 0;
     if ((i7 | 0) < (((i5 - i19 >> 2) * 9 | 0) + -9 | 0)) {
      i9 = i7 + 9216 | 0;
      i15 = (i9 | 0) / 9 | 0;
      i7 = i20 + (i15 + -1023 << 2) | 0;
      i9 = ((i9 | 0) % 9 | 0) + 1 | 0;
      if ((i9 | 0) < 9) {
       i8 = 10;
       do {
        i8 = i8 * 10 | 0;
        i9 = i9 + 1 | 0;
       } while ((i9 | 0) != 9);
      } else i8 = 10;
      i13 = HEAP32[i7 >> 2] | 0;
      i14 = (i13 >>> 0) % (i8 >>> 0) | 0;
      if ((i14 | 0) == 0 ? (i20 + (i15 + -1022 << 2) | 0) == (i5 | 0) : 0) i8 = i12; else i26 = 163;
      do if ((i26 | 0) == 163) {
       i26 = 0;
       d11 = (((i13 >>> 0) / (i8 >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
       i9 = (i8 | 0) / 2 | 0;
       do if (i14 >>> 0 < i9 >>> 0) d6 = .5; else {
        if ((i14 | 0) == (i9 | 0) ? (i20 + (i15 + -1022 << 2) | 0) == (i5 | 0) : 0) {
         d6 = 1.0;
         break;
        }
        d6 = 1.5;
       } while (0);
       do if (i21) {
        if ((HEAP8[i22 >> 0] | 0) != 45) break;
        d11 = -d11;
        d6 = -d6;
       } while (0);
       i9 = i13 - i14 | 0;
       HEAP32[i7 >> 2] = i9;
       if (!(d11 + d6 != d11)) {
        i8 = i12;
        break;
       }
       i18 = i9 + i8 | 0;
       HEAP32[i7 >> 2] = i18;
       if (i18 >>> 0 > 999999999) {
        i4 = i12;
        while (1) {
         i8 = i7 + -4 | 0;
         HEAP32[i7 >> 2] = 0;
         if (i8 >>> 0 < i4 >>> 0) {
          i4 = i4 + -4 | 0;
          HEAP32[i4 >> 2] = 0;
         }
         i18 = (HEAP32[i8 >> 2] | 0) + 1 | 0;
         HEAP32[i8 >> 2] = i18;
         if (i18 >>> 0 > 999999999) i7 = i8; else {
          i12 = i4;
          i7 = i8;
          break;
         }
        }
       }
       i4 = (i19 - i12 >> 2) * 9 | 0;
       i9 = HEAP32[i12 >> 2] | 0;
       if (i9 >>> 0 < 10) {
        i8 = i12;
        break;
       } else i8 = 10;
       do {
        i8 = i8 * 10 | 0;
        i4 = i4 + 1 | 0;
       } while (i9 >>> 0 >= i8 >>> 0);
       i8 = i12;
      } while (0);
      i18 = i7 + 4 | 0;
      i12 = i8;
      i5 = i5 >>> 0 > i18 >>> 0 ? i18 : i5;
     }
     i14 = 0 - i4 | 0;
     while (1) {
      if (i5 >>> 0 <= i12 >>> 0) {
       i15 = 0;
       i18 = i5;
       break;
      }
      i7 = i5 + -4 | 0;
      if (!(HEAP32[i7 >> 2] | 0)) i5 = i7; else {
       i15 = 1;
       i18 = i5;
       break;
      }
     }
     do if (i16) {
      i3 = (i17 & 1 ^ 1) + i3 | 0;
      if ((i3 | 0) > (i4 | 0) & (i4 | 0) > -5) {
       i10 = i10 + -1 | 0;
       i3 = i3 + -1 - i4 | 0;
      } else {
       i10 = i10 + -2 | 0;
       i3 = i3 + -1 | 0;
      }
      i5 = i23 & 8;
      if (i5) break;
      do if (i15) {
       i5 = HEAP32[i18 + -4 >> 2] | 0;
       if (!i5) {
        i7 = 9;
        break;
       }
       if (!((i5 >>> 0) % 10 | 0)) {
        i8 = 10;
        i7 = 0;
       } else {
        i7 = 0;
        break;
       }
       do {
        i8 = i8 * 10 | 0;
        i7 = i7 + 1 | 0;
       } while (((i5 >>> 0) % (i8 >>> 0) | 0 | 0) == 0);
      } else i7 = 9; while (0);
      i5 = ((i18 - i19 >> 2) * 9 | 0) + -9 | 0;
      if ((i10 | 32 | 0) == 102) {
       i5 = i5 - i7 | 0;
       i5 = (i5 | 0) < 0 ? 0 : i5;
       i3 = (i3 | 0) < (i5 | 0) ? i3 : i5;
       i5 = 0;
       break;
      } else {
       i5 = i5 + i4 - i7 | 0;
       i5 = (i5 | 0) < 0 ? 0 : i5;
       i3 = (i3 | 0) < (i5 | 0) ? i3 : i5;
       i5 = 0;
       break;
      }
     } else i5 = i23 & 8; while (0);
     i13 = i3 | i5;
     i8 = (i13 | 0) != 0 & 1;
     i9 = (i10 | 32 | 0) == 102;
     if (i9) {
      i4 = (i4 | 0) > 0 ? i4 : 0;
      i10 = 0;
     } else {
      i7 = (i4 | 0) < 0 ? i14 : i4;
      i7 = _fmt_u(i7, ((i7 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i41 - i7 | 0) < 2) do {
       i7 = i7 + -1 | 0;
       HEAP8[i7 >> 0] = 48;
      } while ((i41 - i7 | 0) < 2);
      HEAP8[i7 + -1 >> 0] = (i4 >> 31 & 2) + 43;
      i19 = i7 + -2 | 0;
      HEAP8[i19 >> 0] = i10;
      i4 = i41 - i19 | 0;
      i10 = i19;
     }
     i14 = i21 + 1 + i3 + i8 + i4 | 0;
     _pad(i49, 32, i25, i14, i23);
     if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i22, i21, i49) | 0;
     _pad(i49, 48, i25, i14, i23 ^ 65536);
     do if (i9) {
      i7 = i12 >>> 0 > i20 >>> 0 ? i20 : i12;
      i4 = i7;
      do {
       i5 = _fmt_u(HEAP32[i4 >> 2] | 0, 0, i32) | 0;
       do if ((i4 | 0) == (i7 | 0)) {
        if ((i5 | 0) != (i32 | 0)) break;
        HEAP8[i34 >> 0] = 48;
        i5 = i34;
       } else {
        if (i5 >>> 0 <= i45 >>> 0) break;
        do {
         i5 = i5 + -1 | 0;
         HEAP8[i5 >> 0] = 48;
        } while (i5 >>> 0 > i45 >>> 0);
       } while (0);
       if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i5, i33 - i5 | 0, i49) | 0;
       i4 = i4 + 4 | 0;
      } while (i4 >>> 0 <= i20 >>> 0);
      do if (i13) {
       if (HEAP32[i49 >> 2] & 32) break;
       ___fwritex(13984, 1, i49) | 0;
      } while (0);
      if ((i3 | 0) > 0 & i4 >>> 0 < i18 >>> 0) {
       i5 = i4;
       while (1) {
        i4 = _fmt_u(HEAP32[i5 >> 2] | 0, 0, i32) | 0;
        if (i4 >>> 0 > i45 >>> 0) do {
         i4 = i4 + -1 | 0;
         HEAP8[i4 >> 0] = 48;
        } while (i4 >>> 0 > i45 >>> 0);
        if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, (i3 | 0) > 9 ? 9 : i3, i49) | 0;
        i5 = i5 + 4 | 0;
        i4 = i3 + -9 | 0;
        if (!((i3 | 0) > 9 & i5 >>> 0 < i18 >>> 0)) {
         i3 = i4;
         break;
        } else i3 = i4;
       }
      }
      _pad(i49, 48, i3 + 9 | 0, 9, 0);
     } else {
      i9 = i15 ? i18 : i12 + 4 | 0;
      if ((i3 | 0) > -1) {
       i8 = (i5 | 0) == 0;
       i7 = i12;
       do {
        i4 = _fmt_u(HEAP32[i7 >> 2] | 0, 0, i32) | 0;
        if ((i4 | 0) == (i32 | 0)) {
         HEAP8[i34 >> 0] = 48;
         i4 = i34;
        }
        do if ((i7 | 0) == (i12 | 0)) {
         i5 = i4 + 1 | 0;
         if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, 1, i49) | 0;
         if (i8 & (i3 | 0) < 1) {
          i4 = i5;
          break;
         }
         if (HEAP32[i49 >> 2] & 32) {
          i4 = i5;
          break;
         }
         ___fwritex(13984, 1, i49) | 0;
         i4 = i5;
        } else {
         if (i4 >>> 0 <= i45 >>> 0) break;
         do {
          i4 = i4 + -1 | 0;
          HEAP8[i4 >> 0] = 48;
         } while (i4 >>> 0 > i45 >>> 0);
        } while (0);
        i5 = i33 - i4 | 0;
        if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, (i3 | 0) > (i5 | 0) ? i5 : i3, i49) | 0;
        i3 = i3 - i5 | 0;
        i7 = i7 + 4 | 0;
       } while (i7 >>> 0 < i9 >>> 0 & (i3 | 0) > -1);
      }
      _pad(i49, 48, i3 + 18 | 0, 18, 0);
      if (HEAP32[i49 >> 2] & 32) break;
      ___fwritex(i10, i41 - i10 | 0, i49) | 0;
     } while (0);
     _pad(i49, 32, i25, i14, i23 ^ 8192);
     i3 = (i14 | 0) < (i25 | 0) ? i25 : i14;
    } else {
     i9 = (i10 & 32 | 0) != 0;
     i8 = d6 != d6 | 0.0 != 0.0;
     i4 = i8 ? 0 : i21;
     i7 = i4 + 3 | 0;
     _pad(i49, 32, i25, i7, i5);
     i3 = HEAP32[i49 >> 2] | 0;
     if (!(i3 & 32)) {
      ___fwritex(i22, i4, i49) | 0;
      i3 = HEAP32[i49 >> 2] | 0;
     }
     if (!(i3 & 32)) ___fwritex(i8 ? (i9 ? 13976 : 13980) : i9 ? 13968 : 13972, 3, i49) | 0;
     _pad(i49, 32, i25, i7, i23 ^ 8192);
     i3 = (i7 | 0) < (i25 | 0) ? i25 : i7;
    } while (0);
    i12 = i24;
    continue L1;
   }
  default:
   {
    i5 = i23;
    i4 = i7;
    i9 = 0;
    i10 = 13932;
    i3 = i28;
   }
  } while (0);
  L313 : do if ((i26 | 0) == 64) {
   i5 = i43;
   i4 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[i5 + 4 >> 2] | 0;
   i8 = i10 & 32;
   if (!((i4 | 0) == 0 & (i5 | 0) == 0)) {
    i3 = i28;
    do {
     i3 = i3 + -1 | 0;
     HEAP8[i3 >> 0] = HEAPU8[13916 + (i4 & 15) >> 0] | i8;
     i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 4) | 0;
     i5 = tempRet0;
    } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    i26 = i43;
    if ((i9 & 8 | 0) == 0 | (HEAP32[i26 >> 2] | 0) == 0 & (HEAP32[i26 + 4 >> 2] | 0) == 0) {
     i4 = i9;
     i9 = 0;
     i8 = 13932;
     i26 = 77;
    } else {
     i4 = i9;
     i9 = 2;
     i8 = 13932 + (i10 >> 4) | 0;
     i26 = 77;
    }
   } else {
    i3 = i28;
    i4 = i9;
    i9 = 0;
    i8 = 13932;
    i26 = 77;
   }
  } else if ((i26 | 0) == 76) {
   i3 = _fmt_u(i3, i4, i28) | 0;
   i4 = i23;
   i9 = i5;
   i26 = 77;
  } else if ((i26 | 0) == 82) {
   i26 = 0;
   i23 = _memchr(i3, 0, i7) | 0;
   i22 = (i23 | 0) == 0;
   i12 = i3;
   i4 = i22 ? i7 : i23 - i3 | 0;
   i9 = 0;
   i10 = 13932;
   i3 = i22 ? i3 + i7 | 0 : i23;
  } else if ((i26 | 0) == 86) {
   i26 = 0;
   i4 = 0;
   i3 = 0;
   i8 = HEAP32[i43 >> 2] | 0;
   while (1) {
    i5 = HEAP32[i8 >> 2] | 0;
    if (!i5) break;
    i3 = _wctomb(i47, i5) | 0;
    if ((i3 | 0) < 0 | i3 >>> 0 > (i7 - i4 | 0) >>> 0) break;
    i4 = i3 + i4 | 0;
    if (i7 >>> 0 > i4 >>> 0) i8 = i8 + 4 | 0; else break;
   }
   if ((i3 | 0) < 0) {
    i1 = -1;
    break L1;
   }
   _pad(i49, 32, i25, i4, i23);
   if (!i4) {
    i3 = 0;
    i26 = 98;
   } else {
    i5 = 0;
    i7 = HEAP32[i43 >> 2] | 0;
    while (1) {
     i3 = HEAP32[i7 >> 2] | 0;
     if (!i3) {
      i3 = i4;
      i26 = 98;
      break L313;
     }
     i3 = _wctomb(i47, i3) | 0;
     i5 = i3 + i5 | 0;
     if ((i5 | 0) > (i4 | 0)) {
      i3 = i4;
      i26 = 98;
      break L313;
     }
     if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i47, i3, i49) | 0;
     if (i5 >>> 0 >= i4 >>> 0) {
      i3 = i4;
      i26 = 98;
      break;
     } else i7 = i7 + 4 | 0;
    }
   }
  } while (0);
  if ((i26 | 0) == 98) {
   i26 = 0;
   _pad(i49, 32, i25, i3, i23 ^ 8192);
   i12 = i24;
   i3 = (i25 | 0) > (i3 | 0) ? i25 : i3;
   continue;
  }
  if ((i26 | 0) == 77) {
   i26 = 0;
   i5 = (i7 | 0) > -1 ? i4 & -65537 : i4;
   i4 = i43;
   i4 = (HEAP32[i4 >> 2] | 0) != 0 | (HEAP32[i4 + 4 >> 2] | 0) != 0;
   if ((i7 | 0) != 0 | i4) {
    i4 = (i4 & 1 ^ 1) + (i35 - i3) | 0;
    i12 = i3;
    i4 = (i7 | 0) > (i4 | 0) ? i7 : i4;
    i10 = i8;
    i3 = i28;
   } else {
    i12 = i28;
    i4 = 0;
    i10 = i8;
    i3 = i28;
   }
  }
  i8 = i3 - i12 | 0;
  i4 = (i4 | 0) < (i8 | 0) ? i8 : i4;
  i7 = i9 + i4 | 0;
  i3 = (i25 | 0) < (i7 | 0) ? i7 : i25;
  _pad(i49, 32, i3, i7, i5);
  if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i10, i9, i49) | 0;
  _pad(i49, 48, i3, i7, i5 ^ 65536);
  _pad(i49, 48, i4, i8, 0);
  if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i12, i8, i49) | 0;
  _pad(i49, 32, i3, i7, i5 ^ 8192);
  i12 = i24;
 }
 L348 : do if ((i26 | 0) == 245) if (!i49) if (i2) {
  i1 = 1;
  while (1) {
   i2 = HEAP32[i52 + (i1 << 2) >> 2] | 0;
   if (!i2) break;
   _pop_arg(i51 + (i1 << 3) | 0, i2, i50);
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break L348;
   }
  }
  if ((i1 | 0) < 10) while (1) {
   if (HEAP32[i52 + (i1 << 2) >> 2] | 0) {
    i1 = -1;
    break L348;
   }
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break;
   }
  } else i1 = 1;
 } else i1 = 0; while (0);
 STACKTOP = i53;
 return i1 | 0;
}
function __ZN7b2World8SolveTOIERK10b2TimeStep(i3, i70) {
 i3 = i3 | 0;
 i70 = i70 | 0;
 var i1 = 0, i2 = 0, d4 = 0.0, d5 = 0.0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, d27 = 0.0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, d76 = 0.0, d77 = 0.0, d78 = 0.0;
 i75 = STACKTOP;
 STACKTOP = STACKTOP + 304 | 0;
 i72 = i75;
 i74 = i75 + 248 | 0;
 i69 = i75 + 240 | 0;
 i65 = i75 + 204 | 0;
 i66 = i75 + 168 | 0;
 i67 = i75 + 160 | 0;
 i71 = i75 + 136 | 0;
 i63 = i3 + 102876 | 0;
 i64 = i3 + 102948 | 0;
 __ZN8b2IslandC2EiiiP16b2StackAllocatorP17b2ContactListener(i74, 64, 32, 0, i3 + 72 | 0, HEAP32[i64 >> 2] | 0);
 i73 = i3 + 102999 | 0;
 if (HEAP8[i73 >> 0] | 0) {
  i1 = HEAP32[i3 + 102956 >> 2] | 0;
  if (i1) do {
   i62 = i1 + 4 | 0;
   HEAP16[i62 >> 1] = HEAPU16[i62 >> 1] & 65534;
   HEAPF32[i1 + 60 >> 2] = 0.0;
   i1 = HEAP32[i1 + 96 >> 2] | 0;
  } while ((i1 | 0) != 0);
  i2 = i3 + 102936 | 0;
  i1 = HEAP32[i2 >> 2] | 0;
  if (i1) do {
   i62 = i1 + 4 | 0;
   HEAP32[i62 >> 2] = HEAP32[i62 >> 2] & -34;
   HEAP32[i1 + 128 >> 2] = 0;
   HEAPF32[i1 + 132 >> 2] = 1.0;
   i1 = HEAP32[i1 + 12 >> 2] | 0;
  } while ((i1 | 0) != 0);
 } else i2 = i3 + 102936 | 0;
 i49 = i74 + 28 | 0;
 i50 = i74 + 36 | 0;
 i51 = i74 + 32 | 0;
 i52 = i74 + 40 | 0;
 i53 = i74 + 8 | 0;
 i54 = i74 + 44 | 0;
 i55 = i74 + 12 | 0;
 i56 = i67 + 4 | 0;
 i57 = i71 + 4 | 0;
 i58 = i71 + 8 | 0;
 i59 = i71 + 16 | 0;
 i60 = i70 + 12 | 0;
 i61 = i71 + 12 | 0;
 i62 = i71 + 20 | 0;
 i32 = i3 + 102998 | 0;
 i33 = i72 + 8 | 0;
 i34 = i72 + 12 | 0;
 i35 = i72 + 4 | 0;
 i36 = i72 + 16 | 0;
 i37 = i72 + 20 | 0;
 i38 = i72 + 24 | 0;
 i39 = i72 + 44 | 0;
 i40 = i72 + 48 | 0;
 i41 = i72 + 52 | 0;
 i42 = i72 + 28 | 0;
 i43 = i72 + 56 | 0;
 i44 = i72 + 92 | 0;
 i45 = i72 + 128 | 0;
 i46 = i69 + 4 | 0;
 i47 = i72 + 36 | 0;
 i48 = i72 + 8 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 L11 : do if (i1) {
  d27 = 1.0;
  i16 = 0;
  L12 : while (1) {
   i15 = i1 + 4 | 0;
   i3 = HEAP32[i15 >> 2] | 0;
   do if ((i3 & 4 | 0) != 0 ? (HEAP32[i1 + 128 >> 2] | 0) <= 8 : 0) {
    if (!(i3 & 32)) {
     i11 = HEAP32[i1 + 48 >> 2] | 0;
     i12 = HEAP32[i1 + 52 >> 2] | 0;
     if (HEAP8[i11 + 38 >> 0] | 0) {
      d4 = d27;
      i30 = i16;
      break;
     }
     if (HEAP8[i12 + 38 >> 0] | 0) {
      d4 = d27;
      i30 = i16;
      break;
     }
     i9 = HEAP32[i11 + 8 >> 2] | 0;
     i10 = HEAP32[i12 + 8 >> 2] | 0;
     i3 = HEAP32[i9 >> 2] | 0;
     i6 = HEAP32[i10 >> 2] | 0;
     if (!((i3 | 0) == 2 | (i6 | 0) == 2)) {
      i1 = 15;
      break L12;
     }
     i7 = HEAP16[i9 + 4 >> 1] | 0;
     i8 = HEAP16[i10 + 4 >> 1] | 0;
     if (!((i3 | 0) != 0 & (i7 & 2) != 0 | (i6 | 0) != 0 & (i8 & 2) != 0)) {
      d4 = d27;
      i30 = i16;
      break;
     }
     if (!((i3 | 0) != 2 | (i7 & 8) != 0 | ((i6 | 0) != 2 | (i8 & 8) != 0))) {
      d4 = d27;
      i30 = i16;
      break;
     }
     i13 = i9 + 28 | 0;
     i3 = i9 + 60 | 0;
     d4 = +HEAPF32[i3 >> 2];
     i14 = i10 + 28 | 0;
     i6 = i10 + 60 | 0;
     d5 = +HEAPF32[i6 >> 2];
     if (!(d4 < d5)) {
      if (d5 < d4) {
       if (!(d5 < 1.0)) {
        i1 = 24;
        break L12;
       }
       d76 = (d4 - d5) / (1.0 - d5);
       i30 = i10 + 36 | 0;
       d78 = +HEAPF32[i30 >> 2];
       i31 = i10 + 40 | 0;
       d77 = +HEAPF32[i31 >> 2];
       d5 = d76 * (+HEAPF32[i10 + 48 >> 2] - d77);
       HEAPF32[i30 >> 2] = d78 + d76 * (+HEAPF32[i10 + 44 >> 2] - d78);
       HEAPF32[i31 >> 2] = d77 + d5;
       i31 = i10 + 52 | 0;
       d5 = +HEAPF32[i31 >> 2];
       HEAPF32[i31 >> 2] = d5 + d76 * (+HEAPF32[i10 + 56 >> 2] - d5);
       HEAPF32[i6 >> 2] = d4;
      }
     } else {
      if (!(d4 < 1.0)) {
       i1 = 20;
       break L12;
      }
      d78 = (d5 - d4) / (1.0 - d4);
      i30 = i9 + 36 | 0;
      d76 = +HEAPF32[i30 >> 2];
      i31 = i9 + 40 | 0;
      d77 = +HEAPF32[i31 >> 2];
      d4 = d78 * (+HEAPF32[i9 + 48 >> 2] - d77);
      HEAPF32[i30 >> 2] = d76 + d78 * (+HEAPF32[i9 + 44 >> 2] - d76);
      HEAPF32[i31 >> 2] = d77 + d4;
      i31 = i9 + 52 | 0;
      d4 = +HEAPF32[i31 >> 2];
      HEAPF32[i31 >> 2] = d4 + d78 * (+HEAPF32[i9 + 56 >> 2] - d4);
      HEAPF32[i3 >> 2] = d5;
      d4 = d5;
     }
     if (!(d4 < 1.0)) {
      i1 = 27;
      break L12;
     }
     i3 = HEAP32[i1 + 56 >> 2] | 0;
     i9 = HEAP32[i1 + 60 >> 2] | 0;
     HEAP32[i36 >> 2] = 0;
     HEAP32[i37 >> 2] = 0;
     HEAPF32[i38 >> 2] = 0.0;
     HEAP32[i39 >> 2] = 0;
     HEAP32[i40 >> 2] = 0;
     HEAPF32[i41 >> 2] = 0.0;
     i8 = HEAP32[i11 + 12 >> 2] | 0;
     switch (HEAP32[i8 + 4 >> 2] | 0) {
     case 0:
      {
       HEAP32[i36 >> 2] = i8 + 12;
       HEAP32[i37 >> 2] = 1;
       HEAP32[i38 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 2:
      {
       HEAP32[i36 >> 2] = i8 + 20;
       HEAP32[i37 >> 2] = HEAP32[i8 + 148 >> 2];
       HEAP32[i38 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 3:
      {
       if ((i3 | 0) <= -1) {
        i1 = 33;
        break L12;
       }
       i6 = i8 + 16 | 0;
       if ((HEAP32[i6 >> 2] | 0) <= (i3 | 0)) {
        i1 = 33;
        break L12;
       }
       i7 = i8 + 12 | 0;
       i29 = (HEAP32[i7 >> 2] | 0) + (i3 << 3) | 0;
       i30 = HEAP32[i29 + 4 >> 2] | 0;
       i31 = i72;
       HEAP32[i31 >> 2] = HEAP32[i29 >> 2];
       HEAP32[i31 + 4 >> 2] = i30;
       i3 = i3 + 1 | 0;
       if ((i3 | 0) < (HEAP32[i6 >> 2] | 0)) i3 = (HEAP32[i7 >> 2] | 0) + (i3 << 3) | 0; else i3 = HEAP32[i7 >> 2] | 0;
       i29 = i3;
       i30 = HEAP32[i29 + 4 >> 2] | 0;
       i31 = i48;
       HEAP32[i31 >> 2] = HEAP32[i29 >> 2];
       HEAP32[i31 + 4 >> 2] = i30;
       HEAP32[i36 >> 2] = i72;
       HEAP32[i37 >> 2] = 2;
       HEAP32[i38 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 1:
      {
       HEAP32[i36 >> 2] = i8 + 12;
       HEAP32[i37 >> 2] = 2;
       HEAP32[i38 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     default:
      {
       i1 = 39;
       break L12;
      }
     }
     i8 = HEAP32[i12 + 12 >> 2] | 0;
     switch (HEAP32[i8 + 4 >> 2] | 0) {
     case 0:
      {
       HEAP32[i39 >> 2] = i8 + 12;
       HEAP32[i40 >> 2] = 1;
       HEAP32[i41 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 2:
      {
       HEAP32[i39 >> 2] = i8 + 20;
       HEAP32[i40 >> 2] = HEAP32[i8 + 148 >> 2];
       HEAP32[i41 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 3:
      {
       if ((i9 | 0) <= -1) {
        i1 = 45;
        break L12;
       }
       i6 = i8 + 16 | 0;
       if ((HEAP32[i6 >> 2] | 0) <= (i9 | 0)) {
        i1 = 45;
        break L12;
       }
       i7 = i8 + 12 | 0;
       i30 = (HEAP32[i7 >> 2] | 0) + (i9 << 3) | 0;
       i31 = HEAP32[i30 + 4 >> 2] | 0;
       i3 = i42;
       HEAP32[i3 >> 2] = HEAP32[i30 >> 2];
       HEAP32[i3 + 4 >> 2] = i31;
       i3 = i9 + 1 | 0;
       if ((i3 | 0) < (HEAP32[i6 >> 2] | 0)) i3 = (HEAP32[i7 >> 2] | 0) + (i3 << 3) | 0; else i3 = HEAP32[i7 >> 2] | 0;
       i29 = i3;
       i30 = HEAP32[i29 + 4 >> 2] | 0;
       i31 = i47;
       HEAP32[i31 >> 2] = HEAP32[i29 >> 2];
       HEAP32[i31 + 4 >> 2] = i30;
       HEAP32[i39 >> 2] = i42;
       HEAP32[i40 >> 2] = 2;
       HEAP32[i41 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     case 1:
      {
       HEAP32[i39 >> 2] = i8 + 12;
       HEAP32[i40 >> 2] = 2;
       HEAP32[i41 >> 2] = HEAP32[i8 + 8 >> 2];
       break;
      }
     default:
      {
       i1 = 51;
       break L12;
      }
     }
     i31 = i43;
     i25 = i13;
     i26 = i31 + 36 | 0;
     do {
      HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
      i31 = i31 + 4 | 0;
      i25 = i25 + 4 | 0;
     } while ((i31 | 0) < (i26 | 0));
     i31 = i44;
     i25 = i14;
     i26 = i31 + 36 | 0;
     do {
      HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
      i31 = i31 + 4 | 0;
      i25 = i25 + 4 | 0;
     } while ((i31 | 0) < (i26 | 0));
     HEAPF32[i45 >> 2] = 1.0;
     __Z14b2TimeOfImpactP11b2TOIOutputPK10b2TOIInput(i69, i72);
     if ((HEAP32[i69 >> 2] | 0) == 3) {
      d4 = d4 + (1.0 - d4) * +HEAPF32[i46 >> 2];
      d4 = d4 < 1.0 ? d4 : 1.0;
     } else d4 = 1.0;
     HEAPF32[i1 + 132 >> 2] = d4;
     HEAP32[i15 >> 2] = HEAP32[i15 >> 2] | 32;
    } else d4 = +HEAPF32[i1 + 132 >> 2];
    if (d4 < d27) i30 = i1; else {
     d4 = d27;
     i30 = i16;
    }
   } else {
    d4 = d27;
    i30 = i16;
   } while (0);
   i1 = HEAP32[i1 + 12 >> 2] | 0;
   if (i1) {
    d27 = d4;
    i16 = i30;
    continue;
   }
   if (d4 > .9999988079071045 | (i30 | 0) == 0) break L11;
   i28 = HEAP32[(HEAP32[i30 + 48 >> 2] | 0) + 8 >> 2] | 0;
   i29 = HEAP32[(HEAP32[i30 + 52 >> 2] | 0) + 8 >> 2] | 0;
   i23 = i28 + 28 | 0;
   i31 = i65;
   i25 = i23;
   i26 = i31 + 36 | 0;
   do {
    HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
    i31 = i31 + 4 | 0;
    i25 = i25 + 4 | 0;
   } while ((i31 | 0) < (i26 | 0));
   i24 = i29 + 28 | 0;
   i31 = i66;
   i25 = i24;
   i26 = i31 + 36 | 0;
   do {
    HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
    i31 = i31 + 4 | 0;
    i25 = i25 + 4 | 0;
   } while ((i31 | 0) < (i26 | 0));
   i1 = i28 + 60 | 0;
   d5 = +HEAPF32[i1 >> 2];
   if (!(d5 < 1.0)) {
    i1 = 61;
    break;
   }
   d27 = (d4 - d5) / (1.0 - d5);
   i20 = i28 + 44 | 0;
   i18 = i28 + 36 | 0;
   d5 = +HEAPF32[i18 >> 2];
   i21 = i28 + 48 | 0;
   i22 = i28 + 40 | 0;
   d76 = +HEAPF32[i22 >> 2];
   d77 = d27 * (+HEAPF32[i21 >> 2] - d76);
   HEAPF32[i18 >> 2] = d5 + d27 * (+HEAPF32[i20 >> 2] - d5);
   HEAPF32[i22 >> 2] = d76 + d77;
   i22 = i28 + 56 | 0;
   i18 = i28 + 52 | 0;
   d77 = +HEAPF32[i18 >> 2];
   d77 = d77 + d27 * (+HEAPF32[i22 >> 2] - d77);
   HEAPF32[i18 >> 2] = d77;
   HEAPF32[i1 >> 2] = d4;
   i18 = i28 + 36 | 0;
   i19 = HEAP32[i18 >> 2] | 0;
   i18 = HEAP32[i18 + 4 >> 2] | 0;
   i14 = i28 + 44 | 0;
   HEAP32[i14 >> 2] = i19;
   HEAP32[i14 + 4 >> 2] = i18;
   HEAPF32[i22 >> 2] = d77;
   d27 = +Math_sin(+d77);
   i14 = i28 + 20 | 0;
   HEAPF32[i14 >> 2] = d27;
   d77 = +Math_cos(+d77);
   i15 = i28 + 24 | 0;
   HEAPF32[i15 >> 2] = d77;
   i16 = i28 + 28 | 0;
   d76 = +HEAPF32[i16 >> 2];
   i17 = i28 + 32 | 0;
   d5 = +HEAPF32[i17 >> 2];
   d78 = (HEAP32[tempDoublePtr >> 2] = i19, +HEAPF32[tempDoublePtr >> 2]) - (d77 * d76 - d27 * d5);
   d5 = (HEAP32[tempDoublePtr >> 2] = i18, +HEAPF32[tempDoublePtr >> 2]) - (d27 * d76 + d77 * d5);
   i18 = i28 + 12 | 0;
   HEAPF32[i18 >> 2] = d78;
   i19 = i28 + 16 | 0;
   HEAPF32[i19 >> 2] = d5;
   i1 = i29 + 60 | 0;
   d5 = +HEAPF32[i1 >> 2];
   if (!(d5 < 1.0)) {
    i1 = 63;
    break;
   }
   d5 = (d4 - d5) / (1.0 - d5);
   i11 = i29 + 44 | 0;
   i9 = i29 + 36 | 0;
   d78 = +HEAPF32[i9 >> 2];
   i12 = i29 + 48 | 0;
   i13 = i29 + 40 | 0;
   d27 = +HEAPF32[i13 >> 2];
   d76 = d5 * (+HEAPF32[i12 >> 2] - d27);
   HEAPF32[i9 >> 2] = d78 + d5 * (+HEAPF32[i11 >> 2] - d78);
   HEAPF32[i13 >> 2] = d27 + d76;
   i13 = i29 + 56 | 0;
   i9 = i29 + 52 | 0;
   d76 = +HEAPF32[i9 >> 2];
   d76 = d76 + d5 * (+HEAPF32[i13 >> 2] - d76);
   HEAPF32[i9 >> 2] = d76;
   HEAPF32[i1 >> 2] = d4;
   i9 = i29 + 36 | 0;
   i10 = HEAP32[i9 >> 2] | 0;
   i9 = HEAP32[i9 + 4 >> 2] | 0;
   i3 = i29 + 44 | 0;
   HEAP32[i3 >> 2] = i10;
   HEAP32[i3 + 4 >> 2] = i9;
   HEAPF32[i13 >> 2] = d76;
   d5 = +Math_sin(+d76);
   i3 = i29 + 20 | 0;
   HEAPF32[i3 >> 2] = d5;
   d76 = +Math_cos(+d76);
   i6 = i29 + 24 | 0;
   HEAPF32[i6 >> 2] = d76;
   i7 = i29 + 28 | 0;
   d27 = +HEAPF32[i7 >> 2];
   i8 = i29 + 32 | 0;
   d78 = +HEAPF32[i8 >> 2];
   d77 = (HEAP32[tempDoublePtr >> 2] = i10, +HEAPF32[tempDoublePtr >> 2]) - (d76 * d27 - d5 * d78);
   d78 = (HEAP32[tempDoublePtr >> 2] = i9, +HEAPF32[tempDoublePtr >> 2]) - (d5 * d27 + d76 * d78);
   i9 = i29 + 12 | 0;
   HEAPF32[i9 >> 2] = d77;
   i10 = i29 + 16 | 0;
   HEAPF32[i10 >> 2] = d78;
   __ZN9b2Contact6UpdateEP17b2ContactListener(i30, HEAP32[i64 >> 2] | 0);
   i25 = i30 + 4 | 0;
   i1 = HEAP32[i25 >> 2] | 0;
   i26 = i1 & -33;
   HEAP32[i25 >> 2] = i26;
   i31 = i30 + 128 | 0;
   HEAP32[i31 >> 2] = (HEAP32[i31 >> 2] | 0) + 1;
   if ((i1 & 6 | 0) == 6) {
    i6 = i28 + 4 | 0;
    i1 = HEAPU16[i6 >> 1] | 0;
    if (!(i1 & 2)) {
     HEAP16[i6 >> 1] = i1 | 2;
     HEAPF32[i28 + 144 >> 2] = 0.0;
     i31 = HEAP32[i28 + 88 >> 2] | 0;
     HEAP32[i31 >> 2] = (HEAP32[i31 >> 2] | 0) + 1;
    }
    i3 = i29 + 4 | 0;
    i1 = HEAPU16[i3 >> 1] | 0;
    if (!(i1 & 2)) {
     HEAP16[i3 >> 1] = i1 | 2;
     HEAPF32[i29 + 144 >> 2] = 0.0;
     i31 = HEAP32[i29 + 88 >> 2] | 0;
     HEAP32[i31 >> 2] = (HEAP32[i31 >> 2] | 0) + 1;
    }
    HEAP32[i49 >> 2] = 0;
    HEAP32[i50 >> 2] = 0;
    HEAP32[i51 >> 2] = 0;
    i17 = HEAP32[i52 >> 2] | 0;
    if ((i17 | 0) <= 0) {
     i1 = 71;
     break;
    }
    i20 = i28 + 8 | 0;
    HEAP32[i20 >> 2] = 0;
    i22 = HEAP32[i53 >> 2] | 0;
    HEAP32[i22 >> 2] = i28;
    HEAP32[i49 >> 2] = 1;
    if ((i17 | 0) <= 1) {
     i1 = 73;
     break;
    }
    i21 = i29 + 8 | 0;
    HEAP32[i21 >> 2] = 1;
    HEAP32[i22 + 4 >> 2] = i29;
    HEAP32[i49 >> 2] = 2;
    i18 = HEAP32[i54 >> 2] | 0;
    if ((i18 | 0) <= 0) {
     i1 = 75;
     break;
    }
    HEAP32[i50 >> 2] = 1;
    i19 = HEAP32[i55 >> 2] | 0;
    HEAP32[i19 >> 2] = i30;
    HEAP16[i6 >> 1] = HEAPU16[i6 >> 1] | 1;
    HEAP16[i3 >> 1] = HEAPU16[i3 >> 1] | 1;
    HEAP32[i25 >> 2] = i26 | 1;
    HEAP32[i67 >> 2] = i28;
    HEAP32[i56 >> 2] = i29;
    i6 = i28;
    i9 = 2;
    i8 = 1;
    i7 = 1;
    i3 = 2;
    i16 = 0;
    while (1) {
     L80 : do if ((HEAP32[i6 >> 2] | 0) == 2 ? (i68 = HEAP32[i6 + 112 >> 2] | 0, (i68 | 0) != 0) : 0) {
      i15 = i6 + 4 | 0;
      i1 = i7;
      i6 = i8;
      i14 = i68;
      while (1) {
       if ((i3 | 0) == (i17 | 0)) {
        i8 = i6;
        i7 = i1;
        i3 = i17;
        break L80;
       }
       if ((i1 | 0) == (i18 | 0)) {
        i8 = i6;
        i7 = i18;
        break L80;
       }
       i12 = HEAP32[i14 + 4 >> 2] | 0;
       i10 = i12 + 4 | 0;
       L87 : do if (!(HEAP32[i10 >> 2] & 1)) {
        i13 = HEAP32[i14 >> 2] | 0;
        do if ((HEAP32[i13 >> 2] | 0) == 2) {
         if (HEAP16[i15 >> 1] & 8) break;
         if (!(HEAP16[i13 + 4 >> 1] & 8)) break L87;
        } while (0);
        if (HEAP8[(HEAP32[i12 + 48 >> 2] | 0) + 38 >> 0] | 0) break;
        if (HEAP8[(HEAP32[i12 + 52 >> 2] | 0) + 38 >> 0] | 0) break;
        i11 = i13 + 28 | 0;
        i31 = i72;
        i25 = i11;
        i26 = i31 + 36 | 0;
        do {
         HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
         i31 = i31 + 4 | 0;
         i25 = i25 + 4 | 0;
        } while ((i31 | 0) < (i26 | 0));
        i8 = i13 + 4 | 0;
        if (!(HEAP16[i8 >> 1] & 1)) {
         i7 = i13 + 60 | 0;
         d5 = +HEAPF32[i7 >> 2];
         if (!(d5 < 1.0)) {
          i1 = 90;
          break L12;
         }
         d5 = (d4 - d5) / (1.0 - d5);
         i31 = i13 + 36 | 0;
         d78 = +HEAPF32[i31 >> 2];
         i29 = i13 + 40 | 0;
         d27 = +HEAPF32[i29 >> 2];
         d76 = d5 * (+HEAPF32[i13 + 48 >> 2] - d27);
         HEAPF32[i31 >> 2] = d78 + d5 * (+HEAPF32[i13 + 44 >> 2] - d78);
         HEAPF32[i29 >> 2] = d27 + d76;
         i29 = i13 + 56 | 0;
         i31 = i13 + 52 | 0;
         d76 = +HEAPF32[i31 >> 2];
         d76 = d76 + d5 * (+HEAPF32[i29 >> 2] - d76);
         HEAPF32[i31 >> 2] = d76;
         HEAPF32[i7 >> 2] = d4;
         i31 = i13 + 36 | 0;
         i30 = HEAP32[i31 >> 2] | 0;
         i31 = HEAP32[i31 + 4 >> 2] | 0;
         i28 = i13 + 44 | 0;
         HEAP32[i28 >> 2] = i30;
         HEAP32[i28 + 4 >> 2] = i31;
         HEAPF32[i29 >> 2] = d76;
         d5 = +Math_sin(+d76);
         HEAPF32[i13 + 20 >> 2] = d5;
         d76 = +Math_cos(+d76);
         HEAPF32[i13 + 24 >> 2] = d76;
         d27 = +HEAPF32[i13 + 28 >> 2];
         d78 = +HEAPF32[i13 + 32 >> 2];
         d77 = (HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]) - (d76 * d27 - d5 * d78);
         d78 = (HEAP32[tempDoublePtr >> 2] = i31, +HEAPF32[tempDoublePtr >> 2]) - (d5 * d27 + d76 * d78);
         HEAPF32[i13 + 12 >> 2] = d77;
         HEAPF32[i13 + 16 >> 2] = d78;
        }
        __ZN9b2Contact6UpdateEP17b2ContactListener(i12, HEAP32[i64 >> 2] | 0);
        i7 = HEAP32[i10 >> 2] | 0;
        do if (!(i7 & 4)) {
         i31 = i11;
         i25 = i72;
         i26 = i31 + 36 | 0;
         do {
          HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
          i31 = i31 + 4 | 0;
          i25 = i25 + 4 | 0;
         } while ((i31 | 0) < (i26 | 0));
         d5 = +HEAPF32[i13 + 56 >> 2];
         d76 = +Math_sin(+d5);
         HEAPF32[i13 + 20 >> 2] = d76;
         d5 = +Math_cos(+d5);
         HEAPF32[i13 + 24 >> 2] = d5;
         d27 = +HEAPF32[i13 + 28 >> 2];
         d77 = +HEAPF32[i13 + 32 >> 2];
         d78 = +HEAPF32[i13 + 48 >> 2] - (d76 * d27 + d5 * d77);
         HEAPF32[i13 + 12 >> 2] = +HEAPF32[i13 + 44 >> 2] - (d5 * d27 - d76 * d77);
         HEAPF32[i13 + 16 >> 2] = d78;
        } else {
         if (!(i7 & 2)) {
          i31 = i11;
          i25 = i72;
          i26 = i31 + 36 | 0;
          do {
           HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
           i31 = i31 + 4 | 0;
           i25 = i25 + 4 | 0;
          } while ((i31 | 0) < (i26 | 0));
          d5 = +HEAPF32[i13 + 56 >> 2];
          d76 = +Math_sin(+d5);
          HEAPF32[i13 + 20 >> 2] = d76;
          d5 = +Math_cos(+d5);
          HEAPF32[i13 + 24 >> 2] = d5;
          d27 = +HEAPF32[i13 + 28 >> 2];
          d77 = +HEAPF32[i13 + 32 >> 2];
          d78 = +HEAPF32[i13 + 48 >> 2] - (d76 * d27 + d5 * d77);
          HEAPF32[i13 + 12 >> 2] = +HEAPF32[i13 + 44 >> 2] - (d5 * d27 - d76 * d77);
          HEAPF32[i13 + 16 >> 2] = d78;
          break;
         }
         HEAP32[i10 >> 2] = i7 | 1;
         if ((i6 | 0) >= (i18 | 0)) {
          i1 = 97;
          break L12;
         }
         i7 = i6 + 1 | 0;
         HEAP32[i50 >> 2] = i7;
         HEAP32[i19 + (i6 << 2) >> 2] = i12;
         i1 = HEAPU16[i8 >> 1] | 0;
         if (i1 & 1) {
          i6 = i7;
          i1 = i7;
          break;
         }
         HEAP16[i8 >> 1] = i1 | 1;
         if ((i1 & 2 | 0) == 0 & (HEAP32[i13 >> 2] | 0) != 0) {
          HEAP16[i8 >> 1] = i1 | 3;
          HEAPF32[i13 + 144 >> 2] = 0.0;
          i31 = HEAP32[i13 + 88 >> 2] | 0;
          HEAP32[i31 >> 2] = (HEAP32[i31 >> 2] | 0) + 1;
         }
         if ((i9 | 0) >= (i17 | 0)) {
          i1 = 102;
          break L12;
         }
         HEAP32[i13 + 8 >> 2] = i9;
         HEAP32[i22 + (i9 << 2) >> 2] = i13;
         i3 = i9 + 1 | 0;
         HEAP32[i49 >> 2] = i3;
         i9 = i3;
         i6 = i7;
         i1 = i7;
        } while (0);
       } while (0);
       i14 = HEAP32[i14 + 12 >> 2] | 0;
       if (!i14) {
        i8 = i6;
        i7 = i1;
        break;
       }
      }
     } while (0);
     i1 = i16 + 1 | 0;
     if ((i1 | 0) >= 2) break;
     i6 = HEAP32[i67 + (i1 << 2) >> 2] | 0;
     i16 = i1;
    }
    d78 = (1.0 - d4) * +HEAPF32[i70 >> 2];
    HEAPF32[i71 >> 2] = d78;
    HEAPF32[i57 >> 2] = 1.0 / d78;
    HEAPF32[i58 >> 2] = 1.0;
    HEAP32[i59 >> 2] = 20;
    HEAP32[i61 >> 2] = HEAP32[i60 >> 2];
    HEAP8[i62 >> 0] = 0;
    __ZN8b2Island8SolveTOIERK10b2TimeStepii(i74, i71, HEAP32[i20 >> 2] | 0, HEAP32[i21 >> 2] | 0);
    if ((i9 | 0) > 0) {
     i8 = 0;
     do {
      i3 = HEAP32[i22 + (i8 << 2) >> 2] | 0;
      i31 = i3 + 4 | 0;
      HEAP16[i31 >> 1] = HEAPU16[i31 >> 1] & 65534;
      do if ((HEAP32[i3 >> 2] | 0) == 2) {
       d5 = +HEAPF32[i3 + 52 >> 2];
       d76 = +Math_sin(+d5);
       HEAPF32[i33 >> 2] = d76;
       d5 = +Math_cos(+d5);
       HEAPF32[i34 >> 2] = d5;
       d27 = +HEAPF32[i3 + 28 >> 2];
       d77 = +HEAPF32[i3 + 32 >> 2];
       d78 = +HEAPF32[i3 + 40 >> 2] - (d76 * d27 + d5 * d77);
       HEAPF32[i72 >> 2] = +HEAPF32[i3 + 36 >> 2] - (d5 * d27 - d76 * d77);
       HEAPF32[i35 >> 2] = d78;
       i6 = (HEAP32[i3 + 88 >> 2] | 0) + 102876 | 0;
       i1 = HEAP32[i3 + 100 >> 2] | 0;
       if (i1) {
        i7 = i3 + 12 | 0;
        do {
         __ZN9b2Fixture11SynchronizeEP12b2BroadPhaseRK11b2TransformS4_(i1, i6, i72, i7);
         i1 = HEAP32[i1 + 4 >> 2] | 0;
        } while ((i1 | 0) != 0);
       }
       i1 = HEAP32[i3 + 112 >> 2] | 0;
       if (!i1) break;
       do {
        i31 = (HEAP32[i1 + 4 >> 2] | 0) + 4 | 0;
        HEAP32[i31 >> 2] = HEAP32[i31 >> 2] & -34;
        i1 = HEAP32[i1 + 12 >> 2] | 0;
       } while ((i1 | 0) != 0);
      } while (0);
      i8 = i8 + 1 | 0;
     } while ((i8 | 0) < (i9 | 0));
    }
    __ZN12b2BroadPhase11UpdatePairsI16b2ContactManagerEEvPT_(i63, i63);
    if (HEAP8[i32 >> 0] | 0) {
     i1 = 117;
     break;
    }
   } else {
    HEAP32[i25 >> 2] = i1 & -37;
    i31 = i23;
    i25 = i65;
    i26 = i31 + 36 | 0;
    do {
     HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
     i31 = i31 + 4 | 0;
     i25 = i25 + 4 | 0;
    } while ((i31 | 0) < (i26 | 0));
    i31 = i24;
    i25 = i66;
    i26 = i31 + 36 | 0;
    do {
     HEAP32[i31 >> 2] = HEAP32[i25 >> 2];
     i31 = i31 + 4 | 0;
     i25 = i25 + 4 | 0;
    } while ((i31 | 0) < (i26 | 0));
    d78 = +HEAPF32[i22 >> 2];
    d27 = +Math_sin(+d78);
    HEAPF32[i14 >> 2] = d27;
    d78 = +Math_cos(+d78);
    HEAPF32[i15 >> 2] = d78;
    d77 = +HEAPF32[i16 >> 2];
    d76 = +HEAPF32[i17 >> 2];
    d5 = +HEAPF32[i21 >> 2] - (d27 * d77 + d78 * d76);
    HEAPF32[i18 >> 2] = +HEAPF32[i20 >> 2] - (d78 * d77 - d27 * d76);
    HEAPF32[i19 >> 2] = d5;
    d5 = +HEAPF32[i13 >> 2];
    d76 = +Math_sin(+d5);
    HEAPF32[i3 >> 2] = d76;
    d5 = +Math_cos(+d5);
    HEAPF32[i6 >> 2] = d5;
    d27 = +HEAPF32[i7 >> 2];
    d77 = +HEAPF32[i8 >> 2];
    d78 = +HEAPF32[i12 >> 2] - (d76 * d27 + d5 * d77);
    HEAPF32[i9 >> 2] = +HEAPF32[i11 >> 2] - (d5 * d27 - d76 * d77);
    HEAPF32[i10 >> 2] = d78;
   }
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) break L11; else {
    d27 = 1.0;
    i16 = 0;
   }
  }
  switch (i1 | 0) {
  case 15:
   {
    ___assert_fail(6955, 6695, 643, 6642);
    break;
   }
  case 20:
   {
    ___assert_fail(7006, 7020, 709, 7064);
    break;
   }
  case 24:
   {
    ___assert_fail(7006, 7020, 709, 7064);
    break;
   }
  case 27:
   {
    ___assert_fail(7006, 6695, 678, 6642);
    break;
   }
  case 33:
   {
    ___assert_fail(4818, 4855, 53, 4300);
    break;
   }
  case 39:
   {
    ___assert_fail(4304, 4855, 81, 4300);
    break;
   }
  case 45:
   {
    ___assert_fail(4818, 4855, 53, 4300);
    break;
   }
  case 51:
   {
    ___assert_fail(4304, 4855, 81, 4300);
    break;
   }
  case 61:
   {
    ___assert_fail(7006, 7020, 709, 7064);
    break;
   }
  case 63:
   {
    ___assert_fail(7006, 7020, 709, 7064);
    break;
   }
  case 71:
   {
    ___assert_fail(6785, 6814, 54, 6862);
    break;
   }
  case 73:
   {
    ___assert_fail(6785, 6814, 54, 6862);
    break;
   }
  case 75:
   {
    ___assert_fail(6866, 6814, 62, 6862);
    break;
   }
  case 90:
   {
    ___assert_fail(7006, 7020, 709, 7064);
    break;
   }
  case 97:
   {
    ___assert_fail(6866, 6814, 62, 6862);
    break;
   }
  case 102:
   {
    ___assert_fail(6785, 6814, 54, 6862);
    break;
   }
  case 117:
   {
    HEAP8[i73 >> 0] = 0;
    __ZN8b2IslandD2Ev(i74);
    STACKTOP = i75;
    return;
   }
  }
 } while (0);
 HEAP8[i73 >> 0] = 1;
 __ZN8b2IslandD2Ev(i74);
 STACKTOP = i75;
 return;
}

function __ZN12b2EPCollider7CollideEP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK14b2PolygonShapeS7_(i32, i41, i6, i1, i35, i2) {
 i32 = i32 | 0;
 i41 = i41 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 i35 = i35 | 0;
 i2 = i2 | 0;
 var d3 = 0.0, d4 = 0.0, d5 = 0.0, d7 = 0.0, i8 = 0, d9 = 0.0, d10 = 0.0, i11 = 0, d12 = 0.0, d13 = 0.0, d14 = 0.0, i15 = 0, i16 = 0, i17 = 0, d18 = 0.0, d19 = 0.0, i20 = 0, i21 = 0, d22 = 0.0, d23 = 0.0, d24 = 0.0, i25 = 0, i26 = 0, d27 = 0.0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i33 = 0, i34 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i42 = 0;
 i42 = STACKTOP;
 STACKTOP = STACKTOP + 96 | 0;
 i16 = i42 + 72 | 0;
 i33 = i42 + 24 | 0;
 i34 = i42 + 48 | 0;
 i40 = i42;
 d9 = +HEAPF32[i1 + 12 >> 2];
 d24 = +HEAPF32[i2 + 8 >> 2];
 d19 = +HEAPF32[i1 + 8 >> 2];
 d7 = +HEAPF32[i2 + 12 >> 2];
 d3 = d9 * d24 - d19 * d7;
 d7 = d24 * d19 + d9 * d7;
 d24 = +HEAPF32[i2 >> 2] - +HEAPF32[i1 >> 2];
 d22 = +HEAPF32[i2 + 4 >> 2] - +HEAPF32[i1 + 4 >> 2];
 d23 = d9 * d24 + d19 * d22;
 d24 = d9 * d22 - d19 * d24;
 i36 = i32 + 132 | 0;
 HEAPF32[i36 >> 2] = d23;
 i37 = i32 + 136 | 0;
 HEAPF32[i37 >> 2] = d24;
 i38 = i32 + 140 | 0;
 HEAPF32[i38 >> 2] = d3;
 i39 = i32 + 144 | 0;
 HEAPF32[i39 >> 2] = d7;
 d19 = +HEAPF32[i35 + 12 >> 2];
 d22 = +HEAPF32[i35 + 16 >> 2];
 d23 = d23 + (d7 * d19 - d3 * d22);
 d24 = d19 * d3 + d7 * d22 + d24;
 HEAPF32[i32 + 148 >> 2] = d23;
 HEAPF32[i32 + 152 >> 2] = d24;
 i25 = i6 + 28 | 0;
 i21 = HEAP32[i25 >> 2] | 0;
 i25 = HEAP32[i25 + 4 >> 2] | 0;
 i26 = i32 + 156 | 0;
 HEAP32[i26 >> 2] = i21;
 HEAP32[i26 + 4 >> 2] = i25;
 i26 = i32 + 164 | 0;
 i17 = i6 + 12 | 0;
 i11 = HEAP32[i17 >> 2] | 0;
 i17 = HEAP32[i17 + 4 >> 2] | 0;
 i28 = i26;
 HEAP32[i28 >> 2] = i11;
 HEAP32[i28 + 4 >> 2] = i17;
 i28 = i32 + 172 | 0;
 i20 = i6 + 20 | 0;
 i15 = HEAP32[i20 >> 2] | 0;
 i20 = HEAP32[i20 + 4 >> 2] | 0;
 i30 = i28;
 HEAP32[i30 >> 2] = i15;
 HEAP32[i30 + 4 >> 2] = i20;
 i30 = i6 + 36 | 0;
 i29 = HEAP32[i30 >> 2] | 0;
 i30 = HEAP32[i30 + 4 >> 2] | 0;
 i2 = i32 + 180 | 0;
 HEAP32[i2 >> 2] = i29;
 HEAP32[i2 + 4 >> 2] = i30;
 i2 = (HEAP8[i6 + 44 >> 0] | 0) != 0;
 i1 = (HEAP8[i6 + 45 >> 0] | 0) == 0;
 d22 = (HEAP32[tempDoublePtr >> 2] = i15, +HEAPF32[tempDoublePtr >> 2]);
 d7 = (HEAP32[tempDoublePtr >> 2] = i11, +HEAPF32[tempDoublePtr >> 2]);
 d3 = d22 - d7;
 i11 = i32 + 176 | 0;
 d19 = (HEAP32[tempDoublePtr >> 2] = i20, +HEAPF32[tempDoublePtr >> 2]);
 i20 = i32 + 168 | 0;
 d9 = (HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
 d5 = d19 - d9;
 d4 = +Math_sqrt(+(d3 * d3 + d5 * d5));
 d10 = (HEAP32[tempDoublePtr >> 2] = i21, +HEAPF32[tempDoublePtr >> 2]);
 d12 = (HEAP32[tempDoublePtr >> 2] = i25, +HEAPF32[tempDoublePtr >> 2]);
 d13 = (HEAP32[tempDoublePtr >> 2] = i29, +HEAPF32[tempDoublePtr >> 2]);
 d14 = (HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]);
 if (d4 < 1.1920928955078125e-007) d27 = d3; else {
  d18 = 1.0 / d4;
  d27 = d3 * d18;
  d5 = d5 * d18;
 }
 i25 = i32 + 196 | 0;
 d18 = -d27;
 HEAPF32[i25 >> 2] = d5;
 i21 = i32 + 200 | 0;
 HEAPF32[i21 >> 2] = d18;
 d18 = (d23 - d7) * d5 + (d24 - d9) * d18;
 if (i2) {
  d7 = d7 - d10;
  d4 = d9 - d12;
  d3 = +Math_sqrt(+(d7 * d7 + d4 * d4));
  if (d3 < 1.1920928955078125e-007) d3 = d7; else {
   d9 = 1.0 / d3;
   d3 = d7 * d9;
   d4 = d4 * d9;
  }
  d9 = -d3;
  HEAPF32[i32 + 188 >> 2] = d4;
  HEAPF32[i32 + 192 >> 2] = d9;
  i8 = d5 * d3 - d27 * d4 >= 0.0;
  d9 = (d23 - d10) * d4 + (d24 - d12) * d9;
 } else {
  i8 = 0;
  d9 = 0.0;
 }
 do if (i1) {
  if (!i2) {
   i30 = d18 >= 0.0;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (i30) {
    i17 = i25;
    i30 = HEAP32[i17 >> 2] | 0;
    i17 = HEAP32[i17 + 4 >> 2] | 0;
    i29 = i1;
    HEAP32[i29 >> 2] = i30;
    HEAP32[i29 + 4 >> 2] = i17;
    d24 = -(HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i32 + 228 >> 2] = d24;
    HEAPF32[i32 + 232 >> 2] = d27;
    HEAPF32[i32 + 236 >> 2] = d24;
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   } else {
    HEAPF32[i1 >> 2] = -d5;
    HEAPF32[i32 + 216 >> 2] = d27;
    i29 = i25;
    i17 = HEAP32[i29 >> 2] | 0;
    i29 = HEAP32[i29 + 4 >> 2] | 0;
    i30 = i32 + 228 | 0;
    HEAP32[i30 >> 2] = i17;
    HEAP32[i30 + 4 >> 2] = i29;
    i30 = i32 + 236 | 0;
    HEAP32[i30 >> 2] = i17;
    HEAP32[i30 + 4 >> 2] = i29;
    break;
   }
  }
  i2 = d9 >= 0.0;
  i1 = d18 >= 0.0;
  if (i8) {
   i30 = i1 | i2;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (i30) {
    i17 = i25;
    i30 = HEAP32[i17 >> 2] | 0;
    i17 = HEAP32[i17 + 4 >> 2] | 0;
    i15 = i1;
    HEAP32[i15 >> 2] = i30;
    HEAP32[i15 + 4 >> 2] = i17;
    i15 = i32 + 188 | 0;
    i17 = HEAP32[i15 + 4 >> 2] | 0;
    i29 = i32 + 228 | 0;
    HEAP32[i29 >> 2] = HEAP32[i15 >> 2];
    HEAP32[i29 + 4 >> 2] = i17;
    HEAPF32[i32 + 236 >> 2] = -(HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   } else {
    HEAPF32[i1 >> 2] = -d5;
    HEAPF32[i32 + 216 >> 2] = d27;
    i17 = i25;
    i30 = HEAP32[i17 >> 2] | 0;
    i17 = HEAP32[i17 + 4 >> 2] | 0;
    i29 = i32 + 228 | 0;
    HEAP32[i29 >> 2] = i30;
    HEAP32[i29 + 4 >> 2] = i17;
    HEAPF32[i32 + 236 >> 2] = -(HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   }
  } else {
   i30 = i1 & i2;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (i30) {
    i17 = i25;
    i30 = HEAP32[i17 >> 2] | 0;
    i17 = HEAP32[i17 + 4 >> 2] | 0;
    i29 = i1;
    HEAP32[i29 >> 2] = i30;
    HEAP32[i29 + 4 >> 2] = i17;
    i29 = i32 + 228 | 0;
    HEAP32[i29 >> 2] = i30;
    HEAP32[i29 + 4 >> 2] = i17;
    HEAPF32[i32 + 236 >> 2] = -(HEAP32[tempDoublePtr >> 2] = i30, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   } else {
    HEAPF32[i1 >> 2] = -d5;
    HEAPF32[i32 + 216 >> 2] = d27;
    i17 = i25;
    i29 = HEAP32[i17 + 4 >> 2] | 0;
    i30 = i32 + 228 | 0;
    HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
    HEAP32[i30 + 4 >> 2] = i29;
    d27 = -+HEAPF32[i32 + 192 >> 2];
    HEAPF32[i32 + 236 >> 2] = -+HEAPF32[i32 + 188 >> 2];
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   }
  }
 } else {
  d4 = d13 - d22;
  d7 = d14 - d19;
  d3 = +Math_sqrt(+(d4 * d4 + d7 * d7));
  if (!(d3 < 1.1920928955078125e-007)) {
   d14 = 1.0 / d3;
   d4 = d4 * d14;
   d7 = d7 * d14;
  }
  d3 = -d4;
  HEAPF32[i32 + 204 >> 2] = d7;
  HEAPF32[i32 + 208 >> 2] = d3;
  i6 = d27 * d7 - d5 * d4 > 0.0;
  d3 = (d23 - d22) * d7 + (d24 - d19) * d3;
  if (!i2) {
   i2 = d18 >= 0.0;
   i1 = d3 >= 0.0;
   if (i6) {
    i30 = i2 | i1;
    HEAP8[i32 + 248 >> 0] = i30 & 1;
    i1 = i32 + 212 | 0;
    if (i30) {
     i30 = i25;
     i17 = HEAP32[i30 >> 2] | 0;
     i30 = HEAP32[i30 + 4 >> 2] | 0;
     i29 = i1;
     HEAP32[i29 >> 2] = i17;
     HEAP32[i29 + 4 >> 2] = i30;
     HEAPF32[i32 + 228 >> 2] = -(HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
     HEAPF32[i32 + 232 >> 2] = d27;
     i17 = i32 + 204 | 0;
     i29 = HEAP32[i17 + 4 >> 2] | 0;
     i30 = i32 + 236 | 0;
     HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
     HEAP32[i30 + 4 >> 2] = i29;
     break;
    } else {
     d24 = -d5;
     HEAPF32[i1 >> 2] = d24;
     HEAPF32[i32 + 216 >> 2] = d27;
     HEAPF32[i32 + 228 >> 2] = d24;
     HEAPF32[i32 + 232 >> 2] = d27;
     i17 = i25;
     i29 = HEAP32[i17 + 4 >> 2] | 0;
     i30 = i32 + 236 | 0;
     HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
     HEAP32[i30 + 4 >> 2] = i29;
     break;
    }
   } else {
    i30 = i2 & i1;
    HEAP8[i32 + 248 >> 0] = i30 & 1;
    i1 = i32 + 212 | 0;
    if (i30) {
     i29 = i25;
     i17 = HEAP32[i29 >> 2] | 0;
     i29 = HEAP32[i29 + 4 >> 2] | 0;
     i30 = i1;
     HEAP32[i30 >> 2] = i17;
     HEAP32[i30 + 4 >> 2] = i29;
     HEAPF32[i32 + 228 >> 2] = -(HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
     HEAPF32[i32 + 232 >> 2] = d27;
     i30 = i32 + 236 | 0;
     HEAP32[i30 >> 2] = i17;
     HEAP32[i30 + 4 >> 2] = i29;
     break;
    } else {
     HEAPF32[i1 >> 2] = -d5;
     HEAPF32[i32 + 216 >> 2] = d27;
     d27 = -+HEAPF32[i32 + 208 >> 2];
     HEAPF32[i32 + 228 >> 2] = -+HEAPF32[i32 + 204 >> 2];
     HEAPF32[i32 + 232 >> 2] = d27;
     i17 = i25;
     i29 = HEAP32[i17 + 4 >> 2] | 0;
     i30 = i32 + 236 | 0;
     HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
     HEAP32[i30 + 4 >> 2] = i29;
     break;
    }
   }
  }
  if (i8 & i6) {
   i30 = d18 >= 0.0 | d9 >= 0.0 | d3 >= 0.0;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (i30) {
    i17 = i25;
    i29 = HEAP32[i17 + 4 >> 2] | 0;
    i30 = i1;
    HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
    HEAP32[i30 + 4 >> 2] = i29;
    i30 = i32 + 188 | 0;
    i29 = HEAP32[i30 + 4 >> 2] | 0;
    i17 = i32 + 228 | 0;
    HEAP32[i17 >> 2] = HEAP32[i30 >> 2];
    HEAP32[i17 + 4 >> 2] = i29;
    i17 = i32 + 204 | 0;
    i29 = HEAP32[i17 + 4 >> 2] | 0;
    i30 = i32 + 236 | 0;
    HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
    HEAP32[i30 + 4 >> 2] = i29;
    break;
   } else {
    d24 = -d5;
    HEAPF32[i1 >> 2] = d24;
    HEAPF32[i32 + 216 >> 2] = d27;
    HEAPF32[i32 + 228 >> 2] = d24;
    HEAPF32[i32 + 232 >> 2] = d27;
    HEAPF32[i32 + 236 >> 2] = d24;
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   }
  }
  if (i8) {
   if (!(d9 >= 0.0)) {
    i30 = d18 >= 0.0 & d3 >= 0.0;
    HEAP8[i32 + 248 >> 0] = i30 & 1;
    i1 = i32 + 212 | 0;
    if (!i30) {
     d24 = -d5;
     HEAPF32[i1 >> 2] = d24;
     HEAPF32[i32 + 216 >> 2] = d27;
     HEAPF32[i32 + 228 >> 2] = -d7;
     HEAPF32[i32 + 232 >> 2] = d4;
     HEAPF32[i32 + 236 >> 2] = d24;
     HEAPF32[i32 + 240 >> 2] = d27;
     break;
    }
   } else {
    HEAP8[i32 + 248 >> 0] = 1;
    i1 = i32 + 212 | 0;
   }
   i17 = i25;
   i29 = HEAP32[i17 + 4 >> 2] | 0;
   i30 = i1;
   HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
   HEAP32[i30 + 4 >> 2] = i29;
   i30 = i32 + 188 | 0;
   i29 = HEAP32[i30 + 4 >> 2] | 0;
   i17 = i32 + 228 | 0;
   HEAP32[i17 >> 2] = HEAP32[i30 >> 2];
   HEAP32[i17 + 4 >> 2] = i29;
   i17 = i25;
   i29 = HEAP32[i17 + 4 >> 2] | 0;
   i30 = i32 + 236 | 0;
   HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
   HEAP32[i30 + 4 >> 2] = i29;
   break;
  }
  if (!i6) {
   i30 = d18 >= 0.0 & d9 >= 0.0 & d3 >= 0.0;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (i30) {
    i29 = i25;
    i17 = HEAP32[i29 >> 2] | 0;
    i29 = HEAP32[i29 + 4 >> 2] | 0;
    i30 = i1;
    HEAP32[i30 >> 2] = i17;
    HEAP32[i30 + 4 >> 2] = i29;
    i30 = i32 + 228 | 0;
    HEAP32[i30 >> 2] = i17;
    HEAP32[i30 + 4 >> 2] = i29;
    i30 = i32 + 236 | 0;
    HEAP32[i30 >> 2] = i17;
    HEAP32[i30 + 4 >> 2] = i29;
    break;
   } else {
    HEAPF32[i1 >> 2] = -d5;
    HEAPF32[i32 + 216 >> 2] = d27;
    HEAPF32[i32 + 228 >> 2] = -d7;
    HEAPF32[i32 + 232 >> 2] = d4;
    d27 = -+HEAPF32[i32 + 192 >> 2];
    HEAPF32[i32 + 236 >> 2] = -+HEAPF32[i32 + 188 >> 2];
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   }
  }
  if (!(d3 >= 0.0)) {
   i30 = d18 >= 0.0 & d9 >= 0.0;
   HEAP8[i32 + 248 >> 0] = i30 & 1;
   i1 = i32 + 212 | 0;
   if (!i30) {
    d24 = -d5;
    HEAPF32[i1 >> 2] = d24;
    HEAPF32[i32 + 216 >> 2] = d27;
    HEAPF32[i32 + 228 >> 2] = d24;
    HEAPF32[i32 + 232 >> 2] = d27;
    d27 = -+HEAPF32[i32 + 192 >> 2];
    HEAPF32[i32 + 236 >> 2] = -+HEAPF32[i32 + 188 >> 2];
    HEAPF32[i32 + 240 >> 2] = d27;
    break;
   }
  } else {
   HEAP8[i32 + 248 >> 0] = 1;
   i1 = i32 + 212 | 0;
  }
  i17 = i25;
  i29 = HEAP32[i17 + 4 >> 2] | 0;
  i30 = i1;
  HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
  HEAP32[i30 + 4 >> 2] = i29;
  i30 = i25;
  i29 = HEAP32[i30 + 4 >> 2] | 0;
  i17 = i32 + 228 | 0;
  HEAP32[i17 >> 2] = HEAP32[i30 >> 2];
  HEAP32[i17 + 4 >> 2] = i29;
  i17 = i32 + 204 | 0;
  i29 = HEAP32[i17 + 4 >> 2] | 0;
  i30 = i32 + 236 | 0;
  HEAP32[i30 >> 2] = HEAP32[i17 >> 2];
  HEAP32[i30 + 4 >> 2] = i29;
 } while (0);
 i2 = i35 + 148 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i8 = i32 + 128 | 0;
 HEAP32[i8 >> 2] = i1;
 if ((i1 | 0) > 0) {
  i1 = 0;
  do {
   d19 = +HEAPF32[i39 >> 2];
   d27 = +HEAPF32[i35 + 20 + (i1 << 3) >> 2];
   d23 = +HEAPF32[i38 >> 2];
   d22 = +HEAPF32[i35 + 20 + (i1 << 3) + 4 >> 2];
   d24 = d27 * d23 + d19 * d22 + +HEAPF32[i37 >> 2];
   HEAPF32[i32 + (i1 << 3) >> 2] = +HEAPF32[i36 >> 2] + (d19 * d27 - d23 * d22);
   HEAPF32[i32 + (i1 << 3) + 4 >> 2] = d24;
   d24 = +HEAPF32[i39 >> 2];
   d22 = +HEAPF32[i35 + 84 + (i1 << 3) >> 2];
   d23 = +HEAPF32[i38 >> 2];
   d27 = +HEAPF32[i35 + 84 + (i1 << 3) + 4 >> 2];
   HEAPF32[i32 + 64 + (i1 << 3) >> 2] = d24 * d22 - d23 * d27;
   HEAPF32[i32 + 64 + (i1 << 3) + 4 >> 2] = d22 * d23 + d24 * d27;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < (HEAP32[i2 >> 2] | 0));
  i1 = HEAP32[i8 >> 2] | 0;
 }
 i29 = i32 + 244 | 0;
 HEAPF32[i29 >> 2] = .019999999552965164;
 i30 = i41 + 60 | 0;
 HEAP32[i30 >> 2] = 0;
 i15 = i32 + 248 | 0;
 if ((i1 | 0) <= 0) {
  STACKTOP = i42;
  return;
 }
 d4 = +HEAPF32[i32 + 164 >> 2];
 d5 = +HEAPF32[i20 >> 2];
 d7 = +HEAPF32[i32 + 212 >> 2];
 d9 = +HEAPF32[i32 + 216 >> 2];
 d3 = 34028234663852886.0e22;
 i2 = 0;
 do {
  d27 = d7 * (+HEAPF32[i32 + (i2 << 3) >> 2] - d4) + d9 * (+HEAPF32[i32 + (i2 << 3) + 4 >> 2] - d5);
  d3 = d27 < d3 ? d27 : d3;
  i2 = i2 + 1 | 0;
 } while ((i2 | 0) != (i1 | 0));
 if (d3 > .019999999552965164) {
  STACKTOP = i42;
  return;
 }
 __ZN12b2EPCollider24ComputePolygonSeparationEv(i16, i32);
 i2 = HEAP32[i16 >> 2] | 0;
 if (i2) {
  d4 = +HEAPF32[i16 + 8 >> 2];
  if (d4 > +HEAPF32[i29 >> 2]) {
   STACKTOP = i42;
   return;
  }
  if (d4 > d3 * .9800000190734863 + 1.0000000474974513e-003) {
   i6 = HEAP32[i16 + 4 >> 2] | 0;
   i1 = i41 + 56 | 0;
   if ((i2 | 0) == 1) i31 = 60; else {
    HEAP32[i1 >> 2] = 2;
    i17 = i26;
    i11 = HEAP32[i17 >> 2] | 0;
    i17 = HEAP32[i17 + 4 >> 2] | 0;
    i15 = i33;
    HEAP32[i15 >> 2] = i11;
    HEAP32[i15 + 4 >> 2] = i17;
    i15 = i33 + 8 | 0;
    HEAP8[i15 >> 0] = 0;
    i20 = i6 & 255;
    HEAP8[i15 + 1 >> 0] = i20;
    HEAP8[i15 + 2 >> 0] = 0;
    HEAP8[i15 + 3 >> 0] = 1;
    i15 = i33 + 12 | 0;
    i1 = i28;
    i16 = HEAP32[i1 >> 2] | 0;
    i1 = HEAP32[i1 + 4 >> 2] | 0;
    i21 = i15;
    HEAP32[i21 >> 2] = i16;
    HEAP32[i21 + 4 >> 2] = i1;
    i21 = i33 + 20 | 0;
    HEAP8[i21 >> 0] = 0;
    HEAP8[i21 + 1 >> 0] = i20;
    HEAP8[i21 + 2 >> 0] = 0;
    HEAP8[i21 + 3 >> 0] = 1;
    i21 = i6 + 1 | 0;
    i21 = (i21 | 0) < (HEAP32[i8 >> 2] | 0) ? i21 : 0;
    d3 = (HEAP32[tempDoublePtr >> 2] = i11, +HEAPF32[tempDoublePtr >> 2]);
    d4 = (HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
    d5 = (HEAP32[tempDoublePtr >> 2] = i16, +HEAPF32[tempDoublePtr >> 2]);
    i16 = i32 + (i21 << 3) + 4 | 0;
    i17 = i32 + (i21 << 3) | 0;
    i11 = i32 + (i6 << 3) + 4 | 0;
    i2 = i32 + (i6 << 3) | 0;
    i28 = 0;
    i26 = HEAP32[i32 + 64 + (i6 << 3) + 4 >> 2] | 0;
    i25 = HEAP32[i32 + 64 + (i6 << 3) >> 2] | 0;
    d10 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
    i8 = i20;
    i21 = i21 & 255;
   }
  } else i31 = 58;
 } else i31 = 58;
 if ((i31 | 0) == 58) {
  i1 = i41 + 56 | 0;
  i31 = 60;
 }
 do if ((i31 | 0) == 60) {
  HEAP32[i1 >> 2] = 1;
  i8 = HEAP32[i8 >> 2] | 0;
  if ((i8 | 0) > 1) {
   d3 = +HEAPF32[i32 + 212 >> 2];
   d4 = +HEAPF32[i32 + 216 >> 2];
   i1 = 0;
   d7 = d3 * +HEAPF32[i32 + 64 >> 2] + d4 * +HEAPF32[i32 + 68 >> 2];
   i6 = 1;
   while (1) {
    d5 = d3 * +HEAPF32[i32 + 64 + (i6 << 3) >> 2] + d4 * +HEAPF32[i32 + 64 + (i6 << 3) + 4 >> 2];
    i2 = d5 < d7;
    i1 = i2 ? i6 : i1;
    i6 = i6 + 1 | 0;
    if ((i6 | 0) >= (i8 | 0)) break; else d7 = i2 ? d5 : d7;
   }
  } else i1 = 0;
  i2 = i1 + 1 | 0;
  i2 = (i2 | 0) < (i8 | 0) ? i2 : 0;
  i17 = i32 + (i1 << 3) | 0;
  i16 = HEAP32[i17 >> 2] | 0;
  i17 = HEAP32[i17 + 4 >> 2] | 0;
  i31 = i33;
  HEAP32[i31 >> 2] = i16;
  HEAP32[i31 + 4 >> 2] = i17;
  i31 = i33 + 8 | 0;
  HEAP8[i31 >> 0] = 0;
  i8 = i1 & 255;
  HEAP8[i31 + 1 >> 0] = i8;
  HEAP8[i31 + 2 >> 0] = 1;
  HEAP8[i31 + 3 >> 0] = 0;
  i1 = i33 + 12 | 0;
  i32 = i32 + (i2 << 3) | 0;
  i31 = HEAP32[i32 >> 2] | 0;
  i32 = HEAP32[i32 + 4 >> 2] | 0;
  i6 = i1;
  HEAP32[i6 >> 2] = i31;
  HEAP32[i6 + 4 >> 2] = i32;
  i6 = i33 + 20 | 0;
  HEAP8[i6 >> 0] = 0;
  HEAP8[i6 + 1 >> 0] = i2;
  HEAP8[i6 + 2 >> 0] = 1;
  HEAP8[i6 + 3 >> 0] = 0;
  d3 = (HEAP32[tempDoublePtr >> 2] = i16, +HEAPF32[tempDoublePtr >> 2]);
  d4 = (HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
  d5 = (HEAP32[tempDoublePtr >> 2] = i31, +HEAPF32[tempDoublePtr >> 2]);
  d7 = (HEAP32[tempDoublePtr >> 2] = i32, +HEAPF32[tempDoublePtr >> 2]);
  if (!(HEAP8[i15 >> 0] | 0)) {
   i25 = (HEAPF32[tempDoublePtr >> 2] = -+HEAPF32[i25 >> 2], HEAP32[tempDoublePtr >> 2] | 0);
   i16 = i20;
   i17 = i26;
   i2 = i28;
   i15 = i1;
   i28 = 1;
   i26 = (HEAPF32[tempDoublePtr >> 2] = -+HEAPF32[i21 >> 2], HEAP32[tempDoublePtr >> 2] | 0);
   d10 = d7;
   i6 = 1;
   i21 = 0;
   break;
  } else {
   i16 = i11;
   i17 = i28;
   i11 = i20;
   i2 = i26;
   i15 = i1;
   i28 = 1;
   i26 = HEAP32[i21 >> 2] | 0;
   i25 = HEAP32[i25 >> 2] | 0;
   d10 = d7;
   i6 = 0;
   i21 = 1;
   break;
  }
 } while (0);
 i20 = HEAP32[i2 >> 2] | 0;
 i11 = HEAP32[i11 >> 2] | 0;
 d14 = (HEAP32[tempDoublePtr >> 2] = i26, +HEAPF32[tempDoublePtr >> 2]);
 d18 = (HEAP32[tempDoublePtr >> 2] = i25, +HEAPF32[tempDoublePtr >> 2]);
 d27 = -d18;
 d19 = (HEAP32[tempDoublePtr >> 2] = i20, +HEAPF32[tempDoublePtr >> 2]);
 d22 = (HEAP32[tempDoublePtr >> 2] = i11, +HEAPF32[tempDoublePtr >> 2]);
 d9 = d14 * d19 + d22 * d27;
 d13 = -d14;
 d12 = +HEAPF32[i17 >> 2] * d13 + d18 * +HEAPF32[i16 >> 2];
 d7 = d14 * d3 + d4 * d27 - d9;
 d9 = d14 * d5 + d10 * d27 - d9;
 if (!(d7 <= 0.0)) i1 = 0; else {
  HEAP32[i34 >> 2] = HEAP32[i33 >> 2];
  HEAP32[i34 + 4 >> 2] = HEAP32[i33 + 4 >> 2];
  HEAP32[i34 + 8 >> 2] = HEAP32[i33 + 8 >> 2];
  i1 = 1;
 }
 if (d9 <= 0.0) {
  i33 = i34 + (i1 * 12 | 0) | 0;
  HEAP32[i33 >> 2] = HEAP32[i15 >> 2];
  HEAP32[i33 + 4 >> 2] = HEAP32[i15 + 4 >> 2];
  HEAP32[i33 + 8 >> 2] = HEAP32[i15 + 8 >> 2];
  i1 = i1 + 1 | 0;
 }
 if (d7 * d9 < 0.0) {
  d27 = d7 / (d7 - d9);
  HEAPF32[i34 + (i1 * 12 | 0) >> 2] = d3 + d27 * (d5 - d3);
  HEAPF32[i34 + (i1 * 12 | 0) + 4 >> 2] = d4 + d27 * (d10 - d4);
  i33 = i34 + (i1 * 12 | 0) + 8 | 0;
  HEAP8[i33 >> 0] = i6;
  HEAP8[i33 + 1 >> 0] = i8;
  HEAP8[i33 + 2 >> 0] = 0;
  HEAP8[i33 + 3 >> 0] = 1;
  i1 = i1 + 1 | 0;
 }
 if ((i1 | 0) < 2) {
  STACKTOP = i42;
  return;
 }
 d4 = +HEAPF32[i34 >> 2];
 d5 = +HEAPF32[i34 + 4 >> 2];
 d7 = d4 * d13 + d18 * d5 - d12;
 i2 = i34 + 12 | 0;
 d9 = +HEAPF32[i2 >> 2];
 d10 = +HEAPF32[i34 + 16 >> 2];
 d3 = d9 * d13 + d18 * d10 - d12;
 if (!(d7 <= 0.0)) i1 = 0; else {
  HEAP32[i40 >> 2] = HEAP32[i34 >> 2];
  HEAP32[i40 + 4 >> 2] = HEAP32[i34 + 4 >> 2];
  HEAP32[i40 + 8 >> 2] = HEAP32[i34 + 8 >> 2];
  i1 = 1;
 }
 if (d3 <= 0.0) {
  i33 = i40 + (i1 * 12 | 0) | 0;
  HEAP32[i33 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i33 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
  HEAP32[i33 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
  i1 = i1 + 1 | 0;
 }
 if (d7 * d3 < 0.0) {
  d27 = d7 / (d7 - d3);
  HEAPF32[i40 + (i1 * 12 | 0) >> 2] = d4 + d27 * (d9 - d4);
  HEAPF32[i40 + (i1 * 12 | 0) + 4 >> 2] = d5 + d27 * (d10 - d5);
  i33 = i40 + (i1 * 12 | 0) + 8 | 0;
  HEAP8[i33 >> 0] = i21;
  HEAP8[i33 + 1 >> 0] = HEAP8[i34 + 8 + 1 >> 0] | 0;
  HEAP8[i33 + 2 >> 0] = 0;
  HEAP8[i33 + 3 >> 0] = 1;
  i1 = i1 + 1 | 0;
 }
 if ((i1 | 0) < 2) {
  STACKTOP = i42;
  return;
 }
 i1 = i41 + 40 | 0;
 if (i28) {
  HEAP32[i1 >> 2] = i25;
  HEAP32[i41 + 44 >> 2] = i26;
  HEAP32[i41 + 48 >> 2] = i20;
  HEAP32[i41 + 52 >> 2] = i11;
 } else {
  i32 = i35 + 84 + (i6 << 3) | 0;
  i34 = HEAP32[i32 + 4 >> 2] | 0;
  i33 = i1;
  HEAP32[i33 >> 2] = HEAP32[i32 >> 2];
  HEAP32[i33 + 4 >> 2] = i34;
  i33 = i35 + 20 + (i6 << 3) | 0;
  i34 = HEAP32[i33 + 4 >> 2] | 0;
  i35 = i41 + 48 | 0;
  HEAP32[i35 >> 2] = HEAP32[i33 >> 2];
  HEAP32[i35 + 4 >> 2] = i34;
 }
 d3 = +HEAPF32[i40 >> 2];
 d4 = +HEAPF32[i40 + 4 >> 2];
 d5 = +HEAPF32[i29 >> 2];
 if (!(d18 * (d3 - d19) + d14 * (d4 - d22) <= d5)) i1 = 0; else {
  if (i28) {
   d24 = d3 - +HEAPF32[i36 >> 2];
   d23 = d4 - +HEAPF32[i37 >> 2];
   d13 = +HEAPF32[i39 >> 2];
   d27 = +HEAPF32[i38 >> 2];
   HEAPF32[i41 >> 2] = d24 * d13 + d23 * d27;
   HEAPF32[i41 + 4 >> 2] = d13 * d23 - d24 * d27;
   HEAP32[i41 + 16 >> 2] = HEAP32[i40 + 8 >> 2];
  } else {
   i33 = i40;
   i35 = HEAP32[i33 + 4 >> 2] | 0;
   i34 = i41;
   HEAP32[i34 >> 2] = HEAP32[i33 >> 2];
   HEAP32[i34 + 4 >> 2] = i35;
   i34 = i40 + 8 | 0;
   i35 = i41 + 16 | 0;
   HEAP8[i35 + 2 >> 0] = HEAP8[i34 + 3 >> 0] | 0;
   HEAP8[i35 + 3 >> 0] = HEAP8[i34 + 2 >> 0] | 0;
   HEAP8[i35 >> 0] = HEAP8[i34 + 1 >> 0] | 0;
   HEAP8[i35 + 1 >> 0] = HEAP8[i34 >> 0] | 0;
  }
  d5 = +HEAPF32[i29 >> 2];
  i1 = 1;
 }
 i6 = i40 + 12 | 0;
 d3 = +HEAPF32[i6 >> 2];
 d4 = +HEAPF32[i40 + 16 >> 2];
 if (d18 * (d3 - d19) + d14 * (d4 - d22) <= d5) {
  i2 = i41 + (i1 * 20 | 0) | 0;
  if (i28) {
   d24 = d3 - +HEAPF32[i36 >> 2];
   d23 = d4 - +HEAPF32[i37 >> 2];
   d22 = +HEAPF32[i39 >> 2];
   d27 = +HEAPF32[i38 >> 2];
   HEAPF32[i2 >> 2] = d24 * d22 + d23 * d27;
   HEAPF32[i41 + (i1 * 20 | 0) + 4 >> 2] = d22 * d23 - d24 * d27;
   HEAP32[i41 + (i1 * 20 | 0) + 16 >> 2] = HEAP32[i40 + 20 >> 2];
  } else {
   i37 = i6;
   i38 = HEAP32[i37 + 4 >> 2] | 0;
   i39 = i2;
   HEAP32[i39 >> 2] = HEAP32[i37 >> 2];
   HEAP32[i39 + 4 >> 2] = i38;
   i40 = i40 + 20 | 0;
   i41 = i41 + (i1 * 20 | 0) + 16 | 0;
   HEAP8[i41 + 2 >> 0] = HEAP8[i40 + 3 >> 0] | 0;
   HEAP8[i41 + 3 >> 0] = HEAP8[i40 + 2 >> 0] | 0;
   HEAP8[i41 >> 0] = HEAP8[i40 + 1 >> 0] | 0;
   HEAP8[i41 + 1 >> 0] = HEAP8[i40 >> 0] | 0;
  }
  i1 = i1 + 1 | 0;
 }
 HEAP32[i30 >> 2] = i1;
 STACKTOP = i42;
 return;
}

function __ZNSt3__16__sortIRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i2, i1, i13) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i13 = i13 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0;
 L1 : while (1) {
  i10 = i1;
  i11 = i1 + -8 | 0;
  L3 : while (1) {
   i9 = i2;
   i3 = i10 - i9 | 0;
   i4 = i3 >> 3;
   switch (i4 | 0) {
   case 2:
    {
     i3 = i11;
     i1 = i11;
     i12 = 4;
     break L1;
    }
   case 3:
    {
     i7 = i11;
     i6 = i11;
     i12 = 6;
     break L1;
    }
   case 4:
    {
     i1 = i11;
     i12 = 14;
     break L1;
    }
   case 5:
    {
     i6 = i11;
     i5 = i11;
     i12 = 15;
     break L1;
    }
   case 1:
   case 0:
    {
     i12 = 69;
     break L1;
    }
   default:
    {}
   }
   if ((i3 | 0) < 248) {
    i12 = 21;
    break L1;
   }
   i5 = (i4 | 0) / 2 | 0;
   i8 = i2 + (i5 << 3) | 0;
   do if ((i3 | 0) > 7992) {
    i3 = (i4 | 0) / 4 | 0;
    i6 = i2 + (i3 << 3) | 0;
    i3 = i2 + (i3 + i5 << 3) | 0;
    i4 = __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i2, i6, i8, i3, i13) | 0;
    if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i11, i3) | 0) {
     i7 = i3;
     i14 = HEAP32[i7 >> 2] | 0;
     i7 = HEAP32[i7 + 4 >> 2] | 0;
     i16 = i11;
     i15 = HEAP32[i16 + 4 >> 2] | 0;
     i5 = i3;
     HEAP32[i5 >> 2] = HEAP32[i16 >> 2];
     HEAP32[i5 + 4 >> 2] = i15;
     i5 = i11;
     HEAP32[i5 >> 2] = i14;
     HEAP32[i5 + 4 >> 2] = i7;
     i5 = i4 + 1 | 0;
     if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i3, i8) | 0) {
      i16 = i8;
      i15 = HEAP32[i16 >> 2] | 0;
      i16 = HEAP32[i16 + 4 >> 2] | 0;
      i5 = i3;
      i7 = HEAP32[i5 + 4 >> 2] | 0;
      i14 = i8;
      HEAP32[i14 >> 2] = HEAP32[i5 >> 2];
      HEAP32[i14 + 4 >> 2] = i7;
      HEAP32[i3 >> 2] = i15;
      HEAP32[i3 + 4 >> 2] = i16;
      i3 = i4 + 2 | 0;
      if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i8, i6) | 0) {
       i15 = i6;
       i14 = HEAP32[i15 >> 2] | 0;
       i15 = HEAP32[i15 + 4 >> 2] | 0;
       i5 = i8;
       i7 = HEAP32[i5 + 4 >> 2] | 0;
       i16 = i6;
       HEAP32[i16 >> 2] = HEAP32[i5 >> 2];
       HEAP32[i16 + 4 >> 2] = i7;
       i16 = i8;
       HEAP32[i16 >> 2] = i14;
       HEAP32[i16 + 4 >> 2] = i15;
       if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i6, i2) | 0) {
        i15 = i2;
        i14 = HEAP32[i15 >> 2] | 0;
        i15 = HEAP32[i15 + 4 >> 2] | 0;
        i5 = i6;
        i7 = HEAP32[i5 + 4 >> 2] | 0;
        i16 = i2;
        HEAP32[i16 >> 2] = HEAP32[i5 >> 2];
        HEAP32[i16 + 4 >> 2] = i7;
        i16 = i6;
        HEAP32[i16 >> 2] = i14;
        HEAP32[i16 + 4 >> 2] = i15;
        i4 = i4 + 4 | 0;
       } else i4 = i4 + 3 | 0;
      } else i4 = i3;
     } else i4 = i5;
    }
   } else {
    i16 = FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i8, i2) | 0;
    i3 = FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i11, i8) | 0;
    if (!i16) {
     if (!i3) {
      i4 = 0;
      break;
     }
     i15 = i8;
     i14 = HEAP32[i15 >> 2] | 0;
     i15 = HEAP32[i15 + 4 >> 2] | 0;
     i6 = i11;
     i7 = HEAP32[i6 + 4 >> 2] | 0;
     i16 = i8;
     HEAP32[i16 >> 2] = HEAP32[i6 >> 2];
     HEAP32[i16 + 4 >> 2] = i7;
     i16 = i11;
     HEAP32[i16 >> 2] = i14;
     HEAP32[i16 + 4 >> 2] = i15;
     if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i8, i2) | 0)) {
      i4 = 1;
      break;
     }
     i16 = i2;
     i15 = HEAP32[i16 >> 2] | 0;
     i16 = HEAP32[i16 + 4 >> 2] | 0;
     i7 = i8;
     i14 = HEAP32[i7 + 4 >> 2] | 0;
     i4 = i2;
     HEAP32[i4 >> 2] = HEAP32[i7 >> 2];
     HEAP32[i4 + 4 >> 2] = i14;
     i4 = i8;
     HEAP32[i4 >> 2] = i15;
     HEAP32[i4 + 4 >> 2] = i16;
     i4 = 2;
     break;
    }
    i5 = i2;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if (i3) {
     i14 = i11;
     i15 = HEAP32[i14 + 4 >> 2] | 0;
     i16 = i2;
     HEAP32[i16 >> 2] = HEAP32[i14 >> 2];
     HEAP32[i16 + 4 >> 2] = i15;
     i16 = i11;
     HEAP32[i16 >> 2] = i4;
     HEAP32[i16 + 4 >> 2] = i5;
     i4 = 1;
     break;
    }
    i14 = i8;
    i15 = HEAP32[i14 + 4 >> 2] | 0;
    i16 = i2;
    HEAP32[i16 >> 2] = HEAP32[i14 >> 2];
    HEAP32[i16 + 4 >> 2] = i15;
    i16 = i8;
    HEAP32[i16 >> 2] = i4;
    HEAP32[i16 + 4 >> 2] = i5;
    if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i11, i8) | 0) {
     i16 = i8;
     i15 = HEAP32[i16 >> 2] | 0;
     i16 = HEAP32[i16 + 4 >> 2] | 0;
     i7 = i11;
     i14 = HEAP32[i7 + 4 >> 2] | 0;
     i4 = i8;
     HEAP32[i4 >> 2] = HEAP32[i7 >> 2];
     HEAP32[i4 + 4 >> 2] = i14;
     i4 = i11;
     HEAP32[i4 >> 2] = i15;
     HEAP32[i4 + 4 >> 2] = i16;
     i4 = 2;
    } else i4 = 1;
   } while (0);
   do if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i2, i8) | 0) i5 = i11; else {
    i3 = i11;
    while (1) {
     i3 = i3 + -8 | 0;
     if ((i2 | 0) == (i3 | 0)) break;
     if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i3, i8) | 0) {
      i12 = 51;
      break;
     }
    }
    if ((i12 | 0) == 51) {
     i12 = 0;
     i16 = i2;
     i15 = HEAP32[i16 >> 2] | 0;
     i16 = HEAP32[i16 + 4 >> 2] | 0;
     i7 = i3;
     i14 = HEAP32[i7 + 4 >> 2] | 0;
     i5 = i2;
     HEAP32[i5 >> 2] = HEAP32[i7 >> 2];
     HEAP32[i5 + 4 >> 2] = i14;
     i5 = i3;
     HEAP32[i5 >> 2] = i15;
     HEAP32[i5 + 4 >> 2] = i16;
     i5 = i3;
     i4 = i4 + 1 | 0;
     break;
    }
    i3 = i2 + 8 | 0;
    if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i2, i11) | 0)) {
     if ((i3 | 0) == (i11 | 0)) {
      i12 = 69;
      break L1;
     } else i4 = i2;
     while (1) {
      if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i2, i3) | 0) break;
      i4 = i3 + 8 | 0;
      if ((i4 | 0) == (i11 | 0)) {
       i12 = 69;
       break L1;
      } else {
       i16 = i3;
       i3 = i4;
       i4 = i16;
      }
     }
     i16 = i3;
     i15 = HEAP32[i16 >> 2] | 0;
     i16 = HEAP32[i16 + 4 >> 2] | 0;
     i9 = i11;
     i14 = HEAP32[i9 + 4 >> 2] | 0;
     HEAP32[i3 >> 2] = HEAP32[i9 >> 2];
     HEAP32[i3 + 4 >> 2] = i14;
     i3 = i11;
     HEAP32[i3 >> 2] = i15;
     HEAP32[i3 + 4 >> 2] = i16;
     i3 = i4 + 16 | 0;
    }
    if ((i3 | 0) == (i11 | 0)) {
     i12 = 69;
     break L1;
    } else i4 = i11;
    while (1) {
     i5 = i3;
     while (1) {
      i3 = i5 + 8 | 0;
      if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i2, i5) | 0) break; else i5 = i3;
     }
     do i4 = i4 + -8 | 0; while (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i2, i4) | 0);
     if (i5 >>> 0 >= i4 >>> 0) {
      i2 = i5;
      continue L3;
     }
     i15 = i5;
     i14 = HEAP32[i15 >> 2] | 0;
     i15 = HEAP32[i15 + 4 >> 2] | 0;
     i8 = i4;
     i9 = HEAP32[i8 + 4 >> 2] | 0;
     i16 = i5;
     HEAP32[i16 >> 2] = HEAP32[i8 >> 2];
     HEAP32[i16 + 4 >> 2] = i9;
     i16 = i4;
     HEAP32[i16 >> 2] = i14;
     HEAP32[i16 + 4 >> 2] = i15;
    }
   } while (0);
   i3 = i2 + 8 | 0;
   L48 : do if (i3 >>> 0 < i5 >>> 0) {
    i7 = i5;
    while (1) {
     i5 = i3;
     while (1) {
      i3 = i5 + 8 | 0;
      if (FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i5, i8) | 0) i5 = i3; else {
       i6 = i5;
       break;
      }
     }
     i5 = i7;
     do i5 = i5 + -8 | 0; while (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i5, i8) | 0));
     if (i6 >>> 0 > i5 >>> 0) {
      i3 = i6;
      i5 = i8;
      break L48;
     }
     i16 = i6;
     i15 = HEAP32[i16 >> 2] | 0;
     i16 = HEAP32[i16 + 4 >> 2] | 0;
     i17 = i5;
     i14 = HEAP32[i17 + 4 >> 2] | 0;
     i7 = i6;
     HEAP32[i7 >> 2] = HEAP32[i17 >> 2];
     HEAP32[i7 + 4 >> 2] = i14;
     i7 = i5;
     HEAP32[i7 >> 2] = i15;
     HEAP32[i7 + 4 >> 2] = i16;
     i7 = i5;
     i8 = (i8 | 0) == (i6 | 0) ? i5 : i8;
     i4 = i4 + 1 | 0;
    }
   } else i5 = i8; while (0);
   if ((i3 | 0) != (i5 | 0) ? FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i5, i3) | 0 : 0) {
    i16 = i3;
    i15 = HEAP32[i16 >> 2] | 0;
    i16 = HEAP32[i16 + 4 >> 2] | 0;
    i8 = i5;
    i14 = HEAP32[i8 + 4 >> 2] | 0;
    i17 = i3;
    HEAP32[i17 >> 2] = HEAP32[i8 >> 2];
    HEAP32[i17 + 4 >> 2] = i14;
    i17 = i5;
    HEAP32[i17 >> 2] = i15;
    HEAP32[i17 + 4 >> 2] = i16;
    i4 = i4 + 1 | 0;
   }
   if (!i4) {
    i4 = __ZNSt3__127__insertion_sort_incompleteIRPFbRK6b2PairS3_EPS1_EEbT0_S8_T_(i2, i3, i13) | 0;
    i5 = i3 + 8 | 0;
    if (__ZNSt3__127__insertion_sort_incompleteIRPFbRK6b2PairS3_EPS1_EEbT0_S8_T_(i5, i1, i13) | 0) {
     i12 = 64;
     break;
    }
    if (i4) {
     i2 = i5;
     continue;
    }
   }
   i17 = i3;
   if ((i17 - i9 | 0) >= (i10 - i17 | 0)) {
    i12 = 68;
    break;
   }
   __ZNSt3__16__sortIRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i2, i3, i13);
   i2 = i3 + 8 | 0;
  }
  if ((i12 | 0) == 64) {
   i12 = 0;
   if (i4) {
    i12 = 69;
    break;
   } else {
    i1 = i3;
    continue;
   }
  } else if ((i12 | 0) == 68) {
   i12 = 0;
   __ZNSt3__16__sortIRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i3 + 8 | 0, i1, i13);
   i1 = i3;
   continue;
  }
 }
 if ((i12 | 0) == 4) {
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i3, i2) | 0)) return;
  i16 = i2;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i13 = i1;
  i14 = HEAP32[i13 + 4 >> 2] | 0;
  i17 = i2;
  HEAP32[i17 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i1;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  return;
 } else if ((i12 | 0) == 6) {
  i1 = i2 + 8 | 0;
  i17 = FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i1, i2) | 0;
  i3 = FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i7, i1) | 0;
  if (!i17) {
   if (!i3) return;
   i16 = i1;
   i15 = HEAP32[i16 >> 2] | 0;
   i16 = HEAP32[i16 + 4 >> 2] | 0;
   i12 = i6;
   i14 = HEAP32[i12 + 4 >> 2] | 0;
   i17 = i1;
   HEAP32[i17 >> 2] = HEAP32[i12 >> 2];
   HEAP32[i17 + 4 >> 2] = i14;
   i17 = i6;
   HEAP32[i17 >> 2] = i15;
   HEAP32[i17 + 4 >> 2] = i16;
   if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i1, i2) | 0)) return;
   i16 = i2;
   i15 = HEAP32[i16 >> 2] | 0;
   i16 = HEAP32[i16 + 4 >> 2] | 0;
   i13 = i1;
   i14 = HEAP32[i13 + 4 >> 2] | 0;
   i17 = i2;
   HEAP32[i17 >> 2] = HEAP32[i13 >> 2];
   HEAP32[i17 + 4 >> 2] = i14;
   i17 = i1;
   HEAP32[i17 >> 2] = i15;
   HEAP32[i17 + 4 >> 2] = i16;
   return;
  }
  i5 = i2;
  i4 = HEAP32[i5 >> 2] | 0;
  i5 = HEAP32[i5 + 4 >> 2] | 0;
  if (i3) {
   i15 = i6;
   i16 = HEAP32[i15 + 4 >> 2] | 0;
   i17 = i2;
   HEAP32[i17 >> 2] = HEAP32[i15 >> 2];
   HEAP32[i17 + 4 >> 2] = i16;
   i17 = i6;
   HEAP32[i17 >> 2] = i4;
   HEAP32[i17 + 4 >> 2] = i5;
   return;
  }
  i15 = i1;
  i16 = HEAP32[i15 + 4 >> 2] | 0;
  i17 = i2;
  HEAP32[i17 >> 2] = HEAP32[i15 >> 2];
  HEAP32[i17 + 4 >> 2] = i16;
  i17 = i1;
  HEAP32[i17 >> 2] = i4;
  HEAP32[i17 + 4 >> 2] = i5;
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i7, i1) | 0)) return;
  i16 = i1;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i13 = i6;
  i14 = HEAP32[i13 + 4 >> 2] | 0;
  i17 = i1;
  HEAP32[i17 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i6;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  return;
 } else if ((i12 | 0) == 14) {
  __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i2, i2 + 8 | 0, i2 + 16 | 0, i1, i13) | 0;
  return;
 } else if ((i12 | 0) == 15) {
  i1 = i2 + 8 | 0;
  i3 = i2 + 16 | 0;
  i4 = i2 + 24 | 0;
  __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i2, i1, i3, i4, i13) | 0;
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i6, i4) | 0)) return;
  i16 = i4;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i12 = i5;
  i14 = HEAP32[i12 + 4 >> 2] | 0;
  i17 = i4;
  HEAP32[i17 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i5;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i4, i3) | 0)) return;
  i16 = i3;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i12 = i4;
  i14 = HEAP32[i12 + 4 >> 2] | 0;
  i17 = i3;
  HEAP32[i17 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i4;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i3, i1) | 0)) return;
  i16 = i1;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i12 = i3;
  i14 = HEAP32[i12 + 4 >> 2] | 0;
  i17 = i1;
  HEAP32[i17 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i3;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  if (!(FUNCTION_TABLE_iii[HEAP32[i13 >> 2] & 7](i1, i2) | 0)) return;
  i16 = i2;
  i15 = HEAP32[i16 >> 2] | 0;
  i16 = HEAP32[i16 + 4 >> 2] | 0;
  i13 = i1;
  i14 = HEAP32[i13 + 4 >> 2] | 0;
  i17 = i2;
  HEAP32[i17 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i17 + 4 >> 2] = i14;
  i17 = i1;
  HEAP32[i17 >> 2] = i15;
  HEAP32[i17 + 4 >> 2] = i16;
  return;
 } else if ((i12 | 0) == 21) {
  __ZNSt3__118__insertion_sort_3IRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i2, i1, i13);
  return;
 } else if ((i12 | 0) == 69) return;
}

function __Z10b2DistanceP16b2DistanceOutputP14b2SimplexCachePK15b2DistanceInput(i46, i47, i49) {
 i46 = i46 | 0;
 i47 = i47 | 0;
 i49 = i49 | 0;
 var d1 = 0.0, d2 = 0.0, i3 = 0, d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, d22 = 0.0, d23 = 0.0, i24 = 0, i25 = 0, d26 = 0.0, d27 = 0.0, i28 = 0, d29 = 0.0, i30 = 0, i31 = 0, i32 = 0, d33 = 0.0, d34 = 0.0, d35 = 0.0, d36 = 0.0, i37 = 0, i38 = 0, i39 = 0, d40 = 0.0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i48 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0;
 i54 = STACKTOP;
 STACKTOP = STACKTOP + 176 | 0;
 i24 = i54 + 152 | 0;
 i41 = i54 + 136 | 0;
 i48 = i54;
 i30 = i54 + 124 | 0;
 i31 = i54 + 112 | 0;
 HEAP32[211] = (HEAP32[211] | 0) + 1;
 i32 = i49 + 56 | 0;
 HEAP32[i24 >> 2] = HEAP32[i32 >> 2];
 HEAP32[i24 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
 HEAP32[i24 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
 HEAP32[i24 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
 i32 = i49 + 72 | 0;
 HEAP32[i41 >> 2] = HEAP32[i32 >> 2];
 HEAP32[i41 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
 HEAP32[i41 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
 HEAP32[i41 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
 __ZN9b2Simplex9ReadCacheEPK14b2SimplexCachePK15b2DistanceProxyRK11b2TransformS5_S8_(i48, i47, i49, i24, i49 + 28 | 0, i41);
 i32 = i48 + 108 | 0;
 i44 = i48 + 16 | 0;
 i45 = i48 + 20 | 0;
 d29 = +HEAPF32[i24 + 12 >> 2];
 d8 = +HEAPF32[i24 + 8 >> 2];
 i20 = i49 + 16 | 0;
 i21 = i49 + 20 | 0;
 d9 = +HEAPF32[i24 >> 2];
 d10 = +HEAPF32[i24 + 4 >> 2];
 d22 = +HEAPF32[i41 + 12 >> 2];
 d23 = +HEAPF32[i41 + 8 >> 2];
 i24 = i49 + 44 | 0;
 i25 = i49 + 48 | 0;
 d26 = +HEAPF32[i41 >> 2];
 d27 = +HEAPF32[i41 + 4 >> 2];
 i41 = i48 + 52 | 0;
 i42 = i48 + 56 | 0;
 i28 = i48 + 36 | 0;
 i38 = i48 + 24 | 0;
 i39 = i48 + 60 | 0;
 i12 = HEAP32[i32 >> 2] | 0;
 i3 = 0;
 L1 : while (1) {
  i19 = (i12 | 0) > 0;
  if (i19) {
   i11 = 0;
   do {
    HEAP32[i30 + (i11 << 2) >> 2] = HEAP32[i48 + (i11 * 36 | 0) + 28 >> 2];
    HEAP32[i31 + (i11 << 2) >> 2] = HEAP32[i48 + (i11 * 36 | 0) + 32 >> 2];
    i11 = i11 + 1 | 0;
   } while ((i11 | 0) != (i12 | 0));
  }
  L7 : do switch (i12 | 0) {
  case 1:
   {
    i13 = 15;
    break;
   }
  case 2:
   {
    d7 = +HEAPF32[i44 >> 2];
    d6 = +HEAPF32[i45 >> 2];
    d1 = +HEAPF32[i41 >> 2];
    d2 = +HEAPF32[i42 >> 2];
    d4 = d1 - d7;
    d5 = d2 - d6;
    d6 = d7 * d4 + d6 * d5;
    if (d6 >= -0.0) {
     HEAPF32[i38 >> 2] = 1.0;
     HEAP32[i32 >> 2] = 1;
     i13 = 15;
     break L7;
    }
    d1 = d1 * d4 + d2 * d5;
    if (!(d1 <= 0.0)) {
     d7 = 1.0 / (d1 - d6);
     HEAPF32[i38 >> 2] = d1 * d7;
     HEAPF32[i39 >> 2] = -(d6 * d7);
     HEAP32[i32 >> 2] = 2;
     i13 = 16;
     break L7;
    } else {
     HEAPF32[i39 >> 2] = 1.0;
     HEAP32[i32 >> 2] = 1;
     i11 = i48;
     i13 = i28;
     i14 = i11 + 36 | 0;
     do {
      HEAP32[i11 >> 2] = HEAP32[i13 >> 2];
      i11 = i11 + 4 | 0;
      i13 = i13 + 4 | 0;
     } while ((i11 | 0) < (i14 | 0));
     i13 = 15;
     break L7;
    }
   }
  case 3:
   {
    __ZN9b2Simplex6Solve3Ev(i48);
    switch (HEAP32[i32 >> 2] | 0) {
    case 3:
     {
      i13 = 12;
      break L1;
     }
    case 0:
     {
      i13 = 13;
      break L1;
     }
    case 1:
     {
      i13 = 15;
      break;
     }
    case 2:
     {
      i13 = 16;
      break;
     }
    default:
     {
      i13 = 14;
      break L1;
     }
    }
    break;
   }
  default:
   {
    i13 = 10;
    break L1;
   }
  } while (0);
  do if ((i13 | 0) == 15) {
   d1 = -+HEAPF32[i44 >> 2];
   d2 = -+HEAPF32[i45 >> 2];
   i18 = 1;
  } else if ((i13 | 0) == 16) {
   d6 = +HEAPF32[i44 >> 2];
   d2 = +HEAPF32[i41 >> 2] - d6;
   d7 = +HEAPF32[i45 >> 2];
   d1 = +HEAPF32[i42 >> 2] - d7;
   if (d6 * d1 - d2 * d7 > 0.0) {
    d1 = -d1;
    i18 = 2;
    break;
   } else {
    d2 = -d2;
    i18 = 2;
    break;
   }
  } while (0);
  if (d2 * d2 + d1 * d1 < 1.4210854715202004e-014) {
   i12 = i18;
   i13 = 41;
   break;
  }
  d6 = -d1;
  d7 = -d2;
  d5 = d29 * d6 + d8 * d7;
  d6 = d29 * d7 - d8 * d6;
  i15 = HEAP32[i20 >> 2] | 0;
  i16 = HEAP32[i21 >> 2] | 0;
  if ((i16 | 0) > 1) {
   i13 = 0;
   d7 = d5 * +HEAPF32[i15 >> 2] + d6 * +HEAPF32[i15 + 4 >> 2];
   i14 = 1;
   while (1) {
    d4 = d5 * +HEAPF32[i15 + (i14 << 3) >> 2] + d6 * +HEAPF32[i15 + (i14 << 3) + 4 >> 2];
    i11 = d4 > d7;
    i13 = i11 ? i14 : i13;
    i14 = i14 + 1 | 0;
    if ((i14 | 0) == (i16 | 0)) break; else d7 = i11 ? d4 : d7;
   }
   i11 = i48 + (i18 * 36 | 0) + 28 | 0;
   HEAP32[i11 >> 2] = i13;
   if ((i13 | 0) <= -1) {
    i13 = 26;
    break;
   }
  } else {
   i11 = i48 + (i18 * 36 | 0) + 28 | 0;
   HEAP32[i11 >> 2] = 0;
   i13 = 0;
  }
  if ((i16 | 0) <= (i13 | 0)) {
   i13 = 26;
   break;
  }
  d5 = +HEAPF32[i15 + (i13 << 3) >> 2];
  d7 = +HEAPF32[i15 + (i13 << 3) + 4 >> 2];
  d6 = d9 + (d29 * d5 - d8 * d7);
  d7 = d5 * d8 + d29 * d7 + d10;
  HEAPF32[i48 + (i18 * 36 | 0) >> 2] = d6;
  HEAPF32[i48 + (i18 * 36 | 0) + 4 >> 2] = d7;
  d5 = d1 * d22 + d2 * d23;
  d1 = d2 * d22 - d1 * d23;
  i16 = HEAP32[i24 >> 2] | 0;
  i17 = HEAP32[i25 >> 2] | 0;
  if ((i17 | 0) > 1) {
   i14 = 0;
   d4 = d5 * +HEAPF32[i16 >> 2] + d1 * +HEAPF32[i16 + 4 >> 2];
   i15 = 1;
   while (1) {
    d2 = d5 * +HEAPF32[i16 + (i15 << 3) >> 2] + d1 * +HEAPF32[i16 + (i15 << 3) + 4 >> 2];
    i13 = d2 > d4;
    i14 = i13 ? i15 : i14;
    i15 = i15 + 1 | 0;
    if ((i15 | 0) == (i17 | 0)) break; else d4 = i13 ? d2 : d4;
   }
   i13 = i48 + (i18 * 36 | 0) + 32 | 0;
   HEAP32[i13 >> 2] = i14;
   if ((i14 | 0) > -1) {
    i15 = i13;
    i13 = i14;
   } else {
    i13 = 33;
    break;
   }
  } else {
   i15 = i48 + (i18 * 36 | 0) + 32 | 0;
   HEAP32[i15 >> 2] = 0;
   i13 = 0;
  }
  if ((i17 | 0) <= (i13 | 0)) {
   i13 = 33;
   break;
  }
  d2 = +HEAPF32[i16 + (i13 << 3) >> 2];
  d5 = +HEAPF32[i16 + (i13 << 3) + 4 >> 2];
  d4 = d26 + (d22 * d2 - d23 * d5);
  d5 = d2 * d23 + d22 * d5 + d27;
  HEAPF32[i48 + (i18 * 36 | 0) + 8 >> 2] = d4;
  HEAPF32[i48 + (i18 * 36 | 0) + 12 >> 2] = d5;
  HEAPF32[i48 + (i18 * 36 | 0) + 16 >> 2] = d4 - d6;
  HEAPF32[i48 + (i18 * 36 | 0) + 20 >> 2] = d5 - d7;
  i3 = i3 + 1 | 0;
  HEAP32[212] = (HEAP32[212] | 0) + 1;
  if (i19) {
   i11 = HEAP32[i11 >> 2] | 0;
   i13 = 0;
   do {
    if ((i11 | 0) == (HEAP32[i30 + (i13 << 2) >> 2] | 0) ? (HEAP32[i15 >> 2] | 0) == (HEAP32[i31 + (i13 << 2) >> 2] | 0) : 0) {
     i13 = 40;
     break L1;
    }
    i13 = i13 + 1 | 0;
   } while ((i13 | 0) < (i12 | 0));
  }
  i12 = (HEAP32[i32 >> 2] | 0) + 1 | 0;
  HEAP32[i32 >> 2] = i12;
  if ((i3 | 0) >= 20) {
   i13 = 41;
   break;
  }
 }
 if ((i13 | 0) == 10) ___assert_fail(4304, 4855, 497, 4910); else if ((i13 | 0) == 12) {
  i53 = HEAP32[213] | 0;
  HEAP32[213] = (i53 | 0) > (i3 | 0) ? i53 : i3;
  i13 = 45;
 } else if ((i13 | 0) == 13) ___assert_fail(4304, 4855, 195, 4921); else if ((i13 | 0) == 14) ___assert_fail(4304, 4855, 208, 4921); else if ((i13 | 0) == 26) ___assert_fail(4937, 4967, 103, 5018); else if ((i13 | 0) == 33) ___assert_fail(4937, 4967, 103, 5018); else if ((i13 | 0) == 40) {
  i12 = HEAP32[i32 >> 2] | 0;
  i13 = 41;
 }
 L58 : do if ((i13 | 0) == 41) {
  i11 = HEAP32[213] | 0;
  HEAP32[213] = (i11 | 0) > (i3 | 0) ? i11 : i3;
  i11 = i46 + 8 | 0;
  switch (i12 | 0) {
  case 3:
   {
    i13 = 45;
    break L58;
   }
  case 0:
   {
    ___assert_fail(4304, 4855, 218, 5028);
    break;
   }
  case 1:
   {
    i50 = i48;
    i52 = HEAP32[i50 >> 2] | 0;
    i50 = HEAP32[i50 + 4 >> 2] | 0;
    i43 = i46;
    HEAP32[i43 >> 2] = i52;
    HEAP32[i43 + 4 >> 2] = i50;
    i43 = i48 + 8 | 0;
    i51 = HEAP32[i43 >> 2] | 0;
    i43 = HEAP32[i43 + 4 >> 2] | 0;
    i53 = i11;
    HEAP32[i53 >> 2] = i51;
    HEAP32[i53 + 4 >> 2] = i43;
    d34 = (HEAP32[tempDoublePtr >> 2] = i52, +HEAPF32[tempDoublePtr >> 2]);
    d33 = (HEAP32[tempDoublePtr >> 2] = i51, +HEAPF32[tempDoublePtr >> 2]);
    d36 = (HEAP32[tempDoublePtr >> 2] = i50, +HEAPF32[tempDoublePtr >> 2]);
    i50 = i11;
    i51 = i46 + 4 | 0;
    i52 = i46 + 12 | 0;
    i53 = i46;
    d35 = (HEAP32[tempDoublePtr >> 2] = i43, +HEAPF32[tempDoublePtr >> 2]);
    i43 = 1;
    i37 = i3;
    break L58;
   }
  case 2:
   {
    d29 = +HEAPF32[i38 >> 2];
    d35 = +HEAPF32[i39 >> 2];
    d34 = d29 * +HEAPF32[i48 >> 2] + d35 * +HEAPF32[i48 + 36 >> 2];
    d36 = d29 * +HEAPF32[i48 + 4 >> 2] + d35 * +HEAPF32[i48 + 40 >> 2];
    HEAPF32[i46 >> 2] = d34;
    i51 = i46 + 4 | 0;
    HEAPF32[i51 >> 2] = d36;
    d33 = d29 * +HEAPF32[i48 + 8 >> 2] + d35 * +HEAPF32[i48 + 44 >> 2];
    d35 = d29 * +HEAPF32[i48 + 12 >> 2] + d35 * +HEAPF32[i48 + 48 >> 2];
    HEAPF32[i11 >> 2] = d33;
    i52 = i46 + 12 | 0;
    HEAPF32[i52 >> 2] = d35;
    i50 = i11;
    i53 = i46;
    i43 = 2;
    i37 = i3;
    break L58;
   }
  default:
   ___assert_fail(4304, 4855, 237, 5028);
  }
 } while (0);
 if ((i13 | 0) == 45) {
  d35 = +HEAPF32[i38 >> 2];
  d33 = +HEAPF32[i39 >> 2];
  d36 = +HEAPF32[i48 + 96 >> 2];
  d34 = d35 * +HEAPF32[i48 >> 2] + d33 * +HEAPF32[i48 + 36 >> 2] + d36 * +HEAPF32[i48 + 72 >> 2];
  d36 = d35 * +HEAPF32[i48 + 4 >> 2] + d33 * +HEAPF32[i48 + 40 >> 2] + d36 * +HEAPF32[i48 + 76 >> 2];
  HEAPF32[i46 >> 2] = d34;
  i51 = i46 + 4 | 0;
  HEAPF32[i51 >> 2] = d36;
  i50 = i46 + 8 | 0;
  HEAPF32[i50 >> 2] = d34;
  i52 = i46 + 12 | 0;
  HEAPF32[i52 >> 2] = d36;
  i53 = i46;
  d33 = d34;
  d35 = d36;
  i43 = 3;
  i37 = i3;
 }
 d34 = d34 - d33;
 d36 = d36 - d35;
 i11 = i46 + 16 | 0;
 HEAPF32[i11 >> 2] = +Math_sqrt(+(d34 * d34 + d36 * d36));
 HEAP32[i46 + 20 >> 2] = i37;
 switch (i43 | 0) {
 case 0:
  {
   ___assert_fail(4304, 4855, 247, 5045);
   break;
  }
 case 1:
  {
   d40 = 0.0;
   break;
  }
 case 2:
  {
   d36 = +HEAPF32[i44 >> 2] - +HEAPF32[i41 >> 2];
   d40 = +HEAPF32[i45 >> 2] - +HEAPF32[i42 >> 2];
   d40 = +Math_sqrt(+(d36 * d36 + d40 * d40));
   break;
  }
 case 3:
  {
   d40 = +HEAPF32[i44 >> 2];
   d36 = +HEAPF32[i45 >> 2];
   d40 = (+HEAPF32[i41 >> 2] - d40) * (+HEAPF32[i48 + 92 >> 2] - d36) - (+HEAPF32[i42 >> 2] - d36) * (+HEAPF32[i48 + 88 >> 2] - d40);
   break;
  }
 default:
  ___assert_fail(4304, 4855, 260, 5045);
 }
 HEAPF32[i47 >> 2] = d40;
 HEAP16[i47 + 4 >> 1] = i43;
 i3 = 0;
 do {
  HEAP8[i47 + 6 + i3 >> 0] = HEAP32[i48 + (i3 * 36 | 0) + 28 >> 2];
  HEAP8[i47 + 9 + i3 >> 0] = HEAP32[i48 + (i3 * 36 | 0) + 32 >> 2];
  i3 = i3 + 1 | 0;
 } while ((i3 | 0) < (i43 | 0));
 if (!(HEAP8[i49 + 88 >> 0] | 0)) {
  STACKTOP = i54;
  return;
 }
 d10 = +HEAPF32[i49 + 24 >> 2];
 d9 = +HEAPF32[i49 + 52 >> 2];
 d1 = +HEAPF32[i11 >> 2];
 d2 = d10 + d9;
 if (!(d1 > d2 & d1 > 1.1920928955078125e-007)) {
  d36 = (+HEAPF32[i53 >> 2] + +HEAPF32[i50 >> 2]) * .5;
  d40 = (+HEAPF32[i51 >> 2] + +HEAPF32[i52 >> 2]) * .5;
  HEAPF32[i53 >> 2] = d36;
  HEAPF32[i51 >> 2] = d40;
  HEAPF32[i50 >> 2] = d36;
  HEAPF32[i52 >> 2] = d40;
  HEAPF32[i11 >> 2] = 0.0;
  STACKTOP = i54;
  return;
 }
 HEAPF32[i11 >> 2] = d1 - d2;
 d5 = +HEAPF32[i50 >> 2];
 d6 = +HEAPF32[i53 >> 2];
 d2 = d5 - d6;
 d7 = +HEAPF32[i52 >> 2];
 d8 = +HEAPF32[i51 >> 2];
 d1 = d7 - d8;
 d4 = +Math_sqrt(+(d2 * d2 + d1 * d1));
 if (!(d4 < 1.1920928955078125e-007)) {
  d40 = 1.0 / d4;
  d2 = d2 * d40;
  d1 = d1 * d40;
 }
 HEAPF32[i53 >> 2] = d10 * d2 + d6;
 HEAPF32[i51 >> 2] = d10 * d1 + d8;
 HEAPF32[i50 >> 2] = d5 - d9 * d2;
 HEAPF32[i52 >> 2] = d7 - d9 * d1;
 STACKTOP = i54;
 return;
}

function __ZN8b2Island5SolveEP9b2ProfileRK10b2TimeStepRK6b2Vec2b(i24, i20, i18, i13, i21) {
 i24 = i24 | 0;
 i20 = i20 | 0;
 i18 = i18 | 0;
 i13 = i13 | 0;
 i21 = i21 | 0;
 var d1 = 0.0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, d11 = 0.0, i12 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i19 = 0, i22 = 0, d23 = 0.0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, d29 = 0.0;
 i27 = STACKTOP;
 STACKTOP = STACKTOP + 160 | 0;
 i22 = i27 + 128 | 0;
 i19 = i27 + 96 | 0;
 i17 = i27 + 52 | 0;
 i26 = i27;
 d23 = +HEAPF32[i18 >> 2];
 i25 = i24 + 28 | 0;
 if ((HEAP32[i25 >> 2] | 0) > 0) {
  i8 = i24 + 8 | 0;
  i12 = i13 + 4 | 0;
  i16 = i24 + 20 | 0;
  i15 = i24 + 24 | 0;
  i14 = 0;
  do {
   i4 = HEAP32[(HEAP32[i8 >> 2] | 0) + (i14 << 2) >> 2] | 0;
   i6 = i4 + 44 | 0;
   i5 = HEAP32[i6 >> 2] | 0;
   i6 = HEAP32[i6 + 4 >> 2] | 0;
   i7 = HEAP32[i4 + 56 >> 2] | 0;
   i2 = HEAP32[i4 + 64 >> 2] | 0;
   i3 = HEAP32[i4 + 68 >> 2] | 0;
   d1 = +HEAPF32[i4 + 72 >> 2];
   i28 = i4 + 36 | 0;
   HEAP32[i28 >> 2] = i5;
   HEAP32[i28 + 4 >> 2] = i6;
   HEAP32[i4 + 52 >> 2] = i7;
   if ((HEAP32[i4 >> 2] | 0) == 2) {
    d11 = +HEAPF32[i4 + 140 >> 2];
    d10 = +HEAPF32[i4 + 120 >> 2];
    d9 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]) + d23 * (d11 * +HEAPF32[i13 >> 2] + d10 * +HEAPF32[i4 + 76 >> 2]);
    d10 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]) + d23 * (d11 * +HEAPF32[i12 >> 2] + d10 * +HEAPF32[i4 + 80 >> 2]);
    d11 = 1.0 / (d23 * +HEAPF32[i4 + 132 >> 2] + 1.0);
    i2 = (HEAPF32[tempDoublePtr >> 2] = d9 * d11, HEAP32[tempDoublePtr >> 2] | 0);
    i3 = (HEAPF32[tempDoublePtr >> 2] = d10 * d11, HEAP32[tempDoublePtr >> 2] | 0);
    d1 = (d1 + d23 * +HEAPF32[i4 + 128 >> 2] * +HEAPF32[i4 + 84 >> 2]) * (1.0 / (d23 * +HEAPF32[i4 + 136 >> 2] + 1.0));
   }
   i28 = (HEAP32[i16 >> 2] | 0) + (i14 * 12 | 0) | 0;
   HEAP32[i28 >> 2] = i5;
   HEAP32[i28 + 4 >> 2] = i6;
   HEAP32[(HEAP32[i16 >> 2] | 0) + (i14 * 12 | 0) + 8 >> 2] = i7;
   i28 = HEAP32[i15 >> 2] | 0;
   HEAP32[i28 + (i14 * 12 | 0) >> 2] = i2;
   HEAP32[i28 + (i14 * 12 | 0) + 4 >> 2] = i3;
   i2 = HEAP32[i15 >> 2] | 0;
   HEAPF32[i2 + (i14 * 12 | 0) + 8 >> 2] = d1;
   i14 = i14 + 1 | 0;
  } while ((i14 | 0) < (HEAP32[i25 >> 2] | 0));
 } else {
  i2 = i24 + 24 | 0;
  i15 = i2;
  i16 = i24 + 20 | 0;
  i2 = HEAP32[i2 >> 2] | 0;
 };
 HEAP32[i19 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i19 + 4 >> 2] = HEAP32[i18 + 4 >> 2];
 HEAP32[i19 + 8 >> 2] = HEAP32[i18 + 8 >> 2];
 HEAP32[i19 + 12 >> 2] = HEAP32[i18 + 12 >> 2];
 HEAP32[i19 + 16 >> 2] = HEAP32[i18 + 16 >> 2];
 HEAP32[i19 + 20 >> 2] = HEAP32[i18 + 20 >> 2];
 i28 = HEAP32[i16 >> 2] | 0;
 HEAP32[i19 + 24 >> 2] = i28;
 HEAP32[i19 + 28 >> 2] = i2;
 HEAP32[i17 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i17 + 4 >> 2] = HEAP32[i18 + 4 >> 2];
 HEAP32[i17 + 8 >> 2] = HEAP32[i18 + 8 >> 2];
 HEAP32[i17 + 12 >> 2] = HEAP32[i18 + 12 >> 2];
 HEAP32[i17 + 16 >> 2] = HEAP32[i18 + 16 >> 2];
 HEAP32[i17 + 20 >> 2] = HEAP32[i18 + 20 >> 2];
 i13 = i24 + 12 | 0;
 HEAP32[i17 + 24 >> 2] = HEAP32[i13 >> 2];
 i14 = i24 + 36 | 0;
 HEAP32[i17 + 28 >> 2] = HEAP32[i14 >> 2];
 HEAP32[i17 + 32 >> 2] = i28;
 HEAP32[i17 + 36 >> 2] = i2;
 HEAP32[i17 + 40 >> 2] = HEAP32[i24 >> 2];
 __ZN15b2ContactSolverC2EP18b2ContactSolverDef(i26, i17);
 __ZN15b2ContactSolver29InitializeVelocityConstraintsEv(i26);
 if (HEAP8[i18 + 20 >> 0] | 0) __ZN15b2ContactSolver9WarmStartEv(i26);
 i12 = i24 + 32 | 0;
 i2 = HEAP32[i12 >> 2] | 0;
 if ((i2 | 0) > 0) {
  i3 = i24 + 16 | 0;
  i4 = 0;
  do {
   i2 = HEAP32[(HEAP32[i3 >> 2] | 0) + (i4 << 2) >> 2] | 0;
   FUNCTION_TABLE_vii[HEAP32[(HEAP32[i2 >> 2] | 0) + 32 >> 2] & 15](i2, i19);
   i4 = i4 + 1 | 0;
   i2 = HEAP32[i12 >> 2] | 0;
  } while ((i4 | 0) < (i2 | 0));
 }
 HEAPF32[i20 + 12 >> 2] = 0.0;
 i4 = i18 + 12 | 0;
 L19 : do if ((HEAP32[i4 >> 2] | 0) > 0) {
  i5 = i24 + 16 | 0;
  i3 = 0;
  while (1) {
   if ((i2 | 0) > 0) {
    i2 = 0;
    do {
     i28 = HEAP32[(HEAP32[i5 >> 2] | 0) + (i2 << 2) >> 2] | 0;
     FUNCTION_TABLE_vii[HEAP32[(HEAP32[i28 >> 2] | 0) + 36 >> 2] & 15](i28, i19);
     i2 = i2 + 1 | 0;
    } while ((i2 | 0) < (HEAP32[i12 >> 2] | 0));
   }
   __ZN15b2ContactSolver24SolveVelocityConstraintsEv(i26);
   i3 = i3 + 1 | 0;
   if ((i3 | 0) >= (HEAP32[i4 >> 2] | 0)) break L19;
   i2 = HEAP32[i12 >> 2] | 0;
  }
 } while (0);
 i2 = HEAP32[i26 + 48 >> 2] | 0;
 if ((i2 | 0) > 0) {
  i3 = HEAP32[i26 + 40 >> 2] | 0;
  i4 = HEAP32[i26 + 44 >> 2] | 0;
  i7 = 0;
  do {
   i5 = HEAP32[i4 + (HEAP32[i3 + (i7 * 156 | 0) + 152 >> 2] << 2) >> 2] | 0;
   i6 = HEAP32[i3 + (i7 * 156 | 0) + 148 >> 2] | 0;
   if ((i6 | 0) > 0) {
    i8 = 0;
    do {
     HEAP32[i5 + 64 + (i8 * 20 | 0) + 8 >> 2] = HEAP32[i3 + (i7 * 156 | 0) + (i8 * 36 | 0) + 16 >> 2];
     HEAP32[i5 + 64 + (i8 * 20 | 0) + 12 >> 2] = HEAP32[i3 + (i7 * 156 | 0) + (i8 * 36 | 0) + 20 >> 2];
     i8 = i8 + 1 | 0;
    } while ((i8 | 0) != (i6 | 0));
   }
   i7 = i7 + 1 | 0;
  } while ((i7 | 0) != (i2 | 0));
 }
 HEAPF32[i20 + 16 >> 2] = 0.0;
 if ((HEAP32[i25 >> 2] | 0) > 0) {
  i2 = HEAP32[i15 >> 2] | 0;
  i8 = 0;
  do {
   i5 = HEAP32[i16 >> 2] | 0;
   i6 = i5 + (i8 * 12 | 0) | 0;
   i7 = i5 + (i8 * 12 | 0) + 4 | 0;
   i3 = HEAP32[i2 + (i8 * 12 | 0) >> 2] | 0;
   i4 = HEAP32[i2 + (i8 * 12 | 0) + 4 >> 2] | 0;
   d11 = +HEAPF32[i2 + (i8 * 12 | 0) + 8 >> 2];
   d1 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
   d29 = d23 * d1;
   d10 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
   d9 = d23 * d10;
   d9 = d29 * d29 + d9 * d9;
   if (d9 > 4.0) {
    d29 = 2.0 / +Math_sqrt(+d9);
    i3 = (HEAPF32[tempDoublePtr >> 2] = d1 * d29, HEAP32[tempDoublePtr >> 2] | 0);
    i2 = (HEAPF32[tempDoublePtr >> 2] = d10 * d29, HEAP32[tempDoublePtr >> 2] | 0);
   } else i2 = i4;
   d1 = d23 * d11;
   if (d1 * d1 > 2.4674012660980225) d1 = d11 * (1.5707963705062866 / (d1 > 0.0 ? d1 : -d1)); else d1 = d11;
   d10 = d23 * (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
   d11 = +HEAPF32[i7 >> 2] + d23 * (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
   d29 = +HEAPF32[i5 + (i8 * 12 | 0) + 8 >> 2] + d23 * d1;
   HEAPF32[i6 >> 2] = +HEAPF32[i6 >> 2] + d10;
   HEAPF32[i7 >> 2] = d11;
   HEAPF32[(HEAP32[i16 >> 2] | 0) + (i8 * 12 | 0) + 8 >> 2] = d29;
   i28 = HEAP32[i15 >> 2] | 0;
   HEAP32[i28 + (i8 * 12 | 0) >> 2] = i3;
   HEAP32[i28 + (i8 * 12 | 0) + 4 >> 2] = i2;
   i2 = HEAP32[i15 >> 2] | 0;
   HEAPF32[i2 + (i8 * 12 | 0) + 8 >> 2] = d1;
   i8 = i8 + 1 | 0;
  } while ((i8 | 0) < (HEAP32[i25 >> 2] | 0));
 }
 i4 = i18 + 16 | 0;
 L49 : do if ((HEAP32[i4 >> 2] | 0) > 0) {
  i5 = i24 + 16 | 0;
  i7 = 0;
  while (1) {
   i6 = __ZN15b2ContactSolver24SolvePositionConstraintsEv(i26) | 0;
   if ((HEAP32[i12 >> 2] | 0) > 0) {
    i3 = 0;
    i2 = 1;
    do {
     i28 = HEAP32[(HEAP32[i5 >> 2] | 0) + (i3 << 2) >> 2] | 0;
     i2 = i2 & (FUNCTION_TABLE_iii[HEAP32[(HEAP32[i28 >> 2] | 0) + 40 >> 2] & 7](i28, i19) | 0);
     i3 = i3 + 1 | 0;
    } while ((i3 | 0) < (HEAP32[i12 >> 2] | 0));
   } else i2 = 1;
   i7 = i7 + 1 | 0;
   if (i6 & i2) {
    i12 = 0;
    break L49;
   }
   if ((i7 | 0) >= (HEAP32[i4 >> 2] | 0)) {
    i12 = 1;
    break;
   }
  }
 } else i12 = 1; while (0);
 if ((HEAP32[i25 >> 2] | 0) > 0) {
  i2 = i24 + 8 | 0;
  i3 = 0;
  do {
   i28 = HEAP32[(HEAP32[i2 >> 2] | 0) + (i3 << 2) >> 2] | 0;
   i19 = (HEAP32[i16 >> 2] | 0) + (i3 * 12 | 0) | 0;
   i18 = HEAP32[i19 >> 2] | 0;
   i19 = HEAP32[i19 + 4 >> 2] | 0;
   i17 = i28 + 44 | 0;
   HEAP32[i17 >> 2] = i18;
   HEAP32[i17 + 4 >> 2] = i19;
   i17 = HEAP32[(HEAP32[i16 >> 2] | 0) + (i3 * 12 | 0) + 8 >> 2] | 0;
   HEAP32[i28 + 56 >> 2] = i17;
   i6 = (HEAP32[i15 >> 2] | 0) + (i3 * 12 | 0) | 0;
   i7 = HEAP32[i6 + 4 >> 2] | 0;
   i8 = i28 + 64 | 0;
   HEAP32[i8 >> 2] = HEAP32[i6 >> 2];
   HEAP32[i8 + 4 >> 2] = i7;
   HEAP32[i28 + 72 >> 2] = HEAP32[(HEAP32[i15 >> 2] | 0) + (i3 * 12 | 0) + 8 >> 2];
   d10 = (HEAP32[tempDoublePtr >> 2] = i17, +HEAPF32[tempDoublePtr >> 2]);
   d1 = +Math_sin(+d10);
   HEAPF32[i28 + 20 >> 2] = d1;
   d10 = +Math_cos(+d10);
   HEAPF32[i28 + 24 >> 2] = d10;
   d9 = +HEAPF32[i28 + 28 >> 2];
   d29 = +HEAPF32[i28 + 32 >> 2];
   d11 = (HEAP32[tempDoublePtr >> 2] = i18, +HEAPF32[tempDoublePtr >> 2]) - (d10 * d9 - d1 * d29);
   d29 = (HEAP32[tempDoublePtr >> 2] = i19, +HEAPF32[tempDoublePtr >> 2]) - (d1 * d9 + d10 * d29);
   HEAPF32[i28 + 12 >> 2] = d11;
   HEAPF32[i28 + 16 >> 2] = d29;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (HEAP32[i25 >> 2] | 0));
 }
 HEAPF32[i20 + 20 >> 2] = 0.0;
 i2 = HEAP32[i26 + 40 >> 2] | 0;
 i3 = i24 + 4 | 0;
 if ((HEAP32[i3 >> 2] | 0) != 0 ? (HEAP32[i14 >> 2] | 0) > 0 : 0) {
  i4 = i22 + 16 | 0;
  i7 = 0;
  do {
   i5 = HEAP32[(HEAP32[i13 >> 2] | 0) + (i7 << 2) >> 2] | 0;
   i6 = HEAP32[i2 + (i7 * 156 | 0) + 148 >> 2] | 0;
   HEAP32[i4 >> 2] = i6;
   if ((i6 | 0) > 0) {
    i8 = 0;
    do {
     HEAP32[i22 + (i8 << 2) >> 2] = HEAP32[i2 + (i7 * 156 | 0) + (i8 * 36 | 0) + 16 >> 2];
     HEAP32[i22 + 8 + (i8 << 2) >> 2] = HEAP32[i2 + (i7 * 156 | 0) + (i8 * 36 | 0) + 20 >> 2];
     i8 = i8 + 1 | 0;
    } while ((i8 | 0) != (i6 | 0));
   }
   i28 = HEAP32[i3 >> 2] | 0;
   FUNCTION_TABLE_viii[HEAP32[(HEAP32[i28 >> 2] | 0) + 20 >> 2] & 3](i28, i5, i22);
   i7 = i7 + 1 | 0;
  } while ((i7 | 0) < (HEAP32[i14 >> 2] | 0));
 }
 if (!i21) {
  __ZN15b2ContactSolverD2Ev(i26);
  STACKTOP = i27;
  return;
 }
 i3 = HEAP32[i25 >> 2] | 0;
 i6 = (i3 | 0) > 0;
 if (i6) {
  i4 = HEAP32[i24 + 8 >> 2] | 0;
  i5 = 0;
  d1 = 34028234663852886.0e22;
  do {
   i2 = HEAP32[i4 + (i5 << 2) >> 2] | 0;
   do if (HEAP32[i2 >> 2] | 0) {
    if (((HEAP16[i2 + 4 >> 1] & 4) != 0 ? (d29 = +HEAPF32[i2 + 72 >> 2], !(d29 * d29 > .001218469929881394)) : 0) ? (d11 = +HEAPF32[i2 + 64 >> 2], d29 = +HEAPF32[i2 + 68 >> 2], !(d11 * d11 + d29 * d29 > 9.999999747378752e-005)) : 0) {
     i28 = i2 + 144 | 0;
     d29 = d23 + +HEAPF32[i28 >> 2];
     HEAPF32[i28 >> 2] = d29;
     d1 = d1 < d29 ? d1 : d29;
     break;
    }
    HEAPF32[i2 + 144 >> 2] = 0.0;
    d1 = 0.0;
   } while (0);
   i5 = i5 + 1 | 0;
  } while ((i5 | 0) < (i3 | 0));
 } else d1 = 34028234663852886.0e22;
 if (i12 | !(d1 >= .5) | i6 ^ 1) {
  __ZN15b2ContactSolverD2Ev(i26);
  STACKTOP = i27;
  return;
 }
 i2 = i24 + 8 | 0;
 i6 = 0;
 do {
  i3 = HEAP32[(HEAP32[i2 >> 2] | 0) + (i6 << 2) >> 2] | 0;
  i4 = i3 + 4 | 0;
  i5 = HEAPU16[i4 >> 1] | 0;
  if (i5 & 2) {
   i28 = HEAP32[i3 + 88 >> 2] | 0;
   HEAP32[i28 >> 2] = (HEAP32[i28 >> 2] | 0) + -1;
  }
  HEAP16[i4 >> 1] = i5 & 65533;
  HEAPF32[i3 + 144 >> 2] = 0.0;
  i28 = i3 + 64 | 0;
  HEAP32[i28 >> 2] = 0;
  HEAP32[i28 + 4 >> 2] = 0;
  HEAP32[i28 + 8 >> 2] = 0;
  HEAP32[i28 + 12 >> 2] = 0;
  HEAP32[i28 + 16 >> 2] = 0;
  HEAP32[i28 + 20 >> 2] = 0;
  i6 = i6 + 1 | 0;
 } while ((i6 | 0) < (HEAP32[i25 >> 2] | 0));
 __ZN15b2ContactSolverD2Ev(i26);
 STACKTOP = i27;
 return;
}

function __ZN15b2ContactSolver24SolveVelocityConstraintsEv(i1) {
 i1 = i1 | 0;
 var d2 = 0.0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, i13 = 0, i14 = 0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0, d21 = 0.0, i22 = 0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0, i31 = 0, i32 = 0, d33 = 0.0, d34 = 0.0, d35 = 0.0, d36 = 0.0, d37 = 0.0, d38 = 0.0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, d48 = 0.0, d49 = 0.0;
 i46 = i1 + 48 | 0;
 if ((HEAP32[i46 >> 2] | 0) <= 0) return;
 i47 = i1 + 40 | 0;
 i42 = i1 + 28 | 0;
 i43 = (HEAP8[3729] | 0) == 0;
 i7 = HEAP32[i42 >> 2] | 0;
 i45 = 0;
 L4 : while (1) {
  i32 = HEAP32[i47 >> 2] | 0;
  i44 = HEAP32[i32 + (i45 * 156 | 0) + 112 >> 2] | 0;
  i39 = HEAP32[i32 + (i45 * 156 | 0) + 116 >> 2] | 0;
  d33 = +HEAPF32[i32 + (i45 * 156 | 0) + 120 >> 2];
  d37 = +HEAPF32[i32 + (i45 * 156 | 0) + 128 >> 2];
  d34 = +HEAPF32[i32 + (i45 * 156 | 0) + 124 >> 2];
  d38 = +HEAPF32[i32 + (i45 * 156 | 0) + 132 >> 2];
  i31 = HEAP32[i32 + (i45 * 156 | 0) + 148 >> 2] | 0;
  i40 = i7 + (i44 * 12 | 0) | 0;
  i41 = i7 + (i44 * 12 | 0) + 4 | 0;
  d35 = +HEAPF32[i32 + (i45 * 156 | 0) + 72 >> 2];
  d36 = +HEAPF32[i32 + (i45 * 156 | 0) + 76 >> 2];
  d11 = -d35;
  d12 = +HEAPF32[i32 + (i45 * 156 | 0) + 136 >> 2];
  i22 = (i31 | 0) == 1;
  if ((i31 + -1 | 0) >>> 0 >= 2) {
   i1 = 5;
   break;
  }
  i13 = i32 + (i45 * 156 | 0) + 144 | 0;
  i1 = HEAP32[i7 + (i39 * 12 | 0) >> 2] | 0;
  i6 = HEAP32[i7 + (i39 * 12 | 0) + 4 >> 2] | 0;
  i5 = HEAP32[i40 >> 2] | 0;
  i4 = HEAP32[i41 >> 2] | 0;
  i14 = 0;
  d3 = +HEAPF32[i7 + (i44 * 12 | 0) + 8 >> 2];
  d2 = +HEAPF32[i7 + (i39 * 12 | 0) + 8 >> 2];
  do {
   d29 = +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 12 >> 2];
   d27 = +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 8 >> 2];
   d10 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
   d15 = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]);
   d8 = (HEAP32[tempDoublePtr >> 2] = i5, +HEAPF32[tempDoublePtr >> 2]);
   d9 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
   d26 = +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 4 >> 2];
   d25 = +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) >> 2];
   d30 = d12 * +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 16 >> 2];
   i5 = i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 20 | 0;
   d28 = +HEAPF32[i5 >> 2];
   d23 = d28 - +HEAPF32[i32 + (i45 * 156 | 0) + (i14 * 36 | 0) + 28 >> 2] * (d36 * (d10 - d2 * d29 - d8 + d3 * d26) + (d15 + d2 * d27 - d9 - d3 * d25) * d11 - +HEAPF32[i13 >> 2]);
   d24 = -d30;
   d30 = d23 < d30 ? d23 : d30;
   d30 = d30 < d24 ? d24 : d30;
   d28 = d30 - d28;
   HEAPF32[i5 >> 2] = d30;
   d30 = d36 * d28;
   d28 = d28 * d11;
   d8 = d8 - d33 * d30;
   i5 = (HEAPF32[tempDoublePtr >> 2] = d8, HEAP32[tempDoublePtr >> 2] | 0);
   d9 = d9 - d33 * d28;
   i4 = (HEAPF32[tempDoublePtr >> 2] = d9, HEAP32[tempDoublePtr >> 2] | 0);
   d3 = d3 - d37 * (d25 * d28 - d26 * d30);
   d10 = d10 + d34 * d30;
   i1 = (HEAPF32[tempDoublePtr >> 2] = d10, HEAP32[tempDoublePtr >> 2] | 0);
   d15 = d15 + d34 * d28;
   i6 = (HEAPF32[tempDoublePtr >> 2] = d15, HEAP32[tempDoublePtr >> 2] | 0);
   d2 = d2 + d38 * (d27 * d28 - d29 * d30);
   i14 = i14 + 1 | 0;
  } while ((i14 | 0) != (i31 | 0));
  do if (!(i22 | i43)) {
   i7 = i32 + (i45 * 156 | 0) + 16 | 0;
   d17 = +HEAPF32[i7 >> 2];
   i13 = i32 + (i45 * 156 | 0) + 52 | 0;
   d18 = +HEAPF32[i13 >> 2];
   if (!(d17 >= 0.0) | !(d18 >= 0.0)) {
    i1 = 10;
    break L4;
   }
   d27 = +HEAPF32[i32 + (i45 * 156 | 0) + 12 >> 2];
   d28 = +HEAPF32[i32 + (i45 * 156 | 0) + 8 >> 2];
   d23 = +HEAPF32[i32 + (i45 * 156 | 0) + 4 >> 2];
   d24 = +HEAPF32[i32 + (i45 * 156 | 0) >> 2];
   d29 = +HEAPF32[i32 + (i45 * 156 | 0) + 48 >> 2];
   d30 = +HEAPF32[i32 + (i45 * 156 | 0) + 44 >> 2];
   d25 = +HEAPF32[i32 + (i45 * 156 | 0) + 40 >> 2];
   d26 = +HEAPF32[i32 + (i45 * 156 | 0) + 36 >> 2];
   d19 = +HEAPF32[i32 + (i45 * 156 | 0) + 104 >> 2];
   d16 = +HEAPF32[i32 + (i45 * 156 | 0) + 100 >> 2];
   d20 = d35 * (d10 - d2 * d27 - d8 + d3 * d23) + d36 * (d15 + d2 * d28 - d9 - d3 * d24) - +HEAPF32[i32 + (i45 * 156 | 0) + 32 >> 2] - (d17 * +HEAPF32[i32 + (i45 * 156 | 0) + 96 >> 2] + d18 * d19);
   d21 = d35 * (d10 - d2 * d29 - d8 + d3 * d25) + d36 * (d15 + d2 * d30 - d9 - d3 * d26) - +HEAPF32[i32 + (i45 * 156 | 0) + 68 >> 2] - (d17 * d16 + d18 * +HEAPF32[i32 + (i45 * 156 | 0) + 108 >> 2]);
   d49 = +HEAPF32[i32 + (i45 * 156 | 0) + 80 >> 2] * d20 + +HEAPF32[i32 + (i45 * 156 | 0) + 88 >> 2] * d21;
   d48 = d20 * +HEAPF32[i32 + (i45 * 156 | 0) + 84 >> 2] + d21 * +HEAPF32[i32 + (i45 * 156 | 0) + 92 >> 2];
   d11 = -d49;
   d12 = -d48;
   if (!(!(d49 <= -0.0) | !(d48 <= -0.0))) {
    d20 = d11 - d17;
    d48 = d12 - d18;
    d21 = d35 * d20;
    d20 = d36 * d20;
    d49 = d35 * d48;
    d48 = d36 * d48;
    d35 = d21 + d49;
    d36 = d20 + d48;
    i5 = (HEAPF32[tempDoublePtr >> 2] = d8 - d33 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d9 - d33 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d10 + d34 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = d15 + d34 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    HEAPF32[i7 >> 2] = d11;
    HEAPF32[i13 >> 2] = d12;
    d3 = d3 - d37 * (d24 * d20 - d23 * d21 + (d26 * d48 - d25 * d49));
    d2 = d2 + d38 * (d28 * d20 - d27 * d21 + (d30 * d48 - d29 * d49));
    break;
   }
   d49 = d20 * +HEAPF32[i32 + (i45 * 156 | 0) + 24 >> 2];
   d11 = -d49;
   if (d49 <= -0.0 & d21 + d16 * d11 >= 0.0) {
    d20 = d11 - d17;
    d48 = 0.0 - d18;
    d21 = d35 * d20;
    d20 = d36 * d20;
    d49 = d35 * d48;
    d48 = d36 * d48;
    d35 = d49 + d21;
    d36 = d48 + d20;
    i5 = (HEAPF32[tempDoublePtr >> 2] = d8 - d33 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d9 - d33 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d10 + d34 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = d15 + d34 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    HEAPF32[i7 >> 2] = d11;
    HEAP32[i13 >> 2] = 0;
    d3 = d3 - d37 * (d20 * d24 - d21 * d23 + (d48 * d26 - d49 * d25));
    d2 = d2 + d38 * (d20 * d28 - d21 * d27 + (d48 * d30 - d49 * d29));
    break;
   }
   d49 = d21 * +HEAPF32[i32 + (i45 * 156 | 0) + 60 >> 2];
   d11 = -d49;
   if (d49 <= -0.0 & d20 + d19 * d11 >= 0.0) {
    d20 = 0.0 - d17;
    d48 = d11 - d18;
    d21 = d35 * d20;
    d20 = d36 * d20;
    d49 = d35 * d48;
    d48 = d36 * d48;
    d35 = d21 + d49;
    d36 = d20 + d48;
    i5 = (HEAPF32[tempDoublePtr >> 2] = d8 - d33 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d9 - d33 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d10 + d34 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = d15 + d34 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    HEAP32[i7 >> 2] = 0;
    HEAPF32[i13 >> 2] = d11;
    d3 = d3 - d37 * (d20 * d24 - d21 * d23 + (d48 * d26 - d49 * d25));
    d2 = d2 + d38 * (d20 * d28 - d21 * d27 + (d48 * d30 - d49 * d29));
    break;
   }
   if (d20 >= 0.0 & d21 >= 0.0) {
    d20 = 0.0 - d17;
    d48 = 0.0 - d18;
    d21 = d35 * d20;
    d20 = d36 * d20;
    d49 = d35 * d48;
    d48 = d36 * d48;
    d35 = d21 + d49;
    d36 = d20 + d48;
    i5 = (HEAPF32[tempDoublePtr >> 2] = d8 - d33 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d9 - d33 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d10 + d34 * d35, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = d15 + d34 * d36, HEAP32[tempDoublePtr >> 2] | 0);
    HEAP32[i7 >> 2] = 0;
    HEAP32[i13 >> 2] = 0;
    d3 = d3 - d37 * (d20 * d24 - d21 * d23 + (d48 * d26 - d49 * d25));
    d2 = d2 + d38 * (d20 * d28 - d21 * d27 + (d48 * d30 - d49 * d29));
   }
  } else {
   i7 = 0;
   do {
    d48 = +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 12 >> 2];
    d29 = +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 8 >> 2];
    d27 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
    d28 = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]);
    d23 = (HEAP32[tempDoublePtr >> 2] = i5, +HEAPF32[tempDoublePtr >> 2]);
    d24 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
    d26 = +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 4 >> 2];
    d25 = +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) >> 2];
    i5 = i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 16 | 0;
    d30 = +HEAPF32[i5 >> 2];
    d49 = d30 - +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 24 >> 2] * (d35 * (d27 - d2 * d48 - d23 + d3 * d26) + d36 * (d28 + d2 * d29 - d24 - d3 * d25) - +HEAPF32[i32 + (i45 * 156 | 0) + (i7 * 36 | 0) + 32 >> 2]);
    d49 = d49 > 0.0 ? d49 : 0.0;
    d30 = d49 - d30;
    HEAPF32[i5 >> 2] = d49;
    d49 = d35 * d30;
    d30 = d36 * d30;
    i5 = (HEAPF32[tempDoublePtr >> 2] = d23 - d33 * d49, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d24 - d33 * d30, HEAP32[tempDoublePtr >> 2] | 0);
    d3 = d3 - d37 * (d25 * d30 - d26 * d49);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d27 + d34 * d49, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = d28 + d34 * d30, HEAP32[tempDoublePtr >> 2] | 0);
    d2 = d2 + d38 * (d29 * d30 - d48 * d49);
    i7 = i7 + 1 | 0;
   } while ((i7 | 0) != (i31 | 0));
  } while (0);
  HEAP32[i40 >> 2] = i5;
  HEAP32[i41 >> 2] = i4;
  i7 = HEAP32[i42 >> 2] | 0;
  HEAPF32[i7 + (i44 * 12 | 0) + 8 >> 2] = d3;
  HEAP32[i7 + (i39 * 12 | 0) >> 2] = i1;
  HEAP32[i7 + (i39 * 12 | 0) + 4 >> 2] = i6;
  i7 = HEAP32[i42 >> 2] | 0;
  HEAPF32[i7 + (i39 * 12 | 0) + 8 >> 2] = d2;
  i45 = i45 + 1 | 0;
  if ((i45 | 0) >= (HEAP32[i46 >> 2] | 0)) {
   i1 = 20;
   break;
  }
 }
 if ((i1 | 0) == 5) ___assert_fail(6479, 6381, 315, 6514); else if ((i1 | 0) == 10) ___assert_fail(6539, 6381, 413, 6514); else if ((i1 | 0) == 20) return;
}

function __ZN5Scene9initStartEv(i40) {
 i40 = i40 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, d17 = 0.0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i41 = 0;
 i41 = STACKTOP;
 STACKTOP = STACKTOP + 320 | 0;
 i4 = i41 + 248 | 0;
 i34 = i41 + 256 | 0;
 i9 = i41 + 164 | 0;
 i10 = i41 + 152 | 0;
 i11 = i41 + 124 | 0;
 i12 = i41 + 112 | 0;
 i14 = i41 + 84 | 0;
 i15 = i41 + 72 | 0;
 i35 = i41 + 56 | 0;
 i37 = i41 + 192 | 0;
 i36 = i41 + 48 | 0;
 i38 = i41 + 28 | 0;
 i39 = i41;
 _srand(0);
 HEAPF32[i4 >> 2] = 0.0;
 HEAPF32[i4 + 4 >> 2] = -7.0;
 i13 = __Znwj(103032) | 0;
 __ZN7b2WorldC2ERK6b2Vec2(i13, i4);
 HEAP32[178] = i13;
 i13 = __Znwj(8) | 0;
 __ZN6b2DrawC2Ev(i13);
 HEAP32[i13 >> 2] = 744;
 HEAP32[179] = i13;
 __ZN6b2Draw8SetFlagsEj(i13, 1);
 __ZN7b2World12SetDebugDrawEP6b2Draw(HEAP32[178] | 0, HEAP32[179] | 0);
 HEAP32[i34 + 44 >> 2] = 0;
 i13 = i34 + 4 | 0;
 HEAP32[i13 >> 2] = 0;
 HEAP32[i13 + 4 >> 2] = 0;
 HEAP32[i13 + 8 >> 2] = 0;
 HEAP32[i13 + 12 >> 2] = 0;
 HEAP32[i13 + 16 >> 2] = 0;
 HEAP32[i13 + 20 >> 2] = 0;
 HEAP32[i13 + 24 >> 2] = 0;
 HEAP32[i13 + 28 >> 2] = 0;
 HEAP8[i34 + 36 >> 0] = 1;
 HEAP8[i34 + 37 >> 0] = 1;
 HEAP8[i34 + 38 >> 0] = 0;
 HEAP8[i34 + 39 >> 0] = 0;
 HEAP32[i34 >> 2] = 0;
 HEAP8[i34 + 40 >> 0] = 1;
 HEAPF32[i34 + 48 >> 2] = 1.0;
 HEAPF32[i13 >> 2] = 0.0;
 HEAPF32[i34 + 8 >> 2] = -10.0;
 __Z9makeWallsP6b2Body(__ZN7b2World10CreateBodyEPK9b2BodyDef(HEAP32[178] | 0, i34) | 0);
 i34 = i40 + 24 | 0;
 i13 = i40 + 32 | 0;
 i4 = HEAP32[i34 >> 2] | 0;
 i5 = i4;
 if ((((HEAP32[i13 >> 2] | 0) - i5 | 0) / 28 | 0) >>> 0 < 10) {
  i6 = i40 + 28 | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i1 = i2;
  i8 = __Znwj(280) | 0;
  i3 = i8 + (((i1 - i5 | 0) / 28 | 0) * 28 | 0) | 0;
  i7 = i3;
  i8 = i8 + 280 | 0;
  if ((i2 | 0) == (i4 | 0)) {
   i3 = i34;
   i4 = i6;
   i2 = i7;
  } else {
   i1 = i7;
   do {
    i33 = i3 + -28 | 0;
    i32 = i2;
    i2 = i2 + -28 | 0;
    HEAP32[i33 >> 2] = HEAP32[i2 >> 2];
    HEAP32[i33 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
    HEAP32[i33 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
    HEAP32[i2 >> 2] = 0;
    HEAP32[i2 + 4 >> 2] = 0;
    HEAP32[i2 + 8 >> 2] = 0;
    i33 = i3 + -16 | 0;
    i32 = i32 + -16 | 0;
    HEAP32[i33 >> 2] = HEAP32[i32 >> 2];
    HEAP32[i33 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
    HEAP32[i33 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
    HEAP32[i33 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
    i3 = i1 + -28 | 0;
    i1 = i3;
   } while ((i2 | 0) != (i4 | 0));
   i3 = i34;
   i4 = i6;
   i2 = i1;
   i5 = HEAP32[i34 >> 2] | 0;
   i1 = HEAP32[i6 >> 2] | 0;
  }
  HEAP32[i3 >> 2] = i2;
  HEAP32[i4 >> 2] = i7;
  HEAP32[i13 >> 2] = i8;
  i2 = i5;
  if ((i1 | 0) != (i2 | 0)) do {
   i1 = i1 + -28 | 0;
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1);
  } while ((i1 | 0) != (i2 | 0));
  if (i5) __ZdlPv(i5);
 }
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i10, 2631, 8);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEC2ERKS5_(i9, i10);
 HEAPF32[i9 + 12 >> 2] = 255.0;
 HEAPF32[i9 + 16 >> 2] = 0.0;
 HEAPF32[i9 + 20 >> 2] = 0.0;
 HEAPF32[i9 + 24 >> 2] = 1.0;
 i2 = i40 + 28 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if (i1 >>> 0 < (HEAP32[i13 >> 2] | 0) >>> 0) {
  HEAP32[i1 >> 2] = HEAP32[i9 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i9 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i9 + 8 >> 2];
  HEAP32[i9 >> 2] = 0;
  HEAP32[i9 + 4 >> 2] = 0;
  HEAP32[i9 + 8 >> 2] = 0;
  i33 = i1 + 12 | 0;
  i32 = i9 + 12 | 0;
  HEAP32[i33 >> 2] = HEAP32[i32 >> 2];
  HEAP32[i33 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
  HEAP32[i33 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
  HEAP32[i33 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
  HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 28;
 } else __ZNSt3__16vectorI6SpriteNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i34, i9);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i9);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i10);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i12, 2640, 10);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEC2ERKS5_(i11, i12);
 HEAPF32[i11 + 12 >> 2] = 0.0;
 HEAPF32[i11 + 16 >> 2] = 172.0;
 HEAPF32[i11 + 20 >> 2] = 0.0;
 HEAPF32[i11 + 24 >> 2] = 1.0;
 i1 = HEAP32[i2 >> 2] | 0;
 if (i1 >>> 0 < (HEAP32[i13 >> 2] | 0) >>> 0) {
  HEAP32[i1 >> 2] = HEAP32[i11 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i11 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i11 + 8 >> 2];
  HEAP32[i11 >> 2] = 0;
  HEAP32[i11 + 4 >> 2] = 0;
  HEAP32[i11 + 8 >> 2] = 0;
  i33 = i1 + 12 | 0;
  i32 = i11 + 12 | 0;
  HEAP32[i33 >> 2] = HEAP32[i32 >> 2];
  HEAP32[i33 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
  HEAP32[i33 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
  HEAP32[i33 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
  HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 28;
 } else __ZNSt3__16vectorI6SpriteNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i34, i11);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i11);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i12);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i15, 2651, 9);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEC2ERKS5_(i14, i15);
 HEAPF32[i14 + 12 >> 2] = 0.0;
 HEAPF32[i14 + 16 >> 2] = 0.0;
 HEAPF32[i14 + 20 >> 2] = 255.0;
 HEAPF32[i14 + 24 >> 2] = 1.0;
 i1 = HEAP32[i2 >> 2] | 0;
 if (i1 >>> 0 < (HEAP32[i13 >> 2] | 0) >>> 0) {
  HEAP32[i1 >> 2] = HEAP32[i14 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i14 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i14 + 8 >> 2];
  HEAP32[i14 >> 2] = 0;
  HEAP32[i14 + 4 >> 2] = 0;
  HEAP32[i14 + 8 >> 2] = 0;
  i33 = i1 + 12 | 0;
  i32 = i14 + 12 | 0;
  HEAP32[i33 >> 2] = HEAP32[i32 >> 2];
  HEAP32[i33 + 4 >> 2] = HEAP32[i32 + 4 >> 2];
  HEAP32[i33 + 8 >> 2] = HEAP32[i32 + 8 >> 2];
  HEAP32[i33 + 12 >> 2] = HEAP32[i32 + 12 >> 2];
  HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 28;
 } else __ZNSt3__16vectorI6SpriteNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i34, i14);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i14);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i15);
 i33 = i40 + 8 | 0;
 i1 = HEAP32[i40 >> 2] | 0;
 i2 = i1;
 if ((HEAP32[i33 >> 2] | 0) - i2 >> 2 >>> 0 < 120 ? (i31 = i40 + 4 | 0, i30 = (HEAP32[i31 >> 2] | 0) - i2 | 0, i32 = __Znwj(480) | 0, _memcpy(i32 | 0, i1 | 0, i30 | 0) | 0, HEAP32[i40 >> 2] = i32, HEAP32[i31 >> 2] = i32 + (i30 >> 2 << 2), HEAP32[i33 >> 2] = i32 + 480, (i1 | 0) != 0) : 0) __ZdlPv(i1);
 i30 = i40 + 12 | 0;
 i31 = i40 + 20 | 0;
 i1 = HEAP32[i30 >> 2] | 0;
 i2 = i1;
 i32 = i40 + 16 | 0;
 if ((HEAP32[i31 >> 2] | 0) - i2 >> 4 >>> 0 < 120 ? (i28 = (HEAP32[i32 >> 2] | 0) - i2 | 0, i29 = __Znwj(1920) | 0, _memcpy(i29 | 0, i1 | 0, i28 | 0) | 0, HEAP32[i30 >> 2] = i29, HEAP32[i32 >> 2] = i29 + (i28 >> 4 << 4), HEAP32[i31 >> 2] = i29 + 1920, (i1 | 0) != 0) : 0) __ZdlPv(i1);
 i3 = i35 + 4 | 0;
 i4 = i35 + 8 | 0;
 i5 = i35 + 9 | 0;
 i6 = i35 + 12 | 0;
 i7 = i37 + 44 | 0;
 i8 = i37 + 4 | 0;
 i9 = i37 + 36 | 0;
 i10 = i37 + 37 | 0;
 i11 = i37 + 38 | 0;
 i12 = i37 + 39 | 0;
 i13 = i37 + 40 | 0;
 i14 = i37 + 48 | 0;
 i15 = i37 + 8 | 0;
 i18 = i40 + 4 | 0;
 i19 = i38 + 4 | 0;
 i20 = i38 + 8 | 0;
 i21 = i39 + 22 | 0;
 i22 = i39 + 24 | 0;
 i23 = i39 + 26 | 0;
 i24 = i39 + 4 | 0;
 i25 = i39 + 8 | 0;
 i26 = i39 + 12 | 0;
 i27 = i39 + 16 | 0;
 i28 = i39 + 20 | 0;
 i29 = 0;
 d16 = -1.399999976158142;
 d17 = 5.0;
 do {
  if (!((i29 | 0) % 5 | 0)) {
   d16 = ((i29 | 0) % 10 | 0 | 0) == 0 ? -1.399999976158142 : -.8999999761581421;
   d17 = d17 + .8;
  } else d16 = d16 + .5599999999999999;
  i2 = _rand() | 0;
  i1 = HEAP32[180] | 0;
  HEAP32[i35 >> 2] = (HEAP32[i34 >> 2] | 0) + (((i2 >>> 0) % ((((HEAP32[i1 + 28 >> 2] | 0) - (HEAP32[i1 + 24 >> 2] | 0) | 0) / 28 | 0) >>> 0) | 0) * 28 | 0);
  HEAP32[i3 >> 2] = i29;
  HEAP8[i4 >> 0] = 0;
  HEAP8[i5 >> 0] = 0;
  HEAPF32[i6 >> 2] = .25999999046325684;
  i1 = HEAP32[i32 >> 2] | 0;
  if (i1 >>> 0 < (HEAP32[i31 >> 2] | 0) >>> 0) {
   HEAP32[i1 >> 2] = HEAP32[i35 >> 2];
   HEAP32[i1 + 4 >> 2] = HEAP32[i35 + 4 >> 2];
   HEAP32[i1 + 8 >> 2] = HEAP32[i35 + 8 >> 2];
   HEAP32[i1 + 12 >> 2] = HEAP32[i35 + 12 >> 2];
   i1 = (HEAP32[i32 >> 2] | 0) + 16 | 0;
   HEAP32[i32 >> 2] = i1;
  } else {
   __ZNSt3__16vectorI8BallInfoNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i30, i35);
   i1 = HEAP32[i32 >> 2] | 0;
  };
  HEAP32[i8 >> 2] = 0;
  HEAP32[i8 + 4 >> 2] = 0;
  HEAP32[i8 + 8 >> 2] = 0;
  HEAP32[i8 + 12 >> 2] = 0;
  HEAP32[i8 + 16 >> 2] = 0;
  HEAP32[i8 + 20 >> 2] = 0;
  HEAP32[i8 + 24 >> 2] = 0;
  HEAP32[i8 + 28 >> 2] = 0;
  HEAP8[i10 >> 0] = 1;
  HEAP8[i11 >> 0] = 0;
  HEAP8[i12 >> 0] = 0;
  HEAP8[i13 >> 0] = 1;
  HEAPF32[i14 >> 2] = 1.0;
  HEAP32[i37 >> 2] = 2;
  HEAPF32[i8 >> 2] = d16;
  HEAPF32[i15 >> 2] = d17;
  HEAP32[i7 >> 2] = i1 + -16;
  HEAP8[i9 >> 0] = 1;
  i1 = __ZN7b2World10CreateBodyEPK9b2BodyDef(HEAP32[178] | 0, i37) | 0;
  HEAP32[i36 >> 2] = i1;
  i2 = HEAP32[i18 >> 2] | 0;
  if ((i2 | 0) == (HEAP32[i33 >> 2] | 0)) __ZNSt3__16vectorIP6b2BodyNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i40, i36); else {
   HEAP32[i2 >> 2] = i1;
   HEAP32[i18 >> 2] = (HEAP32[i18 >> 2] | 0) + 4;
  }
  HEAP32[i38 >> 2] = 1348;
  HEAP32[i19 >> 2] = 0;
  HEAP32[i19 + 4 >> 2] = 0;
  HEAP32[i19 + 8 >> 2] = 0;
  HEAP32[i19 + 12 >> 2] = 0;
  HEAPF32[i20 >> 2] = .25999999046325684;
  HEAP16[i21 >> 1] = 1;
  HEAP16[i22 >> 1] = -1;
  HEAP16[i23 >> 1] = 0;
  HEAP32[i24 >> 2] = 0;
  HEAP8[i28 >> 0] = 0;
  HEAP32[i39 >> 2] = i38;
  HEAPF32[i26 >> 2] = .30000001192092896;
  HEAPF32[i27 >> 2] = 1.0;
  HEAPF32[i25 >> 2] = .30000001192092896;
  __ZN6b2Body13CreateFixtureEPK12b2FixtureDef(i1, i39) | 0;
  i29 = i29 + 1 | 0;
 } while ((i29 | 0) < 120);
 STACKTOP = i41;
 return;
}

function _free(i15) {
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
 if (!i15) return;
 i1 = i15 + -8 | 0;
 i7 = HEAP32[524] | 0;
 if (i1 >>> 0 < i7 >>> 0) _abort();
 i2 = HEAP32[i15 + -4 >> 2] | 0;
 i3 = i2 & 3;
 if ((i3 | 0) == 1) _abort();
 i13 = i2 & -8;
 i16 = i15 + (i13 + -8) | 0;
 do if (!(i2 & 1)) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i3) return;
  i8 = -8 - i1 | 0;
  i10 = i15 + i8 | 0;
  i11 = i1 + i13 | 0;
  if (i10 >>> 0 < i7 >>> 0) _abort();
  if ((i10 | 0) == (HEAP32[525] | 0)) {
   i1 = i15 + (i13 + -4) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 & 3 | 0) != 3) {
    i20 = i10;
    i5 = i11;
    break;
   }
   HEAP32[522] = i11;
   HEAP32[i1 >> 2] = i2 & -2;
   HEAP32[i15 + (i8 + 4) >> 2] = i11 | 1;
   HEAP32[i16 >> 2] = i11;
   return;
  }
  i4 = i1 >>> 3;
  if (i1 >>> 0 < 256) {
   i3 = HEAP32[i15 + (i8 + 8) >> 2] | 0;
   i2 = HEAP32[i15 + (i8 + 12) >> 2] | 0;
   i1 = 2120 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < i7 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i10 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[520] = HEAP32[520] & ~(1 << i4);
    i20 = i10;
    i5 = i11;
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < i7 >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) i6 = i1; else _abort();
   } else i6 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i6 >> 2] = i3;
   i20 = i10;
   i5 = i11;
   break;
  }
  i6 = HEAP32[i15 + (i8 + 24) >> 2] | 0;
  i3 = HEAP32[i15 + (i8 + 12) >> 2] | 0;
  do if ((i3 | 0) == (i10 | 0)) {
   i2 = i15 + (i8 + 20) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) {
    i2 = i15 + (i8 + 16) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i9 = 0;
     break;
    }
   }
   while (1) {
    i3 = i1 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4) {
     i1 = i4;
     i2 = i3;
     continue;
    }
    i3 = i1 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) break; else {
     i1 = i4;
     i2 = i3;
    }
   }
   if (i2 >>> 0 < i7 >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = 0;
    i9 = i1;
    break;
   }
  } else {
   i4 = HEAP32[i15 + (i8 + 8) >> 2] | 0;
   if (i4 >>> 0 < i7 >>> 0) _abort();
   i1 = i4 + 12 | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i10 | 0)) _abort();
   i2 = i3 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i10 | 0)) {
    HEAP32[i1 >> 2] = i3;
    HEAP32[i2 >> 2] = i4;
    i9 = i3;
    break;
   } else _abort();
  } while (0);
  if (i6) {
   i1 = HEAP32[i15 + (i8 + 28) >> 2] | 0;
   i2 = 2384 + (i1 << 2) | 0;
   if ((i10 | 0) == (HEAP32[i2 >> 2] | 0)) {
    HEAP32[i2 >> 2] = i9;
    if (!i9) {
     HEAP32[521] = HEAP32[521] & ~(1 << i1);
     i20 = i10;
     i5 = i11;
     break;
    }
   } else {
    if (i6 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
    i1 = i6 + 16 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) HEAP32[i1 >> 2] = i9; else HEAP32[i6 + 20 >> 2] = i9;
    if (!i9) {
     i20 = i10;
     i5 = i11;
     break;
    }
   }
   i2 = HEAP32[524] | 0;
   if (i9 >>> 0 < i2 >>> 0) _abort();
   HEAP32[i9 + 24 >> 2] = i6;
   i1 = HEAP32[i15 + (i8 + 16) >> 2] | 0;
   do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
    HEAP32[i9 + 16 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i9;
    break;
   } while (0);
   i1 = HEAP32[i15 + (i8 + 20) >> 2] | 0;
   if (i1) if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
    HEAP32[i9 + 20 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i9;
    i20 = i10;
    i5 = i11;
    break;
   } else {
    i20 = i10;
    i5 = i11;
   }
  } else {
   i20 = i10;
   i5 = i11;
  }
 } else {
  i20 = i1;
  i5 = i13;
 } while (0);
 if (i20 >>> 0 >= i16 >>> 0) _abort();
 i1 = i15 + (i13 + -4) | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!(i2 & 1)) _abort();
 if (!(i2 & 2)) {
  if ((i16 | 0) == (HEAP32[526] | 0)) {
   i19 = (HEAP32[523] | 0) + i5 | 0;
   HEAP32[523] = i19;
   HEAP32[526] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   if ((i20 | 0) != (HEAP32[525] | 0)) return;
   HEAP32[525] = 0;
   HEAP32[522] = 0;
   return;
  }
  if ((i16 | 0) == (HEAP32[525] | 0)) {
   i19 = (HEAP32[522] | 0) + i5 | 0;
   HEAP32[522] = i19;
   HEAP32[525] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   HEAP32[i20 + i19 >> 2] = i19;
   return;
  }
  i5 = (i2 & -8) + i5 | 0;
  i4 = i2 >>> 3;
  do if (i2 >>> 0 >= 256) {
   i6 = HEAP32[i15 + (i13 + 16) >> 2] | 0;
   i1 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   do if ((i1 | 0) == (i16 | 0)) {
    i2 = i15 + (i13 + 12) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i2 = i15 + (i13 + 8) | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i14 = 0;
      break;
     }
    }
    while (1) {
     i3 = i1 + 20 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (i4) {
      i1 = i4;
      i2 = i3;
      continue;
     }
     i3 = i1 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) break; else {
      i1 = i4;
      i2 = i3;
     }
    }
    if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
     HEAP32[i2 >> 2] = 0;
     i14 = i1;
     break;
    }
   } else {
    i2 = HEAP32[i15 + i13 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
    i3 = i2 + 12 | 0;
    if ((HEAP32[i3 >> 2] | 0) != (i16 | 0)) _abort();
    i4 = i1 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) {
     HEAP32[i3 >> 2] = i1;
     HEAP32[i4 >> 2] = i2;
     i14 = i1;
     break;
    } else _abort();
   } while (0);
   if (i6) {
    i1 = HEAP32[i15 + (i13 + 20) >> 2] | 0;
    i2 = 2384 + (i1 << 2) | 0;
    if ((i16 | 0) == (HEAP32[i2 >> 2] | 0)) {
     HEAP32[i2 >> 2] = i14;
     if (!i14) {
      HEAP32[521] = HEAP32[521] & ~(1 << i1);
      break;
     }
    } else {
     if (i6 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
     i1 = i6 + 16 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) HEAP32[i1 >> 2] = i14; else HEAP32[i6 + 20 >> 2] = i14;
     if (!i14) break;
    }
    i2 = HEAP32[524] | 0;
    if (i14 >>> 0 < i2 >>> 0) _abort();
    HEAP32[i14 + 24 >> 2] = i6;
    i1 = HEAP32[i15 + (i13 + 8) >> 2] | 0;
    do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
     HEAP32[i14 + 16 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i14;
     break;
    } while (0);
    i1 = HEAP32[i15 + (i13 + 12) >> 2] | 0;
    if (i1) if (i1 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
     HEAP32[i14 + 20 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i14;
     break;
    }
   }
  } else {
   i3 = HEAP32[i15 + i13 >> 2] | 0;
   i2 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   i1 = 2120 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i16 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[520] = HEAP32[520] & ~(1 << i4);
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) i12 = i1; else _abort();
   } else i12 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i12 >> 2] = i3;
  } while (0);
  HEAP32[i20 + 4 >> 2] = i5 | 1;
  HEAP32[i20 + i5 >> 2] = i5;
  if ((i20 | 0) == (HEAP32[525] | 0)) {
   HEAP32[522] = i5;
   return;
  }
 } else {
  HEAP32[i1 >> 2] = i2 & -2;
  HEAP32[i20 + 4 >> 2] = i5 | 1;
  HEAP32[i20 + i5 >> 2] = i5;
 }
 i1 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i2 = i1 << 1;
  i4 = 2120 + (i2 << 2) | 0;
  i3 = HEAP32[520] | 0;
  i1 = 1 << i1;
  if (i3 & i1) {
   i1 = 2120 + (i2 + 2 << 2) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
    i17 = i1;
    i18 = i2;
   }
  } else {
   HEAP32[520] = i3 | i1;
   i17 = 2120 + (i2 + 2 << 2) | 0;
   i18 = i4;
  }
  HEAP32[i17 >> 2] = i20;
  HEAP32[i18 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i18;
  HEAP32[i20 + 12 >> 2] = i4;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
  i17 = (i1 + 1048320 | 0) >>> 16 & 8;
  i18 = i1 << i17;
  i16 = (i18 + 520192 | 0) >>> 16 & 4;
  i18 = i18 << i16;
  i4 = (i18 + 245760 | 0) >>> 16 & 2;
  i4 = 14 - (i16 | i17 | i4) + (i18 << i4 >>> 15) | 0;
  i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
 } else i4 = 0;
 i1 = 2384 + (i4 << 2) | 0;
 HEAP32[i20 + 28 >> 2] = i4;
 HEAP32[i20 + 20 >> 2] = 0;
 HEAP32[i20 + 16 >> 2] = 0;
 i2 = HEAP32[521] | 0;
 i3 = 1 << i4;
 L199 : do if (i2 & i3) {
  i1 = HEAP32[i1 >> 2] | 0;
  L202 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
   i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
   while (1) {
    i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if (!i3) break;
    if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
     i19 = i3;
     break L202;
    } else {
     i4 = i4 << 1;
     i1 = i3;
    }
   }
   if (i2 >>> 0 < (HEAP32[524] | 0) >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = i20;
    HEAP32[i20 + 24 >> 2] = i1;
    HEAP32[i20 + 12 >> 2] = i20;
    HEAP32[i20 + 8 >> 2] = i20;
    break L199;
   }
  } else i19 = i1; while (0);
  i1 = i19 + 8 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i18 = HEAP32[524] | 0;
  if (i2 >>> 0 >= i18 >>> 0 & i19 >>> 0 >= i18 >>> 0) {
   HEAP32[i2 + 12 >> 2] = i20;
   HEAP32[i1 >> 2] = i20;
   HEAP32[i20 + 8 >> 2] = i2;
   HEAP32[i20 + 12 >> 2] = i19;
   HEAP32[i20 + 24 >> 2] = 0;
   break;
  } else _abort();
 } else {
  HEAP32[521] = i2 | i3;
  HEAP32[i1 >> 2] = i20;
  HEAP32[i20 + 24 >> 2] = i1;
  HEAP32[i20 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i20;
 } while (0);
 i20 = (HEAP32[528] | 0) + -1 | 0;
 HEAP32[528] = i20;
 if (!i20) i1 = 2536; else return;
 while (1) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i1) break; else i1 = i1 + 8 | 0;
 }
 HEAP32[528] = -1;
 return;
}

function __ZN13b2DynamicTree7BalanceEi(i10, i16) {
 i10 = i10 | 0;
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, d21 = 0.0, d22 = 0.0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0;
 if ((i16 | 0) == -1) ___assert_fail(5139, 4451, 379, 5150);
 i13 = HEAP32[i10 + 4 >> 2] | 0;
 i14 = i13 + (i16 * 36 | 0) | 0;
 i9 = i13 + (i16 * 36 | 0) + 24 | 0;
 i20 = HEAP32[i9 >> 2] | 0;
 if ((i20 | 0) == -1) {
  i20 = i16;
  return i20 | 0;
 }
 i15 = i13 + (i16 * 36 | 0) + 32 | 0;
 if ((HEAP32[i15 >> 2] | 0) < 2) {
  i20 = i16;
  return i20 | 0;
 }
 i8 = i13 + (i16 * 36 | 0) + 28 | 0;
 i17 = HEAP32[i8 >> 2] | 0;
 if ((i20 | 0) <= -1) ___assert_fail(5158, 4451, 389, 5150);
 i2 = HEAP32[i10 + 12 >> 2] | 0;
 if ((i20 | 0) >= (i2 | 0)) ___assert_fail(5158, 4451, 389, 5150);
 if (!((i17 | 0) > -1 & (i17 | 0) < (i2 | 0))) ___assert_fail(5189, 4451, 390, 5150);
 i11 = i13 + (i20 * 36 | 0) | 0;
 i12 = i13 + (i17 * 36 | 0) | 0;
 i18 = i13 + (i17 * 36 | 0) + 32 | 0;
 i19 = i13 + (i20 * 36 | 0) + 32 | 0;
 i1 = (HEAP32[i18 >> 2] | 0) - (HEAP32[i19 >> 2] | 0) | 0;
 if ((i1 | 0) > 1) {
  i1 = i13 + (i17 * 36 | 0) + 24 | 0;
  i3 = HEAP32[i1 >> 2] | 0;
  i4 = i13 + (i17 * 36 | 0) + 28 | 0;
  i5 = HEAP32[i4 >> 2] | 0;
  i6 = i13 + (i3 * 36 | 0) | 0;
  i7 = i13 + (i5 * 36 | 0) | 0;
  if (!((i3 | 0) > -1 & (i3 | 0) < (i2 | 0))) ___assert_fail(5220, 4451, 404, 5150);
  if (!((i5 | 0) > -1 & (i5 | 0) < (i2 | 0))) ___assert_fail(5251, 4451, 405, 5150);
  HEAP32[i1 >> 2] = i16;
  i9 = i13 + (i16 * 36 | 0) + 20 | 0;
  i2 = i13 + (i17 * 36 | 0) + 20 | 0;
  HEAP32[i2 >> 2] = HEAP32[i9 >> 2];
  HEAP32[i9 >> 2] = i17;
  i2 = HEAP32[i2 >> 2] | 0;
  do if ((i2 | 0) != -1) {
   i1 = i13 + (i2 * 36 | 0) + 24 | 0;
   if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) {
    HEAP32[i1 >> 2] = i17;
    break;
   }
   i1 = i13 + (i2 * 36 | 0) + 28 | 0;
   if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) {
    HEAP32[i1 >> 2] = i17;
    break;
   } else ___assert_fail(5282, 4451, 421, 5150);
  } else HEAP32[i10 >> 2] = i17; while (0);
  i1 = i13 + (i3 * 36 | 0) + 32 | 0;
  i2 = i13 + (i5 * 36 | 0) + 32 | 0;
  if ((HEAP32[i1 >> 2] | 0) > (HEAP32[i2 >> 2] | 0)) {
   HEAP32[i4 >> 2] = i3;
   HEAP32[i8 >> 2] = i5;
   HEAP32[i13 + (i5 * 36 | 0) + 20 >> 2] = i16;
   d26 = +HEAPF32[i11 >> 2];
   d21 = +HEAPF32[i7 >> 2];
   d21 = d26 < d21 ? d26 : d21;
   d26 = +HEAPF32[i13 + (i20 * 36 | 0) + 4 >> 2];
   d23 = +HEAPF32[i13 + (i5 * 36 | 0) + 4 >> 2];
   d23 = d26 < d23 ? d26 : d23;
   HEAPF32[i14 >> 2] = d21;
   HEAPF32[i13 + (i16 * 36 | 0) + 4 >> 2] = d23;
   d26 = +HEAPF32[i13 + (i20 * 36 | 0) + 8 >> 2];
   d25 = +HEAPF32[i13 + (i5 * 36 | 0) + 8 >> 2];
   d24 = +HEAPF32[i13 + (i20 * 36 | 0) + 12 >> 2];
   d22 = +HEAPF32[i13 + (i5 * 36 | 0) + 12 >> 2];
   i14 = i13 + (i16 * 36 | 0) + 8 | 0;
   HEAPF32[i14 >> 2] = d26 > d25 ? d26 : d25;
   i20 = i13 + (i16 * 36 | 0) + 12 | 0;
   HEAPF32[i20 >> 2] = d24 > d22 ? d24 : d22;
   d22 = +HEAPF32[i6 >> 2];
   d24 = +HEAPF32[i13 + (i3 * 36 | 0) + 4 >> 2];
   HEAPF32[i12 >> 2] = d21 < d22 ? d21 : d22;
   HEAPF32[i13 + (i17 * 36 | 0) + 4 >> 2] = d23 < d24 ? d23 : d24;
   d24 = +HEAPF32[i14 >> 2];
   d23 = +HEAPF32[i13 + (i3 * 36 | 0) + 8 >> 2];
   d22 = +HEAPF32[i20 >> 2];
   d21 = +HEAPF32[i13 + (i3 * 36 | 0) + 12 >> 2];
   HEAPF32[i13 + (i17 * 36 | 0) + 8 >> 2] = d24 > d23 ? d24 : d23;
   HEAPF32[i13 + (i17 * 36 | 0) + 12 >> 2] = d22 > d21 ? d22 : d21;
   i19 = HEAP32[i19 >> 2] | 0;
   i20 = HEAP32[i2 >> 2] | 0;
   i20 = ((i19 | 0) > (i20 | 0) ? i19 : i20) + 1 | 0;
   HEAP32[i15 >> 2] = i20;
   i1 = HEAP32[i1 >> 2] | 0;
   i1 = (i20 | 0) > (i1 | 0) ? i20 : i1;
  } else {
   HEAP32[i4 >> 2] = i5;
   HEAP32[i8 >> 2] = i3;
   HEAP32[i13 + (i3 * 36 | 0) + 20 >> 2] = i16;
   d21 = +HEAPF32[i11 >> 2];
   d26 = +HEAPF32[i6 >> 2];
   d26 = d21 < d26 ? d21 : d26;
   d21 = +HEAPF32[i13 + (i20 * 36 | 0) + 4 >> 2];
   d24 = +HEAPF32[i13 + (i3 * 36 | 0) + 4 >> 2];
   d24 = d21 < d24 ? d21 : d24;
   HEAPF32[i14 >> 2] = d26;
   HEAPF32[i13 + (i16 * 36 | 0) + 4 >> 2] = d24;
   d21 = +HEAPF32[i13 + (i20 * 36 | 0) + 8 >> 2];
   d22 = +HEAPF32[i13 + (i3 * 36 | 0) + 8 >> 2];
   d23 = +HEAPF32[i13 + (i20 * 36 | 0) + 12 >> 2];
   d25 = +HEAPF32[i13 + (i3 * 36 | 0) + 12 >> 2];
   i14 = i13 + (i16 * 36 | 0) + 8 | 0;
   HEAPF32[i14 >> 2] = d21 > d22 ? d21 : d22;
   i20 = i13 + (i16 * 36 | 0) + 12 | 0;
   HEAPF32[i20 >> 2] = d23 > d25 ? d23 : d25;
   d25 = +HEAPF32[i7 >> 2];
   d23 = +HEAPF32[i13 + (i5 * 36 | 0) + 4 >> 2];
   HEAPF32[i12 >> 2] = d26 < d25 ? d26 : d25;
   HEAPF32[i13 + (i17 * 36 | 0) + 4 >> 2] = d24 < d23 ? d24 : d23;
   d23 = +HEAPF32[i14 >> 2];
   d24 = +HEAPF32[i13 + (i5 * 36 | 0) + 8 >> 2];
   d25 = +HEAPF32[i20 >> 2];
   d26 = +HEAPF32[i13 + (i5 * 36 | 0) + 12 >> 2];
   HEAPF32[i13 + (i17 * 36 | 0) + 8 >> 2] = d23 > d24 ? d23 : d24;
   HEAPF32[i13 + (i17 * 36 | 0) + 12 >> 2] = d25 > d26 ? d25 : d26;
   i19 = HEAP32[i19 >> 2] | 0;
   i20 = HEAP32[i1 >> 2] | 0;
   i20 = ((i19 | 0) > (i20 | 0) ? i19 : i20) + 1 | 0;
   HEAP32[i15 >> 2] = i20;
   i1 = HEAP32[i2 >> 2] | 0;
   i1 = (i20 | 0) > (i1 | 0) ? i20 : i1;
  }
  HEAP32[i18 >> 2] = i1 + 1;
  i20 = i17;
  return i20 | 0;
 }
 if ((i1 | 0) >= -1) {
  i20 = i16;
  return i20 | 0;
 }
 i1 = i13 + (i20 * 36 | 0) + 24 | 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = i13 + (i20 * 36 | 0) + 28 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i6 = i13 + (i3 * 36 | 0) | 0;
 i7 = i13 + (i5 * 36 | 0) | 0;
 if (!((i3 | 0) > -1 & (i3 | 0) < (i2 | 0))) ___assert_fail(5314, 4451, 464, 5150);
 if (!((i5 | 0) > -1 & (i5 | 0) < (i2 | 0))) ___assert_fail(5345, 4451, 465, 5150);
 HEAP32[i1 >> 2] = i16;
 i8 = i13 + (i16 * 36 | 0) + 20 | 0;
 i2 = i13 + (i20 * 36 | 0) + 20 | 0;
 HEAP32[i2 >> 2] = HEAP32[i8 >> 2];
 HEAP32[i8 >> 2] = i20;
 i2 = HEAP32[i2 >> 2] | 0;
 do if ((i2 | 0) != -1) {
  i1 = i13 + (i2 * 36 | 0) + 24 | 0;
  if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) {
   HEAP32[i1 >> 2] = i20;
   break;
  }
  i1 = i13 + (i2 * 36 | 0) + 28 | 0;
  if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) {
   HEAP32[i1 >> 2] = i20;
   break;
  } else ___assert_fail(5376, 4451, 481, 5150);
 } else HEAP32[i10 >> 2] = i20; while (0);
 i1 = i13 + (i3 * 36 | 0) + 32 | 0;
 i2 = i13 + (i5 * 36 | 0) + 32 | 0;
 if ((HEAP32[i1 >> 2] | 0) > (HEAP32[i2 >> 2] | 0)) {
  HEAP32[i4 >> 2] = i3;
  HEAP32[i9 >> 2] = i5;
  HEAP32[i13 + (i5 * 36 | 0) + 20 >> 2] = i16;
  d21 = +HEAPF32[i12 >> 2];
  d26 = +HEAPF32[i7 >> 2];
  d26 = d21 < d26 ? d21 : d26;
  d21 = +HEAPF32[i13 + (i17 * 36 | 0) + 4 >> 2];
  d24 = +HEAPF32[i13 + (i5 * 36 | 0) + 4 >> 2];
  d24 = d21 < d24 ? d21 : d24;
  HEAPF32[i14 >> 2] = d26;
  HEAPF32[i13 + (i16 * 36 | 0) + 4 >> 2] = d24;
  d21 = +HEAPF32[i13 + (i17 * 36 | 0) + 8 >> 2];
  d22 = +HEAPF32[i13 + (i5 * 36 | 0) + 8 >> 2];
  d23 = +HEAPF32[i13 + (i17 * 36 | 0) + 12 >> 2];
  d25 = +HEAPF32[i13 + (i5 * 36 | 0) + 12 >> 2];
  i14 = i13 + (i16 * 36 | 0) + 8 | 0;
  HEAPF32[i14 >> 2] = d21 > d22 ? d21 : d22;
  i17 = i13 + (i16 * 36 | 0) + 12 | 0;
  HEAPF32[i17 >> 2] = d23 > d25 ? d23 : d25;
  d25 = +HEAPF32[i6 >> 2];
  d23 = +HEAPF32[i13 + (i3 * 36 | 0) + 4 >> 2];
  HEAPF32[i11 >> 2] = d26 < d25 ? d26 : d25;
  HEAPF32[i13 + (i20 * 36 | 0) + 4 >> 2] = d24 < d23 ? d24 : d23;
  d23 = +HEAPF32[i14 >> 2];
  d24 = +HEAPF32[i13 + (i3 * 36 | 0) + 8 >> 2];
  d25 = +HEAPF32[i17 >> 2];
  d26 = +HEAPF32[i13 + (i3 * 36 | 0) + 12 >> 2];
  HEAPF32[i13 + (i20 * 36 | 0) + 8 >> 2] = d23 > d24 ? d23 : d24;
  HEAPF32[i13 + (i20 * 36 | 0) + 12 >> 2] = d25 > d26 ? d25 : d26;
  i17 = HEAP32[i18 >> 2] | 0;
  i18 = HEAP32[i2 >> 2] | 0;
  i18 = ((i17 | 0) > (i18 | 0) ? i17 : i18) + 1 | 0;
  HEAP32[i15 >> 2] = i18;
  i1 = HEAP32[i1 >> 2] | 0;
  i1 = (i18 | 0) > (i1 | 0) ? i18 : i1;
 } else {
  HEAP32[i4 >> 2] = i5;
  HEAP32[i9 >> 2] = i3;
  HEAP32[i13 + (i3 * 36 | 0) + 20 >> 2] = i16;
  d21 = +HEAPF32[i12 >> 2];
  d26 = +HEAPF32[i6 >> 2];
  d26 = d21 < d26 ? d21 : d26;
  d21 = +HEAPF32[i13 + (i17 * 36 | 0) + 4 >> 2];
  d24 = +HEAPF32[i13 + (i3 * 36 | 0) + 4 >> 2];
  d24 = d21 < d24 ? d21 : d24;
  HEAPF32[i14 >> 2] = d26;
  HEAPF32[i13 + (i16 * 36 | 0) + 4 >> 2] = d24;
  d21 = +HEAPF32[i13 + (i17 * 36 | 0) + 8 >> 2];
  d22 = +HEAPF32[i13 + (i3 * 36 | 0) + 8 >> 2];
  d23 = +HEAPF32[i13 + (i17 * 36 | 0) + 12 >> 2];
  d25 = +HEAPF32[i13 + (i3 * 36 | 0) + 12 >> 2];
  i14 = i13 + (i16 * 36 | 0) + 8 | 0;
  HEAPF32[i14 >> 2] = d21 > d22 ? d21 : d22;
  i17 = i13 + (i16 * 36 | 0) + 12 | 0;
  HEAPF32[i17 >> 2] = d23 > d25 ? d23 : d25;
  d25 = +HEAPF32[i7 >> 2];
  d23 = +HEAPF32[i13 + (i5 * 36 | 0) + 4 >> 2];
  HEAPF32[i11 >> 2] = d26 < d25 ? d26 : d25;
  HEAPF32[i13 + (i20 * 36 | 0) + 4 >> 2] = d24 < d23 ? d24 : d23;
  d23 = +HEAPF32[i14 >> 2];
  d24 = +HEAPF32[i13 + (i5 * 36 | 0) + 8 >> 2];
  d25 = +HEAPF32[i17 >> 2];
  d26 = +HEAPF32[i13 + (i5 * 36 | 0) + 12 >> 2];
  HEAPF32[i13 + (i20 * 36 | 0) + 8 >> 2] = d23 > d24 ? d23 : d24;
  HEAPF32[i13 + (i20 * 36 | 0) + 12 >> 2] = d25 > d26 ? d25 : d26;
  i17 = HEAP32[i18 >> 2] | 0;
  i18 = HEAP32[i1 >> 2] | 0;
  i18 = ((i17 | 0) > (i18 | 0) ? i17 : i18) + 1 | 0;
  HEAP32[i15 >> 2] = i18;
  i1 = HEAP32[i2 >> 2] | 0;
  i1 = (i18 | 0) > (i1 | 0) ? i18 : i1;
 }
 HEAP32[i19 >> 2] = i1 + 1;
 return i20 | 0;
}

function __ZN7b2World5SolveERK10b2TimeStep(i50, i44) {
 i50 = i50 | 0;
 i44 = i44 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i51 = 0, i52 = 0, d53 = 0.0, d54 = 0.0, d55 = 0.0, d56 = 0.0, d57 = 0.0;
 i52 = STACKTOP;
 STACKTOP = STACKTOP + 112 | 0;
 i51 = i52;
 i49 = i52 + 48 | 0;
 i43 = i52 + 16 | 0;
 i40 = i50 + 103012 | 0;
 HEAPF32[i40 >> 2] = 0.0;
 i41 = i50 + 103016 | 0;
 HEAPF32[i41 >> 2] = 0.0;
 i42 = i50 + 103020 | 0;
 HEAPF32[i42 >> 2] = 0.0;
 i3 = i50 + 102964 | 0;
 i47 = i50 + 102876 | 0;
 __ZN8b2IslandC2EiiiP16b2StackAllocatorP17b2ContactListener(i49, HEAP32[i3 >> 2] | 0, HEAP32[i50 + 102940 >> 2] | 0, HEAP32[i50 + 102968 >> 2] | 0, i50 + 72 | 0, HEAP32[i50 + 102948 >> 2] | 0);
 i45 = i50 + 102956 | 0;
 i2 = HEAP32[i45 >> 2] | 0;
 if (i2) do {
  i39 = i2 + 4 | 0;
  HEAP16[i39 >> 1] = HEAPU16[i39 >> 1] & 65534;
  i2 = HEAP32[i2 + 96 >> 2] | 0;
 } while ((i2 | 0) != 0);
 i2 = HEAP32[i50 + 102936 >> 2] | 0;
 if (i2) do {
  i39 = i2 + 4 | 0;
  HEAP32[i39 >> 2] = HEAP32[i39 >> 2] & -2;
  i2 = HEAP32[i2 + 12 >> 2] | 0;
 } while ((i2 | 0) != 0);
 i2 = HEAP32[i50 + 102960 >> 2] | 0;
 if (i2) do {
  HEAP8[i2 + 60 >> 0] = 0;
  i2 = HEAP32[i2 + 12 >> 2] | 0;
 } while ((i2 | 0) != 0);
 i36 = HEAP32[i3 >> 2] | 0;
 i5 = i36 << 2;
 i39 = i50 + 102868 | 0;
 i3 = HEAP32[i39 >> 2] | 0;
 if ((i3 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i2 = i50 + 102484 + (i3 * 12 | 0) | 0;
 HEAP32[i50 + 102484 + (i3 * 12 | 0) + 4 >> 2] = i5;
 i38 = i50 + 102472 | 0;
 i4 = HEAP32[i38 >> 2] | 0;
 if ((i4 + i5 | 0) > 102400) {
  HEAP32[i2 >> 2] = _malloc(i5) | 0;
  HEAP8[i50 + 102484 + (i3 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i2 >> 2] = i50 + 72 + i4;
  HEAP8[i50 + 102484 + (i3 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i38 >> 2] = (HEAP32[i38 >> 2] | 0) + i5;
 }
 i37 = i50 + 102476 | 0;
 i35 = (HEAP32[i37 >> 2] | 0) + i5 | 0;
 HEAP32[i37 >> 2] = i35;
 i3 = i50 + 102480 | 0;
 i34 = HEAP32[i3 >> 2] | 0;
 HEAP32[i3 >> 2] = (i34 | 0) > (i35 | 0) ? i34 : i35;
 i3 = (HEAP32[i39 >> 2] | 0) + 1 | 0;
 HEAP32[i39 >> 2] = i3;
 i35 = HEAP32[i2 >> 2] | 0;
 i2 = HEAP32[i45 >> 2] | 0;
 do if (i2) {
  i21 = i49 + 28 | 0;
  i22 = i49 + 36 | 0;
  i23 = i49 + 32 | 0;
  i24 = i49 + 40 | 0;
  i25 = i49 + 8 | 0;
  i26 = i49 + 48 | 0;
  i27 = i49 + 16 | 0;
  i28 = i49 + 44 | 0;
  i29 = i49 + 12 | 0;
  i30 = i50 + 102972 | 0;
  i31 = i50 + 102980 | 0;
  i32 = i43 + 12 | 0;
  i33 = i43 + 16 | 0;
  i34 = i43 + 20 | 0;
  L22 : while (1) {
   i3 = i2 + 4 | 0;
   i4 = HEAP16[i3 >> 1] | 0;
   if ((i4 & 35) == 34 ? (HEAP32[i2 >> 2] | 0) != 0 : 0) {
    HEAP32[i21 >> 2] = 0;
    HEAP32[i22 >> 2] = 0;
    HEAP32[i23 >> 2] = 0;
    HEAP32[i35 >> 2] = i2;
    HEAP16[i3 >> 1] = i4 & 65535 | 1;
    i15 = HEAP32[i24 >> 2] | 0;
    i20 = HEAP32[i25 >> 2] | 0;
    i16 = HEAP32[i26 >> 2] | 0;
    i17 = HEAP32[i27 >> 2] | 0;
    i18 = HEAP32[i28 >> 2] | 0;
    i19 = HEAP32[i29 >> 2] | 0;
    i6 = 0;
    i9 = 0;
    i3 = 0;
    i4 = 1;
    while (1) {
     i4 = i4 + -1 | 0;
     i13 = HEAP32[i35 + (i4 << 2) >> 2] | 0;
     i8 = i13 + 4 | 0;
     i7 = HEAP16[i8 >> 1] | 0;
     if (!(i7 & 32)) {
      i2 = 18;
      break L22;
     }
     if ((i3 | 0) >= (i15 | 0)) {
      i2 = 20;
      break L22;
     }
     HEAP32[i13 + 8 >> 2] = i3;
     HEAP32[i20 + (i3 << 2) >> 2] = i13;
     i5 = i3 + 1 | 0;
     HEAP32[i21 >> 2] = i5;
     i7 = i7 & 65535;
     if (!(i7 & 2)) {
      HEAP16[i8 >> 1] = i7 | 2;
      HEAPF32[i13 + 144 >> 2] = 0.0;
      i14 = HEAP32[i13 + 88 >> 2] | 0;
      HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 1;
     }
     if (HEAP32[i13 >> 2] | 0) {
      i8 = HEAP32[i13 + 112 >> 2] | 0;
      if (!i8) i14 = i9; else {
       i7 = i9;
       while (1) {
        i9 = HEAP32[i8 + 4 >> 2] | 0;
        i10 = i9 + 4 | 0;
        i11 = HEAP32[i10 >> 2] | 0;
        do if ((i11 & 7 | 0) == 6) {
         if (HEAP8[(HEAP32[i9 + 48 >> 2] | 0) + 38 >> 0] | 0) break;
         if (HEAP8[(HEAP32[i9 + 52 >> 2] | 0) + 38 >> 0] | 0) break;
         if ((i7 | 0) >= (i18 | 0)) {
          i2 = 30;
          break L22;
         }
         i12 = i7 + 1 | 0;
         HEAP32[i22 >> 2] = i12;
         HEAP32[i19 + (i7 << 2) >> 2] = i9;
         HEAP32[i10 >> 2] = i11 | 1;
         i7 = HEAP32[i8 >> 2] | 0;
         i9 = i7 + 4 | 0;
         i10 = HEAP16[i9 >> 1] | 0;
         if (i10 & 1) {
          i7 = i12;
          break;
         }
         if ((i4 | 0) >= (i36 | 0)) {
          i2 = 33;
          break L22;
         }
         HEAP32[i35 + (i4 << 2) >> 2] = i7;
         HEAP16[i9 >> 1] = i10 & 65535 | 1;
         i7 = i12;
         i4 = i4 + 1 | 0;
        } while (0);
        i8 = HEAP32[i8 + 12 >> 2] | 0;
        if (!i8) {
         i14 = i7;
         break;
        }
       }
      }
      i7 = HEAP32[i13 + 108 >> 2] | 0;
      if (!i7) i7 = i14; else while (1) {
       i8 = i7 + 4 | 0;
       i9 = HEAP32[i8 >> 2] | 0;
       do if (!(HEAP8[i9 + 60 >> 0] | 0)) {
        i10 = HEAP32[i7 >> 2] | 0;
        i11 = i10 + 4 | 0;
        i12 = HEAP16[i11 >> 1] | 0;
        if (!(i12 & 32)) break;
        if ((i6 | 0) >= (i16 | 0)) {
         i2 = 40;
         break L22;
        }
        i13 = i6 + 1 | 0;
        HEAP32[i23 >> 2] = i13;
        HEAP32[i17 + (i6 << 2) >> 2] = i9;
        HEAP8[(HEAP32[i8 >> 2] | 0) + 60 >> 0] = 1;
        if (i12 & 1) {
         i6 = i13;
         break;
        }
        if ((i4 | 0) >= (i36 | 0)) {
         i2 = 43;
         break L22;
        }
        HEAP32[i35 + (i4 << 2) >> 2] = i10;
        HEAP16[i11 >> 1] = i12 & 65535 | 1;
        i6 = i13;
        i4 = i4 + 1 | 0;
       } while (0);
       i7 = HEAP32[i7 + 12 >> 2] | 0;
       if (!i7) {
        i7 = i14;
        break;
       }
      }
     } else i7 = i9;
     if ((i4 | 0) > 0) {
      i9 = i7;
      i3 = i5;
     } else break;
    }
    __ZN8b2Island5SolveEP9b2ProfileRK10b2TimeStepRK6b2Vec2b(i49, i43, i44, i30, (HEAP8[i31 >> 0] | 0) != 0);
    HEAPF32[i40 >> 2] = +HEAPF32[i32 >> 2] + +HEAPF32[i40 >> 2];
    HEAPF32[i41 >> 2] = +HEAPF32[i33 >> 2] + +HEAPF32[i41 >> 2];
    HEAPF32[i42 >> 2] = +HEAPF32[i34 >> 2] + +HEAPF32[i42 >> 2];
    if ((i3 | 0) > -1) {
     i4 = 0;
     do {
      i3 = HEAP32[i20 + (i4 << 2) >> 2] | 0;
      if (!(HEAP32[i3 >> 2] | 0)) {
       i19 = i3 + 4 | 0;
       HEAP16[i19 >> 1] = HEAPU16[i19 >> 1] & 65534;
      }
      i4 = i4 + 1 | 0;
     } while ((i4 | 0) < (i5 | 0));
    }
   }
   i2 = HEAP32[i2 + 96 >> 2] | 0;
   if (!i2) {
    i2 = 51;
    break;
   }
  }
  if ((i2 | 0) == 18) ___assert_fail(6757, 6695, 447, 6779); else if ((i2 | 0) == 20) ___assert_fail(6785, 6814, 54, 6862); else if ((i2 | 0) == 30) ___assert_fail(6866, 6814, 62, 6862); else if ((i2 | 0) == 33) ___assert_fail(6901, 6695, 497, 6779); else if ((i2 | 0) == 40) ___assert_fail(6924, 6814, 68, 6862); else if ((i2 | 0) == 43) ___assert_fail(6901, 6695, 526, 6779); else if ((i2 | 0) == 51) {
   i1 = HEAP32[i39 >> 2] | 0;
   break;
  }
 } else i1 = i3; while (0);
 if ((i1 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i2 = i1 + -1 | 0;
 if ((HEAP32[i50 + 102484 + (i2 * 12 | 0) >> 2] | 0) != (i35 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i50 + 102484 + (i2 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i50 + 102484 + (i2 * 12 | 0) + 4 | 0;
  HEAP32[i38 >> 2] = (HEAP32[i38 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 } else {
  _free(i35);
  i2 = i50 + 102484 + (i2 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i39 >> 2] | 0;
 }
 HEAP32[i37 >> 2] = (HEAP32[i37 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i39 >> 2] = i1 + -1;
 i1 = HEAP32[i45 >> 2] | 0;
 if (!i1) {
  __ZN12b2BroadPhase11UpdatePairsI16b2ContactManagerEEvPT_(i47, i47);
  i51 = i50 + 103024 | 0;
  HEAPF32[i51 >> 2] = 0.0;
  __ZN8b2IslandD2Ev(i49);
  STACKTOP = i52;
  return;
 }
 i4 = i51 + 8 | 0;
 i5 = i51 + 12 | 0;
 i6 = i51 + 4 | 0;
 do {
  if (((HEAP16[i1 + 4 >> 1] & 1) != 0 ? (HEAP32[i1 >> 2] | 0) != 0 : 0) ? (d57 = +HEAPF32[i1 + 52 >> 2], d55 = +Math_sin(+d57), HEAPF32[i4 >> 2] = d55, d57 = +Math_cos(+d57), HEAPF32[i5 >> 2] = d57, d56 = +HEAPF32[i1 + 28 >> 2], d54 = +HEAPF32[i1 + 32 >> 2], d53 = +HEAPF32[i1 + 40 >> 2] - (d55 * d56 + d57 * d54), HEAPF32[i51 >> 2] = +HEAPF32[i1 + 36 >> 2] - (d57 * d56 - d55 * d54), HEAPF32[i6 >> 2] = d53, i46 = (HEAP32[i1 + 88 >> 2] | 0) + 102876 | 0, i48 = HEAP32[i1 + 100 >> 2] | 0, (i48 | 0) != 0) : 0) {
   i2 = i1 + 12 | 0;
   i3 = i48;
   do {
    __ZN9b2Fixture11SynchronizeEP12b2BroadPhaseRK11b2TransformS4_(i3, i46, i51, i2);
    i3 = HEAP32[i3 + 4 >> 2] | 0;
   } while ((i3 | 0) != 0);
  }
  i1 = HEAP32[i1 + 96 >> 2] | 0;
 } while ((i1 | 0) != 0);
 __ZN12b2BroadPhase11UpdatePairsI16b2ContactManagerEEvPT_(i47, i47);
 i51 = i50 + 103024 | 0;
 HEAPF32[i51 >> 2] = 0.0;
 __ZN8b2IslandD2Ev(i49);
 STACKTOP = i52;
 return;
}

function __ZNSt3__127__insertion_sort_incompleteIRPFbRK6b2PairS3_EPS1_EEbT0_S8_T_(i10, i8, i9) {
 i10 = i10 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i11 = 0, i12 = 0, i13 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i6 = i11;
 switch (i8 - i10 >> 3 | 0) {
 case 2:
  {
   i1 = i8 + -8 | 0;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i10) | 0)) {
    i10 = 1;
    STACKTOP = i11;
    return i10 | 0;
   }
   i9 = i10;
   i8 = HEAP32[i9 >> 2] | 0;
   i9 = HEAP32[i9 + 4 >> 2] | 0;
   i6 = i1;
   i7 = HEAP32[i6 + 4 >> 2] | 0;
   HEAP32[i10 >> 2] = HEAP32[i6 >> 2];
   HEAP32[i10 + 4 >> 2] = i7;
   i10 = i1;
   HEAP32[i10 >> 2] = i8;
   HEAP32[i10 + 4 >> 2] = i9;
   i10 = 1;
   STACKTOP = i11;
   return i10 | 0;
  }
 case 3:
  {
   i5 = i10 + 8 | 0;
   i1 = i8 + -8 | 0;
   i8 = FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i5, i10) | 0;
   i2 = FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i5) | 0;
   if (!i8) {
    if (!i2) {
     i10 = 1;
     STACKTOP = i11;
     return i10 | 0;
    }
    i7 = i5;
    i6 = HEAP32[i7 >> 2] | 0;
    i7 = HEAP32[i7 + 4 >> 2] | 0;
    i3 = i1;
    i4 = HEAP32[i3 + 4 >> 2] | 0;
    i8 = i5;
    HEAP32[i8 >> 2] = HEAP32[i3 >> 2];
    HEAP32[i8 + 4 >> 2] = i4;
    i8 = i1;
    HEAP32[i8 >> 2] = i6;
    HEAP32[i8 + 4 >> 2] = i7;
    if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i5, i10) | 0)) {
     i10 = 1;
     STACKTOP = i11;
     return i10 | 0;
    }
    i9 = i10;
    i8 = HEAP32[i9 >> 2] | 0;
    i9 = HEAP32[i9 + 4 >> 2] | 0;
    i6 = i5;
    i7 = HEAP32[i6 + 4 >> 2] | 0;
    HEAP32[i10 >> 2] = HEAP32[i6 >> 2];
    HEAP32[i10 + 4 >> 2] = i7;
    i10 = i5;
    HEAP32[i10 >> 2] = i8;
    HEAP32[i10 + 4 >> 2] = i9;
    i10 = 1;
    STACKTOP = i11;
    return i10 | 0;
   }
   i4 = i10;
   i3 = HEAP32[i4 >> 2] | 0;
   i4 = HEAP32[i4 + 4 >> 2] | 0;
   if (i2) {
    i8 = i1;
    i9 = HEAP32[i8 + 4 >> 2] | 0;
    HEAP32[i10 >> 2] = HEAP32[i8 >> 2];
    HEAP32[i10 + 4 >> 2] = i9;
    i10 = i1;
    HEAP32[i10 >> 2] = i3;
    HEAP32[i10 + 4 >> 2] = i4;
    i10 = 1;
    STACKTOP = i11;
    return i10 | 0;
   }
   i7 = i5;
   i8 = HEAP32[i7 + 4 >> 2] | 0;
   HEAP32[i10 >> 2] = HEAP32[i7 >> 2];
   HEAP32[i10 + 4 >> 2] = i8;
   i10 = i5;
   HEAP32[i10 >> 2] = i3;
   HEAP32[i10 + 4 >> 2] = i4;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i5) | 0)) {
    i10 = 1;
    STACKTOP = i11;
    return i10 | 0;
   }
   i9 = i5;
   i8 = HEAP32[i9 >> 2] | 0;
   i9 = HEAP32[i9 + 4 >> 2] | 0;
   i6 = i1;
   i7 = HEAP32[i6 + 4 >> 2] | 0;
   i10 = i5;
   HEAP32[i10 >> 2] = HEAP32[i6 >> 2];
   HEAP32[i10 + 4 >> 2] = i7;
   i10 = i1;
   HEAP32[i10 >> 2] = i8;
   HEAP32[i10 + 4 >> 2] = i9;
   i10 = 1;
   STACKTOP = i11;
   return i10 | 0;
  }
 case 4:
  {
   __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i10, i10 + 8 | 0, i10 + 16 | 0, i8 + -8 | 0, i9) | 0;
   i10 = 1;
   STACKTOP = i11;
   return i10 | 0;
  }
 case 5:
  {
   i2 = i10 + 8 | 0;
   i3 = i10 + 16 | 0;
   i4 = i10 + 24 | 0;
   i1 = i8 + -8 | 0;
   __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i10, i2, i3, i4, i9) | 0;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i4) | 0)) {
    i10 = 1;
    STACKTOP = i11;
    return i10 | 0;
   }
   i7 = i4;
   i6 = HEAP32[i7 >> 2] | 0;
   i7 = HEAP32[i7 + 4 >> 2] | 0;
   i12 = i1;
   i5 = HEAP32[i12 + 4 >> 2] | 0;
   i8 = i4;
   HEAP32[i8 >> 2] = HEAP32[i12 >> 2];
   HEAP32[i8 + 4 >> 2] = i5;
   i8 = i1;
   HEAP32[i8 >> 2] = i6;
   HEAP32[i8 + 4 >> 2] = i7;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i4, i3) | 0)) {
    i12 = 1;
    STACKTOP = i11;
    return i12 | 0;
   }
   i8 = i3;
   i7 = HEAP32[i8 >> 2] | 0;
   i8 = HEAP32[i8 + 4 >> 2] | 0;
   i5 = i4;
   i6 = HEAP32[i5 + 4 >> 2] | 0;
   i12 = i3;
   HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
   HEAP32[i12 + 4 >> 2] = i6;
   i12 = i4;
   HEAP32[i12 >> 2] = i7;
   HEAP32[i12 + 4 >> 2] = i8;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i3, i2) | 0)) {
    i12 = 1;
    STACKTOP = i11;
    return i12 | 0;
   }
   i8 = i2;
   i7 = HEAP32[i8 >> 2] | 0;
   i8 = HEAP32[i8 + 4 >> 2] | 0;
   i5 = i3;
   i6 = HEAP32[i5 + 4 >> 2] | 0;
   i12 = i2;
   HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
   HEAP32[i12 + 4 >> 2] = i6;
   i12 = i3;
   HEAP32[i12 >> 2] = i7;
   HEAP32[i12 + 4 >> 2] = i8;
   if (!(FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i2, i10) | 0)) {
    i12 = 1;
    STACKTOP = i11;
    return i12 | 0;
   }
   i9 = i10;
   i8 = HEAP32[i9 >> 2] | 0;
   i9 = HEAP32[i9 + 4 >> 2] | 0;
   i6 = i2;
   i7 = HEAP32[i6 + 4 >> 2] | 0;
   i12 = i10;
   HEAP32[i12 >> 2] = HEAP32[i6 >> 2];
   HEAP32[i12 + 4 >> 2] = i7;
   i12 = i2;
   HEAP32[i12 >> 2] = i8;
   HEAP32[i12 + 4 >> 2] = i9;
   i12 = 1;
   STACKTOP = i11;
   return i12 | 0;
  }
 case 1:
 case 0:
  {
   i12 = 1;
   STACKTOP = i11;
   return i12 | 0;
  }
 default:
  {
   i3 = i10 + 16 | 0;
   i1 = i10 + 8 | 0;
   i12 = FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i10) | 0;
   i2 = FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i3, i1) | 0;
   do if (i12) {
    i5 = i10;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if (i2) {
     i1 = i3;
     i2 = HEAP32[i1 + 4 >> 2] | 0;
     i12 = i10;
     HEAP32[i12 >> 2] = HEAP32[i1 >> 2];
     HEAP32[i12 + 4 >> 2] = i2;
     i12 = i3;
     HEAP32[i12 >> 2] = i4;
     HEAP32[i12 + 4 >> 2] = i5;
     break;
    }
    i13 = i1;
    i2 = HEAP32[i13 + 4 >> 2] | 0;
    i12 = i10;
    HEAP32[i12 >> 2] = HEAP32[i13 >> 2];
    HEAP32[i12 + 4 >> 2] = i2;
    i12 = i1;
    HEAP32[i12 >> 2] = i4;
    HEAP32[i12 + 4 >> 2] = i5;
    if (FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i3, i1) | 0) {
     i12 = i1;
     i5 = HEAP32[i12 >> 2] | 0;
     i12 = HEAP32[i12 + 4 >> 2] | 0;
     i2 = i3;
     i4 = HEAP32[i2 + 4 >> 2] | 0;
     i13 = i1;
     HEAP32[i13 >> 2] = HEAP32[i2 >> 2];
     HEAP32[i13 + 4 >> 2] = i4;
     i13 = i3;
     HEAP32[i13 >> 2] = i5;
     HEAP32[i13 + 4 >> 2] = i12;
    }
   } else if (i2 ? (i12 = i1, i5 = HEAP32[i12 >> 2] | 0, i12 = HEAP32[i12 + 4 >> 2] | 0, i2 = i3, i4 = HEAP32[i2 + 4 >> 2] | 0, i13 = i1, HEAP32[i13 >> 2] = HEAP32[i2 >> 2], HEAP32[i13 + 4 >> 2] = i4, i13 = i3, HEAP32[i13 >> 2] = i5, HEAP32[i13 + 4 >> 2] = i12, FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i10) | 0) : 0) {
    i12 = i10;
    i5 = HEAP32[i12 >> 2] | 0;
    i12 = HEAP32[i12 + 4 >> 2] | 0;
    i2 = i1;
    i4 = HEAP32[i2 + 4 >> 2] | 0;
    i13 = i10;
    HEAP32[i13 >> 2] = HEAP32[i2 >> 2];
    HEAP32[i13 + 4 >> 2] = i4;
    i13 = i1;
    HEAP32[i13 >> 2] = i5;
    HEAP32[i13 + 4 >> 2] = i12;
   } while (0);
   i1 = i10 + 24 | 0;
   if ((i1 | 0) == (i8 | 0)) {
    i13 = 1;
    STACKTOP = i11;
    return i13 | 0;
   } else i2 = 0;
   while (1) {
    if (FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i1, i3) | 0) {
     i12 = i1;
     i13 = HEAP32[i12 + 4 >> 2] | 0;
     i4 = i6;
     HEAP32[i4 >> 2] = HEAP32[i12 >> 2];
     HEAP32[i4 + 4 >> 2] = i13;
     i4 = i1;
     while (1) {
      i5 = i3;
      i12 = HEAP32[i5 + 4 >> 2] | 0;
      i13 = i4;
      HEAP32[i13 >> 2] = HEAP32[i5 >> 2];
      HEAP32[i13 + 4 >> 2] = i12;
      if ((i3 | 0) == (i10 | 0)) break;
      i4 = i3 + -8 | 0;
      if (FUNCTION_TABLE_iii[HEAP32[i9 >> 2] & 7](i6, i4) | 0) {
       i13 = i3;
       i3 = i4;
       i4 = i13;
      } else break;
     }
     i5 = i6;
     i12 = HEAP32[i5 + 4 >> 2] | 0;
     i13 = i3;
     HEAP32[i13 >> 2] = HEAP32[i5 >> 2];
     HEAP32[i13 + 4 >> 2] = i12;
     i2 = i2 + 1 | 0;
     if ((i2 | 0) == 8) break;
    }
    i3 = i1 + 8 | 0;
    if ((i3 | 0) == (i8 | 0)) {
     i1 = 1;
     i7 = 34;
     break;
    } else {
     i13 = i1;
     i1 = i3;
     i3 = i13;
    }
   }
   if ((i7 | 0) == 34) {
    STACKTOP = i11;
    return i1 | 0;
   }
   i13 = (i1 + 8 | 0) == (i8 | 0);
   STACKTOP = i11;
   return i13 | 0;
  }
 }
 return 0;
}

function __Z14b2TimeOfImpactP11b2TOIOutputPK10b2TOIInput(i56, i51) {
 i56 = i56 | 0;
 i51 = i51 | 0;
 var i1 = 0, d2 = 0.0, i3 = 0, i4 = 0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, i9 = 0, i10 = 0, d11 = 0.0, d12 = 0.0, d13 = 0.0, i14 = 0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0, d21 = 0.0, d22 = 0.0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0, d31 = 0.0, d32 = 0.0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, d42 = 0.0, d43 = 0.0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i57 = 0, d58 = 0.0;
 i57 = STACKTOP;
 STACKTOP = STACKTOP + 320 | 0;
 i52 = i57 + 272 | 0;
 i53 = i57 + 236 | 0;
 i45 = i57 + 224 | 0;
 i46 = i57 + 132 | 0;
 i47 = i57 + 8 | 0;
 i48 = i57 + 32 | 0;
 i49 = i57 + 4 | 0;
 i50 = i57;
 HEAP32[216] = (HEAP32[216] | 0) + 1;
 HEAP32[i56 >> 2] = 0;
 i54 = HEAP32[i51 + 128 >> 2] | 0;
 i55 = i56 + 4 | 0;
 HEAP32[i55 >> 2] = i54;
 i44 = i51 + 28 | 0;
 i1 = i52;
 i3 = i51 + 56 | 0;
 i4 = i1 + 36 | 0;
 do {
  HEAP32[i1 >> 2] = HEAP32[i3 >> 2];
  i1 = i1 + 4 | 0;
  i3 = i3 + 4 | 0;
 } while ((i1 | 0) < (i4 | 0));
 i1 = i53;
 i3 = i51 + 92 | 0;
 i4 = i1 + 36 | 0;
 do {
  HEAP32[i1 >> 2] = HEAP32[i3 >> 2];
  i1 = i1 + 4 | 0;
  i3 = i3 + 4 | 0;
 } while ((i1 | 0) < (i4 | 0));
 i41 = i52 + 24 | 0;
 d27 = +HEAPF32[i41 >> 2];
 d28 = +Math_floor(+(d27 / 6.2831854820251465)) * 6.2831854820251465;
 d27 = d27 - d28;
 HEAPF32[i41 >> 2] = d27;
 i41 = i52 + 28 | 0;
 d28 = +HEAPF32[i41 >> 2] - d28;
 HEAPF32[i41 >> 2] = d28;
 i41 = i53 + 24 | 0;
 d29 = +HEAPF32[i41 >> 2];
 d30 = +Math_floor(+(d29 / 6.2831854820251465)) * 6.2831854820251465;
 d29 = d29 - d30;
 HEAPF32[i41 >> 2] = d29;
 i41 = i53 + 28 | 0;
 d30 = +HEAPF32[i41 >> 2] - d30;
 HEAPF32[i41 >> 2] = d30;
 d31 = (HEAP32[tempDoublePtr >> 2] = i54, +HEAPF32[tempDoublePtr >> 2]);
 d32 = +HEAPF32[i51 + 24 >> 2] + +HEAPF32[i51 + 52 >> 2] + -.014999999664723873;
 d32 = d32 < .004999999888241291 ? .004999999888241291 : d32;
 if (!(d32 > 1.2499999720603228e-003)) ___assert_fail(5408, 5427, 279, 5486);
 HEAP16[i45 + 4 >> 1] = 0;
 HEAP32[i46 >> 2] = HEAP32[i51 >> 2];
 HEAP32[i46 + 4 >> 2] = HEAP32[i51 + 4 >> 2];
 HEAP32[i46 + 8 >> 2] = HEAP32[i51 + 8 >> 2];
 HEAP32[i46 + 12 >> 2] = HEAP32[i51 + 12 >> 2];
 HEAP32[i46 + 16 >> 2] = HEAP32[i51 + 16 >> 2];
 HEAP32[i46 + 20 >> 2] = HEAP32[i51 + 20 >> 2];
 HEAP32[i46 + 24 >> 2] = HEAP32[i51 + 24 >> 2];
 i33 = i46 + 28 | 0;
 HEAP32[i33 >> 2] = HEAP32[i44 >> 2];
 HEAP32[i33 + 4 >> 2] = HEAP32[i44 + 4 >> 2];
 HEAP32[i33 + 8 >> 2] = HEAP32[i44 + 8 >> 2];
 HEAP32[i33 + 12 >> 2] = HEAP32[i44 + 12 >> 2];
 HEAP32[i33 + 16 >> 2] = HEAP32[i44 + 16 >> 2];
 HEAP32[i33 + 20 >> 2] = HEAP32[i44 + 20 >> 2];
 HEAP32[i33 + 24 >> 2] = HEAP32[i44 + 24 >> 2];
 HEAP8[i46 + 88 >> 0] = 0;
 i33 = i46 + 56 | 0;
 i34 = i46 + 60 | 0;
 i35 = i46 + 64 | 0;
 i36 = i46 + 68 | 0;
 i37 = i46 + 72 | 0;
 i38 = i46 + 76 | 0;
 i39 = i46 + 80 | 0;
 i40 = i46 + 84 | 0;
 i41 = i47 + 16 | 0;
 d42 = d32 + 1.2499999720603228e-003;
 d43 = d32 + -1.2499999720603228e-003;
 d15 = +HEAPF32[i52 + 8 >> 2];
 d16 = +HEAPF32[i52 + 12 >> 2];
 d17 = +HEAPF32[i52 + 16 >> 2];
 d18 = +HEAPF32[i52 + 20 >> 2];
 d19 = +HEAPF32[i52 >> 2];
 d20 = +HEAPF32[i52 + 4 >> 2];
 d21 = +HEAPF32[i53 + 8 >> 2];
 d22 = +HEAPF32[i53 + 12 >> 2];
 d23 = +HEAPF32[i53 + 16 >> 2];
 d24 = +HEAPF32[i53 + 20 >> 2];
 d25 = +HEAPF32[i53 >> 2];
 d26 = +HEAPF32[i53 + 4 >> 2];
 i1 = 0;
 d2 = 0.0;
 L4 : while (1) {
  d12 = 1.0 - d2;
  d11 = d12 * d27 + d2 * d28;
  d8 = +Math_sin(+d11);
  d11 = +Math_cos(+d11);
  d5 = d12 * d29 + d2 * d30;
  d13 = +Math_sin(+d5);
  d5 = +Math_cos(+d5);
  HEAPF32[i33 >> 2] = d12 * d15 + d2 * d17 - (d11 * d19 - d8 * d20);
  HEAPF32[i34 >> 2] = d12 * d16 + d2 * d18 - (d8 * d19 + d11 * d20);
  HEAPF32[i35 >> 2] = d8;
  HEAPF32[i36 >> 2] = d11;
  HEAPF32[i37 >> 2] = d12 * d21 + d2 * d23 - (d5 * d25 - d13 * d26);
  HEAPF32[i38 >> 2] = d12 * d22 + d2 * d24 - (d13 * d25 + d5 * d26);
  HEAPF32[i39 >> 2] = d13;
  HEAPF32[i40 >> 2] = d5;
  __Z10b2DistanceP16b2DistanceOutputP14b2SimplexCachePK15b2DistanceInput(i47, i45, i46);
  d5 = +HEAPF32[i41 >> 2];
  if (d5 <= 0.0) {
   i3 = 5;
   break;
  }
  if (d5 < d42) {
   i3 = 7;
   break;
  }
  +__ZN20b2SeparationFunction10InitializeEPK14b2SimplexCachePK15b2DistanceProxyRK7b2SweepS5_S8_f(i48, i45, i51, i52, i44, i53, d2);
  i14 = 0;
  d13 = d31;
  while (1) {
   d6 = +__ZNK20b2SeparationFunction17FindMinSeparationEPiS0_f(i48, i49, i50, d13);
   if (d6 > d42) {
    i3 = 10;
    break L4;
   }
   if (d6 > d43) {
    d2 = d13;
    break;
   }
   i9 = HEAP32[i49 >> 2] | 0;
   i10 = HEAP32[i50 >> 2] | 0;
   d5 = +__ZNK20b2SeparationFunction8EvaluateEiif(i48, i9, i10, d2);
   if (d5 < d43) {
    i3 = 13;
    break L4;
   }
   if (!(d5 <= d42)) {
    d11 = d2;
    d12 = d13;
    i3 = 0;
    d8 = d5;
   } else {
    i3 = 15;
    break L4;
   }
   while (1) {
    if (!(i3 & 1)) d5 = (d11 + d12) * .5; else d5 = d11 + (d32 - d8) * (d12 - d11) / (d6 - d8);
    i3 = i3 + 1 | 0;
    HEAP32[219] = (HEAP32[219] | 0) + 1;
    d7 = +__ZNK20b2SeparationFunction8EvaluateEiif(i48, i9, i10, d5);
    d58 = d7 - d32;
    if ((d58 > 0.0 ? d58 : -d58) < 1.2499999720603228e-003) break;
    i4 = d7 > d32;
    if ((i3 | 0) == 50) {
     i3 = 50;
     d5 = d13;
     break;
    } else {
     d11 = i4 ? d5 : d11;
     d12 = i4 ? d12 : d5;
     d8 = i4 ? d7 : d8;
     d6 = i4 ? d6 : d7;
    }
   }
   i10 = HEAP32[220] | 0;
   HEAP32[220] = (i10 | 0) > (i3 | 0) ? i10 : i3;
   i14 = i14 + 1 | 0;
   if ((i14 | 0) == 8) break; else d13 = d5;
  }
  i1 = i1 + 1 | 0;
  HEAP32[217] = (HEAP32[217] | 0) + 1;
  if ((i1 | 0) == 20) {
   i3 = 23;
   break;
  }
 }
 if ((i3 | 0) == 5) {
  HEAP32[i56 >> 2] = 2;
  HEAPF32[i55 >> 2] = 0.0;
  i56 = i1;
  i55 = HEAP32[218] | 0;
  i54 = (i55 | 0) > (i56 | 0);
  i56 = i54 ? i55 : i56;
  HEAP32[218] = i56;
  d58 = +HEAPF32[215];
  i56 = d58 > 0.0;
  d58 = i56 ? d58 : 0.0;
  HEAPF32[215] = d58;
  d58 = +HEAPF32[214];
  d58 = d58 + 0.0;
  HEAPF32[214] = d58;
  STACKTOP = i57;
  return;
 } else if ((i3 | 0) == 7) {
  HEAP32[i56 >> 2] = 3;
  HEAPF32[i55 >> 2] = d2;
  i56 = i1;
  i55 = HEAP32[218] | 0;
  i54 = (i55 | 0) > (i56 | 0);
  i56 = i54 ? i55 : i56;
  HEAP32[218] = i56;
  d58 = +HEAPF32[215];
  i56 = d58 > 0.0;
  d58 = i56 ? d58 : 0.0;
  HEAPF32[215] = d58;
  d58 = +HEAPF32[214];
  d58 = d58 + 0.0;
  HEAPF32[214] = d58;
  STACKTOP = i57;
  return;
 } else if ((i3 | 0) == 10) {
  HEAP32[i56 >> 2] = 4;
  HEAP32[i55 >> 2] = i54;
 } else if ((i3 | 0) == 13) {
  HEAP32[i56 >> 2] = 1;
  HEAPF32[i55 >> 2] = d2;
 } else if ((i3 | 0) == 15) {
  HEAP32[i56 >> 2] = 3;
  HEAPF32[i55 >> 2] = d2;
 } else if ((i3 | 0) == 23) {
  HEAP32[i56 >> 2] = 1;
  HEAPF32[i55 >> 2] = d2;
  i56 = 20;
  i55 = HEAP32[218] | 0;
  i54 = (i55 | 0) > (i56 | 0);
  i56 = i54 ? i55 : i56;
  HEAP32[218] = i56;
  d58 = +HEAPF32[215];
  i56 = d58 > 0.0;
  d58 = i56 ? d58 : 0.0;
  HEAPF32[215] = d58;
  d58 = +HEAPF32[214];
  d58 = d58 + 0.0;
  HEAPF32[214] = d58;
  STACKTOP = i57;
  return;
 }
 HEAP32[217] = (HEAP32[217] | 0) + 1;
 i56 = i1 + 1 | 0;
 i55 = HEAP32[218] | 0;
 i54 = (i55 | 0) > (i56 | 0);
 i56 = i54 ? i55 : i56;
 HEAP32[218] = i56;
 d58 = +HEAPF32[215];
 i56 = d58 > 0.0;
 d58 = i56 ? d58 : 0.0;
 HEAPF32[215] = d58;
 d58 = +HEAPF32[214];
 d58 = d58 + 0.0;
 HEAPF32[214] = d58;
 STACKTOP = i57;
 return;
}

function __Z17b2CollidePolygonsP10b2ManifoldPK14b2PolygonShapeRK11b2TransformS3_S6_(i37, i17, i2, i18, i1) {
 i37 = i37 | 0;
 i17 = i17 | 0;
 i2 = i2 | 0;
 i18 = i18 | 0;
 i1 = i1 | 0;
 var i3 = 0, d4 = 0.0, d5 = 0.0, i6 = 0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, i19 = 0, d20 = 0.0, i21 = 0, d22 = 0.0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0, d31 = 0.0, d32 = 0.0, i33 = 0, i34 = 0, i35 = 0, d36 = 0.0, i38 = 0, i39 = 0, i40 = 0, i41 = 0;
 i40 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i3 = i40 + 76 | 0;
 i6 = i40 + 72 | 0;
 i34 = i40 + 48 | 0;
 i35 = i40 + 24 | 0;
 i38 = i40;
 i39 = i37 + 60 | 0;
 HEAP32[i39 >> 2] = 0;
 d36 = +HEAPF32[i17 + 8 >> 2] + +HEAPF32[i18 + 8 >> 2];
 HEAP32[i3 >> 2] = 0;
 d4 = +__ZL19b2FindMaxSeparationPiPK14b2PolygonShapeRK11b2TransformS2_S5_(i3, i17, i2, i18, i1);
 if (d4 > d36) {
  STACKTOP = i40;
  return;
 }
 HEAP32[i6 >> 2] = 0;
 d5 = +__ZL19b2FindMaxSeparationPiPK14b2PolygonShapeRK11b2TransformS2_S5_(i6, i18, i1, i17, i2);
 if (d5 > d36) {
  STACKTOP = i40;
  return;
 }
 d12 = +HEAPF32[i1 >> 2];
 d14 = +HEAPF32[i1 + 4 >> 2];
 d10 = +HEAPF32[i1 + 8 >> 2];
 d8 = +HEAPF32[i1 + 12 >> 2];
 d11 = +HEAPF32[i2 >> 2];
 d13 = +HEAPF32[i2 + 4 >> 2];
 d9 = +HEAPF32[i2 + 8 >> 2];
 d7 = +HEAPF32[i2 + 12 >> 2];
 if (d5 > d4 + 5.000000237487257e-004) {
  i2 = 2;
  d20 = d12;
  d30 = d14;
  d31 = d8;
  d32 = d10;
  i1 = i6;
  i33 = 1;
  i21 = i18;
 } else {
  i2 = 1;
  d20 = d11;
  d30 = d13;
  d31 = d7;
  d32 = d9;
  d7 = d8;
  d9 = d10;
  d11 = d12;
  d13 = d14;
  i1 = i3;
  i33 = 0;
  i21 = i17;
  i17 = i18;
 }
 i19 = HEAP32[i1 >> 2] | 0;
 HEAP32[i37 + 56 >> 2] = i2;
 i6 = HEAP32[i17 + 148 >> 2] | 0;
 if ((i19 | 0) <= -1) ___assert_fail(4701, 4738, 74, 4799);
 i18 = HEAP32[i21 + 148 >> 2] | 0;
 if ((i18 | 0) <= (i19 | 0)) ___assert_fail(4701, 4738, 74, 4799);
 d4 = +HEAPF32[i21 + 84 + (i19 << 3) >> 2];
 d29 = +HEAPF32[i21 + 84 + (i19 << 3) + 4 >> 2];
 d5 = d31 * d4 - d32 * d29;
 d29 = d32 * d4 + d31 * d29;
 d4 = d7 * d5 + d9 * d29;
 d5 = d7 * d29 - d9 * d5;
 if ((i6 | 0) > 0) {
  i3 = 0;
  i1 = 0;
  d10 = 34028234663852886.0e22;
  while (1) {
   d8 = d4 * +HEAPF32[i17 + 84 + (i3 << 3) >> 2] + d5 * +HEAPF32[i17 + 84 + (i3 << 3) + 4 >> 2];
   i2 = d8 < d10;
   i1 = i2 ? i3 : i1;
   i3 = i3 + 1 | 0;
   if ((i3 | 0) == (i6 | 0)) break; else d10 = i2 ? d8 : d10;
  }
 } else i1 = 0;
 i2 = i1 + 1 | 0;
 i2 = (i2 | 0) < (i6 | 0) ? i2 : 0;
 d26 = +HEAPF32[i17 + 20 + (i1 << 3) >> 2];
 d16 = +HEAPF32[i17 + 20 + (i1 << 3) + 4 >> 2];
 d15 = d11 + (d7 * d26 - d9 * d16);
 d16 = d13 + (d9 * d26 + d7 * d16);
 HEAPF32[i34 >> 2] = d15;
 HEAPF32[i34 + 4 >> 2] = d16;
 i6 = i19 & 255;
 i41 = i34 + 8 | 0;
 HEAP8[i41 >> 0] = i6;
 i3 = i1 & 255;
 HEAP8[i41 + 1 >> 0] = i3;
 HEAP8[i41 + 2 >> 0] = 1;
 HEAP8[i41 + 3 >> 0] = 0;
 d26 = +HEAPF32[i17 + 20 + (i2 << 3) >> 2];
 d14 = +HEAPF32[i17 + 20 + (i2 << 3) + 4 >> 2];
 d12 = d11 + (d7 * d26 - d9 * d14);
 d14 = d13 + (d9 * d26 + d7 * d14);
 HEAPF32[i34 + 12 >> 2] = d12;
 HEAPF32[i34 + 16 >> 2] = d14;
 i17 = i34 + 20 | 0;
 HEAP8[i17 >> 0] = i6;
 HEAP8[i17 + 1 >> 0] = i2;
 HEAP8[i17 + 2 >> 0] = 1;
 HEAP8[i17 + 3 >> 0] = 0;
 i17 = i19 + 1 | 0;
 i17 = (i17 | 0) < (i18 | 0) ? i17 : 0;
 d26 = +HEAPF32[i21 + 20 + (i19 << 3) >> 2];
 d24 = +HEAPF32[i21 + 20 + (i19 << 3) + 4 >> 2];
 d25 = +HEAPF32[i21 + 20 + (i17 << 3) >> 2];
 d23 = +HEAPF32[i21 + 20 + (i17 << 3) + 4 >> 2];
 d4 = d25 - d26;
 d8 = d23 - d24;
 d5 = +Math_sqrt(+(d4 * d4 + d8 * d8));
 if (!(d5 < 1.1920928955078125e-007)) {
  d29 = 1.0 / d5;
  d4 = d4 * d29;
  d8 = d8 * d29;
 }
 d22 = d31 * d4 - d32 * d8;
 d27 = d31 * d8 + d32 * d4;
 d28 = -d22;
 d5 = d20 + (d31 * d26 - d32 * d24);
 d10 = d30 + (d32 * d26 + d31 * d24);
 d29 = d5 * d27 + d10 * d28;
 d10 = d36 - (d5 * d22 + d10 * d27);
 d20 = d36 + ((d20 + (d31 * d25 - d32 * d23)) * d22 + (d30 + (d32 * d25 + d31 * d23)) * d27);
 d32 = -d27;
 d5 = d15 * d28 + d16 * d32 - d10;
 i2 = i34 + 12 | 0;
 d10 = d12 * d28 + d14 * d32 - d10;
 if (!(d5 <= 0.0)) i1 = 0; else {
  HEAP32[i35 >> 2] = HEAP32[i34 >> 2];
  HEAP32[i35 + 4 >> 2] = HEAP32[i34 + 4 >> 2];
  HEAP32[i35 + 8 >> 2] = HEAP32[i34 + 8 >> 2];
  i1 = 1;
 }
 if (d10 <= 0.0) {
  i41 = i35 + (i1 * 12 | 0) | 0;
  HEAP32[i41 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i41 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
  HEAP32[i41 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
  i1 = i1 + 1 | 0;
 }
 if (d5 * d10 < 0.0) {
  d32 = d5 / (d5 - d10);
  HEAPF32[i35 + (i1 * 12 | 0) >> 2] = d15 + d32 * (d12 - d15);
  HEAPF32[i35 + (i1 * 12 | 0) + 4 >> 2] = d16 + d32 * (d14 - d16);
  i41 = i35 + (i1 * 12 | 0) + 8 | 0;
  HEAP8[i41 >> 0] = i6;
  HEAP8[i41 + 1 >> 0] = i3;
  HEAP8[i41 + 2 >> 0] = 0;
  HEAP8[i41 + 3 >> 0] = 1;
  i1 = i1 + 1 | 0;
 }
 if ((i1 | 0) < 2) {
  STACKTOP = i40;
  return;
 }
 d10 = +HEAPF32[i35 >> 2];
 d12 = +HEAPF32[i35 + 4 >> 2];
 d14 = d22 * d10 + d27 * d12 - d20;
 i2 = i35 + 12 | 0;
 d15 = +HEAPF32[i2 >> 2];
 d16 = +HEAPF32[i35 + 16 >> 2];
 d5 = d22 * d15 + d27 * d16 - d20;
 if (!(d14 <= 0.0)) i1 = 0; else {
  HEAP32[i38 >> 2] = HEAP32[i35 >> 2];
  HEAP32[i38 + 4 >> 2] = HEAP32[i35 + 4 >> 2];
  HEAP32[i38 + 8 >> 2] = HEAP32[i35 + 8 >> 2];
  i1 = 1;
 }
 if (d5 <= 0.0) {
  i41 = i38 + (i1 * 12 | 0) | 0;
  HEAP32[i41 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i41 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
  HEAP32[i41 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
  i1 = i1 + 1 | 0;
 }
 if (d14 * d5 < 0.0) {
  d32 = d14 / (d14 - d5);
  HEAPF32[i38 + (i1 * 12 | 0) >> 2] = d10 + d32 * (d15 - d10);
  HEAPF32[i38 + (i1 * 12 | 0) + 4 >> 2] = d12 + d32 * (d16 - d12);
  i41 = i38 + (i1 * 12 | 0) + 8 | 0;
  HEAP8[i41 >> 0] = i17;
  HEAP8[i41 + 1 >> 0] = HEAP8[i35 + 8 + 1 >> 0] | 0;
  HEAP8[i41 + 2 >> 0] = 0;
  HEAP8[i41 + 3 >> 0] = 1;
  i1 = i1 + 1 | 0;
 }
 if ((i1 | 0) < 2) {
  STACKTOP = i40;
  return;
 }
 HEAPF32[i37 + 40 >> 2] = d8;
 HEAPF32[i37 + 44 >> 2] = -d4;
 HEAPF32[i37 + 48 >> 2] = (d26 + d25) * .5;
 HEAPF32[i37 + 52 >> 2] = (d24 + d23) * .5;
 i6 = i33 << 24 >> 24 == 0;
 d4 = +HEAPF32[i38 >> 2];
 d5 = +HEAPF32[i38 + 4 >> 2];
 if (d27 * d4 + d5 * d28 - d29 <= d36) {
  d32 = d4 - d11;
  d31 = d5 - d13;
  HEAPF32[i37 >> 2] = d7 * d32 + d9 * d31;
  HEAPF32[i37 + 4 >> 2] = d7 * d31 - d9 * d32;
  i1 = i37 + 16 | 0;
  i2 = HEAP32[i38 + 8 >> 2] | 0;
  HEAP32[i1 >> 2] = i2;
  if (i6) i1 = 1; else {
   HEAP8[i1 >> 0] = i2 >>> 8;
   HEAP8[i1 + 1 >> 0] = i2;
   HEAP8[i1 + 2 >> 0] = i2 >>> 24;
   HEAP8[i1 + 3 >> 0] = i2 >>> 16;
   i1 = 1;
  }
 } else i1 = 0;
 d4 = +HEAPF32[i38 + 12 >> 2];
 d5 = +HEAPF32[i38 + 16 >> 2];
 if (d27 * d4 + d5 * d28 - d29 <= d36) {
  d36 = d4 - d11;
  d32 = d5 - d13;
  HEAPF32[i37 + (i1 * 20 | 0) >> 2] = d7 * d36 + d9 * d32;
  HEAPF32[i37 + (i1 * 20 | 0) + 4 >> 2] = d7 * d32 - d9 * d36;
  i3 = i37 + (i1 * 20 | 0) + 16 | 0;
  i2 = HEAP32[i38 + 20 >> 2] | 0;
  HEAP32[i3 >> 2] = i2;
  if (!i6) {
   HEAP8[i3 >> 0] = i2 >>> 8;
   HEAP8[i3 + 1 >> 0] = i2;
   HEAP8[i3 + 2 >> 0] = i2 >>> 24;
   HEAP8[i3 + 3 >> 0] = i2 >>> 16;
  }
  i1 = i1 + 1 | 0;
 }
 HEAP32[i39 >> 2] = i1;
 STACKTOP = i40;
 return;
}

function __ZN15b2ContactSolverC2EP18b2ContactSolverDef(i17, i15) {
 i17 = i17 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, d3 = 0.0, d4 = 0.0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0;
 HEAP32[i17 >> 2] = HEAP32[i15 >> 2];
 HEAP32[i17 + 4 >> 2] = HEAP32[i15 + 4 >> 2];
 HEAP32[i17 + 8 >> 2] = HEAP32[i15 + 8 >> 2];
 HEAP32[i17 + 12 >> 2] = HEAP32[i15 + 12 >> 2];
 HEAP32[i17 + 16 >> 2] = HEAP32[i15 + 16 >> 2];
 HEAP32[i17 + 20 >> 2] = HEAP32[i15 + 20 >> 2];
 i12 = HEAP32[i15 + 40 >> 2] | 0;
 HEAP32[i17 + 32 >> 2] = i12;
 i16 = HEAP32[i15 + 28 >> 2] | 0;
 i21 = i17 + 48 | 0;
 HEAP32[i21 >> 2] = i16;
 i6 = i16 * 88 | 0;
 i14 = i12 + 102796 | 0;
 i5 = HEAP32[i14 >> 2] | 0;
 if ((i5 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i5 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i5 * 12 | 0) + 4 >> 2] = i6;
 i10 = i12 + 102400 | 0;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i6 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i6) | 0;
  HEAP8[i12 + 102412 + (i5 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i5 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i6;
 }
 i13 = i12 + 102404 | 0;
 i5 = (HEAP32[i13 >> 2] | 0) + i6 | 0;
 HEAP32[i13 >> 2] = i5;
 i11 = i12 + 102408 | 0;
 i2 = HEAP32[i11 >> 2] | 0;
 i2 = (i2 | 0) > (i5 | 0) ? i2 : i5;
 HEAP32[i11 >> 2] = i2;
 i8 = (HEAP32[i14 >> 2] | 0) + 1 | 0;
 HEAP32[i14 >> 2] = i8;
 i18 = i17 + 36 | 0;
 HEAP32[i18 >> 2] = HEAP32[i1 >> 2];
 i9 = i16 * 156 | 0;
 if ((i8 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i6 = i12 + 102412 + (i8 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i8 * 12 | 0) + 4 >> 2] = i9;
 i1 = HEAP32[i10 >> 2] | 0;
 i7 = i1 + i9 | 0;
 if ((i7 | 0) > 102400) {
  HEAP32[i6 >> 2] = _malloc(i9) | 0;
  HEAP8[i12 + 102412 + (i8 * 12 | 0) + 8 >> 0] = 1;
  i5 = HEAP32[i13 >> 2] | 0;
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = HEAP32[i14 >> 2] | 0;
 } else {
  HEAP32[i6 >> 2] = i12 + i1;
  HEAP8[i12 + 102412 + (i8 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = i7;
  i1 = i8;
 }
 i9 = i5 + i9 | 0;
 HEAP32[i13 >> 2] = i9;
 HEAP32[i11 >> 2] = (i2 | 0) > (i9 | 0) ? i2 : i9;
 HEAP32[i14 >> 2] = i1 + 1;
 i9 = i17 + 40 | 0;
 HEAP32[i9 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i17 + 24 >> 2] = HEAP32[i15 + 32 >> 2];
 HEAP32[i17 + 28 >> 2] = HEAP32[i15 + 36 >> 2];
 i1 = HEAP32[i15 + 24 >> 2] | 0;
 i8 = i17 + 44 | 0;
 HEAP32[i8 >> 2] = i1;
 if ((i16 | 0) <= 0) return;
 i7 = i17 + 20 | 0;
 i6 = i17 + 8 | 0;
 i1 = HEAP32[i1 >> 2] | 0;
 i2 = HEAP32[i1 + 124 >> 2] | 0;
 if ((i2 | 0) > 0) {
  i19 = i1;
  i20 = i2;
  i22 = 0;
 } else ___assert_fail(8003, 6381, 74, 8018);
 while (1) {
  i17 = HEAP32[i19 + 48 >> 2] | 0;
  i5 = HEAP32[i19 + 52 >> 2] | 0;
  i11 = HEAP32[i17 + 8 >> 2] | 0;
  i12 = HEAP32[i5 + 8 >> 2] | 0;
  i5 = HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 8 >> 2] | 0;
  i17 = HEAP32[(HEAP32[i17 + 12 >> 2] | 0) + 8 >> 2] | 0;
  i2 = HEAP32[i9 >> 2] | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 136 >> 2] = HEAP32[i19 + 136 >> 2];
  HEAP32[i2 + (i22 * 156 | 0) + 140 >> 2] = HEAP32[i19 + 140 >> 2];
  HEAP32[i2 + (i22 * 156 | 0) + 144 >> 2] = HEAP32[i19 + 144 >> 2];
  i23 = i11 + 8 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 112 >> 2] = HEAP32[i23 >> 2];
  i10 = i12 + 8 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 116 >> 2] = HEAP32[i10 >> 2];
  i13 = i11 + 120 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 120 >> 2] = HEAP32[i13 >> 2];
  i14 = i12 + 120 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 124 >> 2] = HEAP32[i14 >> 2];
  i15 = i11 + 128 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 128 >> 2] = HEAP32[i15 >> 2];
  i16 = i12 + 128 | 0;
  HEAP32[i2 + (i22 * 156 | 0) + 132 >> 2] = HEAP32[i16 >> 2];
  HEAP32[i2 + (i22 * 156 | 0) + 152 >> 2] = i22;
  HEAP32[i2 + (i22 * 156 | 0) + 148 >> 2] = i20;
  i1 = i2 + (i22 * 156 | 0) + 80 | 0;
  HEAP32[i1 >> 2] = 0;
  HEAP32[i1 + 4 >> 2] = 0;
  HEAP32[i1 + 8 >> 2] = 0;
  HEAP32[i1 + 12 >> 2] = 0;
  HEAP32[i1 + 16 >> 2] = 0;
  HEAP32[i1 + 20 >> 2] = 0;
  HEAP32[i1 + 24 >> 2] = 0;
  HEAP32[i1 + 28 >> 2] = 0;
  i1 = HEAP32[i18 >> 2] | 0;
  HEAP32[i1 + (i22 * 88 | 0) + 32 >> 2] = HEAP32[i23 >> 2];
  HEAP32[i1 + (i22 * 88 | 0) + 36 >> 2] = HEAP32[i10 >> 2];
  HEAP32[i1 + (i22 * 88 | 0) + 40 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i1 + (i22 * 88 | 0) + 44 >> 2] = HEAP32[i14 >> 2];
  i11 = i11 + 28 | 0;
  i14 = HEAP32[i11 + 4 >> 2] | 0;
  i13 = i1 + (i22 * 88 | 0) + 48 | 0;
  HEAP32[i13 >> 2] = HEAP32[i11 >> 2];
  HEAP32[i13 + 4 >> 2] = i14;
  i12 = i12 + 28 | 0;
  i13 = HEAP32[i12 + 4 >> 2] | 0;
  i14 = i1 + (i22 * 88 | 0) + 56 | 0;
  HEAP32[i14 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i14 + 4 >> 2] = i13;
  HEAP32[i1 + (i22 * 88 | 0) + 64 >> 2] = HEAP32[i15 >> 2];
  HEAP32[i1 + (i22 * 88 | 0) + 68 >> 2] = HEAP32[i16 >> 2];
  i16 = i19 + 104 | 0;
  i15 = HEAP32[i16 + 4 >> 2] | 0;
  i14 = i1 + (i22 * 88 | 0) + 16 | 0;
  HEAP32[i14 >> 2] = HEAP32[i16 >> 2];
  HEAP32[i14 + 4 >> 2] = i15;
  i14 = i19 + 112 | 0;
  i15 = HEAP32[i14 + 4 >> 2] | 0;
  i16 = i1 + (i22 * 88 | 0) + 24 | 0;
  HEAP32[i16 >> 2] = HEAP32[i14 >> 2];
  HEAP32[i16 + 4 >> 2] = i15;
  HEAP32[i1 + (i22 * 88 | 0) + 84 >> 2] = i20;
  HEAP32[i1 + (i22 * 88 | 0) + 76 >> 2] = i17;
  HEAP32[i1 + (i22 * 88 | 0) + 80 >> 2] = i5;
  HEAP32[i1 + (i22 * 88 | 0) + 72 >> 2] = HEAP32[i19 + 120 >> 2];
  i5 = 0;
  do {
   if (!(HEAP8[i7 >> 0] | 0)) {
    d3 = 0.0;
    d4 = 0.0;
   } else {
    d4 = +HEAPF32[i6 >> 2];
    d3 = d4 * +HEAPF32[i19 + 64 + (i5 * 20 | 0) + 12 >> 2];
    d4 = d4 * +HEAPF32[i19 + 64 + (i5 * 20 | 0) + 8 >> 2];
   }
   HEAPF32[i2 + (i22 * 156 | 0) + (i5 * 36 | 0) + 16 >> 2] = d4;
   HEAPF32[i2 + (i22 * 156 | 0) + (i5 * 36 | 0) + 20 >> 2] = d3;
   i16 = i2 + (i22 * 156 | 0) + (i5 * 36 | 0) | 0;
   HEAPF32[i2 + (i22 * 156 | 0) + (i5 * 36 | 0) + 24 >> 2] = 0.0;
   HEAPF32[i2 + (i22 * 156 | 0) + (i5 * 36 | 0) + 28 >> 2] = 0.0;
   HEAPF32[i2 + (i22 * 156 | 0) + (i5 * 36 | 0) + 32 >> 2] = 0.0;
   HEAP32[i16 >> 2] = 0;
   HEAP32[i16 + 4 >> 2] = 0;
   HEAP32[i16 + 8 >> 2] = 0;
   HEAP32[i16 + 12 >> 2] = 0;
   i16 = i19 + 64 + (i5 * 20 | 0) | 0;
   i17 = HEAP32[i16 + 4 >> 2] | 0;
   i23 = i1 + (i22 * 88 | 0) + (i5 << 3) | 0;
   HEAP32[i23 >> 2] = HEAP32[i16 >> 2];
   HEAP32[i23 + 4 >> 2] = i17;
   i5 = i5 + 1 | 0;
  } while ((i5 | 0) != (i20 | 0));
  i22 = i22 + 1 | 0;
  if ((i22 | 0) >= (HEAP32[i21 >> 2] | 0)) {
   i1 = 20;
   break;
  }
  i19 = HEAP32[(HEAP32[i8 >> 2] | 0) + (i22 << 2) >> 2] | 0;
  i20 = HEAP32[i19 + 124 >> 2] | 0;
  if ((i20 | 0) <= 0) {
   i1 = 13;
   break;
  }
 }
 if ((i1 | 0) == 13) ___assert_fail(8003, 6381, 74, 8018); else if ((i1 | 0) == 20) return;
}

function __ZN8b2Island8SolveTOIERK10b2TimeStepii(i19, i14, i7, i12) {
 i19 = i19 | 0;
 i14 = i14 | 0;
 i7 = i7 | 0;
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d13 = 0.0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i20 = 0, i21 = 0, i22 = 0, d23 = 0.0, d24 = 0.0, d25 = 0.0;
 i22 = STACKTOP;
 STACKTOP = STACKTOP + 128 | 0;
 i21 = i22 + 96 | 0;
 i6 = i22 + 52 | 0;
 i20 = i22;
 i16 = i19 + 28 | 0;
 i1 = HEAP32[i16 >> 2] | 0;
 if ((i1 | 0) <= (i7 | 0)) ___assert_fail(6566, 6590, 386, 6642);
 if ((i1 | 0) <= (i12 | 0)) ___assert_fail(6651, 6590, 387, 6642);
 if ((i1 | 0) > 0) {
  i2 = i19 + 8 | 0;
  i5 = i19 + 20 | 0;
  i4 = i19 + 24 | 0;
  i3 = 0;
  do {
   i18 = HEAP32[(HEAP32[i2 >> 2] | 0) + (i3 << 2) >> 2] | 0;
   i1 = i18 + 44 | 0;
   i17 = HEAP32[i1 + 4 >> 2] | 0;
   i15 = (HEAP32[i5 >> 2] | 0) + (i3 * 12 | 0) | 0;
   HEAP32[i15 >> 2] = HEAP32[i1 >> 2];
   HEAP32[i15 + 4 >> 2] = i17;
   HEAP32[(HEAP32[i5 >> 2] | 0) + (i3 * 12 | 0) + 8 >> 2] = HEAP32[i18 + 56 >> 2];
   i15 = i18 + 64 | 0;
   i17 = HEAP32[i15 + 4 >> 2] | 0;
   i1 = (HEAP32[i4 >> 2] | 0) + (i3 * 12 | 0) | 0;
   HEAP32[i1 >> 2] = HEAP32[i15 >> 2];
   HEAP32[i1 + 4 >> 2] = i17;
   i1 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 + (i3 * 12 | 0) + 8 >> 2] = HEAP32[i18 + 72 >> 2];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (HEAP32[i16 >> 2] | 0));
 } else {
  i1 = i19 + 24 | 0;
  i4 = i1;
  i5 = i19 + 20 | 0;
  i1 = HEAP32[i1 >> 2] | 0;
 }
 i17 = i19 + 12 | 0;
 HEAP32[i6 + 24 >> 2] = HEAP32[i17 >> 2];
 i18 = i19 + 36 | 0;
 HEAP32[i6 + 28 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i6 + 40 >> 2] = HEAP32[i19 >> 2];
 HEAP32[i6 >> 2] = HEAP32[i14 >> 2];
 HEAP32[i6 + 4 >> 2] = HEAP32[i14 + 4 >> 2];
 HEAP32[i6 + 8 >> 2] = HEAP32[i14 + 8 >> 2];
 HEAP32[i6 + 12 >> 2] = HEAP32[i14 + 12 >> 2];
 HEAP32[i6 + 16 >> 2] = HEAP32[i14 + 16 >> 2];
 HEAP32[i6 + 20 >> 2] = HEAP32[i14 + 20 >> 2];
 HEAP32[i6 + 32 >> 2] = HEAP32[i5 >> 2];
 HEAP32[i6 + 36 >> 2] = i1;
 __ZN15b2ContactSolverC2EP18b2ContactSolverDef(i20, i6);
 i1 = i14 + 16 | 0;
 if ((HEAP32[i1 >> 2] | 0) > 0) {
  i2 = 0;
  do {
   i2 = i2 + 1 | 0;
   i15 = (__ZN15b2ContactSolver27SolveTOIPositionConstraintsEii(i20, i7, i12) | 0) ^ 1;
  } while ((i2 | 0) < (HEAP32[i1 >> 2] | 0) & i15);
 }
 i15 = i19 + 8 | 0;
 i3 = (HEAP32[i5 >> 2] | 0) + (i7 * 12 | 0) | 0;
 i1 = HEAP32[i3 + 4 >> 2] | 0;
 i6 = (HEAP32[(HEAP32[i15 >> 2] | 0) + (i7 << 2) >> 2] | 0) + 36 | 0;
 HEAP32[i6 >> 2] = HEAP32[i3 >> 2];
 HEAP32[i6 + 4 >> 2] = i1;
 i6 = HEAP32[i5 >> 2] | 0;
 i1 = HEAP32[i15 >> 2] | 0;
 HEAP32[(HEAP32[i1 + (i7 << 2) >> 2] | 0) + 52 >> 2] = HEAP32[i6 + (i7 * 12 | 0) + 8 >> 2];
 i6 = i6 + (i12 * 12 | 0) | 0;
 i7 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = (HEAP32[i1 + (i12 << 2) >> 2] | 0) + 36 | 0;
 HEAP32[i1 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i1 + 4 >> 2] = i7;
 HEAP32[(HEAP32[(HEAP32[i15 >> 2] | 0) + (i12 << 2) >> 2] | 0) + 52 >> 2] = HEAP32[(HEAP32[i5 >> 2] | 0) + (i12 * 12 | 0) + 8 >> 2];
 __ZN15b2ContactSolver29InitializeVelocityConstraintsEv(i20);
 i1 = i14 + 12 | 0;
 if ((HEAP32[i1 >> 2] | 0) > 0) {
  i2 = 0;
  do {
   __ZN15b2ContactSolver24SolveVelocityConstraintsEv(i20);
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) < (HEAP32[i1 >> 2] | 0));
 }
 d13 = +HEAPF32[i14 >> 2];
 if ((HEAP32[i16 >> 2] | 0) > 0) {
  i12 = 0;
  do {
   i3 = HEAP32[i5 >> 2] | 0;
   i6 = i3 + (i12 * 12 | 0) | 0;
   i7 = i3 + (i12 * 12 | 0) + 4 | 0;
   i14 = HEAP32[i4 >> 2] | 0;
   i2 = HEAP32[i14 + (i12 * 12 | 0) >> 2] | 0;
   i1 = HEAP32[i14 + (i12 * 12 | 0) + 4 >> 2] | 0;
   d8 = +HEAPF32[i14 + (i12 * 12 | 0) + 8 >> 2];
   d9 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
   d23 = d13 * d9;
   d11 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
   d10 = d13 * d11;
   d10 = d23 * d23 + d10 * d10;
   if (d10 > 4.0) {
    d23 = 2.0 / +Math_sqrt(+d10);
    i2 = (HEAPF32[tempDoublePtr >> 2] = d9 * d23, HEAP32[tempDoublePtr >> 2] | 0);
    i1 = (HEAPF32[tempDoublePtr >> 2] = d11 * d23, HEAP32[tempDoublePtr >> 2] | 0);
   }
   d9 = d13 * d8;
   if (d9 * d9 > 2.4674012660980225) d8 = d8 * (1.5707963705062866 / (d9 > 0.0 ? d9 : -d9));
   d25 = d13 * (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
   d25 = +HEAPF32[i6 >> 2] + d25;
   d24 = +HEAPF32[i7 >> 2] + d13 * (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
   d11 = +HEAPF32[i3 + (i12 * 12 | 0) + 8 >> 2] + d13 * d8;
   HEAPF32[i6 >> 2] = d25;
   HEAPF32[i7 >> 2] = d24;
   HEAPF32[(HEAP32[i5 >> 2] | 0) + (i12 * 12 | 0) + 8 >> 2] = d11;
   i14 = HEAP32[i4 >> 2] | 0;
   HEAP32[i14 + (i12 * 12 | 0) >> 2] = i2;
   HEAP32[i14 + (i12 * 12 | 0) + 4 >> 2] = i1;
   HEAPF32[(HEAP32[i4 >> 2] | 0) + (i12 * 12 | 0) + 8 >> 2] = d8;
   i14 = HEAP32[(HEAP32[i15 >> 2] | 0) + (i12 << 2) >> 2] | 0;
   HEAPF32[i14 + 44 >> 2] = d25;
   HEAPF32[i14 + 48 >> 2] = d24;
   HEAPF32[i14 + 56 >> 2] = d11;
   HEAP32[i14 + 64 >> 2] = i2;
   HEAP32[i14 + 68 >> 2] = i1;
   HEAPF32[i14 + 72 >> 2] = d8;
   d9 = +Math_sin(+d11);
   HEAPF32[i14 + 20 >> 2] = d9;
   d11 = +Math_cos(+d11);
   HEAPF32[i14 + 24 >> 2] = d11;
   d10 = +HEAPF32[i14 + 28 >> 2];
   d23 = +HEAPF32[i14 + 32 >> 2];
   HEAPF32[i14 + 12 >> 2] = d25 - (d11 * d10 - d9 * d23);
   HEAPF32[i14 + 16 >> 2] = d24 - (d9 * d10 + d11 * d23);
   i12 = i12 + 1 | 0;
  } while ((i12 | 0) < (HEAP32[i16 >> 2] | 0));
 }
 i7 = HEAP32[i20 + 40 >> 2] | 0;
 i1 = i19 + 4 | 0;
 if (!(HEAP32[i1 >> 2] | 0)) {
  __ZN15b2ContactSolverD2Ev(i20);
  STACKTOP = i22;
  return;
 }
 if ((HEAP32[i18 >> 2] | 0) <= 0) {
  __ZN15b2ContactSolverD2Ev(i20);
  STACKTOP = i22;
  return;
 }
 i2 = i21 + 16 | 0;
 i5 = 0;
 do {
  i3 = HEAP32[(HEAP32[i17 >> 2] | 0) + (i5 << 2) >> 2] | 0;
  i4 = HEAP32[i7 + (i5 * 156 | 0) + 148 >> 2] | 0;
  HEAP32[i2 >> 2] = i4;
  if ((i4 | 0) > 0) {
   i6 = 0;
   do {
    HEAP32[i21 + (i6 << 2) >> 2] = HEAP32[i7 + (i5 * 156 | 0) + (i6 * 36 | 0) + 16 >> 2];
    HEAP32[i21 + 8 + (i6 << 2) >> 2] = HEAP32[i7 + (i5 * 156 | 0) + (i6 * 36 | 0) + 20 >> 2];
    i6 = i6 + 1 | 0;
   } while ((i6 | 0) != (i4 | 0));
  }
  i19 = HEAP32[i1 >> 2] | 0;
  FUNCTION_TABLE_viii[HEAP32[(HEAP32[i19 >> 2] | 0) + 20 >> 2] & 3](i19, i3, i21);
  i5 = i5 + 1 | 0;
 } while ((i5 | 0) < (HEAP32[i18 >> 2] | 0));
 __ZN15b2ContactSolverD2Ev(i20);
 STACKTOP = i22;
 return;
}

function __ZN15b2ContactSolver29InitializeVelocityConstraintsEv(i1) {
 i1 = i1 | 0;
 var d2 = 0.0, d3 = 0.0, d4 = 0.0, d5 = 0.0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0, d21 = 0.0, d22 = 0.0, d23 = 0.0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, d42 = 0.0, d43 = 0.0, d44 = 0.0, d45 = 0.0, d46 = 0.0, d47 = 0.0, d48 = 0.0, d49 = 0.0;
 i41 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i39 = i41 + 48 | 0;
 i40 = i41 + 32 | 0;
 i38 = i41;
 i33 = i1 + 48 | 0;
 if ((HEAP32[i33 >> 2] | 0) <= 0) {
  STACKTOP = i41;
  return;
 }
 i34 = i1 + 40 | 0;
 i35 = i1 + 36 | 0;
 i36 = i1 + 44 | 0;
 i37 = i1 + 24 | 0;
 i29 = i1 + 28 | 0;
 i30 = i39 + 8 | 0;
 i31 = i39 + 12 | 0;
 i24 = i40 + 8 | 0;
 i25 = i40 + 12 | 0;
 i26 = i39 + 4 | 0;
 i27 = i40 + 4 | 0;
 i32 = 0;
 while (1) {
  i28 = HEAP32[i34 >> 2] | 0;
  i8 = HEAP32[i35 >> 2] | 0;
  i9 = HEAP32[(HEAP32[i36 >> 2] | 0) + (HEAP32[i28 + (i32 * 156 | 0) + 152 >> 2] << 2) >> 2] | 0;
  i6 = HEAP32[i28 + (i32 * 156 | 0) + 112 >> 2] | 0;
  i1 = HEAP32[i28 + (i32 * 156 | 0) + 116 >> 2] | 0;
  d13 = +HEAPF32[i28 + (i32 * 156 | 0) + 120 >> 2];
  d14 = +HEAPF32[i28 + (i32 * 156 | 0) + 124 >> 2];
  d22 = +HEAPF32[i28 + (i32 * 156 | 0) + 128 >> 2];
  d23 = +HEAPF32[i28 + (i32 * 156 | 0) + 132 >> 2];
  i7 = HEAP32[i37 >> 2] | 0;
  d2 = +HEAPF32[i7 + (i6 * 12 | 0) + 8 >> 2];
  i11 = HEAP32[i29 >> 2] | 0;
  d15 = +HEAPF32[i11 + (i6 * 12 | 0) >> 2];
  d16 = +HEAPF32[i11 + (i6 * 12 | 0) + 4 >> 2];
  d17 = +HEAPF32[i11 + (i6 * 12 | 0) + 8 >> 2];
  d3 = +HEAPF32[i7 + (i1 * 12 | 0) + 8 >> 2];
  d18 = +HEAPF32[i11 + (i1 * 12 | 0) >> 2];
  d19 = +HEAPF32[i11 + (i1 * 12 | 0) + 4 >> 2];
  d20 = +HEAPF32[i11 + (i1 * 12 | 0) + 8 >> 2];
  if ((HEAP32[i9 + 124 >> 2] | 0) <= 0) {
   i1 = 4;
   break;
  }
  d21 = +HEAPF32[i7 + (i1 * 12 | 0) + 4 >> 2];
  d5 = +HEAPF32[i7 + (i1 * 12 | 0) >> 2];
  d12 = +HEAPF32[i7 + (i6 * 12 | 0) + 4 >> 2];
  d4 = +HEAPF32[i7 + (i6 * 12 | 0) >> 2];
  d45 = +HEAPF32[i8 + (i32 * 88 | 0) + 60 >> 2];
  d44 = +HEAPF32[i8 + (i32 * 88 | 0) + 56 >> 2];
  d49 = +HEAPF32[i8 + (i32 * 88 | 0) + 52 >> 2];
  d47 = +HEAPF32[i8 + (i32 * 88 | 0) + 48 >> 2];
  d42 = +HEAPF32[i8 + (i32 * 88 | 0) + 80 >> 2];
  d43 = +HEAPF32[i8 + (i32 * 88 | 0) + 76 >> 2];
  d46 = +Math_sin(+d2);
  HEAPF32[i30 >> 2] = d46;
  d48 = +Math_cos(+d2);
  HEAPF32[i31 >> 2] = d48;
  d2 = +Math_sin(+d3);
  HEAPF32[i24 >> 2] = d2;
  d3 = +Math_cos(+d3);
  HEAPF32[i25 >> 2] = d3;
  HEAPF32[i39 >> 2] = d4 - (d47 * d48 - d49 * d46);
  HEAPF32[i26 >> 2] = d12 - (d49 * d48 + d47 * d46);
  HEAPF32[i40 >> 2] = d5 - (d44 * d3 - d45 * d2);
  HEAPF32[i27 >> 2] = d21 - (d45 * d3 + d44 * d2);
  __ZN15b2WorldManifold10InitializeEPK10b2ManifoldRK11b2TransformfS5_f(i38, i9 + 64 | 0, i39, d43, i40, d42);
  i9 = i28 + (i32 * 156 | 0) + 72 | 0;
  i10 = i38;
  i1 = HEAP32[i10 + 4 >> 2] | 0;
  i11 = i9;
  HEAP32[i11 >> 2] = HEAP32[i10 >> 2];
  HEAP32[i11 + 4 >> 2] = i1;
  i11 = i28 + (i32 * 156 | 0) + 148 | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  do if ((i1 | 0) > 0) {
   i6 = i28 + (i32 * 156 | 0) + 76 | 0;
   d2 = d13 + d14;
   i7 = i28 + (i32 * 156 | 0) + 140 | 0;
   i10 = 0;
   do {
    d49 = +HEAPF32[i38 + 8 + (i10 << 3) >> 2];
    d3 = d49 - d4;
    d47 = +HEAPF32[i38 + 8 + (i10 << 3) + 4 >> 2];
    d48 = d47 - d12;
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) >> 2] = d3;
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 4 >> 2] = d48;
    d49 = d49 - d5;
    d47 = d47 - d21;
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 8 >> 2] = d49;
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 12 >> 2] = d47;
    d45 = +HEAPF32[i6 >> 2];
    d46 = +HEAPF32[i9 >> 2];
    d44 = d3 * d45 - d48 * d46;
    d46 = d45 * d49 - d46 * d47;
    d46 = d2 + d44 * (d22 * d44) + d46 * (d23 * d46);
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 24 >> 2] = d46 > 0.0 ? 1.0 / d46 : 0.0;
    d46 = +HEAPF32[i6 >> 2];
    d44 = -+HEAPF32[i9 >> 2];
    d45 = d3 * d44 - d46 * d48;
    d46 = d49 * d44 - d46 * d47;
    d46 = d2 + d45 * (d22 * d45) + d46 * (d23 * d46);
    HEAPF32[i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 28 >> 2] = d46 > 0.0 ? 1.0 / d46 : 0.0;
    i8 = i28 + (i32 * 156 | 0) + (i10 * 36 | 0) + 32 | 0;
    HEAPF32[i8 >> 2] = 0.0;
    d3 = +HEAPF32[i9 >> 2] * (d18 - d20 * d47 - d15 + d17 * d48) + +HEAPF32[i6 >> 2] * (d19 + d20 * d49 - d16 - d17 * d3);
    if (d3 < -1.0) HEAPF32[i8 >> 2] = -(d3 * +HEAPF32[i7 >> 2]);
    i10 = i10 + 1 | 0;
   } while ((i10 | 0) != (i1 | 0));
   if (!((HEAP32[i11 >> 2] | 0) != 2 | (HEAP8[3729] | 0) == 0)) {
    d47 = +HEAPF32[i28 + (i32 * 156 | 0) + 76 >> 2];
    d3 = +HEAPF32[i9 >> 2];
    d2 = +HEAPF32[i28 + (i32 * 156 | 0) >> 2] * d47 - +HEAPF32[i28 + (i32 * 156 | 0) + 4 >> 2] * d3;
    d5 = d47 * +HEAPF32[i28 + (i32 * 156 | 0) + 8 >> 2] - d3 * +HEAPF32[i28 + (i32 * 156 | 0) + 12 >> 2];
    d49 = d47 * +HEAPF32[i28 + (i32 * 156 | 0) + 36 >> 2] - d3 * +HEAPF32[i28 + (i32 * 156 | 0) + 40 >> 2];
    d3 = d47 * +HEAPF32[i28 + (i32 * 156 | 0) + 44 >> 2] - d3 * +HEAPF32[i28 + (i32 * 156 | 0) + 48 >> 2];
    d47 = d13 + d14;
    d48 = d22 * d2;
    d4 = d23 * d5;
    d5 = d47 + d2 * d48 + d5 * d4;
    d2 = d47 + d49 * (d22 * d49) + d3 * (d23 * d3);
    d3 = d47 + d48 * d49 + d4 * d3;
    d4 = d5 * d2 - d3 * d3;
    if (d5 * d5 < d4 * 1.0e3) {
     HEAPF32[i28 + (i32 * 156 | 0) + 96 >> 2] = d5;
     HEAPF32[i28 + (i32 * 156 | 0) + 100 >> 2] = d3;
     HEAPF32[i28 + (i32 * 156 | 0) + 104 >> 2] = d3;
     HEAPF32[i28 + (i32 * 156 | 0) + 108 >> 2] = d2;
     d49 = d4 != 0.0 ? 1.0 / d4 : d4;
     d48 = -(d49 * d3);
     HEAPF32[i28 + (i32 * 156 | 0) + 80 >> 2] = d2 * d49;
     HEAPF32[i28 + (i32 * 156 | 0) + 84 >> 2] = d48;
     HEAPF32[i28 + (i32 * 156 | 0) + 88 >> 2] = d48;
     HEAPF32[i28 + (i32 * 156 | 0) + 92 >> 2] = d5 * d49;
     break;
    } else {
     HEAP32[i11 >> 2] = 1;
     break;
    }
   }
  } while (0);
  i32 = i32 + 1 | 0;
  if ((i32 | 0) >= (HEAP32[i33 >> 2] | 0)) {
   i1 = 15;
   break;
  }
 }
 if ((i1 | 0) == 4) ___assert_fail(6356, 6381, 172, 6449); else if ((i1 | 0) == 15) {
  STACKTOP = i41;
  return;
 }
}

function __ZNK20b2SeparationFunction17FindMinSeparationEPiS0_f(i19, i21, i27, d2) {
 i19 = i19 | 0;
 i21 = i21 | 0;
 i27 = i27 | 0;
 d2 = +d2;
 var i1 = 0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, d20 = 0.0, d22 = 0.0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0, d28 = 0.0, d29 = 0.0;
 d13 = 1.0 - d2;
 d23 = d13 * +HEAPF32[i19 + 32 >> 2] + +HEAPF32[i19 + 36 >> 2] * d2;
 d22 = +Math_sin(+d23);
 d23 = +Math_cos(+d23);
 d29 = +HEAPF32[i19 + 8 >> 2];
 d24 = +HEAPF32[i19 + 12 >> 2];
 d20 = d13 * +HEAPF32[i19 + 16 >> 2] + +HEAPF32[i19 + 24 >> 2] * d2 - (d23 * d29 - d22 * d24);
 d24 = d13 * +HEAPF32[i19 + 20 >> 2] + +HEAPF32[i19 + 28 >> 2] * d2 - (d22 * d29 + d23 * d24);
 d29 = d13 * +HEAPF32[i19 + 68 >> 2] + +HEAPF32[i19 + 72 >> 2] * d2;
 d28 = +Math_sin(+d29);
 d29 = +Math_cos(+d29);
 d14 = +HEAPF32[i19 + 44 >> 2];
 d26 = +HEAPF32[i19 + 48 >> 2];
 d25 = d13 * +HEAPF32[i19 + 52 >> 2] + +HEAPF32[i19 + 60 >> 2] * d2 - (d29 * d14 - d28 * d26);
 d26 = d13 * +HEAPF32[i19 + 56 >> 2] + +HEAPF32[i19 + 64 >> 2] * d2 - (d28 * d14 + d29 * d26);
 switch (HEAP32[i19 + 80 >> 2] | 0) {
 case 0:
  {
   i17 = i19 + 92 | 0;
   d12 = +HEAPF32[i17 >> 2];
   i18 = i19 + 96 | 0;
   d14 = +HEAPF32[i18 >> 2];
   d3 = d23 * d12 + d22 * d14;
   d9 = d23 * d14 - d22 * d12;
   d12 = -d12;
   d14 = -d14;
   d11 = d29 * d12 + d28 * d14;
   d12 = d29 * d14 - d28 * d12;
   i15 = HEAP32[i19 >> 2] | 0;
   i16 = HEAP32[i15 + 16 >> 2] | 0;
   i15 = i15 + 20 | 0;
   i5 = HEAP32[i15 >> 2] | 0;
   if ((i5 | 0) > 1) {
    i1 = 0;
    d10 = d3 * +HEAPF32[i16 >> 2] + d9 * +HEAPF32[i16 + 4 >> 2];
    i6 = 1;
    while (1) {
     d2 = d3 * +HEAPF32[i16 + (i6 << 3) >> 2] + d9 * +HEAPF32[i16 + (i6 << 3) + 4 >> 2];
     i4 = d2 > d10;
     i1 = i4 ? i6 : i1;
     i6 = i6 + 1 | 0;
     if ((i6 | 0) == (i5 | 0)) break; else d10 = i4 ? d2 : d10;
    }
   } else i1 = 0;
   HEAP32[i21 >> 2] = i1;
   i8 = HEAP32[i19 + 4 >> 2] | 0;
   i7 = HEAP32[i8 + 16 >> 2] | 0;
   i8 = i8 + 20 | 0;
   i1 = HEAP32[i8 >> 2] | 0;
   if ((i1 | 0) > 1) {
    i4 = 0;
    d3 = d11 * +HEAPF32[i7 >> 2] + d12 * +HEAPF32[i7 + 4 >> 2];
    i6 = 1;
    while (1) {
     d2 = d11 * +HEAPF32[i7 + (i6 << 3) >> 2] + d12 * +HEAPF32[i7 + (i6 << 3) + 4 >> 2];
     i5 = d2 > d3;
     i4 = i5 ? i6 : i4;
     i6 = i6 + 1 | 0;
     if ((i6 | 0) == (i1 | 0)) break; else d3 = i5 ? d2 : d3;
    }
   } else i4 = 0;
   HEAP32[i27 >> 2] = i4;
   i1 = HEAP32[i21 >> 2] | 0;
   if ((i1 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i15 >> 2] | 0) <= (i1 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   d3 = +HEAPF32[i16 + (i1 << 3) >> 2];
   d2 = +HEAPF32[i16 + (i1 << 3) + 4 >> 2];
   if ((i4 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i8 >> 2] | 0) <= (i4 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   d13 = +HEAPF32[i7 + (i4 << 3) >> 2];
   d14 = +HEAPF32[i7 + (i4 << 3) + 4 >> 2];
   d29 = +HEAPF32[i17 >> 2] * (d25 + (d29 * d13 - d28 * d14) - (d20 + (d23 * d3 - d22 * d2))) + +HEAPF32[i18 >> 2] * (d26 + (d28 * d13 + d29 * d14) - (d24 + (d22 * d3 + d23 * d2)));
   return +d29;
  }
 case 1:
  {
   d10 = +HEAPF32[i19 + 92 >> 2];
   d14 = +HEAPF32[i19 + 96 >> 2];
   d13 = d23 * d10 - d22 * d14;
   d14 = d22 * d10 + d23 * d14;
   d10 = +HEAPF32[i19 + 84 >> 2];
   d11 = +HEAPF32[i19 + 88 >> 2];
   d12 = d20 + (d23 * d10 - d22 * d11);
   d11 = d24 + (d22 * d10 + d23 * d11);
   d10 = -d13;
   d24 = -d14;
   d9 = d29 * d10 + d28 * d24;
   d10 = d29 * d24 - d28 * d10;
   HEAP32[i21 >> 2] = -1;
   i8 = i19 + 4 | 0;
   i5 = HEAP32[i8 >> 2] | 0;
   i4 = HEAP32[i5 + 16 >> 2] | 0;
   i5 = HEAP32[i5 + 20 >> 2] | 0;
   if ((i5 | 0) > 1) {
    i1 = 0;
    d3 = d9 * +HEAPF32[i4 >> 2] + d10 * +HEAPF32[i4 + 4 >> 2];
    i7 = 1;
    while (1) {
     d2 = d9 * +HEAPF32[i4 + (i7 << 3) >> 2] + d10 * +HEAPF32[i4 + (i7 << 3) + 4 >> 2];
     i6 = d2 > d3;
     i1 = i6 ? i7 : i1;
     i7 = i7 + 1 | 0;
     if ((i7 | 0) == (i5 | 0)) break; else d3 = i6 ? d2 : d3;
    }
    HEAP32[i27 >> 2] = i1;
    if ((i1 | 0) > -1) i15 = i1; else ___assert_fail(4937, 4967, 103, 5018);
   } else {
    HEAP32[i27 >> 2] = 0;
    i15 = 0;
   }
   i1 = HEAP32[i8 >> 2] | 0;
   if ((HEAP32[i1 + 20 >> 2] | 0) <= (i15 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i27 = HEAP32[i1 + 16 >> 2] | 0;
   d23 = +HEAPF32[i27 + (i15 << 3) >> 2];
   d24 = +HEAPF32[i27 + (i15 << 3) + 4 >> 2];
   d29 = d13 * (d25 + (d29 * d23 - d28 * d24) - d12) + d14 * (d26 + (d28 * d23 + d29 * d24) - d11);
   return +d29;
  }
 case 2:
  {
   d10 = +HEAPF32[i19 + 92 >> 2];
   d14 = +HEAPF32[i19 + 96 >> 2];
   d13 = d29 * d10 - d28 * d14;
   d14 = d28 * d10 + d29 * d14;
   d10 = +HEAPF32[i19 + 84 >> 2];
   d11 = +HEAPF32[i19 + 88 >> 2];
   d12 = d25 + (d29 * d10 - d28 * d11);
   d11 = d26 + (d28 * d10 + d29 * d11);
   d10 = -d13;
   d29 = -d14;
   d9 = d23 * d10 + d22 * d29;
   d10 = d23 * d29 - d22 * d10;
   HEAP32[i27 >> 2] = -1;
   i5 = HEAP32[i19 >> 2] | 0;
   i4 = HEAP32[i5 + 16 >> 2] | 0;
   i5 = HEAP32[i5 + 20 >> 2] | 0;
   if ((i5 | 0) > 1) {
    i1 = 0;
    d3 = d9 * +HEAPF32[i4 >> 2] + d10 * +HEAPF32[i4 + 4 >> 2];
    i7 = 1;
    while (1) {
     d2 = d9 * +HEAPF32[i4 + (i7 << 3) >> 2] + d10 * +HEAPF32[i4 + (i7 << 3) + 4 >> 2];
     i6 = d2 > d3;
     i1 = i6 ? i7 : i1;
     i7 = i7 + 1 | 0;
     if ((i7 | 0) == (i5 | 0)) break; else d3 = i6 ? d2 : d3;
    }
    HEAP32[i21 >> 2] = i1;
    if ((i1 | 0) > -1) i8 = i1; else ___assert_fail(4937, 4967, 103, 5018);
   } else {
    HEAP32[i21 >> 2] = 0;
    i8 = 0;
   }
   i1 = HEAP32[i19 >> 2] | 0;
   if ((HEAP32[i1 + 20 >> 2] | 0) <= (i8 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i27 = HEAP32[i1 + 16 >> 2] | 0;
   d28 = +HEAPF32[i27 + (i8 << 3) >> 2];
   d29 = +HEAPF32[i27 + (i8 << 3) + 4 >> 2];
   d29 = d13 * (d20 + (d23 * d28 - d22 * d29) - d12) + d14 * (d24 + (d22 * d28 + d23 * d29) - d11);
   return +d29;
  }
 default:
  ___assert_fail(4304, 5427, 186, 8114);
 }
 return +(0.0);
}

function __ZN20b2SeparationFunction10InitializeEPK14b2SimplexCachePK15b2DistanceProxyRK7b2SweepS5_S8_f(i27, i17, i16, i1, i18, i6, d2) {
 i27 = i27 | 0;
 i17 = i17 | 0;
 i16 = i16 | 0;
 i1 = i1 | 0;
 i18 = i18 | 0;
 i6 = i6 | 0;
 d2 = +d2;
 var d3 = 0.0, i4 = 0, d5 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d19 = 0.0, d20 = 0.0, d21 = 0.0, d22 = 0.0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0;
 HEAP32[i27 >> 2] = i16;
 HEAP32[i27 + 4 >> 2] = i18;
 i10 = HEAP16[i17 + 4 >> 1] | 0;
 if ((i10 + -1 & 65535) >= 2) ___assert_fail(8132, 5427, 52, 5501);
 i8 = i27 + 8 | 0;
 i7 = i8;
 i4 = i7 + 36 | 0;
 do {
  HEAP32[i7 >> 2] = HEAP32[i1 >> 2];
  i7 = i7 + 4 | 0;
  i1 = i1 + 4 | 0;
 } while ((i7 | 0) < (i4 | 0));
 i9 = i27 + 44 | 0;
 i7 = i9;
 i1 = i6;
 i4 = i7 + 36 | 0;
 do {
  HEAP32[i7 >> 2] = HEAP32[i1 >> 2];
  i7 = i7 + 4 | 0;
  i1 = i1 + 4 | 0;
 } while ((i7 | 0) < (i4 | 0));
 d14 = 1.0 - d2;
 d26 = d14 * +HEAPF32[i27 + 32 >> 2] + +HEAPF32[i27 + 36 >> 2] * d2;
 d25 = +Math_sin(+d26);
 d26 = +Math_cos(+d26);
 d24 = +HEAPF32[i8 >> 2];
 d22 = +HEAPF32[i27 + 12 >> 2];
 d21 = d14 * +HEAPF32[i27 + 16 >> 2] + +HEAPF32[i27 + 24 >> 2] * d2 - (d26 * d24 - d25 * d22);
 d22 = d14 * +HEAPF32[i27 + 20 >> 2] + +HEAPF32[i27 + 28 >> 2] * d2 - (d25 * d24 + d26 * d22);
 d24 = d14 * +HEAPF32[i27 + 68 >> 2] + +HEAPF32[i27 + 72 >> 2] * d2;
 d23 = +Math_sin(+d24);
 d24 = +Math_cos(+d24);
 d15 = +HEAPF32[i9 >> 2];
 d20 = +HEAPF32[i27 + 48 >> 2];
 d19 = d14 * +HEAPF32[i27 + 52 >> 2] + +HEAPF32[i27 + 60 >> 2] * d2 - (d24 * d15 - d23 * d20);
 d20 = d14 * +HEAPF32[i27 + 56 >> 2] + +HEAPF32[i27 + 64 >> 2] * d2 - (d23 * d15 + d24 * d20);
 if (i10 << 16 >> 16 == 1) {
  HEAP32[i27 + 80 >> 2] = 0;
  i6 = HEAPU8[i17 + 6 >> 0] | 0;
  if ((HEAP32[i16 + 20 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  i4 = HEAP32[i16 + 16 >> 2] | 0;
  i1 = HEAPU8[i17 + 9 >> 0] | 0;
  if ((HEAP32[i18 + 20 >> 2] | 0) <= (i1 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  d2 = +HEAPF32[i4 + (i6 << 3) + 4 >> 2];
  d3 = +HEAPF32[i4 + (i6 << 3) >> 2];
  i4 = HEAP32[i18 + 16 >> 2] | 0;
  d14 = +HEAPF32[i4 + (i1 << 3) >> 2];
  d15 = +HEAPF32[i4 + (i1 << 3) + 4 >> 2];
  d5 = d19 + (d24 * d14 - d23 * d15) - (d21 + (d26 * d3 - d25 * d2));
  d3 = d20 + (d23 * d14 + d24 * d15) - (d22 + (d26 * d2 + d25 * d3));
  i4 = i27 + 92 | 0;
  HEAPF32[i4 >> 2] = d5;
  i1 = i27 + 96 | 0;
  HEAPF32[i1 >> 2] = d3;
  d2 = +Math_sqrt(+(d5 * d5 + d3 * d3));
  if (d2 < 1.1920928955078125e-007) {
   d26 = 0.0;
   return +d26;
  }
  d26 = 1.0 / d2;
  HEAPF32[i4 >> 2] = d5 * d26;
  HEAPF32[i1 >> 2] = d3 * d26;
  d26 = d2;
  return +d26;
 }
 i8 = i17 + 6 | 0;
 i4 = i17 + 7 | 0;
 i1 = i27 + 80 | 0;
 if ((HEAP8[i8 >> 0] | 0) == (HEAP8[i4 >> 0] | 0)) {
  HEAP32[i1 >> 2] = 2;
  i4 = HEAPU8[i17 + 9 >> 0] | 0;
  i1 = HEAP32[i18 + 20 >> 2] | 0;
  if ((i1 | 0) <= (i4 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  i7 = HEAP32[i18 + 16 >> 2] | 0;
  i6 = HEAPU8[i17 + 10 >> 0] | 0;
  if ((i1 | 0) <= (i6 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  d15 = +HEAPF32[i7 + (i4 << 3) + 4 >> 2];
  d12 = +HEAPF32[i7 + (i4 << 3) >> 2];
  d13 = +HEAPF32[i7 + (i6 << 3) >> 2];
  d11 = +HEAPF32[i7 + (i6 << 3) + 4 >> 2];
  d3 = d13 - d12;
  d2 = d11 - d15;
  d5 = -d3;
  i4 = i27 + 92 | 0;
  HEAPF32[i4 >> 2] = d2;
  i6 = i27 + 96 | 0;
  HEAPF32[i6 >> 2] = d5;
  d3 = +Math_sqrt(+(d3 * d3 + d2 * d2));
  if (d3 < 1.1920928955078125e-007) d14 = d2; else {
   d3 = 1.0 / d3;
   d14 = d2 * d3;
   HEAPF32[i4 >> 2] = d14;
   d5 = d3 * d5;
   HEAPF32[i6 >> 2] = d5;
  }
  d3 = (d12 + d13) * .5;
  d2 = (d15 + d11) * .5;
  HEAPF32[i27 + 84 >> 2] = d3;
  HEAPF32[i27 + 88 >> 2] = d2;
  i1 = HEAPU8[i8 >> 0] | 0;
  if ((HEAP32[i16 + 20 >> 2] | 0) <= (i1 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  i27 = HEAP32[i16 + 16 >> 2] | 0;
  d13 = +HEAPF32[i27 + (i1 << 3) >> 2];
  d15 = +HEAPF32[i27 + (i1 << 3) + 4 >> 2];
  d2 = (d24 * d14 - d23 * d5) * (d21 + (d26 * d13 - d25 * d15) - (d19 + (d24 * d3 - d23 * d2))) + (d23 * d14 + d24 * d5) * (d22 + (d25 * d13 + d26 * d15) - (d20 + (d24 * d2 + d23 * d3)));
  if (!(d2 < 0.0)) {
   d26 = d2;
   return +d26;
  }
  HEAPF32[i4 >> 2] = -d14;
  HEAPF32[i6 >> 2] = -d5;
  d26 = -d2;
  return +d26;
 } else {
  HEAP32[i1 >> 2] = 1;
  i6 = HEAPU8[i8 >> 0] | 0;
  i1 = HEAP32[i16 + 20 >> 2] | 0;
  if ((i1 | 0) <= (i6 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  i7 = HEAP32[i16 + 16 >> 2] | 0;
  i4 = HEAPU8[i4 >> 0] | 0;
  if ((i1 | 0) <= (i4 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  d15 = +HEAPF32[i7 + (i6 << 3) + 4 >> 2];
  d12 = +HEAPF32[i7 + (i6 << 3) >> 2];
  d13 = +HEAPF32[i7 + (i4 << 3) >> 2];
  d11 = +HEAPF32[i7 + (i4 << 3) + 4 >> 2];
  d3 = d13 - d12;
  d2 = d11 - d15;
  d5 = -d3;
  i4 = i27 + 92 | 0;
  HEAPF32[i4 >> 2] = d2;
  i6 = i27 + 96 | 0;
  HEAPF32[i6 >> 2] = d5;
  d3 = +Math_sqrt(+(d3 * d3 + d2 * d2));
  if (d3 < 1.1920928955078125e-007) d14 = d2; else {
   d3 = 1.0 / d3;
   d14 = d2 * d3;
   HEAPF32[i4 >> 2] = d14;
   d5 = d3 * d5;
   HEAPF32[i6 >> 2] = d5;
  }
  d3 = (d12 + d13) * .5;
  d2 = (d15 + d11) * .5;
  HEAPF32[i27 + 84 >> 2] = d3;
  HEAPF32[i27 + 88 >> 2] = d2;
  i1 = HEAPU8[i17 + 9 >> 0] | 0;
  if ((HEAP32[i18 + 20 >> 2] | 0) <= (i1 | 0)) ___assert_fail(4937, 4967, 103, 5018);
  i27 = HEAP32[i18 + 16 >> 2] | 0;
  d13 = +HEAPF32[i27 + (i1 << 3) >> 2];
  d15 = +HEAPF32[i27 + (i1 << 3) + 4 >> 2];
  d2 = (d26 * d14 - d25 * d5) * (d19 + (d24 * d13 - d23 * d15) - (d21 + (d26 * d3 - d25 * d2))) + (d25 * d14 + d26 * d5) * (d20 + (d23 * d13 + d24 * d15) - (d22 + (d26 * d2 + d25 * d3)));
  if (!(d2 < 0.0)) {
   d26 = d2;
   return +d26;
  }
  HEAPF32[i4 >> 2] = -d14;
  HEAPF32[i6 >> 2] = -d5;
  d26 = -d2;
  return +d26;
 }
 return 0.0;
}

function __Z8mouse_upff(d2, d3) {
 d2 = +d2;
 d3 = +d3;
 var i1 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0;
 i24 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i22 = i24;
 i21 = i24 + 64 | 0;
 i23 = i24 + 8 | 0;
 i20 = i24 + 48 | 0;
 i19 = i24 + 32 | 0;
 HEAPF32[i20 >> 2] = d2;
 HEAPF32[i20 + 4 >> 2] = d3;
 HEAPF32[i20 + 8 >> 2] = d2;
 HEAPF32[i20 + 12 >> 2] = d3;
 HEAP32[i19 >> 2] = 812;
 i5 = i19 + 4 | 0;
 HEAP32[i5 >> 2] = 0;
 HEAPF32[i19 + 8 >> 2] = d2;
 HEAPF32[i19 + 12 >> 2] = d3;
 __ZNK7b2World9QueryAABBEP15b2QueryCallbackRK6b2AABB(HEAP32[178] | 0, i19, i20);
 i5 = HEAP32[i5 >> 2] | 0;
 if (!i5) {
  STACKTOP = i24;
  return;
 }
 i4 = HEAP32[180] | 0;
 i6 = i5;
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 i4 = HEAP32[i4 + 16 >> 2] | 0;
 if ((i1 | 0) != (i4 | 0)) do {
  HEAP8[i1 + 9 >> 0] = 0;
  i1 = i1 + 16 | 0;
 } while ((i1 | 0) != (i4 | 0));
 HEAP32[i23 >> 2] = 0;
 HEAP32[i23 + 4 >> 2] = 0;
 HEAP32[i23 + 8 >> 2] = 0;
 HEAP32[i23 + 12 >> 2] = 0;
 HEAP32[i23 + 16 >> 2] = 0;
 HEAP32[i23 + 20 >> 2] = 0;
 i16 = HEAP32[HEAP32[i5 + 148 >> 2] >> 2] | 0;
 i17 = i23 + 8 | 0;
 i18 = i23 + 4 | 0;
 i19 = i23 + 16 | 0;
 i20 = i23 + 20 | 0;
 __ZNSt3__15dequeINS_4pairIP6b2BodyiEENS_9allocatorIS4_EEE19__add_back_capacityEv(i23);
 i1 = (HEAP32[i19 >> 2] | 0) + (HEAP32[i20 >> 2] | 0) | 0;
 i1 = (HEAP32[(HEAP32[i18 >> 2] | 0) + (i1 >>> 9 << 2) >> 2] | 0) + ((i1 & 511) << 3) | 0;
 HEAP32[i1 >> 2] = i6;
 HEAP32[i1 + 4 >> 2] = 0;
 i1 = (HEAP32[i20 >> 2] | 0) + 1 | 0;
 HEAP32[i20 >> 2] = i1;
 L8 : do if (!i1) i1 = 0; else {
  i4 = i1;
  i9 = 0;
  i1 = 0;
  i15 = 0;
  while (1) {
   if ((i15 | 0) > 100) break;
   i15 = i15 + 1 | 0;
   i7 = HEAP32[i19 >> 2] | 0;
   i5 = HEAP32[(HEAP32[i18 >> 2] | 0) + (i7 >>> 9 << 2) >> 2] | 0;
   i6 = i7 & 511;
   i10 = HEAP32[i5 + (i6 << 3) >> 2] | 0;
   i14 = HEAP32[i10 + 148 >> 2] | 0;
   if ((i14 | 0) != 0 ? (HEAP32[i14 >> 2] | 0) == (i16 | 0) : 0) {
    i8 = i5 + (i6 << 3) + 4 | 0;
    i13 = HEAP32[i8 >> 2] | 0;
    i7 = __Znwj(36) | 0;
    __ZN9BlastAnimC2EP6b2Bodyi(i7, i10, i13);
    do if (!i9) i1 = i7; else {
     i6 = HEAP32[180] | 0;
     if (!i1) {
      HEAP32[i21 >> 2] = i7;
      i1 = i6 + 44 | 0;
      i4 = HEAP32[i1 >> 2] | 0;
      if ((i4 | 0) == (HEAP32[i6 + 48 >> 2] | 0)) __ZNSt3__16vectorIP4AnimNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i6 + 40 | 0, i21); else {
       HEAP32[i4 >> 2] = i7;
       HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 4;
      }
      i1 = i6 + 52 | 0;
      HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 1;
      i1 = 0;
      break;
     }
     HEAP32[i21 >> 2] = i1;
     i4 = i6 + 44 | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) == (HEAP32[i6 + 48 >> 2] | 0)) __ZNSt3__16vectorIP4AnimNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i6 + 40 | 0, i21); else {
      HEAP32[i5 >> 2] = i1;
      HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 4;
     }
     i1 = i6 + 52 | 0;
     HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 1;
     i1 = HEAP32[180] | 0;
     HEAP32[i21 >> 2] = i7;
     i4 = i1 + 44 | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) == (HEAP32[i1 + 48 >> 2] | 0)) __ZNSt3__16vectorIP4AnimNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i1 + 40 | 0, i21); else {
      HEAP32[i5 >> 2] = i7;
      HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 4;
     }
     i1 = i1 + 52 | 0;
     HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 1;
     i1 = 0;
    } while (0);
    i6 = i9 + 1 | 0;
    i4 = HEAP32[i10 + 112 >> 2] | 0;
    if (i4) {
     i12 = (HEAP32[i8 >> 2] | 0) + 1 | 0;
     i13 = i10 + 12 | 0;
     i11 = i10 + 16 | 0;
     i10 = i14 + 12 | 0;
     do {
      i5 = HEAP32[i4 >> 2] | 0;
      i9 = i5;
      i7 = HEAP32[i5 + 148 >> 2] | 0;
      i8 = i7 + 9 | 0;
      if ((HEAP8[i8 >> 0] | 0) == 0 ? (d2 = +HEAPF32[i13 >> 2] - +HEAPF32[i5 + 12 >> 2], d3 = +HEAPF32[i11 >> 2] - +HEAPF32[i5 + 16 >> 2], d3 = +Math_sqrt(+(d2 * d2 + d3 * d3)), !(d3 > +HEAPF32[i7 + 12 >> 2] + +HEAPF32[i10 >> 2] + .01)) : 0) {
       HEAP8[i8 >> 0] = 1;
       i14 = HEAP32[i17 >> 2] | 0;
       i7 = HEAP32[i18 >> 2] | 0;
       i8 = HEAP32[i19 >> 2] | 0;
       i5 = HEAP32[i20 >> 2] | 0;
       if ((((i14 | 0) == (i7 | 0) ? 0 : (i14 - i7 << 7) + -1 | 0) | 0) == (i5 + i8 | 0)) {
        __ZNSt3__15dequeINS_4pairIP6b2BodyiEENS_9allocatorIS4_EEE19__add_back_capacityEv(i23);
        i5 = HEAP32[i20 >> 2] | 0;
        i8 = HEAP32[i19 >> 2] | 0;
        i7 = HEAP32[i18 >> 2] | 0;
       }
       i14 = i5 + i8 | 0;
       i14 = (HEAP32[i7 + (i14 >>> 9 << 2) >> 2] | 0) + ((i14 & 511) << 3) | 0;
       HEAP32[i14 >> 2] = i9;
       HEAP32[i14 + 4 >> 2] = i12;
       HEAP32[i20 >> 2] = (HEAP32[i20 >> 2] | 0) + 1;
      }
      i4 = HEAP32[i4 + 12 >> 2] | 0;
     } while ((i4 | 0) != 0);
    }
    i4 = HEAP32[i20 >> 2] | 0;
    i5 = HEAP32[i19 >> 2] | 0;
   } else {
    i5 = i7;
    i6 = i9;
   }
   i4 = i4 + -1 | 0;
   HEAP32[i20 >> 2] = i4;
   i14 = i5 + 1 | 0;
   HEAP32[i19 >> 2] = i14;
   if (i14 >>> 0 > 1023) {
    __ZdlPv(HEAP32[HEAP32[i18 >> 2] >> 2] | 0);
    HEAP32[i18 >> 2] = (HEAP32[i18 >> 2] | 0) + 4;
    HEAP32[i19 >> 2] = (HEAP32[i19 >> 2] | 0) + -512;
    i4 = HEAP32[i20 >> 2] | 0;
   }
   if (!i4) break L8; else i9 = i6;
  }
  _printf(3062, i22) | 0;
 } while (0);
 __ZNSt3__15queueINS_4pairIP6b2BodyiEENS_5dequeIS4_NS_9allocatorIS4_EEEEED2Ev(i23);
 if (!i1) {
  STACKTOP = i24;
  return;
 }
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 STACKTOP = i24;
 return;
}

function __ZNSt3__15dequeINS_4pairIP6b2BodyiEENS_9allocatorIS4_EEE19__add_back_capacityEv(i14) {
 i14 = i14 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i15 + 4 | 0;
 i5 = i15;
 i1 = i14 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (i2 >>> 0 > 511) {
  HEAP32[i1 >> 2] = i2 + -512;
  i10 = i14 + 4 | 0;
  i3 = HEAP32[i10 >> 2] | 0;
  i12 = HEAP32[i3 >> 2] | 0;
  i4 = i3 + 4 | 0;
  HEAP32[i10 >> 2] = i4;
  i11 = i14 + 8 | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  i9 = i14 + 12 | 0;
  i2 = i1;
  do if ((i1 | 0) == (HEAP32[i9 >> 2] | 0)) {
   i13 = HEAP32[i14 >> 2] | 0;
   i5 = i13;
   if (i4 >>> 0 > i13 >>> 0) {
    i1 = i4;
    i14 = ((i1 - i5 >> 2) + 1 | 0) / -2 | 0;
    i1 = i2 - i1 | 0;
    _memmove(i3 + (i14 + 1 << 2) | 0, i4 | 0, i1 | 0) | 0;
    i1 = i3 + ((i1 >> 2) + 1 + i14 << 2) | 0;
    HEAP32[i11 >> 2] = i1;
    HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + (i14 << 2);
    break;
   }
   i8 = i2 - i5 >> 1;
   i8 = (i8 | 0) == 0 ? 1 : i8;
   i13 = __Znwj(i8 << 2) | 0;
   i6 = i13;
   i2 = i13 + (i8 >>> 2 << 2) | 0;
   i7 = i2;
   i8 = i13 + (i8 << 2) | 0;
   if ((i4 | 0) == (i1 | 0)) {
    i3 = i14;
    i1 = i7;
    i2 = i5;
   } else {
    i3 = i7;
    do {
     HEAP32[i2 >> 2] = HEAP32[i4 >> 2];
     i2 = i3 + 4 | 0;
     i3 = i2;
     i4 = i4 + 4 | 0;
    } while ((i4 | 0) != (i1 | 0));
    i1 = i3;
    i3 = i14;
    i2 = HEAP32[i14 >> 2] | 0;
   }
   HEAP32[i3 >> 2] = i6;
   HEAP32[i10 >> 2] = i7;
   HEAP32[i11 >> 2] = i1;
   HEAP32[i9 >> 2] = i8;
   if (i2) {
    __ZdlPv(i2);
    i1 = HEAP32[i11 >> 2] | 0;
   }
  } while (0);
  HEAP32[i1 >> 2] = i12;
  HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 4;
  STACKTOP = i15;
  return;
 }
 i13 = i14 + 8 | 0;
 i2 = HEAP32[i13 >> 2] | 0;
 i11 = i14 + 4 | 0;
 i7 = i2 - (HEAP32[i11 >> 2] | 0) | 0;
 i8 = i7 >> 2;
 i12 = i14 + 12 | 0;
 i3 = HEAP32[i12 >> 2] | 0;
 i1 = i3 - (HEAP32[i14 >> 2] | 0) | 0;
 if (i8 >>> 0 < i1 >> 2 >>> 0) {
  i1 = __Znwj(4096) | 0;
  if ((i3 | 0) != (i2 | 0)) {
   HEAP32[i4 >> 2] = i1;
   __ZNSt3__114__split_bufferIPNS_4pairIP6b2BodyiEENS_9allocatorIS5_EEE9push_backEOS5_(i14, i4);
   STACKTOP = i15;
   return;
  }
  HEAP32[i5 >> 2] = i1;
  __ZNSt3__114__split_bufferIPNS_4pairIP6b2BodyiEENS_9allocatorIS5_EEE10push_frontEOS5_(i14, i5);
  i1 = HEAP32[i11 >> 2] | 0;
  i9 = HEAP32[i1 >> 2] | 0;
  i4 = i1 + 4 | 0;
  HEAP32[i11 >> 2] = i4;
  i5 = HEAP32[i13 >> 2] | 0;
  i3 = i5;
  do if ((i5 | 0) == (HEAP32[i12 >> 2] | 0)) {
   i10 = HEAP32[i14 >> 2] | 0;
   i2 = i10;
   if (i4 >>> 0 > i10 >>> 0) {
    i12 = i4;
    i14 = ((i12 - i2 >> 2) + 1 | 0) / -2 | 0;
    i12 = i3 - i12 | 0;
    _memmove(i1 + (i14 + 1 << 2) | 0, i4 | 0, i12 | 0) | 0;
    i1 = i1 + ((i12 >> 2) + 1 + i14 << 2) | 0;
    HEAP32[i13 >> 2] = i1;
    HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + (i14 << 2);
    break;
   }
   i8 = i3 - i2 >> 1;
   i8 = (i8 | 0) == 0 ? 1 : i8;
   i10 = __Znwj(i8 << 2) | 0;
   i6 = i10;
   i1 = i10 + (i8 >>> 2 << 2) | 0;
   i7 = i1;
   i8 = i10 + (i8 << 2) | 0;
   if ((i4 | 0) == (i5 | 0)) {
    i3 = i14;
    i1 = i7;
   } else {
    i3 = i1;
    i2 = i4;
    i1 = i7;
    do {
     HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
     i3 = i1 + 4 | 0;
     i1 = i3;
     i2 = i2 + 4 | 0;
    } while ((i2 | 0) != (i5 | 0));
    i3 = i14;
    i2 = HEAP32[i14 >> 2] | 0;
   }
   HEAP32[i3 >> 2] = i6;
   HEAP32[i11 >> 2] = i7;
   HEAP32[i13 >> 2] = i1;
   HEAP32[i12 >> 2] = i8;
   if (i2) {
    __ZdlPv(i2);
    i1 = HEAP32[i13 >> 2] | 0;
   }
  } else i1 = i5; while (0);
  HEAP32[i1 >> 2] = i9;
  HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 4;
  STACKTOP = i15;
  return;
 }
 i10 = i1 >> 1;
 i10 = (i10 | 0) == 0 ? 1 : i10;
 i1 = __Znwj(i10 << 2) | 0;
 i3 = i1;
 i4 = i1 + (i10 << 2) | 0;
 i2 = i1 + (i8 << 2) | 0;
 i6 = __Znwj(4096) | 0;
 do if ((i8 | 0) == (i10 | 0)) if ((i7 | 0) > 0) {
  i2 = i1 + (((i8 + 1 | 0) / -2 | 0) + i8 << 2) | 0;
  i5 = i3;
  break;
 } else {
  i4 = i7 >> 1;
  i4 = (i4 | 0) == 0 ? 1 : i4;
  i10 = __Znwj(i4 << 2) | 0;
  __ZdlPv(i1);
  i2 = i10 + (i4 >>> 2 << 2) | 0;
  i5 = i10;
  i4 = i10 + (i4 << 2) | 0;
  break;
 } else i5 = i3; while (0);
 i1 = i2;
 HEAP32[i2 >> 2] = i6;
 i3 = i2 + 4 | 0;
 i2 = HEAP32[i13 >> 2] | 0;
 if ((i2 | 0) != (HEAP32[i11 >> 2] | 0)) do {
  i2 = i2 + -4 | 0;
  i6 = i1;
  do if ((i6 | 0) == (i5 | 0)) {
   i10 = i3;
   if (i10 >>> 0 < i4 >>> 0) {
    i9 = ((i4 - i3 >> 2) + 1 | 0) / 2 | 0;
    i6 = i3 - i1 | 0;
    i3 = i10 + (i9 - (i6 >> 2) << 2) | 0;
    _memmove(i3 | 0, i1 | 0, i6 | 0) | 0;
    i6 = i3;
    i1 = i3;
    i3 = i10 + (i9 << 2) | 0;
    break;
   }
   i4 = i4 - i1 >> 1;
   i4 = (i4 | 0) == 0 ? 1 : i4;
   i7 = __Znwj(i4 << 2) | 0;
   i9 = i7;
   i8 = i7 + ((i4 + 3 | 0) >>> 2 << 2) | 0;
   i1 = i8;
   i4 = i7 + (i4 << 2) | 0;
   if ((i6 | 0) == (i10 | 0)) i3 = i1; else {
    i7 = i8;
    i3 = i1;
    do {
     HEAP32[i7 >> 2] = HEAP32[i6 >> 2];
     i7 = i3 + 4 | 0;
     i3 = i7;
     i6 = i6 + 4 | 0;
    } while ((i6 | 0) != (i10 | 0));
   }
   if (!i5) {
    i6 = i8;
    i5 = i9;
   } else {
    __ZdlPv(i5);
    i6 = i8;
    i5 = i9;
   }
  } while (0);
  HEAP32[i6 + -4 >> 2] = HEAP32[i2 >> 2];
  i1 = i1 + -4 | 0;
 } while ((i2 | 0) != (HEAP32[i11 >> 2] | 0));
 i2 = HEAP32[i14 >> 2] | 0;
 HEAP32[i14 >> 2] = i5;
 HEAP32[i11 >> 2] = i1;
 HEAP32[i13 >> 2] = i3;
 HEAP32[i12 >> 2] = i4;
 if (!i2) {
  STACKTOP = i15;
  return;
 }
 __ZdlPv(i2);
 STACKTOP = i15;
 return;
}

function __ZN13b2DynamicTree10InsertLeafEi(i23, i21) {
 i23 = i23 | 0;
 i21 = i21 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0, i22 = 0;
 i1 = i23 + 24 | 0;
 HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 1;
 i1 = HEAP32[i23 >> 2] | 0;
 if ((i1 | 0) == -1) {
  HEAP32[i23 >> 2] = i21;
  HEAP32[(HEAP32[i23 + 4 >> 2] | 0) + (i21 * 36 | 0) + 20 >> 2] = -1;
  return;
 }
 i22 = i23 + 4 | 0;
 i4 = HEAP32[i22 >> 2] | 0;
 d17 = +HEAPF32[i4 + (i21 * 36 | 0) >> 2];
 d18 = +HEAPF32[i4 + (i21 * 36 | 0) + 4 >> 2];
 d19 = +HEAPF32[i4 + (i21 * 36 | 0) + 8 >> 2];
 d20 = +HEAPF32[i4 + (i21 * 36 | 0) + 12 >> 2];
 i2 = HEAP32[i4 + (i1 * 36 | 0) + 24 >> 2] | 0;
 L5 : do if ((i2 | 0) == -1) i5 = i1; else while (1) {
  i3 = HEAP32[i4 + (i1 * 36 | 0) + 28 >> 2] | 0;
  d8 = +HEAPF32[i4 + (i1 * 36 | 0) + 8 >> 2];
  d7 = +HEAPF32[i4 + (i1 * 36 | 0) >> 2];
  d6 = +HEAPF32[i4 + (i1 * 36 | 0) + 12 >> 2];
  d15 = +HEAPF32[i4 + (i1 * 36 | 0) + 4 >> 2];
  d9 = ((d8 > d19 ? d8 : d19) - (d7 < d17 ? d7 : d17) + ((d6 > d20 ? d6 : d20) - (d15 < d18 ? d15 : d18))) * 2.0;
  d16 = d9 * 2.0;
  d15 = (d9 - (d8 - d7 + (d6 - d15)) * 2.0) * 2.0;
  d6 = +HEAPF32[i4 + (i2 * 36 | 0) >> 2];
  d7 = d17 < d6 ? d17 : d6;
  d8 = +HEAPF32[i4 + (i2 * 36 | 0) + 4 >> 2];
  d9 = d18 < d8 ? d18 : d8;
  d10 = +HEAPF32[i4 + (i2 * 36 | 0) + 8 >> 2];
  d11 = d19 > d10 ? d19 : d10;
  d12 = +HEAPF32[i4 + (i2 * 36 | 0) + 12 >> 2];
  d13 = d20 > d12 ? d20 : d12;
  if ((HEAP32[i4 + (i2 * 36 | 0) + 24 >> 2] | 0) == -1) d6 = (d11 - d7 + (d13 - d9)) * 2.0; else d6 = (d11 - d7 + (d13 - d9)) * 2.0 - (d10 - d6 + (d12 - d8)) * 2.0;
  d14 = d15 + d6;
  d7 = +HEAPF32[i4 + (i3 * 36 | 0) >> 2];
  d8 = d17 < d7 ? d17 : d7;
  d9 = +HEAPF32[i4 + (i3 * 36 | 0) + 4 >> 2];
  d10 = d18 < d9 ? d18 : d9;
  d11 = +HEAPF32[i4 + (i3 * 36 | 0) + 8 >> 2];
  d12 = d19 > d11 ? d19 : d11;
  d13 = +HEAPF32[i4 + (i3 * 36 | 0) + 12 >> 2];
  d6 = d20 > d13 ? d20 : d13;
  if ((HEAP32[i4 + (i3 * 36 | 0) + 24 >> 2] | 0) == -1) d6 = (d12 - d8 + (d6 - d10)) * 2.0; else d6 = (d12 - d8 + (d6 - d10)) * 2.0 - (d11 - d7 + (d13 - d9)) * 2.0;
  d6 = d15 + d6;
  if (d16 < d14 & d16 < d6) {
   i5 = i1;
   break L5;
  }
  i1 = d14 < d6 ? i2 : i3;
  i2 = HEAP32[i4 + (i1 * 36 | 0) + 24 >> 2] | 0;
  if ((i2 | 0) == -1) {
   i5 = i1;
   break;
  }
 } while (0);
 i4 = HEAP32[i4 + (i5 * 36 | 0) + 20 >> 2] | 0;
 i1 = __ZN13b2DynamicTree12AllocateNodeEv(i23) | 0;
 i2 = HEAP32[i22 >> 2] | 0;
 HEAP32[i2 + (i1 * 36 | 0) + 20 >> 2] = i4;
 HEAP32[i2 + (i1 * 36 | 0) + 16 >> 2] = 0;
 d15 = +HEAPF32[i2 + (i5 * 36 | 0) >> 2];
 d16 = +HEAPF32[i2 + (i5 * 36 | 0) + 4 >> 2];
 HEAPF32[i2 + (i1 * 36 | 0) >> 2] = d17 < d15 ? d17 : d15;
 HEAPF32[i2 + (i1 * 36 | 0) + 4 >> 2] = d18 < d16 ? d18 : d16;
 d17 = +HEAPF32[i2 + (i5 * 36 | 0) + 8 >> 2];
 d18 = +HEAPF32[i2 + (i5 * 36 | 0) + 12 >> 2];
 HEAPF32[i2 + (i1 * 36 | 0) + 8 >> 2] = d19 > d17 ? d19 : d17;
 HEAPF32[i2 + (i1 * 36 | 0) + 12 >> 2] = d20 > d18 ? d20 : d18;
 i2 = HEAP32[i22 >> 2] | 0;
 HEAP32[i2 + (i1 * 36 | 0) + 32 >> 2] = (HEAP32[i2 + (i5 * 36 | 0) + 32 >> 2] | 0) + 1;
 if ((i4 | 0) == -1) {
  HEAP32[i2 + (i1 * 36 | 0) + 24 >> 2] = i5;
  HEAP32[i2 + (i1 * 36 | 0) + 28 >> 2] = i21;
  HEAP32[i2 + (i5 * 36 | 0) + 20 >> 2] = i1;
  i21 = i2 + (i21 * 36 | 0) + 20 | 0;
  HEAP32[i21 >> 2] = i1;
  HEAP32[i23 >> 2] = i1;
  i1 = HEAP32[i21 >> 2] | 0;
 } else {
  i3 = i2 + (i4 * 36 | 0) + 24 | 0;
  if ((HEAP32[i3 >> 2] | 0) == (i5 | 0)) HEAP32[i3 >> 2] = i1; else HEAP32[i2 + (i4 * 36 | 0) + 28 >> 2] = i1;
  HEAP32[i2 + (i1 * 36 | 0) + 24 >> 2] = i5;
  HEAP32[i2 + (i1 * 36 | 0) + 28 >> 2] = i21;
  HEAP32[i2 + (i5 * 36 | 0) + 20 >> 2] = i1;
  HEAP32[i2 + (i21 * 36 | 0) + 20 >> 2] = i1;
 }
 if ((i1 | 0) == -1) return;
 while (1) {
  i1 = __ZN13b2DynamicTree7BalanceEi(i23, i1) | 0;
  i2 = HEAP32[i22 >> 2] | 0;
  i3 = HEAP32[i2 + (i1 * 36 | 0) + 24 >> 2] | 0;
  i4 = HEAP32[i2 + (i1 * 36 | 0) + 28 >> 2] | 0;
  if ((i3 | 0) == -1) {
   i1 = 20;
   break;
  }
  if ((i4 | 0) == -1) {
   i1 = 22;
   break;
  }
  i5 = HEAP32[i2 + (i3 * 36 | 0) + 32 >> 2] | 0;
  i21 = HEAP32[i2 + (i4 * 36 | 0) + 32 >> 2] | 0;
  HEAP32[i2 + (i1 * 36 | 0) + 32 >> 2] = ((i5 | 0) > (i21 | 0) ? i5 : i21) + 1;
  d20 = +HEAPF32[i2 + (i3 * 36 | 0) >> 2];
  d19 = +HEAPF32[i2 + (i4 * 36 | 0) >> 2];
  d18 = +HEAPF32[i2 + (i3 * 36 | 0) + 4 >> 2];
  d17 = +HEAPF32[i2 + (i4 * 36 | 0) + 4 >> 2];
  HEAPF32[i2 + (i1 * 36 | 0) >> 2] = d20 < d19 ? d20 : d19;
  HEAPF32[i2 + (i1 * 36 | 0) + 4 >> 2] = d18 < d17 ? d18 : d17;
  d17 = +HEAPF32[i2 + (i3 * 36 | 0) + 8 >> 2];
  d18 = +HEAPF32[i2 + (i4 * 36 | 0) + 8 >> 2];
  d19 = +HEAPF32[i2 + (i3 * 36 | 0) + 12 >> 2];
  d20 = +HEAPF32[i2 + (i4 * 36 | 0) + 12 >> 2];
  HEAPF32[i2 + (i1 * 36 | 0) + 8 >> 2] = d17 > d18 ? d17 : d18;
  HEAPF32[i2 + (i1 * 36 | 0) + 12 >> 2] = d19 > d20 ? d19 : d20;
  i1 = HEAP32[(HEAP32[i22 >> 2] | 0) + (i1 * 36 | 0) + 20 >> 2] | 0;
  if ((i1 | 0) == -1) {
   i1 = 24;
   break;
  }
 }
 if ((i1 | 0) == 20) ___assert_fail(5098, 4451, 304, 5113); else if ((i1 | 0) == 22) ___assert_fail(5124, 4451, 305, 5113); else if ((i1 | 0) == 24) return;
}

function __Z25b2CollidePolygonAndCircleP10b2ManifoldPK14b2PolygonShapeRK11b2TransformPK13b2CircleShapeS6_(i22, i19, i1, i4, i2) {
 i22 = i22 | 0;
 i19 = i19 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var d3 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, d17 = 0.0, d18 = 0.0, i20 = 0, i21 = 0;
 i20 = i22 + 60 | 0;
 HEAP32[i20 >> 2] = 0;
 i21 = i4 + 12 | 0;
 d10 = +HEAPF32[i2 + 12 >> 2];
 d16 = +HEAPF32[i21 >> 2];
 d17 = +HEAPF32[i2 + 8 >> 2];
 d11 = +HEAPF32[i4 + 16 >> 2];
 d18 = +HEAPF32[i2 >> 2] + (d10 * d16 - d17 * d11) - +HEAPF32[i1 >> 2];
 d11 = d16 * d17 + d10 * d11 + +HEAPF32[i2 + 4 >> 2] - +HEAPF32[i1 + 4 >> 2];
 d10 = +HEAPF32[i1 + 12 >> 2];
 d17 = +HEAPF32[i1 + 8 >> 2];
 d16 = d18 * d10 + d11 * d17;
 d17 = d10 * d11 - d18 * d17;
 d18 = +HEAPF32[i19 + 8 >> 2] + +HEAPF32[i4 + 8 >> 2];
 i4 = HEAP32[i19 + 148 >> 2] | 0;
 do if ((i4 | 0) > 0) {
  i2 = 0;
  i1 = 0;
  d5 = -34028234663852886.0e22;
  while (1) {
   d3 = (d16 - +HEAPF32[i19 + 20 + (i2 << 3) >> 2]) * +HEAPF32[i19 + 84 + (i2 << 3) >> 2] + (d17 - +HEAPF32[i19 + 20 + (i2 << 3) + 4 >> 2]) * +HEAPF32[i19 + 84 + (i2 << 3) + 4 >> 2];
   if (d3 > d18) {
    i2 = 19;
    break;
   }
   i15 = d3 > d5;
   d5 = i15 ? d3 : d5;
   i1 = i15 ? i2 : i1;
   i2 = i2 + 1 | 0;
   if ((i2 | 0) >= (i4 | 0)) {
    i2 = 4;
    break;
   }
  }
  if ((i2 | 0) == 4) {
   i15 = i1;
   i1 = d5 < 1.1920928955078125e-007;
   break;
  } else if ((i2 | 0) == 19) return;
 } else {
  i15 = 0;
  i1 = 1;
 } while (0);
 i14 = i15 + 1 | 0;
 i14 = (i14 | 0) < (i4 | 0) ? i14 : 0;
 i4 = HEAP32[i19 + 20 + (i15 << 3) >> 2] | 0;
 i12 = HEAP32[i19 + 20 + (i15 << 3) + 4 >> 2] | 0;
 i13 = HEAP32[i19 + 20 + (i14 << 3) >> 2] | 0;
 i14 = HEAP32[i19 + 20 + (i14 << 3) + 4 >> 2] | 0;
 if (i1) {
  HEAP32[i20 >> 2] = 1;
  HEAP32[i22 + 56 >> 2] = 1;
  i15 = i19 + 84 + (i15 << 3) | 0;
  i20 = HEAP32[i15 + 4 >> 2] | 0;
  i19 = i22 + 40 | 0;
  HEAP32[i19 >> 2] = HEAP32[i15 >> 2];
  HEAP32[i19 + 4 >> 2] = i20;
  d17 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
  d17 = d17 + (HEAP32[tempDoublePtr >> 2] = i13, +HEAPF32[tempDoublePtr >> 2]);
  d18 = (HEAP32[tempDoublePtr >> 2] = i12, +HEAPF32[tempDoublePtr >> 2]);
  d18 = (d18 + (HEAP32[tempDoublePtr >> 2] = i14, +HEAPF32[tempDoublePtr >> 2])) * .5;
  HEAPF32[i22 + 48 >> 2] = d17 * .5;
  HEAPF32[i22 + 52 >> 2] = d18;
  i19 = i21;
  i20 = HEAP32[i19 + 4 >> 2] | 0;
  i21 = i22;
  HEAP32[i21 >> 2] = HEAP32[i19 >> 2];
  HEAP32[i21 + 4 >> 2] = i20;
  HEAP32[i22 + 16 >> 2] = 0;
  return;
 }
 d3 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
 d8 = d16 - d3;
 d6 = (HEAP32[tempDoublePtr >> 2] = i12, +HEAPF32[tempDoublePtr >> 2]);
 d9 = d17 - d6;
 d5 = (HEAP32[tempDoublePtr >> 2] = i13, +HEAPF32[tempDoublePtr >> 2]);
 d7 = (HEAP32[tempDoublePtr >> 2] = i14, +HEAPF32[tempDoublePtr >> 2]);
 d10 = d16 - d5;
 d11 = d17 - d7;
 if (d8 * (d5 - d3) + d9 * (d7 - d6) <= 0.0) {
  d3 = d8 * d8 + d9 * d9;
  if (d3 > d18 * d18) return;
  HEAP32[i20 >> 2] = 1;
  HEAP32[i22 + 56 >> 2] = 1;
  i1 = i22 + 40 | 0;
  HEAPF32[i1 >> 2] = d8;
  i2 = i22 + 44 | 0;
  HEAPF32[i2 >> 2] = d9;
  d3 = +Math_sqrt(+d3);
  if (!(d3 < 1.1920928955078125e-007)) {
   d18 = 1.0 / d3;
   HEAPF32[i1 >> 2] = d8 * d18;
   HEAPF32[i2 >> 2] = d9 * d18;
  }
  HEAP32[i22 + 48 >> 2] = i4;
  HEAP32[i22 + 52 >> 2] = i12;
  i19 = i21;
  i20 = HEAP32[i19 + 4 >> 2] | 0;
  i21 = i22;
  HEAP32[i21 >> 2] = HEAP32[i19 >> 2];
  HEAP32[i21 + 4 >> 2] = i20;
  HEAP32[i22 + 16 >> 2] = 0;
  return;
 }
 if (!(d10 * (d3 - d5) + d11 * (d6 - d7) <= 0.0)) {
  d5 = (d3 + d5) * .5;
  d3 = (d6 + d7) * .5;
  i1 = i19 + 84 + (i15 << 3) | 0;
  if ((d16 - d5) * +HEAPF32[i1 >> 2] + (d17 - d3) * +HEAPF32[i19 + 84 + (i15 << 3) + 4 >> 2] > d18) return;
  HEAP32[i20 >> 2] = 1;
  HEAP32[i22 + 56 >> 2] = 1;
  i15 = i1;
  i20 = HEAP32[i15 + 4 >> 2] | 0;
  i19 = i22 + 40 | 0;
  HEAP32[i19 >> 2] = HEAP32[i15 >> 2];
  HEAP32[i19 + 4 >> 2] = i20;
  HEAPF32[i22 + 48 >> 2] = d5;
  HEAPF32[i22 + 52 >> 2] = d3;
  i19 = i21;
  i20 = HEAP32[i19 + 4 >> 2] | 0;
  i21 = i22;
  HEAP32[i21 >> 2] = HEAP32[i19 >> 2];
  HEAP32[i21 + 4 >> 2] = i20;
  HEAP32[i22 + 16 >> 2] = 0;
  return;
 }
 d3 = d10 * d10 + d11 * d11;
 if (d3 > d18 * d18) return;
 HEAP32[i20 >> 2] = 1;
 HEAP32[i22 + 56 >> 2] = 1;
 i1 = i22 + 40 | 0;
 HEAPF32[i1 >> 2] = d10;
 i2 = i22 + 44 | 0;
 HEAPF32[i2 >> 2] = d11;
 d3 = +Math_sqrt(+d3);
 if (!(d3 < 1.1920928955078125e-007)) {
  d18 = 1.0 / d3;
  HEAPF32[i1 >> 2] = d10 * d18;
  HEAPF32[i2 >> 2] = d11 * d18;
 }
 HEAP32[i22 + 48 >> 2] = i13;
 HEAP32[i22 + 52 >> 2] = i14;
 i19 = i21;
 i20 = HEAP32[i19 + 4 >> 2] | 0;
 i21 = i22;
 HEAP32[i21 >> 2] = HEAP32[i19 >> 2];
 HEAP32[i21 + 4 >> 2] = i20;
 HEAP32[i22 + 16 >> 2] = 0;
 return;
}

function __ZN15b2ContactSolver27SolveTOIPositionConstraintsEii(i2, i37, i38) {
 i2 = i2 | 0;
 i37 = i37 | 0;
 i38 = i38 | 0;
 var d1 = 0.0, d3 = 0.0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, i11 = 0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, i16 = 0, d17 = 0.0, d18 = 0.0, d19 = 0.0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i39 = 0, i40 = 0, i41 = 0, d42 = 0.0, d43 = 0.0, d44 = 0.0, d45 = 0.0, d46 = 0.0, d47 = 0.0, d48 = 0.0, d49 = 0.0, d50 = 0.0, d51 = 0.0, d52 = 0.0, d53 = 0.0, d54 = 0.0;
 i41 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i39 = i41 + 40 | 0;
 i40 = i41 + 24 | 0;
 i36 = i41;
 i34 = i2 + 48 | 0;
 if ((HEAP32[i34 >> 2] | 0) <= 0) {
  d19 = 0.0;
  i40 = d19 >= -.007499999832361937;
  STACKTOP = i41;
  return i40 | 0;
 }
 i35 = i2 + 36 | 0;
 i27 = i2 + 24 | 0;
 i28 = i39 + 8 | 0;
 i29 = i39 + 12 | 0;
 i30 = i40 + 8 | 0;
 i31 = i40 + 12 | 0;
 i32 = i39 + 4 | 0;
 i20 = i40 + 4 | 0;
 i21 = i36 + 4 | 0;
 i22 = i36 + 8 | 0;
 i23 = i36 + 12 | 0;
 i24 = i36 + 16 | 0;
 i33 = 0;
 d1 = 0.0;
 do {
  i2 = HEAP32[i35 >> 2] | 0;
  i11 = i2 + (i33 * 88 | 0) | 0;
  i25 = HEAP32[i2 + (i33 * 88 | 0) + 32 >> 2] | 0;
  i26 = HEAP32[i2 + (i33 * 88 | 0) + 36 >> 2] | 0;
  d12 = +HEAPF32[i2 + (i33 * 88 | 0) + 48 >> 2];
  d13 = +HEAPF32[i2 + (i33 * 88 | 0) + 52 >> 2];
  d14 = +HEAPF32[i2 + (i33 * 88 | 0) + 56 >> 2];
  d15 = +HEAPF32[i2 + (i33 * 88 | 0) + 60 >> 2];
  i16 = HEAP32[i2 + (i33 * 88 | 0) + 84 >> 2] | 0;
  if ((i25 | 0) == (i37 | 0) | (i25 | 0) == (i38 | 0)) {
   d17 = +HEAPF32[i2 + (i33 * 88 | 0) + 64 >> 2];
   d19 = +HEAPF32[i2 + (i33 * 88 | 0) + 40 >> 2];
  } else {
   d17 = 0.0;
   d19 = 0.0;
  }
  if ((i26 | 0) == (i37 | 0) | (i26 | 0) == (i38 | 0)) {
   d18 = +HEAPF32[i2 + (i33 * 88 | 0) + 68 >> 2];
   d10 = +HEAPF32[i2 + (i33 * 88 | 0) + 44 >> 2];
  } else {
   d18 = 0.0;
   d10 = 0.0;
  }
  i8 = HEAP32[i27 >> 2] | 0;
  i7 = HEAP32[i8 + (i25 * 12 | 0) >> 2] | 0;
  i4 = HEAP32[i8 + (i25 * 12 | 0) + 4 >> 2] | 0;
  d6 = +HEAPF32[i8 + (i25 * 12 | 0) + 8 >> 2];
  i5 = HEAP32[i8 + (i26 * 12 | 0) >> 2] | 0;
  i2 = HEAP32[i8 + (i26 * 12 | 0) + 4 >> 2] | 0;
  d3 = +HEAPF32[i8 + (i26 * 12 | 0) + 8 >> 2];
  if ((i16 | 0) > 0) {
   d9 = d19 + d10;
   i8 = 0;
   do {
    d47 = +Math_sin(+d6);
    HEAPF32[i28 >> 2] = d47;
    d46 = +Math_cos(+d6);
    HEAPF32[i29 >> 2] = d46;
    d42 = +Math_sin(+d3);
    HEAPF32[i30 >> 2] = d42;
    d52 = +Math_cos(+d3);
    HEAPF32[i31 >> 2] = d52;
    d51 = (HEAP32[tempDoublePtr >> 2] = i7, +HEAPF32[tempDoublePtr >> 2]);
    d50 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i39 >> 2] = d51 - (d12 * d46 - d13 * d47);
    HEAPF32[i32 >> 2] = d50 - (d13 * d46 + d12 * d47);
    d47 = (HEAP32[tempDoublePtr >> 2] = i5, +HEAPF32[tempDoublePtr >> 2]);
    d46 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i40 >> 2] = d47 - (d14 * d52 - d15 * d42);
    HEAPF32[i20 >> 2] = d46 - (d15 * d52 + d14 * d42);
    __ZN24b2PositionSolverManifold10InitializeEP27b2ContactPositionConstraintRK11b2TransformS4_i(i36, i11, i39, i40, i8);
    d42 = +HEAPF32[i36 >> 2];
    d52 = +HEAPF32[i21 >> 2];
    d45 = +HEAPF32[i22 >> 2];
    d43 = +HEAPF32[i23 >> 2];
    d53 = +HEAPF32[i24 >> 2];
    d49 = d45 - d51;
    d48 = d43 - d50;
    d45 = d45 - d47;
    d43 = d43 - d46;
    d1 = d1 < d53 ? d1 : d53;
    d53 = (d53 + .004999999888241291) * .75;
    d53 = d53 < 0.0 ? d53 : 0.0;
    d44 = d52 * d49 - d42 * d48;
    d54 = d52 * d45 - d42 * d43;
    d44 = d54 * (d18 * d54) + (d9 + d44 * (d17 * d44));
    d44 = d44 > 0.0 ? (d53 < -.20000000298023224 ? .20000000298023224 : -d53) / d44 : 0.0;
    d42 = d42 * d44;
    d44 = d52 * d44;
    i7 = (HEAPF32[tempDoublePtr >> 2] = d51 - d19 * d42, HEAP32[tempDoublePtr >> 2] | 0);
    i4 = (HEAPF32[tempDoublePtr >> 2] = d50 - d19 * d44, HEAP32[tempDoublePtr >> 2] | 0);
    d6 = d6 - d17 * (d49 * d44 - d48 * d42);
    i5 = (HEAPF32[tempDoublePtr >> 2] = d47 + d10 * d42, HEAP32[tempDoublePtr >> 2] | 0);
    i2 = (HEAPF32[tempDoublePtr >> 2] = d46 + d10 * d44, HEAP32[tempDoublePtr >> 2] | 0);
    d3 = d3 + d18 * (d45 * d44 - d43 * d42);
    i8 = i8 + 1 | 0;
   } while ((i8 | 0) != (i16 | 0));
   i8 = HEAP32[i27 >> 2] | 0;
  }
  HEAP32[i8 + (i25 * 12 | 0) >> 2] = i7;
  HEAP32[i8 + (i25 * 12 | 0) + 4 >> 2] = i4;
  i16 = HEAP32[i27 >> 2] | 0;
  HEAPF32[i16 + (i25 * 12 | 0) + 8 >> 2] = d6;
  HEAP32[i16 + (i26 * 12 | 0) >> 2] = i5;
  HEAP32[i16 + (i26 * 12 | 0) + 4 >> 2] = i2;
  HEAPF32[(HEAP32[i27 >> 2] | 0) + (i26 * 12 | 0) + 8 >> 2] = d3;
  i33 = i33 + 1 | 0;
 } while ((i33 | 0) < (HEAP32[i34 >> 2] | 0));
 i40 = d1 >= -.007499999832361937;
 STACKTOP = i41;
 return i40 | 0;
}

function __ZN15b2WorldManifold10InitializeEPK10b2ManifoldRK11b2TransformfS5_f(i19, i16, i13, d17, i14, d18) {
 i19 = i19 | 0;
 i16 = i16 | 0;
 i13 = i13 | 0;
 d17 = +d17;
 i14 = i14 | 0;
 d18 = +d18;
 var d1 = 0.0, d2 = 0.0, d3 = 0.0, d4 = 0.0, d5 = 0.0, i6 = 0, d7 = 0.0, d8 = 0.0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i15 = 0, d20 = 0.0, d21 = 0.0;
 i15 = i16 + 60 | 0;
 if (!(HEAP32[i15 >> 2] | 0)) return;
 switch (HEAP32[i16 + 56 >> 2] | 0) {
 case 0:
  {
   HEAPF32[i19 >> 2] = 1.0;
   i6 = i19 + 4 | 0;
   HEAPF32[i6 >> 2] = 0.0;
   d2 = +HEAPF32[i13 + 12 >> 2];
   d3 = +HEAPF32[i16 + 48 >> 2];
   d1 = +HEAPF32[i13 + 8 >> 2];
   d7 = +HEAPF32[i16 + 52 >> 2];
   d8 = +HEAPF32[i13 >> 2] + (d2 * d3 - d1 * d7);
   d7 = d3 * d1 + d2 * d7 + +HEAPF32[i13 + 4 >> 2];
   d2 = +HEAPF32[i14 + 12 >> 2];
   d1 = +HEAPF32[i16 >> 2];
   d3 = +HEAPF32[i14 + 8 >> 2];
   d4 = +HEAPF32[i16 + 4 >> 2];
   d5 = +HEAPF32[i14 >> 2] + (d2 * d1 - d3 * d4);
   d4 = d1 * d3 + d2 * d4 + +HEAPF32[i14 + 4 >> 2];
   d2 = d8 - d5;
   d3 = d7 - d4;
   if (d2 * d2 + d3 * d3 > 1.4210854715202004e-014) {
    d2 = d5 - d8;
    d1 = d4 - d7;
    HEAPF32[i19 >> 2] = d2;
    HEAPF32[i6 >> 2] = d1;
    d3 = +Math_sqrt(+(d1 * d1 + d2 * d2));
    if (!(d3 < 1.1920928955078125e-007)) {
     d3 = 1.0 / d3;
     d2 = d2 * d3;
     HEAPF32[i19 >> 2] = d2;
     d1 = d1 * d3;
     HEAPF32[i6 >> 2] = d1;
    }
   } else {
    d2 = 1.0;
    d1 = 0.0;
   }
   d8 = d8 + d2 * d17;
   d17 = d7 + d1 * d17;
   d7 = d5 - d2 * d18;
   d18 = d4 - d1 * d18;
   HEAPF32[i19 + 8 >> 2] = (d8 + d7) * .5;
   HEAPF32[i19 + 12 >> 2] = (d17 + d18) * .5;
   HEAPF32[i19 + 24 >> 2] = d2 * (d7 - d8) + d1 * (d18 - d17);
   return;
  }
 case 1:
  {
   i10 = i13 + 12 | 0;
   d8 = +HEAPF32[i10 >> 2];
   d7 = +HEAPF32[i16 + 40 >> 2];
   i11 = i13 + 8 | 0;
   d5 = +HEAPF32[i11 >> 2];
   d2 = +HEAPF32[i16 + 44 >> 2];
   d1 = d8 * d7 - d5 * d2;
   d2 = d7 * d5 + d8 * d2;
   HEAPF32[i19 >> 2] = d1;
   i12 = i19 + 4 | 0;
   HEAPF32[i12 >> 2] = d2;
   d8 = +HEAPF32[i10 >> 2];
   d5 = +HEAPF32[i16 + 48 >> 2];
   d7 = +HEAPF32[i11 >> 2];
   d3 = +HEAPF32[i16 + 52 >> 2];
   d4 = +HEAPF32[i13 >> 2] + (d8 * d5 - d7 * d3);
   d3 = d5 * d7 + d8 * d3 + +HEAPF32[i13 + 4 >> 2];
   if ((HEAP32[i15 >> 2] | 0) <= 0) return;
   i9 = i14 + 12 | 0;
   i10 = i14 + 8 | 0;
   i11 = i14 + 4 | 0;
   i6 = 0;
   while (1) {
    d8 = +HEAPF32[i9 >> 2];
    d21 = +HEAPF32[i16 + (i6 * 20 | 0) >> 2];
    d5 = +HEAPF32[i10 >> 2];
    d7 = +HEAPF32[i16 + (i6 * 20 | 0) + 4 >> 2];
    d20 = +HEAPF32[i14 >> 2] + (d8 * d21 - d5 * d7);
    d7 = d21 * d5 + d8 * d7 + +HEAPF32[i11 >> 2];
    d8 = d17 - (d1 * (d20 - d4) + (d7 - d3) * d2);
    d5 = d20 + d1 * d8;
    d8 = d7 + d2 * d8;
    d1 = d20 - d1 * d18;
    d7 = d7 - d2 * d18;
    HEAPF32[i19 + 8 + (i6 << 3) >> 2] = (d1 + d5) * .5;
    HEAPF32[i19 + 8 + (i6 << 3) + 4 >> 2] = (d7 + d8) * .5;
    HEAPF32[i19 + 24 + (i6 << 2) >> 2] = +HEAPF32[i19 >> 2] * (d1 - d5) + +HEAPF32[i12 >> 2] * (d7 - d8);
    i6 = i6 + 1 | 0;
    if ((i6 | 0) >= (HEAP32[i15 >> 2] | 0)) break;
    d1 = +HEAPF32[i19 >> 2];
    d2 = +HEAPF32[i12 >> 2];
   }
   return;
  }
 case 2:
  {
   i10 = i14 + 12 | 0;
   d21 = +HEAPF32[i10 >> 2];
   d20 = +HEAPF32[i16 + 40 >> 2];
   i11 = i14 + 8 | 0;
   d8 = +HEAPF32[i11 >> 2];
   d1 = +HEAPF32[i16 + 44 >> 2];
   d2 = d21 * d20 - d8 * d1;
   d1 = d20 * d8 + d21 * d1;
   HEAPF32[i19 >> 2] = d2;
   i12 = i19 + 4 | 0;
   HEAPF32[i12 >> 2] = d1;
   d21 = +HEAPF32[i10 >> 2];
   d8 = +HEAPF32[i16 + 48 >> 2];
   d20 = +HEAPF32[i11 >> 2];
   d3 = +HEAPF32[i16 + 52 >> 2];
   d4 = +HEAPF32[i14 >> 2] + (d21 * d8 - d20 * d3);
   d3 = d8 * d20 + d21 * d3 + +HEAPF32[i14 + 4 >> 2];
   if ((HEAP32[i15 >> 2] | 0) > 0) {
    i9 = i13 + 12 | 0;
    i10 = i13 + 8 | 0;
    i11 = i13 + 4 | 0;
    i6 = 0;
    do {
     d21 = +HEAPF32[i9 >> 2];
     d5 = +HEAPF32[i16 + (i6 * 20 | 0) >> 2];
     d20 = +HEAPF32[i10 >> 2];
     d7 = +HEAPF32[i16 + (i6 * 20 | 0) + 4 >> 2];
     d8 = +HEAPF32[i13 >> 2] + (d21 * d5 - d20 * d7);
     d7 = d5 * d20 + d21 * d7 + +HEAPF32[i11 >> 2];
     d21 = d18 - (d2 * (d8 - d4) + (d7 - d3) * d1);
     d20 = d8 + d2 * d21;
     d21 = d7 + d1 * d21;
     d8 = d8 - d2 * d17;
     d2 = d7 - d1 * d17;
     HEAPF32[i19 + 8 + (i6 << 3) >> 2] = (d8 + d20) * .5;
     HEAPF32[i19 + 8 + (i6 << 3) + 4 >> 2] = (d2 + d21) * .5;
     HEAPF32[i19 + 24 + (i6 << 2) >> 2] = +HEAPF32[i19 >> 2] * (d8 - d20) + +HEAPF32[i12 >> 2] * (d2 - d21);
     i6 = i6 + 1 | 0;
     d2 = +HEAPF32[i19 >> 2];
     d1 = +HEAPF32[i12 >> 2];
    } while ((i6 | 0) < (HEAP32[i15 >> 2] | 0));
   }
   HEAPF32[i19 >> 2] = -d2;
   HEAPF32[i12 >> 2] = -d1;
   return;
  }
 default:
  return;
 }
}

function __ZN8b2IslandC2EiiiP16b2StackAllocatorP17b2ContactListener(i13, i7, i5, i6, i12, i1) {
 i13 = i13 | 0;
 i7 = i7 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i12 = i12 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 HEAP32[i13 + 40 >> 2] = i7;
 HEAP32[i13 + 44 >> 2] = i5;
 HEAP32[i13 + 48 >> 2] = i6;
 HEAP32[i13 + 28 >> 2] = 0;
 HEAP32[i13 + 36 >> 2] = 0;
 HEAP32[i13 + 32 >> 2] = 0;
 HEAP32[i13 >> 2] = i12;
 HEAP32[i13 + 4 >> 2] = i1;
 i4 = i7 << 2;
 i11 = i12 + 102796 | 0;
 i3 = HEAP32[i11 >> 2] | 0;
 if ((i3 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i3 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i3 * 12 | 0) + 4 >> 2] = i4;
 i10 = i12 + 102400 | 0;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i4 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i4) | 0;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i4;
 }
 i9 = i12 + 102404 | 0;
 i4 = (HEAP32[i9 >> 2] | 0) + i4 | 0;
 HEAP32[i9 >> 2] = i4;
 i8 = i12 + 102408 | 0;
 i3 = HEAP32[i8 >> 2] | 0;
 HEAP32[i8 >> 2] = (i3 | 0) > (i4 | 0) ? i3 : i4;
 i4 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
 HEAP32[i11 >> 2] = i4;
 HEAP32[i13 + 8 >> 2] = HEAP32[i1 >> 2];
 i3 = i5 << 2;
 if ((i4 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i4 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i4 * 12 | 0) + 4 >> 2] = i3;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i3 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i3) | 0;
  HEAP8[i12 + 102412 + (i4 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i4 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i3;
 }
 i4 = (HEAP32[i9 >> 2] | 0) + i3 | 0;
 HEAP32[i9 >> 2] = i4;
 i3 = HEAP32[i8 >> 2] | 0;
 HEAP32[i8 >> 2] = (i3 | 0) > (i4 | 0) ? i3 : i4;
 i4 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
 HEAP32[i11 >> 2] = i4;
 HEAP32[i13 + 12 >> 2] = HEAP32[i1 >> 2];
 i3 = i6 << 2;
 if ((i4 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i4 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i4 * 12 | 0) + 4 >> 2] = i3;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i3 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i3) | 0;
  HEAP8[i12 + 102412 + (i4 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i4 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i3;
 }
 i3 = (HEAP32[i9 >> 2] | 0) + i3 | 0;
 HEAP32[i9 >> 2] = i3;
 i4 = HEAP32[i8 >> 2] | 0;
 HEAP32[i8 >> 2] = (i4 | 0) > (i3 | 0) ? i4 : i3;
 i3 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
 HEAP32[i11 >> 2] = i3;
 HEAP32[i13 + 16 >> 2] = HEAP32[i1 >> 2];
 i4 = i7 * 12 | 0;
 if ((i3 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i3 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i3 * 12 | 0) + 4 >> 2] = i4;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i4 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i4) | 0;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 1;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i4;
 }
 i3 = (HEAP32[i9 >> 2] | 0) + i4 | 0;
 HEAP32[i9 >> 2] = i3;
 i7 = HEAP32[i8 >> 2] | 0;
 HEAP32[i8 >> 2] = (i7 | 0) > (i3 | 0) ? i7 : i3;
 i3 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
 HEAP32[i11 >> 2] = i3;
 HEAP32[i13 + 24 >> 2] = HEAP32[i1 >> 2];
 if ((i3 | 0) >= 32) ___assert_fail(5610, 5552, 38, 4095);
 i1 = i12 + 102412 + (i3 * 12 | 0) | 0;
 HEAP32[i12 + 102412 + (i3 * 12 | 0) + 4 >> 2] = i4;
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 + i4 | 0) > 102400) {
  HEAP32[i1 >> 2] = _malloc(i4) | 0;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 1;
  i12 = i1;
  i10 = HEAP32[i9 >> 2] | 0;
  i10 = i10 + i4 | 0;
  HEAP32[i9 >> 2] = i10;
  i9 = HEAP32[i8 >> 2] | 0;
  i7 = (i9 | 0) > (i10 | 0);
  i10 = i7 ? i9 : i10;
  HEAP32[i8 >> 2] = i10;
  i10 = HEAP32[i11 >> 2] | 0;
  i10 = i10 + 1 | 0;
  HEAP32[i11 >> 2] = i10;
  i12 = HEAP32[i12 >> 2] | 0;
  i13 = i13 + 20 | 0;
  HEAP32[i13 >> 2] = i12;
  return;
 } else {
  HEAP32[i1 >> 2] = i12 + i2;
  HEAP8[i12 + 102412 + (i3 * 12 | 0) + 8 >> 0] = 0;
  HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i4;
  i12 = i1;
  i10 = HEAP32[i9 >> 2] | 0;
  i10 = i10 + i4 | 0;
  HEAP32[i9 >> 2] = i10;
  i9 = HEAP32[i8 >> 2] | 0;
  i7 = (i9 | 0) > (i10 | 0);
  i10 = i7 ? i9 : i10;
  HEAP32[i8 >> 2] = i10;
  i10 = HEAP32[i11 >> 2] | 0;
  i10 = i10 + 1 | 0;
  HEAP32[i11 >> 2] = i10;
  i12 = HEAP32[i12 >> 2] | 0;
  i13 = i13 + 20 | 0;
  HEAP32[i13 >> 2] = i12;
  return;
 }
}

function __ZN15b2ContactSolver24SolvePositionConstraintsEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, d4 = 0.0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, d9 = 0.0, i10 = 0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, d40 = 0.0, d41 = 0.0, d42 = 0.0, d43 = 0.0, d44 = 0.0, d45 = 0.0, d46 = 0.0, d47 = 0.0, d48 = 0.0, d49 = 0.0, d50 = 0.0, d51 = 0.0, d52 = 0.0;
 i39 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i37 = i39 + 40 | 0;
 i38 = i39 + 24 | 0;
 i36 = i39;
 i34 = i2 + 48 | 0;
 if ((HEAP32[i34 >> 2] | 0) <= 0) {
  d18 = 0.0;
  i38 = d18 >= -.014999999664723873;
  STACKTOP = i39;
  return i38 | 0;
 }
 i35 = i2 + 36 | 0;
 i27 = i2 + 24 | 0;
 i28 = i37 + 8 | 0;
 i29 = i37 + 12 | 0;
 i30 = i38 + 8 | 0;
 i31 = i38 + 12 | 0;
 i32 = i37 + 4 | 0;
 i20 = i38 + 4 | 0;
 i21 = i36 + 4 | 0;
 i22 = i36 + 8 | 0;
 i23 = i36 + 12 | 0;
 i24 = i36 + 16 | 0;
 i8 = HEAP32[i27 >> 2] | 0;
 i33 = 0;
 d1 = 0.0;
 do {
  i19 = HEAP32[i35 >> 2] | 0;
  i10 = i19 + (i33 * 88 | 0) | 0;
  i25 = HEAP32[i19 + (i33 * 88 | 0) + 32 >> 2] | 0;
  i26 = HEAP32[i19 + (i33 * 88 | 0) + 36 >> 2] | 0;
  d11 = +HEAPF32[i19 + (i33 * 88 | 0) + 48 >> 2];
  d12 = +HEAPF32[i19 + (i33 * 88 | 0) + 52 >> 2];
  d13 = +HEAPF32[i19 + (i33 * 88 | 0) + 40 >> 2];
  d14 = +HEAPF32[i19 + (i33 * 88 | 0) + 64 >> 2];
  d15 = +HEAPF32[i19 + (i33 * 88 | 0) + 56 >> 2];
  d16 = +HEAPF32[i19 + (i33 * 88 | 0) + 60 >> 2];
  d17 = +HEAPF32[i19 + (i33 * 88 | 0) + 44 >> 2];
  d18 = +HEAPF32[i19 + (i33 * 88 | 0) + 68 >> 2];
  i19 = HEAP32[i19 + (i33 * 88 | 0) + 84 >> 2] | 0;
  i7 = HEAP32[i8 + (i25 * 12 | 0) >> 2] | 0;
  i3 = HEAP32[i8 + (i25 * 12 | 0) + 4 >> 2] | 0;
  d6 = +HEAPF32[i8 + (i25 * 12 | 0) + 8 >> 2];
  i5 = HEAP32[i8 + (i26 * 12 | 0) >> 2] | 0;
  i2 = HEAP32[i8 + (i26 * 12 | 0) + 4 >> 2] | 0;
  d4 = +HEAPF32[i8 + (i26 * 12 | 0) + 8 >> 2];
  if ((i19 | 0) > 0) {
   d9 = d13 + d17;
   i8 = 0;
   do {
    d45 = +Math_sin(+d6);
    HEAPF32[i28 >> 2] = d45;
    d44 = +Math_cos(+d6);
    HEAPF32[i29 >> 2] = d44;
    d40 = +Math_sin(+d4);
    HEAPF32[i30 >> 2] = d40;
    d50 = +Math_cos(+d4);
    HEAPF32[i31 >> 2] = d50;
    d49 = (HEAP32[tempDoublePtr >> 2] = i7, +HEAPF32[tempDoublePtr >> 2]);
    d48 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i37 >> 2] = d49 - (d11 * d44 - d12 * d45);
    HEAPF32[i32 >> 2] = d48 - (d12 * d44 + d11 * d45);
    d45 = (HEAP32[tempDoublePtr >> 2] = i5, +HEAPF32[tempDoublePtr >> 2]);
    d44 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
    HEAPF32[i38 >> 2] = d45 - (d15 * d50 - d16 * d40);
    HEAPF32[i20 >> 2] = d44 - (d16 * d50 + d15 * d40);
    __ZN24b2PositionSolverManifold10InitializeEP27b2ContactPositionConstraintRK11b2TransformS4_i(i36, i10, i37, i38, i8);
    d40 = +HEAPF32[i36 >> 2];
    d50 = +HEAPF32[i21 >> 2];
    d43 = +HEAPF32[i22 >> 2];
    d41 = +HEAPF32[i23 >> 2];
    d51 = +HEAPF32[i24 >> 2];
    d47 = d43 - d49;
    d46 = d41 - d48;
    d43 = d43 - d45;
    d41 = d41 - d44;
    d1 = d1 < d51 ? d1 : d51;
    d51 = (d51 + .004999999888241291) * .20000000298023224;
    d51 = d51 < 0.0 ? d51 : 0.0;
    d42 = d50 * d47 - d40 * d46;
    d52 = d50 * d43 - d40 * d41;
    d42 = d52 * (d18 * d52) + (d9 + d42 * (d14 * d42));
    d42 = d42 > 0.0 ? (d51 < -.20000000298023224 ? .20000000298023224 : -d51) / d42 : 0.0;
    d40 = d40 * d42;
    d42 = d50 * d42;
    i7 = (HEAPF32[tempDoublePtr >> 2] = d49 - d13 * d40, HEAP32[tempDoublePtr >> 2] | 0);
    i3 = (HEAPF32[tempDoublePtr >> 2] = d48 - d13 * d42, HEAP32[tempDoublePtr >> 2] | 0);
    d6 = d6 - d14 * (d47 * d42 - d46 * d40);
    i5 = (HEAPF32[tempDoublePtr >> 2] = d45 + d17 * d40, HEAP32[tempDoublePtr >> 2] | 0);
    i2 = (HEAPF32[tempDoublePtr >> 2] = d44 + d17 * d42, HEAP32[tempDoublePtr >> 2] | 0);
    d4 = d4 + d18 * (d43 * d42 - d41 * d40);
    i8 = i8 + 1 | 0;
   } while ((i8 | 0) != (i19 | 0));
   i8 = HEAP32[i27 >> 2] | 0;
  }
  HEAP32[i8 + (i25 * 12 | 0) >> 2] = i7;
  HEAP32[i8 + (i25 * 12 | 0) + 4 >> 2] = i3;
  i8 = HEAP32[i27 >> 2] | 0;
  HEAPF32[i8 + (i25 * 12 | 0) + 8 >> 2] = d6;
  HEAP32[i8 + (i26 * 12 | 0) >> 2] = i5;
  HEAP32[i8 + (i26 * 12 | 0) + 4 >> 2] = i2;
  i8 = HEAP32[i27 >> 2] | 0;
  HEAPF32[i8 + (i26 * 12 | 0) + 8 >> 2] = d4;
  i33 = i33 + 1 | 0;
 } while ((i33 | 0) < (HEAP32[i34 >> 2] | 0));
 i38 = d1 >= -.014999999664723873;
 STACKTOP = i39;
 return i38 | 0;
}

function __Z11mouse_hoverff(d1, d2) {
 d1 = +d1;
 d2 = +d2;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
 i21 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i20 = i21;
 i19 = i21 + 40 | 0;
 i6 = i21 + 24 | 0;
 i3 = i21 + 8 | 0;
 HEAPF32[i6 >> 2] = d1;
 HEAPF32[i6 + 4 >> 2] = d2;
 HEAPF32[i6 + 8 >> 2] = d1;
 HEAPF32[i6 + 12 >> 2] = d2;
 HEAP32[i3 >> 2] = 812;
 i18 = i3 + 4 | 0;
 HEAP32[i18 >> 2] = 0;
 HEAPF32[i3 + 8 >> 2] = d1;
 HEAPF32[i3 + 12 >> 2] = d2;
 __ZNK7b2World9QueryAABBEP15b2QueryCallbackRK6b2AABB(HEAP32[178] | 0, i3, i6);
 i6 = HEAP32[180] | 0;
 i3 = HEAP32[i6 + 12 >> 2] | 0;
 i7 = HEAP32[i6 + 16 >> 2] | 0;
 i5 = (i3 | 0) == (i7 | 0);
 if (!i5) {
  i4 = i3;
  do {
   HEAP8[i4 + 8 >> 0] = 0;
   i4 = i4 + 16 | 0;
  } while ((i4 | 0) != (i7 | 0));
 }
 i4 = HEAP32[i18 >> 2] | 0;
 i8 = i4;
 if (!i4) {
  i18 = i6;
  i16 = 0;
  i19 = i8;
  i20 = i18 + 36 | 0;
  i17 = HEAP32[i20 >> 2] | 0;
  i17 = (i16 | 0) != (i17 | 0);
  i18 = i18 + 56 | 0;
  i17 = i17 & 1;
  HEAP8[i18 >> 0] = i17;
  HEAP32[i20 >> 2] = i19;
  STACKTOP = i21;
  return;
 }
 if (!i5) do {
  HEAP8[i3 + 9 >> 0] = 0;
  i3 = i3 + 16 | 0;
 } while ((i3 | 0) != (i7 | 0));
 HEAP32[i19 >> 2] = 0;
 HEAP32[i19 + 4 >> 2] = 0;
 HEAP32[i19 + 8 >> 2] = 0;
 HEAP32[i19 + 12 >> 2] = 0;
 HEAP32[i19 + 16 >> 2] = 0;
 HEAP32[i19 + 20 >> 2] = 0;
 i13 = HEAP32[HEAP32[i4 + 148 >> 2] >> 2] | 0;
 i14 = i19 + 8 | 0;
 i15 = i19 + 4 | 0;
 i16 = i19 + 16 | 0;
 i17 = i19 + 20 | 0;
 __ZNSt3__15dequeINS_4pairIP6b2BodyiEENS_9allocatorIS4_EEE19__add_back_capacityEv(i19);
 i3 = (HEAP32[i16 >> 2] | 0) + (HEAP32[i17 >> 2] | 0) | 0;
 i3 = (HEAP32[(HEAP32[i15 >> 2] | 0) + (i3 >>> 9 << 2) >> 2] | 0) + ((i3 & 511) << 3) | 0;
 HEAP32[i3 >> 2] = i8;
 HEAP32[i3 + 4 >> 2] = 0;
 i3 = (HEAP32[i17 >> 2] | 0) + 1 | 0;
 HEAP32[i17 >> 2] = i3;
 L12 : do if (i3) {
  i12 = 0;
  while (1) {
   if ((i12 | 0) > 100) break;
   i12 = i12 + 1 | 0;
   i4 = HEAP32[i16 >> 2] | 0;
   i5 = HEAP32[(HEAP32[i15 >> 2] | 0) + (i4 >>> 9 << 2) >> 2] | 0;
   i6 = i4 & 511;
   i7 = HEAP32[i5 + (i6 << 3) >> 2] | 0;
   i8 = HEAP32[i7 + 148 >> 2] | 0;
   if ((i8 | 0) != 0 ? (HEAP32[i8 >> 2] | 0) == (i13 | 0) : 0) {
    HEAP8[i8 + 8 >> 0] = 1;
    i3 = HEAP32[i7 + 112 >> 2] | 0;
    if (i3) {
     i10 = (HEAP32[i5 + (i6 << 3) + 4 >> 2] | 0) + 1 | 0;
     i11 = i7 + 12 | 0;
     i9 = i7 + 16 | 0;
     i8 = i8 + 12 | 0;
     i7 = i3;
     do {
      i3 = HEAP32[i7 >> 2] | 0;
      i6 = i3;
      i4 = HEAP32[i3 + 148 >> 2] | 0;
      i5 = i4 + 9 | 0;
      if ((HEAP8[i5 >> 0] | 0) == 0 ? (d1 = +HEAPF32[i11 >> 2] - +HEAPF32[i3 + 12 >> 2], d2 = +HEAPF32[i9 >> 2] - +HEAPF32[i3 + 16 >> 2], d2 = +Math_sqrt(+(d1 * d1 + d2 * d2)), !(d2 > +HEAPF32[i4 + 12 >> 2] + +HEAPF32[i8 >> 2] + .01)) : 0) {
       HEAP8[i5 >> 0] = 1;
       i22 = HEAP32[i14 >> 2] | 0;
       i4 = HEAP32[i15 >> 2] | 0;
       i5 = HEAP32[i16 >> 2] | 0;
       i3 = HEAP32[i17 >> 2] | 0;
       if ((((i22 | 0) == (i4 | 0) ? 0 : (i22 - i4 << 7) + -1 | 0) | 0) == (i3 + i5 | 0)) {
        __ZNSt3__15dequeINS_4pairIP6b2BodyiEENS_9allocatorIS4_EEE19__add_back_capacityEv(i19);
        i3 = HEAP32[i17 >> 2] | 0;
        i5 = HEAP32[i16 >> 2] | 0;
        i4 = HEAP32[i15 >> 2] | 0;
       }
       i22 = i3 + i5 | 0;
       i22 = (HEAP32[i4 + (i22 >>> 9 << 2) >> 2] | 0) + ((i22 & 511) << 3) | 0;
       HEAP32[i22 >> 2] = i6;
       HEAP32[i22 + 4 >> 2] = i10;
       HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 1;
      }
      i7 = HEAP32[i7 + 12 >> 2] | 0;
     } while ((i7 | 0) != 0);
    }
    i3 = HEAP32[i17 >> 2] | 0;
    i4 = HEAP32[i16 >> 2] | 0;
   }
   i3 = i3 + -1 | 0;
   HEAP32[i17 >> 2] = i3;
   i22 = i4 + 1 | 0;
   HEAP32[i16 >> 2] = i22;
   if (i22 >>> 0 > 1023) {
    __ZdlPv(HEAP32[HEAP32[i15 >> 2] >> 2] | 0);
    HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 4;
    HEAP32[i16 >> 2] = (HEAP32[i16 >> 2] | 0) + -512;
    i3 = HEAP32[i17 >> 2] | 0;
   }
   if (!i3) break L12;
  }
  _printf(3062, i20) | 0;
 } while (0);
 __ZNSt3__15queueINS_4pairIP6b2BodyiEENS_5dequeIS4_NS_9allocatorIS4_EEEEED2Ev(i19);
 i20 = HEAP32[i18 >> 2] | 0;
 i19 = HEAP32[180] | 0;
 i17 = i20;
 i22 = i19 + 36 | 0;
 i18 = HEAP32[i22 >> 2] | 0;
 i18 = (i17 | 0) != (i18 | 0);
 i19 = i19 + 56 | 0;
 i18 = i18 & 1;
 HEAP8[i19 >> 0] = i18;
 HEAP32[i22 >> 2] = i20;
 STACKTOP = i21;
 return;
}

function __ZN9BlastAnimC2EP6b2Bodyi(i13, i11, i12) {
 i13 = i13 | 0;
 i11 = i11 | 0;
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i14 = 0, d15 = 0.0, d16 = 0.0, i17 = 0, i18 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 112 | 0;
 i1 = i14 + 96 | 0;
 i2 = i14 + 84 | 0;
 i4 = i14 + 72 | 0;
 i5 = i14 + 60 | 0;
 i6 = i14 + 48 | 0;
 i7 = i14 + 36 | 0;
 i8 = i14 + 24 | 0;
 i9 = i14 + 12 | 0;
 i10 = i14;
 HEAP32[i13 >> 2] = 788;
 HEAP32[i13 + 4 >> 2] = i11;
 i3 = i13 + 20 | 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i13 + 32 >> 2] = i12 << 1;
 i18 = i11 + 12 | 0;
 i17 = HEAP32[i18 + 4 >> 2] | 0;
 i12 = i13 + 8 | 0;
 HEAP32[i12 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i12 + 4 >> 2] = i17;
 i12 = HEAP32[i11 + 148 >> 2] | 0;
 HEAP32[i13 + 16 >> 2] = HEAP32[i12 + 12 >> 2];
 i12 = HEAP32[i12 >> 2] | 0;
 d16 = +HEAPF32[i12 + 16 >> 2];
 d15 = +HEAPF32[i12 + 20 >> 2];
 __ZNSt3__19to_stringEi(i8, ~~+HEAPF32[i12 + 12 >> 2]);
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKc(i8, 0, 3067) | 0;
 HEAP32[i7 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i7 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i7 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKc(i7, 3073) | 0;
 HEAP32[i6 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i6 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i6 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 __ZNSt3__19to_stringEi(i9, ~~d16);
 i12 = HEAP8[i9 >> 0] | 0;
 i11 = (i12 & 1) == 0;
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(i6, i11 ? i9 + 1 | 0 : HEAP32[i9 + 8 >> 2] | 0, i11 ? (i12 & 255) >>> 1 : HEAP32[i9 + 4 >> 2] | 0) | 0;
 HEAP32[i5 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i5 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i5 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKc(i5, 3073) | 0;
 HEAP32[i4 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i4 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i4 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 __ZNSt3__19to_stringEi(i10, ~~d15);
 i12 = HEAP8[i10 >> 0] | 0;
 i11 = (i12 & 1) == 0;
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(i4, i11 ? i10 + 1 | 0 : HEAP32[i10 + 8 >> 2] | 0, i11 ? (i12 & 255) >>> 1 : HEAP32[i10 + 4 >> 2] | 0) | 0;
 HEAP32[i2 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i2 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i2 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 i12 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKc(i2, 3073) | 0;
 HEAP32[i1 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i1 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i1 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 if (!(HEAP8[i3 >> 0] & 1)) {
  HEAP8[i3 + 1 >> 0] = 0;
  HEAP8[i3 >> 0] = 0;
 } else {
  HEAP8[HEAP32[i13 + 28 >> 2] >> 0] = 0;
  HEAP32[i13 + 24 >> 2] = 0;
 }
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEj(i3, 0);
 HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i3 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
 HEAP32[i3 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i2);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i10);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i4);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i5);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i9);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i7);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i8);
 STACKTOP = i14;
 return;
}

function ___udivmoddi4(i5, i6, i8, i11, i13) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i11 = i11 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0, i9 = 0, i10 = 0, i12 = 0, i14 = 0, i15 = 0;
 i9 = i5;
 i4 = i6;
 i7 = i4;
 i2 = i8;
 i12 = i11;
 i3 = i12;
 if (!i7) {
  i1 = (i13 | 0) != 0;
  if (!i3) {
   if (i1) {
    HEAP32[i13 >> 2] = (i9 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i12 = 0;
   i13 = (i9 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i12, i13) | 0;
  } else {
   if (!i1) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
 }
 i1 = (i3 | 0) == 0;
 do if (i2) {
  if (!i1) {
   i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
   if (i1 >>> 0 <= 31) {
    i10 = i1 + 1 | 0;
    i3 = 31 - i1 | 0;
    i6 = i1 - 31 >> 31;
    i2 = i10;
    i5 = i9 >>> (i10 >>> 0) & i6 | i7 << i3;
    i6 = i7 >>> (i10 >>> 0) & i6;
    i1 = 0;
    i3 = i9 << i3;
    break;
   }
   if (!i13) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
  i1 = i2 - 1 | 0;
  if (i1 & i2) {
   i3 = (Math_clz32(i2 | 0) | 0) + 33 - (Math_clz32(i7 | 0) | 0) | 0;
   i15 = 64 - i3 | 0;
   i10 = 32 - i3 | 0;
   i4 = i10 >> 31;
   i14 = i3 - 32 | 0;
   i6 = i14 >> 31;
   i2 = i3;
   i5 = i10 - 1 >> 31 & i7 >>> (i14 >>> 0) | (i7 << i10 | i9 >>> (i3 >>> 0)) & i6;
   i6 = i6 & i7 >>> (i3 >>> 0);
   i1 = i9 << i15 & i4;
   i3 = (i7 << i15 | i9 >>> (i14 >>> 0)) & i4 | i9 << i10 & i3 - 33 >> 31;
   break;
  }
  if (i13) {
   HEAP32[i13 >> 2] = i1 & i9;
   HEAP32[i13 + 4 >> 2] = 0;
  }
  if ((i2 | 0) == 1) {
   i14 = i4 | i6 & 0;
   i15 = i5 | 0 | 0;
   return (tempRet0 = i14, i15) | 0;
  } else {
   i15 = _llvm_cttz_i32(i2 | 0) | 0;
   i14 = i7 >>> (i15 >>> 0) | 0;
   i15 = i7 << 32 - i15 | i9 >>> (i15 >>> 0) | 0;
   return (tempRet0 = i14, i15) | 0;
  }
 } else {
  if (i1) {
   if (i13) {
    HEAP32[i13 >> 2] = (i7 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  if (!i9) {
   if (i13) {
    HEAP32[i13 >> 2] = 0;
    HEAP32[i13 + 4 >> 2] = (i7 >>> 0) % (i3 >>> 0);
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i3 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = i3 - 1 | 0;
  if (!(i1 & i3)) {
   if (i13) {
    HEAP32[i13 >> 2] = i5 | 0;
    HEAP32[i13 + 4 >> 2] = i1 & i7 | i6 & 0;
   }
   i14 = 0;
   i15 = i7 >>> ((_llvm_cttz_i32(i3 | 0) | 0) >>> 0);
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
  if (i1 >>> 0 <= 30) {
   i6 = i1 + 1 | 0;
   i3 = 31 - i1 | 0;
   i2 = i6;
   i5 = i7 << i3 | i9 >>> (i6 >>> 0);
   i6 = i7 >>> (i6 >>> 0);
   i1 = 0;
   i3 = i9 << i3;
   break;
  }
  if (!i13) {
   i14 = 0;
   i15 = 0;
   return (tempRet0 = i14, i15) | 0;
  }
  HEAP32[i13 >> 2] = i5 | 0;
  HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
  i14 = 0;
  i15 = 0;
  return (tempRet0 = i14, i15) | 0;
 } while (0);
 if (!i2) {
  i7 = i3;
  i4 = 0;
  i3 = 0;
 } else {
  i10 = i8 | 0 | 0;
  i9 = i12 | i11 & 0;
  i7 = _i64Add(i10 | 0, i9 | 0, -1, -1) | 0;
  i8 = tempRet0;
  i4 = i3;
  i3 = 0;
  do {
   i11 = i4;
   i4 = i1 >>> 31 | i4 << 1;
   i1 = i3 | i1 << 1;
   i11 = i5 << 1 | i11 >>> 31 | 0;
   i12 = i5 >>> 31 | i6 << 1 | 0;
   _i64Subtract(i7, i8, i11, i12) | 0;
   i15 = tempRet0;
   i14 = i15 >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1;
   i3 = i14 & 1;
   i5 = _i64Subtract(i11, i12, i14 & i10, (((i15 | 0) < 0 ? -1 : 0) >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1) & i9) | 0;
   i6 = tempRet0;
   i2 = i2 - 1 | 0;
  } while ((i2 | 0) != 0);
  i7 = i4;
  i4 = 0;
 }
 i2 = 0;
 if (i13) {
  HEAP32[i13 >> 2] = i5;
  HEAP32[i13 + 4 >> 2] = i6;
 }
 i14 = (i1 | 0) >>> 31 | (i7 | i2) << 1 | (i2 << 1 | i1 >>> 31) & 0 | i4;
 i15 = (i1 << 1 | 0 >>> 31) & -2 | i3;
 return (tempRet0 = i14, i15) | 0;
}

function __ZN9b2Simplex9ReadCacheEPK14b2SimplexCachePK15b2DistanceProxyRK11b2TransformS5_S8_(i22, i16, i19, i23, i21, i24) {
 i22 = i22 | 0;
 i16 = i16 | 0;
 i19 = i19 | 0;
 i23 = i23 | 0;
 i21 = i21 | 0;
 i24 = i24 | 0;
 var i1 = 0, d2 = 0.0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d17 = 0.0, i18 = 0, i20 = 0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0;
 i1 = HEAP16[i16 + 4 >> 1] | 0;
 if ((i1 & 65535) >= 4) ___assert_fail(8155, 4855, 102, 8173);
 i3 = i1 & 65535;
 i20 = i22 + 108 | 0;
 HEAP32[i20 >> 2] = i3;
 L4 : do if (i1 << 16 >> 16) {
  i11 = i19 + 20 | 0;
  i12 = i19 + 16 | 0;
  i13 = i21 + 20 | 0;
  i14 = i21 + 16 | 0;
  i5 = i23 + 12 | 0;
  i6 = i23 + 8 | 0;
  i7 = i23 + 4 | 0;
  i8 = i24 + 12 | 0;
  i9 = i24 + 8 | 0;
  i10 = i24 + 4 | 0;
  i15 = 0;
  while (1) {
   i1 = HEAPU8[i16 + 6 + i15 >> 0] | 0;
   HEAP32[i22 + (i15 * 36 | 0) + 28 >> 2] = i1;
   i3 = HEAPU8[i16 + 9 + i15 >> 0] | 0;
   HEAP32[i22 + (i15 * 36 | 0) + 32 >> 2] = i3;
   if ((HEAP32[i11 >> 2] | 0) <= (i1 | 0)) {
    i1 = 6;
    break;
   }
   i4 = HEAP32[i12 >> 2] | 0;
   if ((HEAP32[i13 >> 2] | 0) <= (i3 | 0)) {
    i1 = 8;
    break;
   }
   d27 = +HEAPF32[i4 + (i1 << 3) + 4 >> 2];
   d29 = +HEAPF32[i4 + (i1 << 3) >> 2];
   i1 = HEAP32[i14 >> 2] | 0;
   d28 = +HEAPF32[i1 + (i3 << 3) >> 2];
   d30 = +HEAPF32[i1 + (i3 << 3) + 4 >> 2];
   d25 = +HEAPF32[i5 >> 2];
   d2 = +HEAPF32[i6 >> 2];
   d26 = +HEAPF32[i23 >> 2] + (d29 * d25 - d27 * d2);
   d2 = d27 * d25 + d29 * d2 + +HEAPF32[i7 >> 2];
   HEAPF32[i22 + (i15 * 36 | 0) >> 2] = d26;
   HEAPF32[i22 + (i15 * 36 | 0) + 4 >> 2] = d2;
   d29 = +HEAPF32[i8 >> 2];
   d25 = +HEAPF32[i9 >> 2];
   d27 = +HEAPF32[i24 >> 2] + (d28 * d29 - d30 * d25);
   d25 = d30 * d29 + d28 * d25 + +HEAPF32[i10 >> 2];
   HEAPF32[i22 + (i15 * 36 | 0) + 8 >> 2] = d27;
   HEAPF32[i22 + (i15 * 36 | 0) + 12 >> 2] = d25;
   HEAPF32[i22 + (i15 * 36 | 0) + 16 >> 2] = d27 - d26;
   HEAPF32[i22 + (i15 * 36 | 0) + 20 >> 2] = d25 - d2;
   HEAPF32[i22 + (i15 * 36 | 0) + 24 >> 2] = 0.0;
   i15 = i15 + 1 | 0;
   i1 = HEAP32[i20 >> 2] | 0;
   if ((i15 | 0) >= (i1 | 0)) {
    i18 = i1;
    break L4;
   }
  }
  if ((i1 | 0) == 6) ___assert_fail(4937, 4967, 103, 5018); else if ((i1 | 0) == 8) ___assert_fail(4937, 4967, 103, 5018);
 } else i18 = i3; while (0);
 if ((i18 | 0) <= 1) {
  if (i18) return;
 } else {
  d2 = +HEAPF32[i16 >> 2];
  switch (i18 | 0) {
  case 2:
   {
    d30 = +HEAPF32[i22 + 16 >> 2] - +HEAPF32[i22 + 52 >> 2];
    d17 = +HEAPF32[i22 + 20 >> 2] - +HEAPF32[i22 + 56 >> 2];
    d17 = +Math_sqrt(+(d30 * d30 + d17 * d17));
    break;
   }
  case 3:
   {
    d17 = +HEAPF32[i22 + 16 >> 2];
    d30 = +HEAPF32[i22 + 20 >> 2];
    d17 = (+HEAPF32[i22 + 52 >> 2] - d17) * (+HEAPF32[i22 + 92 >> 2] - d30) - (+HEAPF32[i22 + 56 >> 2] - d30) * (+HEAPF32[i22 + 88 >> 2] - d17);
    break;
   }
  default:
   ___assert_fail(4304, 4855, 260, 5045);
  }
  if (!(d17 < d2 * .5) ? !(d2 * 2.0 < d17 | d17 < 1.1920928955078125e-007) : 0) return;
  HEAP32[i20 >> 2] = 0;
 }
 HEAP32[i22 + 28 >> 2] = 0;
 HEAP32[i22 + 32 >> 2] = 0;
 if ((HEAP32[i19 + 20 >> 2] | 0) <= 0) ___assert_fail(4937, 4967, 103, 5018);
 i1 = HEAP32[i19 + 16 >> 2] | 0;
 if ((HEAP32[i21 + 20 >> 2] | 0) <= 0) ___assert_fail(4937, 4967, 103, 5018);
 d27 = +HEAPF32[i1 + 4 >> 2];
 d25 = +HEAPF32[i1 >> 2];
 i21 = HEAP32[i21 + 16 >> 2] | 0;
 d26 = +HEAPF32[i21 >> 2];
 d17 = +HEAPF32[i21 + 4 >> 2];
 d29 = +HEAPF32[i23 + 12 >> 2];
 d30 = +HEAPF32[i23 + 8 >> 2];
 d28 = +HEAPF32[i23 >> 2] + (d25 * d29 - d27 * d30);
 d30 = d27 * d29 + d25 * d30 + +HEAPF32[i23 + 4 >> 2];
 HEAPF32[i22 >> 2] = d28;
 HEAPF32[i22 + 4 >> 2] = d30;
 d25 = +HEAPF32[i24 + 12 >> 2];
 d29 = +HEAPF32[i24 + 8 >> 2];
 d27 = +HEAPF32[i24 >> 2] + (d26 * d25 - d17 * d29);
 d29 = d17 * d25 + d26 * d29 + +HEAPF32[i24 + 4 >> 2];
 HEAPF32[i22 + 8 >> 2] = d27;
 HEAPF32[i22 + 12 >> 2] = d29;
 HEAPF32[i22 + 16 >> 2] = d27 - d28;
 HEAPF32[i22 + 20 >> 2] = d29 - d30;
 HEAPF32[i22 + 24 >> 2] = 1.0;
 HEAP32[i20 >> 2] = 1;
 return;
}

function __ZN6b2Body13ResetMassDataEv(i21) {
 i21 = i21 | 0;
 var d1 = 0.0, d2 = 0.0, i3 = 0, d4 = 0.0, d5 = 0.0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, d14 = 0.0, d15 = 0.0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, d20 = 0.0, i22 = 0, i23 = 0, i24 = 0;
 i23 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i11 = i23;
 i12 = i21 + 116 | 0;
 i13 = i21 + 120 | 0;
 i16 = i21 + 124 | 0;
 i17 = i21 + 128 | 0;
 i18 = i21 + 28 | 0;
 HEAPF32[i18 >> 2] = 0.0;
 i19 = i21 + 32 | 0;
 HEAPF32[i19 >> 2] = 0.0;
 HEAP32[i12 >> 2] = 0;
 HEAP32[i12 + 4 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 HEAP32[i12 + 12 >> 2] = 0;
 switch (HEAP32[i21 >> 2] | 0) {
 case 1:
 case 0:
  {
   i19 = i21 + 12 | 0;
   i18 = HEAP32[i19 >> 2] | 0;
   i19 = HEAP32[i19 + 4 >> 2] | 0;
   i22 = i21 + 36 | 0;
   HEAP32[i22 >> 2] = i18;
   HEAP32[i22 + 4 >> 2] = i19;
   i22 = i21 + 44 | 0;
   HEAP32[i22 >> 2] = i18;
   HEAP32[i22 + 4 >> 2] = i19;
   HEAP32[i21 + 52 >> 2] = HEAP32[i21 + 56 >> 2];
   STACKTOP = i23;
   return;
  }
 case 2:
  {
   i7 = HEAP32[i21 + 100 >> 2] | 0;
   if (i7) {
    i8 = i11 + 4 | 0;
    i9 = i11 + 8 | 0;
    i10 = i11 + 12 | 0;
    d1 = 0.0;
    d2 = 0.0;
    i3 = 0;
    i6 = 0;
    do {
     d4 = +HEAPF32[i7 >> 2];
     if (!(d4 == 0.0)) {
      i24 = HEAP32[i7 + 12 >> 2] | 0;
      FUNCTION_TABLE_viid[HEAP32[(HEAP32[i24 >> 2] | 0) + 28 >> 2] & 3](i24, i11, d4);
      d1 = +HEAPF32[i11 >> 2];
      d2 = d1 + +HEAPF32[i12 >> 2];
      HEAPF32[i12 >> 2] = d2;
      i3 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]) + d1 * +HEAPF32[i8 >> 2], HEAP32[tempDoublePtr >> 2] | 0);
      i6 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]) + d1 * +HEAPF32[i9 >> 2], HEAP32[tempDoublePtr >> 2] | 0);
      d1 = +HEAPF32[i10 >> 2] + +HEAPF32[i16 >> 2];
      HEAPF32[i16 >> 2] = d1;
     }
     i7 = HEAP32[i7 + 4 >> 2] | 0;
    } while ((i7 | 0) != 0);
    if (d2 > 0.0) {
     d5 = 1.0 / d2;
     HEAPF32[i13 >> 2] = d5;
     i3 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]) * d5, HEAP32[tempDoublePtr >> 2] | 0);
     i6 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]) * d5, HEAP32[tempDoublePtr >> 2] | 0);
    } else i22 = 11;
   } else {
    i6 = 0;
    i3 = 0;
    d1 = 0.0;
    i22 = 11;
   }
   if ((i22 | 0) == 11) {
    HEAPF32[i12 >> 2] = 1.0;
    HEAPF32[i13 >> 2] = 1.0;
    d2 = 1.0;
   }
   do if (d1 > 0.0 ? (HEAP16[i21 + 4 >> 1] & 16) == 0 : 0) {
    d4 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
    d5 = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]);
    d1 = d1 - (d5 * d5 + d4 * d4) * d2;
    HEAPF32[i16 >> 2] = d1;
    if (d1 > 0.0) {
     d14 = d5;
     d15 = d4;
     d20 = 1.0 / d1;
     break;
    } else ___assert_fail(6025, 5701, 365, 6011);
   } else i22 = 17; while (0);
   if ((i22 | 0) == 17) {
    HEAPF32[i16 >> 2] = 0.0;
    d15 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
    d14 = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]);
    d20 = 0.0;
   }
   HEAPF32[i17 >> 2] = d20;
   i22 = i21 + 44 | 0;
   d20 = +HEAPF32[i22 >> 2];
   i24 = i21 + 48 | 0;
   d4 = +HEAPF32[i24 >> 2];
   HEAP32[i18 >> 2] = i3;
   HEAP32[i19 >> 2] = i6;
   d2 = +HEAPF32[i21 + 24 >> 2];
   d1 = +HEAPF32[i21 + 20 >> 2];
   d5 = +HEAPF32[i21 + 12 >> 2] + (d2 * d15 - d1 * d14);
   d14 = d15 * d1 + d2 * d14 + +HEAPF32[i21 + 16 >> 2];
   HEAPF32[i22 >> 2] = d5;
   HEAPF32[i24 >> 2] = d14;
   HEAPF32[i21 + 36 >> 2] = d5;
   HEAPF32[i21 + 40 >> 2] = d14;
   d15 = +HEAPF32[i21 + 72 >> 2];
   i24 = i21 + 64 | 0;
   HEAPF32[i24 >> 2] = +HEAPF32[i24 >> 2] - d15 * (d14 - d4);
   i24 = i21 + 68 | 0;
   HEAPF32[i24 >> 2] = d15 * (d5 - d20) + +HEAPF32[i24 >> 2];
   STACKTOP = i23;
   return;
  }
 default:
  ___assert_fail(5986, 5701, 330, 6011);
 }
}

function __Z13b2TestOverlapPK7b2ShapeiS1_iRK11b2TransformS4_(i8, i1, i16, i9, i17, i18) {
 i8 = i8 | 0;
 i1 = i1 | 0;
 i16 = i16 | 0;
 i9 = i9 | 0;
 i17 = i17 | 0;
 i18 = i18 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i19 = 0, i20 = 0, i21 = 0;
 i19 = STACKTOP;
 STACKTOP = STACKTOP + 144 | 0;
 i14 = i19;
 i13 = i19 + 120 | 0;
 i15 = i19 + 96 | 0;
 i3 = i14 + 16 | 0;
 HEAP32[i3 >> 2] = 0;
 i4 = i14 + 20 | 0;
 HEAP32[i4 >> 2] = 0;
 i6 = i14 + 24 | 0;
 HEAPF32[i6 >> 2] = 0.0;
 i10 = i14 + 44 | 0;
 HEAP32[i10 >> 2] = 0;
 i11 = i14 + 48 | 0;
 HEAP32[i11 >> 2] = 0;
 i12 = i14 + 52 | 0;
 HEAPF32[i12 >> 2] = 0.0;
 switch (HEAP32[i8 + 4 >> 2] | 0) {
 case 0:
  {
   HEAP32[i3 >> 2] = i8 + 12;
   HEAP32[i4 >> 2] = 1;
   HEAP32[i6 >> 2] = HEAP32[i8 + 8 >> 2];
   break;
  }
 case 2:
  {
   HEAP32[i3 >> 2] = i8 + 20;
   HEAP32[i4 >> 2] = HEAP32[i8 + 148 >> 2];
   HEAP32[i6 >> 2] = HEAP32[i8 + 8 >> 2];
   break;
  }
 case 3:
  {
   if ((i1 | 0) <= -1) ___assert_fail(4818, 4855, 53, 4300);
   i5 = HEAP32[i8 + 16 >> 2] | 0;
   if ((i5 | 0) <= (i1 | 0)) ___assert_fail(4818, 4855, 53, 4300);
   i7 = HEAP32[i8 + 12 >> 2] | 0;
   i21 = i7 + (i1 << 3) | 0;
   i20 = HEAP32[i21 + 4 >> 2] | 0;
   i2 = i14;
   HEAP32[i2 >> 2] = HEAP32[i21 >> 2];
   HEAP32[i2 + 4 >> 2] = i20;
   i1 = i1 + 1 | 0;
   i2 = i14 + 8 | 0;
   if ((i1 | 0) < (i5 | 0)) {
    i7 = i7 + (i1 << 3) | 0;
    i20 = HEAP32[i7 + 4 >> 2] | 0;
    i21 = i2;
    HEAP32[i21 >> 2] = HEAP32[i7 >> 2];
    HEAP32[i21 + 4 >> 2] = i20;
   } else {
    i20 = HEAP32[i7 + 4 >> 2] | 0;
    i21 = i2;
    HEAP32[i21 >> 2] = HEAP32[i7 >> 2];
    HEAP32[i21 + 4 >> 2] = i20;
   }
   HEAP32[i3 >> 2] = i14;
   HEAP32[i4 >> 2] = 2;
   HEAP32[i6 >> 2] = HEAP32[i8 + 8 >> 2];
   break;
  }
 case 1:
  {
   HEAP32[i3 >> 2] = i8 + 12;
   HEAP32[i4 >> 2] = 2;
   HEAP32[i6 >> 2] = HEAP32[i8 + 8 >> 2];
   break;
  }
 default:
  ___assert_fail(4304, 4855, 81, 4300);
 }
 i3 = i14 + 28 | 0;
 switch (HEAP32[i16 + 4 >> 2] | 0) {
 case 0:
  {
   HEAP32[i10 >> 2] = i16 + 12;
   HEAP32[i11 >> 2] = 1;
   HEAP32[i12 >> 2] = HEAP32[i16 + 8 >> 2];
   break;
  }
 case 2:
  {
   HEAP32[i10 >> 2] = i16 + 20;
   HEAP32[i11 >> 2] = HEAP32[i16 + 148 >> 2];
   HEAP32[i12 >> 2] = HEAP32[i16 + 8 >> 2];
   break;
  }
 case 3:
  {
   if ((i9 | 0) <= -1) ___assert_fail(4818, 4855, 53, 4300);
   i4 = HEAP32[i16 + 16 >> 2] | 0;
   if ((i4 | 0) <= (i9 | 0)) ___assert_fail(4818, 4855, 53, 4300);
   i5 = HEAP32[i16 + 12 >> 2] | 0;
   i21 = i5 + (i9 << 3) | 0;
   i2 = HEAP32[i21 + 4 >> 2] | 0;
   i1 = i3;
   HEAP32[i1 >> 2] = HEAP32[i21 >> 2];
   HEAP32[i1 + 4 >> 2] = i2;
   i1 = i9 + 1 | 0;
   i2 = i14 + 36 | 0;
   if ((i1 | 0) < (i4 | 0)) {
    i9 = i5 + (i1 << 3) | 0;
    i20 = HEAP32[i9 + 4 >> 2] | 0;
    i21 = i2;
    HEAP32[i21 >> 2] = HEAP32[i9 >> 2];
    HEAP32[i21 + 4 >> 2] = i20;
   } else {
    i9 = i5;
    i20 = HEAP32[i9 + 4 >> 2] | 0;
    i21 = i2;
    HEAP32[i21 >> 2] = HEAP32[i9 >> 2];
    HEAP32[i21 + 4 >> 2] = i20;
   }
   HEAP32[i10 >> 2] = i3;
   HEAP32[i11 >> 2] = 2;
   HEAP32[i12 >> 2] = HEAP32[i16 + 8 >> 2];
   break;
  }
 case 1:
  {
   HEAP32[i10 >> 2] = i16 + 12;
   HEAP32[i11 >> 2] = 2;
   HEAP32[i12 >> 2] = HEAP32[i16 + 8 >> 2];
   break;
  }
 default:
  ___assert_fail(4304, 4855, 81, 4300);
 }
 i21 = i14 + 56 | 0;
 HEAP32[i21 >> 2] = HEAP32[i17 >> 2];
 HEAP32[i21 + 4 >> 2] = HEAP32[i17 + 4 >> 2];
 HEAP32[i21 + 8 >> 2] = HEAP32[i17 + 8 >> 2];
 HEAP32[i21 + 12 >> 2] = HEAP32[i17 + 12 >> 2];
 i21 = i14 + 72 | 0;
 HEAP32[i21 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i21 + 4 >> 2] = HEAP32[i18 + 4 >> 2];
 HEAP32[i21 + 8 >> 2] = HEAP32[i18 + 8 >> 2];
 HEAP32[i21 + 12 >> 2] = HEAP32[i18 + 12 >> 2];
 HEAP8[i14 + 88 >> 0] = 1;
 HEAP16[i13 + 4 >> 1] = 0;
 __Z10b2DistanceP16b2DistanceOutputP14b2SimplexCachePK15b2DistanceInput(i15, i13, i14);
 STACKTOP = i19;
 return +HEAPF32[i15 + 16 >> 2] < 1.1920928955078125e-006 | 0;
}

function __ZN8b2IslandD2Ev(i7) {
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i4 = HEAP32[i7 >> 2] | 0;
 i2 = HEAP32[i7 + 20 >> 2] | 0;
 i5 = i4 + 102796 | 0;
 i3 = HEAP32[i5 >> 2] | 0;
 if ((i3 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i3 + -1 | 0;
 if ((HEAP32[i4 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i4 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i4 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = i4 + 102400 | 0;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
  i1 = i3;
  i6 = i4;
 } else {
  _free(i2);
  i2 = i4 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i5 >> 2] | 0;
  i6 = HEAP32[i7 >> 2] | 0;
 }
 i4 = i4 + 102404 | 0;
 HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i5 >> 2] = i1 + -1;
 i2 = HEAP32[i7 + 24 >> 2] | 0;
 i4 = i6 + 102796 | 0;
 i3 = HEAP32[i4 >> 2] | 0;
 if ((i3 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i3 + -1 | 0;
 if ((HEAP32[i6 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i6 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = i6 + 102400 | 0;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
  i1 = i3;
  i5 = i6;
 } else {
  _free(i2);
  i2 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
  i5 = HEAP32[i7 >> 2] | 0;
 }
 i3 = i6 + 102404 | 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i4 >> 2] = i1 + -1;
 i2 = HEAP32[i7 + 16 >> 2] | 0;
 i4 = i5 + 102796 | 0;
 i3 = HEAP32[i4 >> 2] | 0;
 if ((i3 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i3 + -1 | 0;
 if ((HEAP32[i5 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i5 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = i5 + 102400 | 0;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
  i1 = i3;
  i6 = i5;
 } else {
  _free(i2);
  i2 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
  i6 = HEAP32[i7 >> 2] | 0;
 }
 i3 = i5 + 102404 | 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i4 >> 2] = i1 + -1;
 i2 = HEAP32[i7 + 12 >> 2] | 0;
 i4 = i6 + 102796 | 0;
 i3 = HEAP32[i4 >> 2] | 0;
 if ((i3 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i3 + -1 | 0;
 if ((HEAP32[i6 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i6 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = i6 + 102400 | 0;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
  i1 = i3;
  i5 = i6;
 } else {
  _free(i2);
  i2 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
  i5 = HEAP32[i7 >> 2] | 0;
 }
 i3 = i6 + 102404 | 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i4 >> 2] = i1 + -1;
 i2 = HEAP32[i7 + 8 >> 2] | 0;
 i3 = i5 + 102796 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 if ((i4 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i4 + -1 | 0;
 if ((HEAP32[i5 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i5 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i6 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i7 = i5 + 102400 | 0;
  HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) - (HEAP32[i6 >> 2] | 0);
  i7 = i4;
  i4 = HEAP32[i6 >> 2] | 0;
  i6 = i5 + 102404 | 0;
  i5 = HEAP32[i6 >> 2] | 0;
  i5 = i5 - i4 | 0;
  HEAP32[i6 >> 2] = i5;
  i7 = i7 + -1 | 0;
  HEAP32[i3 >> 2] = i7;
  return;
 } else {
  _free(i2);
  i4 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i7 = HEAP32[i3 >> 2] | 0;
  i4 = HEAP32[i4 >> 2] | 0;
  i6 = i5 + 102404 | 0;
  i5 = HEAP32[i6 >> 2] | 0;
  i5 = i5 - i4 | 0;
  HEAP32[i6 >> 2] = i5;
  i7 = i7 + -1 | 0;
  HEAP32[i3 >> 2] = i7;
  return;
 }
}

function __Z22b2CollideEdgeAndCircleP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK13b2CircleShapeS6_(i23, i18, i2, i12, i3) {
 i23 = i23 | 0;
 i18 = i18 | 0;
 i2 = i2 | 0;
 i12 = i12 | 0;
 i3 = i3 | 0;
 var d1 = 0.0, d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
 i21 = i23 + 60 | 0;
 HEAP32[i21 >> 2] = 0;
 i22 = i12 + 12 | 0;
 d6 = +HEAPF32[i3 + 12 >> 2];
 d4 = +HEAPF32[i22 >> 2];
 d13 = +HEAPF32[i3 + 8 >> 2];
 d5 = +HEAPF32[i12 + 16 >> 2];
 d16 = +HEAPF32[i3 >> 2] + (d6 * d4 - d13 * d5) - +HEAPF32[i2 >> 2];
 d5 = d4 * d13 + d6 * d5 + +HEAPF32[i3 + 4 >> 2] - +HEAPF32[i2 + 4 >> 2];
 d6 = +HEAPF32[i2 + 12 >> 2];
 d13 = +HEAPF32[i2 + 8 >> 2];
 d4 = d16 * d6 + d5 * d13;
 d13 = d6 * d5 - d16 * d13;
 i19 = HEAP32[i18 + 12 >> 2] | 0;
 i20 = HEAP32[i18 + 16 >> 2] | 0;
 i2 = HEAP32[i18 + 20 >> 2] | 0;
 i3 = HEAP32[i18 + 24 >> 2] | 0;
 d16 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
 d5 = (HEAP32[tempDoublePtr >> 2] = i19, +HEAPF32[tempDoublePtr >> 2]);
 d6 = d16 - d5;
 d17 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
 d7 = (HEAP32[tempDoublePtr >> 2] = i20, +HEAPF32[tempDoublePtr >> 2]);
 d14 = d17 - d7;
 d8 = d6 * (d16 - d4) + d14 * (d17 - d13);
 d9 = d4 - d5;
 d10 = d13 - d7;
 d11 = d9 * d6 + d10 * d14;
 d15 = +HEAPF32[i18 + 8 >> 2] + +HEAPF32[i12 + 8 >> 2];
 if (d11 <= 0.0) {
  if (d9 * d9 + d10 * d10 > d15 * d15) return;
  if ((HEAP8[i18 + 44 >> 0] | 0) != 0 ? (d5 - d4) * (d5 - +HEAPF32[i18 + 28 >> 2]) + (d7 - d13) * (d7 - +HEAPF32[i18 + 32 >> 2]) > 0.0 : 0) return;
  HEAP32[i21 >> 2] = 1;
  HEAP32[i23 + 56 >> 2] = 0;
  HEAPF32[i23 + 40 >> 2] = 0.0;
  HEAPF32[i23 + 44 >> 2] = 0.0;
  HEAP32[i23 + 48 >> 2] = i19;
  HEAP32[i23 + 52 >> 2] = i20;
  i21 = i23 + 16 | 0;
  HEAP32[i21 >> 2] = 0;
  HEAP8[i21 >> 0] = 0;
  HEAP8[i21 + 1 >> 0] = 0;
  HEAP8[i21 + 2 >> 0] = 0;
  HEAP8[i21 + 3 >> 0] = 0;
  i21 = i22;
  i22 = HEAP32[i21 + 4 >> 2] | 0;
  HEAP32[i23 >> 2] = HEAP32[i21 >> 2];
  HEAP32[i23 + 4 >> 2] = i22;
  return;
 }
 if (d8 <= 0.0) {
  d4 = d4 - d16;
  d1 = d13 - d17;
  if (d4 * d4 + d1 * d1 > d15 * d15) return;
  if ((HEAP8[i18 + 45 >> 0] | 0) != 0 ? d4 * (+HEAPF32[i18 + 36 >> 2] - d16) + d1 * (+HEAPF32[i18 + 40 >> 2] - d17) > 0.0 : 0) return;
  HEAP32[i21 >> 2] = 1;
  HEAP32[i23 + 56 >> 2] = 0;
  HEAPF32[i23 + 40 >> 2] = 0.0;
  HEAPF32[i23 + 44 >> 2] = 0.0;
  HEAP32[i23 + 48 >> 2] = i2;
  HEAP32[i23 + 52 >> 2] = i3;
  i21 = i23 + 16 | 0;
  HEAP32[i21 >> 2] = 0;
  HEAP8[i21 >> 0] = 1;
  HEAP8[i21 + 1 >> 0] = 0;
  HEAP8[i21 + 2 >> 0] = 0;
  HEAP8[i21 + 3 >> 0] = 0;
  i21 = i22;
  i22 = HEAP32[i21 + 4 >> 2] | 0;
  HEAP32[i23 >> 2] = HEAP32[i21 >> 2];
  HEAP32[i23 + 4 >> 2] = i22;
  return;
 }
 d1 = d6 * d6 + d14 * d14;
 if (!(d1 > 0.0)) ___assert_fail(4609, 4620, 127, 4678);
 d1 = 1.0 / d1;
 d16 = d4 - (d5 * d8 + d16 * d11) * d1;
 d17 = d13 - (d7 * d8 + d17 * d11) * d1;
 if (d16 * d16 + d17 * d17 > d15 * d15) return;
 d1 = -d14;
 i18 = d10 * d6 + d9 * d1 < 0.0;
 d4 = i18 ? -d6 : d6;
 d1 = i18 ? d14 : d1;
 d5 = +Math_sqrt(+(d1 * d1 + d4 * d4));
 if (!(d5 < 1.1920928955078125e-007)) {
  d17 = 1.0 / d5;
  d4 = d4 * d17;
  d1 = d1 * d17;
 }
 HEAP32[i21 >> 2] = 1;
 HEAP32[i23 + 56 >> 2] = 1;
 HEAPF32[i23 + 40 >> 2] = d1;
 HEAPF32[i23 + 44 >> 2] = d4;
 HEAP32[i23 + 48 >> 2] = i19;
 HEAP32[i23 + 52 >> 2] = i20;
 i21 = i23 + 16 | 0;
 HEAP32[i21 >> 2] = 0;
 HEAP8[i21 >> 0] = 0;
 HEAP8[i21 + 1 >> 0] = 0;
 HEAP8[i21 + 2 >> 0] = 1;
 HEAP8[i21 + 3 >> 0] = 0;
 i21 = i22;
 i22 = HEAP32[i21 + 4 >> 2] | 0;
 HEAP32[i23 >> 2] = HEAP32[i21 >> 2];
 HEAP32[i23 + 4 >> 2] = i22;
 return;
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i15, i14, i6, i13) {
 i3 = i3 | 0;
 i15 = i15 | 0;
 i14 = i14 | 0;
 i6 = i6 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 L1 : do if ((i3 | 0) == (HEAP32[i15 + 8 >> 2] | 0)) {
  if ((HEAP32[i15 + 4 >> 2] | 0) == (i14 | 0) ? (i1 = i15 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i6;
 } else {
  if ((i3 | 0) != (HEAP32[i15 >> 2] | 0)) {
   i12 = HEAP32[i3 + 12 >> 2] | 0;
   i4 = i3 + 16 + (i12 << 3) | 0;
   __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3 + 16 | 0, i15, i14, i6, i13);
   i1 = i3 + 24 | 0;
   if ((i12 | 0) <= 1) break;
   i2 = HEAP32[i3 + 8 >> 2] | 0;
   if ((i2 & 2 | 0) == 0 ? (i5 = i15 + 36 | 0, (HEAP32[i5 >> 2] | 0) != 1) : 0) {
    if (!(i2 & 1)) {
     i2 = i15 + 54 | 0;
     while (1) {
      if (HEAP8[i2 >> 0] | 0) break L1;
      if ((HEAP32[i5 >> 2] | 0) == 1) break L1;
      __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
      i1 = i1 + 8 | 0;
      if (i1 >>> 0 >= i4 >>> 0) break L1;
     }
    }
    i2 = i15 + 24 | 0;
    i3 = i15 + 54 | 0;
    while (1) {
     if (HEAP8[i3 >> 0] | 0) break L1;
     if ((HEAP32[i5 >> 2] | 0) == 1 ? (HEAP32[i2 >> 2] | 0) == 1 : 0) break L1;
     __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
     i1 = i1 + 8 | 0;
     if (i1 >>> 0 >= i4 >>> 0) break L1;
    }
   }
   i2 = i15 + 54 | 0;
   while (1) {
    if (HEAP8[i2 >> 0] | 0) break L1;
    __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
    i1 = i1 + 8 | 0;
    if (i1 >>> 0 >= i4 >>> 0) break L1;
   }
  }
  if ((HEAP32[i15 + 16 >> 2] | 0) != (i14 | 0) ? (i11 = i15 + 20 | 0, (HEAP32[i11 >> 2] | 0) != (i14 | 0)) : 0) {
   HEAP32[i15 + 32 >> 2] = i6;
   i8 = i15 + 44 | 0;
   if ((HEAP32[i8 >> 2] | 0) == 4) break;
   i2 = HEAP32[i3 + 12 >> 2] | 0;
   i4 = i3 + 16 + (i2 << 3) | 0;
   i5 = i15 + 52 | 0;
   i6 = i15 + 53 | 0;
   i9 = i15 + 54 | 0;
   i7 = i3 + 8 | 0;
   i10 = i15 + 24 | 0;
   L34 : do if ((i2 | 0) > 0) {
    i2 = 0;
    i1 = 0;
    i3 = i3 + 16 | 0;
    while (1) {
     HEAP8[i5 >> 0] = 0;
     HEAP8[i6 >> 0] = 0;
     __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i3, i15, i14, i14, 1, i13);
     if (HEAP8[i9 >> 0] | 0) {
      i12 = 20;
      break L34;
     }
     do if (HEAP8[i6 >> 0] | 0) {
      if (!(HEAP8[i5 >> 0] | 0)) if (!(HEAP32[i7 >> 2] & 1)) {
       i1 = 1;
       i12 = 20;
       break L34;
      } else {
       i1 = 1;
       break;
      }
      if ((HEAP32[i10 >> 2] | 0) == 1) break L34;
      if (!(HEAP32[i7 >> 2] & 2)) break L34; else {
       i2 = 1;
       i1 = 1;
      }
     } while (0);
     i3 = i3 + 8 | 0;
     if (i3 >>> 0 >= i4 >>> 0) {
      i12 = 20;
      break;
     }
    }
   } else {
    i2 = 0;
    i1 = 0;
    i12 = 20;
   } while (0);
   do if ((i12 | 0) == 20) {
    if ((!i2 ? (HEAP32[i11 >> 2] = i14, i14 = i15 + 40 | 0, HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 1, (HEAP32[i15 + 36 >> 2] | 0) == 1) : 0) ? (HEAP32[i10 >> 2] | 0) == 2 : 0) {
     HEAP8[i9 >> 0] = 1;
     if (i1) break;
    } else i12 = 24;
    if ((i12 | 0) == 24 ? i1 : 0) break;
    HEAP32[i8 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i8 >> 2] = 3;
   break;
  }
  if ((i6 | 0) == 1) HEAP32[i15 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZN24b2PositionSolverManifold10InitializeEP27b2ContactPositionConstraintRK11b2TransformS4_i(i13, i12, i2, i3, i1) {
 i13 = i13 | 0;
 i12 = i12 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, i17 = 0, i18 = 0, i19 = 0;
 if ((HEAP32[i12 + 84 >> 2] | 0) <= 0) ___assert_fail(8086, 6381, 623, 5501);
 switch (HEAP32[i12 + 72 >> 2] | 0) {
 case 0:
  {
   d7 = +HEAPF32[i2 + 12 >> 2];
   d8 = +HEAPF32[i12 + 24 >> 2];
   d4 = +HEAPF32[i2 + 8 >> 2];
   d9 = +HEAPF32[i12 + 28 >> 2];
   d11 = +HEAPF32[i2 >> 2] + (d7 * d8 - d4 * d9);
   d9 = d8 * d4 + d7 * d9 + +HEAPF32[i2 + 4 >> 2];
   d7 = +HEAPF32[i3 + 12 >> 2];
   d4 = +HEAPF32[i12 >> 2];
   d8 = +HEAPF32[i3 + 8 >> 2];
   d6 = +HEAPF32[i12 + 4 >> 2];
   d10 = +HEAPF32[i3 >> 2] + (d7 * d4 - d8 * d6);
   d6 = d4 * d8 + d7 * d6 + +HEAPF32[i3 + 4 >> 2];
   d7 = d10 - d11;
   d8 = d6 - d9;
   HEAPF32[i13 >> 2] = d7;
   i1 = i13 + 4 | 0;
   HEAPF32[i1 >> 2] = d8;
   d4 = +Math_sqrt(+(d7 * d7 + d8 * d8));
   if (d4 < 1.1920928955078125e-007) {
    d4 = d7;
    d5 = d8;
   } else {
    d5 = 1.0 / d4;
    d4 = d7 * d5;
    HEAPF32[i13 >> 2] = d4;
    d5 = d8 * d5;
    HEAPF32[i1 >> 2] = d5;
   }
   HEAPF32[i13 + 8 >> 2] = (d11 + d10) * .5;
   HEAPF32[i13 + 12 >> 2] = (d9 + d6) * .5;
   HEAPF32[i13 + 16 >> 2] = d7 * d4 + d8 * d5 - +HEAPF32[i12 + 76 >> 2] - +HEAPF32[i12 + 80 >> 2];
   return;
  }
 case 1:
  {
   i18 = i2 + 12 | 0;
   d7 = +HEAPF32[i18 >> 2];
   d6 = +HEAPF32[i12 + 16 >> 2];
   i17 = i2 + 8 | 0;
   d5 = +HEAPF32[i17 >> 2];
   d9 = +HEAPF32[i12 + 20 >> 2];
   d4 = d7 * d6 - d5 * d9;
   d9 = d6 * d5 + d7 * d9;
   HEAPF32[i13 >> 2] = d4;
   HEAPF32[i13 + 4 >> 2] = d9;
   d7 = +HEAPF32[i18 >> 2];
   d5 = +HEAPF32[i12 + 24 >> 2];
   d6 = +HEAPF32[i17 >> 2];
   d8 = +HEAPF32[i12 + 28 >> 2];
   d14 = +HEAPF32[i3 + 12 >> 2];
   d16 = +HEAPF32[i12 + (i1 << 3) >> 2];
   d15 = +HEAPF32[i3 + 8 >> 2];
   d11 = +HEAPF32[i12 + (i1 << 3) + 4 >> 2];
   d10 = +HEAPF32[i3 >> 2] + (d14 * d16 - d15 * d11);
   d11 = d16 * d15 + d14 * d11 + +HEAPF32[i3 + 4 >> 2];
   HEAPF32[i13 + 16 >> 2] = d4 * (d10 - (+HEAPF32[i2 >> 2] + (d7 * d5 - d6 * d8))) + (d11 - (d5 * d6 + d7 * d8 + +HEAPF32[i2 + 4 >> 2])) * d9 - +HEAPF32[i12 + 76 >> 2] - +HEAPF32[i12 + 80 >> 2];
   HEAPF32[i13 + 8 >> 2] = d10;
   HEAPF32[i13 + 12 >> 2] = d11;
   return;
  }
 case 2:
  {
   i19 = i3 + 12 | 0;
   d9 = +HEAPF32[i19 >> 2];
   d8 = +HEAPF32[i12 + 16 >> 2];
   i17 = i3 + 8 | 0;
   d7 = +HEAPF32[i17 >> 2];
   d16 = +HEAPF32[i12 + 20 >> 2];
   d15 = d9 * d8 - d7 * d16;
   d16 = d8 * d7 + d9 * d16;
   HEAPF32[i13 >> 2] = d15;
   i18 = i13 + 4 | 0;
   HEAPF32[i18 >> 2] = d16;
   d9 = +HEAPF32[i19 >> 2];
   d7 = +HEAPF32[i12 + 24 >> 2];
   d8 = +HEAPF32[i17 >> 2];
   d10 = +HEAPF32[i12 + 28 >> 2];
   d6 = +HEAPF32[i2 + 12 >> 2];
   d4 = +HEAPF32[i12 + (i1 << 3) >> 2];
   d5 = +HEAPF32[i2 + 8 >> 2];
   d14 = +HEAPF32[i12 + (i1 << 3) + 4 >> 2];
   d11 = +HEAPF32[i2 >> 2] + (d6 * d4 - d5 * d14);
   d14 = d4 * d5 + d6 * d14 + +HEAPF32[i2 + 4 >> 2];
   HEAPF32[i13 + 16 >> 2] = d15 * (d11 - (+HEAPF32[i3 >> 2] + (d9 * d7 - d8 * d10))) + (d14 - (d7 * d8 + d9 * d10 + +HEAPF32[i3 + 4 >> 2])) * d16 - +HEAPF32[i12 + 76 >> 2] - +HEAPF32[i12 + 80 >> 2];
   HEAPF32[i13 + 8 >> 2] = d11;
   HEAPF32[i13 + 12 >> 2] = d14;
   HEAPF32[i13 >> 2] = -d15;
   HEAPF32[i18 >> 2] = -d16;
   return;
  }
 default:
  return;
 }
}

function __ZN7b2WorldC2ERK6b2Vec2(i5, i4) {
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i6 = 0;
 i3 = i5 + 4 | 0;
 HEAP32[i5 + 12 >> 2] = 128;
 HEAP32[i5 + 8 >> 2] = 0;
 i1 = _malloc(1024) | 0;
 HEAP32[i3 >> 2] = i1;
 _memset(i1 | 0, 0, 1024) | 0;
 i1 = i5 + 16 | 0;
 i2 = i1 + 56 | 0;
 do {
  HEAP32[i1 >> 2] = 0;
  i1 = i1 + 4 | 0;
 } while ((i1 | 0) < (i2 | 0));
 do if (!(HEAP8[3727] | 0)) {
  i1 = 1;
  i2 = 0;
  while (1) {
   if ((i2 | 0) >= 14) {
    i1 = 3;
    break;
   }
   i2 = ((i1 | 0) > (HEAP32[884 + (i2 << 2) >> 2] | 0) & 1) + i2 | 0;
   HEAP8[3086 + i1 >> 0] = i2;
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 641) {
    i1 = 5;
    break;
   }
  }
  if ((i1 | 0) == 3) ___assert_fail(5512, 4037, 71, 5530); else if ((i1 | 0) == 5) {
   HEAP8[3727] = 1;
   break;
  }
 } while (0);
 HEAP32[i5 + 102472 >> 2] = 0;
 HEAP32[i5 + 102476 >> 2] = 0;
 HEAP32[i5 + 102480 >> 2] = 0;
 HEAP32[i5 + 102868 >> 2] = 0;
 HEAP32[i5 + 102876 >> 2] = -1;
 HEAP32[i5 + 102888 >> 2] = 16;
 HEAP32[i5 + 102884 >> 2] = 0;
 i2 = _malloc(576) | 0;
 HEAP32[i5 + 102880 >> 2] = i2;
 _memset(i2 | 0, 0, 572) | 0;
 HEAP32[i2 + 20 >> 2] = 1;
 HEAP32[i2 + 32 >> 2] = -1;
 HEAP32[i2 + 56 >> 2] = 2;
 HEAP32[i2 + 68 >> 2] = -1;
 HEAP32[i2 + 92 >> 2] = 3;
 HEAP32[i2 + 104 >> 2] = -1;
 HEAP32[i2 + 128 >> 2] = 4;
 HEAP32[i2 + 140 >> 2] = -1;
 HEAP32[i2 + 164 >> 2] = 5;
 HEAP32[i2 + 176 >> 2] = -1;
 HEAP32[i2 + 200 >> 2] = 6;
 HEAP32[i2 + 212 >> 2] = -1;
 HEAP32[i2 + 236 >> 2] = 7;
 HEAP32[i2 + 248 >> 2] = -1;
 HEAP32[i2 + 272 >> 2] = 8;
 HEAP32[i2 + 284 >> 2] = -1;
 HEAP32[i2 + 308 >> 2] = 9;
 HEAP32[i2 + 320 >> 2] = -1;
 HEAP32[i2 + 344 >> 2] = 10;
 HEAP32[i2 + 356 >> 2] = -1;
 HEAP32[i2 + 380 >> 2] = 11;
 HEAP32[i2 + 392 >> 2] = -1;
 HEAP32[i2 + 416 >> 2] = 12;
 HEAP32[i2 + 428 >> 2] = -1;
 HEAP32[i2 + 452 >> 2] = 13;
 HEAP32[i2 + 464 >> 2] = -1;
 HEAP32[i2 + 488 >> 2] = 14;
 HEAP32[i2 + 500 >> 2] = -1;
 HEAP32[i2 + 524 >> 2] = 15;
 HEAP32[i2 + 536 >> 2] = -1;
 HEAP32[i2 + 560 >> 2] = -1;
 HEAP32[i2 + 572 >> 2] = -1;
 i2 = i5 + 102892 | 0;
 HEAP32[i2 >> 2] = 0;
 HEAP32[i2 + 4 >> 2] = 0;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 12 >> 2] = 0;
 HEAP32[i5 + 102924 >> 2] = 16;
 HEAP32[i5 + 102928 >> 2] = 0;
 HEAP32[i5 + 102920 >> 2] = _malloc(128) | 0;
 HEAP32[i5 + 102912 >> 2] = 16;
 HEAP32[i5 + 102916 >> 2] = 0;
 HEAP32[i5 + 102908 >> 2] = _malloc(64) | 0;
 HEAP32[i5 + 102936 >> 2] = 0;
 HEAP32[i5 + 102940 >> 2] = 0;
 HEAP32[i5 + 102944 >> 2] = 960;
 HEAP32[i5 + 102948 >> 2] = 964;
 i2 = i5 + 102952 | 0;
 HEAP32[i5 + 102984 >> 2] = 0;
 HEAP32[i5 + 102988 >> 2] = 0;
 HEAP32[i2 >> 2] = 0;
 HEAP32[i2 + 4 >> 2] = 0;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 12 >> 2] = 0;
 HEAP32[i2 + 16 >> 2] = 0;
 HEAP8[i5 + 102996 >> 0] = 1;
 HEAP8[i5 + 102997 >> 0] = 1;
 HEAP8[i5 + 102998 >> 0] = 0;
 HEAP8[i5 + 102999 >> 0] = 1;
 HEAP8[i5 + 102980 >> 0] = 1;
 i6 = i4;
 i1 = HEAP32[i6 + 4 >> 2] | 0;
 i4 = i5 + 102972 | 0;
 HEAP32[i4 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i4 + 4 >> 2] = i1;
 HEAP32[i5 + 102872 >> 2] = 4;
 HEAPF32[i5 + 102992 >> 2] = 0.0;
 HEAP32[i2 >> 2] = i3;
 i4 = i5 + 103e3 | 0;
 HEAP32[i4 >> 2] = 0;
 HEAP32[i4 + 4 >> 2] = 0;
 HEAP32[i4 + 8 >> 2] = 0;
 HEAP32[i4 + 12 >> 2] = 0;
 HEAP32[i4 + 16 >> 2] = 0;
 HEAP32[i4 + 20 >> 2] = 0;
 HEAP32[i4 + 24 >> 2] = 0;
 HEAP32[i4 + 28 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 return;
}

function __ZN6b2BodyC2EPK9b2BodyDefP7b2World(i11, i10, i2) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, d12 = 0.0;
 i5 = i10 + 4 | 0;
 if ((HEAP32[i5 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5678, 5701, 27, 5751);
 if ((HEAP32[i10 + 8 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5678, 5701, 27, 5751);
 i3 = i10 + 16 | 0;
 if ((HEAP32[i3 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5758, 5701, 28, 5751);
 if ((HEAP32[i10 + 20 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5758, 5701, 28, 5751);
 i4 = i10 + 12 | 0;
 if ((HEAP32[i4 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5787, 5701, 29, 5751);
 i6 = i10 + 24 | 0;
 if ((HEAP32[i6 >> 2] & 2139095040 | 0) == 2139095040) ___assert_fail(5808, 5701, 30, 5751);
 i7 = i10 + 32 | 0;
 d12 = +HEAPF32[i7 >> 2];
 if (!(d12 >= 0.0) | ((HEAPF32[tempDoublePtr >> 2] = d12, HEAP32[tempDoublePtr >> 2] | 0) & 2139095040 | 0) == 2139095040) ___assert_fail(5839, 5701, 31, 5751);
 i8 = i10 + 28 | 0;
 d12 = +HEAPF32[i8 >> 2];
 if (!(d12 >= 0.0) | ((HEAPF32[tempDoublePtr >> 2] = d12, HEAP32[tempDoublePtr >> 2] | 0) & 2139095040 | 0) == 2139095040) ___assert_fail(5899, 5701, 32, 5751);
 HEAP32[i11 + 88 >> 2] = i2;
 i9 = i11 + 4 | 0;
 i1 = (HEAP8[i10 + 39 >> 0] | 0) == 0 ? 0 : 8;
 HEAP16[i9 >> 1] = i1;
 if (HEAP8[i10 + 38 >> 0] | 0) {
  i1 = (i1 & 65535 | 16) & 65535;
  HEAP16[i9 >> 1] = i1;
 }
 if (HEAP8[i10 + 36 >> 0] | 0) {
  i1 = (i1 & 65535 | 4) & 65535;
  HEAP16[i9 >> 1] = i1;
 }
 if (HEAP8[i10 + 37 >> 0] | 0) {
  i1 = (i1 & 65535 | 2) & 65535;
  HEAP16[i9 >> 1] = i1;
  HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 1;
 }
 if (HEAP8[i10 + 40 >> 0] | 0) HEAP16[i9 >> 1] = i1 & 65535 | 32;
 i9 = i5;
 i2 = HEAP32[i9 >> 2] | 0;
 i9 = HEAP32[i9 + 4 >> 2] | 0;
 i5 = i11 + 12 | 0;
 HEAP32[i5 >> 2] = i2;
 HEAP32[i5 + 4 >> 2] = i9;
 d12 = +HEAPF32[i4 >> 2];
 HEAPF32[i11 + 20 >> 2] = +Math_sin(+d12);
 HEAPF32[i11 + 24 >> 2] = +Math_cos(+d12);
 HEAPF32[i11 + 28 >> 2] = 0.0;
 HEAPF32[i11 + 32 >> 2] = 0.0;
 i5 = i11 + 36 | 0;
 HEAP32[i5 >> 2] = i2;
 HEAP32[i5 + 4 >> 2] = i9;
 i5 = i11 + 44 | 0;
 HEAP32[i5 >> 2] = i2;
 HEAP32[i5 + 4 >> 2] = i9;
 i4 = HEAP32[i4 >> 2] | 0;
 HEAP32[i11 + 52 >> 2] = i4;
 HEAP32[i11 + 56 >> 2] = i4;
 HEAPF32[i11 + 60 >> 2] = 0.0;
 HEAP32[i11 + 108 >> 2] = 0;
 HEAP32[i11 + 112 >> 2] = 0;
 HEAP32[i11 + 92 >> 2] = 0;
 HEAP32[i11 + 96 >> 2] = 0;
 i4 = i3;
 i5 = HEAP32[i4 + 4 >> 2] | 0;
 i9 = i11 + 64 | 0;
 HEAP32[i9 >> 2] = HEAP32[i4 >> 2];
 HEAP32[i9 + 4 >> 2] = i5;
 HEAP32[i11 + 72 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i11 + 132 >> 2] = HEAP32[i8 >> 2];
 HEAP32[i11 + 136 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i11 + 140 >> 2] = HEAP32[i10 + 48 >> 2];
 HEAPF32[i11 + 76 >> 2] = 0.0;
 HEAPF32[i11 + 80 >> 2] = 0.0;
 HEAPF32[i11 + 84 >> 2] = 0.0;
 HEAPF32[i11 + 144 >> 2] = 0.0;
 i9 = HEAP32[i10 >> 2] | 0;
 HEAP32[i11 >> 2] = i9;
 i9 = (i9 | 0) == 2;
 HEAPF32[i11 + 116 >> 2] = i9 ? 1.0 : 0.0;
 HEAPF32[i11 + 120 >> 2] = i9 ? 1.0 : 0.0;
 HEAPF32[i11 + 124 >> 2] = 0.0;
 HEAPF32[i11 + 128 >> 2] = 0.0;
 HEAP32[i11 + 148 >> 2] = HEAP32[i10 + 44 >> 2];
 HEAP32[i11 + 100 >> 2] = 0;
 HEAP32[i11 + 104 >> 2] = 0;
 return;
}

function __ZNK20b2SeparationFunction8EvaluateEiif(i8, i6, i7, d1) {
 i8 = i8 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 d1 = +d1;
 var i2 = 0, d3 = 0.0, d4 = 0.0, d5 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0;
 d4 = 1.0 - d1;
 d11 = d4 * +HEAPF32[i8 + 32 >> 2] + +HEAPF32[i8 + 36 >> 2] * d1;
 d10 = +Math_sin(+d11);
 d11 = +Math_cos(+d11);
 d15 = +HEAPF32[i8 + 8 >> 2];
 d13 = +HEAPF32[i8 + 12 >> 2];
 d12 = d4 * +HEAPF32[i8 + 16 >> 2] + +HEAPF32[i8 + 24 >> 2] * d1 - (d11 * d15 - d10 * d13);
 d13 = d4 * +HEAPF32[i8 + 20 >> 2] + +HEAPF32[i8 + 28 >> 2] * d1 - (d10 * d15 + d11 * d13);
 d15 = d4 * +HEAPF32[i8 + 68 >> 2] + +HEAPF32[i8 + 72 >> 2] * d1;
 d14 = +Math_sin(+d15);
 d15 = +Math_cos(+d15);
 d5 = +HEAPF32[i8 + 44 >> 2];
 d9 = +HEAPF32[i8 + 48 >> 2];
 d16 = d4 * +HEAPF32[i8 + 52 >> 2] + +HEAPF32[i8 + 60 >> 2] * d1 - (d15 * d5 - d14 * d9);
 d9 = d4 * +HEAPF32[i8 + 56 >> 2] + +HEAPF32[i8 + 64 >> 2] * d1 - (d14 * d5 + d15 * d9);
 switch (HEAP32[i8 + 80 >> 2] | 0) {
 case 0:
  {
   i2 = HEAP32[i8 >> 2] | 0;
   if ((i6 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i2 + 20 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i2 = HEAP32[i2 + 16 >> 2] | 0;
   d3 = +HEAPF32[i2 + (i6 << 3) >> 2];
   d1 = +HEAPF32[i2 + (i6 << 3) + 4 >> 2];
   i2 = HEAP32[i8 + 4 >> 2] | 0;
   if ((i7 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i2 + 20 >> 2] | 0) <= (i7 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i6 = HEAP32[i2 + 16 >> 2] | 0;
   d4 = +HEAPF32[i6 + (i7 << 3) >> 2];
   d5 = +HEAPF32[i6 + (i7 << 3) + 4 >> 2];
   d16 = +HEAPF32[i8 + 92 >> 2] * (d16 + (d15 * d4 - d14 * d5) - (d12 + (d11 * d3 - d10 * d1))) + +HEAPF32[i8 + 96 >> 2] * (d9 + (d14 * d4 + d15 * d5) - (d13 + (d10 * d3 + d11 * d1)));
   return +d16;
  }
 case 1:
  {
   d1 = +HEAPF32[i8 + 92 >> 2];
   d3 = +HEAPF32[i8 + 96 >> 2];
   d4 = +HEAPF32[i8 + 84 >> 2];
   d5 = +HEAPF32[i8 + 88 >> 2];
   i2 = HEAP32[i8 + 4 >> 2] | 0;
   if ((i7 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i2 + 20 >> 2] | 0) <= (i7 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i8 = HEAP32[i2 + 16 >> 2] | 0;
   d18 = +HEAPF32[i8 + (i7 << 3) >> 2];
   d17 = +HEAPF32[i8 + (i7 << 3) + 4 >> 2];
   d16 = (d11 * d1 - d10 * d3) * (d16 + (d15 * d18 - d14 * d17) - (d12 + (d11 * d4 - d10 * d5))) + (d10 * d1 + d11 * d3) * (d9 + (d14 * d18 + d15 * d17) - (d13 + (d10 * d4 + d11 * d5)));
   return +d16;
  }
 case 2:
  {
   d1 = +HEAPF32[i8 + 92 >> 2];
   d3 = +HEAPF32[i8 + 96 >> 2];
   d4 = +HEAPF32[i8 + 84 >> 2];
   d5 = +HEAPF32[i8 + 88 >> 2];
   i2 = HEAP32[i8 >> 2] | 0;
   if ((i6 | 0) <= -1) ___assert_fail(4937, 4967, 103, 5018);
   if ((HEAP32[i2 + 20 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4937, 4967, 103, 5018);
   i8 = HEAP32[i2 + 16 >> 2] | 0;
   d17 = +HEAPF32[i8 + (i6 << 3) >> 2];
   d18 = +HEAPF32[i8 + (i6 << 3) + 4 >> 2];
   d18 = (d15 * d1 - d14 * d3) * (d12 + (d11 * d17 - d10 * d18) - (d16 + (d15 * d4 - d14 * d5))) + (d14 * d1 + d15 * d3) * (d13 + (d10 * d17 + d11 * d18) - (d9 + (d14 * d4 + d15 * d5)));
   return +d18;
  }
 default:
  ___assert_fail(4304, 5427, 239, 8105);
 }
 return +(0.0);
}

function __ZN16b2ContactManager7AddPairEPvS0_(i12, i1, i2) {
 i12 = i12 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i10 = HEAP32[i1 + 16 >> 2] | 0;
 i11 = HEAP32[i2 + 16 >> 2] | 0;
 i9 = HEAP32[i1 + 20 >> 2] | 0;
 i8 = HEAP32[i2 + 20 >> 2] | 0;
 i7 = HEAP32[i10 + 8 >> 2] | 0;
 i6 = HEAP32[i11 + 8 >> 2] | 0;
 if ((i7 | 0) == (i6 | 0)) return;
 i1 = HEAP32[i6 + 112 >> 2] | 0;
 L4 : do if (i1) {
  while (1) {
   if ((HEAP32[i1 >> 2] | 0) == (i7 | 0)) {
    i5 = HEAP32[i1 + 4 >> 2] | 0;
    i2 = HEAP32[i5 + 48 >> 2] | 0;
    i3 = HEAP32[i5 + 52 >> 2] | 0;
    i4 = HEAP32[i5 + 56 >> 2] | 0;
    i5 = HEAP32[i5 + 60 >> 2] | 0;
    if ((i2 | 0) == (i10 | 0) & (i3 | 0) == (i11 | 0) & (i4 | 0) == (i9 | 0) & (i5 | 0) == (i8 | 0)) {
     i1 = 29;
     break;
    }
    if ((i2 | 0) == (i11 | 0) & (i3 | 0) == (i10 | 0) & (i4 | 0) == (i8 | 0) & (i5 | 0) == (i9 | 0)) {
     i1 = 29;
     break;
    }
   }
   i1 = HEAP32[i1 + 12 >> 2] | 0;
   if (!i1) break L4;
  }
  if ((i1 | 0) == 29) return;
 } while (0);
 if ((HEAP32[i6 >> 2] | 0) != 2 ? (HEAP32[i7 >> 2] | 0) != 2 : 0) return;
 i1 = HEAP32[i6 + 108 >> 2] | 0;
 L19 : do if (i1) {
  while (1) {
   if ((HEAP32[i1 >> 2] | 0) == (i7 | 0) ? (HEAP8[(HEAP32[i1 + 4 >> 2] | 0) + 61 >> 0] | 0) == 0 : 0) break;
   i1 = HEAP32[i1 + 12 >> 2] | 0;
   if (!i1) break L19;
  }
  return;
 } while (0);
 i1 = HEAP32[i12 + 68 >> 2] | 0;
 if ((i1 | 0) != 0 ? !(FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 8 >> 2] & 15](i1, i10, i11) | 0) : 0) return;
 i4 = __ZN9b2Contact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i10, i9, i11, i8, HEAP32[i12 + 76 >> 2] | 0) | 0;
 if (!i4) return;
 i5 = HEAP32[i4 + 48 >> 2] | 0;
 i6 = HEAP32[i4 + 52 >> 2] | 0;
 i7 = HEAP32[i5 + 8 >> 2] | 0;
 i8 = HEAP32[i6 + 8 >> 2] | 0;
 HEAP32[i4 + 8 >> 2] = 0;
 i1 = i12 + 60 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 HEAP32[i4 + 12 >> 2] = i2;
 if (i2) HEAP32[i2 + 8 >> 2] = i4;
 HEAP32[i1 >> 2] = i4;
 i1 = i4 + 16 | 0;
 HEAP32[i4 + 20 >> 2] = i4;
 HEAP32[i1 >> 2] = i8;
 HEAP32[i4 + 24 >> 2] = 0;
 i2 = i7 + 112 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 HEAP32[i4 + 28 >> 2] = i3;
 if (i3) HEAP32[i3 + 8 >> 2] = i1;
 HEAP32[i2 >> 2] = i1;
 i1 = i4 + 32 | 0;
 HEAP32[i4 + 36 >> 2] = i4;
 HEAP32[i1 >> 2] = i7;
 HEAP32[i4 + 40 >> 2] = 0;
 i2 = i8 + 112 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 HEAP32[i4 + 44 >> 2] = i3;
 if (i3) HEAP32[i3 + 8 >> 2] = i1;
 HEAP32[i2 >> 2] = i1;
 if ((HEAP8[i5 + 38 >> 0] | 0) == 0 ? (HEAP8[i6 + 38 >> 0] | 0) == 0 : 0) {
  i1 = i7 + 4 | 0;
  i2 = HEAPU16[i1 >> 1] | 0;
  if (!(i2 & 2)) {
   HEAP16[i1 >> 1] = i2 | 2;
   HEAPF32[i7 + 144 >> 2] = 0.0;
   i11 = HEAP32[i7 + 88 >> 2] | 0;
   HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 1;
  }
  i1 = i8 + 4 | 0;
  i2 = HEAPU16[i1 >> 1] | 0;
  if (!(i2 & 2)) {
   HEAP16[i1 >> 1] = i2 | 2;
   HEAPF32[i8 + 144 >> 2] = 0.0;
   i11 = HEAP32[i8 + 88 >> 2] | 0;
   HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 1;
  }
 }
 i12 = i12 + 64 | 0;
 HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + 1;
 return;
}

function __ZN16b2ContactManager7CollideEv(i16) {
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i1 = HEAP32[i16 + 60 >> 2] | 0;
 if (!i1) return;
 i12 = i16 + 12 | 0;
 i13 = i16 + 4 | 0;
 i14 = i16 + 72 | 0;
 i15 = i16 + 68 | 0;
 L4 : while (1) {
  i8 = HEAP32[i1 + 48 >> 2] | 0;
  i9 = HEAP32[i1 + 52 >> 2] | 0;
  i7 = HEAP32[i1 + 56 >> 2] | 0;
  i10 = HEAP32[i1 + 60 >> 2] | 0;
  i4 = HEAP32[i8 + 8 >> 2] | 0;
  i6 = HEAP32[i9 + 8 >> 2] | 0;
  i5 = i1 + 4 | 0;
  i2 = HEAP32[i5 >> 2] | 0;
  L6 : do if (!(i2 & 8)) i11 = 17; else {
   if (!((HEAP32[i6 >> 2] | 0) != 2 ? (HEAP32[i4 >> 2] | 0) != 2 : 0)) i11 = 6;
   L10 : do if ((i11 | 0) == 6) {
    i11 = 0;
    i3 = HEAP32[i6 + 108 >> 2] | 0;
    if (i3) do {
     if ((HEAP32[i3 >> 2] | 0) == (i4 | 0) ? (HEAP8[(HEAP32[i3 + 4 >> 2] | 0) + 61 >> 0] | 0) == 0 : 0) break L10;
     i3 = HEAP32[i3 + 12 >> 2] | 0;
    } while ((i3 | 0) != 0);
    i3 = HEAP32[i15 >> 2] | 0;
    do if (i3) if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 8 >> 2] & 15](i3, i8, i9) | 0) {
     i2 = HEAP32[i5 >> 2] | 0;
     break;
    } else {
     i10 = HEAP32[i1 + 12 >> 2] | 0;
     __ZN16b2ContactManager7DestroyEP9b2Contact(i16, i1);
     i1 = i10;
     break L6;
    } while (0);
    HEAP32[i5 >> 2] = i2 & -9;
    i11 = 17;
    break L6;
   } while (0);
   i10 = HEAP32[i1 + 12 >> 2] | 0;
   __ZN16b2ContactManager7DestroyEP9b2Contact(i16, i1);
   i1 = i10;
  } while (0);
  do if ((i11 | 0) == 17) {
   i11 = 0;
   if (!(HEAP16[i4 + 4 >> 1] & 2)) i3 = 0; else i3 = (HEAP32[i4 >> 2] | 0) != 0;
   if (!(HEAP16[i6 + 4 >> 1] & 2)) i2 = 0; else i2 = (HEAP32[i6 >> 2] | 0) != 0;
   if (!(i3 | i2)) {
    i1 = HEAP32[i1 + 12 >> 2] | 0;
    break;
   }
   i5 = HEAP32[(HEAP32[i8 + 24 >> 2] | 0) + (i7 * 28 | 0) + 24 >> 2] | 0;
   i2 = HEAP32[(HEAP32[i9 + 24 >> 2] | 0) + (i10 * 28 | 0) + 24 >> 2] | 0;
   if ((i5 | 0) <= -1) {
    i11 = 25;
    break L4;
   }
   i3 = HEAP32[i12 >> 2] | 0;
   if ((i3 | 0) <= (i5 | 0)) {
    i11 = 25;
    break L4;
   }
   i4 = HEAP32[i13 >> 2] | 0;
   if (!((i2 | 0) > -1 & (i3 | 0) > (i2 | 0))) {
    i11 = 27;
    break L4;
   }
   if ((+HEAPF32[i4 + (i2 * 36 | 0) >> 2] - +HEAPF32[i4 + (i5 * 36 | 0) + 8 >> 2] > 0.0 ? 1 : +HEAPF32[i4 + (i2 * 36 | 0) + 4 >> 2] - +HEAPF32[i4 + (i5 * 36 | 0) + 12 >> 2] > 0.0) | +HEAPF32[i4 + (i5 * 36 | 0) >> 2] - +HEAPF32[i4 + (i2 * 36 | 0) + 8 >> 2] > 0.0 | +HEAPF32[i4 + (i5 * 36 | 0) + 4 >> 2] - +HEAPF32[i4 + (i2 * 36 | 0) + 12 >> 2] > 0.0) {
    i10 = HEAP32[i1 + 12 >> 2] | 0;
    __ZN16b2ContactManager7DestroyEP9b2Contact(i16, i1);
    i1 = i10;
    break;
   } else {
    __ZN9b2Contact6UpdateEP17b2ContactListener(i1, HEAP32[i14 >> 2] | 0);
    i1 = HEAP32[i1 + 12 >> 2] | 0;
    break;
   }
  } while (0);
  if (!i1) {
   i11 = 31;
   break;
  }
 }
 if ((i11 | 0) == 25) ___assert_fail(4410, 6198, 164, 6252); else if ((i11 | 0) == 27) ___assert_fail(4410, 6198, 164, 6252); else if ((i11 | 0) == 31) return;
}

function __ZNSt3__17__sort4IRPFbRK6b2PairS3_EPS1_EEjT0_S8_S8_S8_T_(i5, i6, i7, i8, i4) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i9 = 0, i10 = 0, i11 = 0;
 i3 = FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i6, i5) | 0;
 i1 = FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i7, i6) | 0;
 do if (i3) {
  i3 = i5;
  i2 = HEAP32[i3 >> 2] | 0;
  i3 = HEAP32[i3 + 4 >> 2] | 0;
  if (i1) {
   i10 = i7;
   i9 = HEAP32[i10 + 4 >> 2] | 0;
   i1 = i5;
   HEAP32[i1 >> 2] = HEAP32[i10 >> 2];
   HEAP32[i1 + 4 >> 2] = i9;
   i1 = i7;
   HEAP32[i1 >> 2] = i2;
   HEAP32[i1 + 4 >> 2] = i3;
   i1 = 1;
   break;
  }
  i1 = i6;
  i9 = HEAP32[i1 + 4 >> 2] | 0;
  i10 = i5;
  HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
  HEAP32[i10 + 4 >> 2] = i9;
  i10 = i6;
  HEAP32[i10 >> 2] = i2;
  HEAP32[i10 + 4 >> 2] = i3;
  if (FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i7, i6) | 0) {
   i10 = i6;
   i9 = HEAP32[i10 >> 2] | 0;
   i10 = HEAP32[i10 + 4 >> 2] | 0;
   i2 = i7;
   i3 = HEAP32[i2 + 4 >> 2] | 0;
   i1 = i6;
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   HEAP32[i1 + 4 >> 2] = i3;
   i1 = i7;
   HEAP32[i1 >> 2] = i9;
   HEAP32[i1 + 4 >> 2] = i10;
   i1 = 2;
  } else i1 = 1;
 } else if (i1) {
  i9 = i6;
  i3 = HEAP32[i9 >> 2] | 0;
  i9 = HEAP32[i9 + 4 >> 2] | 0;
  i1 = i7;
  i2 = HEAP32[i1 + 4 >> 2] | 0;
  i10 = i6;
  HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
  HEAP32[i10 + 4 >> 2] = i2;
  i10 = i7;
  HEAP32[i10 >> 2] = i3;
  HEAP32[i10 + 4 >> 2] = i9;
  if (FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i6, i5) | 0) {
   i10 = i5;
   i9 = HEAP32[i10 >> 2] | 0;
   i10 = HEAP32[i10 + 4 >> 2] | 0;
   i2 = i6;
   i3 = HEAP32[i2 + 4 >> 2] | 0;
   i1 = i5;
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   HEAP32[i1 + 4 >> 2] = i3;
   i1 = i6;
   HEAP32[i1 >> 2] = i9;
   HEAP32[i1 + 4 >> 2] = i10;
   i1 = 2;
  } else i1 = 1;
 } else i1 = 0; while (0);
 if (!(FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i8, i7) | 0)) {
  i10 = i1;
  return i10 | 0;
 }
 i9 = i7;
 i3 = HEAP32[i9 >> 2] | 0;
 i9 = HEAP32[i9 + 4 >> 2] | 0;
 i11 = i8;
 i2 = HEAP32[i11 + 4 >> 2] | 0;
 i10 = i7;
 HEAP32[i10 >> 2] = HEAP32[i11 >> 2];
 HEAP32[i10 + 4 >> 2] = i2;
 i10 = i8;
 HEAP32[i10 >> 2] = i3;
 HEAP32[i10 + 4 >> 2] = i9;
 if (!(FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i7, i6) | 0)) {
  i11 = i1 + 1 | 0;
  return i11 | 0;
 }
 i10 = i6;
 i9 = HEAP32[i10 >> 2] | 0;
 i10 = HEAP32[i10 + 4 >> 2] | 0;
 i3 = i7;
 i8 = HEAP32[i3 + 4 >> 2] | 0;
 i11 = i6;
 HEAP32[i11 >> 2] = HEAP32[i3 >> 2];
 HEAP32[i11 + 4 >> 2] = i8;
 i11 = i7;
 HEAP32[i11 >> 2] = i9;
 HEAP32[i11 + 4 >> 2] = i10;
 if (!(FUNCTION_TABLE_iii[HEAP32[i4 >> 2] & 7](i6, i5) | 0)) {
  i11 = i1 + 2 | 0;
  return i11 | 0;
 }
 i10 = i5;
 i9 = HEAP32[i10 >> 2] | 0;
 i10 = HEAP32[i10 + 4 >> 2] | 0;
 i7 = i6;
 i8 = HEAP32[i7 + 4 >> 2] | 0;
 i11 = i5;
 HEAP32[i11 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i11 + 4 >> 2] = i8;
 i11 = i6;
 HEAP32[i11 >> 2] = i9;
 HEAP32[i11 + 4 >> 2] = i10;
 i11 = i1 + 3 | 0;
 return i11 | 0;
}

function __ZNK13b2DynamicTree5QueryI12b2BroadPhaseEEvPT_RK6b2AABB(i1, i2, i17) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i17 = i17 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i18 = 0, i19 = 0, i20 = 0;
 i20 = STACKTOP;
 STACKTOP = STACKTOP + 1040 | 0;
 i19 = i20;
 i18 = i19 + 4 | 0;
 HEAP32[i19 >> 2] = i18;
 i14 = i19 + 1028 | 0;
 i16 = i19 + 1032 | 0;
 HEAP32[i16 >> 2] = 256;
 HEAP32[i18 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i14 >> 2] = 1;
 i8 = i1 + 4 | 0;
 i9 = i17 + 4 | 0;
 i10 = i17 + 8 | 0;
 i11 = i17 + 12 | 0;
 i12 = i2 + 56 | 0;
 i13 = i2 + 52 | 0;
 i7 = i2 + 48 | 0;
 i6 = i2 + 44 | 0;
 i2 = 1;
 i1 = i18;
 do {
  i2 = i2 + -1 | 0;
  HEAP32[i14 >> 2] = i2;
  i5 = HEAP32[i1 + (i2 << 2) >> 2] | 0;
  do if ((i5 | 0) != -1 ? (i15 = HEAP32[i8 >> 2] | 0, !((+HEAPF32[i17 >> 2] - +HEAPF32[i15 + (i5 * 36 | 0) + 8 >> 2] > 0.0 ? 1 : +HEAPF32[i9 >> 2] - +HEAPF32[i15 + (i5 * 36 | 0) + 12 >> 2] > 0.0) | +HEAPF32[i15 + (i5 * 36 | 0) >> 2] - +HEAPF32[i10 >> 2] > 0.0 | +HEAPF32[i15 + (i5 * 36 | 0) + 4 >> 2] - +HEAPF32[i11 >> 2] > 0.0)) : 0) {
   i4 = i15 + (i5 * 36 | 0) + 24 | 0;
   if ((HEAP32[i4 >> 2] | 0) == -1) {
    i3 = HEAP32[i12 >> 2] | 0;
    if ((i3 | 0) == (i5 | 0)) break;
    i1 = HEAP32[i13 >> 2] | 0;
    if ((i1 | 0) == (HEAP32[i7 >> 2] | 0)) {
     i2 = HEAP32[i6 >> 2] | 0;
     HEAP32[i7 >> 2] = i1 << 1;
     i3 = _malloc(i1 << 4) | 0;
     HEAP32[i6 >> 2] = i3;
     _memcpy(i3 | 0, i2 | 0, i1 << 3 | 0) | 0;
     _free(i2);
     i2 = HEAP32[i14 >> 2] | 0;
     i3 = HEAP32[i12 >> 2] | 0;
     i1 = HEAP32[i13 >> 2] | 0;
    }
    i4 = HEAP32[i6 >> 2] | 0;
    HEAP32[i4 + (i1 << 3) >> 2] = (i3 | 0) > (i5 | 0) ? i5 : i3;
    HEAP32[i4 + (i1 << 3) + 4 >> 2] = (i3 | 0) < (i5 | 0) ? i5 : i3;
    HEAP32[i13 >> 2] = i1 + 1;
    break;
   }
   if ((i2 | 0) == (HEAP32[i16 >> 2] | 0)) {
    HEAP32[i16 >> 2] = i2 << 1;
    i3 = _malloc(i2 << 3) | 0;
    HEAP32[i19 >> 2] = i3;
    _memcpy(i3 | 0, i1 | 0, i2 << 2 | 0) | 0;
    if ((i1 | 0) == (i18 | 0)) i1 = i3; else {
     _free(i1);
     i1 = HEAP32[i19 >> 2] | 0;
     i2 = HEAP32[i14 >> 2] | 0;
    }
   }
   HEAP32[i1 + (i2 << 2) >> 2] = HEAP32[i4 >> 2];
   i2 = (HEAP32[i14 >> 2] | 0) + 1 | 0;
   HEAP32[i14 >> 2] = i2;
   i4 = i15 + (i5 * 36 | 0) + 28 | 0;
   if ((i2 | 0) == (HEAP32[i16 >> 2] | 0)) {
    HEAP32[i16 >> 2] = i2 << 1;
    i3 = _malloc(i2 << 3) | 0;
    HEAP32[i19 >> 2] = i3;
    _memcpy(i3 | 0, i1 | 0, i2 << 2 | 0) | 0;
    if ((i1 | 0) == (i18 | 0)) i1 = i3; else {
     _free(i1);
     i1 = HEAP32[i19 >> 2] | 0;
     i2 = HEAP32[i14 >> 2] | 0;
    }
   }
   HEAP32[i1 + (i2 << 2) >> 2] = HEAP32[i4 >> 2];
   i2 = (HEAP32[i14 >> 2] | 0) + 1 | 0;
   HEAP32[i14 >> 2] = i2;
  } while (0);
  i1 = HEAP32[i19 >> 2] | 0;
 } while ((i2 | 0) > 0);
 if ((i1 | 0) == (i18 | 0)) {
  STACKTOP = i20;
  return;
 }
 _free(i1);
 HEAP32[i19 >> 2] = 0;
 STACKTOP = i20;
 return;
}

function __ZN6b2Body13CreateFixtureEPK12b2FixtureDef(i14, i10) {
 i14 = i14 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i11 = 0, i12 = 0, i13 = 0;
 i11 = i14 + 88 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 if (HEAP32[i1 + 102872 >> 2] & 2) ___assert_fail(5957, 5701, 194, 6036);
 i2 = i1 + 4 | 0;
 i9 = __ZN16b2BlockAllocator8AllocateEi(i2, 44) | 0;
 i1 = i9 + 32 | 0;
 HEAP16[i1 >> 1] = 1;
 HEAP16[i9 + 34 >> 1] = -1;
 HEAP16[i9 + 36 >> 1] = 0;
 i4 = i9 + 24 | 0;
 HEAP32[i4 >> 2] = 0;
 i5 = i9 + 28 | 0;
 HEAP32[i5 >> 2] = 0;
 HEAP32[i9 >> 2] = 0;
 HEAP32[i9 + 4 >> 2] = 0;
 HEAP32[i9 + 8 >> 2] = 0;
 HEAP32[i9 + 12 >> 2] = 0;
 HEAP32[i9 + 40 >> 2] = HEAP32[i10 + 4 >> 2];
 HEAP32[i9 + 16 >> 2] = HEAP32[i10 + 8 >> 2];
 HEAP32[i9 + 20 >> 2] = HEAP32[i10 + 12 >> 2];
 i6 = i9 + 8 | 0;
 HEAP32[i6 >> 2] = i14;
 i7 = i9 + 4 | 0;
 HEAP32[i7 >> 2] = 0;
 i8 = i10 + 22 | 0;
 HEAP16[i1 >> 1] = HEAP16[i8 >> 1] | 0;
 HEAP16[i1 + 2 >> 1] = HEAP16[i8 + 2 >> 1] | 0;
 HEAP16[i1 + 4 >> 1] = HEAP16[i8 + 4 >> 1] | 0;
 HEAP8[i9 + 38 >> 0] = HEAP8[i10 + 20 >> 0] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 i1 = FUNCTION_TABLE_iii[HEAP32[(HEAP32[i1 >> 2] | 0) + 8 >> 2] & 7](i1, i2) | 0;
 i8 = i9 + 12 | 0;
 HEAP32[i8 >> 2] = i1;
 i1 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i1 >> 2] | 0) + 12 >> 2] & 7](i1) | 0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i2, i1 * 28 | 0) | 0;
 HEAP32[i4 >> 2] = i2;
 if ((i1 | 0) > 0) {
  i3 = 0;
  do {
   HEAP32[i2 + (i3 * 28 | 0) + 16 >> 2] = 0;
   HEAP32[i2 + (i3 * 28 | 0) + 24 >> 2] = -1;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i1 | 0));
 }
 HEAP32[i5 >> 2] = 0;
 HEAP32[i9 >> 2] = HEAP32[i10 + 16 >> 2];
 if ((HEAP16[i14 + 4 >> 1] & 32) != 0 ? (i12 = (HEAP32[i11 >> 2] | 0) + 102876 | 0, i13 = i14 + 12 | 0, i10 = HEAP32[i8 >> 2] | 0, i10 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i10 >> 2] | 0) + 12 >> 2] & 7](i10) | 0, HEAP32[i5 >> 2] = i10, (i10 | 0) > 0) : 0) {
  i1 = 0;
  do {
   i10 = HEAP32[i4 >> 2] | 0;
   i3 = i10 + (i1 * 28 | 0) | 0;
   i2 = HEAP32[i8 >> 2] | 0;
   FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i2 >> 2] | 0) + 24 >> 2] & 31](i2, i3, i13, i1);
   HEAP32[i10 + (i1 * 28 | 0) + 24 >> 2] = __ZN12b2BroadPhase11CreateProxyERK6b2AABBPv(i12, i3, i3) | 0;
   HEAP32[i10 + (i1 * 28 | 0) + 16 >> 2] = i9;
   HEAP32[i10 + (i1 * 28 | 0) + 20 >> 2] = i1;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < (HEAP32[i5 >> 2] | 0));
 }
 i13 = i14 + 100 | 0;
 HEAP32[i7 >> 2] = HEAP32[i13 >> 2];
 HEAP32[i13 >> 2] = i9;
 i13 = i14 + 104 | 0;
 HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 1;
 HEAP32[i6 >> 2] = i14;
 if (!(+HEAPF32[i9 >> 2] > 0.0)) {
  i14 = HEAP32[i11 >> 2] | 0;
  i14 = i14 + 102872 | 0;
  i13 = HEAP32[i14 >> 2] | 0;
  i13 = i13 | 1;
  HEAP32[i14 >> 2] = i13;
  return i9 | 0;
 }
 __ZN6b2Body13ResetMassDataEv(i14);
 i14 = HEAP32[i11 >> 2] | 0;
 i14 = i14 + 102872 | 0;
 i13 = HEAP32[i14 >> 2] | 0;
 i13 = i13 | 1;
 HEAP32[i14 >> 2] = i13;
 return i9 | 0;
}

function __ZN9b2Contact6UpdateEP17b2ContactListener(i17, i15) {
 i17 = i17 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i18 = 0;
 i18 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i16 = i18;
 i5 = i17 + 64 | 0;
 i1 = i16;
 i2 = i5;
 i3 = i1 + 64 | 0;
 do {
  HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
  i1 = i1 + 4 | 0;
  i2 = i2 + 4 | 0;
 } while ((i1 | 0) < (i3 | 0));
 i13 = i17 + 4 | 0;
 i10 = HEAP32[i13 >> 2] | 0;
 HEAP32[i13 >> 2] = i10 | 4;
 i10 = i10 >>> 1;
 i4 = HEAP32[i17 + 48 >> 2] | 0;
 i1 = HEAP32[i17 + 52 >> 2] | 0;
 i14 = (HEAP8[i1 + 38 >> 0] | HEAP8[i4 + 38 >> 0]) << 24 >> 24 != 0;
 i11 = HEAP32[i4 + 8 >> 2] | 0;
 i12 = HEAP32[i1 + 8 >> 2] | 0;
 i2 = i11 + 12 | 0;
 i3 = i12 + 12 | 0;
 if (!i14) {
  FUNCTION_TABLE_viiii[HEAP32[HEAP32[i17 >> 2] >> 2] & 31](i17, i5, i2, i3);
  i3 = i17 + 124 | 0;
  i4 = (HEAP32[i3 >> 2] | 0) > 0;
  if (i4) {
   i5 = HEAP32[i16 + 60 >> 2] | 0;
   i6 = (i5 | 0) > 0;
   i9 = 0;
   do {
    i7 = i17 + 64 + (i9 * 20 | 0) + 8 | 0;
    HEAPF32[i7 >> 2] = 0.0;
    i8 = i17 + 64 + (i9 * 20 | 0) + 12 | 0;
    HEAPF32[i8 >> 2] = 0.0;
    i2 = HEAP32[i17 + 64 + (i9 * 20 | 0) + 16 >> 2] | 0;
    L8 : do if (i6) {
     i1 = 0;
     while (1) {
      if ((HEAP32[i16 + (i1 * 20 | 0) + 16 >> 2] | 0) == (i2 | 0)) break;
      i1 = i1 + 1 | 0;
      if ((i1 | 0) >= (i5 | 0)) break L8;
     }
     HEAP32[i7 >> 2] = HEAP32[i16 + (i1 * 20 | 0) + 8 >> 2];
     HEAP32[i8 >> 2] = HEAP32[i16 + (i1 * 20 | 0) + 12 >> 2];
    } while (0);
    i9 = i9 + 1 | 0;
   } while ((i9 | 0) < (HEAP32[i3 >> 2] | 0));
  }
  i1 = i10 & 1;
  if ((i1 | 0) != 0 ^ i4) {
   i2 = i11 + 4 | 0;
   i3 = HEAPU16[i2 >> 1] | 0;
   if (!(i3 & 2)) {
    HEAP16[i2 >> 1] = i3 | 2;
    HEAPF32[i11 + 144 >> 2] = 0.0;
    i11 = HEAP32[i11 + 88 >> 2] | 0;
    HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 1;
   }
   i2 = i12 + 4 | 0;
   i3 = HEAPU16[i2 >> 1] | 0;
   if (!(i3 & 2)) {
    HEAP16[i2 >> 1] = i3 | 2;
    HEAPF32[i12 + 144 >> 2] = 0.0;
    i12 = HEAP32[i12 + 88 >> 2] | 0;
    HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + 1;
   }
  }
 } else {
  i4 = __Z13b2TestOverlapPK7b2ShapeiS1_iRK11b2TransformS4_(HEAP32[i4 + 12 >> 2] | 0, HEAP32[i17 + 56 >> 2] | 0, HEAP32[i1 + 12 >> 2] | 0, HEAP32[i17 + 60 >> 2] | 0, i2, i3) | 0;
  HEAP32[i17 + 124 >> 2] = 0;
  i1 = i10 & 1;
 }
 i2 = HEAP32[i13 >> 2] | 0;
 HEAP32[i13 >> 2] = i4 ? i2 | 2 : i2 & -3;
 i1 = (i1 | 0) == 0;
 i2 = (i15 | 0) != 0;
 i3 = i2 & i4;
 if (i1 & i3) FUNCTION_TABLE_vii[HEAP32[(HEAP32[i15 >> 2] | 0) + 8 >> 2] & 15](i15, i17);
 if (i2 & (i4 ^ 1) & (i1 ^ 1)) FUNCTION_TABLE_vii[HEAP32[(HEAP32[i15 >> 2] | 0) + 12 >> 2] & 15](i15, i17);
 if (!(i3 & (i14 ^ 1))) {
  STACKTOP = i18;
  return;
 }
 FUNCTION_TABLE_viii[HEAP32[(HEAP32[i15 >> 2] | 0) + 16 >> 2] & 3](i15, i17, i16);
 STACKTOP = i18;
 return;
}

function __Z8cpp_drawv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i7 = HEAP32[180] | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 i7 = HEAP32[i7 + 4 >> 2] | 0;
 if ((i1 | 0) != (i7 | 0)) {
  i3 = 0;
  do {
   i5 = HEAP32[i1 >> 2] | 0;
   i6 = HEAP32[i5 + 148 >> 2] | 0;
   if (!(HEAP8[i6 + 8 >> 0] | 0)) {
    i4 = HEAP32[i6 >> 2] | 0;
    if (!(HEAP8[i4 >> 0] & 1)) i4 = i4 + 1 | 0; else i4 = HEAP32[i4 + 8 >> 2] | 0;
    _emscripten_asm_const_5(3, +(+HEAPF32[i5 + 12 >> 2]), +(+HEAPF32[i5 + 16 >> 2]), i4 | 0, +(+HEAPF32[i6 + 12 >> 2]), +(+HEAPF32[i5 + 56 >> 2])) | 0;
   } else i3 = 1;
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) != (i7 | 0));
  if (i3 ? (i8 = HEAP32[180] | 0, i2 = HEAP32[i8 >> 2] | 0, i8 = HEAP32[i8 + 4 >> 2] | 0, (i2 | 0) != (i8 | 0)) : 0) {
   do {
    i1 = HEAP32[i2 >> 2] | 0;
    i3 = HEAP32[i1 + 148 >> 2] | 0;
    if (HEAP8[i3 + 8 >> 0] | 0) _emscripten_asm_const_3(4, +(+HEAPF32[i1 + 12 >> 2]), +(+HEAPF32[i1 + 16 >> 2]), +(+HEAPF32[i3 + 12 >> 2])) | 0;
    i2 = i2 + 4 | 0;
   } while ((i2 | 0) != (i8 | 0));
   i4 = HEAP32[180] | 0;
   i1 = HEAP32[i4 >> 2] | 0;
   i4 = HEAP32[i4 + 4 >> 2] | 0;
   if ((i1 | 0) != (i4 | 0)) {
    do {
     i2 = HEAP32[i1 >> 2] | 0;
     i3 = HEAP32[i2 + 148 >> 2] | 0;
     if (HEAP8[i3 + 8 >> 0] | 0) _emscripten_asm_const_3(5, +(+HEAPF32[i2 + 12 >> 2]), +(+HEAPF32[i2 + 16 >> 2]), +(+HEAPF32[i3 + 12 >> 2])) | 0;
     i1 = i1 + 4 | 0;
    } while ((i1 | 0) != (i4 | 0));
    i5 = HEAP32[180] | 0;
    i1 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if ((i1 | 0) != (i5 | 0)) {
     do {
      i3 = HEAP32[i1 >> 2] | 0;
      i4 = HEAP32[i3 + 148 >> 2] | 0;
      if (HEAP8[i4 + 8 >> 0] | 0) {
       i2 = HEAP32[i4 >> 2] | 0;
       if (!(HEAP8[i2 >> 0] & 1)) i2 = i2 + 1 | 0; else i2 = HEAP32[i2 + 8 >> 2] | 0;
       _emscripten_asm_const_5(3, +(+HEAPF32[i3 + 12 >> 2]), +(+HEAPF32[i3 + 16 >> 2]), i2 | 0, +(+HEAPF32[i4 + 12 >> 2]), +(+HEAPF32[i3 + 56 >> 2])) | 0;
      }
      i1 = i1 + 4 | 0;
     } while ((i1 | 0) != (i5 | 0));
     i4 = HEAP32[180] | 0;
     i1 = HEAP32[i4 >> 2] | 0;
     i4 = HEAP32[i4 + 4 >> 2] | 0;
     if ((i1 | 0) != (i4 | 0)) do {
      i2 = HEAP32[i1 >> 2] | 0;
      i3 = HEAP32[i2 + 148 >> 2] | 0;
      if (HEAP8[i3 + 8 >> 0] | 0) _emscripten_asm_const_3(6, +(+HEAPF32[i2 + 12 >> 2]), +(+HEAPF32[i2 + 16 >> 2]), +(+HEAPF32[i3 + 12 >> 2] + .01)) | 0;
      i1 = i1 + 4 | 0;
     } while ((i1 | 0) != (i4 | 0));
    }
   }
  }
 }
 i2 = HEAP32[180] | 0;
 i1 = HEAP32[i2 + 40 >> 2] | 0;
 if ((HEAP32[i2 + 44 >> 2] | 0) == (i1 | 0)) return; else i3 = 0;
 do {
  i1 = HEAP32[i1 + (i3 << 2) >> 2] | 0;
  if (i1) {
   FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 12 >> 2] & 63](i1);
   i2 = HEAP32[180] | 0;
  }
  i3 = i3 + 1 | 0;
  i1 = HEAP32[i2 + 40 >> 2] | 0;
 } while (i3 >>> 0 < (HEAP32[i2 + 44 >> 2] | 0) - i1 >> 2 >>> 0);
 return;
}

function __ZN15b2ContactSolver9WarmStartEv(i1) {
 i1 = i1 | 0;
 var d2 = 0.0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, d24 = 0.0, d25 = 0.0, d26 = 0.0;
 i22 = i1 + 48 | 0;
 if ((HEAP32[i22 >> 2] | 0) <= 0) return;
 i23 = i1 + 40 | 0;
 i18 = i1 + 28 | 0;
 i5 = HEAP32[i18 >> 2] | 0;
 i21 = 0;
 do {
  i15 = HEAP32[i23 >> 2] | 0;
  i19 = HEAP32[i15 + (i21 * 156 | 0) + 112 >> 2] | 0;
  i20 = HEAP32[i15 + (i21 * 156 | 0) + 116 >> 2] | 0;
  d10 = +HEAPF32[i15 + (i21 * 156 | 0) + 120 >> 2];
  d11 = +HEAPF32[i15 + (i21 * 156 | 0) + 128 >> 2];
  d12 = +HEAPF32[i15 + (i21 * 156 | 0) + 124 >> 2];
  d13 = +HEAPF32[i15 + (i21 * 156 | 0) + 132 >> 2];
  i14 = HEAP32[i15 + (i21 * 156 | 0) + 148 >> 2] | 0;
  i16 = i5 + (i19 * 12 | 0) | 0;
  i1 = HEAP32[i16 >> 2] | 0;
  i17 = i5 + (i19 * 12 | 0) + 4 | 0;
  i6 = HEAP32[i17 >> 2] | 0;
  d3 = +HEAPF32[i5 + (i19 * 12 | 0) + 8 >> 2];
  i4 = HEAP32[i5 + (i20 * 12 | 0) >> 2] | 0;
  i7 = HEAP32[i5 + (i20 * 12 | 0) + 4 >> 2] | 0;
  d2 = +HEAPF32[i5 + (i20 * 12 | 0) + 8 >> 2];
  d8 = +HEAPF32[i15 + (i21 * 156 | 0) + 72 >> 2];
  d9 = +HEAPF32[i15 + (i21 * 156 | 0) + 76 >> 2];
  if ((i14 | 0) > 0) {
   i5 = i7;
   i7 = 0;
   do {
    d26 = +HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) + 16 >> 2];
    d24 = +HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) + 20 >> 2];
    d25 = d8 * d26 + d9 * d24;
    d24 = d9 * d26 - d8 * d24;
    d3 = d3 - d11 * (+HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) >> 2] * d24 - +HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) + 4 >> 2] * d25);
    i1 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]) - d10 * d25, HEAP32[tempDoublePtr >> 2] | 0);
    i6 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]) - d10 * d24, HEAP32[tempDoublePtr >> 2] | 0);
    d2 = d2 + d13 * (d24 * +HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) + 8 >> 2] - d25 * +HEAPF32[i15 + (i21 * 156 | 0) + (i7 * 36 | 0) + 12 >> 2]);
    i4 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]) + d12 * d25, HEAP32[tempDoublePtr >> 2] | 0);
    i5 = (HEAPF32[tempDoublePtr >> 2] = (HEAP32[tempDoublePtr >> 2] = i5, +HEAPF32[tempDoublePtr >> 2]) + d12 * d24, HEAP32[tempDoublePtr >> 2] | 0);
    i7 = i7 + 1 | 0;
   } while ((i7 | 0) != (i14 | 0));
  } else i5 = i7;
  HEAP32[i16 >> 2] = i1;
  HEAP32[i17 >> 2] = i6;
  i17 = HEAP32[i18 >> 2] | 0;
  HEAPF32[i17 + (i19 * 12 | 0) + 8 >> 2] = d3;
  HEAP32[i17 + (i20 * 12 | 0) >> 2] = i4;
  HEAP32[i17 + (i20 * 12 | 0) + 4 >> 2] = i5;
  i5 = HEAP32[i18 >> 2] | 0;
  HEAPF32[i5 + (i20 * 12 | 0) + 8 >> 2] = d2;
  i21 = i21 + 1 | 0;
 } while ((i21 | 0) < (HEAP32[i22 >> 2] | 0));
 return;
}

function __ZNK13b2DynamicTree5QueryI19b2WorldQueryWrapperEEvPT_RK6b2AABB(i1, i15, i14) {
 i1 = i1 | 0;
 i15 = i15 | 0;
 i14 = i14 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i16 = 0, i17 = 0, i18 = 0;
 i18 = STACKTOP;
 STACKTOP = STACKTOP + 1040 | 0;
 i17 = i18;
 i16 = i17 + 4 | 0;
 HEAP32[i17 >> 2] = i16;
 i11 = i17 + 1028 | 0;
 i13 = i17 + 1032 | 0;
 HEAP32[i13 >> 2] = 256;
 HEAP32[i16 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i11 >> 2] = 1;
 i6 = i1 + 4 | 0;
 i7 = i14 + 4 | 0;
 i8 = i14 + 8 | 0;
 i9 = i14 + 12 | 0;
 i10 = i15 + 4 | 0;
 i1 = 1;
 i3 = i16;
 L1 : while (1) {
  i1 = i1 + -1 | 0;
  HEAP32[i11 >> 2] = i1;
  i5 = HEAP32[i3 + (i1 << 2) >> 2] | 0;
  do if ((i5 | 0) != -1 ? (i12 = HEAP32[i6 >> 2] | 0, !((+HEAPF32[i14 >> 2] - +HEAPF32[i12 + (i5 * 36 | 0) + 8 >> 2] > 0.0 ? 1 : +HEAPF32[i7 >> 2] - +HEAPF32[i12 + (i5 * 36 | 0) + 12 >> 2] > 0.0) | +HEAPF32[i12 + (i5 * 36 | 0) >> 2] - +HEAPF32[i8 >> 2] > 0.0 | +HEAPF32[i12 + (i5 * 36 | 0) + 4 >> 2] - +HEAPF32[i9 >> 2] > 0.0)) : 0) {
   i4 = i12 + (i5 * 36 | 0) + 24 | 0;
   if ((HEAP32[i4 >> 2] | 0) == -1) {
    i1 = HEAP32[i15 >> 2] | 0;
    if ((i5 | 0) <= -1) {
     i1 = 7;
     break L1;
    }
    if ((HEAP32[i1 + 12 >> 2] | 0) <= (i5 | 0)) {
     i1 = 7;
     break L1;
    }
    i4 = HEAP32[i10 >> 2] | 0;
    if (!(FUNCTION_TABLE_iii[HEAP32[(HEAP32[i4 >> 2] | 0) + 8 >> 2] & 7](i4, HEAP32[(HEAP32[(HEAP32[i1 + 4 >> 2] | 0) + (i5 * 36 | 0) + 16 >> 2] | 0) + 16 >> 2] | 0) | 0)) {
     i1 = 19;
     break L1;
    }
    i1 = HEAP32[i11 >> 2] | 0;
    break;
   }
   if ((i1 | 0) == (HEAP32[i13 >> 2] | 0)) {
    HEAP32[i13 >> 2] = i1 << 1;
    i2 = _malloc(i1 << 3) | 0;
    HEAP32[i17 >> 2] = i2;
    _memcpy(i2 | 0, i3 | 0, i1 << 2 | 0) | 0;
    if ((i3 | 0) == (i16 | 0)) i3 = i2; else {
     _free(i3);
     i3 = HEAP32[i17 >> 2] | 0;
     i1 = HEAP32[i11 >> 2] | 0;
    }
   }
   HEAP32[i3 + (i1 << 2) >> 2] = HEAP32[i4 >> 2];
   i1 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
   HEAP32[i11 >> 2] = i1;
   i4 = i12 + (i5 * 36 | 0) + 28 | 0;
   if ((i1 | 0) == (HEAP32[i13 >> 2] | 0)) {
    HEAP32[i13 >> 2] = i1 << 1;
    i2 = _malloc(i1 << 3) | 0;
    HEAP32[i17 >> 2] = i2;
    _memcpy(i2 | 0, i3 | 0, i1 << 2 | 0) | 0;
    if ((i3 | 0) != (i16 | 0)) {
     _free(i3);
     i2 = HEAP32[i17 >> 2] | 0;
     i1 = HEAP32[i11 >> 2] | 0;
    }
   } else i2 = i3;
   HEAP32[i2 + (i1 << 2) >> 2] = HEAP32[i4 >> 2];
   i1 = (HEAP32[i11 >> 2] | 0) + 1 | 0;
   HEAP32[i11 >> 2] = i1;
  } while (0);
  if ((i1 | 0) <= 0) {
   i1 = 19;
   break;
  }
  i3 = HEAP32[i17 >> 2] | 0;
 }
 if ((i1 | 0) == 7) ___assert_fail(4410, 6198, 158, 8074); else if ((i1 | 0) == 19) {
  i1 = HEAP32[i17 >> 2] | 0;
  if ((i1 | 0) == (i16 | 0)) {
   STACKTOP = i18;
   return;
  }
  _free(i1);
  HEAP32[i17 >> 2] = 0;
  STACKTOP = i18;
  return;
 }
}

function __ZNSt3__118__insertion_sort_3IRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i7, i8, i6) {
 i7 = i7 | 0;
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i9 = i10;
 i1 = i7 + 16 | 0;
 i2 = i7 + 8 | 0;
 i5 = FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i2, i7) | 0;
 i3 = FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i1, i2) | 0;
 do if (i5) {
  i5 = i7;
  i4 = HEAP32[i5 >> 2] | 0;
  i5 = HEAP32[i5 + 4 >> 2] | 0;
  if (i3) {
   i11 = i1;
   i2 = HEAP32[i11 + 4 >> 2] | 0;
   i3 = i7;
   HEAP32[i3 >> 2] = HEAP32[i11 >> 2];
   HEAP32[i3 + 4 >> 2] = i2;
   i3 = i1;
   HEAP32[i3 >> 2] = i4;
   HEAP32[i3 + 4 >> 2] = i5;
   break;
  }
  i12 = i2;
  i3 = HEAP32[i12 + 4 >> 2] | 0;
  i11 = i7;
  HEAP32[i11 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i11 + 4 >> 2] = i3;
  i11 = i2;
  HEAP32[i11 >> 2] = i4;
  HEAP32[i11 + 4 >> 2] = i5;
  if (FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i1, i2) | 0) {
   i11 = i2;
   i5 = HEAP32[i11 >> 2] | 0;
   i11 = HEAP32[i11 + 4 >> 2] | 0;
   i3 = i1;
   i4 = HEAP32[i3 + 4 >> 2] | 0;
   i12 = i2;
   HEAP32[i12 >> 2] = HEAP32[i3 >> 2];
   HEAP32[i12 + 4 >> 2] = i4;
   i12 = i1;
   HEAP32[i12 >> 2] = i5;
   HEAP32[i12 + 4 >> 2] = i11;
  }
 } else if (i3 ? (i11 = i2, i5 = HEAP32[i11 >> 2] | 0, i11 = HEAP32[i11 + 4 >> 2] | 0, i3 = i1, i4 = HEAP32[i3 + 4 >> 2] | 0, i12 = i2, HEAP32[i12 >> 2] = HEAP32[i3 >> 2], HEAP32[i12 + 4 >> 2] = i4, i12 = i1, HEAP32[i12 >> 2] = i5, HEAP32[i12 + 4 >> 2] = i11, FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i2, i7) | 0) : 0) {
  i11 = i7;
  i5 = HEAP32[i11 >> 2] | 0;
  i11 = HEAP32[i11 + 4 >> 2] | 0;
  i3 = i2;
  i4 = HEAP32[i3 + 4 >> 2] | 0;
  i12 = i7;
  HEAP32[i12 >> 2] = HEAP32[i3 >> 2];
  HEAP32[i12 + 4 >> 2] = i4;
  i12 = i2;
  HEAP32[i12 >> 2] = i5;
  HEAP32[i12 + 4 >> 2] = i11;
 } while (0);
 i2 = i7 + 24 | 0;
 if ((i2 | 0) == (i8 | 0)) {
  STACKTOP = i10;
  return;
 }
 while (1) {
  if (FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i2, i1) | 0) {
   i11 = i2;
   i12 = HEAP32[i11 + 4 >> 2] | 0;
   i3 = i9;
   HEAP32[i3 >> 2] = HEAP32[i11 >> 2];
   HEAP32[i3 + 4 >> 2] = i12;
   i3 = i2;
   while (1) {
    i5 = i1;
    i11 = HEAP32[i5 + 4 >> 2] | 0;
    i12 = i3;
    HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
    HEAP32[i12 + 4 >> 2] = i11;
    if ((i1 | 0) == (i7 | 0)) break;
    i3 = i1 + -8 | 0;
    if (FUNCTION_TABLE_iii[HEAP32[i6 >> 2] & 7](i9, i3) | 0) {
     i12 = i1;
     i1 = i3;
     i3 = i12;
    } else break;
   }
   i5 = i9;
   i11 = HEAP32[i5 + 4 >> 2] | 0;
   i12 = i1;
   HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
   HEAP32[i12 + 4 >> 2] = i11;
  }
  i1 = i2 + 8 | 0;
  if ((i1 | 0) == (i8 | 0)) break; else {
   i12 = i2;
   i2 = i1;
   i1 = i12;
  }
 }
 STACKTOP = i10;
 return;
}

function __ZN13b2DynamicTree10RemoveLeafEi(i8, i3) {
 i8 = i8 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0;
 if ((HEAP32[i8 >> 2] | 0) == (i3 | 0)) {
  HEAP32[i8 >> 2] = -1;
  return;
 }
 i4 = i8 + 4 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i6 = HEAP32[i5 + (i3 * 36 | 0) + 20 >> 2] | 0;
 i7 = i5 + (i6 * 36 | 0) + 20 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 i2 = HEAP32[i5 + (i6 * 36 | 0) + 24 >> 2] | 0;
 if ((i2 | 0) == (i3 | 0)) i3 = HEAP32[i5 + (i6 * 36 | 0) + 28 >> 2] | 0; else i3 = i2;
 if ((i1 | 0) == -1) {
  HEAP32[i8 >> 2] = i3;
  HEAP32[i5 + (i3 * 36 | 0) + 20 >> 2] = -1;
  if ((i6 | 0) <= -1) ___assert_fail(4535, 4451, 94, 4574);
  if ((HEAP32[i8 + 12 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4535, 4451, 94, 4574);
  i1 = i8 + 8 | 0;
  if ((HEAP32[i1 >> 2] | 0) <= 0) ___assert_fail(4583, 4451, 95, 4574);
  i8 = i8 + 16 | 0;
  HEAP32[i7 >> 2] = HEAP32[i8 >> 2];
  HEAP32[i5 + (i6 * 36 | 0) + 32 >> 2] = -1;
  HEAP32[i8 >> 2] = i6;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + -1;
  return;
 }
 i2 = i5 + (i1 * 36 | 0) + 24 | 0;
 if ((HEAP32[i2 >> 2] | 0) == (i6 | 0)) HEAP32[i2 >> 2] = i3; else HEAP32[i5 + (i1 * 36 | 0) + 28 >> 2] = i3;
 HEAP32[i5 + (i3 * 36 | 0) + 20 >> 2] = i1;
 if ((i6 | 0) <= -1) ___assert_fail(4535, 4451, 94, 4574);
 if ((HEAP32[i8 + 12 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4535, 4451, 94, 4574);
 i2 = i8 + 8 | 0;
 if ((HEAP32[i2 >> 2] | 0) <= 0) ___assert_fail(4583, 4451, 95, 4574);
 i3 = i8 + 16 | 0;
 HEAP32[i7 >> 2] = HEAP32[i3 >> 2];
 HEAP32[i5 + (i6 * 36 | 0) + 32 >> 2] = -1;
 HEAP32[i3 >> 2] = i6;
 HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + -1;
 do {
  i7 = __ZN13b2DynamicTree7BalanceEi(i8, i1) | 0;
  i6 = HEAP32[i4 >> 2] | 0;
  i3 = HEAP32[i6 + (i7 * 36 | 0) + 24 >> 2] | 0;
  i5 = HEAP32[i6 + (i7 * 36 | 0) + 28 >> 2] | 0;
  d9 = +HEAPF32[i6 + (i3 * 36 | 0) >> 2];
  d10 = +HEAPF32[i6 + (i5 * 36 | 0) >> 2];
  d11 = +HEAPF32[i6 + (i3 * 36 | 0) + 4 >> 2];
  d12 = +HEAPF32[i6 + (i5 * 36 | 0) + 4 >> 2];
  HEAPF32[i6 + (i7 * 36 | 0) >> 2] = d9 < d10 ? d9 : d10;
  HEAPF32[i6 + (i7 * 36 | 0) + 4 >> 2] = d11 < d12 ? d11 : d12;
  d12 = +HEAPF32[i6 + (i3 * 36 | 0) + 8 >> 2];
  d11 = +HEAPF32[i6 + (i5 * 36 | 0) + 8 >> 2];
  d10 = +HEAPF32[i6 + (i3 * 36 | 0) + 12 >> 2];
  d9 = +HEAPF32[i6 + (i5 * 36 | 0) + 12 >> 2];
  HEAPF32[i6 + (i7 * 36 | 0) + 8 >> 2] = d12 > d11 ? d12 : d11;
  HEAPF32[i6 + (i7 * 36 | 0) + 12 >> 2] = d10 > d9 ? d10 : d9;
  i6 = HEAP32[i4 >> 2] | 0;
  i3 = HEAP32[i6 + (i3 * 36 | 0) + 32 >> 2] | 0;
  i5 = HEAP32[i6 + (i5 * 36 | 0) + 32 >> 2] | 0;
  HEAP32[i6 + (i7 * 36 | 0) + 32 >> 2] = ((i3 | 0) > (i5 | 0) ? i3 : i5) + 1;
  i1 = HEAP32[i6 + (i7 * 36 | 0) + 20 >> 2] | 0;
 } while ((i1 | 0) != -1);
 return;
}

function __ZN12b2BroadPhase11UpdatePairsI16b2ContactManagerEEvPT_(i12, i17) {
 i12 = i12 | 0;
 i17 = i17 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i18 = 0;
 i18 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i10 = i18;
 i15 = i12 + 52 | 0;
 HEAP32[i15 >> 2] = 0;
 i9 = i12 + 40 | 0;
 i2 = HEAP32[i9 >> 2] | 0;
 do if ((i2 | 0) > 0) {
  i5 = i12 + 32 | 0;
  i6 = i12 + 56 | 0;
  i7 = i12 + 12 | 0;
  i8 = i12 + 4 | 0;
  i4 = 0;
  while (1) {
   i3 = HEAP32[(HEAP32[i5 >> 2] | 0) + (i4 << 2) >> 2] | 0;
   HEAP32[i6 >> 2] = i3;
   if ((i3 | 0) != -1) {
    if ((i3 | 0) <= -1) {
     i2 = 6;
     break;
    }
    if ((HEAP32[i7 >> 2] | 0) <= (i3 | 0)) {
     i2 = 6;
     break;
    }
    __ZNK13b2DynamicTree5QueryI12b2BroadPhaseEEvPT_RK6b2AABB(i12, i12, (HEAP32[i8 >> 2] | 0) + (i3 * 36 | 0) | 0);
    i2 = HEAP32[i9 >> 2] | 0;
   }
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= (i2 | 0)) {
    i2 = 9;
    break;
   }
  }
  if ((i2 | 0) == 6) ___assert_fail(4410, 6198, 164, 6252); else if ((i2 | 0) == 9) {
   i11 = HEAP32[i15 >> 2] | 0;
   break;
  }
 } else i11 = 0; while (0);
 HEAP32[i9 >> 2] = 0;
 i8 = i12 + 44 | 0;
 i9 = HEAP32[i8 >> 2] | 0;
 HEAP32[i10 >> 2] = 5;
 __ZNSt3__16__sortIRPFbRK6b2PairS3_EPS1_EEvT0_S8_T_(i9, i9 + (i11 << 3) | 0, i10);
 if ((HEAP32[i15 >> 2] | 0) <= 0) {
  STACKTOP = i18;
  return;
 }
 i7 = i12 + 12 | 0;
 i6 = i12 + 4 | 0;
 i2 = HEAP32[i8 >> 2] | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if ((i3 | 0) > -1) {
  i14 = i3;
  i13 = i2;
  i16 = i2;
  i1 = 0;
 } else ___assert_fail(4410, 6198, 158, 8074);
 L20 : while (1) {
  i3 = HEAP32[i7 >> 2] | 0;
  if ((i3 | 0) <= (i14 | 0)) {
   i2 = 14;
   break;
  }
  i4 = HEAP32[i6 >> 2] | 0;
  i5 = i13 + (i1 << 3) + 4 | 0;
  i2 = HEAP32[i5 >> 2] | 0;
  if (!((i2 | 0) > -1 & (i3 | 0) > (i2 | 0))) {
   i2 = 16;
   break;
  }
  __ZN16b2ContactManager7AddPairEPvS0_(i17, HEAP32[i4 + (i14 * 36 | 0) + 16 >> 2] | 0, HEAP32[i4 + (i2 * 36 | 0) + 16 >> 2] | 0);
  i3 = HEAP32[i15 >> 2] | 0;
  do {
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= (i3 | 0)) {
    i2 = 21;
    break L20;
   }
   i2 = HEAP32[i8 >> 2] | 0;
   if ((HEAP32[i2 + (i1 << 3) >> 2] | 0) != (HEAP32[i16 >> 2] | 0)) break;
  } while ((HEAP32[i2 + (i1 << 3) + 4 >> 2] | 0) == (HEAP32[i5 >> 2] | 0));
  i13 = HEAP32[i8 >> 2] | 0;
  i16 = i13 + (i1 << 3) | 0;
  i14 = HEAP32[i16 >> 2] | 0;
  if ((i14 | 0) <= -1) {
   i2 = 14;
   break;
  }
 }
 if ((i2 | 0) == 14) ___assert_fail(4410, 6198, 158, 8074); else if ((i2 | 0) == 16) ___assert_fail(4410, 6198, 158, 8074); else if ((i2 | 0) == 21) {
  STACKTOP = i18;
  return;
 }
}

function __ZN24b2ChainAndPolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i9, i8, i10, i11) {
 i9 = i9 | 0;
 i8 = i8 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i12 = 0, i13 = 0, i14 = 0;
 i12 = STACKTOP;
 STACKTOP = STACKTOP + 304 | 0;
 i6 = i12 + 48 | 0;
 i7 = i12;
 i4 = HEAP32[(HEAP32[i9 + 48 >> 2] | 0) + 12 >> 2] | 0;
 HEAP32[i7 >> 2] = 1308;
 i1 = i7 + 4 | 0;
 HEAP32[i1 >> 2] = 1;
 i2 = i7 + 8 | 0;
 HEAPF32[i2 >> 2] = .009999999776482582;
 i5 = i7 + 28 | 0;
 HEAP32[i5 >> 2] = 0;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAP32[i5 + 8 >> 2] = 0;
 HEAP32[i5 + 12 >> 2] = 0;
 HEAP16[i5 + 16 >> 1] = 0;
 i5 = HEAP32[i9 + 56 >> 2] | 0;
 if ((i5 | 0) <= -1) ___assert_fail(4179, 3964, 116, 4213);
 i3 = HEAP32[i4 + 16 >> 2] | 0;
 if ((i3 + -1 | 0) <= (i5 | 0)) ___assert_fail(4179, 3964, 116, 4213);
 HEAP32[i1 >> 2] = 1;
 HEAP32[i2 >> 2] = HEAP32[i4 + 8 >> 2];
 i2 = HEAP32[i4 + 12 >> 2] | 0;
 i1 = i2 + (i5 << 3) | 0;
 i13 = HEAP32[i1 + 4 >> 2] | 0;
 i14 = i7 + 12 | 0;
 HEAP32[i14 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i14 + 4 >> 2] = i13;
 i14 = i2 + (i5 + 1 << 3) | 0;
 i13 = HEAP32[i14 + 4 >> 2] | 0;
 i1 = i7 + 20 | 0;
 HEAP32[i1 >> 2] = HEAP32[i14 >> 2];
 HEAP32[i1 + 4 >> 2] = i13;
 i1 = i7 + 28 | 0;
 if ((i5 | 0) > 0) {
  i13 = i2 + (i5 + -1 << 3) | 0;
  i14 = HEAP32[i13 + 4 >> 2] | 0;
  HEAP32[i1 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i1 + 4 >> 2] = i14;
  i1 = 1;
 } else {
  i13 = i4 + 20 | 0;
  i14 = HEAP32[i13 + 4 >> 2] | 0;
  HEAP32[i1 >> 2] = HEAP32[i13 >> 2];
  HEAP32[i1 + 4 >> 2] = i14;
  i1 = HEAP8[i4 + 36 >> 0] | 0;
 }
 HEAP8[i7 + 44 >> 0] = i1;
 i1 = i7 + 36 | 0;
 if ((i3 + -2 | 0) > (i5 | 0)) {
  i5 = i2 + (i5 + 2 << 3) | 0;
  i14 = HEAP32[i5 + 4 >> 2] | 0;
  i13 = i1;
  HEAP32[i13 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i13 + 4 >> 2] = i14;
  i13 = 1;
  i14 = i7 + 45 | 0;
  HEAP8[i14 >> 0] = i13;
  i14 = i9 + 52 | 0;
  i14 = HEAP32[i14 >> 2] | 0;
  i14 = i14 + 12 | 0;
  i14 = HEAP32[i14 >> 2] | 0;
  __ZN12b2EPCollider7CollideEP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK14b2PolygonShapeS7_(i6, i8, i7, i10, i14, i11);
  STACKTOP = i12;
  return;
 } else {
  i5 = i4 + 28 | 0;
  i14 = HEAP32[i5 + 4 >> 2] | 0;
  i13 = i1;
  HEAP32[i13 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i13 + 4 >> 2] = i14;
  i13 = HEAP8[i4 + 37 >> 0] | 0;
  i14 = i7 + 45 | 0;
  HEAP8[i14 >> 0] = i13;
  i14 = i9 + 52 | 0;
  i14 = HEAP32[i14 >> 2] | 0;
  i14 = i14 + 12 | 0;
  i14 = HEAP32[i14 >> 2] | 0;
  __ZN12b2EPCollider7CollideEP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK14b2PolygonShapeS7_(i6, i8, i7, i10, i14, i11);
  STACKTOP = i12;
  return;
 }
}

function __ZN9b2Simplex6Solve3Ev(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0;
 d16 = +HEAPF32[i3 + 16 >> 2];
 d14 = +HEAPF32[i3 + 20 >> 2];
 i1 = i3 + 36 | 0;
 d13 = +HEAPF32[i3 + 52 >> 2];
 d15 = +HEAPF32[i3 + 56 >> 2];
 i2 = i3 + 72 | 0;
 d17 = +HEAPF32[i3 + 88 >> 2];
 d11 = +HEAPF32[i3 + 92 >> 2];
 d19 = d13 - d16;
 d10 = d15 - d14;
 d4 = d16 * d19 + d14 * d10;
 d5 = d13 * d19 + d15 * d10;
 d12 = d17 - d16;
 d18 = d11 - d14;
 d6 = d16 * d12 + d14 * d18;
 d7 = d17 * d12 + d11 * d18;
 d20 = d17 - d13;
 d9 = d11 - d15;
 d8 = d13 * d20 + d15 * d9;
 d9 = d17 * d20 + d11 * d9;
 d12 = d19 * d18 - d10 * d12;
 d10 = (d13 * d11 - d15 * d17) * d12;
 d11 = (d14 * d17 - d16 * d11) * d12;
 d12 = (d16 * d15 - d14 * d13) * d12;
 if (d4 >= -0.0 & d6 >= -0.0) {
  HEAPF32[i3 + 24 >> 2] = 1.0;
  HEAP32[i3 + 108 >> 2] = 1;
  return;
 }
 if (d5 > 0.0 & d4 < -0.0 & d12 <= 0.0) {
  d20 = 1.0 / (d5 - d4);
  HEAPF32[i3 + 24 >> 2] = d5 * d20;
  HEAPF32[i3 + 60 >> 2] = -(d4 * d20);
  HEAP32[i3 + 108 >> 2] = 2;
  return;
 }
 if (d7 > 0.0 & d6 < -0.0 & d11 <= 0.0) {
  d20 = 1.0 / (d7 - d6);
  HEAPF32[i3 + 24 >> 2] = d7 * d20;
  HEAPF32[i3 + 96 >> 2] = -(d6 * d20);
  HEAP32[i3 + 108 >> 2] = 2;
  i3 = i1;
  i1 = i2;
  i2 = i3 + 36 | 0;
  do {
   HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
   i3 = i3 + 4 | 0;
   i1 = i1 + 4 | 0;
  } while ((i3 | 0) < (i2 | 0));
  return;
 }
 if (d5 <= 0.0 & d8 >= -0.0) {
  HEAPF32[i3 + 60 >> 2] = 1.0;
  HEAP32[i3 + 108 >> 2] = 1;
  i2 = i3 + 36 | 0;
  do {
   HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
   i3 = i3 + 4 | 0;
   i1 = i1 + 4 | 0;
  } while ((i3 | 0) < (i2 | 0));
  return;
 }
 if (d7 <= 0.0 & d9 <= 0.0) {
  HEAPF32[i3 + 96 >> 2] = 1.0;
  HEAP32[i3 + 108 >> 2] = 1;
  i1 = i2;
  i2 = i3 + 36 | 0;
  do {
   HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
   i3 = i3 + 4 | 0;
   i1 = i1 + 4 | 0;
  } while ((i3 | 0) < (i2 | 0));
  return;
 }
 if (d9 > 0.0 & d8 < -0.0 & d10 <= 0.0) {
  d20 = 1.0 / (d9 - d8);
  HEAPF32[i3 + 60 >> 2] = d9 * d20;
  HEAPF32[i3 + 96 >> 2] = -(d8 * d20);
  HEAP32[i3 + 108 >> 2] = 2;
  i1 = i2;
  i2 = i3 + 36 | 0;
  do {
   HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
   i3 = i3 + 4 | 0;
   i1 = i1 + 4 | 0;
  } while ((i3 | 0) < (i2 | 0));
  return;
 } else {
  d20 = 1.0 / (d12 + (d10 + d11));
  HEAPF32[i3 + 24 >> 2] = d10 * d20;
  HEAPF32[i3 + 60 >> 2] = d11 * d20;
  HEAPF32[i3 + 96 >> 2] = d12 * d20;
  HEAP32[i3 + 108 >> 2] = 3;
  return;
 }
}

function __ZN23b2ChainAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i8, i7, i9, i10) {
 i8 = i8 | 0;
 i7 = i7 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i11 = 0, i12 = 0, i13 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i6 = i11;
 i4 = HEAP32[(HEAP32[i8 + 48 >> 2] | 0) + 12 >> 2] | 0;
 HEAP32[i6 >> 2] = 1308;
 i1 = i6 + 4 | 0;
 HEAP32[i1 >> 2] = 1;
 i2 = i6 + 8 | 0;
 HEAPF32[i2 >> 2] = .009999999776482582;
 i5 = i6 + 28 | 0;
 HEAP32[i5 >> 2] = 0;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAP32[i5 + 8 >> 2] = 0;
 HEAP32[i5 + 12 >> 2] = 0;
 HEAP16[i5 + 16 >> 1] = 0;
 i5 = HEAP32[i8 + 56 >> 2] | 0;
 if ((i5 | 0) <= -1) ___assert_fail(4179, 3964, 116, 4213);
 i3 = HEAP32[i4 + 16 >> 2] | 0;
 if ((i3 + -1 | 0) <= (i5 | 0)) ___assert_fail(4179, 3964, 116, 4213);
 HEAP32[i1 >> 2] = 1;
 HEAP32[i2 >> 2] = HEAP32[i4 + 8 >> 2];
 i2 = HEAP32[i4 + 12 >> 2] | 0;
 i1 = i2 + (i5 << 3) | 0;
 i12 = HEAP32[i1 + 4 >> 2] | 0;
 i13 = i6 + 12 | 0;
 HEAP32[i13 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i13 + 4 >> 2] = i12;
 i13 = i2 + (i5 + 1 << 3) | 0;
 i12 = HEAP32[i13 + 4 >> 2] | 0;
 i1 = i6 + 20 | 0;
 HEAP32[i1 >> 2] = HEAP32[i13 >> 2];
 HEAP32[i1 + 4 >> 2] = i12;
 i1 = i6 + 28 | 0;
 if ((i5 | 0) > 0) {
  i12 = i2 + (i5 + -1 << 3) | 0;
  i13 = HEAP32[i12 + 4 >> 2] | 0;
  HEAP32[i1 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i1 + 4 >> 2] = i13;
  i1 = 1;
 } else {
  i12 = i4 + 20 | 0;
  i13 = HEAP32[i12 + 4 >> 2] | 0;
  HEAP32[i1 >> 2] = HEAP32[i12 >> 2];
  HEAP32[i1 + 4 >> 2] = i13;
  i1 = HEAP8[i4 + 36 >> 0] | 0;
 }
 HEAP8[i6 + 44 >> 0] = i1;
 i1 = i6 + 36 | 0;
 if ((i3 + -2 | 0) > (i5 | 0)) {
  i5 = i2 + (i5 + 2 << 3) | 0;
  i13 = HEAP32[i5 + 4 >> 2] | 0;
  i12 = i1;
  HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i12 + 4 >> 2] = i13;
  i12 = 1;
  i13 = i6 + 45 | 0;
  HEAP8[i13 >> 0] = i12;
  i13 = i8 + 52 | 0;
  i13 = HEAP32[i13 >> 2] | 0;
  i13 = i13 + 12 | 0;
  i13 = HEAP32[i13 >> 2] | 0;
  __Z22b2CollideEdgeAndCircleP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK13b2CircleShapeS6_(i7, i6, i9, i13, i10);
  STACKTOP = i11;
  return;
 } else {
  i5 = i4 + 28 | 0;
  i13 = HEAP32[i5 + 4 >> 2] | 0;
  i12 = i1;
  HEAP32[i12 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i12 + 4 >> 2] = i13;
  i12 = HEAP8[i4 + 37 >> 0] | 0;
  i13 = i6 + 45 | 0;
  HEAP8[i13 >> 0] = i12;
  i13 = i8 + 52 | 0;
  i13 = HEAP32[i13 >> 2] | 0;
  i13 = i13 + 12 | 0;
  i13 = HEAP32[i13 >> 2] | 0;
  __Z22b2CollideEdgeAndCircleP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK13b2CircleShapeS6_(i7, i6, i9, i13, i10);
  STACKTOP = i11;
  return;
 }
}

function __ZN9b2Fixture11SynchronizeEP12b2BroadPhaseRK11b2TransformS4_(i1, i21, i23, i24) {
 i1 = i1 | 0;
 i21 = i21 | 0;
 i23 = i23 | 0;
 i24 = i24 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i22 = 0, i25 = 0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, i30 = 0, i31 = 0;
 i25 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i19 = i25 + 24 | 0;
 i20 = i25 + 8 | 0;
 i22 = i25;
 i17 = i1 + 28 | 0;
 if ((HEAP32[i17 >> 2] | 0) <= 0) {
  STACKTOP = i25;
  return;
 }
 i18 = i1 + 24 | 0;
 i9 = i1 + 12 | 0;
 i10 = i19 + 4 | 0;
 i12 = i20 + 4 | 0;
 i13 = i19 + 8 | 0;
 i14 = i20 + 8 | 0;
 i15 = i19 + 12 | 0;
 i2 = i20 + 12 | 0;
 i3 = i24 + 4 | 0;
 i4 = i23 + 4 | 0;
 i5 = i22 + 4 | 0;
 i6 = i21 + 40 | 0;
 i7 = i21 + 36 | 0;
 i8 = i21 + 32 | 0;
 i16 = 0;
 do {
  i11 = HEAP32[i18 >> 2] | 0;
  i30 = HEAP32[i9 >> 2] | 0;
  i1 = i11 + (i16 * 28 | 0) + 20 | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i30 >> 2] | 0) + 24 >> 2] & 31](i30, i19, i23, HEAP32[i1 >> 2] | 0);
  i30 = HEAP32[i9 >> 2] | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i30 >> 2] | 0) + 24 >> 2] & 31](i30, i20, i24, HEAP32[i1 >> 2] | 0);
  i1 = i11 + (i16 * 28 | 0) | 0;
  d26 = +HEAPF32[i19 >> 2];
  d27 = +HEAPF32[i20 >> 2];
  d28 = +HEAPF32[i10 >> 2];
  d29 = +HEAPF32[i12 >> 2];
  HEAPF32[i1 >> 2] = d26 < d27 ? d26 : d27;
  HEAPF32[i11 + (i16 * 28 | 0) + 4 >> 2] = d28 < d29 ? d28 : d29;
  d29 = +HEAPF32[i13 >> 2];
  d28 = +HEAPF32[i14 >> 2];
  d27 = +HEAPF32[i15 >> 2];
  d26 = +HEAPF32[i2 >> 2];
  HEAPF32[i11 + (i16 * 28 | 0) + 8 >> 2] = d29 > d28 ? d29 : d28;
  HEAPF32[i11 + (i16 * 28 | 0) + 12 >> 2] = d27 > d26 ? d27 : d26;
  d26 = +HEAPF32[i3 >> 2] - +HEAPF32[i4 >> 2];
  HEAPF32[i22 >> 2] = +HEAPF32[i24 >> 2] - +HEAPF32[i23 >> 2];
  HEAPF32[i5 >> 2] = d26;
  i11 = HEAP32[i11 + (i16 * 28 | 0) + 24 >> 2] | 0;
  if (__ZN13b2DynamicTree9MoveProxyEiRK6b2AABBRK6b2Vec2(i21, i11, i1, i22) | 0) {
   i1 = HEAP32[i6 >> 2] | 0;
   if ((i1 | 0) == (HEAP32[i7 >> 2] | 0)) {
    i30 = HEAP32[i8 >> 2] | 0;
    HEAP32[i7 >> 2] = i1 << 1;
    i31 = _malloc(i1 << 3) | 0;
    HEAP32[i8 >> 2] = i31;
    _memcpy(i31 | 0, i30 | 0, i1 << 2 | 0) | 0;
    _free(i30);
    i1 = HEAP32[i6 >> 2] | 0;
   }
   HEAP32[(HEAP32[i8 >> 2] | 0) + (i1 << 2) >> 2] = i11;
   HEAP32[i6 >> 2] = (HEAP32[i6 >> 2] | 0) + 1;
  }
  i16 = i16 + 1 | 0;
 } while ((i16 | 0) < (HEAP32[i17 >> 2] | 0));
 STACKTOP = i25;
 return;
}

function __ZNSt3__16vectorI6SpriteNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i9, i7) {
 i9 = i9 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i10 = 0, i11 = 0;
 i10 = i9 + 4 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 i3 = (((HEAP32[i10 >> 2] | 0) - i1 | 0) / 28 | 0) + 1 | 0;
 if (i3 >>> 0 > 153391689) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i9);
 i11 = i9 + 8 | 0;
 i2 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 28 | 0;
 if (i2 >>> 0 < 76695844) {
  i2 = i2 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 28 | 0;
  if (!i2) {
   i4 = 0;
   i5 = 0;
  } else i6 = 6;
 } else {
  i2 = 153391689;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 28 | 0;
  i6 = 6;
 }
 if ((i6 | 0) == 6) {
  i4 = i2;
  i5 = __Znwj(i2 * 28 | 0) | 0;
 }
 i3 = i5 + (i1 * 28 | 0) | 0;
 i2 = i3;
 i8 = i5 + (i4 * 28 | 0) | 0;
 HEAP32[i3 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i3 + 4 >> 2] = HEAP32[i7 + 4 >> 2];
 HEAP32[i3 + 8 >> 2] = HEAP32[i7 + 8 >> 2];
 HEAP32[i7 >> 2] = 0;
 HEAP32[i7 + 4 >> 2] = 0;
 HEAP32[i7 + 8 >> 2] = 0;
 i6 = i5 + (i1 * 28 | 0) + 12 | 0;
 i7 = i7 + 12 | 0;
 HEAP32[i6 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i6 + 4 >> 2] = HEAP32[i7 + 4 >> 2];
 HEAP32[i6 + 8 >> 2] = HEAP32[i7 + 8 >> 2];
 HEAP32[i6 + 12 >> 2] = HEAP32[i7 + 12 >> 2];
 i7 = i5 + ((i1 + 1 | 0) * 28 | 0) | 0;
 i6 = HEAP32[i9 >> 2] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) == (i6 | 0)) {
  i4 = i9;
  i5 = i10;
  i3 = i6;
 } else {
  do {
   i5 = i3 + -28 | 0;
   i4 = i1;
   i1 = i1 + -28 | 0;
   HEAP32[i5 >> 2] = HEAP32[i1 >> 2];
   HEAP32[i5 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
   HEAP32[i5 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
   HEAP32[i1 >> 2] = 0;
   HEAP32[i1 + 4 >> 2] = 0;
   HEAP32[i1 + 8 >> 2] = 0;
   i5 = i3 + -16 | 0;
   i4 = i4 + -16 | 0;
   HEAP32[i5 >> 2] = HEAP32[i4 >> 2];
   HEAP32[i5 + 4 >> 2] = HEAP32[i4 + 4 >> 2];
   HEAP32[i5 + 8 >> 2] = HEAP32[i4 + 8 >> 2];
   HEAP32[i5 + 12 >> 2] = HEAP32[i4 + 12 >> 2];
   i3 = i2 + -28 | 0;
   i2 = i3;
  } while ((i1 | 0) != (i6 | 0));
  i1 = i2;
  i4 = i9;
  i5 = i10;
  i2 = i1;
  i3 = HEAP32[i9 >> 2] | 0;
  i1 = HEAP32[i10 >> 2] | 0;
 }
 HEAP32[i4 >> 2] = i2;
 HEAP32[i5 >> 2] = i7;
 HEAP32[i11 >> 2] = i8;
 i2 = i3;
 if ((i1 | 0) != (i2 | 0)) do {
  i1 = i1 + -28 | 0;
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1);
 } while ((i1 | 0) != (i2 | 0));
 if (!i3) return;
 __ZdlPv(i3);
 return;
}

function _pop_arg(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, d6 = 0.0;
 L1 : do if (i3 >>> 0 <= 20) do switch (i3 | 0) {
 case 9:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   HEAP32[i2 >> 2] = i3;
   break L1;
  }
 case 10:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = ((i3 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 11:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = 0;
   break L1;
  }
 case 12:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   i3 = i4;
   i5 = HEAP32[i3 >> 2] | 0;
   i3 = HEAP32[i3 + 4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 8;
   i4 = i2;
   HEAP32[i4 >> 2] = i5;
   HEAP32[i4 + 4 >> 2] = i3;
   break L1;
  }
 case 13:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 65535) << 16 >> 16;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 14:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 65535;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 15:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 255) << 24 >> 24;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 16:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 255;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 17:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 case 18:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 default:
  break L1;
 } while (0); while (0);
 return;
}

function __ZNK14b2PolygonShape11ComputeAABBEP6b2AABBRK11b2Transformi(i12, i11, i2, i1) {
 i12 = i12 | 0;
 i11 = i11 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0;
 d8 = +HEAPF32[i2 + 12 >> 2];
 d14 = +HEAPF32[i12 + 20 >> 2];
 d10 = +HEAPF32[i2 + 8 >> 2];
 d13 = +HEAPF32[i12 + 24 >> 2];
 d9 = +HEAPF32[i2 >> 2];
 d6 = +HEAPF32[i2 + 4 >> 2];
 i1 = (HEAPF32[tempDoublePtr >> 2] = d9 + (d8 * d14 - d10 * d13), HEAP32[tempDoublePtr >> 2] | 0);
 i2 = (HEAPF32[tempDoublePtr >> 2] = d14 * d10 + d8 * d13 + d6, HEAP32[tempDoublePtr >> 2] | 0);
 i7 = HEAP32[i12 + 148 >> 2] | 0;
 if ((i7 | 0) > 1) {
  i3 = i1;
  i4 = i2;
  i5 = 1;
  do {
   d13 = +HEAPF32[i12 + 20 + (i5 << 3) >> 2];
   d14 = +HEAPF32[i12 + 20 + (i5 << 3) + 4 >> 2];
   d15 = d9 + (d8 * d13 - d10 * d14);
   d14 = d13 * d10 + d8 * d14 + d6;
   d13 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]);
   d16 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]);
   i3 = (HEAPF32[tempDoublePtr >> 2] = d13 < d15 ? d13 : d15, HEAP32[tempDoublePtr >> 2] | 0);
   i4 = (HEAPF32[tempDoublePtr >> 2] = d16 < d14 ? d16 : d14, HEAP32[tempDoublePtr >> 2] | 0);
   d16 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]);
   d13 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]);
   i1 = (HEAPF32[tempDoublePtr >> 2] = d16 > d15 ? d16 : d15, HEAP32[tempDoublePtr >> 2] | 0);
   i2 = (HEAPF32[tempDoublePtr >> 2] = d13 > d14 ? d13 : d14, HEAP32[tempDoublePtr >> 2] | 0);
   i5 = i5 + 1 | 0;
  } while ((i5 | 0) < (i7 | 0));
 } else {
  i4 = i2;
  i3 = i1;
 }
 d16 = +HEAPF32[i12 + 8 >> 2];
 d14 = (HEAP32[tempDoublePtr >> 2] = i3, +HEAPF32[tempDoublePtr >> 2]) - d16;
 d15 = (HEAP32[tempDoublePtr >> 2] = i4, +HEAPF32[tempDoublePtr >> 2]) - d16;
 HEAPF32[i11 >> 2] = d14;
 HEAPF32[i11 + 4 >> 2] = d15;
 d15 = (HEAP32[tempDoublePtr >> 2] = i1, +HEAPF32[tempDoublePtr >> 2]) + d16;
 d16 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]) + d16;
 HEAPF32[i11 + 8 >> 2] = d15;
 HEAPF32[i11 + 12 >> 2] = d16;
 return;
}

function ___stdio_write(i14, i2, i1) {
 i14 = i14 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i11 = i15 + 16 | 0;
 i10 = i15;
 i3 = i15 + 32 | 0;
 i12 = i14 + 28 | 0;
 i4 = HEAP32[i12 >> 2] | 0;
 HEAP32[i3 >> 2] = i4;
 i13 = i14 + 20 | 0;
 i4 = (HEAP32[i13 >> 2] | 0) - i4 | 0;
 HEAP32[i3 + 4 >> 2] = i4;
 HEAP32[i3 + 8 >> 2] = i2;
 HEAP32[i3 + 12 >> 2] = i1;
 i8 = i14 + 60 | 0;
 i9 = i14 + 44 | 0;
 i2 = 2;
 i4 = i4 + i1 | 0;
 while (1) {
  if (!(HEAP32[421] | 0)) {
   HEAP32[i11 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i11 + 4 >> 2] = i3;
   HEAP32[i11 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i11 | 0) | 0) | 0;
  } else {
   _pthread_cleanup_push(36, i14 | 0);
   HEAP32[i10 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i10 + 4 >> 2] = i3;
   HEAP32[i10 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i10 | 0) | 0) | 0;
   _pthread_cleanup_pop(0);
  }
  if ((i4 | 0) == (i6 | 0)) {
   i4 = 6;
   break;
  }
  if ((i6 | 0) < 0) {
   i4 = 8;
   break;
  }
  i4 = i4 - i6 | 0;
  i5 = HEAP32[i3 + 4 >> 2] | 0;
  if (i6 >>> 0 <= i5 >>> 0) if ((i2 | 0) == 2) {
   HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + i6;
   i7 = i5;
   i2 = 2;
  } else i7 = i5; else {
   i7 = HEAP32[i9 >> 2] | 0;
   HEAP32[i12 >> 2] = i7;
   HEAP32[i13 >> 2] = i7;
   i7 = HEAP32[i3 + 12 >> 2] | 0;
   i6 = i6 - i5 | 0;
   i3 = i3 + 8 | 0;
   i2 = i2 + -1 | 0;
  }
  HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i6;
  HEAP32[i3 + 4 >> 2] = i7 - i6;
 }
 if ((i4 | 0) == 6) {
  i11 = HEAP32[i9 >> 2] | 0;
  HEAP32[i14 + 16 >> 2] = i11 + (HEAP32[i14 + 48 >> 2] | 0);
  i14 = i11;
  HEAP32[i12 >> 2] = i14;
  HEAP32[i13 >> 2] = i14;
 } else if ((i4 | 0) == 8) {
  HEAP32[i14 + 16 >> 2] = 0;
  HEAP32[i12 >> 2] = 0;
  HEAP32[i13 >> 2] = 0;
  HEAP32[i14 >> 2] = HEAP32[i14 >> 2] | 32;
  if ((i2 | 0) == 2) i1 = 0; else i1 = i1 - (HEAP32[i3 + 4 >> 2] | 0) | 0;
 }
 STACKTOP = i15;
 return i1 | 0;
}

function __ZNK14b2PolygonShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi(i17, i16, i4, i2, i1) {
 i17 = i17 | 0;
 i16 = i16 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var d3 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, i12 = 0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d18 = 0.0;
 d11 = +HEAPF32[i2 >> 2];
 d9 = +HEAPF32[i4 >> 2] - d11;
 d13 = +HEAPF32[i2 + 4 >> 2];
 d10 = +HEAPF32[i4 + 4 >> 2] - d13;
 d15 = +HEAPF32[i2 + 12 >> 2];
 d14 = +HEAPF32[i2 + 8 >> 2];
 d8 = d9 * d15 + d10 * d14;
 d9 = d15 * d10 - d9 * d14;
 d11 = +HEAPF32[i4 + 8 >> 2] - d11;
 d13 = +HEAPF32[i4 + 12 >> 2] - d13;
 d10 = d15 * d11 + d14 * d13 - d8;
 d11 = d15 * d13 - d14 * d11 - d9;
 i12 = HEAP32[i17 + 148 >> 2] | 0;
 d13 = +HEAPF32[i4 + 16 >> 2];
 L1 : do if ((i12 | 0) > 0) {
  i2 = 0;
  i1 = -1;
  d3 = 0.0;
  d5 = d13;
  L2 : while (1) {
   d18 = +HEAPF32[i17 + 84 + (i2 << 3) >> 2];
   d7 = +HEAPF32[i17 + 84 + (i2 << 3) + 4 >> 2];
   d6 = (+HEAPF32[i17 + 20 + (i2 << 3) >> 2] - d8) * d18 + (+HEAPF32[i17 + 20 + (i2 << 3) + 4 >> 2] - d9) * d7;
   d7 = d10 * d18 + d11 * d7;
   do if (d7 == 0.0) {
    if (d6 < 0.0) {
     i1 = 0;
     i2 = 13;
     break L2;
    }
   } else if (d7 < 0.0 & d6 < d3 * d7) {
    i1 = i2;
    d3 = d6 / d7;
    break;
   } else {
    d5 = d7 > 0.0 & d6 < d5 * d7 ? d6 / d7 : d5;
    break;
   } while (0);
   i2 = i2 + 1 | 0;
   if (d5 < d3) {
    i1 = 0;
    i2 = 13;
    break;
   }
   if ((i2 | 0) >= (i12 | 0)) break L1;
  }
  if ((i2 | 0) == 13) return i1 | 0;
 } else {
  i1 = -1;
  d3 = 0.0;
 } while (0);
 if (!(d3 >= 0.0) | !(d3 <= d13)) ___assert_fail(4341, 4234, 327, 4226);
 if ((i1 | 0) <= -1) {
  i17 = 0;
  return i17 | 0;
 }
 HEAPF32[i16 + 8 >> 2] = d3;
 d13 = +HEAPF32[i17 + 84 + (i1 << 3) >> 2];
 d18 = +HEAPF32[i17 + 84 + (i1 << 3) + 4 >> 2];
 HEAPF32[i16 >> 2] = d15 * d13 - d14 * d18;
 HEAPF32[i16 + 4 >> 2] = d13 * d14 + d15 * d18;
 i17 = 1;
 return i17 | 0;
}

function __ZN12b2EPCollider24ComputePolygonSeparationEv(i22, i19) {
 i22 = i22 | 0;
 i19 = i19 | 0;
 var i1 = 0, d2 = 0.0, d3 = 0.0, d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, d17 = 0.0, i18 = 0, i20 = 0, i21 = 0, i23 = 0, d24 = 0.0, d25 = 0.0;
 HEAP32[i22 >> 2] = 0;
 i20 = i22 + 4 | 0;
 HEAP32[i20 >> 2] = -1;
 i21 = i22 + 8 | 0;
 HEAPF32[i21 >> 2] = -34028234663852886.0e22;
 d16 = +HEAPF32[i19 + 216 >> 2];
 d17 = +HEAPF32[i19 + 212 >> 2];
 i18 = HEAP32[i19 + 128 >> 2] | 0;
 if ((i18 | 0) <= 0) return;
 d7 = +HEAPF32[i19 + 164 >> 2];
 d8 = +HEAPF32[i19 + 168 >> 2];
 d9 = +HEAPF32[i19 + 172 >> 2];
 d10 = +HEAPF32[i19 + 176 >> 2];
 d11 = +HEAPF32[i19 + 244 >> 2];
 i12 = i19 + 228 | 0;
 i13 = i19 + 232 | 0;
 i14 = i19 + 236 | 0;
 i15 = i19 + 240 | 0;
 d6 = -34028234663852886.0e22;
 i1 = 0;
 while (1) {
  d3 = +HEAPF32[i19 + 64 + (i1 << 3) >> 2];
  d4 = -d3;
  d5 = -+HEAPF32[i19 + 64 + (i1 << 3) + 4 >> 2];
  d25 = +HEAPF32[i19 + (i1 << 3) >> 2];
  d2 = +HEAPF32[i19 + (i1 << 3) + 4 >> 2];
  d24 = (d25 - d7) * d4 + (d2 - d8) * d5;
  d2 = (d25 - d9) * d4 + (d2 - d10) * d5;
  d2 = d24 < d2 ? d24 : d2;
  if (d2 > d11) break;
  if (!(d16 * d3 + d17 * d5 >= 0.0)) if (d2 > d6 ? !((d4 - +HEAPF32[i12 >> 2]) * d17 + (d5 - +HEAPF32[i13 >> 2]) * d16 < -.03490658849477768) : 0) i23 = 8; else d2 = d6; else if (d2 > d6 ? !((d4 - +HEAPF32[i14 >> 2]) * d17 + (d5 - +HEAPF32[i15 >> 2]) * d16 < -.03490658849477768) : 0) i23 = 8; else d2 = d6;
  if ((i23 | 0) == 8) {
   i23 = 0;
   HEAP32[i22 >> 2] = 2;
   HEAP32[i20 >> 2] = i1;
   HEAPF32[i21 >> 2] = d2;
  }
  i1 = i1 + 1 | 0;
  if ((i1 | 0) >= (i18 | 0)) {
   i23 = 10;
   break;
  } else d6 = d2;
 }
 if ((i23 | 0) == 10) return;
 HEAP32[i22 >> 2] = 2;
 HEAP32[i20 >> 2] = i1;
 HEAPF32[i21 >> 2] = d2;
 return;
}

function __ZN15b2ContactSolverD2Ev(i8) {
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i4 = i8 + 32 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i2 = HEAP32[i8 + 40 >> 2] | 0;
 i7 = i5 + 102796 | 0;
 i3 = HEAP32[i7 >> 2] | 0;
 if ((i3 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i3 + -1 | 0;
 if ((HEAP32[i5 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i5 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i2 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = i5 + 102400 | 0;
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
  i1 = i3;
  i6 = i5;
 } else {
  _free(i2);
  i2 = i5 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i1 = HEAP32[i7 >> 2] | 0;
  i6 = HEAP32[i4 >> 2] | 0;
 }
 i3 = i5 + 102404 | 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) - (HEAP32[i2 >> 2] | 0);
 HEAP32[i7 >> 2] = i1 + -1;
 i2 = HEAP32[i8 + 36 >> 2] | 0;
 i3 = i6 + 102796 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 if ((i4 | 0) <= 0) ___assert_fail(5644, 5552, 63, 5547);
 i1 = i4 + -1 | 0;
 if ((HEAP32[i6 + 102412 + (i1 * 12 | 0) >> 2] | 0) != (i2 | 0)) ___assert_fail(5661, 5552, 65, 5547);
 if (!(HEAP8[i6 + 102412 + (i1 * 12 | 0) + 8 >> 0] | 0)) {
  i5 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i8 = i6 + 102400 | 0;
  HEAP32[i8 >> 2] = (HEAP32[i8 >> 2] | 0) - (HEAP32[i5 >> 2] | 0);
  i8 = i4;
  i5 = HEAP32[i5 >> 2] | 0;
  i7 = i6 + 102404 | 0;
  i6 = HEAP32[i7 >> 2] | 0;
  i6 = i6 - i5 | 0;
  HEAP32[i7 >> 2] = i6;
  i8 = i8 + -1 | 0;
  HEAP32[i3 >> 2] = i8;
  return;
 } else {
  _free(i2);
  i5 = i6 + 102412 + (i1 * 12 | 0) + 4 | 0;
  i8 = HEAP32[i3 >> 2] | 0;
  i5 = HEAP32[i5 >> 2] | 0;
  i7 = i6 + 102404 | 0;
  i6 = HEAP32[i7 >> 2] | 0;
  i6 = i6 - i5 | 0;
  HEAP32[i7 >> 2] = i6;
  i8 = i8 + -1 | 0;
  HEAP32[i3 >> 2] = i8;
  return;
 }
}

function __Z9makeWallsP6b2Body(i7) {
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, i11 = 0, i12 = 0, d13 = 0.0;
 i12 = STACKTOP;
 STACKTOP = STACKTOP + 336 | 0;
 i11 = i12 + 184 | 0;
 i1 = i12 + 24 | 0;
 i2 = i12 + 16 | 0;
 i4 = i12 + 8 | 0;
 i5 = i12;
 i8 = i12 + 32 | 0;
 HEAP32[i11 >> 2] = 1388;
 HEAP32[i11 + 4 >> 2] = 2;
 HEAPF32[i11 + 8 >> 2] = .009999999776482582;
 HEAP32[i11 + 148 >> 2] = 0;
 HEAPF32[i11 + 12 >> 2] = 0.0;
 HEAPF32[i11 + 16 >> 2] = 0.0;
 i6 = i1 + 4 | 0;
 i3 = i2 + 4 | 0;
 d9 = 20.0;
 d10 = 1.0;
 while (1) {
  d13 = d10 * .03 + 3.0;
  HEAPF32[i1 >> 2] = -5.0;
  HEAPF32[i6 >> 2] = d9;
  __ZN14b2PolygonShape8SetAsBoxEffRK6b2Vec2f(i11, d13, .3349999785423279, i1, 0.0);
  __ZN6b2Body13CreateFixtureEPK7b2Shapef(i7, i11, 0.0) | 0;
  HEAPF32[i2 >> 2] = 5.0;
  HEAPF32[i3 >> 2] = d9 + -.25999999046325684;
  __ZN14b2PolygonShape8SetAsBoxEffRK6b2Vec2f(i11, d13, .3349999785423279, i2, 0.0);
  __ZN6b2Body13CreateFixtureEPK7b2Shapef(i7, i11, 0.0) | 0;
  d9 = d9 + -.6499999761581421;
  if (!(d9 > 9.5)) break; else d10 = -d10;
 }
 HEAPF32[i4 >> 2] = -5.0;
 HEAPF32[i4 + 4 >> 2] = 30.0;
 __ZN14b2PolygonShape8SetAsBoxEffRK6b2Vec2f(i11, 3.0, 10.0, i4, 0.0);
 __ZN6b2Body13CreateFixtureEPK7b2Shapef(i7, i11, 0.0) | 0;
 HEAPF32[i5 >> 2] = 5.0;
 HEAPF32[i5 + 4 >> 2] = 30.0;
 __ZN14b2PolygonShape8SetAsBoxEffRK6b2Vec2f(i11, 3.0, 10.0, i5, 0.0);
 __ZN6b2Body13CreateFixtureEPK7b2Shapef(i7, i11, 0.0) | 0;
 HEAP32[i8 >> 2] = 1388;
 HEAP32[i8 + 4 >> 2] = 2;
 HEAPF32[i8 + 8 >> 2] = .009999999776482582;
 HEAP32[i8 + 148 >> 2] = 0;
 HEAPF32[i8 + 12 >> 2] = 0.0;
 HEAPF32[i8 + 16 >> 2] = 0.0;
 __ZN14b2PolygonShape8SetAsBoxEff(i8, 50.0, 10.0);
 __ZN6b2Body13CreateFixtureEPK7b2Shapef(i7, i8, 0.0) | 0;
 STACKTOP = i12;
 return;
}

function __ZNK11b2EdgeShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi(i5, i21, i20, i3, i2) {
 i5 = i5 | 0;
 i21 = i21 | 0;
 i20 = i20 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var d1 = 0.0, d4 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0;
 d14 = +HEAPF32[i3 >> 2];
 d12 = +HEAPF32[i20 >> 2] - d14;
 d15 = +HEAPF32[i3 + 4 >> 2];
 d13 = +HEAPF32[i20 + 4 >> 2] - d15;
 d19 = +HEAPF32[i3 + 12 >> 2];
 d18 = +HEAPF32[i3 + 8 >> 2];
 d11 = d12 * d19 + d13 * d18;
 d12 = d19 * d13 - d12 * d18;
 d14 = +HEAPF32[i20 + 8 >> 2] - d14;
 d15 = +HEAPF32[i20 + 12 >> 2] - d15;
 d13 = d19 * d14 + d18 * d15 - d11;
 d14 = d19 * d15 - d18 * d14 - d12;
 d15 = +HEAPF32[i5 + 12 >> 2];
 d16 = +HEAPF32[i5 + 16 >> 2];
 d17 = +HEAPF32[i5 + 20 >> 2] - d15;
 d7 = +HEAPF32[i5 + 24 >> 2] - d16;
 d4 = -d17;
 d8 = d17 * d17 + d7 * d7;
 d1 = +Math_sqrt(+d8);
 if (d1 < 1.1920928955078125e-007) {
  d9 = d7;
  d6 = d4;
 } else {
  d6 = 1.0 / d1;
  d9 = d7 * d6;
  d6 = d6 * d4;
 }
 d10 = (d16 - d12) * d6 + (d15 - d11) * d9;
 d1 = d14 * d6 + d13 * d9;
 if (d1 == 0.0) {
  i21 = 0;
  return i21 | 0;
 }
 d1 = d10 / d1;
 if (d1 < 0.0) {
  i21 = 0;
  return i21 | 0;
 }
 if (d8 == 0.0 ? 1 : +HEAPF32[i20 + 16 >> 2] < d1) {
  i21 = 0;
  return i21 | 0;
 }
 d17 = (d17 * (d11 + d13 * d1 - d15) + d7 * (d12 + d14 * d1 - d16)) / d8;
 if (d17 < 0.0 | d17 > 1.0) {
  i21 = 0;
  return i21 | 0;
 }
 HEAPF32[i21 + 8 >> 2] = d1;
 d4 = d9 * d19 - d6 * d18;
 d1 = d6 * d19 + d9 * d18;
 if (d10 > 0.0) {
  HEAPF32[i21 >> 2] = -d4;
  HEAPF32[i21 + 4 >> 2] = -d1;
  i21 = 1;
  return i21 | 0;
 } else {
  HEAPF32[i21 >> 2] = d4;
  HEAPF32[i21 + 4 >> 2] = d1;
  i21 = 1;
  return i21 | 0;
 }
 return 0;
}

function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_void(568, 8183);
 __embind_register_bool(576, 8188, 1, 1, 0);
 __embind_register_integer(584, 8193, 1, -128, 127);
 __embind_register_integer(600, 8198, 1, -128, 127);
 __embind_register_integer(592, 8210, 1, 0, 255);
 __embind_register_integer(608, 8224, 2, -32768, 32767);
 __embind_register_integer(616, 8230, 2, 0, 65535);
 __embind_register_integer(624, 8245, 4, -2147483648, 2147483647);
 __embind_register_integer(632, 8249, 4, 0, -1);
 __embind_register_integer(640, 8262, 4, -2147483648, 2147483647);
 __embind_register_integer(648, 8267, 4, 0, -1);
 __embind_register_float(656, 8281, 4);
 __embind_register_float(664, 8287, 8);
 __embind_register_std_string(272, 8294);
 __embind_register_std_string(296, 8306);
 __embind_register_std_wstring(320, 4, 8339);
 __embind_register_emval(344, 8352);
 __embind_register_memory_view(352, 0, 8368);
 __embind_register_memory_view(360, 0, 8398);
 __embind_register_memory_view(368, 1, 8435);
 __embind_register_memory_view(376, 2, 8474);
 __embind_register_memory_view(384, 3, 8505);
 __embind_register_memory_view(392, 4, 8545);
 __embind_register_memory_view(400, 5, 8574);
 __embind_register_memory_view(408, 4, 8612);
 __embind_register_memory_view(416, 5, 8642);
 __embind_register_memory_view(360, 0, 8681);
 __embind_register_memory_view(368, 1, 8713);
 __embind_register_memory_view(376, 2, 8746);
 __embind_register_memory_view(384, 3, 8779);
 __embind_register_memory_view(392, 4, 8813);
 __embind_register_memory_view(400, 5, 8846);
 __embind_register_memory_view(424, 6, 8880);
 __embind_register_memory_view(432, 7, 8911);
 __embind_register_memory_view(440, 7, 8943);
 return;
}

function __ZNK14b2PolygonShape11ComputeMassEP10b2MassDataf(i12, i14, d13) {
 i12 = i12 | 0;
 i14 = i14 | 0;
 d13 = +d13;
 var d1 = 0.0, d2 = 0.0, i3 = 0, d4 = 0.0, d5 = 0.0, d6 = 0.0, i7 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, i11 = 0, i15 = 0, d16 = 0.0, d17 = 0.0, d18 = 0.0, d19 = 0.0, d20 = 0.0;
 i11 = HEAP32[i12 + 148 >> 2] | 0;
 if ((i11 | 0) > 2) {
  d2 = 0.0;
  d1 = 0.0;
  i3 = 0;
 } else ___assert_fail(4385, 4234, 384, 4398);
 do {
  d1 = d1 + +HEAPF32[i12 + 20 + (i3 << 3) >> 2];
  d2 = d2 + +HEAPF32[i12 + 20 + (i3 << 3) + 4 >> 2];
  i3 = i3 + 1 | 0;
 } while ((i3 | 0) < (i11 | 0));
 d9 = 1.0 / +(i11 | 0);
 d10 = d1 * d9;
 d9 = d2 * d9;
 i3 = i12 + 20 | 0;
 i7 = i12 + 24 | 0;
 d5 = 0.0;
 d4 = 0.0;
 d1 = 0.0;
 d6 = 0.0;
 i8 = 0;
 do {
  d18 = +HEAPF32[i12 + 20 + (i8 << 3) >> 2] - d10;
  d16 = +HEAPF32[i12 + 20 + (i8 << 3) + 4 >> 2] - d9;
  i8 = i8 + 1 | 0;
  i15 = (i8 | 0) < (i11 | 0);
  d17 = +HEAPF32[(i15 ? i12 + 20 + (i8 << 3) | 0 : i3) >> 2] - d10;
  d2 = +HEAPF32[(i15 ? i12 + 20 + (i8 << 3) + 4 | 0 : i7) >> 2] - d9;
  d19 = d18 * d2 - d16 * d17;
  d20 = d19 * .5;
  d6 = d6 + d20;
  d20 = d20 * .3333333432674408;
  d5 = d5 + (d18 + d17) * d20;
  d4 = d4 + (d16 + d2) * d20;
  d1 = d1 + d19 * .0833333358168602 * (d17 * d17 + (d18 * d18 + d18 * d17) + (d2 * d2 + (d16 * d16 + d16 * d2)));
 } while (i15);
 d2 = d6 * d13;
 HEAPF32[i14 >> 2] = d2;
 if (d6 > 1.1920928955078125e-007) {
  d20 = 1.0 / d6;
  d19 = d5 * d20;
  d20 = d4 * d20;
  d17 = d10 + d19;
  d18 = d9 + d20;
  HEAPF32[i14 + 4 >> 2] = d17;
  HEAPF32[i14 + 8 >> 2] = d18;
  HEAPF32[i14 + 12 >> 2] = d1 * d13 + d2 * (d17 * d17 + d18 * d18 - (d19 * d19 + d20 * d20));
  return;
 } else ___assert_fail(4310, 4234, 430, 4398);
}

function __ZN7b2World4StepEfii(i8, d5, i4, i2) {
 i8 = i8 | 0;
 d5 = +d5;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i1 = 0, d3 = 0.0, i6 = 0, i7 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i6 = i9;
 i7 = i8 + 102872 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 if (i1 & 1) {
  i1 = i8 + 102876 | 0;
  __ZN12b2BroadPhase11UpdatePairsI16b2ContactManagerEEvPT_(i1, i1);
  i1 = HEAP32[i7 >> 2] & -2;
  HEAP32[i7 >> 2] = i1;
 }
 HEAP32[i7 >> 2] = i1 | 2;
 HEAPF32[i6 >> 2] = d5;
 HEAP32[i6 + 12 >> 2] = i4;
 HEAP32[i6 + 16 >> 2] = i2;
 i1 = d5 > 0.0;
 d3 = i1 ? 1.0 / d5 : 0.0;
 HEAPF32[i6 + 4 >> 2] = d3;
 i2 = i8 + 102992 | 0;
 HEAPF32[i6 + 8 >> 2] = +HEAPF32[i2 >> 2] * d5;
 HEAP8[i6 + 20 >> 0] = HEAP8[i8 + 102996 >> 0] | 0;
 __ZN16b2ContactManager7CollideEv(i8 + 102876 | 0);
 HEAPF32[i8 + 103004 >> 2] = 0.0;
 if ((HEAP8[i8 + 102999 >> 0] | 0) != 0 & i1) {
  __ZN7b2World5SolveERK10b2TimeStep(i8, i6);
  HEAPF32[i8 + 103008 >> 2] = 0.0;
 }
 if ((HEAP8[i8 + 102997 >> 0] | 0) != 0 & i1) {
  __ZN7b2World8SolveTOIERK10b2TimeStep(i8, i6);
  HEAPF32[i8 + 103028 >> 2] = 0.0;
 }
 if (i1) HEAPF32[i2 >> 2] = d3;
 i2 = HEAP32[i7 >> 2] | 0;
 if (!(i2 & 4)) {
  i6 = i2 & -3;
  HEAP32[i7 >> 2] = i6;
  i8 = i8 + 103e3 | 0;
  HEAPF32[i8 >> 2] = 0.0;
  STACKTOP = i9;
  return;
 }
 i1 = HEAP32[i8 + 102956 >> 2] | 0;
 if (!i1) {
  i6 = i2 & -3;
  HEAP32[i7 >> 2] = i6;
  i8 = i8 + 103e3 | 0;
  HEAPF32[i8 >> 2] = 0.0;
  STACKTOP = i9;
  return;
 }
 do {
  HEAPF32[i1 + 76 >> 2] = 0.0;
  HEAPF32[i1 + 80 >> 2] = 0.0;
  HEAPF32[i1 + 84 >> 2] = 0.0;
  i1 = HEAP32[i1 + 96 >> 2] | 0;
 } while ((i1 | 0) != 0);
 i6 = i2 & -3;
 HEAP32[i7 >> 2] = i6;
 i8 = i8 + 103e3 | 0;
 HEAPF32[i8 >> 2] = 0.0;
 STACKTOP = i9;
 return;
}

function __ZL19b2FindMaxSeparationPiPK14b2PolygonShapeRK11b2TransformS2_S5_(i19, i17, i2, i18, i3) {
 i19 = i19 | 0;
 i17 = i17 | 0;
 i2 = i2 | 0;
 i18 = i18 | 0;
 i3 = i3 | 0;
 var d1 = 0.0, d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, i11 = 0, i12 = 0, i13 = 0, d14 = 0.0, d15 = 0.0, i16 = 0, d20 = 0.0;
 i13 = HEAP32[i17 + 148 >> 2] | 0;
 i16 = HEAP32[i18 + 148 >> 2] | 0;
 d6 = +HEAPF32[i3 + 12 >> 2];
 d10 = +HEAPF32[i2 + 8 >> 2];
 d8 = +HEAPF32[i3 + 8 >> 2];
 d15 = +HEAPF32[i2 + 12 >> 2];
 d14 = d6 * d10 - d8 * d15;
 d15 = d10 * d8 + d6 * d15;
 d10 = +HEAPF32[i2 >> 2] - +HEAPF32[i3 >> 2];
 d7 = +HEAPF32[i2 + 4 >> 2] - +HEAPF32[i3 + 4 >> 2];
 d9 = d6 * d10 + d8 * d7;
 d10 = d6 * d7 - d8 * d10;
 if ((i13 | 0) <= 0) {
  i18 = 0;
  d15 = -34028234663852886.0e22;
  HEAP32[i19 >> 2] = i18;
  return +d15;
 }
 i11 = (i16 | 0) > 0;
 i2 = 0;
 i12 = 0;
 d1 = -34028234663852886.0e22;
 do {
  d4 = +HEAPF32[i17 + 84 + (i12 << 3) >> 2];
  d6 = +HEAPF32[i17 + 84 + (i12 << 3) + 4 >> 2];
  d5 = d15 * d4 - d14 * d6;
  d6 = d14 * d4 + d15 * d6;
  d4 = +HEAPF32[i17 + 20 + (i12 << 3) >> 2];
  d8 = +HEAPF32[i17 + 20 + (i12 << 3) + 4 >> 2];
  d7 = d9 + (d15 * d4 - d14 * d8);
  d8 = d10 + (d14 * d4 + d15 * d8);
  if (i11) {
   i3 = 0;
   d4 = 34028234663852886.0e22;
   do {
    d20 = d5 * (+HEAPF32[i18 + 20 + (i3 << 3) >> 2] - d7) + d6 * (+HEAPF32[i18 + 20 + (i3 << 3) + 4 >> 2] - d8);
    d4 = d20 < d4 ? d20 : d4;
    i3 = i3 + 1 | 0;
   } while ((i3 | 0) != (i16 | 0));
  } else d4 = 34028234663852886.0e22;
  i3 = d4 > d1;
  d1 = i3 ? d4 : d1;
  i2 = i3 ? i12 : i2;
  i12 = i12 + 1 | 0;
 } while ((i12 | 0) != (i13 | 0));
 HEAP32[i19 >> 2] = i2;
 return +d1;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i7, i6, i2, i4) {
 i3 = i3 | 0;
 i7 = i7 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0, i8 = 0, i9 = 0;
 L1 : do if ((i3 | 0) == (HEAP32[i7 + 8 >> 2] | 0)) {
  if ((HEAP32[i7 + 4 >> 2] | 0) == (i6 | 0) ? (i1 = i7 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i2;
 } else {
  if ((i3 | 0) != (HEAP32[i7 >> 2] | 0)) {
   i8 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i8 >> 2] | 0) + 24 >> 2] & 3](i8, i7, i6, i2, i4);
   break;
  }
  if ((HEAP32[i7 + 16 >> 2] | 0) != (i6 | 0) ? (i5 = i7 + 20 | 0, (HEAP32[i5 >> 2] | 0) != (i6 | 0)) : 0) {
   HEAP32[i7 + 32 >> 2] = i2;
   i2 = i7 + 44 | 0;
   if ((HEAP32[i2 >> 2] | 0) == 4) break;
   i1 = i7 + 52 | 0;
   HEAP8[i1 >> 0] = 0;
   i9 = i7 + 53 | 0;
   HEAP8[i9 >> 0] = 0;
   i3 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 20 >> 2] & 3](i3, i7, i6, i6, 1, i4);
   if (HEAP8[i9 >> 0] | 0) {
    if (!(HEAP8[i1 >> 0] | 0)) {
     i1 = 1;
     i8 = 13;
    }
   } else {
    i1 = 0;
    i8 = 13;
   }
   do if ((i8 | 0) == 13) {
    HEAP32[i5 >> 2] = i6;
    i9 = i7 + 40 | 0;
    HEAP32[i9 >> 2] = (HEAP32[i9 >> 2] | 0) + 1;
    if ((HEAP32[i7 + 36 >> 2] | 0) == 1 ? (HEAP32[i7 + 24 >> 2] | 0) == 2 : 0) {
     HEAP8[i7 + 54 >> 0] = 1;
     if (i1) break;
    } else i8 = 16;
    if ((i8 | 0) == 16 ? i1 : 0) break;
    HEAP32[i2 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i2 >> 2] = 3;
   break;
  }
  if ((i2 | 0) == 1) HEAP32[i7 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZNSt3__15queueINS_4pairIP6b2BodyiEENS_5dequeIS4_NS_9allocatorIS4_EEEEED2Ev(i10) {
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i11 = 0;
 i8 = i10 + 4 | 0;
 i2 = HEAP32[i8 >> 2] | 0;
 i7 = i10 + 16 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 i3 = i2 + (i1 >>> 9 << 2) | 0;
 i9 = i10 + 8 | 0;
 i6 = HEAP32[i9 >> 2] | 0;
 if ((i6 | 0) == (i2 | 0)) {
  i4 = 0;
  i5 = i10 + 20 | 0;
  i1 = 0;
 } else {
  i5 = i10 + 20 | 0;
  i4 = (HEAP32[i5 >> 2] | 0) + i1 | 0;
  i4 = (HEAP32[i2 + (i4 >>> 9 << 2) >> 2] | 0) + ((i4 & 511) << 3) | 0;
  i1 = (HEAP32[i3 >> 2] | 0) + ((i1 & 511) << 3) | 0;
 }
 L5 : while (1) {
  do {
   if ((i1 | 0) == (i4 | 0)) break L5;
   i1 = i1 + 8 | 0;
  } while ((i1 - (HEAP32[i3 >> 2] | 0) | 0) != 4096);
  i11 = i3 + 4 | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  i3 = i11;
 }
 HEAP32[i5 >> 2] = 0;
 i1 = i6 - i2 >> 2;
 if (i1 >>> 0 > 2) do {
  __ZdlPv(HEAP32[i2 >> 2] | 0);
  i2 = (HEAP32[i8 >> 2] | 0) + 4 | 0;
  HEAP32[i8 >> 2] = i2;
  i1 = (HEAP32[i9 >> 2] | 0) - i2 >> 2;
 } while (i1 >>> 0 > 2);
 switch (i1 | 0) {
 case 1:
  {
   HEAP32[i7 >> 2] = 256;
   break;
  }
 case 2:
  {
   HEAP32[i7 >> 2] = 512;
   break;
  }
 default:
  {}
 }
 i1 = HEAP32[i8 >> 2] | 0;
 i2 = HEAP32[i9 >> 2] | 0;
 if ((i1 | 0) != (i2 | 0)) {
  do {
   __ZdlPv(HEAP32[i1 >> 2] | 0);
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) != (i2 | 0));
  i1 = HEAP32[i8 >> 2] | 0;
  i2 = HEAP32[i9 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i9 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 }
 i1 = HEAP32[i10 >> 2] | 0;
 if (!i1) return;
 __ZdlPv(i1);
 return;
}

function __ZN9BlastAnim4drawEv(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i6 = 0, d7 = 0.0, i8 = 0, i9 = 0, d10 = 0.0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i4 = i6 + 24 | 0;
 i1 = i6 + 12 | 0;
 i2 = i6;
 i3 = HEAP32[i5 + 32 >> 2] | 0;
 if (i3 >>> 0 <= 4294967286) {
  STACKTOP = i6;
  return;
 }
 d10 = +(i3 | 0);
 d7 = +HEAPF32[i5 + 16 >> 2] - d10 * .04;
 i9 = i5 + 20 | 0;
 __ZNSt3__19to_stringEf(i2, d10 / 10.0 / .7 + .7);
 i3 = HEAP8[i9 >> 0] | 0;
 i8 = (i3 & 1) == 0;
 i3 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKcj(i2, 0, i8 ? i9 + 1 | 0 : HEAP32[i5 + 28 >> 2] | 0, i8 ? (i3 & 255) >>> 1 : HEAP32[i5 + 24 >> 2] | 0) | 0;
 HEAP32[i1 >> 2] = HEAP32[i3 >> 2];
 HEAP32[i1 + 4 >> 2] = HEAP32[i3 + 4 >> 2];
 HEAP32[i1 + 8 >> 2] = HEAP32[i3 + 8 >> 2];
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 i3 = __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKc(i1, 2882) | 0;
 HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 HEAP32[i4 + 4 >> 2] = HEAP32[i3 + 4 >> 2];
 HEAP32[i4 + 8 >> 2] = HEAP32[i3 + 8 >> 2];
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i2);
 _emscripten_asm_const_4(7, +(+HEAPF32[i5 + 8 >> 2]), +(+HEAPF32[i5 + 12 >> 2]), ((HEAP8[i4 >> 0] & 1) == 0 ? i4 + 1 | 0 : HEAP32[i4 + 8 >> 2] | 0) | 0, +d7) | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i4);
 STACKTOP = i6;
 return;
}

function ___dynamic_cast(i2, i3, i12, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i12 = i12 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i13 = i14;
 i11 = HEAP32[i2 >> 2] | 0;
 i10 = i2 + (HEAP32[i11 + -8 >> 2] | 0) | 0;
 i11 = HEAP32[i11 + -4 >> 2] | 0;
 HEAP32[i13 >> 2] = i12;
 HEAP32[i13 + 4 >> 2] = i2;
 HEAP32[i13 + 8 >> 2] = i3;
 HEAP32[i13 + 12 >> 2] = i1;
 i1 = i13 + 16 | 0;
 i2 = i13 + 20 | 0;
 i3 = i13 + 24 | 0;
 i4 = i13 + 28 | 0;
 i5 = i13 + 32 | 0;
 i6 = i13 + 40 | 0;
 i7 = (i11 | 0) == (i12 | 0);
 i8 = i1;
 i9 = i8 + 36 | 0;
 do {
  HEAP32[i8 >> 2] = 0;
  i8 = i8 + 4 | 0;
 } while ((i8 | 0) < (i9 | 0));
 HEAP16[i1 + 36 >> 1] = 0;
 HEAP8[i1 + 38 >> 0] = 0;
 L1 : do if (i7) {
  HEAP32[i13 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i12 >> 2] | 0) + 20 >> 2] & 3](i12, i13, i10, i10, 1, 0);
  i1 = (HEAP32[i3 >> 2] | 0) == 1 ? i10 : 0;
 } else {
  FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i11 >> 2] | 0) + 24 >> 2] & 3](i11, i13, i10, 1, 0);
  switch (HEAP32[i13 + 36 >> 2] | 0) {
  case 0:
   {
    i1 = (HEAP32[i6 >> 2] | 0) == 1 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1 ? HEAP32[i2 >> 2] | 0 : 0;
    break L1;
   }
  case 1:
   break;
  default:
   {
    i1 = 0;
    break L1;
   }
  }
  if ((HEAP32[i3 >> 2] | 0) != 1 ? !((HEAP32[i6 >> 2] | 0) == 0 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1) : 0) {
   i1 = 0;
   break;
  }
  i1 = HEAP32[i1 >> 2] | 0;
 } while (0);
 STACKTOP = i14;
 return i1 | 0;
}

function __ZN16b2BlockAllocator8AllocateEi(i3, i1) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 if (!i1) {
  i8 = 0;
  return i8 | 0;
 }
 if ((i1 | 0) <= 0) ___assert_fail(4028, 4037, 102, 4095);
 if ((i1 | 0) > 640) {
  i8 = _malloc(i1) | 0;
  return i8 | 0;
 }
 i8 = HEAP8[3086 + i1 >> 0] | 0;
 i4 = i8 & 255;
 if ((i8 & 255) >= 14) ___assert_fail(4104, 4037, 110, 4095);
 i8 = i3 + 12 + (i4 << 2) | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 if (i1) {
  HEAP32[i8 >> 2] = HEAP32[i1 >> 2];
  i8 = i1;
  return i8 | 0;
 }
 i7 = i3 + 4 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 i2 = i3 + 8 | 0;
 if ((i1 | 0) == (HEAP32[i2 >> 2] | 0)) {
  i6 = HEAP32[i3 >> 2] | 0;
  i5 = i1 + 128 | 0;
  HEAP32[i2 >> 2] = i5;
  i5 = _malloc(i5 << 3) | 0;
  HEAP32[i3 >> 2] = i5;
  _memcpy(i5 | 0, i6 | 0, i1 << 3 | 0) | 0;
  _memset(i5 + (i1 << 3) | 0, 0, 1024) | 0;
  _free(i6);
  i1 = HEAP32[i7 >> 2] | 0;
 }
 i2 = HEAP32[i3 >> 2] | 0;
 i5 = _malloc(16384) | 0;
 i6 = i2 + (i1 << 3) + 4 | 0;
 HEAP32[i6 >> 2] = i5;
 i3 = HEAP32[884 + (i4 << 2) >> 2] | 0;
 HEAP32[i2 + (i1 << 3) >> 2] = i3;
 i2 = 16384 / (i3 | 0) | 0;
 if ((Math_imul(i2, i3) | 0) >= 16385) ___assert_fail(4140, 4037, 138, 4095);
 i4 = i2 + -1 | 0;
 if ((i2 | 0) > 1) {
  i2 = 0;
  do {
   i9 = i2;
   i2 = i2 + 1 | 0;
   HEAP32[i5 + (Math_imul(i9, i3) | 0) >> 2] = i5 + (Math_imul(i2, i3) | 0);
  } while ((i2 | 0) != (i4 | 0));
 }
 HEAP32[i5 + (Math_imul(i4, i3) | 0) >> 2] = 0;
 HEAP32[i8 >> 2] = HEAP32[i5 >> 2];
 HEAP32[i7 >> 2] = i1 + 1;
 i9 = HEAP32[i6 >> 2] | 0;
 return i9 | 0;
}

function __ZN16b2ContactManager7DestroyEP9b2Contact(i7, i6) {
 i7 = i7 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i4 = HEAP32[(HEAP32[i6 + 48 >> 2] | 0) + 8 >> 2] | 0;
 i5 = HEAP32[(HEAP32[i6 + 52 >> 2] | 0) + 8 >> 2] | 0;
 i1 = HEAP32[i7 + 72 >> 2] | 0;
 if ((i1 | 0) != 0 ? (HEAP32[i6 + 4 >> 2] & 2 | 0) != 0 : 0) FUNCTION_TABLE_vii[HEAP32[(HEAP32[i1 >> 2] | 0) + 12 >> 2] & 15](i1, i6);
 i2 = HEAP32[i6 + 8 >> 2] | 0;
 i1 = i6 + 12 | 0;
 if (i2) HEAP32[i2 + 12 >> 2] = HEAP32[i1 >> 2];
 i3 = HEAP32[i1 >> 2] | 0;
 if (i3) HEAP32[i3 + 8 >> 2] = i2;
 i1 = i7 + 60 | 0;
 if ((HEAP32[i1 >> 2] | 0) == (i6 | 0)) HEAP32[i1 >> 2] = i3;
 i2 = HEAP32[i6 + 24 >> 2] | 0;
 i1 = i6 + 28 | 0;
 if (i2) HEAP32[i2 + 12 >> 2] = HEAP32[i1 >> 2];
 i3 = HEAP32[i1 >> 2] | 0;
 if (i3) HEAP32[i3 + 8 >> 2] = i2;
 i1 = i4 + 112 | 0;
 if ((i6 + 16 | 0) == (HEAP32[i1 >> 2] | 0)) HEAP32[i1 >> 2] = i3;
 i2 = HEAP32[i6 + 40 >> 2] | 0;
 i1 = i6 + 44 | 0;
 if (i2) HEAP32[i2 + 12 >> 2] = HEAP32[i1 >> 2];
 i3 = HEAP32[i1 >> 2] | 0;
 if (i3) HEAP32[i3 + 8 >> 2] = i2;
 i1 = i5 + 112 | 0;
 if ((i6 + 32 | 0) != (HEAP32[i1 >> 2] | 0)) {
  i5 = i7 + 76 | 0;
  i5 = HEAP32[i5 >> 2] | 0;
  __ZN9b2Contact7DestroyEPS_P16b2BlockAllocator(i6, i5);
  i7 = i7 + 64 | 0;
  i6 = HEAP32[i7 >> 2] | 0;
  i6 = i6 + -1 | 0;
  HEAP32[i7 >> 2] = i6;
  return;
 }
 HEAP32[i1 >> 2] = i3;
 i5 = i7 + 76 | 0;
 i5 = HEAP32[i5 >> 2] | 0;
 __ZN9b2Contact7DestroyEPS_P16b2BlockAllocator(i6, i5);
 i7 = i7 + 64 | 0;
 i6 = HEAP32[i7 >> 2] | 0;
 i6 = i6 + -1 | 0;
 HEAP32[i7 >> 2] = i6;
 return;
}

function _vfprintf(i15, i11, i1) {
 i15 = i15 | 0;
 i11 = i11 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0;
 i16 = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 i10 = i16 + 120 | 0;
 i14 = i16 + 80 | 0;
 i13 = i16;
 i12 = i16 + 136 | 0;
 i2 = i14;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
 if ((_printf_core(0, i11, i10, i13, i14) | 0) < 0) i1 = -1; else {
  if ((HEAP32[i15 + 76 >> 2] | 0) > -1) i8 = ___lockfile(i15) | 0; else i8 = 0;
  i1 = HEAP32[i15 >> 2] | 0;
  i9 = i1 & 32;
  if ((HEAP8[i15 + 74 >> 0] | 0) < 1) HEAP32[i15 >> 2] = i1 & -33;
  i1 = i15 + 48 | 0;
  if (!(HEAP32[i1 >> 2] | 0)) {
   i3 = i15 + 44 | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   HEAP32[i3 >> 2] = i12;
   i5 = i15 + 28 | 0;
   HEAP32[i5 >> 2] = i12;
   i6 = i15 + 20 | 0;
   HEAP32[i6 >> 2] = i12;
   HEAP32[i1 >> 2] = 80;
   i7 = i15 + 16 | 0;
   HEAP32[i7 >> 2] = i12 + 80;
   i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
   if (i4) {
    FUNCTION_TABLE_iiii[HEAP32[i15 + 36 >> 2] & 15](i15, 0, 0) | 0;
    i2 = (HEAP32[i6 >> 2] | 0) == 0 ? -1 : i2;
    HEAP32[i3 >> 2] = i4;
    HEAP32[i1 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    HEAP32[i6 >> 2] = 0;
   }
  } else i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
  i1 = HEAP32[i15 >> 2] | 0;
  HEAP32[i15 >> 2] = i1 | i9;
  if (i8) ___unlockfile(i15);
  i1 = (i1 & 32 | 0) == 0 ? i2 : -1;
 }
 STACKTOP = i16;
 return i1 | 0;
}

function __ZN14b2PolygonShape8SetAsBoxEffRK6b2Vec2f(i9, d1, d2, i3, d4) {
 i9 = i9 | 0;
 d1 = +d1;
 d2 = +d2;
 i3 = i3 | 0;
 d4 = +d4;
 var d5 = 0.0, d6 = 0.0, d7 = 0.0, i8 = 0, d10 = 0.0, i11 = 0, i12 = 0, i13 = 0;
 i8 = i9 + 148 | 0;
 HEAP32[i8 >> 2] = 4;
 d7 = -d1;
 d10 = -d2;
 HEAPF32[i9 + 20 >> 2] = d7;
 HEAPF32[i9 + 24 >> 2] = d10;
 HEAPF32[i9 + 28 >> 2] = d1;
 HEAPF32[i9 + 32 >> 2] = d10;
 HEAPF32[i9 + 36 >> 2] = d1;
 HEAPF32[i9 + 40 >> 2] = d2;
 HEAPF32[i9 + 44 >> 2] = d7;
 HEAPF32[i9 + 48 >> 2] = d2;
 HEAPF32[i9 + 84 >> 2] = 0.0;
 HEAPF32[i9 + 88 >> 2] = -1.0;
 HEAPF32[i9 + 92 >> 2] = 1.0;
 HEAPF32[i9 + 96 >> 2] = 0.0;
 HEAPF32[i9 + 100 >> 2] = 0.0;
 HEAPF32[i9 + 104 >> 2] = 1.0;
 HEAPF32[i9 + 108 >> 2] = -1.0;
 HEAPF32[i9 + 112 >> 2] = 0.0;
 i13 = i3;
 i12 = HEAP32[i13 + 4 >> 2] | 0;
 i11 = i9 + 12 | 0;
 HEAP32[i11 >> 2] = HEAP32[i13 >> 2];
 HEAP32[i11 + 4 >> 2] = i12;
 d7 = +HEAPF32[i3 >> 2];
 d5 = +HEAPF32[i3 + 4 >> 2];
 d6 = +Math_sin(+d4);
 d1 = +Math_cos(+d4);
 d2 = d10;
 d4 = -1.0;
 i3 = 0;
 while (1) {
  i13 = i9 + 20 + (i3 << 3) | 0;
  d10 = +HEAPF32[i13 >> 2];
  HEAPF32[i13 >> 2] = d7 + (d1 * d10 - d6 * d2);
  HEAPF32[i9 + 20 + (i3 << 3) + 4 >> 2] = d5 + (d6 * d10 + d1 * d2);
  i13 = i9 + 84 + (i3 << 3) | 0;
  d10 = +HEAPF32[i13 >> 2];
  HEAPF32[i13 >> 2] = d1 * d10 - d6 * d4;
  HEAPF32[i9 + 84 + (i3 << 3) + 4 >> 2] = d6 * d10 + d1 * d4;
  i3 = i3 + 1 | 0;
  if ((i3 | 0) >= (HEAP32[i8 >> 2] | 0)) break;
  d2 = +HEAPF32[i9 + 20 + (i3 << 3) + 4 >> 2];
  d4 = +HEAPF32[i9 + 84 + (i3 << 3) + 4 >> 2];
 }
 return;
}

function __ZNSt3__114__split_bufferIPNS_4pairIP6b2BodyiEENS_9allocatorIS5_EEE10push_frontEOS5_(i10, i14) {
 i10 = i10 | 0;
 i14 = i14 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i11 = 0, i12 = 0, i13 = 0;
 i13 = i10 + 4 | 0;
 i1 = HEAP32[i13 >> 2] | 0;
 i12 = HEAP32[i10 >> 2] | 0;
 i4 = i12;
 do if ((i1 | 0) == (i12 | 0)) {
  i11 = i10 + 8 | 0;
  i5 = HEAP32[i11 >> 2] | 0;
  i12 = i10 + 12 | 0;
  i9 = HEAP32[i12 >> 2] | 0;
  i2 = i9;
  if (i5 >>> 0 < i9 >>> 0) {
   i9 = i5;
   i10 = ((i2 - i9 >> 2) + 1 | 0) / 2 | 0;
   i9 = i9 - i1 | 0;
   i12 = i5 + (i10 - (i9 >> 2) << 2) | 0;
   _memmove(i12 | 0, i1 | 0, i9 | 0) | 0;
   HEAP32[i13 >> 2] = i12;
   HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + (i10 << 2);
   i1 = i12;
   break;
  }
  i9 = i2 - i1 >> 1;
  i9 = (i9 | 0) == 0 ? 1 : i9;
  i3 = __Znwj(i9 << 2) | 0;
  i6 = i3;
  i7 = i3 + ((i9 + 3 | 0) >>> 2 << 2) | 0;
  i8 = i7;
  i9 = i3 + (i9 << 2) | 0;
  if ((i1 | 0) == (i5 | 0)) {
   i3 = i10;
   i1 = i8;
   i2 = i4;
  } else {
   i3 = i7;
   i2 = i8;
   do {
    HEAP32[i3 >> 2] = HEAP32[i1 >> 2];
    i3 = i2 + 4 | 0;
    i2 = i3;
    i1 = i1 + 4 | 0;
   } while ((i1 | 0) != (i5 | 0));
   i1 = i2;
   i3 = i10;
   i2 = HEAP32[i10 >> 2] | 0;
  }
  HEAP32[i3 >> 2] = i6;
  HEAP32[i13 >> 2] = i8;
  HEAP32[i11 >> 2] = i1;
  HEAP32[i12 >> 2] = i9;
  if (!i2) i1 = i7; else {
   __ZdlPv(i2);
   i1 = HEAP32[i13 >> 2] | 0;
  }
 } while (0);
 HEAP32[i1 + -4 >> 2] = HEAP32[i14 >> 2];
 HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + -4;
 return;
}

function __ZN13b2DynamicTree9MoveProxyEiRK6b2AABBRK6b2Vec2(i7, i6, i4, i5) {
 i7 = i7 | 0;
 i6 = i6 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0;
 if ((i6 | 0) <= -1) ___assert_fail(4410, 4451, 132, 4599);
 if ((HEAP32[i7 + 12 >> 2] | 0) <= (i6 | 0)) ___assert_fail(4410, 4451, 132, 4599);
 i3 = i7 + 4 | 0;
 i2 = HEAP32[i3 >> 2] | 0;
 if ((HEAP32[i2 + (i6 * 36 | 0) + 24 >> 2] | 0) != -1) ___assert_fail(4509, 4451, 134, 4599);
 if (+HEAPF32[i2 + (i6 * 36 | 0) >> 2] <= +HEAPF32[i4 >> 2]) {
  i1 = i4 + 4 | 0;
  if ((+HEAPF32[i2 + (i6 * 36 | 0) + 4 >> 2] <= +HEAPF32[i1 >> 2] ? +HEAPF32[i4 + 8 >> 2] <= +HEAPF32[i2 + (i6 * 36 | 0) + 8 >> 2] : 0) ? +HEAPF32[i4 + 12 >> 2] <= +HEAPF32[i2 + (i6 * 36 | 0) + 12 >> 2] : 0) {
   i7 = 0;
   return i7 | 0;
  }
 } else i1 = i4 + 4 | 0;
 __ZN13b2DynamicTree10RemoveLeafEi(i7, i6);
 d13 = +HEAPF32[i4 >> 2] + -.10000000149011612;
 d12 = +HEAPF32[i1 >> 2] + -.10000000149011612;
 d11 = +HEAPF32[i4 + 8 >> 2] + .10000000149011612;
 d9 = +HEAPF32[i4 + 12 >> 2] + .10000000149011612;
 d10 = +HEAPF32[i5 >> 2] * 2.0;
 d8 = +HEAPF32[i5 + 4 >> 2] * 2.0;
 i2 = d10 < 0.0;
 i4 = d8 < 0.0;
 i5 = HEAP32[i3 >> 2] | 0;
 HEAPF32[i5 + (i6 * 36 | 0) >> 2] = i2 ? d13 + d10 : d13;
 HEAPF32[i5 + (i6 * 36 | 0) + 4 >> 2] = i4 ? d12 + d8 : d12;
 HEAPF32[i5 + (i6 * 36 | 0) + 8 >> 2] = i2 ? d11 : d11 + d10;
 HEAPF32[i5 + (i6 * 36 | 0) + 12 >> 2] = i4 ? d9 : d9 + d8;
 __ZN13b2DynamicTree10InsertLeafEi(i7, i6);
 i7 = 1;
 return i7 | 0;
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14) {
 i1 = i1 | 0;
 i12 = i12 | 0;
 i11 = i11 | 0;
 i10 = i10 | 0;
 i13 = i13 | 0;
 i14 = i14 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 if ((i1 | 0) == (HEAP32[i12 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i12, i11, i10, i13); else {
  i6 = i12 + 52 | 0;
  i7 = HEAP8[i6 >> 0] | 0;
  i8 = i12 + 53 | 0;
  i9 = HEAP8[i8 >> 0] | 0;
  i5 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i5 << 3) | 0;
  HEAP8[i6 >> 0] = 0;
  HEAP8[i8 >> 0] = 0;
  __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1 + 16 | 0, i12, i11, i10, i13, i14);
  L4 : do if ((i5 | 0) > 1) {
   i3 = i12 + 24 | 0;
   i4 = i1 + 8 | 0;
   i5 = i12 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    if (HEAP8[i5 >> 0] | 0) break L4;
    if (!(HEAP8[i6 >> 0] | 0)) {
     if ((HEAP8[i8 >> 0] | 0) != 0 ? (HEAP32[i4 >> 2] & 1 | 0) == 0 : 0) break L4;
    } else {
     if ((HEAP32[i3 >> 2] | 0) == 1) break L4;
     if (!(HEAP32[i4 >> 2] & 2)) break L4;
    }
    HEAP8[i6 >> 0] = 0;
    HEAP8[i8 >> 0] = 0;
    __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14);
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  } while (0);
  HEAP8[i6 >> 0] = i7;
  HEAP8[i8 >> 0] = i9;
 }
 return;
}

function __ZN9b2Contact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i7, i6, i8, i4) {
 i5 = i5 | 0;
 i7 = i7 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 if (!(HEAP8[3728] | 0)) {
  HEAP32[257] = 4;
  HEAP32[258] = 4;
  HEAP8[1036] = 1;
  HEAP32[281] = 5;
  HEAP32[282] = 5;
  HEAP8[1132] = 1;
  HEAP32[263] = 5;
  HEAP32[264] = 5;
  HEAP8[1060] = 0;
  HEAP32[287] = 6;
  HEAP32[288] = 6;
  HEAP8[1156] = 1;
  HEAP32[269] = 7;
  HEAP32[270] = 7;
  HEAP8[1084] = 1;
  HEAP32[260] = 7;
  HEAP32[261] = 7;
  HEAP8[1048] = 0;
  HEAP32[275] = 8;
  HEAP32[276] = 8;
  HEAP8[1108] = 1;
  HEAP32[284] = 8;
  HEAP32[285] = 8;
  HEAP8[1144] = 0;
  HEAP32[293] = 9;
  HEAP32[294] = 9;
  HEAP8[1180] = 1;
  HEAP32[266] = 9;
  HEAP32[267] = 9;
  HEAP8[1072] = 0;
  HEAP32[299] = 10;
  HEAP32[300] = 10;
  HEAP8[1204] = 1;
  HEAP32[290] = 10;
  HEAP32[291] = 10;
  HEAP8[1168] = 0;
  HEAP8[3728] = 1;
 }
 i2 = HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0;
 i3 = HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0;
 if (i2 >>> 0 >= 4) ___assert_fail(6263, 6093, 80, 6306);
 if (i3 >>> 0 >= 4) ___assert_fail(6313, 6093, 81, 6306);
 i1 = HEAP32[1028 + (i2 * 48 | 0) + (i3 * 12 | 0) >> 2] | 0;
 if (!i1) {
  i8 = 0;
  return i8 | 0;
 }
 if (!(HEAP8[1028 + (i2 * 48 | 0) + (i3 * 12 | 0) + 8 >> 0] | 0)) {
  i8 = FUNCTION_TABLE_iiiiii[i1 & 15](i6, i8, i5, i7, i4) | 0;
  return i8 | 0;
 } else {
  i8 = FUNCTION_TABLE_iiiiii[i1 & 15](i5, i7, i6, i8, i4) | 0;
  return i8 | 0;
 }
 return 0;
}

function __ZN12b2BroadPhase11CreateProxyERK6b2AABBPv(i5, i1, i2) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i6 = 0, d7 = 0.0;
 i6 = __ZN13b2DynamicTree12AllocateNodeEv(i5) | 0;
 i3 = i5 + 4 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 d7 = +HEAPF32[i1 + 4 >> 2] + -.10000000149011612;
 HEAPF32[i4 + (i6 * 36 | 0) >> 2] = +HEAPF32[i1 >> 2] + -.10000000149011612;
 HEAPF32[i4 + (i6 * 36 | 0) + 4 >> 2] = d7;
 i4 = HEAP32[i3 >> 2] | 0;
 d7 = +HEAPF32[i1 + 12 >> 2] + .10000000149011612;
 HEAPF32[i4 + (i6 * 36 | 0) + 8 >> 2] = +HEAPF32[i1 + 8 >> 2] + .10000000149011612;
 HEAPF32[i4 + (i6 * 36 | 0) + 12 >> 2] = d7;
 i3 = HEAP32[i3 >> 2] | 0;
 HEAP32[i3 + (i6 * 36 | 0) + 16 >> 2] = i2;
 HEAP32[i3 + (i6 * 36 | 0) + 32 >> 2] = 0;
 __ZN13b2DynamicTree10InsertLeafEi(i5, i6);
 i2 = i5 + 28 | 0;
 HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 1;
 i2 = i5 + 40 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 i4 = i5 + 36 | 0;
 i1 = i5 + 32 | 0;
 if ((i3 | 0) != (HEAP32[i4 >> 2] | 0)) {
  i5 = i3;
  i4 = HEAP32[i1 >> 2] | 0;
  i5 = i4 + (i5 << 2) | 0;
  HEAP32[i5 >> 2] = i6;
  i5 = HEAP32[i2 >> 2] | 0;
  i5 = i5 + 1 | 0;
  HEAP32[i2 >> 2] = i5;
  return i6 | 0;
 }
 i5 = HEAP32[i1 >> 2] | 0;
 HEAP32[i4 >> 2] = i3 << 1;
 i4 = _malloc(i3 << 3) | 0;
 HEAP32[i1 >> 2] = i4;
 _memcpy(i4 | 0, i5 | 0, i3 << 2 | 0) | 0;
 _free(i5);
 i5 = HEAP32[i2 >> 2] | 0;
 i4 = HEAP32[i1 >> 2] | 0;
 i5 = i4 + (i5 << 2) | 0;
 HEAP32[i5 >> 2] = i6;
 i5 = HEAP32[i2 >> 2] | 0;
 i5 = i5 + 1 | 0;
 HEAP32[i2 >> 2] = i5;
 return i6 | 0;
}

function __ZNSt3__114__split_bufferIPNS_4pairIP6b2BodyiEENS_9allocatorIS5_EEE9push_backEOS5_(i9, i13) {
 i9 = i9 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0;
 i12 = i9 + 8 | 0;
 i1 = HEAP32[i12 >> 2] | 0;
 i10 = i9 + 12 | 0;
 i2 = i1;
 do if ((i1 | 0) == (HEAP32[i10 >> 2] | 0)) {
  i11 = i9 + 4 | 0;
  i4 = HEAP32[i11 >> 2] | 0;
  i8 = HEAP32[i9 >> 2] | 0;
  i5 = i8;
  if (i4 >>> 0 > i8 >>> 0) {
   i1 = i4;
   i10 = ((i1 - i5 >> 2) + 1 | 0) / -2 | 0;
   i1 = i2 - i1 | 0;
   _memmove(i4 + (i10 << 2) | 0, i4 | 0, i1 | 0) | 0;
   i1 = i4 + (i10 + (i1 >> 2) << 2) | 0;
   HEAP32[i12 >> 2] = i1;
   HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + (i10 << 2);
   break;
  }
  i8 = i2 - i5 >> 1;
  i8 = (i8 | 0) == 0 ? 1 : i8;
  i3 = __Znwj(i8 << 2) | 0;
  i6 = i3;
  i2 = i3 + (i8 >>> 2 << 2) | 0;
  i7 = i2;
  i8 = i3 + (i8 << 2) | 0;
  if ((i4 | 0) == (i1 | 0)) {
   i3 = i9;
   i1 = i7;
   i2 = i5;
  } else {
   i3 = i7;
   do {
    HEAP32[i2 >> 2] = HEAP32[i4 >> 2];
    i2 = i3 + 4 | 0;
    i3 = i2;
    i4 = i4 + 4 | 0;
   } while ((i4 | 0) != (i1 | 0));
   i1 = i3;
   i3 = i9;
   i2 = HEAP32[i9 >> 2] | 0;
  }
  HEAP32[i3 >> 2] = i6;
  HEAP32[i11 >> 2] = i7;
  HEAP32[i12 >> 2] = i1;
  HEAP32[i10 >> 2] = i8;
  if (i2) {
   __ZdlPv(i2);
   i1 = HEAP32[i12 >> 2] | 0;
  }
 } while (0);
 HEAP32[i1 >> 2] = HEAP32[i13 >> 2];
 HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + 4;
 return;
}

function __ZN13b2DynamicTree12AllocateNodeEv(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i6 = i2 + 16 | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 if ((i1 | 0) == -1) {
  i4 = i2 + 8 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
  i5 = i2 + 12 | 0;
  if ((i1 | 0) != (HEAP32[i5 >> 2] | 0)) ___assert_fail(5055, 4451, 58, 5085);
  i2 = i2 + 4 | 0;
  i3 = HEAP32[i2 >> 2] | 0;
  HEAP32[i5 >> 2] = i1 << 1;
  i7 = _malloc(i1 * 72 | 0) | 0;
  HEAP32[i2 >> 2] = i7;
  _memcpy(i7 | 0, i3 | 0, i1 * 36 | 0) | 0;
  _free(i3);
  i3 = HEAP32[i4 >> 2] | 0;
  i1 = (HEAP32[i5 >> 2] | 0) + -1 | 0;
  i2 = HEAP32[i2 >> 2] | 0;
  if ((i3 | 0) < (i1 | 0)) do {
   i1 = i3;
   i3 = i3 + 1 | 0;
   HEAP32[i2 + (i1 * 36 | 0) + 20 >> 2] = i3;
   HEAP32[i2 + (i1 * 36 | 0) + 32 >> 2] = -1;
   i1 = (HEAP32[i5 >> 2] | 0) + -1 | 0;
  } while ((i3 | 0) < (i1 | 0));
  HEAP32[i2 + (i1 * 36 | 0) + 20 >> 2] = -1;
  HEAP32[i2 + (((HEAP32[i5 >> 2] | 0) + -1 | 0) * 36 | 0) + 32 >> 2] = -1;
  i1 = HEAP32[i4 >> 2] | 0;
  HEAP32[i6 >> 2] = i1;
  i3 = i4;
 } else {
  i3 = i2 + 8 | 0;
  i2 = HEAP32[i2 + 4 >> 2] | 0;
 }
 i7 = i2 + (i1 * 36 | 0) + 20 | 0;
 HEAP32[i6 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i7 >> 2] = -1;
 HEAP32[i2 + (i1 * 36 | 0) + 24 >> 2] = -1;
 HEAP32[i2 + (i1 * 36 | 0) + 28 >> 2] = -1;
 HEAP32[i2 + (i1 * 36 | 0) + 32 >> 2] = 0;
 HEAP32[i2 + (i1 * 36 | 0) + 16 >> 2] = 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 1;
 return i1 | 0;
}

function __ZN15b2CircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i1, i4, i5, i6) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0, d7 = 0.0, d8 = 0.0, d9 = 0.0, i10 = 0, i11 = 0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0;
 i11 = HEAP32[(HEAP32[i1 + 48 >> 2] | 0) + 12 >> 2] | 0;
 i10 = HEAP32[(HEAP32[i1 + 52 >> 2] | 0) + 12 >> 2] | 0;
 i2 = i4 + 60 | 0;
 HEAP32[i2 >> 2] = 0;
 i3 = i11 + 12 | 0;
 d7 = +HEAPF32[i5 + 12 >> 2];
 d13 = +HEAPF32[i3 >> 2];
 d12 = +HEAPF32[i5 + 8 >> 2];
 d8 = +HEAPF32[i11 + 16 >> 2];
 i1 = i10 + 12 | 0;
 d15 = +HEAPF32[i6 + 12 >> 2];
 d17 = +HEAPF32[i1 >> 2];
 d16 = +HEAPF32[i6 + 8 >> 2];
 d14 = +HEAPF32[i10 + 16 >> 2];
 d9 = +HEAPF32[i6 >> 2] + (d15 * d17 - d16 * d14) - (+HEAPF32[i5 >> 2] + (d7 * d13 - d12 * d8));
 d8 = d17 * d16 + d15 * d14 + +HEAPF32[i6 + 4 >> 2] - (d13 * d12 + d7 * d8 + +HEAPF32[i5 + 4 >> 2]);
 d7 = +HEAPF32[i11 + 8 >> 2] + +HEAPF32[i10 + 8 >> 2];
 if (d9 * d9 + d8 * d8 > d7 * d7) return;
 HEAP32[i4 + 56 >> 2] = 0;
 i11 = i3;
 i10 = HEAP32[i11 + 4 >> 2] | 0;
 i6 = i4 + 48 | 0;
 HEAP32[i6 >> 2] = HEAP32[i11 >> 2];
 HEAP32[i6 + 4 >> 2] = i10;
 HEAPF32[i4 + 40 >> 2] = 0.0;
 HEAPF32[i4 + 44 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1;
 i6 = i1;
 i10 = HEAP32[i6 + 4 >> 2] | 0;
 i11 = i4;
 HEAP32[i11 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i11 + 4 >> 2] = i10;
 HEAP32[i4 + 16 >> 2] = 0;
 return;
}

function __ZNK13b2CircleShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi(i6, i12, i11, i4, i2) {
 i6 = i6 | 0;
 i12 = i12 | 0;
 i11 = i11 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var d1 = 0.0, d3 = 0.0, d5 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0;
 d3 = +HEAPF32[i4 + 12 >> 2];
 d7 = +HEAPF32[i6 + 12 >> 2];
 d1 = +HEAPF32[i4 + 8 >> 2];
 d10 = +HEAPF32[i6 + 16 >> 2];
 d5 = +HEAPF32[i11 >> 2];
 d9 = d5 - (+HEAPF32[i4 >> 2] + (d3 * d7 - d1 * d10));
 d8 = +HEAPF32[i11 + 4 >> 2];
 d10 = d8 - (+HEAPF32[i4 + 4 >> 2] + (d7 * d1 + d3 * d10));
 d3 = +HEAPF32[i6 + 8 >> 2];
 d5 = +HEAPF32[i11 + 8 >> 2] - d5;
 d8 = +HEAPF32[i11 + 12 >> 2] - d8;
 d1 = d9 * d5 + d10 * d8;
 d7 = d5 * d5 + d8 * d8;
 d3 = d1 * d1 - (d9 * d9 + d10 * d10 - d3 * d3) * d7;
 if (d7 < 1.1920928955078125e-007 | d3 < 0.0) {
  i12 = 0;
  return i12 | 0;
 }
 d3 = d1 + +Math_sqrt(+d3);
 d1 = -d3;
 if (!(d3 <= -0.0)) {
  i12 = 0;
  return i12 | 0;
 }
 if (!(d7 * +HEAPF32[i11 + 16 >> 2] >= d1)) {
  i12 = 0;
  return i12 | 0;
 }
 d1 = d1 / d7;
 HEAPF32[i12 + 8 >> 2] = d1;
 d5 = d9 + d5 * d1;
 d1 = d10 + d8 * d1;
 HEAPF32[i12 >> 2] = d5;
 i2 = i12 + 4 | 0;
 HEAPF32[i2 >> 2] = d1;
 d3 = +Math_sqrt(+(d5 * d5 + d1 * d1));
 if (d3 < 1.1920928955078125e-007) {
  i12 = 1;
  return i12 | 0;
 }
 d10 = 1.0 / d3;
 HEAPF32[i12 >> 2] = d5 * d10;
 HEAPF32[i2 >> 2] = d1 * d10;
 i12 = 1;
 return i12 | 0;
}

function __ZNSt3__19to_stringEi(i9, i6) {
 i9 = i9 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i10 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i10;
 i8 = i10 + 4 | 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i8 + 4 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 if (!(HEAP8[i8 >> 0] & 1)) i1 = 10; else i1 = (HEAP32[i8 >> 2] & -2) + -1 | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
 i3 = HEAP8[i8 >> 0] | 0;
 i4 = i8 + 1 | 0;
 i5 = i8 + 8 | 0;
 i2 = i3;
 i3 = (i3 & 1) == 0 ? (i3 & 255) >>> 1 : HEAP32[i8 + 4 >> 2] | 0;
 while (1) {
  i1 = (i2 & 1) == 0 ? i4 : HEAP32[i5 >> 2] | 0;
  HEAP32[i7 >> 2] = i6;
  i1 = _snprintf(i1, i3 + 1 | 0, 13986, i7) | 0;
  if ((i1 | 0) > -1) {
   if (i1 >>> 0 <= i3 >>> 0) break;
  } else i1 = i3 << 1 | 1;
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
  i2 = HEAP8[i8 >> 0] | 0;
  i3 = i1;
 }
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
 HEAP32[i9 >> 2] = HEAP32[i8 >> 2];
 HEAP32[i9 + 4 >> 2] = HEAP32[i8 + 4 >> 2];
 HEAP32[i9 + 8 >> 2] = HEAP32[i8 + 8 >> 2];
 HEAP32[i8 >> 2] = 0;
 HEAP32[i8 + 4 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i8);
 STACKTOP = i10;
 return;
}

function __ZNSt3__19to_stringEf(i9, d2) {
 i9 = i9 | 0;
 d2 = +d2;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i7 = i10;
 i8 = i10 + 8 | 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i8 + 4 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 if (!(HEAP8[i8 >> 0] & 1)) i1 = 10; else i1 = (HEAP32[i8 >> 2] & -2) + -1 | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
 i4 = HEAP8[i8 >> 0] | 0;
 i6 = i8 + 1 | 0;
 i5 = i8 + 8 | 0;
 i3 = i4;
 i4 = (i4 & 1) == 0 ? (i4 & 255) >>> 1 : HEAP32[i8 + 4 >> 2] | 0;
 while (1) {
  i1 = (i3 & 1) == 0 ? i6 : HEAP32[i5 >> 2] | 0;
  HEAPF64[i7 >> 3] = d2;
  i1 = _snprintf(i1, i4 + 1 | 0, 13989, i7) | 0;
  if ((i1 | 0) > -1) {
   if (i1 >>> 0 <= i4 >>> 0) break;
  } else i1 = i4 << 1 | 1;
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
  i3 = HEAP8[i8 >> 0] | 0;
  i4 = i1;
 }
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i8, i1, 0);
 HEAP32[i9 >> 2] = HEAP32[i8 >> 2];
 HEAP32[i9 + 4 >> 2] = HEAP32[i8 + 4 >> 2];
 HEAP32[i9 + 8 >> 2] = HEAP32[i8 + 8 >> 2];
 HEAP32[i8 >> 2] = 0;
 HEAP32[i8 + 4 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i8);
 STACKTOP = i10;
 return;
}

function __ZN6b2Body12SetTransformERK6b2Vec2f(i4, i2, d3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 var i1 = 0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0;
 i1 = HEAP32[i4 + 88 >> 2] | 0;
 if (HEAP32[i1 + 102872 >> 2] & 2) ___assert_fail(5957, 5701, 450, 6058);
 i5 = i4 + 12 | 0;
 d11 = +Math_sin(+d3);
 HEAPF32[i4 + 20 >> 2] = d11;
 d10 = +Math_cos(+d3);
 HEAPF32[i4 + 24 >> 2] = d10;
 i6 = i2;
 i2 = HEAP32[i6 >> 2] | 0;
 i6 = HEAP32[i6 + 4 >> 2] | 0;
 i7 = i5;
 HEAP32[i7 >> 2] = i2;
 HEAP32[i7 + 4 >> 2] = i6;
 i7 = i4 + 44 | 0;
 d12 = +HEAPF32[i4 + 28 >> 2];
 d8 = +HEAPF32[i4 + 32 >> 2];
 d9 = (HEAP32[tempDoublePtr >> 2] = i2, +HEAPF32[tempDoublePtr >> 2]) + (d10 * d12 - d11 * d8);
 d8 = d12 * d11 + d10 * d8 + (HEAP32[tempDoublePtr >> 2] = i6, +HEAPF32[tempDoublePtr >> 2]);
 HEAPF32[i7 >> 2] = d9;
 HEAPF32[i4 + 48 >> 2] = d8;
 HEAPF32[i4 + 56 >> 2] = d3;
 i6 = HEAP32[i7 + 4 >> 2] | 0;
 i2 = i4 + 36 | 0;
 HEAP32[i2 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i2 + 4 >> 2] = i6;
 HEAPF32[i4 + 52 >> 2] = d3;
 i2 = i1 + 102876 | 0;
 i1 = HEAP32[i4 + 100 >> 2] | 0;
 if (!i1) return;
 do {
  __ZN9b2Fixture11SynchronizeEP12b2BroadPhaseRK11b2TransformS4_(i1, i2, i5, i5);
  i1 = HEAP32[i1 + 4 >> 2] | 0;
 } while ((i1 | 0) != 0);
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEj(i8, i2) {
 i8 = i8 | 0;
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 if (i2 >>> 0 > 4294967279) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i8);
 i1 = HEAP8[i8 >> 0] | 0;
 if (!(i1 & 1)) i3 = 10; else {
  i1 = HEAP32[i8 >> 2] | 0;
  i3 = (i1 & -2) + -1 | 0;
  i1 = i1 & 255;
 }
 if (!(i1 & 1)) i7 = (i1 & 255) >>> 1; else i7 = HEAP32[i8 + 4 >> 2] | 0;
 i2 = i7 >>> 0 > i2 >>> 0 ? i7 : i2;
 if (i2 >>> 0 < 11) i6 = 10; else i6 = (i2 + 16 & -16) + -1 | 0;
 do if ((i6 | 0) != (i3 | 0)) {
  do if ((i6 | 0) != 10) {
   i2 = __Znwj(i6 + 1 | 0) | 0;
   if (!(i1 & 1)) {
    i3 = 1;
    i4 = i8 + 1 | 0;
    i5 = 0;
    break;
   } else {
    i3 = 1;
    i4 = HEAP32[i8 + 8 >> 2] | 0;
    i5 = 1;
    break;
   }
  } else {
   i2 = i8 + 1 | 0;
   i3 = 0;
   i4 = HEAP32[i8 + 8 >> 2] | 0;
   i5 = 1;
  } while (0);
  if (!(i1 & 1)) i1 = (i1 & 255) >>> 1; else i1 = HEAP32[i8 + 4 >> 2] | 0;
  _memcpy(i2 | 0, i4 | 0, i1 + 1 | 0) | 0;
  if (i5) __ZdlPv(i4);
  if (i3) {
   HEAP32[i8 >> 2] = i6 + 1 | 1;
   HEAP32[i8 + 4 >> 2] = i7;
   HEAP32[i8 + 8 >> 2] = i2;
   break;
  } else {
   HEAP8[i8 >> 0] = i7 << 1;
   break;
  }
 } while (0);
 return;
}

function __ZNSt3__16vectorI8BallInfoNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i6 = i11 + 4 | 0;
 i7 = HEAP32[i11 >> 2] | 0;
 i8 = i7;
 i2 = ((HEAP32[i6 >> 2] | 0) - i8 >> 4) + 1 | 0;
 if (i2 >>> 0 > 268435455) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
 i9 = i11 + 8 | 0;
 i3 = i7;
 i1 = (HEAP32[i9 >> 2] | 0) - i3 | 0;
 if (i1 >> 4 >>> 0 < 134217727) {
  i1 = i1 >> 3;
  i1 = i1 >>> 0 < i2 >>> 0 ? i2 : i1;
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i2 = i3 >> 4;
  if (!i1) {
   i5 = 0;
   i4 = 0;
   i1 = i3;
  } else i12 = 6;
 } else {
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i1 = 268435455;
  i2 = i3 >> 4;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i5 = i1;
  i4 = __Znwj(i1 << 4) | 0;
  i1 = i3;
 }
 i12 = i4 + (i2 << 4) | 0;
 HEAP32[i12 >> 2] = HEAP32[i10 >> 2];
 HEAP32[i12 + 4 >> 2] = HEAP32[i10 + 4 >> 2];
 HEAP32[i12 + 8 >> 2] = HEAP32[i10 + 8 >> 2];
 HEAP32[i12 + 12 >> 2] = HEAP32[i10 + 12 >> 2];
 _memcpy(i4 | 0, i7 | 0, i1 | 0) | 0;
 HEAP32[i11 >> 2] = i4;
 HEAP32[i6 >> 2] = i4 + (i2 + 1 << 4);
 HEAP32[i9 >> 2] = i4 + (i5 << 4);
 if (!i8) return;
 __ZdlPv(i8);
 return;
}

function __ZL25default_terminate_handlerv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i7 = i5 + 32 | 0;
 i3 = i5 + 24 | 0;
 i8 = i5 + 16 | 0;
 i6 = i5;
 i5 = i5 + 36 | 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if ((i1 | 0) != 0 ? (i4 = HEAP32[i1 >> 2] | 0, (i4 | 0) != 0) : 0) {
  i1 = i4 + 48 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i1 = HEAP32[i1 + 4 >> 2] | 0;
  if (!((i2 & -256 | 0) == 1126902528 & (i1 | 0) == 1129074247)) {
   HEAP32[i3 >> 2] = HEAP32[420];
   _abort_message(10461, i3);
  }
  if ((i2 | 0) == 1126902529 & (i1 | 0) == 1129074247) i1 = HEAP32[i4 + 44 >> 2] | 0; else i1 = i4 + 80 | 0;
  HEAP32[i5 >> 2] = i1;
  i4 = HEAP32[i4 >> 2] | 0;
  i1 = HEAP32[i4 + 4 >> 2] | 0;
  if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[472 >> 2] | 0) + 16 >> 2] & 15](472, i4, i5) | 0) {
   i8 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[420] | 0;
   i8 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 7](i8) | 0;
   HEAP32[i6 >> 2] = i5;
   HEAP32[i6 + 4 >> 2] = i1;
   HEAP32[i6 + 8 >> 2] = i8;
   _abort_message(10375, i6);
  } else {
   HEAP32[i8 >> 2] = HEAP32[420];
   HEAP32[i8 + 4 >> 2] = i1;
   _abort_message(10420, i8);
  }
 }
 _abort_message(10499, i7);
}

function _memchr(i1, i5, i2) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = i5 & 255;
 i3 = (i2 | 0) != 0;
 L1 : do if (i3 & (i1 & 3 | 0) != 0) {
  i4 = i5 & 255;
  while (1) {
   if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) {
    i7 = 6;
    break L1;
   }
   i1 = i1 + 1 | 0;
   i2 = i2 + -1 | 0;
   i3 = (i2 | 0) != 0;
   if (!(i3 & (i1 & 3 | 0) != 0)) {
    i7 = 5;
    break;
   }
  }
 } else i7 = 5; while (0);
 if ((i7 | 0) == 5) if (i3) i7 = 6; else i2 = 0;
 L8 : do if ((i7 | 0) == 6) {
  i4 = i5 & 255;
  if ((HEAP8[i1 >> 0] | 0) != i4 << 24 >> 24) {
   i3 = Math_imul(i6, 16843009) | 0;
   L11 : do if (i2 >>> 0 > 3) while (1) {
    i6 = HEAP32[i1 >> 2] ^ i3;
    if ((i6 & -2139062144 ^ -2139062144) & i6 + -16843009) break;
    i1 = i1 + 4 | 0;
    i2 = i2 + -4 | 0;
    if (i2 >>> 0 <= 3) {
     i7 = 11;
     break L11;
    }
   } else i7 = 11; while (0);
   if ((i7 | 0) == 11) if (!i2) {
    i2 = 0;
    break;
   }
   while (1) {
    if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) break L8;
    i1 = i1 + 1 | 0;
    i2 = i2 + -1 | 0;
    if (!i2) {
     i2 = 0;
     break;
    }
   }
  }
 } while (0);
 return ((i2 | 0) != 0 ? i1 : 0) | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKcj(i7, i4, i2, i6) {
 i7 = i7 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 i6 = i6 | 0;
 var i1 = 0, i3 = 0, i5 = 0;
 i1 = HEAP8[i7 >> 0] | 0;
 i3 = (i1 & 1) == 0;
 if (i3) i5 = (i1 & 255) >>> 1; else i5 = HEAP32[i7 + 4 >> 2] | 0;
 if (i5 >>> 0 < i4 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_out_of_rangeEv(i7);
 if (i3) i3 = 10; else {
  i1 = HEAP32[i7 >> 2] | 0;
  i3 = (i1 & -2) + -1 | 0;
  i1 = i1 & 255;
 }
 if ((i3 - i5 | 0) >>> 0 >= i6 >>> 0) {
  if (i6) {
   if (!(i1 & 1)) i3 = i7 + 1 | 0; else i3 = HEAP32[i7 + 8 >> 2] | 0;
   if ((i5 | 0) == (i4 | 0)) i1 = i3 + i4 | 0; else {
    i1 = i3 + i4 | 0;
    _memmove(i3 + (i6 + i4) | 0, i1 | 0, i5 - i4 | 0) | 0;
    i2 = i1 >>> 0 <= i2 >>> 0 & (i3 + i5 | 0) >>> 0 > i2 >>> 0 ? i2 + i6 | 0 : i2;
   }
   _memmove(i1 | 0, i2 | 0, i6 | 0) | 0;
   i1 = i5 + i6 | 0;
   if (!(HEAP8[i7 >> 0] & 1)) HEAP8[i7 >> 0] = i1 << 1; else HEAP32[i7 + 4 >> 2] = i1;
   HEAP8[i3 + i1 >> 0] = 0;
  }
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(i7, i3, i5 + i6 - i3 | 0, i5, i4, 0, i6, i2);
 return i7 | 0;
}

function __ZN9b2Contact7DestroyEPS_P16b2BlockAllocator(i7, i6) {
 i7 = i7 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 if (!(HEAP8[3728] | 0)) ___assert_fail(6071, 6093, 103, 6050);
 i4 = HEAP32[i7 + 48 >> 2] | 0;
 i5 = HEAP32[i7 + 52 >> 2] | 0;
 if (((HEAP32[i7 + 124 >> 2] | 0) > 0 ? (HEAP8[i4 + 38 >> 0] | 0) == 0 : 0) ? (HEAP8[i5 + 38 >> 0] | 0) == 0 : 0) {
  i1 = HEAP32[i4 + 8 >> 2] | 0;
  i2 = i1 + 4 | 0;
  i3 = HEAPU16[i2 >> 1] | 0;
  if (!(i3 & 2)) {
   HEAP16[i2 >> 1] = i3 | 2;
   HEAPF32[i1 + 144 >> 2] = 0.0;
   i3 = HEAP32[i1 + 88 >> 2] | 0;
   HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 1;
  }
  i1 = HEAP32[i5 + 8 >> 2] | 0;
  i2 = i1 + 4 | 0;
  i3 = HEAPU16[i2 >> 1] | 0;
  if (!(i3 & 2)) {
   HEAP16[i2 >> 1] = i3 | 2;
   HEAPF32[i1 + 144 >> 2] = 0.0;
   i3 = HEAP32[i1 + 88 >> 2] | 0;
   HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 1;
  }
 }
 i2 = HEAP32[(HEAP32[i4 + 12 >> 2] | 0) + 4 >> 2] | 0;
 i1 = HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0;
 if ((i2 | 0) > -1 & (i1 | 0) < 4) {
  FUNCTION_TABLE_vii[HEAP32[1028 + (i2 * 48 | 0) + (i1 * 12 | 0) + 4 >> 2] & 15](i7, i6);
  return;
 } else ___assert_fail(6155, 6093, 119, 6050);
}

function __Z12cpp_progressv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i1 = HEAP32[180] | 0;
 i5 = i1 + 44 | 0;
 i8 = i1 + 40 | 0;
 i2 = HEAP32[i8 >> 2] | 0;
 if ((HEAP32[i5 >> 2] | 0) != (i2 | 0)) {
  i4 = i1 + 52 | 0;
  i3 = 0;
  do {
   i1 = HEAP32[i2 + (i3 << 2) >> 2] | 0;
   if ((((i1 | 0) != 0 ? !(FUNCTION_TABLE_ii[HEAP32[(HEAP32[i1 >> 2] | 0) + 8 >> 2] & 7](i1) | 0) : 0) ? (FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1), HEAP32[(HEAP32[i8 >> 2] | 0) + (i3 << 2) >> 2] = 0, i2 = (HEAP32[i4 >> 2] | 0) + -1 | 0, HEAP32[i4 >> 2] = i2, (i2 | 0) == 0) : 0) ? (i6 = HEAP32[i8 >> 2] | 0, i7 = HEAP32[i5 >> 2] | 0, (i7 | 0) != (i6 | 0)) : 0) HEAP32[i5 >> 2] = i7 + (~((i7 + -4 - i6 | 0) >>> 2) << 2);
   i3 = i3 + 1 | 0;
   i2 = HEAP32[i8 >> 2] | 0;
  } while (i3 >>> 0 < (HEAP32[i5 >> 2] | 0) - i2 >> 2 >>> 0);
 }
 __ZN7b2World4StepEfii(HEAP32[178] | 0, +HEAPF32[181], HEAP32[182] | 0, HEAP32[183] | 0);
 if ((HEAP32[HEAP32[178] >> 2] | 0) > 0) {
  i8 = 1;
  return i8 | 0;
 }
 i8 = (HEAP8[(HEAP32[180] | 0) + 56 >> 0] | 0) != 0;
 return i8 | 0;
}

function __ZNSt3__16vectorIP6b2BodyNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i6 = i11 + 4 | 0;
 i7 = HEAP32[i11 >> 2] | 0;
 i8 = i7;
 i2 = ((HEAP32[i6 >> 2] | 0) - i8 >> 2) + 1 | 0;
 if (i2 >>> 0 > 1073741823) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
 i9 = i11 + 8 | 0;
 i3 = i7;
 i1 = (HEAP32[i9 >> 2] | 0) - i3 | 0;
 if (i1 >> 2 >>> 0 < 536870911) {
  i1 = i1 >> 1;
  i1 = i1 >>> 0 < i2 >>> 0 ? i2 : i1;
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i2 = i3 >> 2;
  if (!i1) {
   i5 = 0;
   i4 = 0;
   i1 = i3;
  } else i12 = 6;
 } else {
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i1 = 1073741823;
  i2 = i3 >> 2;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i5 = i1;
  i4 = __Znwj(i1 << 2) | 0;
  i1 = i3;
 }
 HEAP32[i4 + (i2 << 2) >> 2] = HEAP32[i10 >> 2];
 _memcpy(i4 | 0, i7 | 0, i1 | 0) | 0;
 HEAP32[i11 >> 2] = i4;
 HEAP32[i6 >> 2] = i4 + (i2 + 1 << 2);
 HEAP32[i9 >> 2] = i4 + (i5 << 2);
 if (!i8) return;
 __ZdlPv(i8);
 return;
}

function __ZNSt3__16vectorIP4AnimNS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i6 = i11 + 4 | 0;
 i7 = HEAP32[i11 >> 2] | 0;
 i8 = i7;
 i2 = ((HEAP32[i6 >> 2] | 0) - i8 >> 2) + 1 | 0;
 if (i2 >>> 0 > 1073741823) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
 i9 = i11 + 8 | 0;
 i3 = i7;
 i1 = (HEAP32[i9 >> 2] | 0) - i3 | 0;
 if (i1 >> 2 >>> 0 < 536870911) {
  i1 = i1 >> 1;
  i1 = i1 >>> 0 < i2 >>> 0 ? i2 : i1;
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i2 = i3 >> 2;
  if (!i1) {
   i5 = 0;
   i4 = 0;
   i1 = i3;
  } else i12 = 6;
 } else {
  i3 = (HEAP32[i6 >> 2] | 0) - i3 | 0;
  i1 = 1073741823;
  i2 = i3 >> 2;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i5 = i1;
  i4 = __Znwj(i1 << 2) | 0;
  i1 = i3;
 }
 HEAP32[i4 + (i2 << 2) >> 2] = HEAP32[i10 >> 2];
 _memcpy(i4 | 0, i7 | 0, i1 | 0) | 0;
 HEAP32[i11 >> 2] = i4;
 HEAP32[i6 >> 2] = i4 + (i2 + 1 << 2);
 HEAP32[i9 >> 2] = i4 + (i5 << 2);
 if (!i8) return;
 __ZdlPv(i8);
 return;
}

function __ZN24b2ChainAndPolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i2, i6, i3, i1) {
 i5 = i5 | 0;
 i2 = i2 | 0;
 i6 = i6 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i4 = __ZN16b2BlockAllocator8AllocateEi(i1, 148) | 0;
 HEAP32[i4 + 4 >> 2] = 4;
 HEAP32[i4 + 48 >> 2] = i5;
 HEAP32[i4 + 52 >> 2] = i6;
 HEAP32[i4 + 56 >> 2] = i2;
 HEAP32[i4 + 60 >> 2] = i3;
 HEAP32[i4 + 124 >> 2] = 0;
 HEAP32[i4 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i2 = i4 + 8 | 0;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAPF32[i4 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i4 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i4 + 144 >> 2] = 0.0;
 HEAP32[i4 >> 2] = 996;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 3) ___assert_fail(7072, 7257, 42, 7334);
 if ((HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0) == 2) return i4 | 0; else ___assert_fail(7359, 7257, 43, 7334);
 return 0;
}

function __ZN23b2EdgeAndPolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i1, i6, i2, i3) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i3, 148) | 0;
 HEAP32[i2 + 4 >> 2] = 4;
 HEAP32[i2 + 48 >> 2] = i5;
 HEAP32[i2 + 52 >> 2] = i6;
 HEAP32[i2 + 56 >> 2] = 0;
 HEAP32[i2 + 60 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = 0;
 HEAP32[i2 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i3 = i2 + 8 | 0;
 i4 = i3 + 40 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF32[i2 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i2 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i2 + 144 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1248;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 1) ___assert_fail(7764, 7903, 40, 7979);
 if ((HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0) == 2) return i2 | 0; else ___assert_fail(7359, 7903, 41, 7979);
 return 0;
}

function __ZN25b2PolygonAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i1, i6, i2, i3) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i3, 148) | 0;
 HEAP32[i2 + 4 >> 2] = 4;
 HEAP32[i2 + 48 >> 2] = i5;
 HEAP32[i2 + 52 >> 2] = i6;
 HEAP32[i2 + 56 >> 2] = 0;
 HEAP32[i2 + 60 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = 0;
 HEAP32[i2 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i3 = i2 + 8 | 0;
 i4 = i3 + 40 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF32[i2 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i2 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i2 + 144 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1268;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 2) ___assert_fail(7530, 7574, 40, 7652);
 if (!(HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0)) return i2 | 0; else ___assert_fail(7214, 7574, 41, 7652);
 return 0;
}

function __ZN23b2ChainAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i2, i6, i3, i1) {
 i5 = i5 | 0;
 i2 = i2 | 0;
 i6 = i6 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i4 = __ZN16b2BlockAllocator8AllocateEi(i1, 148) | 0;
 HEAP32[i4 + 4 >> 2] = 4;
 HEAP32[i4 + 48 >> 2] = i5;
 HEAP32[i4 + 52 >> 2] = i6;
 HEAP32[i4 + 56 >> 2] = i2;
 HEAP32[i4 + 60 >> 2] = i3;
 HEAP32[i4 + 124 >> 2] = 0;
 HEAP32[i4 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i2 = i4 + 8 | 0;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAPF32[i4 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i4 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i4 + 144 >> 2] = 0.0;
 HEAP32[i4 >> 2] = 976;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 3) ___assert_fail(7072, 7114, 42, 7190);
 if (!(HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0)) return i4 | 0; else ___assert_fail(7214, 7114, 43, 7190);
 return 0;
}

function __ZN22b2EdgeAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i1, i6, i2, i3) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i3, 148) | 0;
 HEAP32[i2 + 4 >> 2] = 4;
 HEAP32[i2 + 48 >> 2] = i5;
 HEAP32[i2 + 52 >> 2] = i6;
 HEAP32[i2 + 56 >> 2] = 0;
 HEAP32[i2 + 60 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = 0;
 HEAP32[i2 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i3 = i2 + 8 | 0;
 i4 = i3 + 40 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF32[i2 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i2 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i2 + 144 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1228;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 1) ___assert_fail(7764, 7805, 40, 7880);
 if (!(HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0)) return i2 | 0; else ___assert_fail(7214, 7805, 41, 7880);
 return 0;
}

function __ZN16b2PolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i1, i6, i2, i3) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i3, 148) | 0;
 HEAP32[i2 + 4 >> 2] = 4;
 HEAP32[i2 + 48 >> 2] = i5;
 HEAP32[i2 + 52 >> 2] = i6;
 HEAP32[i2 + 56 >> 2] = 0;
 HEAP32[i2 + 60 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = 0;
 HEAP32[i2 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i3 = i2 + 8 | 0;
 i4 = i3 + 40 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF32[i2 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i2 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i2 + 144 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1288;
 if ((HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) != 2) ___assert_fail(7530, 7678, 43, 7747);
 if ((HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0) == 2) return i2 | 0; else ___assert_fail(7359, 7678, 44, 7747);
 return 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(i11, i10, i1, i4, i8, i9, i7, i5) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i7 = i7 | 0;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i6 = 0;
 if ((-18 - i10 | 0) >>> 0 < i1 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i11);
 if (!(HEAP8[i11 >> 0] & 1)) i6 = i11 + 1 | 0; else i6 = HEAP32[i11 + 8 >> 2] | 0;
 if (i10 >>> 0 < 2147483623) {
  i2 = i1 + i10 | 0;
  i3 = i10 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i2 = i2 >>> 0 < 11 ? 11 : i2 + 16 & -16;
 } else i2 = -17;
 i3 = __Znwj(i2) | 0;
 if (i8) _memcpy(i3 | 0, i6 | 0, i8 | 0) | 0;
 if (i7) _memcpy(i3 + i8 | 0, i5 | 0, i7 | 0) | 0;
 i1 = i4 - i9 | 0;
 if ((i1 | 0) != (i8 | 0)) _memcpy(i3 + (i7 + i8) | 0, i6 + (i9 + i8) | 0, i1 - i8 | 0) | 0;
 if ((i10 | 0) != 10) __ZdlPv(i6);
 HEAP32[i11 + 8 >> 2] = i3;
 HEAP32[i11 >> 2] = i2 | 1;
 i10 = i1 + i7 | 0;
 HEAP32[i11 + 4 >> 2] = i10;
 HEAP8[i3 + i10 >> 0] = 0;
 return;
}

function ___fwritex(i3, i4, i6) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i5 = 0, i7 = 0;
 i1 = i6 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!i2) if (!(___towrite(i6) | 0)) {
  i2 = HEAP32[i1 >> 2] | 0;
  i5 = 4;
 } else i1 = 0; else i5 = 4;
 L4 : do if ((i5 | 0) == 4) {
  i7 = i6 + 20 | 0;
  i5 = HEAP32[i7 >> 2] | 0;
  if ((i2 - i5 | 0) >>> 0 < i4 >>> 0) {
   i1 = FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 15](i6, i3, i4) | 0;
   break;
  }
  L9 : do if ((HEAP8[i6 + 75 >> 0] | 0) > -1) {
   i1 = i4;
   while (1) {
    if (!i1) {
     i2 = i5;
     i1 = 0;
     break L9;
    }
    i2 = i1 + -1 | 0;
    if ((HEAP8[i3 + i2 >> 0] | 0) == 10) break; else i1 = i2;
   }
   if ((FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 15](i6, i3, i1) | 0) >>> 0 < i1 >>> 0) break L4;
   i4 = i4 - i1 | 0;
   i3 = i3 + i1 | 0;
   i2 = HEAP32[i7 >> 2] | 0;
  } else {
   i2 = i5;
   i1 = 0;
  } while (0);
  _memcpy(i2 | 0, i3 | 0, i4 | 0) | 0;
  HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + i4;
  i1 = i1 + i4 | 0;
 } while (0);
 return i1 | 0;
}

function __ZN15b2CircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator(i5, i1, i6, i2, i3) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, d7 = 0.0, d8 = 0.0;
 i2 = __ZN16b2BlockAllocator8AllocateEi(i3, 148) | 0;
 HEAP32[i2 + 4 >> 2] = 4;
 HEAP32[i2 + 48 >> 2] = i5;
 HEAP32[i2 + 52 >> 2] = i6;
 HEAP32[i2 + 56 >> 2] = 0;
 HEAP32[i2 + 60 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = 0;
 HEAP32[i2 + 128 >> 2] = 0;
 i1 = i5 + 16 | 0;
 i3 = i2 + 8 | 0;
 i4 = i3 + 40 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF32[i2 + 136 >> 2] = +Math_sqrt(+(+HEAPF32[i1 >> 2] * +HEAPF32[i6 + 16 >> 2]));
 d8 = +HEAPF32[i5 + 20 >> 2];
 d7 = +HEAPF32[i6 + 20 >> 2];
 HEAPF32[i2 + 140 >> 2] = d8 > d7 ? d8 : d7;
 HEAPF32[i2 + 144 >> 2] = 0.0;
 HEAP32[i2 >> 2] = 1016;
 if (HEAP32[(HEAP32[i5 + 12 >> 2] | 0) + 4 >> 2] | 0) ___assert_fail(7403, 7446, 43, 7514);
 if (!(HEAP32[(HEAP32[i6 + 12 >> 2] | 0) + 4 >> 2] | 0)) return i2 | 0; else ___assert_fail(7214, 7446, 44, 7514);
 return 0;
}

function _vsnprintf(i3, i1, i10, i8) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i10 = i10 | 0;
 i8 = i8 | 0;
 var i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i11 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 128 | 0;
 i2 = i11 + 112 | 0;
 i9 = i11;
 i4 = i9;
 i5 = 1744;
 i6 = i4 + 112 | 0;
 do {
  HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
  i4 = i4 + 4 | 0;
  i5 = i5 + 4 | 0;
 } while ((i4 | 0) < (i6 | 0));
 if ((i1 + -1 | 0) >>> 0 > 2147483646) if (!i1) {
  i1 = 1;
  i7 = 4;
 } else {
  HEAP32[(___errno_location() | 0) >> 2] = 75;
  i1 = -1;
 } else {
  i2 = i3;
  i7 = 4;
 }
 if ((i7 | 0) == 4) {
  i7 = -2 - i2 | 0;
  i7 = i1 >>> 0 > i7 >>> 0 ? i7 : i1;
  HEAP32[i9 + 48 >> 2] = i7;
  i3 = i9 + 20 | 0;
  HEAP32[i3 >> 2] = i2;
  HEAP32[i9 + 44 >> 2] = i2;
  i1 = i2 + i7 | 0;
  i2 = i9 + 16 | 0;
  HEAP32[i2 >> 2] = i1;
  HEAP32[i9 + 28 >> 2] = i1;
  i1 = _vfprintf(i9, i10, i8) | 0;
  if (i7) {
   i10 = HEAP32[i3 >> 2] | 0;
   HEAP8[i10 + (((i10 | 0) == (HEAP32[i2 >> 2] | 0)) << 31 >> 31) >> 0] = 0;
  }
 }
 STACKTOP = i11;
 return i1 | 0;
}

function __ZNK11b2EdgeShape5CloneEP16b2BlockAllocator(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 i1 = __ZN16b2BlockAllocator8AllocateEi(i1, 48) | 0;
 HEAP32[i1 >> 2] = 1308;
 i3 = i1 + 4 | 0;
 HEAP32[i3 >> 2] = 1;
 HEAPF32[i1 + 8 >> 2] = .009999999776482582;
 i5 = i1 + 28 | 0;
 HEAP32[i5 >> 2] = 0;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAP32[i5 + 8 >> 2] = 0;
 HEAP32[i5 + 12 >> 2] = 0;
 HEAP16[i5 + 16 >> 1] = 0;
 i5 = i2 + 4 | 0;
 i4 = HEAP32[i5 + 4 >> 2] | 0;
 HEAP32[i3 >> 2] = HEAP32[i5 >> 2];
 HEAP32[i3 + 4 >> 2] = i4;
 i3 = i1 + 12 | 0;
 i2 = i2 + 12 | 0;
 HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
 HEAP32[i3 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
 HEAP32[i3 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
 HEAP32[i3 + 12 >> 2] = HEAP32[i2 + 12 >> 2];
 HEAP32[i3 + 16 >> 2] = HEAP32[i2 + 16 >> 2];
 HEAP32[i3 + 20 >> 2] = HEAP32[i2 + 20 >> 2];
 HEAP32[i3 + 24 >> 2] = HEAP32[i2 + 24 >> 2];
 HEAP32[i3 + 28 >> 2] = HEAP32[i2 + 28 >> 2];
 HEAP16[i3 + 32 >> 1] = HEAP16[i2 + 32 >> 1] | 0;
 return i1 | 0;
}

function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(i2, i5, i3, i1, i4) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 HEAP8[i5 + 53 >> 0] = 1;
 do if ((HEAP32[i5 + 4 >> 2] | 0) == (i1 | 0)) {
  HEAP8[i5 + 52 >> 0] = 1;
  i1 = i5 + 16 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if (!i2) {
   HEAP32[i1 >> 2] = i3;
   HEAP32[i5 + 24 >> 2] = i4;
   HEAP32[i5 + 36 >> 2] = 1;
   if (!((i4 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0)) break;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  if ((i2 | 0) != (i3 | 0)) {
   i4 = i5 + 36 | 0;
   HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 1;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  i2 = i5 + 24 | 0;
  i1 = HEAP32[i2 >> 2] | 0;
  if ((i1 | 0) == 2) {
   HEAP32[i2 >> 2] = i4;
   i1 = i4;
  }
  if ((i1 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0) HEAP8[i5 + 54 >> 0] = 1;
 } while (0);
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(i10, i9, i1, i4, i7, i8, i6) {
 i10 = i10 | 0;
 i9 = i9 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0, i5 = 0;
 if ((-17 - i9 | 0) >>> 0 < i1 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i10);
 if (!(HEAP8[i10 >> 0] & 1)) i5 = i10 + 1 | 0; else i5 = HEAP32[i10 + 8 >> 2] | 0;
 if (i9 >>> 0 < 2147483623) {
  i2 = i1 + i9 | 0;
  i3 = i9 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i2 = i2 >>> 0 < 11 ? 11 : i2 + 16 & -16;
 } else i2 = -17;
 i3 = __Znwj(i2) | 0;
 if (i7) _memcpy(i3 | 0, i5 | 0, i7 | 0) | 0;
 i1 = i4 - i8 | 0;
 if ((i1 | 0) != (i7 | 0)) _memcpy(i3 + (i6 + i7) | 0, i5 + (i8 + i7) | 0, i1 - i7 | 0) | 0;
 if ((i9 | 0) != 10) __ZdlPv(i5);
 HEAP32[i10 + 8 >> 2] = i3;
 HEAP32[i10 >> 2] = i2 | 1;
 return;
}

function __ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0;
 L1 : do if ((i1 | 0) != (HEAP32[i5 + 8 >> 2] | 0)) {
  i3 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i3 << 3) | 0;
  __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1 + 16 | 0, i5, i4, i6);
  if ((i3 | 0) > 1) {
   i3 = i5 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6);
    if (HEAP8[i3 >> 0] | 0) break L1;
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  }
 } else __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i5, i4, i6); while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 do if ((i6 | 0) == (HEAP32[i4 + 8 >> 2] | 0)) {
  if ((HEAP32[i4 + 4 >> 2] | 0) == (i3 | 0) ? (i2 = i4 + 28 | 0, (HEAP32[i2 >> 2] | 0) != 1) : 0) HEAP32[i2 >> 2] = i5;
 } else if ((i6 | 0) == (HEAP32[i4 >> 2] | 0)) {
  if ((HEAP32[i4 + 16 >> 2] | 0) != (i3 | 0) ? (i1 = i4 + 20 | 0, (HEAP32[i1 >> 2] | 0) != (i3 | 0)) : 0) {
   HEAP32[i4 + 32 >> 2] = i5;
   HEAP32[i1 >> 2] = i3;
   i7 = i4 + 40 | 0;
   HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + 1;
   if ((HEAP32[i4 + 36 >> 2] | 0) == 1 ? (HEAP32[i4 + 24 >> 2] | 0) == 2 : 0) HEAP8[i4 + 54 >> 0] = 1;
   HEAP32[i4 + 44 >> 2] = 4;
   break;
  }
  if ((i5 | 0) == 1) HEAP32[i4 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEjc(i6, i5, i4) {
 i6 = i6 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 if (i5) {
  i1 = HEAP8[i6 >> 0] | 0;
  if (!(i1 & 1)) i2 = 10; else {
   i1 = HEAP32[i6 >> 2] | 0;
   i2 = (i1 & -2) + -1 | 0;
   i1 = i1 & 255;
  }
  if (!(i1 & 1)) i3 = (i1 & 255) >>> 1; else i3 = HEAP32[i6 + 4 >> 2] | 0;
  if ((i2 - i3 | 0) >>> 0 < i5 >>> 0) {
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(i6, i2, i5 - i2 + i3 | 0, i3, i3, 0, 0);
   i1 = HEAP8[i6 >> 0] | 0;
  }
  if (!(i1 & 1)) i2 = i6 + 1 | 0; else i2 = HEAP32[i6 + 8 >> 2] | 0;
  _memset(i2 + i3 | 0, i4 | 0, i5 | 0) | 0;
  i1 = i3 + i5 | 0;
  if (!(HEAP8[i6 >> 0] & 1)) HEAP8[i6 >> 0] = i1 << 1; else HEAP32[i6 + 4 >> 2] = i1;
  HEAP8[i2 + i1 >> 0] = 0;
 }
 return i6 | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(i6, i5, i4) {
 i6 = i6 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 i1 = HEAP8[i6 >> 0] | 0;
 if (!(i1 & 1)) i2 = 10; else {
  i1 = HEAP32[i6 >> 2] | 0;
  i2 = (i1 & -2) + -1 | 0;
  i1 = i1 & 255;
 }
 if (!(i1 & 1)) i3 = (i1 & 255) >>> 1; else i3 = HEAP32[i6 + 4 >> 2] | 0;
 if ((i2 - i3 | 0) >>> 0 >= i4 >>> 0) {
  if (i4) {
   if (!(i1 & 1)) i2 = i6 + 1 | 0; else i2 = HEAP32[i6 + 8 >> 2] | 0;
   _memcpy(i2 + i3 | 0, i5 | 0, i4 | 0) | 0;
   i1 = i3 + i4 | 0;
   if (!(HEAP8[i6 >> 0] & 1)) HEAP8[i6 >> 0] = i1 << 1; else HEAP32[i6 + 4 >> 2] = i1;
   HEAP8[i2 + i1 >> 0] = 0;
  }
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(i6, i2, i4 - i2 + i3 | 0, i3, i3, 0, i4, i5);
 return i6 | 0;
}

function __ZNK14b2PolygonShape9TestPointERK11b2TransformRK6b2Vec2(i5, i2, i1) {
 i5 = i5 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var d3 = 0.0, d4 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0;
 d6 = +HEAPF32[i1 >> 2] - +HEAPF32[i2 >> 2];
 d7 = +HEAPF32[i1 + 4 >> 2] - +HEAPF32[i2 + 4 >> 2];
 d8 = +HEAPF32[i2 + 12 >> 2];
 d4 = +HEAPF32[i2 + 8 >> 2];
 d3 = d6 * d8 + d7 * d4;
 d4 = d8 * d7 - d6 * d4;
 i1 = HEAP32[i5 + 148 >> 2] | 0;
 if ((i1 | 0) > 0) i2 = 0; else {
  i5 = 1;
  return i5 | 0;
 }
 while (1) {
  if ((d3 - +HEAPF32[i5 + 20 + (i2 << 3) >> 2]) * +HEAPF32[i5 + 84 + (i2 << 3) >> 2] + (d4 - +HEAPF32[i5 + 20 + (i2 << 3) + 4 >> 2]) * +HEAPF32[i5 + 84 + (i2 << 3) + 4 >> 2] > 0.0) {
   i1 = 0;
   i2 = 4;
   break;
  }
  i2 = i2 + 1 | 0;
  if ((i2 | 0) >= (i1 | 0)) {
   i1 = 1;
   i2 = 4;
   break;
  }
 }
 if ((i2 | 0) == 4) return i1 | 0;
 return 0;
}

function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(i6, i1, i4) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i3 = 0, i5 = 0, i7 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i5 = i7;
 if ((i6 | 0) != (i1 | 0)) if ((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 488, 504, 0) | 0, (i3 | 0) != 0) : 0) {
  i1 = i5;
  i2 = i1 + 56 | 0;
  do {
   HEAP32[i1 >> 2] = 0;
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) < (i2 | 0));
  HEAP32[i5 >> 2] = i3;
  HEAP32[i5 + 8 >> 2] = i6;
  HEAP32[i5 + 12 >> 2] = -1;
  HEAP32[i5 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 28 >> 2] & 31](i3, i5, HEAP32[i4 >> 2] | 0, 1);
  if ((HEAP32[i5 + 24 >> 2] | 0) == 1) {
   HEAP32[i4 >> 2] = HEAP32[i5 + 16 >> 2];
   i1 = 1;
  } else i1 = 0;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i7;
 return i1 | 0;
}

function _wcrtomb(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 do if (i1) {
  if (i3 >>> 0 < 128) {
   HEAP8[i1 >> 0] = i3;
   i1 = 1;
   break;
  }
  if (i3 >>> 0 < 2048) {
   HEAP8[i1 >> 0] = i3 >>> 6 | 192;
   HEAP8[i1 + 1 >> 0] = i3 & 63 | 128;
   i1 = 2;
   break;
  }
  if (i3 >>> 0 < 55296 | (i3 & -8192 | 0) == 57344) {
   HEAP8[i1 >> 0] = i3 >>> 12 | 224;
   HEAP8[i1 + 1 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 & 63 | 128;
   i1 = 3;
   break;
  }
  if ((i3 + -65536 | 0) >>> 0 < 1048576) {
   HEAP8[i1 >> 0] = i3 >>> 18 | 240;
   HEAP8[i1 + 1 >> 0] = i3 >>> 12 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 3 >> 0] = i3 & 63 | 128;
   i1 = 4;
   break;
  } else {
   HEAP32[(___errno_location() | 0) >> 2] = 84;
   i1 = -1;
   break;
  }
 } else i1 = 1; while (0);
 return i1 | 0;
}

function __ZNK11b2EdgeShape11ComputeAABBEP6b2AABBRK11b2Transformi(i3, i1, i4, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0;
 d7 = +HEAPF32[i4 + 12 >> 2];
 d10 = +HEAPF32[i3 + 12 >> 2];
 d11 = +HEAPF32[i4 + 8 >> 2];
 d6 = +HEAPF32[i3 + 16 >> 2];
 d8 = +HEAPF32[i4 >> 2];
 d9 = d8 + (d7 * d10 - d11 * d6);
 d12 = +HEAPF32[i4 + 4 >> 2];
 d6 = d10 * d11 + d7 * d6 + d12;
 d10 = +HEAPF32[i3 + 20 >> 2];
 d5 = +HEAPF32[i3 + 24 >> 2];
 d8 = d8 + (d7 * d10 - d11 * d5);
 d5 = d12 + (d11 * d10 + d7 * d5);
 d7 = +HEAPF32[i3 + 8 >> 2];
 HEAPF32[i1 >> 2] = (d9 < d8 ? d9 : d8) - d7;
 HEAPF32[i1 + 4 >> 2] = (d6 < d5 ? d6 : d5) - d7;
 HEAPF32[i1 + 8 >> 2] = d7 + (d9 > d8 ? d9 : d8);
 HEAPF32[i1 + 12 >> 2] = d7 + (d6 > d5 ? d6 : d5);
 return;
}

function __ZN9BlastAnim8progressEv(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i1 = i4;
 i2 = i3 + 32 | 0;
 i5 = HEAP32[i2 >> 2] | 0;
 HEAP32[i2 >> 2] = i5 + -1;
 if ((i5 | 0) > 1) {
  i5 = 1;
  STACKTOP = i4;
  return i5 | 0;
 }
 i8 = HEAP32[180] | 0;
 i5 = HEAP32[i3 + 4 >> 2] | 0;
 i3 = HEAP32[i5 + 148 >> 2] | 0;
 HEAP8[i3 + 8 >> 0] = 0;
 i7 = _rand() | 0;
 i6 = HEAP32[180] | 0;
 HEAP32[i3 >> 2] = (HEAP32[i8 + 24 >> 2] | 0) + (((i7 >>> 0) % ((((HEAP32[i6 + 28 >> 2] | 0) - (HEAP32[i6 + 24 >> 2] | 0) | 0) / 28 | 0) >>> 0) | 0) * 28 | 0);
 HEAPF32[i1 >> 2] = 0.0;
 HEAPF32[i1 + 4 >> 2] = 10.0;
 __ZN6b2Body12SetTransformERK6b2Vec2f(i5, i1, 0.0);
 i5 = (HEAP32[i2 >> 2] | 0) > -10;
 STACKTOP = i4;
 return i5 | 0;
}

function _fputc(i5, i6) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0;
 if ((HEAP32[i6 + 76 >> 2] | 0) >= 0 ? (___lockfile(i6) | 0) != 0 : 0) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i2 = i6 + 20 | 0, i3 = HEAP32[i2 >> 2] | 0, i3 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i2 >> 2] = i3 + 1;
   HEAP8[i3 >> 0] = i5;
   i1 = i5 & 255;
  } else i1 = ___overflow(i6, i5) | 0;
  ___unlockfile(i6);
 } else i7 = 3;
 do if ((i7 | 0) == 3) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i4 = i6 + 20 | 0, i1 = HEAP32[i4 >> 2] | 0, i1 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i4 >> 2] = i1 + 1;
   HEAP8[i1 >> 0] = i5;
   i1 = i5 & 255;
   break;
  }
  i1 = ___overflow(i6, i5) | 0;
 } while (0);
 return i1 | 0;
}

function ___overflow(i8, i6) {
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i9;
 i5 = i6 & 255;
 HEAP8[i7 >> 0] = i5;
 i2 = i8 + 16 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if (!i3) if (!(___towrite(i8) | 0)) {
  i3 = HEAP32[i2 >> 2] | 0;
  i4 = 4;
 } else i1 = -1; else i4 = 4;
 do if ((i4 | 0) == 4) {
  i2 = i8 + 20 | 0;
  i4 = HEAP32[i2 >> 2] | 0;
  if (i4 >>> 0 < i3 >>> 0 ? (i1 = i6 & 255, (i1 | 0) != (HEAP8[i8 + 75 >> 0] | 0)) : 0) {
   HEAP32[i2 >> 2] = i4 + 1;
   HEAP8[i4 >> 0] = i5;
   break;
  }
  if ((FUNCTION_TABLE_iiii[HEAP32[i8 + 36 >> 2] & 15](i8, i7, 1) | 0) == 1) i1 = HEAPU8[i7 >> 0] | 0; else i1 = -1;
 } while (0);
 STACKTOP = i9;
 return i1 | 0;
}

function _pad(i6, i2, i5, i4, i1) {
 i6 = i6 | 0;
 i2 = i2 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i3 = 0, i7 = 0, i8 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 i7 = i8;
 do if ((i5 | 0) > (i4 | 0) & (i1 & 73728 | 0) == 0) {
  i1 = i5 - i4 | 0;
  _memset(i7 | 0, i2 | 0, (i1 >>> 0 > 256 ? 256 : i1) | 0) | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = (i2 & 32 | 0) == 0;
  if (i1 >>> 0 > 255) {
   i4 = i5 - i4 | 0;
   do {
    if (i3) {
     ___fwritex(i7, 256, i6) | 0;
     i2 = HEAP32[i6 >> 2] | 0;
    }
    i1 = i1 + -256 | 0;
    i3 = (i2 & 32 | 0) == 0;
   } while (i1 >>> 0 > 255);
   if (i3) i1 = i4 & 255; else break;
  } else if (!i3) break;
  ___fwritex(i7, i1, i6) | 0;
 } while (0);
 STACKTOP = i8;
 return;
}

function ___remdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i8 = i5 | 0;
 i7 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i10 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i1 = _i64Subtract(i7 ^ i1, i6 ^ i2, i7, i6) | 0;
 i2 = tempRet0;
 ___udivmoddi4(i1, i2, _i64Subtract(i10 ^ i3, i9 ^ i4, i10, i9) | 0, tempRet0, i8) | 0;
 i4 = _i64Subtract(HEAP32[i8 >> 2] ^ i7, HEAP32[i8 + 4 >> 2] ^ i6, i7, i6) | 0;
 i3 = tempRet0;
 STACKTOP = i5;
 return (tempRet0 = i3, i4) | 0;
}

function _fflush(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 do if (i2) {
  if ((HEAP32[i2 + 76 >> 2] | 0) <= -1) {
   i1 = ___fflush_unlocked(i2) | 0;
   break;
  }
  i3 = (___lockfile(i2) | 0) == 0;
  i1 = ___fflush_unlocked(i2) | 0;
  if (!i3) ___unlockfile(i2);
 } else {
  if (!(HEAP32[434] | 0)) i1 = 0; else i1 = _fflush(HEAP32[434] | 0) | 0;
  ___lock(1712);
  i2 = HEAP32[427] | 0;
  if (i2) do {
   if ((HEAP32[i2 + 76 >> 2] | 0) > -1) i3 = ___lockfile(i2) | 0; else i3 = 0;
   if ((HEAP32[i2 + 20 >> 2] | 0) >>> 0 > (HEAP32[i2 + 28 >> 2] | 0) >>> 0) i1 = ___fflush_unlocked(i2) | 0 | i1;
   if (i3) ___unlockfile(i2);
   i2 = HEAP32[i2 + 56 >> 2] | 0;
  } while ((i2 | 0) != 0);
  ___unlock(1712);
 } while (0);
 return i1 | 0;
}

function __ZN14b2PolygonShape8SetAsBoxEff(i3, d1, d2) {
 i3 = i3 | 0;
 d1 = +d1;
 d2 = +d2;
 var d4 = 0.0, d5 = 0.0;
 HEAP32[i3 + 148 >> 2] = 4;
 d4 = -d1;
 d5 = -d2;
 HEAPF32[i3 + 20 >> 2] = d4;
 HEAPF32[i3 + 24 >> 2] = d5;
 HEAPF32[i3 + 28 >> 2] = d1;
 HEAPF32[i3 + 32 >> 2] = d5;
 HEAPF32[i3 + 36 >> 2] = d1;
 HEAPF32[i3 + 40 >> 2] = d2;
 HEAPF32[i3 + 44 >> 2] = d4;
 HEAPF32[i3 + 48 >> 2] = d2;
 HEAPF32[i3 + 84 >> 2] = 0.0;
 HEAPF32[i3 + 88 >> 2] = -1.0;
 HEAPF32[i3 + 92 >> 2] = 1.0;
 HEAPF32[i3 + 96 >> 2] = 0.0;
 HEAPF32[i3 + 100 >> 2] = 0.0;
 HEAPF32[i3 + 104 >> 2] = 1.0;
 HEAPF32[i3 + 108 >> 2] = -1.0;
 HEAPF32[i3 + 112 >> 2] = 0.0;
 HEAPF32[i3 + 12 >> 2] = 0.0;
 HEAPF32[i3 + 16 >> 2] = 0.0;
 return;
}

function _frexp(d1, i5) {
 d1 = +d1;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr >> 2] | 0;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i4 = _bitshift64Lshr(i2 | 0, i3 | 0, 52) | 0;
 i4 = i4 & 2047;
 switch (i4 | 0) {
 case 0:
  {
   if (d1 != 0.0) {
    d1 = +_frexp(d1 * 18446744073709552.0e3, i5);
    i2 = (HEAP32[i5 >> 2] | 0) + -64 | 0;
   } else i2 = 0;
   HEAP32[i5 >> 2] = i2;
   break;
  }
 case 2047:
  break;
 default:
  {
   HEAP32[i5 >> 2] = i4 + -1022;
   HEAP32[tempDoublePtr >> 2] = i2;
   HEAP32[tempDoublePtr + 4 >> 2] = i3 & -2146435073 | 1071644672;
   d1 = +HEAPF64[tempDoublePtr >> 3];
  }
 }
 return +d1;
}

function ___fflush_unlocked(i7) {
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i1 = i7 + 20 | 0;
 i5 = i7 + 28 | 0;
 if ((HEAP32[i1 >> 2] | 0) >>> 0 > (HEAP32[i5 >> 2] | 0) >>> 0 ? (FUNCTION_TABLE_iiii[HEAP32[i7 + 36 >> 2] & 15](i7, 0, 0) | 0, (HEAP32[i1 >> 2] | 0) == 0) : 0) i1 = -1; else {
  i6 = i7 + 4 | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = i7 + 8 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if (i2 >>> 0 < i4 >>> 0) FUNCTION_TABLE_iiii[HEAP32[i7 + 40 >> 2] & 15](i7, i2 - i4 | 0, 1) | 0;
  HEAP32[i7 + 16 >> 2] = 0;
  HEAP32[i5 >> 2] = 0;
  HEAP32[i1 >> 2] = 0;
  HEAP32[i3 >> 2] = 0;
  HEAP32[i6 >> 2] = 0;
  i1 = 0;
 }
 return i1 | 0;
}

function _memcpy(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i2 | 0) >= 4096) return _emscripten_memcpy_big(i1 | 0, i4 | 0, i2 | 0) | 0;
 i3 = i1 | 0;
 if ((i1 & 3) == (i4 & 3)) {
  while (i1 & 3) {
   if (!i2) return i3 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
   i1 = i1 + 1 | 0;
   i4 = i4 + 1 | 0;
   i2 = i2 - 1 | 0;
  }
  while ((i2 | 0) >= 4) {
   HEAP32[i1 >> 2] = HEAP32[i4 >> 2];
   i1 = i1 + 4 | 0;
   i4 = i4 + 4 | 0;
   i2 = i2 - 4 | 0;
  }
 }
 while ((i2 | 0) > 0) {
  HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  i1 = i1 + 1 | 0;
  i4 = i4 + 1 | 0;
  i2 = i2 - 1 | 0;
 }
 return i3 | 0;
}
function ___divdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i10 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i5 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i8 = _i64Subtract(i10 ^ i1, i9 ^ i2, i10, i9) | 0;
 i7 = tempRet0;
 i1 = i6 ^ i10;
 i2 = i5 ^ i9;
 return _i64Subtract((___udivmoddi4(i8, i7, _i64Subtract(i6 ^ i3, i5 ^ i4, i6, i5) | 0, tempRet0, 0) | 0) ^ i1, tempRet0 ^ i2, i1, i2) | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i5, i4, i3) {
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = HEAP8[i5 >> 0] | 0;
 i2 = (i1 & 1) == 0;
 if (i2) i1 = (i1 & 255) >>> 1; else i1 = HEAP32[i5 + 4 >> 2] | 0;
 do if (i1 >>> 0 >= i4 >>> 0) if (i2) {
  HEAP8[i5 + 1 + i4 >> 0] = 0;
  HEAP8[i5 >> 0] = i4 << 1;
  break;
 } else {
  HEAP8[(HEAP32[i5 + 8 >> 2] | 0) + i4 >> 0] = 0;
  HEAP32[i5 + 4 >> 2] = i4;
  break;
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEjc(i5, i4 - i1 | 0, i3) | 0; while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(i1, i4, i3, i5) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i2 = 0;
 i1 = i4 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 do if (i2) {
  if ((i2 | 0) != (i3 | 0)) {
   i5 = i4 + 36 | 0;
   HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 1;
   HEAP32[i4 + 24 >> 2] = 2;
   HEAP8[i4 + 54 >> 0] = 1;
   break;
  }
  i1 = i4 + 24 | 0;
  if ((HEAP32[i1 >> 2] | 0) == 2) HEAP32[i1 >> 2] = i5;
 } else {
  HEAP32[i1 >> 2] = i3;
  HEAP32[i4 + 24 >> 2] = i5;
  HEAP32[i4 + 36 >> 2] = 1;
 } while (0);
 return;
}

function __ZNK13b2CircleShape11ComputeMassEP10b2MassDataf(i3, i2, d1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 d1 = +d1;
 var d4 = 0.0, d5 = 0.0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i8 = i3 + 8 | 0;
 d6 = +HEAPF32[i8 >> 2];
 d6 = d6 * (d1 * 3.1415927410125732 * d6);
 HEAPF32[i2 >> 2] = d6;
 i7 = i3 + 12 | 0;
 i11 = i7;
 i10 = HEAP32[i11 + 4 >> 2] | 0;
 i9 = i2 + 4 | 0;
 HEAP32[i9 >> 2] = HEAP32[i11 >> 2];
 HEAP32[i9 + 4 >> 2] = i10;
 d5 = +HEAPF32[i8 >> 2];
 d4 = +HEAPF32[i7 >> 2];
 d1 = +HEAPF32[i3 + 16 >> 2];
 HEAPF32[i2 + 12 >> 2] = d6 * (d5 * (d5 * .5) + (d4 * d4 + d1 * d1));
 return;
}

function _fmt_u(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0;
 if (i3 >>> 0 > 0 | (i3 | 0) == 0 & i2 >>> 0 > 4294967295) while (1) {
  i4 = ___uremdi3(i2 | 0, i3 | 0, 10, 0) | 0;
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = i4 | 48;
  i4 = ___udivdi3(i2 | 0, i3 | 0, 10, 0) | 0;
  if (i3 >>> 0 > 9 | (i3 | 0) == 9 & i2 >>> 0 > 4294967295) {
   i2 = i4;
   i3 = tempRet0;
  } else {
   i2 = i4;
   break;
  }
 }
 if (i2) while (1) {
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = (i2 >>> 0) % 10 | 0 | 48;
  if (i2 >>> 0 < 10) break; else i2 = (i2 >>> 0) / 10 | 0;
 }
 return i1 | 0;
}

function __ZNK13b2CircleShape11ComputeAABBEP6b2AABBRK11b2Transformi(i3, i1, i4, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0;
 d5 = +HEAPF32[i4 + 12 >> 2];
 d9 = +HEAPF32[i3 + 12 >> 2];
 d8 = +HEAPF32[i4 + 8 >> 2];
 d6 = +HEAPF32[i3 + 16 >> 2];
 d7 = +HEAPF32[i4 >> 2] + (d5 * d9 - d8 * d6);
 d6 = +HEAPF32[i4 + 4 >> 2] + (d9 * d8 + d5 * d6);
 d5 = +HEAPF32[i3 + 8 >> 2];
 HEAPF32[i1 >> 2] = d7 - d5;
 HEAPF32[i1 + 4 >> 2] = d6 - d5;
 HEAPF32[i1 + 8 >> 2] = d7 + d5;
 HEAPF32[i1 + 12 >> 2] = d6 + d5;
 return;
}

function __ZNK13b2CircleShape5CloneEP16b2BlockAllocator(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 i1 = __ZN16b2BlockAllocator8AllocateEi(i1, 20) | 0;
 HEAP32[i1 >> 2] = 1348;
 i4 = i1 + 4 | 0;
 HEAP32[i4 >> 2] = 0;
 HEAP32[i4 + 4 >> 2] = 0;
 HEAP32[i4 + 8 >> 2] = 0;
 HEAP32[i4 + 12 >> 2] = 0;
 i5 = i2 + 4 | 0;
 i3 = HEAP32[i5 + 4 >> 2] | 0;
 HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
 HEAP32[i4 + 4 >> 2] = i3;
 i4 = i2 + 12 | 0;
 i3 = HEAP32[i4 + 4 >> 2] | 0;
 i2 = i1 + 12 | 0;
 HEAP32[i2 >> 2] = HEAP32[i4 >> 2];
 HEAP32[i2 + 4 >> 2] = i3;
 return i1 | 0;
}

function _strlen(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i4 = i1;
 L1 : do if (!(i4 & 3)) i3 = 4; else {
  i2 = i1;
  i1 = i4;
  while (1) {
   if (!(HEAP8[i2 >> 0] | 0)) break L1;
   i2 = i2 + 1 | 0;
   i1 = i2;
   if (!(i1 & 3)) {
    i1 = i2;
    i3 = 4;
    break;
   }
  }
 } while (0);
 if ((i3 | 0) == 4) {
  while (1) {
   i2 = HEAP32[i1 >> 2] | 0;
   if (!((i2 & -2139062144 ^ -2139062144) & i2 + -16843009)) i1 = i1 + 4 | 0; else break;
  }
  if ((i2 & 255) << 24 >> 24) do i1 = i1 + 1 | 0; while ((HEAP8[i1 >> 0] | 0) != 0);
 }
 return i1 - i4 | 0;
}

function __ZNK14b2PolygonShape5CloneEP16b2BlockAllocator(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i1 = __ZN16b2BlockAllocator8AllocateEi(i1, 152) | 0;
 HEAP32[i1 >> 2] = 1388;
 i4 = i1 + 4 | 0;
 HEAP32[i4 >> 2] = 2;
 HEAPF32[i1 + 8 >> 2] = .009999999776482582;
 HEAP32[i1 + 148 >> 2] = 0;
 i3 = i1 + 12 | 0;
 HEAPF32[i3 >> 2] = 0.0;
 HEAPF32[i1 + 16 >> 2] = 0.0;
 i6 = i2 + 4 | 0;
 i5 = HEAP32[i6 + 4 >> 2] | 0;
 HEAP32[i4 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i4 + 4 >> 2] = i5;
 _memcpy(i3 | 0, i2 + 12 | 0, 140) | 0;
 return i1 | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 if (i3 >>> 0 > 4294967279) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1);
 if (i3 >>> 0 < 11) {
  HEAP8[i1 >> 0] = i3 << 1;
  i1 = i1 + 1 | 0;
 } else {
  i5 = i3 + 16 & -16;
  i4 = __Znwj(i5) | 0;
  HEAP32[i1 + 8 >> 2] = i4;
  HEAP32[i1 >> 2] = i5 | 1;
  HEAP32[i1 + 4 >> 2] = i3;
  i1 = i4;
 }
 _memcpy(i1 | 0, i2 | 0, i3 | 0) | 0;
 HEAP8[i1 + i3 >> 0] = 0;
 return;
}

function _memset(i2, i6, i1) {
 i2 = i2 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i7 = 0;
 i3 = i2 + i1 | 0;
 if ((i1 | 0) >= 20) {
  i6 = i6 & 255;
  i5 = i2 & 3;
  i7 = i6 | i6 << 8 | i6 << 16 | i6 << 24;
  i4 = i3 & ~3;
  if (i5) {
   i5 = i2 + 4 - i5 | 0;
   while ((i2 | 0) < (i5 | 0)) {
    HEAP8[i2 >> 0] = i6;
    i2 = i2 + 1 | 0;
   }
  }
  while ((i2 | 0) < (i4 | 0)) {
   HEAP32[i2 >> 2] = i7;
   i2 = i2 + 4 | 0;
  }
 }
 while ((i2 | 0) < (i3 | 0)) {
  HEAP8[i2 >> 0] = i6;
  i2 = i2 + 1 | 0;
 }
 return i2 - i1 | 0;
}

function __ZN7b2World10CreateBodyEPK9b2BodyDef(i4, i1) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 if (HEAP32[i4 + 102872 >> 2] & 2) ___assert_fail(6675, 6695, 111, 6746);
 i3 = __ZN16b2BlockAllocator8AllocateEi(i4 + 4 | 0, 152) | 0;
 __ZN6b2BodyC2EPK9b2BodyDefP7b2World(i3, i1, i4);
 HEAP32[i3 + 92 >> 2] = 0;
 i1 = i4 + 102956 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 HEAP32[i3 + 96 >> 2] = i2;
 if (i2) HEAP32[i2 + 92 >> 2] = i3;
 HEAP32[i1 >> 2] = i3;
 i4 = i4 + 102964 | 0;
 HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 1;
 return i3 | 0;
}

function __ZN6b2Body13CreateFixtureEPK7b2Shapef(i3, i2, d1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 d1 = +d1;
 var i4 = 0, i5 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i5 = i4;
 HEAP16[i5 + 22 >> 1] = 1;
 HEAP16[i5 + 24 >> 1] = -1;
 HEAP16[i5 + 26 >> 1] = 0;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAPF32[i5 + 8 >> 2] = .20000000298023224;
 HEAPF32[i5 + 12 >> 2] = 0.0;
 HEAP8[i5 + 20 >> 0] = 0;
 HEAP32[i5 >> 2] = i2;
 HEAPF32[i5 + 16 >> 2] = d1;
 i3 = __ZN6b2Body13CreateFixtureEPK12b2FixtureDef(i3, i5) | 0;
 STACKTOP = i4;
 return i3 | 0;
}

function _strerror(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = 0;
 while (1) {
  if ((HEAPU8[10520 + i2 >> 0] | 0) == (i1 | 0)) {
   i3 = 2;
   break;
  }
  i2 = i2 + 1 | 0;
  if ((i2 | 0) == 87) {
   i2 = 87;
   i1 = 10608;
   i3 = 5;
   break;
  }
 }
 if ((i3 | 0) == 2) if (!i2) i1 = 10608; else {
  i1 = 10608;
  i3 = 5;
 }
 if ((i3 | 0) == 5) while (1) {
  i3 = i1;
  while (1) {
   i1 = i3 + 1 | 0;
   if (!(HEAP8[i3 >> 0] | 0)) break; else i3 = i1;
  }
  i2 = i2 + -1 | 0;
  if (!i2) break; else i3 = 5;
 }
 return i1 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4); else {
  i5 = HEAP32[i5 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i5 >> 2] | 0) + 20 >> 2] & 3](i5, i3, i2, i1, i4, i6);
 }
 return;
}

function __ZNK13b2CircleShape9TestPointERK11b2TransformRK6b2Vec2(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0;
 d4 = +HEAPF32[i3 + 12 >> 2];
 d8 = +HEAPF32[i2 + 12 >> 2];
 d7 = +HEAPF32[i3 + 8 >> 2];
 d5 = +HEAPF32[i2 + 16 >> 2];
 d6 = +HEAPF32[i1 >> 2] - (+HEAPF32[i3 >> 2] + (d4 * d8 - d7 * d5));
 d5 = +HEAPF32[i1 + 4 >> 2] - (+HEAPF32[i3 + 4 >> 2] + (d8 * d7 + d4 * d5));
 d4 = +HEAPF32[i2 + 8 >> 2];
 return d6 * d6 + d5 * d5 <= d4 * d4 | 0;
}

function __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i7, i5, i4, i3, i6, i8) {
 i7 = i7 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i7 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i7 = HEAP32[i7 >> 2] | 0;
 FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i7 >> 2] | 0) + 20 >> 2] & 3](i7, i5, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i6 : 2, i8);
 return;
}

function ___stdio_seek(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i6 = i5;
 i3 = i5 + 20 | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 + 60 >> 2];
 HEAP32[i6 + 4 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = i2;
 HEAP32[i6 + 12 >> 2] = i3;
 HEAP32[i6 + 16 >> 2] = i4;
 if ((___syscall_ret(___syscall140(140, i6 | 0) | 0) | 0) < 0) {
  HEAP32[i3 >> 2] = -1;
  i1 = -1;
 } else i1 = HEAP32[i3 >> 2] | 0;
 STACKTOP = i5;
 return i1 | 0;
}

function __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 24 >> 2] & 3](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2, i7);
 return;
}

function __ZN11JsDebugDraw16DrawSolidPolygonEPK6b2Vec2iRK7b2Color(i2, i4, i3, i1) {
 i2 = i2 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 if (!i3) return;
 _emscripten_asm_const_2(0, +(+HEAPF32[i4 >> 2]), +(+HEAPF32[i4 + 4 >> 2])) | 0;
 if ((i3 | 0) > 1) {
  i1 = 1;
  do {
   _emscripten_asm_const_2(1, +(+HEAPF32[i4 + (i1 << 3) >> 2]), +(+HEAPF32[i4 + (i1 << 3) + 4 >> 2])) | 0;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) != (i3 | 0));
 }
 _emscripten_asm_const_0(2);
 return;
}

function __ZN13MouseCallback13ReportFixtureEP9b2Fixture(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var d3 = 0.0, d4 = 0.0;
 i1 = HEAP32[i1 + 8 >> 2] | 0;
 if (!(HEAP32[i1 + 148 >> 2] | 0)) {
  i2 = 1;
  return i2 | 0;
 }
 d4 = +HEAPF32[i1 + 12 >> 2] - +HEAPF32[i2 + 8 >> 2];
 d3 = +HEAPF32[i1 + 16 >> 2] - +HEAPF32[i2 + 12 >> 2];
 if (!(+Math_sqrt(+(d4 * d4 + d3 * d3)) < .25999999046325684)) {
  i2 = 1;
  return i2 | 0;
 }
 HEAP32[i2 + 4 >> 2] = i1;
 i2 = 0;
 return i2 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3); else {
  i4 = HEAP32[i4 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i4 >> 2] | 0) + 28 >> 2] & 31](i4, i2, i1, i3);
 }
 return;
}

function __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i6, i4, i3, i5) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 31](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2);
 return;
}

function ___towrite(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i1 = i2 + 74 | 0;
 i3 = HEAP8[i1 >> 0] | 0;
 HEAP8[i1 >> 0] = i3 + 255 | i3;
 i1 = HEAP32[i2 >> 2] | 0;
 if (!(i1 & 8)) {
  HEAP32[i2 + 8 >> 2] = 0;
  HEAP32[i2 + 4 >> 2] = 0;
  i1 = HEAP32[i2 + 44 >> 2] | 0;
  HEAP32[i2 + 28 >> 2] = i1;
  HEAP32[i2 + 20 >> 2] = i1;
  HEAP32[i2 + 16 >> 2] = i1 + (HEAP32[i2 + 48 >> 2] | 0);
  i1 = 0;
 } else {
  HEAP32[i2 >> 2] = i1 | 32;
  i1 = -1;
 }
 return i1 | 0;
}

function ___stdout_write(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i4 = i5;
 HEAP32[i2 + 36 >> 2] = 8;
 if ((HEAP32[i2 >> 2] & 64 | 0) == 0 ? (HEAP32[i4 >> 2] = HEAP32[i2 + 60 >> 2], HEAP32[i4 + 4 >> 2] = 21505, HEAP32[i4 + 8 >> 2] = i5 + 12, (___syscall54(54, i4 | 0) | 0) != 0) : 0) HEAP8[i2 + 75 >> 0] = -1;
 i4 = ___stdio_write(i2, i1, i3) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN15b2ContactFilter13ShouldCollideEP9b2FixtureS1_(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = HEAP16[i2 + 36 >> 1] | 0;
 if (!(i1 << 16 >> 16 == 0 ? 1 : i1 << 16 >> 16 != (HEAP16[i3 + 36 >> 1] | 0))) {
  i3 = i1 << 16 >> 16 > 0;
  return i3 | 0;
 }
 if (!((HEAP16[i3 + 32 >> 1] & HEAP16[i2 + 34 >> 1]) << 16 >> 16)) {
  i3 = 0;
  return i3 | 0;
 }
 i3 = (HEAP16[i3 + 34 >> 1] & HEAP16[i2 + 32 >> 1]) << 16 >> 16 != 0;
 return i3 | 0;
}

function copyTempDouble(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
 HEAP8[tempDoublePtr + 4 >> 0] = HEAP8[i1 + 4 >> 0];
 HEAP8[tempDoublePtr + 5 >> 0] = HEAP8[i1 + 5 >> 0];
 HEAP8[tempDoublePtr + 6 >> 0] = HEAP8[i1 + 6 >> 0];
 HEAP8[tempDoublePtr + 7 >> 0] = HEAP8[i1 + 7 >> 0];
}

function __ZN23b2EdgeAndPolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i2, i1, i3, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 __ZN12b2EPCollider7CollideEP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK14b2PolygonShapeS7_(i5, i1, HEAP32[(HEAP32[i2 + 48 >> 2] | 0) + 12 >> 2] | 0, i3, HEAP32[(HEAP32[i2 + 52 >> 2] | 0) + 12 >> 2] | 0, i4);
 STACKTOP = i5;
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEC2ERKS5_(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 if (!(HEAP8[i1 >> 0] & 1)) {
  HEAP32[i2 >> 2] = HEAP32[i1 >> 2];
  HEAP32[i2 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
  HEAP32[i2 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i2, HEAP32[i1 + 8 >> 2] | 0, HEAP32[i1 + 4 >> 2] | 0);
 return;
}

function ___muldsi3(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i6 = i1 & 65535;
 i5 = i2 & 65535;
 i3 = Math_imul(i5, i6) | 0;
 i4 = i1 >>> 16;
 i1 = (i3 >>> 16) + (Math_imul(i5, i4) | 0) | 0;
 i5 = i2 >>> 16;
 i2 = Math_imul(i5, i6) | 0;
 return (tempRet0 = (i1 >>> 16) + (Math_imul(i5, i4) | 0) + (((i1 & 65535) + i2 | 0) >>> 16) | 0, i1 + i2 << 16 | i3 & 65535 | 0) | 0;
}

function __Znwj(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = (i1 | 0) == 0 ? 1 : i1;
 i1 = _malloc(i2) | 0;
 L1 : do if (!i1) {
  while (1) {
   i1 = __ZSt15get_new_handlerv() | 0;
   if (!i1) break;
   FUNCTION_TABLE_v[i1 & 7]();
   i1 = _malloc(i2) | 0;
   if (i1) break L1;
  }
  i2 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i2 >> 2] = 1508;
  ___cxa_throw(i2 | 0, 456, 25);
 } while (0);
 return i1 | 0;
}

function __ZN25b2PolygonAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZN24b2ChainAndPolygonContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZN23b2EdgeAndPolygonContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZN23b2ChainAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZN22b2EdgeAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZSt9terminatev() {
 var i1 = 0, i2 = 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if (((i1 | 0) != 0 ? (i2 = HEAP32[i1 >> 2] | 0, (i2 | 0) != 0) : 0) ? (i1 = i2 + 48 | 0, (HEAP32[i1 >> 2] & -256 | 0) == 1126902528 ? (HEAP32[i1 + 4 >> 2] | 0) == 1129074247 : 0) : 0) __ZSt11__terminatePFvvE(HEAP32[i2 + 12 >> 2] | 0);
 i2 = HEAP32[374] | 0;
 HEAP32[374] = i2 + 0;
 __ZSt11__terminatePFvvE(i2);
}

function __ZN16b2PolygonContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZN15b2CircleContact7DestroyEP9b2ContactP16b2BlockAllocator(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
 i1 = HEAP8[3234] | 0;
 if ((i1 & 255) < 14) {
  i2 = i2 + 12 + ((i1 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(4104, 4037, 171, 5547);
}

function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4);
 return;
}

function _memmove(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i4 | 0) < (i1 | 0) & (i1 | 0) < (i4 + i2 | 0)) {
  i3 = i1;
  i4 = i4 + i2 | 0;
  i1 = i1 + i2 | 0;
  while ((i2 | 0) > 0) {
   i1 = i1 - 1 | 0;
   i4 = i4 - 1 | 0;
   i2 = i2 - 1 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  }
  i1 = i3;
 } else _memcpy(i1, i4, i2) | 0;
 return i1 | 0;
}

function __ZN25b2PolygonAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i2, i1, i3, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 __Z25b2CollidePolygonAndCircleP10b2ManifoldPK14b2PolygonShapeRK11b2TransformPK13b2CircleShapeS6_(i1, HEAP32[(HEAP32[i2 + 48 >> 2] | 0) + 12 >> 2] | 0, i3, HEAP32[(HEAP32[i2 + 52 >> 2] | 0) + 12 >> 2] | 0, i4);
 return;
}

function __ZNK7b2World9QueryAABBEP15b2QueryCallbackRK6b2AABB(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i4;
 i3 = i3 + 102876 | 0;
 HEAP32[i5 >> 2] = i3;
 HEAP32[i5 + 4 >> 2] = i2;
 __ZNK13b2DynamicTree5QueryI19b2WorldQueryWrapperEEvPT_RK6b2AABB(i3, i5, i1);
 STACKTOP = i4;
 return;
}

function _llvm_cttz_i32(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAP8[cttz_i8 + (i2 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 8 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 8 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 16 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 16 | 0;
 return (HEAP8[cttz_i8 + (i2 >>> 24) >> 0] | 0) + 24 | 0;
}

function __ZN22b2EdgeAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i2, i1, i3, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 __Z22b2CollideEdgeAndCircleP10b2ManifoldPK11b2EdgeShapeRK11b2TransformPK13b2CircleShapeS6_(i1, HEAP32[(HEAP32[i2 + 48 >> 2] | 0) + 12 >> 2] | 0, i3, HEAP32[(HEAP32[i2 + 52 >> 2] | 0) + 12 >> 2] | 0, i4);
 return;
}

function ___cxa_can_catch(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i5;
 HEAP32[i3 >> 2] = HEAP32[i4 >> 2];
 i1 = FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 15](i1, i2, i3) | 0;
 if (i1) HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 STACKTOP = i5;
 return i1 & 1 | 0;
}

function __Z14b2PairLessThanRK6b2PairS1_(i3, i4) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0;
 i1 = HEAP32[i3 >> 2] | 0;
 i2 = HEAP32[i4 >> 2] | 0;
 if ((i1 | 0) < (i2 | 0)) {
  i4 = 1;
  return i4 | 0;
 }
 if ((i1 | 0) != (i2 | 0)) {
  i4 = 0;
  return i4 | 0;
 }
 i4 = (HEAP32[i3 + 4 >> 2] | 0) < (HEAP32[i4 + 4 >> 2] | 0);
 return i4 | 0;
}

function __ZN16b2PolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_(i2, i1, i3, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 __Z17b2CollidePolygonsP10b2ManifoldPK14b2PolygonShapeRK11b2TransformS3_S6_(i1, HEAP32[(HEAP32[i2 + 48 >> 2] | 0) + 12 >> 2] | 0, i3, HEAP32[(HEAP32[i2 + 52 >> 2] | 0) + 12 >> 2] | 0, i4);
 return;
}

function __ZNK11b2EdgeShape11ComputeMassEP10b2MassDataf(i3, i2, d1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 d1 = +d1;
 HEAPF32[i2 >> 2] = 0.0;
 d1 = (+HEAPF32[i3 + 16 >> 2] + +HEAPF32[i3 + 24 >> 2]) * .5;
 HEAPF32[i2 + 4 >> 2] = (+HEAPF32[i3 + 12 >> 2] + +HEAPF32[i3 + 20 >> 2]) * .5;
 HEAPF32[i2 + 8 >> 2] = d1;
 HEAPF32[i2 + 12 >> 2] = 0.0;
 return;
}

function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3);
 return;
}

function _rand() {
 var i1 = 0, i2 = 0, i3 = 0;
 i2 = 704;
 i2 = ___muldi3(HEAP32[i2 >> 2] | 0, HEAP32[i2 + 4 >> 2] | 0, 1284865837, 1481765933) | 0;
 i2 = _i64Add(i2 | 0, tempRet0 | 0, 1, 0) | 0;
 i1 = tempRet0;
 i3 = 704;
 HEAP32[i3 >> 2] = i2;
 HEAP32[i3 + 4 >> 2] = i1;
 i1 = _bitshift64Lshr(i2 | 0, i1 | 0, 33) | 0;
 return i1 | 0;
}

function __GLOBAL__sub_I_js_main_cpp() {
 __embind_register_function(2936, 1, 824, 3075, 34, 3);
 __embind_register_function(2946, 1, 828, 3078, 7, 1);
 __embind_register_function(2959, 1, 824, 3075, 34, 4);
 __embind_register_function(2968, 3, 832, 3081, 1, 1);
 __embind_register_function(2980, 3, 832, 3081, 1, 2);
 return;
}

function _sn_write(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0;
 i4 = i1 + 20 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i1 = (HEAP32[i1 + 16 >> 2] | 0) - i5 | 0;
 i1 = i1 >>> 0 > i2 >>> 0 ? i2 : i1;
 _memcpy(i5 | 0, i3 | 0, i1 | 0) | 0;
 HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + i1;
 return i2 | 0;
}

function ___uremdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i6 | 0;
 ___udivmoddi4(i1, i2, i3, i4, i5) | 0;
 STACKTOP = i6;
 return (tempRet0 = HEAP32[i5 + 4 >> 2] | 0, HEAP32[i5 >> 2] | 0) | 0;
}

function ___muldi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i5 = i1;
 i6 = i3;
 i3 = ___muldsi3(i5, i6) | 0;
 i1 = tempRet0;
 return (tempRet0 = (Math_imul(i2, i6) | 0) + (Math_imul(i4, i5) | 0) + i1 | i1 & 0, i3 | 0 | 0) | 0;
}

function ___cxa_get_globals_fast() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_once(1676, 5) | 0)) {
  i2 = _pthread_getspecific(HEAP32[418] | 0) | 0;
  STACKTOP = i1;
  return i2 | 0;
 } else _abort_message(10024, i1);
 return 0;
}

function _snprintf(i3, i2, i1, i4) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i6 = i5;
 HEAP32[i6 >> 2] = i4;
 i4 = _vsnprintf(i3, i2, i1, i6) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 _free(i1);
 if (!(_pthread_setspecific(HEAP32[418] | 0, 0) | 0)) {
  STACKTOP = i2;
  return;
 } else _abort_message(10178, i2);
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKc(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKcj(i3, i1, i2, _strlen(i2) | 0) | 0;
}

function ___stdio_close(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 HEAP32[i3 >> 2] = HEAP32[i1 + 60 >> 2];
 i1 = ___syscall_ret(___syscall6(6, i3 | 0) | 0) | 0;
 STACKTOP = i2;
 return i1 | 0;
}

function copyTempFloat(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
}

function _bitshift64Ashr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = (i2 | 0) < 0 ? -1 : 0;
 return i2 >> i1 - 32 | 0;
}

function __Z9initStartv() {
 var i1 = 0, i2 = 0, i3 = 0;
 i1 = __Znwj(60) | 0;
 i2 = i1;
 i3 = i2 + 60 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAP32[180] = i1;
 __ZN5Scene9initStartEv(i1);
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKc(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(i2, i1, _strlen(i1) | 0) | 0;
}

function dynCall_viiiiii(i7, i1, i2, i3, i4, i5, i6) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 FUNCTION_TABLE_viiiiii[i7 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0);
}

function _printf(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 HEAP32[i4 >> 2] = i2;
 i2 = _vfprintf(HEAP32[433] | 0, i1, i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
}

function _bitshift64Shl(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 << i1 | (i3 & (1 << i1) - 1 << 32 - i1) >>> 32 - i1;
  return i3 << i1;
 }
 tempRet0 = i3 << i1 - 32;
 return 0;
}

function __ZN11JsDebugDraw11DrawPolygonEPK6b2Vec2iRK7b2Color(i2, i4, i3, i1) {
 i2 = i2 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i2 >> 2] | 0) + 12 >> 2] & 31](i2, i4, i3, i1);
 return;
}

function _abort_message(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[i3 >> 2] = i2;
 i2 = HEAP32[432] | 0;
 _vfprintf(i2, i1, i3) | 0;
 _fputc(10, i2) | 0;
 _abort();
}

function _bitshift64Lshr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >>> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = 0;
 return i2 >>> i1 - 32 | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_key_create(1672, 35) | 0)) {
  STACKTOP = i1;
  return;
 } else _abort_message(10128, i1);
}

function runPostSets() {}
function _i64Subtract(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i4 = i2 - i4 - (i3 >>> 0 > i1 >>> 0 | 0) >>> 0;
 return (tempRet0 = i4, i1 - i3 >>> 0 | 0) | 0;
}

function dynCall_iiiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 return FUNCTION_TABLE_iiiiii[i6 & 15](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0) | 0;
}

function dynCall_viiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 FUNCTION_TABLE_viiiii[i6 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0);
}

function dynCall_viidii(i6, i1, i2, d3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 i4 = i4 | 0;
 i5 = i5 | 0;
 FUNCTION_TABLE_viidii[i6 & 1](i1 | 0, i2 | 0, +d3, i4 | 0, i5 | 0);
}

function ___strdup(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i2 = (_strlen(i3) | 0) + 1 | 0;
 i1 = _malloc(i2) | 0;
 if (!i1) i1 = 0; else _memcpy(i1 | 0, i3 | 0, i2 | 0) | 0;
 return i1 | 0;
}

function _i64Add(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i3 = i1 + i3 >>> 0;
 return (tempRet0 = i2 + i4 + (i3 >>> 0 < i1 >>> 0 | 0) >>> 0, i3 | 0) | 0;
}

function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return (i2 | 0) == (i3 | 0) | 0;
}

function dynCall_viiii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 FUNCTION_TABLE_viiii[i5 & 31](i1 | 0, i2 | 0, i3 | 0, i4 | 0);
}

function __ZN9BlastAnimD0Ev(i1) {
 i1 = i1 | 0;
 HEAP32[i1 >> 2] = 788;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1 + 20 | 0);
 __ZdlPv(i1);
 return;
}

function dynCall_viidi(i5, i1, i2, d3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 i4 = i4 | 0;
 FUNCTION_TABLE_viidi[i5 & 3](i1 | 0, i2 | 0, +d3, i4 | 0);
}

function __ZSt11__terminatePFvvE(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
 _abort_message(10088, i2);
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1) {
 i1 = i1 | 0;
 if (HEAP8[i1 >> 0] & 1) __ZdlPv(HEAP32[i1 + 8 >> 2] | 0);
 return;
}

function __ZN11JsDebugDraw15DrawSolidCircleERK6b2Vec2fS2_RK7b2Color(i5, i2, d4, i1, i3) {
 i5 = i5 | 0;
 i2 = i2 | 0;
 d4 = +d4;
 i1 = i1 | 0;
 i3 = i3 | 0;
 return;
}

function __ZN9BlastAnimD2Ev(i1) {
 i1 = i1 | 0;
 HEAP32[i1 >> 2] = 788;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1 + 20 | 0);
 return;
}

function dynCall_iiii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return FUNCTION_TABLE_iiii[i4 & 15](i1 | 0, i2 | 0, i3 | 0) | 0;
}

function __ZN10emscripten8internal7InvokerIvJffEE6invokeEPFvffEff(i3, d1, d2) {
 i3 = i3 | 0;
 d1 = +d1;
 d2 = +d2;
 FUNCTION_TABLE_vdd[i3 & 3](d1, d2);
 return;
}

function ___syscall_ret(i1) {
 i1 = i1 | 0;
 if (i1 >>> 0 > 4294963200) {
  HEAP32[(___errno_location() | 0) >> 2] = 0 - i1;
  i1 = -1;
 }
 return i1 | 0;
}

function ___errno_location() {
 var i1 = 0;
 if (!(HEAP32[421] | 0)) i1 = 1740; else i1 = HEAP32[(_pthread_self() | 0) + 60 >> 2] | 0;
 return i1 | 0;
}

function dynCall_viii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 FUNCTION_TABLE_viii[i4 & 3](i1 | 0, i2 | 0, i3 | 0);
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 return i2 | 0;
}

function __ZN11JsDebugDraw11DrawSegmentERK6b2Vec2S2_RK7b2Color(i4, i2, i3, i1) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return;
}

function ___cxa_is_pointer_type(i1) {
 i1 = i1 | 0;
 if (!i1) i1 = 0; else i1 = (___dynamic_cast(i1, 488, 536, 0) | 0) != 0;
 return i1 & 1 | 0;
}

function dynCall_viid(i4, i1, i2, d3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 FUNCTION_TABLE_viid[i4 & 3](i1 | 0, i2 | 0, +d3);
}

function ___udivdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return ___udivmoddi4(i1, i2, i3, i4, 0) | 0;
}

function __ZN17b2ContactListener9PostSolveEP9b2ContactPK16b2ContactImpulse(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return;
}

function __ZN11JsDebugDraw10DrawCircleERK6b2Vec2fRK7b2Color(i4, i1, d3, i2) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 d3 = +d3;
 i2 = i2 | 0;
 return;
}

function dynCall_vidd(i4, i1, d2, d3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 d2 = +d2;
 d3 = +d3;
 FUNCTION_TABLE_vidd[i4 & 1](i1 | 0, +d2, +d3);
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_out_of_rangeEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(10325, 10260, 1175, 10354);
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(10231, 10260, 1164, 10003);
}

function __ZN11JsDebugDraw9DrawPointERK6b2Vec2fRK7b2Color(i4, i2, d3, i1) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 i1 = i1 | 0;
 return;
}

function __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(9915, 9938, 303, 10003);
}

function dynCall_iii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iii[i3 & 7](i1 | 0, i2 | 0) | 0;
}

function b1(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 abort(1);
}

function __ZN17b2ContactListener8PreSolveEP9b2ContactPK10b2Manifold(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return;
}

function __ZNK11b2EdgeShape9TestPointERK11b2TransformRK6b2Vec2(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return 0;
}

function b15(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(15);
 return 0;
}

function _wctomb(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!i1) i1 = 0; else i1 = _wcrtomb(i1, i2, 0) | 0;
 return i1 | 0;
}

function __ZN7b2World12SetDebugDrawEP6b2Draw(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 HEAP32[i2 + 102988 >> 2] = i1;
 return;
}

function dynCall_vii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 FUNCTION_TABLE_vii[i3 & 15](i1 | 0, i2 | 0);
}

function _srand(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = 704;
 HEAP32[i2 >> 2] = i1 + -1;
 HEAP32[i2 + 4 >> 2] = 0;
 return;
}

function __ZN10emscripten8internal7InvokerIbJEE6invokeEPFbvE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 1]() | 0;
}

function __ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
 return;
}

function __GLOBAL__sub_I_bind_cpp() {
 __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(0);
 return;
}

function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!__THREW__) {
  __THREW__ = i1;
  threwValue = i2;
 }
}

function b2(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(2);
}

function b6(i1, i2, d3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(6);
}

function __ZSt15get_new_handlerv() {
 var i1 = 0;
 i1 = HEAP32[380] | 0;
 HEAP32[380] = i1 + 0;
 return i1 | 0;
}

function dynCall_vdd(i3, d1, d2) {
 i3 = i3 | 0;
 d1 = +d1;
 d2 = +d2;
 FUNCTION_TABLE_vdd[i3 & 3](+d1, +d2);
}

function ___clang_call_terminate(i1) {
 i1 = i1 | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __ZSt9terminatev();
}

function __ZN6b2Draw8SetFlagsEj(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 HEAP32[i2 + 4 >> 2] = i1;
 return;
}

function __ZN17b2ContactListener12BeginContactEP9b2Contact(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return;
}

function dynCall_ii(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return FUNCTION_TABLE_ii[i2 & 7](i1 | 0) | 0;
}

function __ZN6b2DrawC2Ev(i1) {
 i1 = i1 | 0;
 HEAP32[i1 >> 2] = 1428;
 HEAP32[i1 + 4 >> 2] = 0;
 return;
}

function __ZN11JsDebugDraw13DrawTransformERK11b2Transform(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 return;
}

function __ZN17b2ContactListener10EndContactEP9b2Contact(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return;
}

function _cleanup526(i1) {
 i1 = i1 | 0;
 if (!(HEAP32[i1 + 68 >> 2] | 0)) ___unlockfile(i1);
 return;
}

function establishStackSpace(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 STACKTOP = i1;
 STACK_MAX = i2;
}

function b13(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 abort(13);
}

function __ZN10__cxxabiv123__fundamental_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv121__vmi_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function dynCall_vi(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 FUNCTION_TABLE_vi[i2 & 63](i1 | 0);
}

function __ZN10__cxxabiv120__si_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b9(i1, i2, d3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 i4 = i4 | 0;
 abort(9);
}

function ___getTypeName(i1) {
 i1 = i1 | 0;
 return ___strdup(HEAP32[i1 + 4 >> 2] | 0) | 0;
}

function __ZN10__cxxabiv117__class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b0(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(0);
 return 0;
}

function __ZN25b2PolygonAndCircleContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN24b2ChainAndPolygonContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN23b2EdgeAndPolygonContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN23b2ChainAndCircleContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN22b2EdgeAndCircleContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(i1) {
 i1 = i1 | 0;
 return;
}

function b16(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(16);
}

function _frexpl(d2, i1) {
 d2 = +d2;
 i1 = i1 | 0;
 return +(+_frexp(d2, i1));
}

function __ZN17b2ContactListenerD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function dynCall_i(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 1]() | 0;
}

function __ZNK14b2PolygonShape13GetChildCountEv(i1) {
 i1 = i1 | 0;
 return 1;
}

function __ZN16b2PolygonContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b12(i1, i2, d3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 abort(12);
}

function __ZNK13b2CircleShape13GetChildCountEv(i1) {
 i1 = i1 | 0;
 return 1;
}

function __ZN15b2ContactFilterD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN15b2CircleContactD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN14b2PolygonShapeD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv116__shim_type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK11b2EdgeShape13GetChildCountEv(i1) {
 i1 = i1 | 0;
 return 1;
}

function __ZN13b2CircleShapeD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN13MouseCallbackD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b14(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(14);
 return 0;
}

function __ZN11b2EdgeShapeD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN11JsDebugDrawD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b7(i1, d2, d3) {
 i1 = i1 | 0;
 d2 = +d2;
 d3 = +d3;
 abort(7);
}

function __ZNSt9bad_allocD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZNKSt9bad_alloc4whatEv(i1) {
 i1 = i1 | 0;
 return 10073;
}

function dynCall_v(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
}

function __ZN6b2DrawD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function ___cxa_pure_virtual__wrapper() {
 ___cxa_pure_virtual();
}

function __ZN17b2ContactListenerD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZN15b2QueryCallbackD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZN15b2ContactFilterD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function b5(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(5);
}

function __ZNSt9type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9exceptionD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9bad_allocD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}

function __ZdlPv(i1) {
 i1 = i1 | 0;
 _free(i1);
 return;
}

function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}

function b10(d1, d2) {
 d1 = +d1;
 d2 = +d2;
 abort(10);
}

function __ZN9b2ContactD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZN7b2ShapeD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function b8(i1) {
 i1 = i1 | 0;
 abort(8);
 return 0;
}

function __ZN6b2DrawD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function ___unlockfile(i1) {
 i1 = i1 | 0;
 return;
}

function ___lockfile(i1) {
 i1 = i1 | 0;
 return 0;
}

function getTempRet0() {
 return tempRet0 | 0;
}

function stackSave() {
 return STACKTOP | 0;
}

function b4(i1) {
 i1 = i1 | 0;
 abort(4);
}

function b3() {
 abort(3);
 return 0;
}

function b11() {
 abort(11);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_iiii = [b0,__ZN15b2ContactFilter13ShouldCollideEP9b2FixtureS1_,__ZNK11b2EdgeShape9TestPointERK11b2TransformRK6b2Vec2,__ZNK13b2CircleShape9TestPointERK11b2TransformRK6b2Vec2,__ZNK14b2PolygonShape9TestPointERK11b2TransformRK6b2Vec2,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,_sn_write,___stdio_write,___stdio_seek,___stdout_write,b0,b0,b0,b0,b0];
var FUNCTION_TABLE_viiiiii = [b1,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib];
var FUNCTION_TABLE_viiiii = [b2,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib];
var FUNCTION_TABLE_i = [b3,__Z12cpp_progressv];
var FUNCTION_TABLE_vi = [b4,__ZN6b2DrawD2Ev,__ZN11JsDebugDrawD0Ev,__ZN9BlastAnimD2Ev,__ZN9BlastAnimD0Ev,__ZN9BlastAnim4drawEv,__ZN15b2QueryCallbackD2Ev,__ZN13MouseCallbackD0Ev,__ZN15b2ContactFilterD2Ev,__ZN15b2ContactFilterD0Ev,__ZN9b2ContactD2Ev,__ZN23b2ChainAndCircleContactD0Ev,__ZN24b2ChainAndPolygonContactD0Ev,__ZN15b2CircleContactD0Ev,__ZN22b2EdgeAndCircleContactD0Ev,__ZN23b2EdgeAndPolygonContactD0Ev,__ZN25b2PolygonAndCircleContactD0Ev,__ZN16b2PolygonContactD0Ev,__ZN7b2ShapeD2Ev,__ZN11b2EdgeShapeD0Ev,__ZN13b2CircleShapeD0Ev,__ZN14b2PolygonShapeD0Ev,__ZN6b2DrawD0Ev,__ZN17b2ContactListenerD2Ev,__ZN17b2ContactListenerD0Ev,__ZNSt9bad_allocD2Ev,__ZNSt9bad_allocD0Ev,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev
,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,__ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv,_cleanup526,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
,b4,b4,b4,b4,b4];
var FUNCTION_TABLE_vii = [b5,__ZN11JsDebugDraw13DrawTransformERK11b2Transform,__ZN17b2ContactListener12BeginContactEP9b2Contact,__ZN17b2ContactListener10EndContactEP9b2Contact,__ZN15b2CircleContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN25b2PolygonAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN16b2PolygonContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN22b2EdgeAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN23b2EdgeAndPolygonContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN23b2ChainAndCircleContact7DestroyEP9b2ContactP16b2BlockAllocator,__ZN24b2ChainAndPolygonContact7DestroyEP9b2ContactP16b2BlockAllocator,b5,b5,b5,b5,b5];
var FUNCTION_TABLE_viidii = [b6,__ZN11JsDebugDraw15DrawSolidCircleERK6b2Vec2fS2_RK7b2Color];
var FUNCTION_TABLE_vidd = [b7,__ZN10emscripten8internal7InvokerIvJffEE6invokeEPFvffEff];
var FUNCTION_TABLE_ii = [b8,__ZN9BlastAnim8progressEv,__ZNK11b2EdgeShape13GetChildCountEv,__ZNK13b2CircleShape13GetChildCountEv,__ZNK14b2PolygonShape13GetChildCountEv,__ZNKSt9bad_alloc4whatEv,___stdio_close,__ZN10emscripten8internal7InvokerIbJEE6invokeEPFbvE];
var FUNCTION_TABLE_viidi = [b9,__ZN11JsDebugDraw10DrawCircleERK6b2Vec2fRK7b2Color,__ZN11JsDebugDraw9DrawPointERK6b2Vec2fRK7b2Color,b9];
var FUNCTION_TABLE_vdd = [b10,__Z11mouse_hoverff,__Z8mouse_upff,b10];
var FUNCTION_TABLE_v = [b11,___cxa_pure_virtual__wrapper,__ZL25default_terminate_handlerv,__Z9initStartv,__Z8cpp_drawv,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev,b11,b11];
var FUNCTION_TABLE_viid = [b12,__ZNK11b2EdgeShape11ComputeMassEP10b2MassDataf,__ZNK13b2CircleShape11ComputeMassEP10b2MassDataf,__ZNK14b2PolygonShape11ComputeMassEP10b2MassDataf];
var FUNCTION_TABLE_viiii = [b13,__ZN11JsDebugDraw11DrawPolygonEPK6b2Vec2iRK7b2Color,__ZN11JsDebugDraw16DrawSolidPolygonEPK6b2Vec2iRK7b2Color,__ZN11JsDebugDraw11DrawSegmentERK6b2Vec2S2_RK7b2Color,__ZN23b2ChainAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN24b2ChainAndPolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN15b2CircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN22b2EdgeAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN23b2EdgeAndPolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN25b2PolygonAndCircleContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZN16b2PolygonContact8EvaluateEP10b2ManifoldRK11b2TransformS4_,__ZNK11b2EdgeShape11ComputeAABBEP6b2AABBRK11b2Transformi,__ZNK13b2CircleShape11ComputeAABBEP6b2AABBRK11b2Transformi,__ZNK14b2PolygonShape11ComputeAABBEP6b2AABBRK11b2Transformi,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13,b13
,b13,b13,b13];
var FUNCTION_TABLE_iii = [b14,__ZN13MouseCallback13ReportFixtureEP9b2Fixture,__ZNK11b2EdgeShape5CloneEP16b2BlockAllocator,__ZNK13b2CircleShape5CloneEP16b2BlockAllocator,__ZNK14b2PolygonShape5CloneEP16b2BlockAllocator,__Z14b2PairLessThanRK6b2PairS1_,b14,b14];
var FUNCTION_TABLE_iiiiii = [b15,__ZNK11b2EdgeShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi,__ZNK13b2CircleShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi,__ZNK14b2PolygonShape7RayCastEP15b2RayCastOutputRK14b2RayCastInputRK11b2Transformi,__ZN15b2CircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN25b2PolygonAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN16b2PolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN22b2EdgeAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN23b2EdgeAndPolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN23b2ChainAndCircleContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,__ZN24b2ChainAndPolygonContact6CreateEP9b2FixtureiS1_iP16b2BlockAllocator,b15,b15,b15,b15,b15];
var FUNCTION_TABLE_viii = [b16,__ZN17b2ContactListener8PreSolveEP9b2ContactPK10b2Manifold,__ZN17b2ContactListener9PostSolveEP9b2ContactPK16b2ContactImpulse,b16];

  return { ___cxa_can_catch: ___cxa_can_catch, _fflush: _fflush, ___cxa_is_pointer_type: ___cxa_is_pointer_type, _i64Add: _i64Add, _memmove: _memmove, _i64Subtract: _i64Subtract, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, ___getTypeName: ___getTypeName, _bitshift64Lshr: _bitshift64Lshr, _free: _free, ___errno_location: ___errno_location, _bitshift64Shl: _bitshift64Shl, __GLOBAL__sub_I_js_main_cpp: __GLOBAL__sub_I_js_main_cpp, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_iiii: dynCall_iiii, dynCall_viiiiii: dynCall_viiiiii, dynCall_viiiii: dynCall_viiiii, dynCall_i: dynCall_i, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_viidii: dynCall_viidii, dynCall_vidd: dynCall_vidd, dynCall_ii: dynCall_ii, dynCall_viidi: dynCall_viidi, dynCall_vdd: dynCall_vdd, dynCall_v: dynCall_v, dynCall_viid: dynCall_viid, dynCall_viiii: dynCall_viiii, dynCall_iii: dynCall_iii, dynCall_iiiiii: dynCall_iiiiii, dynCall_viii: dynCall_viii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var __GLOBAL__sub_I_js_main_cpp = Module["__GLOBAL__sub_I_js_main_cpp"] = asm["__GLOBAL__sub_I_js_main_cpp"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _free = Module["_free"] = asm["_free"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_viidii = Module["dynCall_viidii"] = asm["dynCall_viidii"];
var dynCall_vidd = Module["dynCall_vidd"] = asm["dynCall_vidd"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viidi = Module["dynCall_viidi"] = asm["dynCall_viidi"];
var dynCall_vdd = Module["dynCall_vdd"] = asm["dynCall_vdd"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viid = Module["dynCall_viid"] = asm["dynCall_viid"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.establishStackSpace = asm["establishStackSpace"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 assert(runDependencies == 0, "cannot call main when async dependencies remain! (listen on __ATMAIN__)");
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"]) {
  return;
 }
 if (Module["noExitRuntime"]) {} else {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 if (ENVIRONMENT_IS_NODE) {
  process["stdout"]["once"]("drain", (function() {
   process["exit"](status);
  }));
  console.log(" ");
  setTimeout((function() {
   process["exit"](status);
  }), 500);
 } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
  quit(status);
 }
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
 if (what !== undefined) {
  Module.print(what);
  Module.printErr(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
 var output = "abort(" + what + ") at " + stackTrace() + extra;
 if (abortDecorators) {
  abortDecorators.forEach((function(decorator) {
   output = decorator(output, what);
  }));
 }
 throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
run();





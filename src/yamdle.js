define(function() {
  var yamdle = {};

  yamdle.stringify = function(obj, indent, context) {
    if (typeof(indent) == 'undefined') {
      indent = 0;
    }
    var indentStr = yamdle.indentStr(indent);

    switch (yamdle.typeOf(obj)) {
      case 'scalar':
        if (typeof(obj) == 'string') {
          if (obj == "") {
            return '""';
          }
          else if (yamdle.isPlain(obj, context)) {
            return obj;
          }
          else {
            var str = obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return '"' + str + '"';
          }
        }
        else if (obj === null) {
          return "null";
        }
        else {
          return obj.toString();
        }

      case 'sequence':
        if (obj.length == 0) {
          return "[]";
        }

        var str = ''
        for (var i = 0, ilen = obj.length; i < ilen; i++) {
          if (i > 0) {
            str += '\n' + indentStr;
          }
          str += '- ' + yamdle.stringify(obj[i], indent + 1);
        }
        return str;

      case 'map':
        var str = '', first = true;
        for (key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var value = obj[key];

            if (first) {
              first = false;
            }
            else {
              str += '\n' + indentStr;
            }

            str += yamdle.stringify(key, indent + 1, 'block-key');
            if (yamdle.typeOf(value) == 'scalar') {
              str += ': ';
            }
            else {
              str += ':\n' + yamdle.indentStr(indent + 1);
            }

            str += yamdle.stringify(value, indent + 1);
            i++;
          }
        }
        return str;
    }
  };

  yamdle.indentStr = function(level) {
    var indentStr = '';
    for (var i = 0; i < level; i++) {
      indentStr += '  ';
    }
    return indentStr;
  };

  yamdle.typeOf = function(obj) {
    switch (typeof(obj)) {
      case 'string':
      case 'number':
      case 'boolean':
        return 'scalar';

      case 'object':
        if (obj === null) {
          return 'scalar';
        }
        else if (obj instanceof Array) {
          return 'sequence';
        }
        else {
          return 'map';
        }
    }
  };

  yamdle.isPlain = function(str, context) {
    if (typeof(str) != "string") {
      throw "object must be a string";
    }

    var plain = false;
    if (yamdle.isType(str, 0, 'ns-plain-first', context) !== false) {
      plain = true;
      for (var i = 1, ilen = str.length; i < ilen; i++) {
        var ch = str[i];

        if (ch == ' ' && str[i-1] == ':') {
          // found ": ", which is not allowed
          plain = false;
          break;
        }

        if (ch == '#' && str[i-1] == ' ') {
          // found " #", which is not allowed
          plain = false;
          break;
        }

        if (yamdle.isType(str, i, 'ns-plain-safe', context) === false) {
          // not safe for plain
          plain = false;
          break;
        }
      }

      // check for integer
      plain = plain && !str.match(/^-?(0|[1-9][0-9]*)$/);

      // check for float
      plain = plain && !str.match(/^-?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/);

      // check for boolean and null
      plain = plain && !str.match(/^(true|false|null)$/);
    }

    return plain;
  };

  yamdle.isType = function(str, i, type, context) {
    // readable, but slow
    if (i >= str.length) {
      return false;
    }

    var ch = str[i];
    var c = str.charCodeAt(i);
    if (typeof(context) == 'undefined') {
      context = 'flow-out';
    }

    switch (type) {
      case 'c-printable':
        if ((c == 0x9 || c == 0xA || c == 0xD || (c >= 0x20 && c <= 0x7E) ||
             c == 0x85 || (c >= 0xA0 && c <= 0xD7FF) ||
            (c >= 0xE000 && c <= 0xFFFD))) {
          return i;
        }
        return false;

      case 'c-indicator':
        if (ch == '-' || ch == '?' || ch == ':' || ch == ',' || ch == '[' ||
            ch == ']' || ch == '{' || ch == '}' || ch == '#' || ch == '&' ||
            ch == '*' || ch == '!' || ch == '|' || ch == '>' || ch == "'" ||
            ch == '"' || ch == '%' || ch == '@' || ch == '`') {
          return i;
        }
        return false;

      case 'c-flow-indicator':
        if (ch == ',' || ch == '[' || ch == ']' || ch == '{' || ch == '}') {
          return i;
        }
        return false;

      case 'b-char':
        if (c == 0xA || c == 0xD) {
          return i;
        };
        return false;

      case 'c-byte-order-mark':
        if (c == 0xFEFF) {
          return i;
        }
        return false;

      case 'nb-char':
        if (yamdle.isType(str, i, 'c-printable', context) !== false &&
            yamdle.isType(str, i, 'b-char', context) === false &&
            yamdle.isType(str, i, 'c-byte-order-mark', context) === false) {
          return i;
        }
        return false;

      case 's-white':
        if (c == 0x20 || c == 0x9) {
          return i;
        }
        return false;

      case 'ns-char':
        if (yamdle.isType(str, i, 'nb-char', context) !== false &&
            yamdle.isType(str, i, 's-white', context) === false) {
          return i;
        }
        return false;

      case 'ns-plain-first':
        if (yamdle.isType(str, i, 'ns-char', context) !== false &&
            (ch == '?' || ch == ':' || ch == '-' ||
             yamdle.isType(str, i, 'c-indicator', context) === false)) {
          return i;
        }
        return false;

      case 'ns-plain-safe':
        switch (context) {
          case 'flow-out':
          case 'block-key':
            return yamdle.isType(str, i, 'ns-plain-safe-out', context);

          case 'flow-in':
          case 'flow-key':
            return yamdle.isType(str, i, 'ns-plain-safe-in', context);

          default:
            throw "invalid context";
        }

      case 'ns-plain-safe-out':
        return yamdle.isType(str, i, 'ns-char', context);

      case 'ns-plain-safe-in':
        if (yamdle.isType(str, i, 'ns-char', context) !== false &&
            yamdle.isType(str, i, 'c-flow-indicator', context) === false) {
          return i;
        }
        return false;

      case 'ns-plain-char':
        if (ch != ':' && ch != '#' && yamdle.isType(str, i, 'ns-plain-safe', context)) {
          return i;
        }
        if (yamdle.isType(str, i, 'ns-char', context) !== false && i < (str.length - 1) && str[i+1] == '#') {
          return i+1;
        }
        if (ch == ':' && yamdle.isType(str, i+1, 'ns-plain-safe', context)) {
          return i+1;
        }
        return false;

      case 'nb-ns-plain-in-line':
        var j = i;
        while (j < str.length) {
          var result = yamdle.isType(str, j, 's-white', context);
          while (result !== false) {
            j = result;
            result = yamdle.isType(str, j+1, 's-white', context);
          }

          var result = yamdle.isType(str, j, 'ns-plain-char', context);
          if (result === false) {
            break;
          }
          while (result !== false) {
            j = result;
            result = yamdle.isType(str, j+1, 'ns-plain-char', context);
          }
          i = j;
          j++;
        }
        return i;

      case 'ns-plain-multi-line':
        // not currently supported
        return yamdle.isType(str, i, 'ns-plain-one-line', context);

      case 'ns-plain-one-line':
        if (yamdle.isType(str, i, 'ns-plain-first', context) === false) {
          return false;
        }
        return yamdle.isType(str, i+1, 'nb-ns-plain-in-line', context);

      case 'ns-plain':
        switch (context) {
          case 'flow-out':
          case 'flow-in':
            return yamdle.isType(str, i, 'ns-plain-multi-line', context);

          case 'block-key':
          case 'flow-key':
            return yamdle.isType(str, i, 'ns-plain-one-line', context);
        }

      case 'ns-dec-digit':
        if (c >= 0x30 && c <= 0x39) {
          return i;
        }
        return false;

      case 'ns-hex-digit':
        if (yamdle.isType(str, i, 'ns-dec-digit', context) !== false ||
            (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66)) {
          return i;
        }
        return false;

      case 'c-ns-esc-char':
        if (ch != '\\' || i == (str.length - 1)) {
          return false;
        }

        i++;
        ch = str[i];
        c = str.charCodeAt(i);
        if (ch == '0' || ch == 'a' || ch == 'b' || ch == 't' || c == 0x9 ||
            ch == 'n' || ch == 'v' || ch == 'f' || ch == 'r' || ch == 'e' ||
            c == 0x20 || ch == '"' || ch == '/' || ch == '\\' || ch == 'N' ||
            ch == '_' || ch == 'L' || ch == 'P') {
          return i;
        }

        // unicode
        var num;
        if (ch == 'x') {
          num = 2;
        }
        else if (ch == 'u') {
          num = 4;
        }
        else if (ch == 'U') {
          num = 8;
        }
        else {
          return false;
        }

        i++;
        for (var j = 0; j < num; i++, j++) {
          if (yamdle.isType(str, i, 'ns-hex-digit', context) === false) {
            return false;
          }
        }
        return i;

      case 'nb-json':
        if (c == 0x9 || (c >= 0x20 && c <= 0x10FFFF)) {
          return i;
        }
        return false;

      case 'nb-double-char':
        var result = yamdle.isType(str, i, 'c-ns-esc-char', context);
        if (result !== false) {
          return result;
        }

        if (ch != '\\' && ch != '"' && yamdle.isType(str, i, 'nb-json', context) !== false) {
          return i;
        }
        return false;

      case 'nb-double-one-line':
        var result = yamdle.isType(str, i, 'nb-double-char', context);
        while (result !== false) {
          i = result;
          if (i >= (str.length - 1)) {
            break;
          }
          result = yamdle.isType(str, i+1, 'nb-double-char', context);
        }
        return i;

      case 'nb-double-multi-line':
        // not currently supported
        return yamdle.isType(str, i, 'nb-double-one-line', context);

      case 'c-double-quoted':
        if (ch != '"') {
          return false;
        }
        i++;

        var nextType;
        switch (context) {
          case 'flow-out':
          case 'flow-in':
            nextType = 'nb-double-multi-line';
            break;

          case 'block-key':
          case 'flow-key':
            nextType = 'nb-double-one-line';
            break;
        }

        i = yamdle.isType(str, i, nextType, context);
        if (i === false) {
          return false;
        }

        i++;
        if (str[i] == '"') {
          return i;
        }
        return false;

      default:
        throw "invalid character type";
    }
  };

  yamdle.convert = function(type, str) {
    switch (type) {
      case 'ns-plain':
        if (str.match(/^(0|-?[1-9][0-9]*)$/)) {
          return parseInt(str);
        }
        if (str.match(/^-?[1-9][0-9]*(\.[0-9]*)?(e[-+][0-9]+)?$/)) {
          return parseFloat(str);
        }
        if (str == "true") {
          return true;
        }
        if (str == "false") {
          return false;
        }
        if (str == "null") {
          return null;
        }
        return str;

      case 'c-double-quoted':
        var value = '';
        for (var i = 1; i < (str.length - 1); i++) {
          if (str[i] == '\\') {
            i++;
            var ch = str[i];
            var c = str.charCodeAt(i);
            if (ch == '0') {
              value += '\0';
            } else if (ch == 'a') {
              value += '\u0007';
            } else if (ch == 'b') {
              value += '\b';
            } else if (ch == 't' || c == 9) {
              value += '\t';
            } else if (ch == 'n') {
              value += '\n';
            } else if (ch == 'v') {
              value += '\u000b';
            } else if (ch == 'f') {
              value += '\f';
            } else if (ch == 'r') {
              value += '\r';
            } else if (ch == 'e') {
              value += '\u001b';
            } else if (c == 20) {
              value += ' ';
            } else if (ch == '"') {
              value += '"'
            } else if (ch == '/') {
              value += '/';
            } else if (ch == '\\') {
              value += '\\';
            } else if (ch == 'N') {
              value += '\u0085';
            } else if (ch == '_') {
              value += '\u00a0';
            } else if (ch == 'L') {
              value += '\u2028';
            } else if (ch == 'P') {
              value += '\u2029';
            } else if (ch == 'x') {
              value += String.fromCharCode(parseInt(str.substr(i+1, 2), 16));
              i += 2
            } else if (ch == 'u') {
              value += String.fromCharCode(parseInt(str.substr(i+1, 4), 16));
              i += 4
            } else if (ch == 'U') {
              // unsupported
            }
          }
          else {
            value += str[i];
          }
        }
        return value;
    }
  };

  yamdle.parse = function(str) {
    var context;

    var i = 0;
    var events = [];
    while (i < (str.length - 1)) {
      var start = i, end;
      var type;
      if ((end = yamdle.isType(str, i, 'ns-plain', context)) !== false) {
        type = 'ns-plain';
      }
      else if ((end = yamdle.isType(str, i, 'c-double-quoted', context)) !== false) {
        type = 'c-double-quoted';
      }
      else {
        break;
      }

      events.push({type: type, value: yamdle.convert(type, str.substring(start, end + 1))});
      i = end + 1;
    }

    if (events.length > 0) {
      return events[events.length - 1].value;
    }
  };

  return yamdle;
});

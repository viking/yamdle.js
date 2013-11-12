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
    if (yamdle.isCharType(str[0], 'ns-plain-first', context)) {
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

        if (!yamdle.isCharType(ch, 'ns-plain-safe', context)) {
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

  yamdle.isCharType = function(ch, type, context) {
    // readable, but slow
    var c = ch.charCodeAt(0);
    switch (type) {
      case 'c-printable':
        return(c == 0x9 || c == 0xA || c == 0xD || (c >= 0x20 && c <= 0x7E) ||
               c == 0x85 || (c >= 0xA0 && c <= 0xD7FF) ||
               (c >= 0xE000 && c <= 0xFFFD));

      case 'c-indicator':
        return(ch == '-' || ch == '?' || ch == ':' || ch == ',' || ch == '[' ||
               ch == ']' || ch == '{' || ch == '}' || ch == '#' || ch == '&' ||
               ch == '*' || ch == '!' || ch == '|' || ch == '>' || ch == "'" ||
               ch == '"' || ch == '%' || ch == '@' || ch == '`');

      case 'c-flow-indicator':
        return(ch == ',' || ch == '[' || ch == ']' || ch == '{' || ch == '}');

      case 'b-char':
        return(c == 0xA || c == 0xD);

      case 'c-byte-order-mark':
        return(c == 0xFEFF);

      case 'nb-char':
        return(yamdle.isCharType(ch, 'c-printable') &&
               !yamdle.isCharType(ch, 'b-char') &&
               !yamdle.isCharType(ch, 'c-byte-order-mark'));

      case 's-white':
        return(c == 0x20 || c == 0x9);

      case 'ns-char':
        return(yamdle.isCharType(ch, 'nb-char') &&
               !yamdle.isCharType(ch, 's-white'));

      case 'ns-plain-first':
        return(yamdle.isCharType(ch, 'ns-char') &&
               (ch == '?' || ch == ':' || ch == '-' ||
                !yamdle.isCharType(ch, 'c-indicator')));

      case 'ns-plain-safe':
        if (typeof(context) == 'undefined') {
          context = 'flow-out';
        }

        switch (context) {
          case 'flow-out':
          case 'block-key':
            return(yamdle.isCharType(ch, 'ns-plain-safe-out'));
          case 'flow-in':
          case 'flow-key':
            return(yamdle.isCharType(ch, 'ns-plain-safe-in'));

          default:
            throw "invalid context";
        }

      case 'ns-plain-safe-out':
        return(yamdle.isCharType(ch, 'ns-char'));

      case 'ns-plain-safe-in':
        return(yamdle.isCharType(ch, 'ns-char') &&
               !yamdle.isCharType(ch, 'c-flow-indicator'));

      default:
        throw "invalid character type";
    }
  };

  return yamdle;
});

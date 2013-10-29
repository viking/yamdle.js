define(function() {
  var yamdle = {};

  yamdle.stringify = function(obj, context) {
    switch (typeof(obj)) {
      case 'string':
        if (yamdle.isPlain(obj, context)) {
          return obj;
        }
        else {
          var str = obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          return '"' + str + '"';
        }

      case 'number':
      case 'boolean':
        return obj.toString();

      case 'object':
        if (obj === null) {
          return 'null';
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

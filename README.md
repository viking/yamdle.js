yamdle.js
=======

yamdle.js is a simple AMD module for emitting YAML.

Usage
-----

```javascript
require('yamdle', function(YAML) {
  console.log(YAML.stringify({foo: 'bar', baz: [123, 456.7, null, "42"]}));
});
```

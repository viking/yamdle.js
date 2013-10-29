yamdle.js
=======

yamdle.js is a simple AMD module for emitting YAML.

Usage
-----

### Browser example

```javascript
require(['yamdle'], function(YAML) {
  console.log(YAML.stringify({foo: 'bar', baz: [123, 456.7, null, "42"]}));
});
```

### NodeJS example

```javascript
var requirejs = require('requirejs');

requirejs.config({
  baseUrl: 'src'
});

requirejs(['yamdle'], function(YAML) {
  console.log(YAML.stringify({foo: 'bar', baz: [123, 456.7, null, "42"]}));
});
```

define([
  'lib/prod',
  'yamdle'
], function(prod, yamdle) {
  return new prod.Suite('yamdle', {
    'plain string': function() {
      this.assertEquals("foo", yamdle.stringify("foo"));
    },

    'non-plain string with quote': function() {
      this.assertEquals('"!f\\"oo"', yamdle.stringify('!f"oo'));
    },

    'non-plain string with blackslash': function() {
      this.assertEquals('"!f\\\\oo"', yamdle.stringify('!f\\oo'));
    },

    'number string': function() {
      this.assertEquals('"123"', yamdle.stringify("123"));
    },

    'float string': function() {
      this.assertEquals('"123.4"', yamdle.stringify("123.4"));
    },

    'boolean string': function() {
      this.assertEquals('"true"', yamdle.stringify("true"));
      this.assertEquals('"false"', yamdle.stringify("false"));
    },

    'float string': function() {
      this.assertEquals('"null"', yamdle.stringify("null"));
    },

    'integer': function() {
      this.assertEquals("123", yamdle.stringify(123));
    },

    'float': function() {
      this.assertEquals("123.4", yamdle.stringify(123.4));
    },

    'boolean': function() {
      this.assertEquals("true", yamdle.stringify(true));
      this.assertEquals("false", yamdle.stringify(false));
    },

    'null': function() {
      this.assertEquals("null", yamdle.stringify(null));
    },

    'array': function() {
      this.assertEquals("- foo\n- bar", yamdle.stringify(['foo', 'bar']));
    },

    'empty array': function() {
      this.assertEquals("[]", yamdle.stringify([]));
    },

    'object': function() {
      var obj = {foo: 'bar', baz: 'qux'};
      this.assertEquals("foo: bar\nbaz: qux", yamdle.stringify(obj));
    }
  });
});

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

    'integer': function() {
      this.assertEquals("123", yamdle.stringify(123));
    },

    'boolean': function() {
      this.assertEquals("true", yamdle.stringify(true));
      this.assertEquals("false", yamdle.stringify(false));
    },

    'null': function() {
      this.assertEquals("null", yamdle.stringify(null));
    }
  });
});

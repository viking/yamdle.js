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
    }
  });
});

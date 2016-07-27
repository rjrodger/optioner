'use strict'

var Optioner = require('..')
var Joi = require('joi')

// var Code = require('code')
var Lab = require('lab')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
// var expect = Code.expect


describe('optioner', function () {
  it('happy', function (done) {
    var opter = Optioner({
      a: Joi.number().integer().default(1),
      b: {c: 2},
      d: {e: {f: 3}},
      g: null,
      h: [Joi.number().integer().default(4)]
    })
    opter({b:{c:22}}, function (err, out) {
      if (err) return done(err)
      console.log('OUT', out)
      done()
    })
  })
})


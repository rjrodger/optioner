'use strict'

var Optioner = require('..')

const Code = require('code')
const Lab = require('lab')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect


describe('optioner', function () {

  it('happy', function (done) {
    var opter = Optioner({})
    done()
  })
})


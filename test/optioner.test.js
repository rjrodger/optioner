/* Copyright (c) 2017-2018 Richard Rodger and other contributors, MIT License */
'use strict'

var Optioner = require('..')

var Code = require('code')
var Lab = require('lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var Joi = Optioner.Joi

describe('optioner', function() {
  it('happy', function(fin) {
    var opter = Optioner({
      a: 1,
      b: { c: 2 },
      d: { e: { f: 3 } },
      g: null,
      h: Joi.number()
        .integer()
        .default(4),
      i: [
        Joi.number()
          .integer()
          .default(5),
        6
      ],
      j: [{ k: 7 }]
    })

    opter({}, function(err, out) {
      if (err) return fin(err)
      //console.log('OUT', out)
      expect(out).to.equal({
        a: 1,
        b: { c: 2 },
        d: { e: { f: 3 } },
        g: null,
        h: 4,
        i: [5, 6],
        j: [{ k: 7 }]
      })
      fin()
    })
  })

  it('empty', function(fin) {
    var opter = Optioner({ a: 1 })

    opter(null, function(err, out) {
      if (err) return fin(err)
      expect(out).to.equal({ a: 1 })
      fin()
    })
  })

  it('array', function(fin) {
    var opter = Optioner([1, Joi.string().default('a')])

    opter({}, function(err, out) {
      if (err) return fin(err)
      expect(out).to.equal([1, 'a'])

      opter([], function(err, out) {
        if (err) return fin(err)
        expect(out).to.equal([1, 'a'])

        opter([1], function(err, out) {
          if (err) return fin(err)
          expect(out).to.equal([1, 'a'])

          fin()
        })
      })
    })
  })

  it('function', function(fin) {
    var fx = function(x) {
      return x + 1
    }

    var opter = Optioner({
      a: fx
    })

    opter({}, function(err, out) {
      if (err) return fin(err)
      expect(out.a(1)).to.equal(2)

      opter(
        {
          a: function(x) {
            return x + 2
          }
        },
        function(err, out) {
          if (err) return fin(err)
          expect(out.a(1)).to.equal(3)

          fin()
        }
      )
    })
  })

  it('edge', function(fin) {
    var opter = Optioner({
      a: undefined
    })

    opter({}, function(err, out) {
      if (err) return fin(err)
      expect(out).to.equal({})
      fin()
    })
  })

  it('default-types', function(fin) {
    var opter = Optioner({
      a: 1,
      b: 1.1,
      c: 'x',
      d: true
    })

    opter({ a: 2, b: 2.2, c: 'y', d: false }, function(err, out) {
      if (err) return fin(err)
      expect(out).to.equal({ a: 2, b: 2.2, c: 'y', d: false })

      opter({ a: 3.3 }, function(err, out) {
        expect(err.details[0].type).to.equal('number.integer')

        opter({ b: 4 }, function(err, out) {
          if (err) return fin(err)
          expect(out).to.equal({ a: 1, b: 4, c: 'x', d: true })

          opter({ b: 'z' }, function(err, out) {
            expect(err.details[0].type).to.equal('number.base')

            opter({ c: 1 }, function(err, out) {
              expect(err.details[0].type).to.equal('string.base')

              opter({ d: 'q' }, function(err, out) {
                expect(err.details[0].type).to.equal('boolean.base')

                fin()
              })
            })
          })
        })
      })
    })
  })

  it('inject', function(fin) {
    expect(Optioner.inject(null, { x: 1 }, { y: 1 })).to.equal({ x: 1 })
    expect(Optioner.inject('', { x: 1 }, { y: 1 })).to.equal({ x: 1 })
    expect(Optioner.inject('', { '0': 1 }, [1])).to.equal({ '0': 1 })
    expect(Optioner.inject('a', 1, null)).to.equal(null)

    expect(Optioner.inject('a', 1, {})).to.equal({ a: 1 })
    expect(Optioner.inject('a.b', 2, { a: {} })).to.equal({ a: { b: 2 } })
    expect(Optioner.inject('a.b', 2, {})).to.equal({ a: { b: 2 } })

    expect(Optioner.inject('0', 1, [])).to.equal([1])
    expect(Optioner.inject('a.0', 1, { a: [2, 2] })).to.equal({
      a: [1, 2]
    })
    expect(Optioner.inject('a.0', 1, {})).to.equal({ a: [1] })
    expect(Optioner.inject('a.0.b', 1, { a: [{ c: 2 }] })).to.equal({
      a: [{ c: 2, b: 1 }]
    })
    fin()
  })

  it('arr2obj', function(fin) {
    expect(Optioner.arr2obj({ a: [1] }, { arrpaths: ['a'] })).to.equal({
      a: { '0': 1 }
    })
    expect(Optioner.arr2obj({ a: [1] }, { arrpaths: [] })).to.equal({
      a: [1]
    })

    expect(Optioner.arr2obj([1], { arrpaths: [''] })).to.equal({ '0': 1 })
    expect(Optioner.arr2obj(null, { arrpaths: ['a'] })).to.equal(null)

    expect(
      Optioner.arr2obj({ a: [1], b: { c: [2] } }, { arrpaths: ['a', 'b.c'] })
    ).to.equal({ a: { '0': 1 }, b: { c: { '0': 2 } } })

    fin()
  })

  it('obj2arr', function(fin) {
    expect(Optioner.obj2arr({ a: { '0': 1 } }, { arrpaths: ['a'] })).to.equal({
      a: [1]
    })
    expect(Optioner.obj2arr({ a: { '0': 1 } }, { arrpaths: [] })).to.equal({
      a: { '0': 1 }
    })
    expect(Optioner.obj2arr({ a: [1] }, { arrpaths: ['a'] })).to.equal({
      a: [1]
    })
    expect(
      Optioner.obj2arr({ a: { '0': 1, '-1': 2, x: 3 } }, { arrpaths: ['a'] })
    ).to.equal({ a: [1] })

    expect(Optioner.obj2arr({ '0': 1 }, { arrpaths: [''] })).to.equal([1])

    expect(Optioner.obj2arr(null, { arrpaths: [''] })).to.equal(null)

    expect(
      Optioner.obj2arr(
        { a: { '0': 1 }, b: { c: { '0': 2 } } },
        { arrpaths: ['a', 'b.c'] }
      )
    ).to.equal({ a: [1], b: { c: [2] } })

    fin()
  })

  it('readme', function(fin) {
    var optioner = Optioner({
      color: 'red',
      size: Joi.number()
        .integer()
        .max(5)
        .min(1)
        .default(3),
      range: [100, 200]
    })

    var promise = optioner({ size: 2 })
    // prints: { color: 'red', size: 2, range: [ 100, 200 ] }
    // console.log(promise.value)

    // prints: { color: 'red', size: 2, range: [ 100, 200 ] }
    // promise
    // .then(console.log)

    optioner({}, function(err, out) {
      if (err) return fin(err)
      // prints: { color: 'red', size: 3, range: [ 100, 200 ] }
      // console.log(out)
    })

    optioner({ range: [50] }, function(err, out) {
      if (err) return fin(err)
      // prints: { range: [ 50, 200 ], color: 'red', size: 3 }
      // console.log(out)
    })

    optioner({ size: 6 }, function(err, out) {
      if (err) return
      // prints: child "size" fails because ["size" must be less than or equal to 5
      // console.log(err)
    })

    fin()
  })

  it('check', function(fin) {
    var optioner = Optioner({
      bool: Joi.boolean().default(true)
    })

    expect(optioner.check({})).contains({ bool: true })
    expect(optioner.check({ bool: true })).contains({ bool: true })
    expect(optioner.check({ bool: false })).contains({ bool: false })

    try {
      optioner.check({ bool: 'foo' })
      Code.fail('never')
    } catch (e) {
      expect(e.name).equal('ValidationError')
      return fin()
    }
  })


  it('ignore', function(fin) {
    var optioner_ignore = Optioner({
      a: 1
    })

    expect(optioner_ignore.check({})).contains({ a: 1 })
    expect(optioner_ignore.check({ b: 2 })).contains({ a: 1, b: 2 })
    expect(optioner_ignore.check({ a: 1, b: 2 })).contains({ a: 1, b: 2 })

    var optioner_fail = Optioner({
      a: 1
    }, {allow_unknown: false})

    expect(optioner_fail.check({})).contains({ a: 1 })

    try {
      optioner_fail.check({ a: 1, b: 2 })
      Code.fail('never')
    } catch (e) {
      expect(e.name).equal('ValidationError')
      return fin()
    }
  })

})

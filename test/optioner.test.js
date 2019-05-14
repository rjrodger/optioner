/* Copyright (c) 2017-2019 Richard Rodger and other contributors, MIT License */
'use strict'

var Optioner = require('..')

var Code = require('@hapi/code')
var Lab = require('@hapi/lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var Joi = Optioner.Joi

describe('optioner', function() {
  it('happy', async () => {
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

    return new Promise((fin, fail) => {
      opter({}, function(err, out) {
        if (err) return fail(err)
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
  })

  it('empty', async () => {
    var opter = Optioner({ a: 1 })

    return new Promise((fin, fail) => {
      opter(null, function(err, out) {
        if (err) return fail(err)
        expect(out).to.equal({ a: 1 })
        fin()
      })
    })
  })

  it('array', async () => {
    var opter = Optioner([1, Joi.string().default('a')])

    return new Promise((fin, fail) => {
      opter({}, function(err, out) {
        if (err) return fail(err)
        expect(out).to.equal([1, 'a'])

        opter([], function(err, out) {
          if (err) return fail(err)
          expect(out).to.equal([1, 'a'])

          opter([1], function(err, out) {
            if (err) return fail(err)
            expect(out).to.equal([1, 'a'])

            fin()
          })
        })
      })
    })
  })

  it('function', async () => {
    var fx = function(x) {
      return x + 1
    }

    var opter = Optioner({
      a: fx
    })

    return new Promise((fin, fail) => {
      opter({}, function(err, out) {
        if (err) return fail(err)
        expect(out.a(1)).to.equal(2)

        opter(
          {
            a: function(x) {
              return x + 2
            }
          },
          function(err, out) {
            if (err) return fail(err)
            expect(out.a(1)).to.equal(3)

            fin()
          }
        )
      })
    })
  })

  it('edge', async () => {
    var opter = Optioner({
      a: undefined
    })

    return new Promise((fin, fail) => {
      opter({}, function(err, out) {
        if (err) return fail(err)
        expect(out).to.equal({})
        fin()
      })
    })
  })

  it('default-types', async () => {
    var opter = Optioner({
      a: 1,
      b: 1.1,
      c: 'x',
      d: true
    })

    return new Promise((fin, fail) => {
      opter({ a: 2, b: 2.2, c: 'y', d: false }, function(err, out) {
        if (err) return fail(err)
        expect(out).to.equal({ a: 2, b: 2.2, c: 'y', d: false })

        opter({ a: 3.3 }, function(err, out) {
          expect(err.details[0].type).to.equal('number.integer')

          opter({ b: 4 }, function(err, out) {
            if (err) return fail(err)
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
  })

  it('inject', async () => {
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
  })

  it('arr2obj', async () => {
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
  })

  it('obj2arr', async () => {
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
  })

  it('readme', async () => {
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
      if (err) return fail(err)
      // prints: { color: 'red', size: 3, range: [ 100, 200 ] }
      // console.log(out)
    })

    optioner({ range: [50] }, function(err, out) {
      if (err) return fail(err)
      // prints: { range: [ 50, 200 ], color: 'red', size: 3 }
      // console.log(out)
    })

    optioner({ size: 6 }, function(err, out) {
      if (err) return
      // prints: child "size" fails because ["size" must be less than or equal to 5
      // console.log(err)
    })
  })

  it('check', async () => {
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
    }
  })

  it('ignore', async () => {
    var optioner_ignore = Optioner({
      a: 1
    })

    expect(optioner_ignore.check({})).contains({ a: 1 })
    expect(optioner_ignore.check({ b: 2 })).contains({ a: 1, b: 2 })
    expect(optioner_ignore.check({ a: 1, b: 2 })).contains({ a: 1, b: 2 })

    var optioner_fail = Optioner(
      {
        a: 1
      },
      { allow_unknown: false }
    )

    expect(optioner_fail.check({})).contains({ a: 1 })

    try {
      optioner_fail.check({ a: 1, b: 2 })
      Code.fail('never')
    } catch (e) {
      expect(e.name).equal('ValidationError')
    }

    var optioner_ignore_deep = Optioner({
      a: 1,
      b: { c: 2 }
    })

    expect(optioner_ignore_deep.check({})).contains({ a: 1, b: { c: 2 } })
    expect(optioner_ignore_deep.check({ b: { d: 3 } })).contains({
      a: 1,
      b: { c: 2, d: 3 }
    })

    var optioner_ignore_deep_fail = Optioner(
      {
        a: 1,
        b: { c: 2 }
      },
      { allow_unknown: false }
    )

    expect(optioner_ignore_deep_fail.check({})).contains({ a: 1, b: { c: 2 } })

    try {
      expect(optioner_ignore_deep_fail.check({ b: { d: 3 } })).contains({
        a: 1,
        b: { c: 2, d: 3 }
      })
      Code.fail('never')
    } catch (e) {
      expect(e.name).equal('ValidationError')
    }
  })

  it('must_match', async () => {
    var o0 = Optioner(
      {
        a: 1
      },
      { must_match_literals: true }
    )

    expect(o0.check({ a: 1 })).equals({ a: 1 })
    expect(o0.check({ a: 1, b: 2 })).includes({ a: 1 })

    expect(o0({}).error.message).equals(
      'child "a" fails because ["a" is required]'
    )
    expect(o0({ a: 2 }).error.message).equals(
      'child "a" fails because ["a" must be one of [1]]'
    )
    expect(o0({ a: 'x' }).error.message).equals(
      'child "a" fails because ["a" must be one of [1]]'
    )

    var o1 = Optioner(
      {
        a: 1,
        b: { c: 2 }
      },
      { must_match_literals: true }
    )

    expect(o1.check({ a: 1, b: { c: 2 } })).equals({ a: 1, b: { c: 2 } })
    expect(o1.check({ a: 1, b: { c: 2, z: 3 }, y: 4 })).equals({
      a: 1,
      b: { c: 2, z: 3 },
      y: 4
    })

    expect(o1({ a: 1 }).error.message).equals(
      'child "b" fails because [child "c" fails because ["c" is required]]'
    )
    expect(o1({ a: 1, b: {} }).error.message).equals(
      'child "b" fails because [child "c" fails because ["c" is required]]'
    )
    expect(o1({ a: 1, b: { c: 'x' } }).error.message).equals(
      'child "b" fails because [child "c" fails because ["c" must be one of [2]]]'
    )

    var o2 = Optioner(
      {
        a: 1,
        b: Joi.string()
      },
      { must_match_literals: true }
    )

    expect(o2.check({ a: 1, b: 'x' })).equals({ a: 1, b: 'x' })
    expect(o2({ a: 1, b: 2 }).error.message).equals(
      'child "b" fails because ["b" must be a string]'
    )

    var o3 = Optioner(
      {
        a: { b: { c: 1 } }
      },
      { must_match_literals: true }
    )

    expect(o3.check({ a: { b: { c: 1 } } })).equals({ a: { b: { c: 1 } } })
    expect(o3({ a: { b: { c: 2 } } }).error.message).equals(
      'child "a" fails because [child "b" fails because [child "c" fails because ["c" must be one of [1]]]]'
    )

    var o4 = Optioner(
      {
        a: [1]
      },
      { must_match_literals: true }
    )

    expect(o4.check({ a: [1] })).equals({ a: [1] })
    expect(o4.check({ a: [1, 2] })).equals({ a: [1, 2] })
    expect(o4({ a: [2] }).error.message).equals(
      'child "a" fails because [child "0" fails because ["0" must be one of [1]]]'
    )

    var o5 = Optioner(
      {
        a: [{ b: 1 }]
      },
      { must_match_literals: true }
    )

    expect(o5.check({ a: [{ b: 1 }] })).equals({ a: [{ b: 1 }] })
    expect(o5.check({ a: [{ b: 1, c: 2 }, { b: 3 }] })).equals({
      a: [{ b: 1, c: 2 }, { b: 3 }]
    })
    expect(o5({ a: [{ b: 11, c: 2 }, { b: 3 }] }).error.message).equals(
      'child "a" fails because [child "0" fails because [child "b" fails because ["b" must be one of [1]]]]'
    )

    var o6 = Optioner([1], { must_match_literals: true })
    expect(o6.check([1])).equals([1])
    expect(o6([2]).error.message).equals(
      'child "0" fails because ["0" must be one of [1]]'
    )

    var o7 = Optioner([{}, { a: 2 }], { must_match_literals: true })
    expect(o7.check([{ a: 1 }, { a: 2 }, { a: 3 }])).equals([
      { a: 1 },
      { a: 2 },
      { a: 3 }
    ])
    expect(o7([{ a: 1 }, { a: 3 }]).error.message).equals(
      'child "1" fails because [child "a" fails because ["a" must be one of [2]]]'
    )
  })
})

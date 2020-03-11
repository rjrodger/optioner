/* Copyright (c) 2017-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

var Joi = require('@hapi/joi')
var Hoek = require('@hapi/hoek')

module.exports = function(spec, options) {
  return make_optioner(spec, options)
}
module.exports.Joi = Joi
module.exports.inject = inject
module.exports.arr2obj = arr2obj
module.exports.obj2arr = obj2arr

function make_optioner(spec, options) {
  var opts = options || {}
  opts.allow_unknown = null == opts.allow_unknown ? true : !!opts.allow_unknown

  var ctxt = { arrpaths: [] }
  var joispec = prepare_spec(spec, opts, ctxt)
  var schema = Joi.compile(joispec)

  function validate(input, done) {
    var work = Hoek.clone(input) || {}

    // converts arrays to objects so that validation can be performed on a
    // per-element basis
    work = arr2obj(work, ctxt)

    var result = schema.validate(work)
    if (!result.error) {
      result.value = obj2arr(result.value, ctxt)
    }

    if (null == done) {
      return result
    } else {
      return done(result.error, result.value)
    }
  }

  validate.check = function check(input) {
    var result = validate(input)
    if (result.error) throw result.error
    return result.value
  }

  validate.joi = joispec

  return validate
}

function prepare_spec(spec, opts, ctxt) {
  var joiobj = Joi.object()

  if (opts.allow_unknown) {
    joiobj = joiobj.unknown()
  }

  var joi = walk(joiobj, spec, '', opts, ctxt, function(valspec) {
    if (valspec && Joi.isSchema(valspec)) {
      return valspec
    } else {
      var typecheck = typeof valspec
      //typecheck = 'function' === typecheck ? 'func' : typecheck

      if (opts.must_match_literals) {
        return Joi.any()
          .required()
          .valid(valspec)
      } else {
        if (void 0 === valspec) {
          return Joi.any().optional()
        } else if (null == valspec) {
          return Joi.any().default(null)
        } else if ('number' === typecheck && Number.isInteger(valspec)) {
          return Joi.number()
            .integer()
            .default(valspec)
        } else if ('string' === typecheck) {
          return Joi.string()
            .empty('')
            .default(() => valspec)
        } else {
          return Joi[typecheck]().default(() => valspec)
        }
      }
    }
  })

  return joi
}

function walk(joi, obj, path, opts, ctxt, mod) {
  if (Array.isArray(obj)) {
    ctxt.arrpaths.push(path)
  }

  for (var p in obj) {
    var v = obj[p]
    var t = typeof v

    var kv = {}

    if (null != v && !Joi.isSchema(v) && 'object' === t) {
      var np = '' === path ? p : path + '.' + p

      var joiobj = Joi.object().default()

      if (opts.allow_unknown) {
        joiobj = joiobj.unknown()
      }

      kv[p] = walk(joiobj, v, np, opts, ctxt, mod)
    } else {
      kv[p] = mod(v)
    }

    joi = joi.keys(kv)
  }

  return joi
}

function inject(path, val, obj) {
  var top = obj

  if (null == obj) return obj

  var pp = ('string' === typeof path ? path : '').split('.')

  for (var i = 0; i < pp.length - 1; ++i) {
    var n = obj[pp[i]]
    if (null == n) {
      n = obj[pp[i]] = isNaN(parseInt(pp[i + 1], 10)) ? {} : []
    }
    obj = n
  }

  if ('' === pp[i]) {
    top = val
  } else {
    obj[pp[i]] = val
  }

  return top
}

function arr2obj(work, ctxt) {
  if (null == work) return work

  for (var apI = 0; apI < ctxt.arrpaths.length; ++apI) {
    var ap = ctxt.arrpaths[apI]
    var arr = '' === ap ? work : Hoek.reach(work, ap)

    if (Array.isArray(arr)) {
      var obj = {}

      for (var i = 0; i < arr.length; ++i) {
        obj[i] = arr[i]
      }

      work = inject(ap, obj, work)
    }
  }

  return work
}

function obj2arr(work, ctxt) {
  if (null == work) return work

  for (var apI = 0; apI < ctxt.arrpaths.length; ++apI) {
    var ap = ctxt.arrpaths[apI]
    var obj = '' === ap ? work : Hoek.reach(work, ap)

    if (!Array.isArray(obj)) {
      var arr = []

      for (var p in obj) {
        var i = parseInt(p, 10)
        if (!isNaN(i) && 0 <= i) {
          arr[i] = obj[p]
        }
      }

      work = inject(ap, arr, work)
    }
  }

  return work
}

/*
  MIT License,
  Copyright (c) 2016, Richard Rodger and other contributors.
*/

'use strict'

var Util = require('util')

var Joi = require('joi')
var Hoek = require('hoek')


module.exports = function (spec) {
  return make_optioner(spec)
}


function make_optioner (spec) {
  var ctxt = {arrpaths: []}
  var joispec = prepare_spec(spec, ctxt)
  //console.log('J', require('util').inspect(joispec,{depth:null}))

  var schema = Joi.compile(joispec)

  return function optioner (input, done) {
    var work = Hoek.clone(input)
    for( var apI = 0; apI < ctxt.arrpaths.length; ++apI ) {
      var ap = ctxt.arrpaths[apI]
      var arr = Hoek.reach(work,ap)
      console.log('WA',ap,arr)

      if(Util.isArray(arr)) {
        var obj = {}
        for( var i = 0; i < arr.length; ++i) {
          obj[i]=arr[i]
        }
        work[ap] = obj
      }
    }
    Joi.validate(input, schema, function (err, out) {
      if (err) return done(err)

      console.log('RO',out)

      for( var apI = 0; apI < ctxt.arrpaths.length; ++apI ) {
        var ap = ctxt.arrpaths[apI]
        var obj = Hoek.reach(out,ap)
        var arr = []
        for( var p in obj ) {
          var i = parseInt(p)
          if( !isNaN(i) && 0 <= i ) {
            arr[i] = obj[p]
          }
        }
        console.log('OA',ap,arr)
        out[ap] = arr
      }
      
      done(null,out)
    })
  }
}


function prepare_spec (spec,ctxt) {
  var joi = walk(
    //Util.isArray(spec) ? Joi.array() : 
    Joi.object(), 
    spec, 
    '',
    ctxt,
    function (valspec) {
      if (valspec && valspec.isJoi) {
        return valspec
      }
      else {
        return Joi.default(valspec)
      }
    })

  return joi
}


function walk (joi, obj, path, ctxt, mod) {
  console.log('P',path)

  for (var p in obj) {
    var v = obj[p]
    var t = typeof v
    //console.log(p, v, t)

    var kv = {}

    if (null != v && !v.isJoi && 'object' === t) {
      var np = '' === path ? p : path+'.'+p
      if (Util.isArray(v)) {
        console.log('AP',np)
        ctxt.arrpaths.push(np)
      }
      kv[p] = walk( Joi.object().default(), v, np, ctxt, mod )
    }
    else {
      kv[p] = mod(v)
    }

    joi = joi.keys(kv)
  }

  return joi
}

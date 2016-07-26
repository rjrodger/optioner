/*
  MIT License,
  Copyright (c) 2016, Richard Rodger and other contributors.
*/

'use strict'

var Joi = require('joi')


module.exports = function (spec) {
  return new Optioner( spec )
}

function Optioner (spec) {
  var self = this
}

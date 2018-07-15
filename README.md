# optioner
> Process and validate options for your module.

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Gitter][gitter-badge]][gitter-url]

Specify a deeply-merged set of [hapijs joi][joi] rules and defaults to
process options provided to your module.

Users of your module can quickly debug issues as they get immediate
feedback on configuration issues, and you can provide a user friendly
set of defaults.
 
This provides essentially the same behavior as
[lodash.defaultsDeep](https://lodash.com/docs#defaultsDeep), but also
gives you validation, and more intelligent array handling (per element
control).

You can use [joi] rules directly, or literal values, which are
translated into rules of the form: `Joi.<type>().default(<value>)`
where _type_ is the type of the value.


## Quick Example


```js
var Optioner = require('optioner')

var check = Optioner({beatles: 4}).check

// prints { beatles: 4, stones: 5 }
console.log(check({stones: 5}))


var optioner = Optioner({
  color: 'red',
  size: Joi.number().integer().max(5).min(1).default(3),
  range: [100, 200]
})

var promise = optioner({size: 2})

// prints: { color: 'red', size: 2, range: [ 100, 200 ] }
promise
  .then(console.log)

// prints: { color: 'red', size: 2, range: [ 100, 200 ] }
console.log(promise.value)

optioner({}, function (err, out) {
  // prints: { color: 'red', size: 3, range: [ 100, 200 ] }
  console.log(out)
})

optioner({range: [50]}, function (err, out) {
  // prints: { range: [ 50, 200 ], color: 'red', size: 3 }
  console.log(out)
})

optioner({size: 6}, function (err, out) {
  // prints: child "size" fails because ["size" must be less than or equal to 5
  console.log(err)
})
```

## Options

`Optioner({ ... spec ... }, { ... options ... }})`

* _allow_unknown_: `true|false`, default `true`; allow unknown properties
* _must_match_literals_: `true|false`, default `false`; force exact matches of literal values


## Questions?

[@rjrodger](https://twitter.com/rjrodger)
[![Gitter][gitter-badge]][gitter-url]

## License
Copyright (c) 2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[npm-badge]: https://badge.fury.io/js/optioner.svg
[npm-url]: https://badge.fury.io/js/optioner
[travis-badge]: https://travis-ci.org/rjrodger/optioner.svg
[travis-url]: https://travis-ci.org/rjrodger/optioner
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/rjrodger/seneca
[github issue]: https://github.com/rjrodger/optioner/issues
[joi]: https://github.com/hapijs/joi






let prop = require('property-expr')

let cache = Object.create(null)

module.exports = function specFromPath(path, value) {
  var obj = {}, current = obj;

  if ( cache[path] ) {
    obj = cache[path].spec
    cache[path].tip.$set = value
    return obj
  }

  prop.split(path)
    .forEach(part => current = (current[part] = {}))

  current.$set = value
  cache[path] = { spec: obj, tip: current }

  return obj
}
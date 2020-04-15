const generics = require("./generics");

const all = async (orderBy = 'url', direction) => {
  return generics.all('recipe')(orderBy, direction);
}

const create = async url => generics.insert('recipe')({ url })

module.exports = {
  all,
  create
}
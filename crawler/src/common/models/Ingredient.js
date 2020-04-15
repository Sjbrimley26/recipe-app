const generics = require("./generics");

const all = async (orderBy = 'item', direction) => {
  return generics.all('ingredient')(orderBy, direction);
}

const create = async item => generics.insert('ingredient')({ item })

module.exports = {
  all,
  create
}
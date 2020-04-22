const generics = require("./generics");

const all = async (orderBy = 'url', direction) => {
  return generics.all('recipe')(orderBy, direction);
}

const create = async props => generics.insert('recipe')(props)

module.exports = {
  all,
  create
}
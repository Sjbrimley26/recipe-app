const generics = require("./generics");

const TABLE_NAME = 'ingredient'

const all = async (orderBy = 'item', direction) => {
  return (await generics.all(TABLE_NAME)(orderBy, direction)).map(i => i.item);
}

const create = async item => generics.insert(TABLE_NAME)({ item })

const del = async item => generics.deleteByPrimary(TABLE_NAME, 'item')(item);

module.exports = {
  all,
  create,
  delete: del
}
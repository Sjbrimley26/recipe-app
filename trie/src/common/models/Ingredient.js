const generics = require("./generics")
const { knex } = require('../config')

const TABLE_NAME = 'ingredient'

const all = async (orderBy = 'item', direction) => {
  return (await generics.all(TABLE_NAME)(orderBy, direction)).map(i => i.item);
}

const create = async item => generics.insert(TABLE_NAME)({ item })

const del = async item => generics.deleteByPrimary(TABLE_NAME, 'item')(item);

const has = async item => {
  try {
    const row = await knex(TABLE_NAME).where({ item });
    if (row.length < 1) {
      return false;
    }
    return true;
  }
  catch (err) {
    console.error(`error determining whether key exists`, err.message, err.stack)
    return undefined;
  }
}

module.exports = {
  all,
  create,
  delete: del,
  has
}
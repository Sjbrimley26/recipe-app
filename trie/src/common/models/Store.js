const { knex } = require("../config");

const get = async id => {
  try {
    const row = await knex('store').where({ id });
    if (row.length < 1) {
      throw new Error('key does not exist in store', id);
    }
    return row[0].val;
  }
  catch (err) {
    console.error(`error retrieving from key store`, err.message, err.stack)
    return undefined;
  }
}

const has = async id => {
  try {
    const row = await knex('store').where({ id });
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

const set = async (id, val) => {
  try {
    const exists = await has(id);
    if (exists) {
      // console.log('UPDATING')
      await knex('store').update({ val }).where({ id });
    } else {
      // console.log('SETTING')
      await knex('store').insert({ id, val })
    }
    return true;
  }
  catch (err) {
    console.error(`error inserting into ${table}`, err.stack, err.message)
    return false
  }
}


module.exports = {
  get,
  set,
  has
};

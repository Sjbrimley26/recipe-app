const { knex } = require("../config");

const all = table => async (orderBy, direction = "asc") => {
  try {
    return await knex(table).orderBy(orderBy, direction);
  } catch (err) {
    console.log(`Error getting all ${table} items`, err);
    return [];
  }
}

const getByPrimary = (table, column) => async value => {
  try {
    const res = await knex(table).where(column, value);
    return res[0];
  } catch (err) {
    console.log(`Error getting ${table} item`, err);
    return undefined;
  }
}

const updateByPrimary = (table, column) => async (value, updates) => {
  try {
    await knex(table).where(column, value).update(updates);
    const res = await knex(table).where(column, value);
    return res[0];
  } catch (err) {
    console.log(`Error updating ${table} item`, err);
    return undefined;
  }
}

const deleteByPrimary = (table, column) => async value => {
  try {
    await knex(table).where(column, value).del();
    return true;
  } catch (err) {
    console.log(`Error deleting ${table} item`, err)
    return false;
  }
}

const insert = table => async values => {
  try {
    await knex(table).insert(values)
    return true
  }
  catch (err) {
    if (/duplicate/.test(err.message)) {
      console.log(`duplicate insertion attempted: ${JSON.stringify(values)}`)
      return false
    }
    console.error(`error inserting into ${table}`, err.stack, err.message)
    return false
  }
}

module.exports = {
  all,
  getByPrimary,
  updateByPrimary,
  deleteByPrimary,
  insert
};

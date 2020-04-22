const generics = require("./generics");
const { knex } = require('../config');
const Ingredient = require('./Ingredient');

const TABLE_NAME = 'recipe_ingredient'

const all = async (orderBy = 'recipe', direction) => {
  return generics.all(TABLE_NAME)(orderBy, direction);
}

const create = async (recipe, items) => {
  const fmt = items.map(ingredient => {
    return {
      recipe,
      ingredient
    }
  })

  return generics.insert(TABLE_NAME)(fmt);
}

const renameIngredient = async (oldName, newName) => {
  try {
    const revision = knex(TABLE_NAME).where({ ingredient: oldName }).update({ ingredient: newName })
    const deletion = Ingredient.delete(oldName)
    await Promise.all([ revision, deletion ])
    return true;
  }
  catch (err) {
    console.error('error renaming ingredient', err.message, err.stack);
    return false;
  }
}

const deleteIngredient = async ingredient => {
  try {
    await knex(TABLE_NAME).where({ ingredient }).del();
    await knex('ingredient').where({ item: ingredient }).del()
    return true;
  }
  catch (err) {
    console.err('error deleting ingredient', err.message, err.stack);
    return false;
  }
}

module.exports = {
  all,
  create,
  renameIngredient,
  deleteIngredient
}
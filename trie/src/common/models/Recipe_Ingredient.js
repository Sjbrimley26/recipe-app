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
    const existing = await Ingredient.has(newName)
    if (!existing) {
      await Ingredient.create(newName)
    }
    await knex(TABLE_NAME).where({ ingredient: oldName }).update({ ingredient: newName })
    await Ingredient.delete(oldName)
    return true;
  }
  catch (err) {
    console.error('error renaming ingredient', err.message, err.stack);
    return false;
  }
}

module.exports = {
  all,
  create,
  renameIngredient
}
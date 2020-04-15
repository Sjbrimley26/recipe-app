const generics = require("./generics");

const all = async (orderBy = 'recipe', direction) => {
  return generics.all('recipe_ingredient')(orderBy, direction);
}

const create = async (recipe, items) => {
  const fmt = items.map(ingredient => {
    return {
      recipe,
      ingredient
    }
  })

  return generics.insert('recipe_ingredient')(fmt);
}

module.exports = {
  all,
  create
}
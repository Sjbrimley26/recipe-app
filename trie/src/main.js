const express = require('express')
const RT = require('./RecipeTrie')
const { knex } = require('./common/config')
const { Recipe_Ingredient, Ingredient, Recipe } = require('./common/models')

const Trie = new RT();

async function init() {
  console.time('initialize trie')
  const recipe_ingedients = await Recipe_Ingredient.all();
  const recipes = recipe_ingedients.reduce((map, { recipe, ingredient }) => {
    if (map.has(recipe)) {
      const ingredients = map.get(recipe);
      map.set(recipe, ingredients.concat(ingredient));
    } else {
      map.set(recipe, [ingredient]);
    }
    return map;
  }, new Map());

  for (let [url, ingredients] of recipes.entries()) {
    Trie.addRecipe(url, ingredients)
  }
  console.timeEnd('initialize trie')
  console.log(`Trie contains ${recipes.size} recipes`)
  console.log(
    'Trie contains the page Ive been looking for',
    recipes.has('https://www.allrecipes.com/recipe/228293/curry-stand-chicken-tikka-masala-sauce/')
  )

  const app = express();

  app.get('/ingredients', async (req, res) => {
    const ingredients = await Ingredient.all()
    return res.json(JSON.stringify(ingredients))
  })

  app.get('/search', async (req, res) => {
    let ingredients = req.query.ingredient
    if (!ingredients) {
      return res.json(JSON.stringify([]))
    }
    if (!Array.isArray(ingredients)) {
      ingredients = [ingredients]
    }
    
    const urls = Trie.findRecipesByIngredients(ingredients)
    const recipes = await knex('recipe').whereIn('url', urls)
    // console.log({ recipes })
    return res.json(JSON.stringify(recipes))
  })

  app.post('/rename', async (req, res) => {
    const { oldName, newName } = req.query
    // console.log({ oldName, newName })
    const success = await Recipe_Ingredient.renameIngredient(oldName, newName)
    if (success) {
      res.status(200).end()
    } else {
      res.status(500).end()
    }
  })

  app.delete('/item/:item', async (req, res, next) => {
    try {
      const { item } = req.params;
      await Recipe_Ingredient.deleteIngredient(item);
      res.status(200).end()
    }
    catch (err) {
      res.status(500).end()
      next(err)
    }
  })

  app.listen(3000, () => {
    console.log(`api server is now listening on port 3000`)
  })

}

init();


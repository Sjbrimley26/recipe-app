const Queue = require("./Queue");

function Node (ingredient) {
  this.ingredient = ingredient;
  this.children = new Map();
  this.recipes = [];
}


function Trie () {
  this.root = new Node(null);
}

/**
 * Inserts a recipe(and its ingredients) into the trie.
 * @name Trie#addRecipe
 * @param {string} url the address of the recipe's page.
 * @param {string[]} ingredients an array of items the recipe is composed of.
 */
Trie.prototype.addRecipe = function (url, ingredients) {
  const q = new Queue();
  if (ingredients.length === 0) {
    throw new Error("no ingredients!")
  }
  ingredients.sort().forEach(i => q.push(i));
  let currentNode = this.root;
  while (!q.isEmpty()) {
    let ing = q.pop();
    if (currentNode.children.has(ing)) {
      currentNode = currentNode.children.get(ing);
    } else {
      const node = new Node(ing);
      currentNode.children.set(ing, node);
      currentNode = node;
    }
  }
  currentNode.recipes.push(url);
}

/**
 * @name Trie#findRecipesByIngredients
 * @param {string[]} ingredients an array of items that you have.
 * @returns {string[]} should be an array of all the recipes you have enough ingredients for.
 */
Trie.prototype.findRecipesByIngredients = function (ingredients) {
  let recipes = [];
  ingredients.sort();
  for (let i = 0; i < ingredients.length - 1; i++) {
    recipes = this._recursiveFind(ingredients.slice(i), recipes);
  }
  return recipes;
}

Trie.prototype._recursiveFind = function (ingredients, foundRecipes = []) {
  // assumes ingredients have already been sorted.
  const q = new Queue();
  ingredients.forEach(i => q.push(i));
  let currentNode = this.root;
  while (!q.isEmpty()) {
    let ing = q.pop();
    if (!currentNode.children.has(ing)) {
      break;
    }
    foundRecipes = foundRecipes.concat(currentNode.recipes);
    currentNode = currentNode.children.get(ing);
  }
  return foundRecipes.concat(currentNode.recipes);
}

Trie.prototype.print = function () {
  let q = new Queue();
  q.push(this.root);
  while (!q.isEmpty()) {
    const { children, ingredient, recipes } = q.pop();
    [...children.values()].forEach(i => q.push(i));
    console.log(ingredient, recipes)
  }
}

module.exports = Trie;

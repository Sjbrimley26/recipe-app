const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const { promisify } = require('util')

const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);

const BASE_URL = 'https://www.allrecipes.com/recipes/';
const PAGED_URL = BASE_URL + '?page='; // max page is somewhere in the range of 3500  - 3600


function errorHandler(err) {
  console.error(err.stack);
  console.error(err.message);
}

const pageGenerator = (function* () {
  yield axios.get(BASE_URL);
  for (let i = 2; i < 41; i++) { // gonna stop at 5 for now
    yield axios.get(PAGED_URL + i);
  }
})()


const Crawler = require("./Crawler");
const Parser = require("./Parser");
const RecipeTrie = require("./RecipeTrie");

const crawler = new Crawler({
  maxCallsPerMinute: 200,
  maxNumberofConnections: 5
})

const parser = new Parser()

const IngredientDB = new Set();

const RecipeDB = new RecipeTrie();

let duplicates = 0;
let urlsFound = 0;

crawler.on("crawled", function(url, $) {
  // console.log(`parsing ${url}`);
  const ingredients = parser.parse($);
  const items = []; // ingredients minus the quantities
  ingredients.forEach(([qty, ing]) => {
    items.push(ing);
    if (IngredientDB.has(ing)) {
      duplicates++;
      return;
    }
    IngredientDB.add(ing);
  })

  RecipeDB.addRecipe(url, items);
})

crawler.on("error", errorHandler)

const st = Date.now()

let completion = 4;

crawler.on("idle", async function () {
  // idle is fired when the crawler's queue is empty and it is no longer waiting on any responses.
  // console.log('crawler idle, fetching another page');
  console.log(`${completion}% done.`);
  completion += 4;
  try {
    const nextPage = await pageGenerator.next().value;
    if (!nextPage) {
      // CRAWL COMPLETE
      // DEV LOGS
      
      console.log(`${urlsFound} recipes parsed. ${IngredientDB.size} unique ingredients found with ${duplicates} duplicates`)
      Array.from(IngredientDB).sort().forEach(i => console.log(i));
      // RecipeDB.print();
      console.log(`parsing completed in ${(Date.now() - st) / 1000} seconds`);
      
      return process.exit(0);
    }
    const urls = parseUrlsFromRecipesPage(nextPage);
    urls.forEach(url => crawler.enqueue(url));
  } catch (err) {
    console.error('error fetching next page');
    errorHandler(err);
  }
})

crawler.on("empty", function (x) {
  // empty is fired when the crawler's queue has been depleted.
  // console.log(`empty, ${x} connections still open`)
})

// crawler.on('waiting', _ => console.log('rate limited'))

const main = async () => {
  console.log('beginning crawl...');
  const firstPage = await pageGenerator.next().value;
  const urls = parseUrlsFromRecipesPage(firstPage);
  urls.forEach(url => crawler.enqueue(url));
  // the crawler has to get loaded up once to get started and then the 
  // pageGenerator refills the queue whenever it fires the 'idle' event
}

main().catch(errorHandler)

function flatten (a, v) {
  return a.concat(v);
}

function parseUrlsFromRecipesPage (res) {
  const body = res.data;
  const $ = cheerio.load(body);
  const articles = $('a.fixed-recipe-card__title-link');
  const urls = [];
  articles.each(function (i, element) {
    const href = $(this).attr('href');
    urls.push(href);
  })
  // console.log('urls found on page:', urls.length);
  urlsFound += urls.length;
  return urls;
}
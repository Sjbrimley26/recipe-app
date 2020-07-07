require('dotenv').config()
if (process.env.MODE === 'PAUSED') {
  return process.exit(0);
}
const axios = require('axios')
const cheerio = require('cheerio')
const Crawler = require("./Crawler")
const Parser = require("./Parser")
const { Recipe, Ingredient, Recipe_Ingredient, Store } = require('./common/models')
const { knex } = require('./common/config');

const sum = arr => (arr.reduce((total, val) => total + val)).toFixed(2)

const mean = arr => (sum(arr) / arr.length).toFixed(2)

const minutesAndSeconds = milliseconds => {
  const seconds = milliseconds / 1000;
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return `${minutes} minutes ${secs} seconds`;
}

/*
  TODO:
    Right now when you stop and re-start the crawler, it attempts to grab recipes from the last 
    read page (so as not to avoid missing any), however this causes a bunch of attempted duplicate
    insertions as it begins.
    The other thing I'm worried about is that stopping in the middle of a crawl with cause a recipe
    to be saved with only some of its ingredients mapped to it. some sort of checksum?
    I don't really know what a checksum is haha.
*/

const parser = new Parser()

const BASE_URL = 'https://www.allrecipes.com/'
const PAGED_URL = BASE_URL + '?page=' // max page is somewhere in the range of 3500  - 3600

function errorHandler(err) {
  console.error(err.stack)
  console.error(err.message)
}

const laps = [];

async function init() {
  try  {
    let crawlInProgress = await Store.has('latest_read_page');
    let currentPage = BASE_URL;
    if (crawlInProgress) {
      currentPage = await Store.get('latest_read_page');
    }
    const dbChecks = await Promise.all([ Ingredient.all(), Recipe.all() ])
    const existingIngredients = dbChecks[0].map(i => i.item)
    const alreadyParsedUrls = dbChecks[1].map(i => i.url)
    let recipesParsed = alreadyParsedUrls.length;
    
    const dups = new Set()
    existingIngredients.forEach(i => dups.add(i))

    const dupRecipes = new Set()
    alreadyParsedUrls.forEach(i => dupRecipes.add(i))
    const dupChecker = url => !dupRecipes.has(url)

    const crawler = new Crawler({
      maxCallsPerMinute: 120,
      maxNumberofConnections: 10,
      filter: dupChecker
    })

    let timer = Date.now();

    crawler.on("crawled", async function (url, $) {
      if (dupRecipes.has(url)) return console.log('skipping dup -- should never see this haha');
      // console.log(`parsing ${url}`);
      dupRecipes.add(url);
      const { ingredients, description, image, title } = parser.parse($);
      if (ingredients.length == 0) return console.log('no ingredients found');
      // console.log(`unto the next step`)
      const items = []; // ingredients minus the quantities
      ingredients.forEach(async ([qty, ing]) => {
        items.push(ing);
        if (dups.has(ing)) {
          return;
        } 
        dups.add(ing);
        await Ingredient.create(ing)  
      })

      const created = await Recipe.create({
        url,
        image,
        description,
        title
      })

      await Recipe_Ingredient.create(url, items)
      
      if (created) {
        recipesParsed++;
        await Store.set('latest_read_page', url);
      }
      let currentTime = Date.now();
      let elapsed = currentTime - timer;
      laps.push(elapsed)
      let avg = minutesAndSeconds(mean(laps))
      let total = minutesAndSeconds(sum(laps))
      console.log('url parsed', {
        page: minutesAndSeconds(elapsed),
        average: avg,
        total: total,
        page_count: laps.length
      })
      timer = Date.now()
    })

    crawler.on("error", e => {
      console.error('error occured during crawl')
      errorHandler(e)
    })

    console.log(`beginning crawl, starting with ${currentPage}`);

    crawler.recursiveScrape(currentPage)
  }
  catch (err) {
    console.error("error occured during crawler initialization")
    errorHandler(err)
    process.exit(-1)
  }
}

init();

function parseUrlsFromRecipesPage(res) {
  const body = res.data;
  const $ = cheerio.load(body);
  const articles = $('a.fixed-recipe-card__title-link');
  const urls = [];
  articles.each(function (i, element) {
    const href = $(this).attr('href');
    urls.push(href);
  })
  // console.log('urls found on page:', urls.length);
  return urls;
}
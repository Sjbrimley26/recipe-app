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

const crawler = new Crawler({
  maxCallsPerMinute: 120,
  maxNumberofConnections: 5
})

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
    let currentPage = 1;
    if (crawlInProgress) {
      currentPage = await Store.get('latest_read_page');
    }
    const dbChecks = await Promise.all([ Ingredient.all(), Recipe.all() ])
    const existingIngredients = dbChecks[0].map(i => i.item)
    const alreadyParsedUrls = dbChecks[1].map(i => i.url)
    let recipesParsed = alreadyParsedUrls.length;
    const dups = new Set()
    existingIngredients.forEach(i => dups.add(i))

    let timer = Date.now();

    crawler.on("crawled", async function (url, $) {
      const { ingredients, description, image, title } = parser.parse($);
      if (ingredients.length == 0) return;
      console.log(`parsing ${url}!`)
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

    /*
    crawler.on("idle", async function () {
      const elapsed = (Date.now() - timer) / 1000;
      laps.push(elapsed);
      timer = Date.now();
      // idle is fired when the crawler's queue is empty and it is no longer waiting on any responses.
      console.log(`page parsed in ${elapsed} seconds
pages parsed: ${currentPage - 1}
recipes parsed: ${recipesParsed}
average parse time: ${mean(laps)} seconds
total time: ${minutesAndSeconds(sum(laps))}`)
      try {
        const nextPage = await axios.get(PAGED_URL + currentPage);
        await Store.set('latest_read_page', currentPage);
        currentPage++;
        if (currentPage === 3501) {
          console.log('parsing complete')
          await knex.destroy();
          process.exit(0)
        }
        const urls = parseUrlsFromRecipesPage(nextPage);
        urls.filter(u => !alreadyParsedUrls.includes(u)).forEach(url => crawler.enqueue(url));
      } catch (err) {
        console.error('error fetching next page');
        errorHandler(err);
      }
    })
    */

    crawler.on("error", e => {
      console.error('error occured during crawl')
      errorHandler(e)
    })

    console.log('beginning crawl')

    /*
    let firstPage = BASE_URL;
    currentPage++;
    if (currentPage !== 2) {
      firstPage = PAGED_URL + currentPage;
    }
    firstPage = await axios.get(firstPage);
    const urls = parseUrlsFromRecipesPage(firstPage);
    urls.filter(u => !alreadyParsedUrls.includes(u)).forEach(url => crawler.enqueue(url));
    */
   crawler.recursiveScrape(BASE_URL)
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
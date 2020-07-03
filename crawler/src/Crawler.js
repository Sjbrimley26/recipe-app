const Queue = require("./Queue");
const cheerio = require("cheerio");
const axios = require("axios");
const EventEmitter = require("events").EventEmitter;

function Crawler ({ 
  maxNumberofConnections,
  maxCallsPerMinute,
  filter
} = {
  maxNumberofConnections: 1,
  maxCallsPerMinute: 30,
  filter: _ => true
}) {
  EventEmitter.call(this);
  this._maxNumberofConnections = maxNumberofConnections;
  this._maxCallsPerMinute = maxCallsPerMinute;
  this._queue = new Queue();
  this._currentConnections = 0;
  this._crawledRecently = 0;
  this.filter = filter;

  this.on("crawled", function () {
    if (!this._queue.isEmpty() && this._currentConnections < this._maxNumberofConnections) {
      this._crawl(this._queue.pop());
      return;
    }
    if (this._queue.isEmpty() && this._currentConnections === 0) {
      this.emit("idle");
    }
    if (this._queue.isEmpty()) {
      this.emit("empty", this._currentConnections);
    }
  })

  setInterval(() => {
    this._crawledRecently = 0;
  }, 60000)
}

Crawler.prototype = Object.create(EventEmitter.prototype);

Crawler.prototype.enqueue = function (url) {
  if (this._currentConnections < this._maxNumberofConnections) {
    this._crawl(url);
    return;
  }
  this._queue.push(url);
}

Crawler.prototype._crawl = async function (url) {
  if (this._crawledRecently >= this._maxCallsPerMinute) {
    this.emit('waiting');
    // delay crawl
    setTimeout(() => {
      this._crawl(url);
    }, 3000);
    return;
  }
  // console.log(`crawling ${url}`);
  this._crawledRecently += 1;
  this._currentConnections += 1;
  try {
    const res = await axios.get(url);
    this._currentConnections -= 1;
    this.emit("crawled", url, cheerio.load(res.data));
  }
  catch (err) {
    console.error(`error crawling ${url}`);
    this.emit("error", err);
    this._currentConnections -= 1;
    this.enqueue(url);
  }
}

const internalLinkFilter = baseUrl => url => url.includes(baseUrl) // filter outbound links

Crawler.prototype.recursiveScrape = async function (baseUrl) {
  const searched = new Set()
  const homepage = await axios.get('https://www.allrecipes.com/?page=2')
  const $ = cheerio.load(homepage.data)

  const enqueueBatch = $ => {
    const links =
      $('a')
      .toArray()
      .map(a => a.attribs.href)
      .filter(Boolean)
      .filter(internalLinkFilter(baseUrl))
      .filter(url => url.includes('/recipe')) // PROJECT SPECIFIC

    // console.log(links.length, 'links queued')

    links.forEach(url => {
      if (searched.has(url)) return;
      this.enqueue(url)
      searched.add(url)
    })
  }

  enqueueBatch($)

  this.on('crawled', async (url, $) => {
    enqueueBatch($)
  })
}

module.exports = Crawler;

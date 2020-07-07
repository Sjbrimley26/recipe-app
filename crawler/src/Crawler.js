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

Crawler.prototype.recursiveScrape = async function (url) {
  const ignore = [
    'mailto:',
    'sms:',
    'facebook',
    'twitter',
    'pinterest',
    'reviews'
  ];

  const ignoreFilter = url => {
    for (let bad of ignore) {
      if (url.includes(bad)) {
        return false;
      }
    }
    return true;
  }
  
  const Url = new URL(url)
  const baseUrl = Url.hostname;
  const searched = new Set()
  const homepage = await axios.get(url)
  const $ = cheerio.load(homepage.data)

  const enqueueBatch = $ => {
    const links =
      $('a')
      .toArray()
      .map(a => a.attribs.href)
      .filter(Boolean)
      .filter(this.filter)
      .filter(internalLinkFilter(baseUrl))
      .filter(ignoreFilter)
      .filter(url => url.includes('/recipe')) // PROJECT SPECIFIC

    const ogLen = this._queue.length;

    links.forEach(url => {
      if (searched.has(url)) return;
      this.enqueue(url)
      searched.add(url)
    })

    const qlen = this._queue.length;
    console.log(`${qlen - ogLen} links found`);
    console.log(`queue length: ${qlen}`);
    if (qlen == 0) {
      axios.get('https://' + baseUrl)
        .then(retry => enqueueBatch(cheerio.load(retry.data)))
        .catch(err => console.log('retry failed haha', err.message, err.stack))
    }
    // const { heapUsed } = process.memoryUsage();
    // console.log({ heapUsed });
    
  }

  enqueueBatch($)

  this.on('crawled', async (url, $) => {
    enqueueBatch($)
  })
}

module.exports = Crawler;

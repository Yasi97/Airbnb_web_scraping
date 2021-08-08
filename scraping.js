const puppeteer = require("puppeteer");
const puppeteerc = require("puppeteer-core");
const fs = require("fs/promises");

const Express = require("express");
const BodyParser = require("body-parser");
const EventEmmiter = require("events");
const emmiter = new EventEmmiter();
EventEmmiter.defaultMaxListeners = 200;

const Airbnb = require("./details");

const app = Express();

app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

const dbConfig = require("./databaseUrl.js");
const mongoose = require("mongoose");
mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("successfully connected to Airbnb database");
    //console.log(getData)
  })
  .catch((err) => {
    console.log("not connected", err);
    process.exit();
  });

async function getPageData(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  await page.goto(url);

  await page.waitForSelector("._1n81at5", { waitUntil: "load", timeout: 0 });
  const name = await page.$eval("._1n81at5", (name) => name.textContent);
  //await page.waitForSelector('._fardlj', { waitUntil: 'load', timeout: 0 });
  //await page.waitForSelector('._1ne5r4rt', { waitUntil: 'load', timeout: 0 });
  //const ratings = await page.$eval("._fardlj ._1ne5r4rt",ratings =>ratings.textContent);
  await page.waitForSelector("._1qf7wt4w", { waitUntil: "load", timeout: 0 });
  const no_of_ratings = await page.$eval(
    "._1qf7wt4w",
    (no_of_ratings) => no_of_ratings.textContent
  );

  const obj = {
    title: name,
    rating: 4,
    No_Of_ratting: no_of_ratings,
  };
  return obj;
}

function start(pagesToScrape) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!pagesToScrape) {
        pagesToScrape = 1;
      }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);

      await page.goto("https://www.airbnb.com/");

      await page.waitForSelector("._1slbw8s");
      const links = await page.$$eval("._1slbw8s a", (allAs) =>
        allAs.map((a) => a.href)
      );

      //console.log(links);

      const scrapeData = [];

      for (let url of links) {
        await page.goto(url);
        await page.waitForSelector("._mm360j", {
          waitUntil: "load",
          timeout: 0,
        });
        const link1 = await page.$$eval("a._mm360j", (allAs) =>
          allAs.map((a) => a.href)
        );
        //console.log(link1);

        for (let url1 of link1) {
          await page.goto(url1);
          const data = await getPageData(url1, page);
          console.log(data);
          //scrapeData.push(data);

          const air = new Airbnb(data);
          air.save();
        }
      }

      //console.log(scrapeData);
      //console.log(dataObj)
      await browser.close();
    } catch (e) {
      return reject(e);
    }
  });
}

start(5).then(console.log).catch(console.error);

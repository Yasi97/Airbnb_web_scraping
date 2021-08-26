const puppeteer = require("puppeteer");
//const fs = require("fs/promises");
const Express = require("express");
const BodyParser = require("body-parser");
const prompt = require("prompt-sync")();
const EventEmmiter = require("events");
const emmiter = new EventEmmiter();
EventEmmiter.defaultMaxListeners = 200;
const Airbnb = require("./server");

const app = Express();

app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

const dbConfig = require("./dbUrl.js");
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

const name_of_host = prompt("Host name:");

async function getPageData(url, page) {
  const browser = await puppeteer.launch({ headless: true });
  //const page = await browser.newPage();
  var testId = 0;

  await page.goto(url.urls);
  await page.setDefaultNavigationTimeout(0);

  await page.waitForSelector("h2._14i3z6h", {
    waitUntil: "load",
    timeout: 0,
  });

  const hostNames = await page.$$eval("h2._14i3z6h", (options) =>
    options.map((option) => option.textContent)
  );

  //console.log(host);
  var host = "";

  var hName = hostNames[0];
  var b = hName.split(" ");
  if (b[0] == "meet") {
    var c = hName.split("Host, ");
    host = c[1];
  } else {
    var c = hName.split("hosted by");
    var e = c.length;
    var d = c[e - 1].split("");
    // console.log(d)
    for (let i = 1; i < d.length; i++) {
      host = host + d[i];
    }
  }

  const ab = [];
  if (name_of_host == host) {
    await page.waitForSelector("._fecoyn4");
    const name = await page.$$eval("h1._fecoyn4", (options) =>
      options.map((option) => option.textContent)
    );

    console.log("searching...");

    //console.log(name);
    //console.log(host);

    try {
      await page.waitForSelector(
        "#site-content > div > div:nth-child(1) > div:nth-child(4) > div > div > div > div:nth-child(2) > div:nth-child(2) > div > div.ciubx2o",
        {
          waitUntil: "load",
          timeout: 50000,
        }
      );
    } catch (err) {
      console.log("error");
    }
    console.log("*");

    const ratings = await page.evaluate(() => {
      try {
        return Array.from(
          document.querySelectorAll(
            "div.ciubx2o div._1s11ltsf div._bgq2leu span._4oybiu"
          )
        ).map((x) => x.textContent);
      } catch (err) {
        console.log("error");
      }
    });

    try {
      await page.waitForSelector("div._1y2qkg", {
        waitUntil: "load",
        timeout: 50000,
      });
    } catch (err) {
      console.log("error");
    }
    console.log("*");

    const policy_NO = await page.evaluate(() => {
      try {
        return Array.from(document.querySelectorAll("div._1y2qkg")).map(
          (x) => x.textContent
        );
      } catch (err) {
        console.log("error");
      }
    });

    const obj = {
      hostName: host,
      hotelName: name[0],
      cleanliness_ratings: ratings[0],
      accuracy_ratings: ratings[1],
      checkin_ratings: ratings[2],
      value_ratings: ratings[3],
      location_ratings: ratings[4],
      communication_ratings: ratings[5],
      policy_NO: policy_NO[0],
      bedrooms: url.bedrooms,
      beds: url.beds,
      bath: url.bath,
    };
    console.log(obj);
    fill = new Airbnb(obj);
    fill.save();
    //ab.push(obj);
    //console.log(ab);
  }
  //return ab;
}

async function getLinks() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(
    "https://www.airbnb.com/s/Portugal/homes?tab_id=home_tab&refinement_paths%5B%5D=%2Fhomes&flexible_trip_dates%5B%5D=august&flexible_trip_dates%5B%5D=september&flexible_trip_lengths%5B%5D=weekend_trip&date_picker_type=calendar&query=Portugal&place_id=ChIJ1SZCvy0kMgsRQfBOHAlLuCo&source=structured_search_input_header&search_type=autocomplete_click"
  );
  await page.waitForSelector("a._wy1hs1");
  const links = await page.$$eval("a._wy1hs1", (allAs) =>
    allAs.map((a) => a.href)
  );

  await browser.close();
  console.log(links);

  return links;
}

async function getUrls() {
  const allLinks = await getLinks();
  const dataPath = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (let link of allLinks) {
    await page.goto(link);
    await page.waitForSelector("._mm360j");
    const urls = await page.$$eval("a._mm360j", (allAs) =>
      allAs.map((a) => a.href)
    );

    await page.waitForSelector("div._12oal24");
    const bedrooms = await page.$$eval(
      "div._12oal24 div:nth-child(3) span:nth-child(3)",
      (options) => options.map((option) => option.textContent)
    );

    await page.waitForSelector("div._12oal24");
    const beds = await page.$$eval(
      "div._12oal24 div:nth-child(3) span:nth-child(5)",
      (options) => options.map((option) => option.textContent)
    );

    await page.waitForSelector("div._12oal24");
    const bath = await page.$$eval(
      "div._12oal24 div:nth-child(3) span:nth-child(7)",
      (options) => options.map((option) => option.textContent)
    );

    for (let i = 0; i < 20; i++) {
      const res = bedrooms[i].replace(/\D/g, "");
      const res1 = beds[i].replace(/\D/g, "");
      const res2 = bath[i].replace(/\D/g, "");
      const obj = {
        urls: urls[i],
        bedrooms: res,
        beds: res1,
        bath: res2,
      };
      //console.log(obj);
      await dataPath.push(obj);
    }
  }

  //console.log(dataPath);
  await browser.close();
  return dataPath;
}

async function main() {
  const allUrls = await getUrls();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const scrapeData = [];

  for (let url of allUrls) {
    //console.log(url.urls);

    const data = await getPageData(url, page);
    //scrapeData.push(data);
    //console.log(data);

    // fill = new Airbnb(data);
    // fill.save();
  }

  console.log("sjxhjsb");
  //console.log(scrapeData);
  await browser.close();
}

main();

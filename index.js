const cheerio = require("cheerio");
const axios = require("axios");
var fs = require("fs");

async function start() {
  const baseURl = "https://davalegames.com/";

  const axiosResponse = await axios.request({
    method: "GET",
    url: baseURl,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    },
  });
  const groupUrls = [];
  const cheerioLoader = cheerio.load(axiosResponse.data);
  cheerioLoader(".home")
    .find(".nav-dropdown")
    .find("li")
    .each((index, element) => {
      const pageUrl = cheerioLoader(element).find("a").attr("href");
      if (pageUrl) groupUrls.push(pageUrl);
    });

  for (let i = 0; i < groupUrls.length; i++) {
    const url = groupUrls[i];
    performScraping(url);
  }
}

async function performScraping(url) {
  const axiosResponse = await axios.request({
    method: "GET",
    url: url,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    },
  });

  const urls = [];
  const cheerioLoader = cheerio.load(axiosResponse.data);
  cheerioLoader(".archive")
    .find(".image-fade_in_back")
    .each((index, element) => {
      const pageUrl = cheerioLoader(element).find("a").attr("href");
      urls.push(pageUrl);
    });

  createFolders(urls);
}
async function createFolders(urls) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(url);
    const axiosResponse = await axios.request({
      method: "GET",
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    });
    const cheerioLoader = cheerio.load(axiosResponse.data);
    let group = "";
    const mainBody = cheerioLoader(".product-template-default");

    mainBody
      .find(".woocommerce-breadcrumb")
      .find("a")
      .each((index, element) => {
        const text = cheerioLoader(element).text();
        if (index === 1) group = text;
      });

    const title = mainBody.find(".entry-title").text();

    var dir = "./Davale Games/" + group + "/" + title.slice(20, title.length);

    fs.mkdirSync(dir, { recursive: true });

    mainBody
      .find(".product-gallery")
      .find("img")
      .each((index, element) => {
        const imgUrl = cheerioLoader(element).attr("src");
        const splitURl = imgUrl.split("/");

        const fileName = splitURl[splitURl.length - 1];
        console.log(fileName);
        axios({
          method: "get",
          url: imgUrl,
          responseType: "stream",
        }).then(function (response) {
          response.data.pipe(fs.createWriteStream(dir + "/" + fileName));
        });
      });
  }
}

start();

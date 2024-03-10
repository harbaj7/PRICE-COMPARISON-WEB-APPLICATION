const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");
const GetSitemapLinks = require("get-sitemap-links").default;

const getDataTA = async () => {
  const result = await GetSitemapLinks(
    "https://www.trailappliances.com/media/sitemaps/bc_en.xml"
  );
  return result;
};
async function scrapeTrailAppliances() {
  const trailurls = await getDataTA();
  let mainurl =
    "https://www.trailappliances.com/whirlpool-white-4-4-cu-ft--top-load-washer-and-7-0-cu-ft--dryer-pkgl0063";
  const traildata = [];
  for (let i = 0; i < 1; i++) {
    let urlto = mainurl;
    console.log(urlto);
    try {
      const { data } = await axios({
        method: "GET",
        url: urlto,
      });
      const $ = cheerio.load(data);
      const trailItems = $(".productFullDetail-root-1OT");
      trailItems.each((key, val) => {
        console.log("hello");
        //console.log($(val).find(".productFullDetail-modelInfo-1Be").text());
      });
    } catch (err) {
      console.log(`Errors in this link`, urlto);
    }
  }
}
async function testing() {
  console.log("hello");
  scrapeTrailAppliances();
  //   console.log("%%%%%%%%%%%%%%");
  //   console.log(word);
  //   console.log(word.length);
  //setTimeout(() => console.log(word), 5000);
}
scrapeTrailAppliances();

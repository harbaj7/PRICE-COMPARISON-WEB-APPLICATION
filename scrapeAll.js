const scrapeTrailAppliances = require("./trail.js");
const scrapeHomeDepot = require("./homedepot.js");
const scrapeLowes = require("./lowes.js");
const scrapeCoast = require("./coastscrape.js");
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
}

async function scrapeAll(pool) {
    localStorage.setItem("isScraping", true);
    scrapeCoast(pool);
    scrapeHomeDepot(pool);
    scrapeLowes(pool);
    scrapeTrailAppliances(pool);
}

module.exports = scrapeAll;
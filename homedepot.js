const axios = require("axios");
const cheerio = require("cheerio");
const GetSitemapLinks = require("get-sitemap-links").default;
const { Pool } = require("pg");
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

// gets all sitemap links from home depot
const getDataHD = async () => {
  let newlinks = [
    "https://www.homedepot.ca/sitemap_brand_en.xml",
    "https://www.homedepot.ca/sitemap_content_en.sitemap.xml",
  ];
  let alllinks = [];
  for (let k = 0; k < 28; k++) {
    const result = await GetSitemapLinks(newlinks[k]);
    var nextlink =
      "https://www.homedepot.ca/sitemap_product_en." + (k + 1) + ".xml";
    newlinks.push(nextlink);
    alllinks.push(result);
  }
  return alllinks;
};

// only selects appliance related sites from all sitemap links
const filterForLinks = async () => {
  let allthelinks = await getDataHD();
  const merged = [].concat.apply([], allthelinks);
  const pattern = "appliance";
  let filteredlinks = [];
  for (let i = 0; i < merged.length; i++) {
    if (merged[i].includes(pattern)) {
      filteredlinks.push(merged[i]);
    }
  }
  return filteredlinks;
};

// gets model number
const getmodel = async (alink) => {
  let modelreplace;
  try {
    const { data } = await axios({
      method: "GET",
      url: alink,
    });
    const $ = cheerio.load(data);
    const prmodel = $(
      ".acl-pt--medium.acl-pb--small.hdca-product-nav__content-content-stacked-title"
    )
      .text()
      ?.trim();
    let modelsplit = prmodel.split("#")[1];
    modelreplace = modelsplit.replace("Store SKU", "");
  } catch (err) {
    //console.log("Model was not found", alink);
  }
  return modelreplace;
};
function timeout(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function scrapeHomeDepot(pool) {
  localStorage.setItem("isScrapingHD", true);
  homedepotStartingTime = new Date();

  const LinkVals = await filterForLinks();
  const newdata = [];
  const client = await pool.connect();

    for (let i = 0; i < LinkVals.length; i++) {
      let isError = false;
      let urlto = LinkVals[i];
      //console.log(urlto);
      try {
        const { data } = await axios({
          method: "GET",
          url: urlto,
        });
        const $ = cheerio.load(data);
        const listItems = $(
          ".acl-product-card__content.acl-product-card__content--has-compare.ng-star-inserted"
        );
        listItems.each(async (idx, el) => {
          const datarow = { Name: "", Price: "", Model: "" };
          let ulink = "https://www.homedepot.ca" + $(el).find("a").attr("href");
          datarow.Model = (await getmodel(ulink))?.trim();
          datarow.Name = $(el).find(".acl-product-card__main-info").text();
          let prices = $(el)
            .find(".acl-product-card__price")
            .text()
            ?.trim()
            .replace("Cents / each", "")
            .replace("Cents / box", "");
          if (prices !== "-" && prices !== "") {
            if (datarow.Model !== undefined) {
              datarow.Price = prices.split("And").slice(0, 2).join(".").trim();
              datarow.Price = datarow.Price.slice(1);
              datarow.Price = datarow.Price.replace(/,/g, '');
              newdata.push(datarow);
            }
          }
          // search the db to see if item exists already
          if(typeof datarow.Model != 'undefined' && typeof datarow.Price != 'undefined' && datarow.Model.length != 0 && datarow.Price.length != 0){
            try{
              client.query(`select * from items where modelnum = '${datarow.Model}';`, (error, result) => {
                string = 'Home Depot  ' + datarow.Model + ' '.repeat(Math.abs(35-datarow.Model.length)) + datarow.Price + ' '.repeat(Math.abs(10-datarow.Price.length));
                if(error){
                  console.log(error);
                }else if(typeof result == 'undefined'){
                  console.log("no response from pool (home depot)");
                } else if (result.rowCount === 0) {
                  
                } else {
                    // item in db, so update the values to most recent
                    console.log(string + "FOUND");
                    client.query(`UPDATE items SET phomedepot = ${datarow.Price} WHERE modelnum = '${datarow.Model}';`);
                }
              });

            } catch (e) {
              console.log("pool undefined (home depot)");
            }
          }
          
          });
      } catch (err) {
          isError = true;
          //console.log("Error from the following link", urlto);
      }
      if (!isError) {
        await timeout(7000);
      }    
    }
  
    localStorage.setItem("isScrapingHD", false);
    homedepotEndingTime = new Date();
    // insert scrape times to db
    try {
      const { data } = await axios({
        method: "GET",
        url: urlto,
      });
      const $ = cheerio.load(data);
      const listItems = $(
        ".acl-product-card__content.acl-product-card__content--has-compare.ng-star-inserted"
      );
      listItems.each(async (idx, el) => {
        const datarow = { Name: "", Price: "", Model: "" };
        let ulink = "https://www.homedepot.ca" + $(el).find("a").attr("href");
        datarow.Model = (await getmodel(ulink))?.trim();
        datarow.Name = $(el).find(".acl-product-card__main-info").text();
        let prices = $(el)
          .find(".acl-product-card__price")
          .text()
          ?.trim()
          .replace("Cents / each", "")
          .replace("Cents / box", "");
        if (prices !== "-" && prices !== "") {
          if (datarow.Model !== undefined) {
            datarow.Price = prices.split("And").slice(0, 2).join(".").trim();
            datarow.Price = datarow.Price.slice(1);
            datarow.Price = datarow.Price.replace(/,/g, "");
            newdata.push(datarow);
          }
        }
        // search the db to see if item exists already
        if (
          typeof datarow.Model != "undefined" &&
          typeof datarow.Price != "undefined"
        ) {
          try {
            client.query(
              `select * from items where modelnum = '${datarow.Model}';`,
              (error, result) => {
                string =
                  "Home Depot  " +
                  datarow.Model +
                  " ".repeat(35 - datarow.Model.length) +
                  datarow.Price +
                  " ".repeat(10 - datarow.Price.length);
                if (typeof result == "undefined") {
                  console.log("no response from pool (home depot)");
                } else if (result.rowCount === 0) {
                } else {
                  // item in db, so update the values to most recent
                  console.log(string + "FOUND");
                  client.query(
                    `UPDATE items SET phomedepot = ${datarow.Price} WHERE modelnum = '${datarow.Model}';`
                  );
                }
              }
            );
          } catch (e) {
            console.log("pool undefined (home depot)");
          }
        }
      });
    } catch (err) {
      isError = true;
      //console.log("Error from the following link", urlto);
    }
    if (!isError) {
      await timeout(7000);
    }
  

  homedepotEndingTime = new Date();
  // insert scrape times to db
  try {
    const client = await pool.connect();
    client.query(
      `insert into scrapeTimes values (null, null, '${homedepotStartingTime.toISOString()}', '${homedepotEndingTime.toISOString()}', null, null, null, null);`
    );
    client.release();
  } catch (err) {
    console.error(err);
  }
  return newdata;
}

module.exports = scrapeHomeDepot

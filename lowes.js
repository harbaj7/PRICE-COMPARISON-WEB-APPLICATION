const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const GetSitemapLinks = require("get-sitemap-links").default;
const { Pool } = require("pg");
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
  }

async function scrapeLowes(pool) {
    localStorage.setItem("isScrapingLowes", true);
    lowesStartingTime = new Date();

    //const LinkVals = await getData();
    let url = "https://www.lowes.ca/products?query=*%3A*&display=24&sort=lw_etl_store_effectiveprice_f%3Adesc&requireStoreInventory=false&page="
    const browser = await puppeteer.launch({
        'args' : [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });
    const [page] = await browser.pages();
    const client = await pool.connect();
    
    for (let i = 1; i < 13308; i++) {

        await page.goto(url + i, { waitUntil: 'networkidle0' });
        const data = await page.evaluate(() => document.querySelector('*').outerHTML);
        const $ = cheerio.load(data);
        const listItems = $(".card-product");

        try {
            listItems.each(async (idx, el) => {
                const datarow = { Price: "", Model: "" };
                datarow.Price = $(el).find(".price-actual")
                    .text()
                    .slice(1)
                    .replace(/,/g, '');
                datarow.Model = $(el).find(".product-labels")
                    .text()
                    .split("#")[2];

                if (typeof datarow.Model != 'undefined') {
                    datarow.Model = datarow.Model.slice(2);
                }

                if (typeof datarow.Model != 'undefined' && datarow.Price.includes('/') == false && typeof datarow.Price != 'undefined') {
                    //console.log(`select * from items where modelnum = '${datarow.Model}';`);

                    try {
                        client.query(`select * from items where modelnum = '${datarow.Model}';`, (error, result) => {
                            string = 'Lowes       ' + datarow.Model + ' '.repeat(Math.abs(35-datarow.Model.length)) + datarow.Price + ' '.repeat(Math.abs(10-datarow.Price.length));
                            if(error){
                                console.log(error)
                            } else if(typeof result == 'undefined'){
                                console.log("no response from pool (lowes)");
                              }
                            else if (result.rowCount === 0) {
                                //console.log(string + "not found");
                            } else {
                                console.log(string + "FOUND");
                                client.query(`UPDATE items SET plowes = ${datarow.Price} WHERE modelnum = '${datarow.Model}';`);
                            }
                        });
                    } catch (e) {
                        console.log("pool undefined (lowes)");
                    }
                    
                }
            });
        } catch (err) {

        }

    }

    await browser.close();

    lowesEndingTime = new Date();
    localStorage.setItem("isScrapingLowes", false);
    //insert scrape times to db
    try {
        const client = await pool.connect();
        client.query(
            `insert into scrapeTimes values (null, null, null, null, '${lowesStartingTime.toISOString()}', '${lowesEndingTime.toISOString()}', null, null);`
        );
        client.release();
    } catch (err) {
        console.error(err);
    }

}

module.exports = scrapeLowes;
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const GetSitemapLinks = require("get-sitemap-links").default;
const { Pool } = require("pg");
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
  }

var subdivisions = 2;

const getData = async () => {
    const result = await GetSitemapLinks(
        "https://www.trailappliances.com/media/sitemaps/bc_en.xml"
    );
    return result;
};

// start multiple processes of subdivide to scrape faster
async function scrapeTrailAppliances(pool) {
    const trailurls = await getData();
    trailurls.slice(20); // first 20 pages arent products
    for( let j = 0; j < subdivisions; j++){
        subdivide(pool, j, trailurls);
    }
}



// [url url url url url url url] [url url url url url url url] [url url url url url url url] 
// ^                             ^                             ^
// subdivision                   subdivision                   subdivision 
// split the work up to go faster at the expense of cpu and mem
async function subdivide(pool, index, trailurls) {

    if(index == 0){
        localStorage.setItem("isScrapingTrail", true);
        trailStartingTime = new Date();
    }
    

    const browser = await puppeteer.launch({
        'args' : [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });

    const [page] = await browser.pages();
    const client = await pool.connect();

    offset = parseInt(trailurls.length / subdivisions);

    for (let i = index*offset; i < (index+1)*offset; i++) {
        let urlto = trailurls[i];
        try {
            await page.goto(urlto, { waitUntil: 'networkidle0' });
            const data = await page.evaluate(() => document.querySelector('*').outerHTML);

            const $ = cheerio.load(data);
            modelnum = $("#skuActive").text();
            price = $(".productFullDetail-price-3VH")
                .text()
                .split('$')[1]
                .replace(/,/g, '');
            //console.log(modelnum + " " + price);


            //if (typeof modelnum != 'undefined' && price.includes('/') == false && typeof price != 'undefined' && modelnum != '' && price != '') {
            if(modelnum.length > 0 && price.length > 0){
                //console.log(`select * from items where modelnum = '${modelnum}';`);

                try {
                    client.query(`select * from items where modelnum = '${modelnum}';`, (error, result) => {
                        string = 'Trail       ' + modelnum + ' '.repeat(Math.abs(35-modelnum.length)) + price + ' '.repeat(Math.abs(10-price.length));
                        if(typeof result == 'undefined'){
                            console.log("no response from pool (trail)");
                            }
                        else if (result.rowCount === 0) {
                            //console.log(string + "not found");
                        } else {
                            console.log(string + "FOUND");
                            client.query(`UPDATE items SET ptrail = ${price} WHERE modelnum = '${modelnum}';`);
                        }
                    });
                } catch (e) {
                    console.log("pool undefined (trail)");
                }
                
            }
        } catch (err) {
            //console.log("Errors in this link: ", urlto);
            //console.log(`select * from items where modelnum = '${modelnum}';`);
        }
    }

    if(index == 0){
        localStorage.setItem("isScrapingTrail", false);
        trailEndingTime = new Date();
    }
    

    try {
        const client = await pool.connect();
        //console.log(coastStartingTime);
        client.query(
            `insert into scrapeTimes values (null, null, null, null, null, null, '${trailStartingTime.toISOString()}', '${trailEndingTime.toISOString()}');`
        );
        client.release();
    } catch (err) {
        console.error(err);
    }
}
module.exports = scrapeTrailAppliances;
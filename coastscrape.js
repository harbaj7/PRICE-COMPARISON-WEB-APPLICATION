const axios = require('axios')
const cheerio = require('cheerio');
const GetSitemapLinks = require("get-sitemap-links").default;
const { Pool } = require("pg");
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
  }

const getData = async () => {
    const result = await GetSitemapLinks(
        "https://www.coastappliances.ca/sitemap_collections_1.xml"
    );
    return result;
};

async function scrape(pool) {
    localStorage.setItem("isScrapingCoast", true);
    coastStartingTime = new Date();
    const client = await pool.connect();

    const alldata = await getData();
    const newdata = [];
    for (let j = 1; j < alldata.length; j++) {
        let urlto = alldata[j];
        try {
            const { data } = await axios({
                method: "GET",
                url: urlto,
            });
            const $ = cheerio.load(data);
            const myelem = $(".isp_product_info");
            //console.log(alldata.length);//449
            myelem.each((inx, ele) => {
                const datarow = { Name: "", Price: "", Model: "" };
                datarow.Name = $(ele).children("a").children("div").text().substring(0, 99);

                // get modelNum by finding the first '- ' from the end of the string
                for (i = datarow.Name.length - 1; i > 0; i--) {
                    if (datarow.Name[i] == ' ' && datarow.Name[i - 1] == '-') {
                        datarow.Model = datarow.Name.slice(-(datarow.Name.length - i - 1));
                        // delete model number from the name
                        datarow.Name = datarow.Name.substring(0, i - 2);
                        break;
                    }
                }

                datarow.Price =
                    $(ele)
                        .children(".isp_product_price_wrapper")
                        .children("span")
                        .text()
                        .trim() / 100;
                newdata.push(datarow);

                // search the db to see if item exists already
                if(typeof datarow.Model != 'undefined' && typeof datarow.Price != 'undefined'){
                    try {
                        client.query(`select * from items where modelnum = '${datarow.Model}';`, (error, result) => {
                            //console.log(result);
                            if (typeof result == 'undefined'){
                                console.log("no response from pool (coast)");
                            }
                            else if (result.rowCount === 0) {
                                //console.log("not found, adding " + datarow.Model);
                                // item not in db, so add it to the db
                                client.query(`insert into items values ('${datarow.Model}', '${datarow.Name}', ${datarow.Price}, 0, 0, 0);`, (err, result) => {
                                    //console.log(result);
                                });
                            } else {
                                // item in db, so update the values to most recent
                                //console.log("found, updating " + datarow.Model);
                                client.query(`UPDATE items SET name = '${datarow.Name}', pcoast = ${datarow.Price} WHERE modelnum = '${datarow.Model}';`);
                            }
                        });
                    } catch (e) {
                        console.log("pool undefined (coast)");
                    }
                }
                
                

            });
        } catch (err) {
            //console.log(err);
        }
    }

    localStorage.setItem("isScrapingCoast", false);
    coastEndingTime = new Date();
    // instert starting and ending scrape times to db, temporary implementation.
    try {
        const client = await pool.connect();
        //console.log(coastStartingTime);
        client.query(
            `insert into scrapeTimes values ('${coastStartingTime.toISOString()}', '${coastEndingTime.toISOString()}', null, null, null, null, null, null);`
        );
        client.release();
    } catch (err) {
        console.error(err);
    }
};
module.exports = scrape;
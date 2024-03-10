const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const flash = require("express-flash");
const session = require('express-session');
const passport = require("passport");
const methodOverride = require("method-override");
const initializePassport = require("./passport-config");
const scrapeAll = require("./scrapeAll.js");

const PORT = process.env.PORT || 5000;

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

localStorage.setItem("isScrapingCoast", false);
localStorage.setItem("isScrapingHD", false);
localStorage.setItem("isScrapingLowes", false);
localStorage.setItem("isScrapingTrail", false);

localStorage.setItem("scrapingFrequency", 12);
autoScrapeID = null;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "data.csv",
  header: [
    { id: "modelNum", title: "Model Number" },
    { id: "name", title: "Name" },
    { id: "pCoast", title: "Coast Appliances Price" },
    { id: "pHomeDepot", title: "Home Depot Price" },
    { id: "pLowes", title: "Lowes Price" },
    { id: "pTrail", title: "Trail Appliaces Price" },
  ],
});

initializePassport(
  passport,
  (username) => {
    if (username === "admin") {
      return username;
    } else {
      return undefined;
    }
  },
  (password) => {
    if (password === "password") {
      return password;
    } else {
      return undefined;
    }
  }
);

app = express();
//understand json
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(flash());
app.use(
  session({
    secret: "tree",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }, //1day
  })
);
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");

app.get("/", checkAuthenticated, (req, res) => {
  var itemQuery = `select * from items where modelnum='abc'`;
  pool.query(itemQuery, (error, result) => {
    if (error) res.send(error);
    var results = { results: result ? result.rows : null };
    res.render("Landing.ejs", results);
  });
});

app.post("/scrape", checkAuthenticated, (req, res) => {
  lss = new Date();
  localStorage.setItem('lastScrapeStarted', lss);
  scrapeAll(pool);
  var itemQuery = `select * from items`;
  pool.query(itemQuery, (error, result) => {
    if (error) res.send(error);
    var results = { results: result ? result.rows : null };
    console.log("Starting scrape");
    res.render("Landing.ejs", results);
  });
});

// automatic scrape
function setAutoScrape() {
  autoScrapeID = setInterval(function () {
    let lss = localStorage.getItem("lastScrapeStarted");
    let freq = localStorage.getItem("scrapingFrequency");
    let now = new Date();
    let isScrapingCoast = localStorage.getItem("isScrapingCoast");
    let isScrapingHD    = localStorage.getItem("isScrapingHD"   );
    let isScrapingLowes = localStorage.getItem("isScrapingLowes");
    let isScrapingTrail = localStorage.getItem("isScrapingTrail");
    
    if ((now.valueOf() - lss.valueOf() > freq * 3600000) && isScrapingCoast == false && isScrapingHD == false && isScrapingLowes == false & isScrapingTrail == false) {
      scrapeAll(pool);
      console.log("Starting automatic scrape");
    }
  }, 60000);
}


app.post("/frequency", checkAuthenticated, (req, res) => {
  localStorage.setItem("scrapingFrequency", req.body.f_freq);

  // scrape automatically (check every min if a scrape should start)
  if (autoScrapeID != null) {
    clearInterval(autoScrapeID);
  }

  setAutoScrape();

  res.render("Options.ejs");
});

app.post("/downloadAll", checkAuthenticated, (req, res) => {
  var itemQuery = `select * from items`;
  pool.query(itemQuery, (error, result) => {
    if (error) res.send(error);
    //var results = { results: result ? result.rows : null };

    records = [];
    i = 0;

    result.rows.forEach(async function (r) {
      records[i] = {
        modelNum: r.modelnum,
        name: r.name,
        pCoast: r.pcoast,
        pHomeDepot: r.phomedepot,
        pLowes: r.plowes,
        pTrail: r.ptrail,
      };
      i += 1;
    });

    csvWriter.writeRecords(records).then(() => {
      console.log("...Done");
      res.download("data.csv");
    });
  });
});

app.post(
  "/Login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/Login",
    failureFlash: true,
  })
);

app.get("/Login", checkNotAuthenticated, (req, res) => {
  res.render("Login.ejs");
});

app.get("/options", checkAuthenticated, (req, res) => {
  res.render("Options.ejs");
});

app.get("/scrapelog", checkAuthenticated, (req, res) => {
    var itemQuery = `select * from scrapetimes`;
    pool.query(itemQuery, (error, result) => {
        if (error) res.send(error);
        var results = { results: result ? result.rows : null };
        res.render("ScrapeLog.ejs", results);
    });
});

// Shows all items in database
app.get("/show", checkAuthenticated, async (req, res) => {
  var itemQuery = `select * from items where phomedepot != 0 or plowes !=0;`;
  pool.query(itemQuery, (error, result) => {
    if (error) res.send(error);
    var results = { results: result ? result.rows : null };
    res.render("Landing.ejs", results);
  });
});


app.post("/search", checkAuthenticated, async (req, res) => {
  try {
    const client = await pool.connect();
    var itemQuery = `SELECT * FROM items WHERE modelnum = '${req.body.f_modelNum}' OR position('${req.body.f_modelNum.toLowerCase()}' in lower(name)) > 0;`;
    const result = await client.query(itemQuery);
    var results = { results: result ? result.rows : null };
    res.render("Landing.ejs", results);
    client.release();
  } catch (error) {
    res.send(error);
  }
});

app.delete("/logout", (req, res) => {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/Login");
  });
});

// Check if user is logged in
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/Login");
}

//Will redirect logged in user back to landing page to prevent logging in again
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

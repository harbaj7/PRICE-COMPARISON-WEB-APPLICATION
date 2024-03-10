const LocalStrategy = require("passport-local").Strategy;
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
// passport functionality stored here instead of index.js for easier reading.
function initialize(passport, getUserName, getUserPassword) {
  const authenticateUser = async (username, password, done) => {
    const user = getUserName(username);
    const pass = getUserPassword(password);
    try {
      const exists = await pool.query(`SELECT * FROM usr WHERE uid='${user}'`);
      if (exists.rows != 0) {
        // if user exists just move on
      } else {
        return done(null, false, {
          message: "No user exists with that username",
        });
      }
    } catch (e) {
      return done(e);
    }
    try {
      const exists = await pool.query(
        `SELECT * FROM usr WHERE uid='${user}' AND upassword='${pass}'`
      );
      if (exists.rows != 0) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };
  passport.use(new LocalStrategy(authenticateUser));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
}

module.exports = initialize;

require("dotenv").config();

const user = process.env.PGUSER;
const pass = process.env.PGPASSWORD;
const host = process.env.PGHOST;
const dbname = process.env.PGDATABASE;

// CONNECT

const connectionString = `postgres://${user}:${pass}@${host}:5432/${dbname}`;

const config = {
  client: "pg",
  connection: connectionString
};

const knex = require("knex")(config);

module.exports = {
  config,
  connectionString,
  knex
};
require("dotenv").config();

const { SQL_USER, SQL_PASSWORD, SQL_DATABASE, SQL_SERVER, SQL_PORT } =
  process.env;

const dbconfig = {
  user: SQL_USER,
  password: SQL_PASSWORD,
  server: SQL_SERVER,
  database: SQL_DATABASE,
  port: parseInt(SQL_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true,
  },
};

module.exports = dbconfig;

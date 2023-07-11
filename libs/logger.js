const { createLogger, format, transports } = require("winston");
const { combine, colorize, timestamp, printf } = format;
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const MODE = process.env.MODE || "development";
const LEVEL = MODE === "development" ? "debug" : "info";
const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const Filename = path.join(logDir, "result.log");

const logger = createLogger({
  level: LEVEL,
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf((info) => {
      let { timestamp, level, message } = info;
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      level: "debug",
      format: combine(
        colorize(),
        printf((info) => {
          let { timestamp, level, message } = info;
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    }),
    new transports.File({ filename: Filename }),
  ],
});

module.exports = logger;

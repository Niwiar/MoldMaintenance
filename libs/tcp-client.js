const Net = require("net");
const Domain = require("domain");
const logger = require("./logger");


const sendCommand = (Host, Port, data) => {
  const d = Domain.create();
  d.on("error", (err) => {
    logger.warn(`${err.message}`);
  });

  d.run(() => {
    const client = Net.connect(Port, Host, () => {
      // client.setEncoding('ascii')
      // client.setKeepAlive(true);
      const address = client.address();
      let { port } = address;
      logger.verbose(`Connect Server on ${port}`);

      client.write(data);

      client.on("data", (chunk) => {
        console.log(chunk);

        client.end();
      });

      client.on("end", () => {
        logger.verbose("Disconnected");
      });
    });
  });
};

module.exports = sendCommand;

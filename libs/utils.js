const encrypt = (data) => Buffer.from(data).toString("base64");
const decrypt = (data) => Buffer.from(data, "base64").toString("ascii");

module.exports = {
  encrypt,
  decrypt,
};

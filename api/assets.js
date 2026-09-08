const { ASSETS } = require("./_lib");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ assets: Object.values(ASSETS) });
};

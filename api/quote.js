const { quote } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { from, to, amount } = req.body || {};
    res.status(200).json(await quote(from, to, amount));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

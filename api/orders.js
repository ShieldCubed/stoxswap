const { quote, DEPOSITS, validateAddress, loadOrders, saveOrder } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const orders = await loadOrders();

  if (req.method === "GET") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id required" });
    const order = orders.get(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.status(200).json(order);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST" });
  try {
    const { from, to, amount, destination, refund } = req.body || {};
    const dest = validateAddress(to, destination, "Destination");
    const ref = validateAddress(from, refund, "Refund address");
    const q = await quote(from, to, amount);
    const id = "STX-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      id,
      status: "awaiting_deposit",
      ...q,
      destination: dest,
      refund: ref,
      depositAddress: DEPOSITS[from],
      createdAt: new Date().toISOString()
    };
    await saveOrder(order);
    res.status(200).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

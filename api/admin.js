const { loadOrders, saveOrder } = require("./_lib");

module.exports = async (req, res) => {
  const token = process.env.STOX_ADMIN_TOKEN || "change-me-admin-token";
  if (req.headers["x-admin-token"] !== token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const orders = await loadOrders();
  if (req.method === "GET") {
    return res.status(200).json({ orders: [...orders.values()] });
  }
  if (req.method === "POST") {
    const { id, status, payoutTx } = req.body || {};
    const order = orders.get(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.status = status || order.status;
    if (payoutTx) order.payoutTx = payoutTx;
    await saveOrder(order);
    return res.status(200).json(order);
  }
  res.status(405).json({ error: "GET or POST" });
};

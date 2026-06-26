// /api/status-pix.js
// Consulta o status de uma transação pelo hash (usado no polling do front).
// GET /api/status-pix?hash=trans123abc456

module.exports = async (req, res) => {
  const { hash } = req.query;
  if (!hash) {
    return res.status(400).json({ success: false, error: "Informe o hash." });
  }

  const API_TOKEN = process.env.ZENITH_API_TOKEN;
  const url = `https://api.zenithpay.com.br/api/public/v1/transactions/${hash}?api_token=${API_TOKEN}`;

  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await r.json();

    if (!r.ok || !data.success) {
      return res.status(r.status).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      status: data.data.status, // "pending" -> "paid"
      paid_at: data.data.paid_at || null,
    });
  } catch (e) {
    console.error("ERRO status-pix:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

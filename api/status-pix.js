// api/status-pix.js
// GET /api/status-pix?id=PXB_xxxxx
module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, error: "Informe o id." });

  const PK = process.env.NITRO_PK;
  const SK = process.env.NITRO_SK;
  const credentials = Buffer.from(`${PK}:${SK}`).toString("base64");

  try {
    const r = await fetch(`https://api.nitropagamento.app/transactions/${id}`, {
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    const data = await r.json();

    if (!data.success) {
      return res.status(400).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      status: data.data.status, // "pendente" -> "pago"
      paid_at: data.data.paid_at || null,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

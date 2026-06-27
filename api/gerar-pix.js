// api/gerar-pix.js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST." });
  }

  const PK = process.env.NITRO_PK;
  const SK = process.env.NITRO_SK;
  const credentials = Buffer.from(`${PK}:${SK}`).toString("base64");
  const DOMINIO = process.env.DOMINIO || "https://www.conteudodiario.site";

  const { name, email, phone, document, amount } = req.body || {};
  const valor = amount ? amount / 100 : 96.67; // Nitro recebe em reais

  if (!name || !email || !phone || !document) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios: name, email, phone, document." });
  }

  const payload = {
    amount: valor,
    payment_method: "pix",
    description: "Taxa de Registro CAC",
    items: [{
      title: "Taxa de Registro CAC",
      unitPrice: Math.round(valor * 100),
      quantity: 1,
      tangible: false,
    }],
    customer: {
      name,
      email,
      document,
      phone: phone.replace(/\D/g, ""),
    },
    postbackUrl: `${DOMINIO}/api/webhook-nitro`,
    metadata: { order_id: Date.now().toString() },
  };

  try {
    const r = await fetch("https://api.nitropagamento.app", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    console.log("NITRO STATUS:", r.status, "BODY:", JSON.stringify(data));

    if (!data.success) {
      return res.status(400).json({ success: false, error: data });
    }

    const d = data.data;

    // pix_code = copia e cola (string EMV)
    // pix_qr_code = imagem base64 (já vem como data:image/png;base64,...)
    return res.status(200).json({
      success: true,
      pix_code: d.pix_code,
      qr_code: d.pix_qr_code
        ? (d.pix_qr_code.startsWith("data:") ? d.pix_qr_code : `data:image/png;base64,${d.pix_qr_code}`)
        : null,
      id: d.id,
      status: d.status,
      expires_at: d.expires_at,
    });
  } catch (e) {
    console.error("ERRO gerar-pix:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

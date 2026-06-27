// api/gerar-pix.js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido. Use POST." });
  }

  const API_TOKEN = process.env.ZENITH_API_TOKEN;
  if (!API_TOKEN) {
    return res.status(500).json({ success: false, error: "ZENITH_API_TOKEN não configurado." });
  }

  const url = `https://api.zenithpay.com.br/api/public/v1/transactions?api_token=${API_TOKEN}`;
  const { name, email, phone, document, amount } = req.body || {};
  const valor = amount || 9667;

  if (!name || !email || !phone || !document) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios: name, email, phone, document." });
  }

  const PRODUCT_HASH = process.env.ZENITH_PRODUCT_HASH || "gc8jjvnfuz";
  const DOMINIO = process.env.DOMINIO || "https://www.conteudodiario.site";

  const payload = {
    amount: valor,
    offer_hash: "ux6yoe2d9p",
    payment_method: "pix",
    customer: { name, email, phone_number: phone, document },
    cart: [{
      product_hash: PRODUCT_HASH,
      title: "Taxa de Registro CAC",
      cover: null,
      price: valor,
      quantity: 1,
      operation_type: 1,
      tangible: false,
    }],
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: `${DOMINIO}/api/webhook-zenith`,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    console.log("ZENITH STATUS:", r.status, "BODY:", JSON.stringify(data));

    if (r.status !== 201) {
      return res.status(r.status).json({ success: false, error: data });
    }

    // ZenithPay retorna campos direto na raiz (não dentro de data.data)
    const d = data.data || data;
    const pixObj   = d.pix || {};
    const pix_code = pixObj.pix_qr_code || pixObj.pix_url || null;
    const qr_code  = pixObj.qr_code_base64
                   ? `data:image/png;base64,${pixObj.qr_code_base64}`
                   : null;

    return res.status(200).json({
      success: true,
      qr_code,
      pix_code,
      hash: d.hash,
      status: d.payment_status || d.status,
      expires_at: d.expires_at || null,
    });
  } catch (e) {
    console.error("ERRO gerar-pix:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

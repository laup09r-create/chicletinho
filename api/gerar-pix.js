// api/gerar-pix.js
// Cria uma transação PIX na ZenithPay e retorna QR Code + copia-e-cola.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido. Use POST." });
  }

  const API_TOKEN = process.env.ZENITH_API_TOKEN;
  if (!API_TOKEN) {
    return res.status(500).json({ success: false, error: "ZENITH_API_TOKEN não configurado na Vercel." });
  }

  const url = `https://api.zenithpay.com.br/api/public/v1/transactions?api_token=${API_TOKEN}`;

  const { name, email, phone, document, amount } = req.body || {};
  const valor = amount || 9667; // R$ 96,67 em centavos

  if (!name || !email || !phone || !document) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name, email, phone, document.",
    });
  }

  // Pegar product_hash via GET /products antes de tentar a transação
  // Substitua PRODUCT_HASH_AQUI pelo hash real do seu produto na ZenithPay
  // (rode: curl "https://api.zenithpay.com.br/api/public/v1/products?api_token=SEU_TOKEN")
  const PRODUCT_HASH = process.env.ZENITH_PRODUCT_HASH || "COLE_O_PRODUCT_HASH_AQUI";
  const DOMINIO = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.DOMINIO || "https://SEU-DOMINIO.vercel.app";

  const payload = {
    amount: valor,
    offer_hash: "ux6yoe2d9p",
    payment_method: "pix",
    customer: {
      name,
      email,
      phone_number: phone,
      document,
    },
    cart: [
      {
        product_hash: PRODUCT_HASH,
        title: "Taxa de Registro CAC",
        cover: null,
        price: valor,
        quantity: 1,
        operation_type: 1,
        tangible: false,
      },
    ],
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: `${DOMINIO}/api/webhook-zenith`,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    console.log("ZENITH STATUS:", r.status, "BODY:", JSON.stringify(data));

    if (r.status !== 201 || !data.success) {
      return res.status(r.status).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      qr_code: data.data.qr_code,     // imagem base64 (data:image/png;base64,...)
      pix_code: data.data.pix_code,   // copia e cola (EMV)
      hash: data.data.hash,           // hash da transação (p/ consultar status)
      status: data.data.status,       // "pending"
      expires_at: data.data.expires_at,
    });
  } catch (e) {
    console.error("ERRO gerar-pix:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

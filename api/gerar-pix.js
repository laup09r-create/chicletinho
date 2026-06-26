// /api/gerar-pix.js
// Cria uma transação PIX na ZenithPay e retorna QR Code + copia-e-cola.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Método não permitido. Use POST." });
  }

  const API_TOKEN = process.env.ZENITH_API_TOKEN;
  const url = `https://api.zenithpay.com.br/api/public/v1/transactions?api_token=${API_TOKEN}`;

  const { name, email, phone, document, amount } = req.body || {};
  const valor = amount || 9667; // R$ 96,67 em centavos

  // validação mínima
  if (!name || !email || !phone || !document) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios: name, email, phone, document.",
    });
  }

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
        product_hash: "d6gjh3spfv",
        title: "Taxa de Registro",
        cover: null,
        price: valor,
        quantity: 1,
        operation_type: 1,
        tangible: false,
      },
    ],
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: "https://www.conteudodiario.site/api/webhook-zenith",
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

  qr_code:
    data.data?.qr_code ||
    data.data?.pix?.qr_code_base64 ||
    null,

  pix_code:
    data.data?.pix_code ||
    data.data?.pix?.pix_qr_code ||
    data.data?.pix?.pix_url ||
    "",

  hash:
    data.data?.hash ||
    data.hash,

  status:
    data.data?.status ||
    data.data?.payment_status ||
    data.payment_status,

  expires_at:
    data.data?.expires_at ||
    null,

  raw: data.data || data
});
  } catch (e) {
    console.error("ERRO gerar-pix:", e);
    return res.status(500).json({ success: false, error: e.message 
    });


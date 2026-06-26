export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido. Use POST.",
    });
  }

  try {
 const token = (process.env.ZENITH_TOKEN || "")
  .replace("Value:", "")
  .replace("value:", "")
  .replace(/\s/g, "")
  .trim();

const offerHash = (process.env.ZENITH_OFFER_HASH || "")
  .replace("Value:", "")
  .replace("value:", "")
  .replace(/\s/g, "")
  .trim();

    if (!token) {
      return res.status(500).json({
        success: false,
        error: "ZENITH_TOKEN não configurado na Vercel.",
      });
    }

    if (!offerHash) {
      return res.status(500).json({
        success: false,
        error: "ZENITH_OFFER_HASH não configurado na Vercel.",
      });
    }

    const {
      valor = 19.9,
      nome = "Cliente",
      email = "cliente@email.com",
      telefone = "11999999999",
      cpf = "00000000000",
      utm_source = "",
      utm_campaign = "",
      utm_medium = "",
      utm_content = "",
      utm_term = "",
    } = req.body || {};

    const valorNumber = Number(valor);
    const valorCentavos = Math.round(valorNumber * 100);

    const payload = {
      api_token: token,
      amount: valorCentavos,
      payment_method: "pix",
      installments: 1,

      customer: {
        name: nome,
        email: email,
        phone_number: telefone,
        document: cpf,
      },

      cart: [
        {
          offer_hash: offerHash,
          title: "Pagamento PIX",
          price: valorCentavos,
          quantity: 1,
          operation_type: 1,
        },
      ],

      tracking: {
        src: "site",
        utm_source,
        utm_campaign,
        utm_medium,
        utm_content,
        utm_term,
      },
    };

    const resposta = await fetch("https://api.zenithpay.com.br/public/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respostaTexto = await resposta.text();

    let data;
    try {
      data = JSON.parse(respostaTexto);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "A Zenith não retornou JSON. Pode ser endpoint errado ou erro interno da API.",
        resposta_bruta: respostaTexto,
      });
    }

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        success: false,
        error: "Erro ao gerar Pix na Zenith.",
        details: data,
      });
    }

    const pixCopiaCola =
      data?.data?.qr_code ||
      data?.qr_code ||
      data?.data?.pix?.qr_code ||
      data?.pix?.qr_code ||
      data?.data?.pixCopiaCola ||
      data?.pixCopiaCola ||
      data?.data?.copy_paste ||
      data?.copy_paste ||
      data?.data?.pix?.copy_paste ||
      data?.pix?.copy_paste ||
      data?.data?.pix_code ||
      data?.pix_code ||
      "";

    const transactionHash =
      data?.data?.transaction_hash ||
      data?.transaction_hash ||
      data?.data?.hash ||
      data?.hash ||
      "";

    const paymentUrl =
      data?.data?.payment_url ||
      data?.payment_url ||
      data?.data?.checkout_url ||
      data?.checkout_url ||
      "";

    return res.status(200).json({
      success: true,
      transactionHash,
      paymentUrl,
      pixCopiaCola,
      raw: data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro interno na rota /api/gerar-pix.",
      details: error.message,
    });
  }
}

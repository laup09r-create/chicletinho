module.exports = async function handler(req, res) {
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

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Método não permitido. Use POST.",
      });
    }

    if (!token) {
      return res.status(500).json({
        success: false,
        error: "ZENITH_TOKEN não configurado.",
      });
    }

    if (!offerHash) {
      return res.status(500).json({
        success: false,
        error: "ZENITH_OFFER_HASH não configurado.",
      });
    }

    const body = req.body || {};
    const valor = Number(body.valor || 19.9);
    const valorCentavos = Math.round(valor * 100);

    const payload = {
      api_token: token,
      amount: valorCentavos,
      payment_method: "pix",
      installments: 1,
      customer: {
        name: body.nome || "Cliente Teste",
        email: body.email || "cliente@email.com",
        phone_number: body.telefone || "11999999999",
        document: body.cpf || "00000000000",
      },
      cart: [
        {
          offer_hash: offerHash,
          price: valorCentavos,
          quantity: 1,
          operation_type: 1,
          title: "Pagamento PIX",
        },
      ],
      tracking: {
        src: "site",
        utm_source: body.utm_source || "",
        utm_campaign: body.utm_campaign || "",
        utm_medium: body.utm_medium || "",
        utm_content: body.utm_content || "",
        utm_term: body.utm_term || "",
      },
    };

    const resposta = await fetch("https://api.zenithpay.com.br/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const texto = await resposta.text();

    let data;
    try {
      data = JSON.parse(texto);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "A Zenith não retornou JSON.",
        resposta_bruta: texto,
      });
    }

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        success: false,
        error: "Erro retornado pela Zenith.",
        details: data,
        payload_enviado: {
          amount: valorCentavos,
          payment_method: "pix",
          offer_hash: offerHash,
        },
      });
    }

    const pixCopiaCola =
      data?.pix?.pix_qr_code ||
      data?.pix?.qr_code ||
      data?.pix?.copy_paste ||
      data?.data?.pix?.pix_qr_code ||
      data?.data?.pix?.qr_code ||
      data?.data?.pix?.copy_paste ||
      data?.data?.qr_code ||
      data?.data?.copy_paste ||
      data?.data?.pix_code ||
      data?.qr_code ||
      data?.copy_paste ||
      data?.pix_code ||
      "";

    const transactionHash =
      data?.hash ||
      data?.transaction_hash ||
      data?.data?.hash ||
      data?.data?.transaction_hash ||
      "";

    return res.status(200).json({
      success: true,
      pixCopiaCola,
      transactionHash,
      raw: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro interno na rota gerar-pix.",
      details: String(error?.message || error),
    });
  }
};

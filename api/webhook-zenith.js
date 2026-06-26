// /api/webhook-zenith.js
// Recebe o postback da ZenithPay quando o status da transação muda.
//
// Payload recebido (formato PLANO, campos no nível raiz):
// {
//   "transaction_hash": "abc123def456",
//   "status": "paid",
//   "amount": 15000,
//   "payment_method": "pix",
//   "paid_at": "2025-01-20T10:15:00Z"
// }

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const evento = req.body || {};
  console.log("WEBHOOK ZENITH:", JSON.stringify(evento));

  const hash = evento.transaction_hash;
  const status = evento.status;

  if (status === "paid") {
    // ✅ Pagamento confirmado.
    // Aqui você libera o produto / marca o pedido como pago no seu sistema.
    // Ex.: atualizar banco de dados usando o `hash`.
    console.log(`Transação ${hash} foi PAGA.`);
  }

  // Sempre responda 200 rápido pra Zenith não reenviar.
  return res.status(200).json({ received: true });
};

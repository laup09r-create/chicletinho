// api/webhook-nitro.js
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const evento = req.body || {};
  console.log("WEBHOOK NITRO:", JSON.stringify(evento));

  if (evento.event === "transaction.paid") {
    const id = evento.data?.transaction_id;
    console.log(`Transação ${id} foi PAGA.`);
    // Aqui você libera o produto/acesso
  }

  return res.status(200).json({ received: true });
};

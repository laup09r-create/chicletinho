export default function handler(req, res) {
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

  return res.status(200).json({
    success: true,
    message: "API funcionando na Vercel",
    method: req.method,
    token_configurado: !!token,
    token_tamanho: token.length,
    offer_hash_configurado: !!offerHash,
    offer_hash: offerHash,
  });
}

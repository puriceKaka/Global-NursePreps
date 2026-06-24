const { sendJson, readJsonBody } = require("../_lib/http");
const { getStore } = require("../_lib/kv-store");

const pickItem = (items, name) => {
  if (!Array.isArray(items)) return null;
  const found = items.find((x) => x && typeof x === "object" && String(x.Name || "") === name) || null;
  return found && Object.prototype.hasOwnProperty.call(found, "Value") ? found.Value : null;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = await readJsonBody(req);
    const cb = body?.Body?.stkCallback || null;
    if (!cb || typeof cb !== "object") return sendJson(res, 400, { ok: false, error: "Invalid callback" });

    const resultCode = Number(cb.ResultCode);
    const resultDesc = String(cb.ResultDesc || "");
    const metaItems = cb?.CallbackMetadata?.Item || [];

    const entry = {
      at: new Date().toISOString(),
      merchantRequestId: String(cb.MerchantRequestID || ""),
      checkoutRequestId: String(cb.CheckoutRequestID || ""),
      resultCode: Number.isFinite(resultCode) ? resultCode : null,
      resultDesc,
      amount: pickItem(metaItems, "Amount"),
      receipt: pickItem(metaItems, "MpesaReceiptNumber"),
      transactionDate: pickItem(metaItems, "TransactionDate"),
      phoneNumber: pickItem(metaItems, "PhoneNumber"),
      raw: body,
    };

    const store = getStore();
    const logKey = "jixels_mpesa_stk_callbacks_v1";
    const current = (await store.get(logKey)) || [];
    const arr = Array.isArray(current) ? current : [];
    arr.push(entry);
    await store.set(logKey, arr.slice(-800));

    // Acknowledge to Safaricom.
    return sendJson(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    const status = Number(err?.statusCode || 500) || 500;
    return sendJson(res, status, { ok: false, error: "Server error" });
  }
};


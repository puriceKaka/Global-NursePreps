import { isCallbackAuthorized } from '../_lib/callbackAuth.js';
import { findCustomerForProviderPayment } from '../_lib/database.js';
import { readJson, sendJson } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { ResultCode: 1, ResultDesc: 'Method not allowed.' });
    return;
  }

  try {
    if (!isCallbackAuthorized(req)) {
      sendJson(res, 401, { ResultCode: 1, ResultDesc: 'Unauthorized callback.' });
      return;
    }

    const body = await readJson(req);
    const accountReference = String(body.BillRefNumber || body.AccountReference || '').trim();
    const payerPhone = String(body.MSISDN || body.phone || '').trim();

    if (!accountReference && !payerPhone) {
      sendJson(res, 200, { ResultCode: 1, ResultDesc: 'Missing account reference or phone.' });
      return;
    }

    const customer = await findCustomerForProviderPayment({
      accountReference,
      phone: payerPhone
    });

    if (!customer) {
      sendJson(res, 200, { ResultCode: 1, ResultDesc: 'Customer account not found.' });
      return;
    }

    sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    sendJson(res, 500, { ResultCode: 1, ResultDesc: error.message });
  }
}

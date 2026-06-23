import { isCallbackAuthorized } from '../_lib/callbackAuth.js';
import { findCustomerForProviderPayment, logPaymentEvent } from '../_lib/database.js';
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

    await logPaymentEvent('mpesa_c2b_validation_received', {
      accountReference,
      phone: payerPhone,
      amount: Number(body.TransAmount || body.amount || 0),
      transactionId: String(body.TransID || body.TransId || body.transactionId || ''),
      rawBody: body
    });

    if (!accountReference && !payerPhone) {
      await logPaymentEvent('mpesa_c2b_validation_missing_reference', {
        accountReference,
        phone: payerPhone
      });
      sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const customer = await findCustomerForProviderPayment({
      accountReference,
      phone: payerPhone
    });

    if (!customer) {
      await logPaymentEvent('mpesa_c2b_validation_customer_not_found', {
        accountReference,
        phone: payerPhone
      });
      sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    await logPaymentEvent('mpesa_c2b_validation_customer_matched', {
      accountReference,
      phone: payerPhone,
      customerId: customer.id,
      customerName: customer.customer_name || ''
    });

    sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    await logPaymentEvent('mpesa_c2b_validation_failed', {
      error: error.message
    }).catch(() => null);
    sendJson(res, 500, { ResultCode: 1, ResultDesc: error.message });
  }
}

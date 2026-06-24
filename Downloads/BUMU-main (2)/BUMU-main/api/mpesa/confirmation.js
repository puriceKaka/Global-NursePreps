import { sendPaymentConfirmedSms } from '../_lib/africastalking.js';
import { isCallbackAuthorized } from '../_lib/callbackAuth.js';
import { completeProviderC2BPayment, logPaymentEvent } from '../_lib/database.js';
import { parseDarajaC2BConfirmation } from '../_lib/daraja.js';
import { readJson, sendJson } from '../_lib/http.js';

function mpesaDateToIso(value) {
  const text = String(value || '');
  if (!/^\d{14}$/.test(text)) return new Date().toISOString();
  const year = text.slice(0, 4);
  const month = text.slice(4, 6);
  const day = text.slice(6, 8);
  const hour = text.slice(8, 10);
  const minute = text.slice(10, 12);
  const second = text.slice(12, 14);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`).toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { message: 'Method not allowed.' });
    return;
  }

  try {
    if (!isCallbackAuthorized(req, ['PAYMENT_CALLBACK_SECRET', 'WEBHOOK_SECRET'], { allowPublicPaymentCallbacks: true })) {
      sendJson(res, 401, { message: 'M-PESA C2B confirmation is not authorized.' });
      return;
    }

    const body = await readJson(req);
    const confirmation = parseDarajaC2BConfirmation(body);
    if (!confirmation?.transactionId) {
      await logPaymentEvent('mpesa_c2b_missing_transaction_reference', {
        rawBody: body
      });
      sendJson(res, 400, { ResultCode: 1, ResultDesc: 'Missing transaction reference.' });
      return;
    }

    await logPaymentEvent('mpesa_c2b_confirmation_received', {
      transactionId: confirmation.transactionId,
      accountReference: confirmation.accountReference || '',
      amount: Number(confirmation.amount || 0),
      phone: confirmation.phone || '',
      paidAt: confirmation.paidAt || '',
      rawBody: body
    });

    let result;
    try {
      result = await completeProviderC2BPayment({
        amount: confirmation.amount,
        phone: confirmation.phone,
        receipt: confirmation.transactionId,
        providerReference: confirmation.transactionId,
        providerTransactionId: confirmation.transactionId,
        providerResponse: body,
        paidAt: mpesaDateToIso(confirmation.paidAt),
        accountReference: confirmation.accountReference,
        method: 'mpesa_c2b'
      });
    } catch (error) {
      await logPaymentEvent('mpesa_c2b_confirmation_failed', {
        transactionId: confirmation.transactionId,
        accountReference: confirmation.accountReference || '',
        amount: Number(confirmation.amount || 0),
        phone: confirmation.phone || '',
        error: error.message
      });
      throw error;
    }

    if (!result.duplicate && result.customer) {
      await logPaymentEvent('mpesa_c2b_payment_created', {
        transactionId: confirmation.transactionId,
        paymentId: result.payment?.id || '',
        customerId: result.customer?.id || '',
        customerName: result.customer?.customer_name || '',
        accountReference: confirmation.accountReference || '',
        amount: result.paidAmount,
        balance: result.nextBalance
      });
      await sendPaymentConfirmedSms({
        customer: { ...result.customer, customer_phone: result.customer.customer_phone || confirmation.phone },
        amount: result.paidAmount,
        receipt: confirmation.transactionId,
        balance: result.nextBalance,
        repaymentPct: result.repaymentPct,
        accountReference: result.customer.national_id || result.customer.id,
        payerPhone: confirmation.phone
      }).catch(() => null);
    } else if (result.duplicate) {
      await logPaymentEvent('mpesa_c2b_payment_duplicate', {
        transactionId: confirmation.transactionId,
        paymentId: result.payment?.id || '',
        accountReference: confirmation.accountReference || '',
        amount: Number(confirmation.amount || 0)
      });
    } else if (result.pendingMatch) {
      await logPaymentEvent('mpesa_c2b_payment_pending_match', {
        transactionId: confirmation.transactionId,
        paymentId: result.payment?.id || '',
        accountReference: confirmation.accountReference || '',
        amount: Number(confirmation.amount || 0)
      });
    }

    sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { ResultCode: 1, ResultDesc: error.message });
  }
}

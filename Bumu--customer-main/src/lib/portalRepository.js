import { isSupabaseConfigured, supabase } from "./supabaseClient";

export { isSupabaseConfigured };

function getConfiguredCustomerId() {
  return import.meta.env.VITE_CUSTOMER_ID || null;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signInCustomer({ email, password }) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutCustomer() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createPasswordResetRequest({ email, phone }) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("password_reset_requests")
    .insert({
      email,
      phone,
      status: "otp_required"
    });

  if (error) throw error;
  return true;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function monthName(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { month: "long" });
}

function mapStatus(value) {
  if (!value) return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeReference(value) {
  return String(value || "").trim().replace(/[\s-]+/g, "");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+254${digits.slice(1)}`;
  return value ? String(value).trim() : digits;
}

function paymentMatchesCustomer(payment, summaryRow, customerId) {
  const accountReferences = [
    customerId,
    summaryRow?.national_id,
    summaryRow?.customer_id
  ].map(normalizeReference).filter(Boolean);
  const phoneValues = [
    summaryRow?.phone,
    summaryRow?.support_phone
  ].map(normalizePhone).filter(Boolean);
  const paymentReferences = [
    payment.customer_id,
    payment.provider_account_reference
  ].map(normalizeReference).filter(Boolean);
  const paymentPhones = [
    payment.phone_used,
    payment.provider_payer_phone
  ].map(normalizePhone).filter(Boolean);

  return paymentReferences.some((value) => accountReferences.includes(value))
    || paymentPhones.some((value) => phoneValues.includes(value));
}

export function emptyPortalData() {
  return {
    customer: null,
    bike: null,
    summary: {
      totalPaid: 0,
      balance: 0,
      progress: 0
    },
    payments: [],
    notifications: [],
    paymentPlan: {
      dailyInstallment: 0,
      suggestedAmounts: []
    }
  };
}

export async function loadCustomerPortal() {
  if (!isSupabaseConfigured) {
    return {
      data: emptyPortalData(),
      setupRequired: true,
      error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    };
  }

  const currentUser = await getCurrentUser();
  const customerId = currentUser?.id || getConfiguredCustomerId();

  if (!customerId) {
    return {
      data: emptyPortalData(),
      setupRequired: true,
      error: "No logged-in customer was found."
    };
  }

  const { data: summaryRow, error: summaryError } = await supabase
    .from("customer_portal_summary")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (summaryError) throw summaryError;

  const { data: paymentsByCustomerId, error: paymentsByCustomerIdError } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("paid_at", { ascending: false });

  if (paymentsByCustomerIdError) throw paymentsByCustomerIdError;

  const paymentAccountReferences = [
    summaryRow.national_id,
    customerId
  ].map(normalizeReference).filter(Boolean);

  const phoneReferences = [summaryRow.phone].map(normalizePhone).filter(Boolean);

  const { data: paymentsByReference, error: paymentsByReferenceError } = paymentAccountReferences.length
    ? await supabase
      .from("payments")
      .select("*")
      .in("provider_account_reference", paymentAccountReferences)
      .order("paid_at", { ascending: false })
    : { data: [], error: null };

  if (paymentsByReferenceError) throw paymentsByReferenceError;

  const { data: paymentsByPhone, error: paymentsByPhoneError } = phoneReferences.length
    ? await supabase
      .from("payments")
      .select("*")
      .in("provider_payer_phone", phoneReferences)
      .order("paid_at", { ascending: false })
    : { data: [], error: null };

  if (paymentsByPhoneError) throw paymentsByPhoneError;

  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (notificationsError) throw notificationsError;

  if (!summaryRow) {
    return { data: emptyPortalData(), setupRequired: false, error: null };
  }

  const totalPrice = Number(summaryRow.total_price || 0);
  const totalPaid = Number(summaryRow.total_paid || 0);
  const balance = Number(summaryRow.balance ?? summaryRow.computed_balance ?? 0);
  const dailyInstallment = Number(summaryRow.daily_installment || 0);

  return {
    data: {
      customer: {
        id: summaryRow.customer_id,
        name: summaryRow.full_name,
        phone: summaryRow.phone,
        email: summaryRow.email || "",
        nationalId: summaryRow.national_id || "",
        supportPhone: summaryRow.support_phone || "",
        supportEmail: summaryRow.support_email || ""
      },
      bike: summaryRow.bike_id
        ? {
            id: summaryRow.bike_id,
            model: summaryRow.model,
            serialNumber: summaryRow.serial_number,
            assignedDate: formatDate(summaryRow.assigned_date),
            totalPrice,
            dailyInstallment,
            nextDueDate: formatDate(summaryRow.next_due_date),
            finalPaymentDate: formatDate(summaryRow.final_payment_date),
            status: mapStatus(summaryRow.bike_status)
          }
        : null,
      summary: {
        totalPaid,
        balance,
        progress: totalPrice > 0 ? Math.min(100, Math.round((totalPaid / totalPrice) * 100)) : 0
      },
      payments: [...(paymentsByCustomerId || []), ...(paymentsByReference || []), ...(paymentsByPhone || [])]
        .filter((payment, index, all) => payment?.id && all.findIndex((candidate) => candidate.id === payment.id) === index)
        .filter((payment) => paymentMatchesCustomer(payment, summaryRow, customerId))
        .map((payment) => ({
        id: payment.id,
        date: formatDate(payment.paid_at),
        month: monthName(payment.paid_at),
        phone: payment.phone_used || "",
        amount: Number(payment.amount || 0),
        remainingBalance: null,
        receipt: payment.mpesa_receipt || "",
        status: mapStatus(payment.status)
      })),
      notifications: (notifications || []).map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        date: formatDate(notification.created_at),
        unread: notification.unread,
        type: notification.type
      })),
      paymentPlan: {
        dailyInstallment,
        suggestedAmounts: [dailyInstallment, dailyInstallment * 3, dailyInstallment * 7, dailyInstallment * 14]
          .filter((value) => value > 0)
      }
    },
    setupRequired: false,
    error: null
  };
}

export async function createPaymentRequest({ customerId, bikeId, amount, phone }) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      customer_id: customerId,
      bike_id: bikeId,
      amount,
      phone
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createPaymentNotification({ customerId, title, message, type = "payment" }) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      customer_id: customerId,
      title,
      message,
      type,
      unread: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

import { readJson, sendJson } from '../_lib/http.js';
import { assertBodySize, assertRateLimit, assertRequiredTextFields } from '../_lib/security.js';
import { getSupabase, requirePortalUser } from '../_lib/supabase.js';

async function audit(user, action, targetTable, targetId, details = {}) {
  await getSupabase().from('admin_audit_logs').insert({
    actor_user_id: user.id,
    actor_email: user.email,
    action,
    target_table: targetTable,
    target_id: targetId,
    details
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { message: 'Method not allowed.' });
    return;
  }

  try {
    assertBodySize(req);
    await assertRateLimit(req, { scope: 'admin-products', limit: 20, windowMs: 60_000 });
    const user = await requirePortalUser(req, ['admin']);
    const body = await readJson(req);
    const productType = String(body.productType || 'product').trim().toLowerCase();
    const productModel = String(body.productModel || '').trim();
    const serialNumber = String(body.serialNumber || '').trim();
    const chassisNumber = String(body.chassisNumber || '').trim();
    const imei1 = String(body.imei1 || body.imei_1 || '').trim();
    const imei2 = String(body.imei2 || body.imei_2 || '').trim();
    const lockerId = String(body.lockerId || body.locker_id || '').trim();
    const branch = String(body.branch || '').trim();
    const assignedAgentId = String(body.assignedAgentId || '').trim();
    let assignedAgent = null;

    assertRequiredTextFields({
      'product type': productType,
      'product model': productModel,
      branch
    });

    if (productType === 'phone') {
      assertRequiredTextFields({
        'imei 1': imei1
      });
    } else {
      assertRequiredTextFields({
        'serial number': serialNumber
      });
    }

    const normalizedImeis = [imei1, imei2].filter(Boolean);
    if (productType === 'phone') {
      if (normalizedImeis.length === 0) {
        sendJson(res, 400, { message: 'At least one IMEI is required for a phone.' });
        return;
      }

      for (const value of normalizedImeis) {
        if (!/^\d{15}$/.test(value)) {
          sendJson(res, 400, { message: 'Phone IMEI values must contain exactly 15 digits.' });
          return;
        }
      }
    }

    async function ensureUniqueField(column, value, label) {
      if (!value) return;
      const existing = await getSupabase()
        .from('inventory_products')
        .select('id,product_model,serial_number,chassis_number')
        .eq(column, value)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        sendJson(res, 409, { message: `${label} already exists on another inventory record.` });
        throw new Error('duplicate');
      }
    }

    try {
      await ensureUniqueField('imei_1', imei1, 'IMEI 1');
      await ensureUniqueField('imei_2', imei2, 'IMEI 2');
      await ensureUniqueField('locker_id', lockerId, 'Locker ID');
      await ensureUniqueField('serial_number', serialNumber, 'Serial number');
      await ensureUniqueField('chassis_number', chassisNumber, 'Chassis number');
    } catch (uniqueError) {
      if (uniqueError.message === 'duplicate') return;
      throw uniqueError;
    }

    if (assignedAgentId) {
      const agentResult = await getSupabase()
        .from('agents')
        .select('id,agent_code,full_name,agent_name,status')
        .eq('id', assignedAgentId)
        .maybeSingle();
      if (agentResult.error) throw agentResult.error;
      if (!agentResult.data) {
        sendJson(res, 404, { message: 'Assigned agent was not found.' });
        return;
      }
      assignedAgent = agentResult.data;
    }

    const { data, error } = await getSupabase()
      .from('inventory_products')
      .insert({
        product_type: productType,
        product_model: productModel,
        serial_number: productType === 'phone' ? imei1 : serialNumber,
        chassis_number: productType === 'phone' ? (imei2 || null) : (chassisNumber || null),
        imei_1: imei1 || null,
        imei_2: imei2 || null,
        locker_id: lockerId || null,
        branch,
        assigned_agent_id: assignedAgent?.id || null,
        assigned_agent_code: assignedAgent?.agent_code || null,
        status: body.status || (assignedAgent ? 'assigned' : 'available'),
        source_portal: 'admin'
      })
      .select()
      .single();

    if (error) throw error;
    await audit(user, 'product_created', 'inventory_products', data.id, {
      productType,
      productModel,
      imei1: imei1 || null,
      imei2: imei2 || null,
      lockerId: lockerId || null,
      assignedAgentId: assignedAgent?.id || null,
      assignedAgentCode: assignedAgent?.agent_code || null
    });
    sendJson(res, 201, { product: data });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { message: error.message });
  }
}

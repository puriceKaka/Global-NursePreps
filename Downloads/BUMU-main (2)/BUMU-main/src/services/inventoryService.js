import { backendClient } from './backendClient.js';
import { readCachedJson, writeCachedJson } from './offlineStore.js';
import { seedInventoryProducts } from './offlineSeeds.js';

function normalizeInventoryType(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['phone', 'phones'].includes(normalized)) return 'phone';
  if (['bike', 'bikes'].includes(normalized)) return 'bike';
  if (['product', 'all', ''].includes(normalized)) return '';
  return normalized;
}

function normalizeProduct(product) {
  const productType = normalizeInventoryType(product.productType ?? product.product_type ?? product.type ?? 'product') || 'product';
  const imei1 = product.imei1 ?? product.imei_1 ?? '';
  const imei2 = product.imei2 ?? product.imei_2 ?? '';

  return {
    id: product.id,
    productType,
    productModel: product.productModel ?? product.product_model ?? product.model ?? '',
    serialNumber: productType === 'phone'
      ? (imei1 || product.serialNumber || product.serial_number || '')
      : (product.serialNumber ?? product.serial_number ?? ''),
    chassisNumber: productType === 'phone'
      ? (imei2 || product.chassisNumber || product.chassis_number || '')
      : (product.chassisNumber ?? product.chassis_number ?? ''),
    imei1,
    imei2,
    lockerId: product.lockerId ?? product.locker_id ?? '',
    branch: product.branch ?? '',
    status: product.status ?? 'available',
    assignedCustomerId: product.assignedCustomerId ?? product.assigned_customer_id ?? null,
    assignedAgentId: product.assignedAgentId ?? product.assigned_agent_id ?? null,
    assignedAgentCode: product.assignedAgentCode ?? product.assigned_agent_code ?? null,
    storageGb: product.storageGb ?? product.storage_gb ?? null,
    ramGb: product.ramGb ?? product.ram_gb ?? null,
    color: product.color ?? '',
    simSlotCount: product.simSlotCount ?? product.sim_slot_count ?? null,
    lockerSyncStatus: product.lockerSyncStatus ?? product.locker_sync_status ?? '',
    lockerLastSyncedAt: product.lockerLastSyncedAt ?? product.locker_last_synced_at ?? null,
    lockerLastError: product.lockerLastError ?? product.locker_last_error ?? '',
    engineNumber: product.engineNumber ?? product.engine_number ?? '',
    frameNumber: product.frameNumber ?? product.frame_number ?? '',
    registrationNumber: product.registrationNumber ?? product.registration_number ?? '',
    trackerId: product.trackerId ?? product.tracker_id ?? '',
    odometerKm: product.odometerKm ?? product.odometer_km ?? 0,
    serviceDueDate: product.serviceDueDate ?? product.service_due_date ?? null,
    mechanicalStatus: product.mechanicalStatus ?? product.mechanical_status ?? '',
    createdAt: product.createdAt ?? product.created_at ?? ''
  };
}

export const inventoryService = {
  async listProducts(options = {}) {
    const productType = normalizeInventoryType(options.productType ?? options.product_type ?? options.type);
    const cacheKey = productType ? `inventory-products:${productType}` : 'inventory-products';
    const query = productType ? { productType } : {};

    try {
      const data = await backendClient.get('/api/inventory', query);
      const products = data.products ?? data.records ?? data;
      const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
      writeCachedJson(cacheKey, normalized);
      return normalized;
    } catch {
      const fallback = seedInventoryProducts
        .map(normalizeProduct)
        .filter((product) => !productType || product.productType === productType);
      return readCachedJson(cacheKey, fallback);
    }
  }
};

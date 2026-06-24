import { useMemo, useState } from "react";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { StatusBadge } from "../../components/ui/StatusBadge.jsx";
import { useAdminData } from "../../features/admin/AdminDataContext.jsx";
import { findAgent, findCustomer } from "../../lib/admin/lookups.js";

const emptyBike = {
  productType: "bike",
  model: "",
  serialNumber: "",
  chassisNumber: "",
  imei1: "",
  imei2: "",
  lockerId: "",
  assignedAgentId: ""
};

export default function Bikes() {
  const { addBike, agents, bikes, customers, deleteBike, updateBikeAgent } = useAdminData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyBike);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedSerial = form.productType === "phone" ? "" : form.serialNumber.trim().toLowerCase();
    const normalizedChassis = form.productType === "phone" ? "" : form.chassisNumber.trim().toLowerCase();
    const normalizedImei1 = form.productType === "phone" ? form.imei1.trim().toLowerCase() : "";
    const normalizedImei2 = form.productType === "phone" ? form.imei2.trim().toLowerCase() : "";
    const normalizedLockerId = form.lockerId.trim().toLowerCase();
    const duplicateBike = bikes.find((bike) => {
      const matchesSerial = normalizedSerial && bike.serialNumber?.trim().toLowerCase() === normalizedSerial;
      const matchesChassis = normalizedChassis && bike.chassisNumber?.trim().toLowerCase() === normalizedChassis;
      const matchesImei1 = normalizedImei1 && bike.imei1?.trim().toLowerCase() === normalizedImei1;
      const matchesImei2 = normalizedImei2 && bike.imei2?.trim().toLowerCase() === normalizedImei2;
      const matchesLocker = normalizedLockerId && bike.lockerId?.trim().toLowerCase() === normalizedLockerId;
      return matchesSerial || matchesChassis || matchesImei1 || matchesImei2 || matchesLocker;
    });

    if (duplicateBike) {
      setMessage(`Cannot add inventory. A matching serial, chassis, IMEI, or locker ID already exists.`);
      return;
    }

    try {
      await addBike(form);
      const agent = findAgent(agents, form.assignedAgentId);
      setMessage(`${form.productType} ${form.model} saved${agent ? ` and assigned to ${agent.name}` : " as available stock"}.`);
      setForm(emptyBike);
      setShowForm(false);
    } catch (error) {
      setMessage(error.message || "Could not save bike.");
    }
  }

  async function assignBike(row, assignedAgentId) {
    try {
      await updateBikeAgent(row.id, assignedAgentId);
      const agent = findAgent(agents, assignedAgentId);
      setMessage(agent ? `${row.serialNumber} assigned to ${agent.name}.` : `${row.serialNumber} is now unassigned stock.`);
    } catch (error) {
      setMessage(error.message || "Could not assign bike.");
    }
  }

  async function removeBike(row) {
    if (!window.confirm(`Delete ${row.model || row.serialNumber}? This removes the inventory record.`)) {
      return;
    }

    try {
      await deleteBike(row.id);
      setMessage(`${row.serialNumber || row.model} deleted.`);
    } catch (error) {
      setMessage(error.message || "Could not delete inventory record.");
    }
  }

  const columns = [
    { key: "productType", label: "Type" },
    { key: "model", label: "Model" },
    { key: "serialNumber", label: "Serial number" },
    { key: "chassisNumber", label: "Chassis number" },
    { key: "imei1", label: "IMEI 1" },
    { key: "imei2", label: "IMEI 2" },
    { key: "lockerId", label: "Locker ID" },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "customer",
      label: "Assigned customer",
      render: (row) => findCustomer(customers, row.assignedCustomerId)?.name || "Unassigned"
    },
    {
      key: "agent",
      label: "Assigned agent",
      render: (row) => (
        <select
          value={row.assignedAgentId || ""}
          disabled={Boolean(row.assignedCustomerId) || row.status === "sold"}
          aria-label={`Assigned agent for ${row.serialNumber}`}
          onChange={(event) => assignBike(row, event.target.value)}
        >
          <option value="">Unassigned</option>
          {agents.filter((agent) => agent.status === "active").map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.code})
            </option>
          ))}
        </select>
      )
    },
    { key: "createdAt", label: "Created" },
    {
      key: "delete",
      label: "Delete",
      render: (row) => (
        <button type="button" className="button secondary" onClick={() => removeBike(row)}>
          Delete
        </button>
      )
    }
  ];
  const visibleBikes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bikes.filter((bike) => {
      const customer = findCustomer(customers, bike.assignedCustomerId);
      const agent = findAgent(agents, bike.assignedAgentId);
      const searchable = [bike.model, bike.serialNumber, bike.chassisNumber, bike.imei1, bike.imei2, bike.lockerId, bike.status, customer?.name, agent?.name]
        .join(" ")
        .toLowerCase();
      const matchesStatus = statusFilter === "all" || bike.status === statusFilter;
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [agents, bikes, customers, query, statusFilter]);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Inventory"
        title="Phones and bikes"
        description="Admin adds stock here. Agents only select available inventory during onboarding; assignment happens through approved customer applications."
        actions={
          <button className="button primary" type="button" onClick={() => setShowForm((open) => !open)}>
            {showForm ? "Close form" : "Add inventory"}
          </button>
        }
      />

      {message ? <div className="alert soft">{message}</div> : null}

      {showForm ? (
        <form className="panel inventory-form" onSubmit={handleSubmit}>
          <div className="settings-card-header">
            <div>
              <p className="eyebrow">Inventory record</p>
              <h3>Add available inventory</h3>
            </div>
          </div>

          <div className="settings-form">
            <label>
              Product type
              <select
                value={form.productType}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setForm((current) => ({
                    ...current,
                    productType: nextType,
                    serialNumber: nextType === "phone" ? "" : current.serialNumber,
                    chassisNumber: nextType === "phone" ? "" : current.chassisNumber,
                    imei1: nextType === "bike" ? "" : current.imei1,
                    imei2: nextType === "bike" ? "" : current.imei2
                  }));
                }}
              >
                <option value="bike">Bike</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label>
              Assign to agent
              <select
                value={form.assignedAgentId}
                onChange={(event) => setForm({ ...form, assignedAgentId: event.target.value })}
              >
                <option value="">Unassigned stock</option>
                {agents.filter((agent) => agent.status === "active").map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product model
              <input
                required
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                placeholder="TVS HLX 150"
              />
            </label>
            {form.productType === "phone" ? (
              <>
                <label>
                  IMEI 1
                  <input
                    required
                    inputMode="numeric"
                    value={form.imei1}
                    onChange={(event) => setForm({ ...form, imei1: event.target.value })}
                    placeholder="356789123456789"
                  />
                </label>
                <label>
                  IMEI 2
                  <input
                    inputMode="numeric"
                    value={form.imei2}
                    onChange={(event) => setForm({ ...form, imei2: event.target.value })}
                    placeholder="356789123456780"
                  />
                </label>
                <label>
                  Locker ID
                  <input
                    value={form.lockerId}
                    onChange={(event) => setForm({ ...form, lockerId: event.target.value })}
                    placeholder="LCK-001"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Serial number
                  <input
                    required
                    value={form.serialNumber}
                    onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
                    placeholder="TVS-HLX-2026-010"
                  />
                </label>
                <label>
                  Chassis number
                  <input
                    value={form.chassisNumber}
                    onChange={(event) => setForm({ ...form, chassisNumber: event.target.value })}
                    placeholder="MD625MF54P1A90841"
                  />
                </label>
                <label>
                  Locker ID
                  <input
                    value={form.lockerId}
                    onChange={(event) => setForm({ ...form, lockerId: event.target.value })}
                    placeholder="LCK-001"
                  />
                </label>
              </>
            )}
          </div>

          <div className="page-actions">
            <button className="button primary" type="submit">Save inventory</button>
            <button className="button secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="panel table-toolbar">
        <label>
          Search inventory
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model, serial, chassis..." />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="assigned">Assigned</option>
            <option value="repossessed">Repossessed</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="toolbar-count">
          <span>Visible</span>
          <strong>{visibleBikes.length}</strong>
        </div>
      </div>

      <DataTable columns={columns} rows={visibleBikes} emptyMessage="No inventory records match this view." />
    </section>
  );
}

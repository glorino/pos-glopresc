"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import {
  Truck,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  X,
  Star,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  _count?: { purchaseOrders: number; products: number };
  avgItemCost?: number;
  totalItemsSupplied?: number;
  lastOrderDate?: string | null;
}

export default function ProcurementSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/suppliers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.suppliers || json || []);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingSupplier(null);
    setForm({ name: "", contactName: "", email: "", phone: "", address: "", city: "", state: "" });
    setShowModal(true);
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        fetchSuppliers();
      }
    } catch (err) {
      console.error("Failed to save supplier:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="PROCUREMENT_MANAGER" title="Suppliers">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <button onClick={openAddModal} className="btn btn-primary"><Plus size={16} /> Add Supplier</button>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <Truck size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">No suppliers found</h3>
            <p className="mt-1 text-sm text-[#9090a0]">Add your first supplier to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="glass-card p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5">
                      <Truck size={18} className="text-[#d4a843]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#f0f0f5]">{supplier.name}</p>
                      {supplier.contactName && <p className="text-xs text-[#9090a0]">{supplier.contactName}</p>}
                    </div>
                  </div>
                  <span className={`badge ${supplier.isActive ? "badge-success" : "badge-danger"}`}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-[#9090a0]">
                  {supplier.email && <div className="flex items-center gap-1"><Mail size={12} /> {supplier.email}</div>}
                  {supplier.phone && <div className="flex items-center gap-1"><Phone size={12} /> {supplier.phone}</div>}
                  {supplier.city && <div className="flex items-center gap-1"><MapPin size={12} /> {supplier.city}{supplier.state ? `, ${supplier.state}` : ""}</div>}
                </div>
                {supplier.avgItemCost !== undefined && supplier.avgItemCost > 0 && (
                  <div className="mt-3 rounded-lg border border-[#2a2a3a] bg-[#12121a] p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#9090a0]">Avg Item Cost</span>
                      <span className="font-semibold text-[#d4a843]">{formatCurrency(supplier.avgItemCost)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-[#606070]">Items supplied: {supplier.totalItemsSupplied ?? supplier._count?.products ?? 0}</span>
                      <span className="text-[#606070]">Orders: {supplier._count?.purchaseOrders ?? 0}</span>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEditModal(supplier)} className="btn btn-secondary btn-sm flex-1">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-lg p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#f0f0f5]">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
                <button onClick={() => setShowModal(false)} className="text-[#606070] hover:text-[#f0f0f5]"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Supplier Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Contact Name</label>
                    <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">City</label>
                    <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Address</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">State</label>
                    <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Saving..." : editingSupplier ? "Update" : "Create"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

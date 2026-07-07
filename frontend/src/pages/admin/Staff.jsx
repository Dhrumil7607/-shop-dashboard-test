/**
 * Staff.jsx — /admin/staff
 * Super-admin manages staff users and their permissions. Backend enforces roles.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchStaff, createStaff, updateStaff, deleteStaff, fetchPermissions } from "@/lib/api";

const PERM_LABELS = {
  orders: "View/Process Orders",
  bookings: "View/Process Bookings",
  sellers: "Manage Sellers",
  products: "Manage Products",
  returns: "Manage Returns/Refunds",
  shipping: "Manage Shipping/Shiprocket",
  reports_only: "View Reports Only",
};

export default function AdminStaff() {
  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
  const [staff, setStaff] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCreds, setNewCreds] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([fetchStaff(adminKey), fetchPermissions(adminKey)]);
      setStaff(s); setPermissions(p);
    } catch { toast.error("Could not load staff"); }
    finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    try {
      const created = await createStaff(form, adminKey);
      setNewCreds({ email: created.email, password: created.temp_password });
      toast.success("Staff member created");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not create staff");
    }
  };

  const togglePerm = async (member, perm) => {
    const has = (member.permissions || []).includes(perm);
    const next = has ? member.permissions.filter(p => p !== perm) : [...(member.permissions || []), perm];
    try {
      await updateStaff(member.id, { permissions: next }, adminKey);
      load();
    } catch { toast.error("Could not update permissions"); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove staff "${name}"?`)) return;
    try { await deleteStaff(id, adminKey); toast.success("Staff removed"); load(); }
    catch { toast.error("Could not remove staff"); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Staff & Roles</h1>
          <p className="text-sm mt-1" style={{ color: "#9B8B7A" }}>Create staff accounts with limited permissions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "#1a1a1a" }}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {newCreds && (
        <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: "#F0FFF4", border: "1px solid #BBF7D0" }}>
          <p className="text-sm font-semibold text-green-800">Staff created. Share these credentials (also emailed):</p>
          <p className="text-sm font-mono mt-1">Email: {newCreds.email} · Password: {newCreds.password}</p>
          <button onClick={() => setNewCreds(null)} className="text-xs underline mt-1 text-green-700">Dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-center py-16" style={{ color: "#9B8B7A" }}>Loading...</p>
      ) : staff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: "#E8E4DF" }}>
          <Shield size={40} className="mx-auto mb-3" style={{ color: "#E8E4DF" }} />
          <p className="text-lg font-semibold mb-1">No staff members yet</p>
          <p style={{ color: "#9B8B7A" }}>Add staff and assign specific permissions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(m => (
            <div key={m.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E4DF" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold" style={{ color: "#1a1a1a" }}>{m.name || "Staff"}</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>{m.email}</p>
                </div>
                <button onClick={() => remove(m.id, m.name)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={16} style={{ color: "#C0392B" }} /></button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {permissions.map(perm => {
                  const has = (m.permissions || []).includes(perm);
                  return (
                    <button key={perm} onClick={() => togglePerm(m, perm)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition"
                      style={{
                        backgroundColor: has ? "rgba(45,122,58,0.1)" : "white",
                        color: has ? "#2D7A3A" : "#9B8B7A",
                        borderColor: has ? "#2D7A3A" : "#E8E4DF",
                      }}>
                      {PERM_LABELS[perm] || perm}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <StaffForm permissions={permissions} onClose={() => setShowForm(false)} onCreate={handleCreate} />}
    </AdminLayout>
  );
}

function StaffForm({ permissions, onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", permissions: [], password: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePerm = (p) => setForm(f => ({
    ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p],
  }));

  // Auto-generate a password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    const pw = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    set("password", pw);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Staff Member</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input placeholder="Full name *" value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
          <input type="email" placeholder="Email *" value={form.email} onChange={e => set("email", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
          <input placeholder="Phone" value={form.phone} onChange={e => set("phone", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
          {/* Password with generator */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-1" style={{ color: "#9B8B7A" }}>Password</label>
            <div className="flex gap-2">
              <input value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" style={{ borderColor: "#E8E4DF" }} />
              <button type="button" onClick={generatePassword}
                className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
                Generate
              </button>
            </div>
            {form.password && <p className="text-xs mt-1 font-mono" style={{ color: "#2D7A3A" }}>Password: {form.password}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#9B8B7A" }}>Permissions</p>
            <div className="flex flex-wrap gap-2">
              {permissions.map(p => (
                <button type="button" key={p} onClick={() => togglePerm(p)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{
                    backgroundColor: form.permissions.includes(p) ? "rgba(45,122,58,0.1)" : "white",
                    color: form.permissions.includes(p) ? "#2D7A3A" : "#9B8B7A",
                    borderColor: form.permissions.includes(p) ? "#2D7A3A" : "#E8E4DF",
                  }}>
                  {PERM_LABELS[p] || p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
          <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#1a1a1a" }}>Create Staff</button>
        </div>
      </form>
    </div>
  );
}

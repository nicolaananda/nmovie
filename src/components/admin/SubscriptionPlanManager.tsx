import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

type Plan = {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function SubscriptionPlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', durationDays: 1, price: 0, features: '' , isActive: true});

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSubscriptionPlans();
      setPlans(data.plans || []);
    } catch (e) {
      console.error('Failed to load subscription plans', e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({ name: '', durationDays: 1, price: 0, features: '', isActive: true });

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({ name: plan.name, durationDays: plan.durationDays, price: plan.price, features: plan.features.join(','), isActive: plan.isActive });
    setOpen(true);
  };

  const save = async () => {
    const features = form.features.split(',').map((f) => f.trim()).filter(Boolean);
    if (editing) {
      await adminService.updateSubscriptionPlan(editing.id, {
        name: form.name,
        durationDays: form.durationDays,
        price: form.price,
        features,
        isActive: form.isActive,
      });
    } else {
      await adminService.createSubscriptionPlan({ name: form.name, durationDays: form.durationDays, price: form.price, features, isActive: form.isActive });
    }
    setOpen(false);
    await loadPlans();
  };

  const toggleActive = async (plan: Plan) => {
    await adminService.updateSubscriptionPlan(plan.id, { isActive: !plan.isActive });
    await loadPlans();
  };

  const remove = async (plan: Plan) => {
    await adminService.deleteSubscriptionPlan(plan.id);
    await loadPlans();
  };

  if (loading) return <div className="text-white">Loading plans...</div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Subscription Plans</h3>
        <button onClick={openCreate} className="px-3 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/40">Add Plan</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="p-4 rounded-lg border bg-white/5 border-white/10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-white">{p.name}</div>
                <div className="text-sm text-gray-300">{p.durationDays} days • Rp {p.price.toLocaleString()}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${p.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/40 text-gray-300'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <ul className="text-sm text-gray-200 mb-2">
              {p.features.map((f, idx) => (
                <li key={idx}>• {f}</li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button onClick={() => openEdit(p)} className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Edit</button>
              <button onClick={() => toggleActive(p)} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{p.isActive ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => remove(p)} className="px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white/5 border border-white/20 rounded-lg p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{editing ? 'Edit Plan' : 'Add Plan'}</h4>
              <button onClick={() => setOpen(false)} className="text-white">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input className="bg-black/20 border border-white/20 rounded px-2 py-1 text-white" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="flex gap-2">
                <input type="number" className="bg-black/20 border border-white/20 rounded px-2 py-1 text-white" placeholder="Duration (days)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 1 })} />
                <input type="number" className="bg-black/20 border border-white/20 rounded px-2 py-1 text-white" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <input className="bg-black/20 border border-white/20 rounded px-2 py-1 text-white" placeholder="Features (comma separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
              <label className="inline-flex items-center gap-2 text-white">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
              </label>
              <button onClick={save} className="px-4 py-2 rounded bg-green-500 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

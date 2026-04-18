"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Users, Plus, Trash2, Edit2, Shield, Globe, 
  Check, X, Loader2, LogOut, LayoutDashboard,
  Lock, Mail, User as UserIcon, Palette
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { data: admins, mutate: mutateAdmins, error: adminsError } = useSWR('/api/admin/users', fetcher);
  const { data: websites } = useSWR('/api/websites', fetcher);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    canChangeTheme: false,
    assignedSiteIds: [] as string[]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user && (session.user as any).role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleOpenModal = (admin: any = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        password: '', // Don't show hashed password
        name: admin.name || '',
        canChangeTheme: admin.permissions?.canChangeTheme || false,
        assignedSiteIds: admin.assignedSiteIds || []
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        canChangeTheme: false,
        assignedSiteIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingAdmin ? `/api/admin/users/${editingAdmin._id}` : '/api/admin/users';
      const method = editingAdmin ? 'PATCH' : 'POST';
      
      const payload: any = {
        ...formData,
        permissions: { canChangeTheme: formData.canChangeTheme }
      };
      if (!formData.password && editingAdmin) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save admin');
      }

      toast.success(editingAdmin ? 'Admin updated' : 'Admin created successfully');
      setIsModalOpen(false);
      mutateAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Admin deleted');
      mutateAdmins();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (status === 'loading' || !admins) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="animate-spin mr-2" />
        <span>Syncing with core system...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Super Control Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-500">{session?.user?.email}</span>
          <button onClick={() => router.push('/dashboard')} className="flex items-center text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors">
            <LayoutDashboard size={18} className="mr-2" />
            Live View
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Admin Management</h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">Provision accounts, manage site ownership and set permissions.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Register New Admin</span>
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {Array.isArray(admins) && admins.map((admin: any) => (
            <div key={admin._id} className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{admin.name || 'Unnamed Admin'}</h3>
                  <div className="flex items-center space-x-3 text-sm text-slate-500 mt-1 font-medium font-mono uppercase tracking-tight">
                    <Mail size={14} className="text-slate-400" />
                    <span>{admin.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center ${admin.permissions?.canChangeTheme ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      <Palette size={12} className="mr-1.5" />
                      Theme Edit: {admin.permissions?.canChangeTheme ? 'Enabled' : 'Locked'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold uppercase tracking-wider flex items-center">
                      <Globe size={12} className="mr-1.5" />
                      {admin.assignedSiteIds?.length || 0} Assigned Sites
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleOpenModal(admin)}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Edit Admin"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(admin._id)}
                  className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete Admin"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Register/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingAdmin ? 'Modify Admin Account' : 'Register Admin'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-2">Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-2">{editingAdmin ? 'New Password (leave blank to keep)' : 'Initial Password'}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="themeToggle"
                  checked={formData.canChangeTheme}
                  onChange={e => setFormData({...formData, canChangeTheme: e.target.checked})}
                  className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="themeToggle" className="text-sm font-bold text-indigo-900 flex items-center cursor-pointer">
                  <Palette size={16} className="mr-2" />
                  Enable Global Theme Selection for this Admin
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-3">Assign Web Management Sites</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1">
                  {websites?.map((site: any) => (
                    <div 
                      key={site._id}
                      onClick={() => {
                        const ids = formData.assignedSiteIds.includes(site._id)
                          ? formData.assignedSiteIds.filter(id => id !== site._id)
                          : [...formData.assignedSiteIds, site._id];
                        setFormData({...formData, assignedSiteIds: ids});
                      }}
                      className={`cursor-pointer p-4 border rounded-2xl transition-all flex items-center justify-between ${formData.assignedSiteIds.includes(site._id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      <span className="text-sm font-bold truncate mr-2">{site.businessName}</span>
                      {formData.assignedSiteIds.includes(site._id) ? <Check size={16} /> : <Globe size={16} className="text-slate-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : editingAdmin ? 'Apply Changes' : 'Initialize Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Users, Plus, Trash2, Edit2, Shield, Globe, 
  Check, X, Loader2, LogOut, LayoutDashboard,
  Lock, Mail, User as UserIcon, Palette,
  ClipboardList, CheckCircle2, XCircle, Eye, Phone, FileText, Building2, Clock,
  Info, AtSign, Calendar, BadgeCheck, UserCog, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { data: admins, mutate: mutateAdmins } = useSWR('/api/admin/users', fetcher);
  const { data: websites } = useSWR('/api/websites', fetcher);
  const { data: pendingRegistrations, mutate: mutatePending } = useSWR('/api/admin/registrations', fetcher);
  const { data: profileApprovals, mutate: mutateProfileApprovals } = useSWR('/api/admin/profile-approvals', fetcher);
  
  const [activeTab, setActiveTab] = useState<'admins' | 'pending' | 'approvals'>('admins');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idPhotoModal, setIdPhotoModal] = useState<string | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    countryCode: '+977',
    phone: '',
    panNumber: '',
    businessName: '',
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
      let code = '+977';
      let phoneNum = admin.phone || '';
      if (phoneNum.startsWith('+')) {
         const parts = phoneNum.split(' ');
         if (parts.length > 1) {
            code = parts[0];
            phoneNum = parts.slice(1).join(' ');
         }
      }
      setFormData({
        username: admin.username || '',
        email: admin.email,
        password: '',
        name: admin.name || '',
        countryCode: code,
        phone: phoneNum,
        panNumber: admin.panNumber || '',
        businessName: admin.businessName || '',
        canChangeTheme: admin.permissions?.canChangeTheme || false,
        assignedSiteIds: admin.assignedSiteIds || []
      });
    } else {
      setEditingAdmin(null);
      setFormData({ username: '', email: '', password: '', name: '', countryCode: '+977', phone: '', panNumber: '', businessName: '', canChangeTheme: false, assignedSiteIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
    if (formData.countryCode === '+977' && phoneDigits.length !== 10) {
      toast.error('Nepal phone numbers must be exactly 10 digits.');
      return;
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      toast.error('Phone number must be between 7 and 15 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingAdmin ? `/api/admin/users/${editingAdmin._id}` : '/api/admin/users';
      const method = editingAdmin ? 'PATCH' : 'POST';
      const payload: any = { 
        ...formData, 
        phone: `${formData.countryCode} ${phoneDigits}`,
        permissions: { canChangeTheme: formData.canChangeTheme } 
      };
      if (!formData.password && editingAdmin) delete payload.password;

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to save admin'); }

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

  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error('Approval failed');
      toast.success(`✅ ${name} has been approved and can now log in.`);
      mutatePending();
      mutateAdmins();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`/api/admin/registrations/${rejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      toast.success(`${rejectModal.name}'s application has been rejected.`);
      setRejectModal({ open: false, id: '', name: '' });
      setRejectionReason('');
      mutatePending();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleProfileApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/profile-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`Profile changes ${action}d successfully`);
      mutateProfileApprovals();
      mutateAdmins();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendingCount = Array.isArray(pendingRegistrations) ? pendingRegistrations.length : 0;
  const approvalsCount = Array.isArray(profileApprovals) ? profileApprovals.length : 0;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="animate-spin mr-2" />
        <span>Syncing with core system...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2.5 bg-white border border-red-100 text-red-500 rounded-2xl hover:bg-red-50 transition-all"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'admins' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Users size={16} />
            Admin Accounts
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <ClipboardList size={16} />
            Pending Applications
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'pending' ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <UserCog size={16} />
            Profile Updates
            {approvalsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'approvals' ? 'bg-white text-indigo-600' : 'bg-amber-500 text-white'}`}>
                {approvalsCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── Tab: Admin Accounts ─── */}
        {activeTab === 'admins' && (
          <>
            <header className="flex items-center justify-between mb-8">
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
                    <button onClick={() => setViewingAdmin(admin)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Admin Info">
                      <Info size={20} />
                    </button>
                    <button onClick={() => handleOpenModal(admin)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Admin">
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDelete(admin._id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Admin">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {Array.isArray(admins) && admins.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No admin accounts yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Tab: Pending Applications ─── */}
        {activeTab === 'pending' && (
          <>
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Pending Applications</h2>
              <p className="text-slate-500 mt-1 text-sm font-medium">Review and approve or reject new admin registration requests.</p>
            </header>

            {!Array.isArray(pendingRegistrations) ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading...
              </div>
            ) : pendingRegistrations.length === 0 ? (
              <div className="text-center bg-white rounded-[32px] border border-slate-100 py-20 text-slate-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No pending applications.</p>
                <p className="text-sm mt-1">All registrations have been reviewed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingRegistrations.map((reg: any) => (
                  <div key={reg._id} className="bg-white border border-amber-100 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Left: Info */}
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <Clock size={24} />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{reg.businessName || reg.name || 'Unknown'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold uppercase tracking-wider flex items-center">
                                <Clock size={11} className="mr-1" /> Pending Review
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail size={14} className="text-slate-400" />
                              <span className="font-mono">{reg.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone size={14} className="text-slate-400" />
                              <span>{reg.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <FileText size={14} className="text-slate-400" />
                              <span>PAN: <strong>{reg.panNumber || 'N/A'}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Building2 size={14} className="text-slate-400" />
                              <span>{reg.businessName || 'N/A'}</span>
                            </div>
                          </div>
                          {reg.nationalIdPhoto && (
                            <button
                              onClick={() => setIdPhotoModal(reg.nationalIdPhoto)}
                              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all"
                            >
                              <Eye size={14} />
                              View National ID Photo
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 lg:flex-col lg:items-end shrink-0">
                        <button
                          onClick={() => handleApprove(reg._id, reg.businessName || reg.email)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, id: reg._id, name: reg.businessName || reg.email })}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold text-sm rounded-2xl border border-red-200 transition-all"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Tab: Profile Change Approvals ─── */}
        {activeTab === 'approvals' && (
          <>
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Profile Change Requests</h2>
              <p className="text-slate-500 mt-1 text-sm font-medium">Review and approve changes submitted by existing admins.</p>
            </header>

            {!Array.isArray(profileApprovals) ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading...
              </div>
            ) : profileApprovals.length === 0 ? (
              <div className="text-center bg-white rounded-[32px] border border-slate-100 py-20 text-slate-400">
                <UserCog size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No profile changes to review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {profileApprovals.map((admin: any) => (
                  <div key={admin._id} className="bg-white border border-indigo-100 rounded-[28px] p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <UserIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{admin.name || admin.email}</h3>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleProfileApproval(admin._id, 'approve')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
                        >
                          <CheckCircle2 size={16} /> Approve Changes
                        </button>
                        <button
                          onClick={() => handleProfileApproval(admin._id, 'reject')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold text-sm rounded-2xl border border-red-200 transition-all"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div>Field</div>
                        <div>Current Value</div>
                        <div>Requested Change</div>
                      </div>
                      {admin.pendingProfileChanges && Object.entries(admin.pendingProfileChanges).map(([key, value]: [string, any]) => (
                        <div key={key} className="grid grid-cols-3 p-4 border-b border-slate-100 last:border-0 items-center text-sm">
                          <div className="font-semibold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="text-slate-500 line-through truncate pr-4">{admin[key] || '—'}</div>
                          <div className="flex items-center gap-3 font-semibold text-emerald-600">
                            <ArrowRight size={14} className="text-slate-300 shrink-0" />
                            {key === 'nationalIdPhoto' ? (
                              <button onClick={() => setIdPhotoModal(value)} className="text-indigo-600 hover:underline flex items-center gap-1">
                                <Eye size={14} /> View New Photo
                              </button>
                            ) : (
                              <span className="truncate">{value}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Register/Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingAdmin ? 'Modify Admin Account' : 'Register Admin'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">Display Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">Business Name</label>
                  <input type="text" required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="Business Pvt. Ltd." />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">Username</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="admin123" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="admin@example.com" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">Phone</label>
                  <div className="relative flex">
                    <select 
                      value={formData.countryCode}
                      onChange={e => setFormData({...formData, countryCode: e.target.value})}
                      className="absolute inset-y-0 left-0 pl-2 pr-1 bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 z-10 text-[11px] font-bold appearance-none w-[65px] cursor-pointer"
                    >
                      <option value="+977">+977</option>
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+61">+61</option>
                      <option value="+971">+971</option>
                      <option value="+974">+974</option>
                    </select>
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                      className="w-full pl-[70px] pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" 
                      placeholder="98XXXXXXXX" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">PAN Number</label>
                  <input type="text" required value={formData.panNumber} onChange={e => setFormData({...formData, panNumber: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="PAN Number" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-2">{editingAdmin ? 'New Password (leave blank to keep)' : 'Initial Password'}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required={!editingAdmin} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <input type="checkbox" id="themeToggle" checked={formData.canChangeTheme} onChange={e => setFormData({...formData, canChangeTheme: e.target.checked})} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="themeToggle" className="text-sm font-bold text-indigo-900 flex items-center cursor-pointer">
                  <Palette size={16} className="mr-2" /> Enable Global Theme Selection for this Admin
                </label>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-3">Assign Web Management Sites</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1">
                  {websites?.map((site: any) => (
                    <div key={site._id} onClick={() => { const ids = formData.assignedSiteIds.includes(site._id) ? formData.assignedSiteIds.filter(id => id !== site._id) : [...formData.assignedSiteIds, site._id]; setFormData({...formData, assignedSiteIds: ids}); }} className={`cursor-pointer p-4 border rounded-2xl transition-all flex items-center justify-between ${formData.assignedSiteIds.includes(site._id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                      <span className="text-sm font-bold truncate mr-2">{site.businessName}</span>
                      {formData.assignedSiteIds.includes(site._id) ? <Check size={16} /> : <Globe size={16} className="text-slate-400" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : editingAdmin ? 'Apply Changes' : 'Initialize Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* National ID Photo Modal */}
      {idPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIdPhotoModal(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIdPhotoModal(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 shadow-lg font-bold z-10">
              <X size={20} />
            </button>
            <img src={idPhotoModal} alt="National ID" className="w-full rounded-2xl shadow-2xl border border-white/20" />
          </div>
        </div>
      )}

      {/* Admin Info Modal */}
      {viewingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setViewingAdmin(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <UserIcon size={30} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{viewingAdmin.name || viewingAdmin.businessName || 'Admin'}</h3>
                  <p className="text-indigo-200 text-sm font-mono mt-0.5">{viewingAdmin.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingAdmin(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition-all">
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[65vh]">
              {/* Status Badge */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  viewingAdmin.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : viewingAdmin.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  <BadgeCheck size={13} />
                  {viewingAdmin.status || 'ACTIVE'}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <Shield size={13} />
                  {viewingAdmin.role}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${viewingAdmin.permissions?.canChangeTheme ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  <Palette size={13} />
                  Theme: {viewingAdmin.permissions?.canChangeTheme ? 'Enabled' : 'Locked'}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <AtSign size={16} />, label: 'Username', value: viewingAdmin.username || '—' },
                  { icon: <Mail size={16} />, label: 'Email', value: viewingAdmin.email },
                  { icon: <Phone size={16} />, label: 'Phone', value: viewingAdmin.phone || '—' },
                  { icon: <FileText size={16} />, label: 'PAN Number', value: viewingAdmin.panNumber || '—' },
                  { icon: <Building2 size={16} />, label: 'Business Name', value: viewingAdmin.businessName || '—' },
                  { icon: <Globe size={16} />, label: 'Assigned Sites', value: `${viewingAdmin.assignedSiteIds?.length || 0} site(s)` },
                  { icon: <Calendar size={16} />, label: 'Registered', value: viewingAdmin.createdAt ? new Date(viewingAdmin.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-indigo-400 mt-0.5 shrink-0">{icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* National ID Photo */}
              {viewingAdmin.nationalIdPhoto && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">National ID Photo</p>
                  <img
                    src={viewingAdmin.nationalIdPhoto}
                    alt="National ID"
                    className="w-full rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIdPhotoModal(viewingAdmin.nationalIdPhoto)}
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">Click to enlarge</p>
                </div>
              )}

              {/* Rejection Reason */}
              {viewingAdmin.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 font-medium">{viewingAdmin.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-100 p-6 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => { setViewingAdmin(null); handleOpenModal(viewingAdmin); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Edit2 size={16} /> Edit Account
              </button>
              <button
                onClick={() => setViewingAdmin(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Application</h3>
            <p className="text-slate-500 text-sm mb-5">Optionally provide a reason for rejecting <strong>{rejectModal.name}</strong>.</p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none font-medium text-sm resize-none"
              rows={3}
              placeholder="e.g. Incomplete information, invalid ID..."
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setRejectModal({ open: false, id: '', name: '' }); setRejectionReason(''); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all">Cancel</button>
              <button onClick={handleReject} className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

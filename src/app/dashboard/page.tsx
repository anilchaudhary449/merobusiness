"use client";

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWebsiteSchema, CreateWebsiteInput } from '@/lib/validations/website';
import { PlusCircle, Link as LinkIcon, Settings, Globe, AlertCircle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'An error occurred while fetching the data.');
  return data;
});

export default function Dashboard() {
  const { data: websites, error, mutate, isLoading } = useSWR('/api/websites', fetcher);
  const [submitError, setSubmitError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWebsiteInput>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      businessName: '',
      slug: '',
    },
  });

  // Auto-generate slug when businessName changes
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('businessName', val, { shouldValidate: true });
    
    // Auto-generate a basic slug
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setValue('slug', generatedSlug, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateWebsiteInput) => {
    setSubmitError('');
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create website');
      }

      // Refresh the websites list instantly
      mutate();
      reset();
      toast.success(`${data.businessName} created successfully!`, {
        description: `Ready for editing.`
      });
    } catch (err: any) {
      toast.error('Failed to create website', {
        description: err.message
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete website');
      mutate();
      toast.success(`${name} deleted permanently`, {
        icon: <Trash2 size={16} />,
      });
    } catch (err: any) {
      toast.error('Error deleting site', {
        description: err.message
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistically update the list immediately
    mutate(
      websites.map((s: any) => s._id === id ? { ...s, isActive: !currentStatus } : s),
      false
    );
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Toggle failed');
      const { isActive } = await res.json();
      toast.success(isActive ? 'Store is now Live! 🟢' : 'Store paused 🔴', {
        description: isActive ? 'Customers can visit your website.' : 'Your website is temporarily hidden.',
      });
    } catch (err: any) {
      // Revert optimistic update on failure
      mutate();
      toast.error('Failed to update status', { description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => handleDelete(deleteModal.id, deleteModal.name)}
        title="Delete Website"
        message={`Are you sure you want to delete "${deleteModal.name}"? All content and products associated with this site will be permanently removed.`}
        confirmText="Yes, Delete Site"
      />
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm">
            <span>User: test@example.com</span>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <PlusCircle className="mr-2 text-indigo-500" />
              Create New Site
            </h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  {...register('businessName')}
                  onChange={handleBusinessNameChange}
                  className={`w-full px-4 py-2 border rounded-xl outline-none transition-all ${errors.businessName ? 'border-red-300 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'}`}
                  placeholder="e.g. DR Collections"
                />
                {errors.businessName && <p className="mt-1 text-sm text-red-500">{errors.businessName.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 text-gray-500 px-3 py-2 rounded-l-xl border border-r-0 border-gray-200 text-sm">merobusiness.com/</span>
                  <input
                    {...register('slug')}
                    className={`w-full px-3 py-2 border rounded-r-xl outline-none transition-all ${errors.slug ? 'border-red-300 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'}`}
                    placeholder="dr-collections"
                  />
                </div>
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
              </div>
              
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-md mt-4"
              >
                {isSubmitting ? 'Creating...' : 'Create Website'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Websites</h2>
            
            {isLoading ? (
              <div className="text-gray-500 animate-pulse">Loading websites...</div>
            ) : error ? (
              <div className="bg-red-50 p-10 rounded-2xl border border-red-100 text-center text-red-600">
                {error.message || 'Failed to load websites.'}
              </div>
            ) : !websites || websites.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500">
                You haven't created any websites yet.
              </div>
            ) : (
              websites.map((site: any) => (
              <div key={site._id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:-translate-y-1 ${site.isActive === false ? 'border-red-100 opacity-75' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{site.businessName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${site.isActive === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${site.isActive === false ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {site.isActive === false ? 'Inactive' : 'Live'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <LinkIcon size={14} className="mr-1" />
                      merobusiness.com/{site.slug}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Active/Inactive Toggle */}
                    <button
                      onClick={() => handleToggleActive(site._id, site.isActive !== false)}
                      title={site.isActive === false ? 'Click to activate' : 'Click to deactivate'}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        site.isActive === false
                          ? 'text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-700'
                          : 'text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      {site.isActive === false
                        ? <><ToggleLeft size={18} /><span>Activate</span></>
                        : <><ToggleRight size={18} /><span>Live</span></>
                      }
                    </button>
                    <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Globe size={16} className="mr-1.5" />
                      View
                    </a>
                    <Link href={`/dashboard/${site._id}`} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                      <Settings size={16} className="mr-1.5" />
                      Edit
                    </Link>
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, id: site._id, name: site.businessName })}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Website"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

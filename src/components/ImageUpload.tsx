"use client";

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Check, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
        toast.success(`${label || 'Image'} uploaded successfully`);
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the click-to-upload
    if (!value || !value.startsWith('/uploads/')) {
      onChange(''); // Just clear the URL if it's external
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDeleteFile = async () => {
    setUploading(true);
    try {
      const res = await fetch(`/api/upload?url=${encodeURIComponent(value)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onChange('');
        toast.success(`${label || 'Image'} deleted permanently`);
      } else {
        toast.error('Failed to delete file from server');
      }
    } catch (err) {
      toast.error('Connection error while deleting');
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteFile}
        title="Delete Image Permanently?"
        message="This will physically remove the image from the server. This action cannot be undone."
        confirmText="Yes, Delete File"
      />
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="flex flex-col space-y-3">
        {/* Upload Zone */}
        {!showUrlInput ? (
          <div 
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer group
              border-2 border-dashed rounded-xl p-4 transition-all
              flex flex-col items-center justify-center space-y-2
              ${dragActive ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 hover:border-brand-accent/50 bg-gray-50/50'}
              ${uploading ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden" 
              accept="image/*"
            />
            
            {uploading ? (
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
            ) : value ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <div className="bg-white/90 text-gray-900 px-3 py-1 text-xs font-bold rounded-full">Change</div>
                  <button 
                    onClick={handleDeleteFile}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    title="Delete permanently"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600">Click or Drag Image</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              </>
            )}
          </div>
        ) : (
          /* URL Fallback Input */
          <div className="relative">
            <input 
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-accent outline-none"
              placeholder="Paste image URL here..."
            />
            <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Toggle between Upload and URL */}
        <button 
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-brand-accent font-medium hover:underline flex items-center self-end"
        >
          {showUrlInput ? (
            <><Upload className="w-3 h-3 mr-1" /> Use Upload instead</>
          ) : (
            <><LinkIcon className="w-3 h-3 mr-1" /> Use Manual URL instead</>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface SortableProductItemProps {
  id: string;
  index: number;
  product: any;
  updateProduct: (index: number, field: string, value: string) => void;
  removeProduct: (index: number) => void;
}

export default function SortableProductItem({ id, index, product, updateProduct, removeProduct }: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4 relative group ${isDragging ? 'shadow-2xl border-brand-accent' : ''}`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center space-x-2">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded-md text-gray-400 group-hover:text-gray-600 transition-colors"
          >
            <GripVertical size={18} />
          </div>
          <span className="font-bold text-xs text-brand-accent uppercase tracking-wider">Product {index + 1}</span>
        </div>
        
        <button 
          onClick={() => removeProduct(index)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <input 
          type="text" 
          value={product.name} 
          onChange={(e) => updateProduct(index, 'name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-accent/30"
          placeholder="Product Name"
        />
        <input 
          type="text" 
          value={product.price} 
          onChange={(e) => updateProduct(index, 'price', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-accent/30"
          placeholder="Price (e.g. Rs. 1500)"
        />
        <ImageUpload 
          value={product.imageUrl} 
          onChange={(url) => updateProduct(index, 'imageUrl', url)}
          label="Product Image"
        />
      </div>
    </div>
  );
}

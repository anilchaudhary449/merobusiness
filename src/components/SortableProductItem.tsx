"use client";

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import ImageUpload from './ImageUpload';

const EU_SIZE_OPTIONS = ['', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const INT_SIZE_OPTIONS = ['', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLOR_MAP: Record<string, string> = {
  '#000000': 'Black', '#FFFFFF': 'White', '#FF0000': 'Red', '#00FF00': 'Green', '#0000FF': 'Blue',
  '#FFFF00': 'Yellow', '#FF00FF': 'Magenta', '#00FFFF': 'Cyan', '#808080': 'Gray', '#800000': 'Maroon',
  '#008000': 'Olive', '#000080': 'Navy', '#808000': 'Teal', '#800080': 'Purple', '#FFA500': 'Orange',
  '#A52A2A': 'Brown', '#FFC0CB': 'Pink', '#FFD700': 'Gold', '#C0C0C0': 'Silver', '#F5F5DC': 'Beige'
};

const NAME_TO_HEX: Record<string, string> = Object.entries(COLOR_MAP).reduce((acc, [hex, name]) => {
  acc[name.toLowerCase()] = hex;
  return acc;
}, {} as Record<string, string>);

const parsePriceToNumber = (price: string): number => {
  if (!price) return 0;
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
};

interface SortableProductItemProps {
  id: string;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  updateProduct: (index: number, field: string | Record<string, any>, value?: any) => void;
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

  const [expanded, setExpanded] = useState(false); // Toggle to keep UI clean

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddColor = () => {
    const currentColors = product.colors || [];
    updateProduct(index, 'colors', [...currentColors, { name: 'Color', hex: '#000000' }]);
  };

  const handleUpdateColor = (colorIndex: number, field: 'name' | 'hex', value: string) => {
    const currentColors = [...(product.colors || [])];
    let name = currentColors[colorIndex].name;
    let hex = currentColors[colorIndex].hex;

    if (field === 'hex') {
      hex = value;
      const upperHex = value.toUpperCase();
      if (COLOR_MAP[upperHex]) {
        name = COLOR_MAP[upperHex];
      }
    } else {
      name = value;
      const lowerName = value.toLowerCase().trim();
      if (NAME_TO_HEX[lowerName]) {
        hex = NAME_TO_HEX[lowerName];
      }
    }

    currentColors[colorIndex] = { name, hex };
    updateProduct(index, 'colors', currentColors);
  };

  const handleRemoveColor = (colorIndex: number) => {
    const currentColors = [...(product.colors || [])];
    currentColors.splice(colorIndex, 1);
    updateProduct(index, 'colors', currentColors);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4 relative group ${isDragging ? 'shadow-2xl border-indigo-500' : ''}`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center space-x-2">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-200 rounded-lg text-gray-400 group-hover:text-gray-600 transition-colors touch-target flex items-center justify-center"
          >
            <GripVertical size={18} />
          </div>
          <span className="font-bold text-xs text-indigo-600 uppercase tracking-wider">Product {index + 1}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50 flex items-center justify-center"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button 
            onClick={() => removeProduct(index)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 touch-target flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Basic Info always visible */}
        <input 
          type="text" 
          value={product.name || ''} 
          onChange={(e) => updateProduct(index, 'name', e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 font-bold"
          placeholder="Product Name"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Selling Price</label>
            <input 
              type="text" 
              value={product.price || ''} 
              onChange={(e) => {
                const sp = e.target.value;
                const mpNum = parsePriceToNumber(product.markedPrice || '');
                const spNum = parsePriceToNumber(sp);
                let discount = product.discountPercent;
                if (mpNum > 0 && spNum > 0) {
                   discount = Math.round(((mpNum - spNum) / mpNum) * 100);
                }
                updateProduct(index, { price: sp, discountPercent: discount });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="e.g. Rs. 1500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Quantity</label>
            <input 
              type="number" 
              value={product.quantity ?? 0} 
              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="0"
            />
          </div>
        </div>

        {/* Collapsible advanced details */}
        {expanded && (
          <div className="pt-3 border-t border-gray-200/60 mt-3 space-y-4 animate-in fade-in slide-in-from-top-2">
            
            {/* Categorization */}
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Category</label>
                  <input 
                    type="text" 
                    value={product.category || ''} 
                    onChange={(e) => updateProduct(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="e.g. Clothing"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Sub-Category</label>
                  <input 
                    type="text" 
                    value={product.subCategory || ''} 
                    onChange={(e) => updateProduct(index, 'subCategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="e.g. Shirts"
                  />
               </div>
            </div>

            {/* Advanced Pricing */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Marked Price</label>
                  <input 
                    type="text" 
                    value={product.markedPrice || ''} 
                    onChange={(e) => {
                      const mp = e.target.value;
                      const mpNum = parsePriceToNumber(mp);
                      const spNum = parsePriceToNumber(product.price || '');
                      let discount = product.discountPercent;
                      if (mpNum > 0 && spNum > 0) {
                         discount = Math.round(((mpNum - spNum) / mpNum) * 100);
                      }
                      updateProduct(index, { markedPrice: mp, discountPercent: discount });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Original Price"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cost Price</label>
                  <input 
                    type="text" 
                    value={product.costPrice || ''} 
                    onChange={(e) => updateProduct(index, 'costPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Actual Cost"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Discount %</label>
                  <input 
                    type="number" 
                    value={product.discountPercent || ''}
                    onChange={(e) => {
                      const discount = parseInt(e.target.value) || 0;
                      const mpNum = parsePriceToNumber(product.markedPrice || '');
                      let sp = product.price;
                      if (mpNum > 0 && discount >= 0) {
                         const spNum = Math.round(mpNum - (mpNum * discount / 100));
                         sp = `Rs. ${spNum}`;
                      }
                      updateProduct(index, { discountPercent: discount, price: sp });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="%"
                  />
               </div>
            </div>

            {/* Colors */}
            <div>
               <div className="flex items-center justify-between mb-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Color Variants</label>
                 <button onClick={handleAddColor} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100">
                    <Plus size={10} /> Add Color
                 </button>
               </div>
               <div className="space-y-2">
                 {(product.colors || []).map((color: any, cIdx: number) => (
                   <div key={cIdx} className="flex gap-2 items-center bg-white p-2 border border-gray-100 rounded-lg">
                      <input 
                        type="color" 
                        value={color.hex || '#000000'}
                        onChange={(e) => handleUpdateColor(cIdx, 'hex', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer p-0 border border-gray-200 shrink-0"
                      />
                      <input 
                        type="text"
                        value={color.name || ''}
                        onChange={(e) => handleUpdateColor(cIdx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                        placeholder="Color Name (e.g. Matte Black)"
                      />
                      <button onClick={() => handleRemoveColor(cIdx)} className="text-gray-400 hover:text-red-500 p-1">
                        <X size={14} />
                      </button>
                   </div>
                 ))}
                 {(!product.colors || product.colors.length === 0) && (
                   <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-gray-100 text-center">No colors added.</p>
                 )}
               </div>
            </div>

            {/* Sizes & Dimensions */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Sizes</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <select
                  value={product.sizeEU || ''}
                  onChange={(e) => updateProduct(index, 'sizeEU', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
                >
                  {EU_SIZE_OPTIONS.map((size) => (
                    <option key={size || 'empty-eu'} value={size}>{size ? `EU ${size}` : 'Select EU size'}</option>
                  ))}
                </select>
                <select
                  value={product.sizeINT || ''}
                  onChange={(e) => updateProduct(index, 'sizeINT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
                >
                  {INT_SIZE_OPTIONS.map((size) => (
                    <option key={size || 'empty-int'} value={size}>{size || 'Select INT size'}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={product.dimensions?.length || ''}
                  onChange={(e) => updateProduct(index, 'dimensions.length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Length"
                />
                <input
                  type="text"
                  value={product.dimensions?.width || ''}
                  onChange={(e) => updateProduct(index, 'dimensions.width', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Width"
                />
                <input
                  type="text"
                  value={product.dimensions?.height || ''}
                  onChange={(e) => updateProduct(index, 'dimensions.height', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Height"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
               <input 
                 type="checkbox" 
                 id={`newArrival-${id}`}
                 checked={product.isNewArrival || false}
                 onChange={(e) => updateProduct(index, 'isNewArrival', e.target.checked)}
                 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
               />
               <label htmlFor={`newArrival-${id}`} className="text-xs font-bold text-indigo-900 cursor-pointer">Mark as New Arrival</label>
            </div>

          </div>
        )}

        <ImageUpload 
          value={product.imageUrl} 
          onChange={(url) => updateProduct(index, 'imageUrl', url)}
          label="Product Image"
        />
      </div>
    </div>
  );
}

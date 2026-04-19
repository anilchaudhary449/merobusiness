"use client";

import React, { useMemo } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Target, Package, 
  MapPin, Clock, CreditCard, ChevronRight, CheckCircle2
} from 'lucide-react';

interface AnalyticsTabProps {
  orders: any[];
}

export default function AnalyticsTab({ orders }: AnalyticsTabProps) {
  
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let pendingDues = 0;
    let totalLoss = 0;
    
    const categoryStats: Record<string, { revenue: number, sold: number }> = {};
    const itemStats: Record<string, { name: string, revenue: number, sold: number, profit: number }> = {};
    const pendingOrders: any[] = [];

    orders.forEach(o => {
      const p = o.product || {};
      
      const parsePrice = (priceVal: any) => {
         if (priceVal === undefined || priceVal === null) return 0;
         if (typeof priceVal === 'number') return priceVal;
         const match = String(priceVal).match(/[\d,]+(\.\d+)?/);
         if (!match) return 0;
         const cleanNum = match[0].replace(/,/g, '');
         return parseFloat(cleanNum) || 0;
      };

      const sellPrice = parsePrice(p.price) * (p.quantity || 1);
      const costPriceRaw = parsePrice(p.costPrice) * (p.quantity || 1);
      const actualProfit = sellPrice - costPriceRaw;
      
      const catKey = p.category ? (p.subCategory ? `${p.category} > ${p.subCategory}` : p.category) : 'Uncategorized';
      if (!categoryStats[catKey]) categoryStats[catKey] = { revenue: 0, sold: 0 };
      
      const itemKey = p.id || p.name;
      if (!itemStats[itemKey]) itemStats[itemKey] = { name: p.name, revenue: 0, sold: 0, profit: 0 };

      // Classification Logic
      if (o.status === 'DELIVERED') {
        totalRevenue += sellPrice;
        totalProfit += actualProfit;
        
        categoryStats[catKey].revenue += sellPrice;
        categoryStats[catKey].sold += (p.quantity || 1);

        itemStats[itemKey].revenue += sellPrice;
        itemStats[itemKey].sold += (p.quantity || 1);
        itemStats[itemKey].profit += actualProfit;
      } else if (o.status === 'CANCELLED') {
        // Technically pure loss if you shipped it and it was returned, but for now we'll just track if cost was invested without return, though ideally cancelled = 0.
        // Let's just track if they sold at negative margin in delivered:
        if (actualProfit < 0 && o.status === 'DELIVERED') {
          totalLoss += Math.abs(actualProfit);
        }
      } else {
        // Pending states
        pendingDues += sellPrice;
        pendingOrders.push({
          ...o,
          parsedSellPrice: sellPrice
        });
      }
    });

    const topCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1].revenue - a[1].revenue);

    const topItems = Object.values(itemStats)
      .sort((a, b) => b.sold - a.sold);

    return { totalRevenue, totalProfit, pendingDues, totalLoss, topCategories, topItems, pendingOrders };
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">Rs. {stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Profit</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">Rs. {stats.totalProfit.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Dues</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">Rs. {stats.pendingDues.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Sellers</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.topItems.length > 0 ? stats.topItems[0].name : '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Performance */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-white">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-indigo-600" size={20} />
            <h2 className="text-xl font-black text-slate-900">Sales by Category</h2>
          </div>
          <div className="space-y-4">
            {stats.topCategories.length > 0 ? stats.topCategories.map(([category, data], idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-slate-800">{category}</p>
                  <p className="text-xs text-slate-500">{data.sold} items sold</p>
                </div>
                <p className="font-black text-emerald-600">Rs. {data.revenue.toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No category data available yet.</p>
            )}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-white">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-indigo-600" size={20} />
            <h2 className="text-xl font-black text-slate-900">Top Performing Items</h2>
          </div>
          <div className="space-y-4">
            {stats.topItems.slice(0, 5).length > 0 ? stats.topItems.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">{idx + 1}</span>
                  <div>
                    <p className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sold} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">Rs. {item.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-700/60 font-bold uppercase">Profit: Rs. {item.profit.toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No sales data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Dues Ledger */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
             <CreditCard size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Pending Dues Ledger</h2>
        </div>
        
        {stats.pendingOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-black">
                  <th className="pb-4 px-4">Customer</th>
                  <th className="pb-4 px-4">Location</th>
                  <th className="pb-4 px-4 hidden md:table-cell">Date & Time</th>
                  <th className="pb-4 px-4">Order Status</th>
                  <th className="pb-4 px-4">Amount Due</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.pendingOrders.map((order, idx) => (
                  <tr key={order._id || idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50/50 last:border-0">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800">{order.customerId?.name || 'Guest'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{order.customerId?.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-1">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-600 line-clamp-2 max-w-[150px]">{order.customerId?.deliveryAddress || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                         <span className={`px-2 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg ${order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                           {order.status}
                         </span>
                         <span className={`px-2 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg ${order.paymentMethod === 'ONLINE_PAYMENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                           {order.paymentMethod === 'ONLINE_PAYMENT' ? 'Online' : 'COD'}
                         </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-black text-slate-900">Rs. {order.parsedSellPrice.toLocaleString()}</p>
                      {order.paymentMethod === 'ONLINE_PAYMENT' && order.paymentReceipt && (
                        <a href={order.paymentReceipt} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-500 font-bold underline mt-1 block">View Receipt</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
             <p className="text-slate-600 font-bold">All caught up!</p>
             <p className="text-xs text-slate-400 mt-1">There are no pending dues from customers.</p>
          </div>
        )}
      </div>

    </div>
  );
}

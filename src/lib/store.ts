
"use client"

import { useState, useEffect } from 'react';
import { Order, Payment, AppState, Activity } from './types';

const STORAGE_KEY = 'mudabbir_al_arbab_state';

const defaultState: AppState = {
  orders: [],
  payments: [],
  activities: [],
  customerNotes: {},
  capital: 50000,
};

export function useAccountingStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...defaultState,
          ...parsed,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
          activities: Array.isArray(parsed.activities) ? parsed.activities : [],
          customerNotes: parsed.customerNotes || {},
          capital: typeof parsed.capital === 'number' ? parsed.capital : 50000,
        });
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addActivity = (type: 'order' | 'payment' | 'delete', description: string) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      type: type === 'delete' ? 'payment' : type,
      description,
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      activities: [newActivity, ...(prev.activities || [])].slice(0, 20)
    }));
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt' | 'deliveredQuantity' | 'receivedQuantity'> & { receivedQuantity?: number }) => {
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      receivedQuantity: order.receivedQuantity || 0,
      deliveredQuantity: 0,
    };
    setState(prev => ({ ...prev, orders: [...prev.orders, newOrder] }));
    const target = order.customerName === "المخزن العام" ? "المخزن" : `العميل ${order.customerName}`;
    addActivity('order', `تم تسجيل بضاعة واردة لـ ${target}: ${order.productName}`);
  };

  const deleteOrder = (orderId: string) => {
    const orderToDelete = state.orders.find(o => o.id === orderId);
    if (!orderToDelete) return;

    setState(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId)
    }));
    addActivity('order', `تم حذف سجل بضاعة: ${orderToDelete.productName}`);
  };

  const updateDeliveredQuantity = (orderId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, deliveredQuantity: quantity } : o)
    }));
  };

  const updateReceivedQuantity = (orderId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, receivedQuantity: quantity } : o)
    }));
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'date'>) => {
    const newPayment: Payment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      date: Date.now(),
    };
    setState(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
    const typeLabel = payment.type === 'received' ? 'استلام من' : 'صرف لـ';
    addActivity('payment', `تم ${typeLabel} ${payment.entityName} مبلغ ${payment.amount} ج.م`);
  };

  const updateCustomerNote = (customerName: string, note: string) => {
    setState(prev => ({
      ...prev,
      customerNotes: { ...prev.customerNotes, [customerName]: note }
    }));
  };

  const updateInitialCapital = (amount: number) => {
    setState(prev => ({ ...prev, capital: amount }));
    addActivity('payment', `تم تحديث رأس المال الابتدائي إلى ${amount.toLocaleString()} ج.م`);
  };

  const paymentsReceived = (state.payments || []).filter(p => p.type === 'received').reduce((acc, p) => acc + p.amount, 0);
  const paymentsPaid = (state.payments || []).filter(p => p.type === 'paid').reduce((acc, p) => acc + p.amount, 0);
  
  const totalSalesValue = (state.orders || []).reduce((acc, o) => acc + (o.sellingPrice * (o.deliveredQuantity || 0)), 0);
  const totalWholesaleValue = (state.orders || []).reduce((acc, o) => acc + (o.wholesalePrice * (o.receivedQuantity || 0)), 0);

  const inventoryValue = (state.orders || []).reduce((acc, o) => {
    const inStock = (o.receivedQuantity || 0) - (o.deliveredQuantity || 0);
    return acc + (Math.max(0, inStock) * o.wholesalePrice);
  }, 0);

  const summary = {
    availableCapital: (state.capital || 0) + paymentsReceived - paymentsPaid,
    owedByCustomers: totalSalesValue - paymentsReceived,
    owedToSuppliers: totalWholesaleValue - paymentsPaid,
    inventoryValue: inventoryValue,
    totalProfits: (state.orders || []).reduce((acc, o) => acc + ((o.sellingPrice - o.wholesalePrice) * (o.deliveredQuantity || 0)), 0),
  };

  return {
    state,
    isLoaded,
    addOrder,
    deleteOrder,
    updateDeliveredQuantity,
    updateReceivedQuantity,
    addPayment,
    updateCustomerNote,
    updateInitialCapital,
    summary
  };
}

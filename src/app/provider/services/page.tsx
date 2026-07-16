// src/app/provider/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  price_type: 'fixed' | 'hourly' | 'daily' | 'negotiable';
}

const priceTypeLabels: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Per Hour',
  daily: 'Per Day',
  negotiable: 'Negotiable',
};

export default function ProviderServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'fixed' as Service['price_type'],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchServices();
  }, [user]);

  async function fetchServices() {
    setLoading(true);
    const { data } = await db
      .from('provider_services')
      .select('*')
      .eq('provider_id', user!.id)
      .order('created_at', { ascending: true });
    setServices((data as any[]) || []);
    setLoading(false);
  }

  function openAddModal() {
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', price_type: 'fixed' });
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      price_type: service.price_type,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        provider_id: user!.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price,
        price_type: formData.price_type,
      };

      if (editingService) {
        const { error } = await db
          .from('provider_services')
          .update(payload as any)
          .eq('id', editingService.id);
        if (error) throw error;
        toast.success('Service updated');
      } else {
        const { error } = await db
          .from('provider_services')
          .insert(payload as any);
        if (error) throw error;
        toast.success('Service added');
      }
      fetchServices();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const { error } = await db
        .from('provider_services')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Service deleted');
      fetchServices();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services & Pricing</h1>
        <button
          onClick={openAddModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <NimartSpinner size="md" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No services added yet.</p>
          <button onClick={openAddModal} className="mt-2 text-primary-600 hover:underline">
            Add your first service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg font-bold text-primary-600">
                      ₦{service.price.toLocaleString()}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {priceTypeLabels[service.price_type]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Engine Oil Change"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Brief description of the service"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price Type</label>
                  <select
                    value={formData.price_type}
                    onChange={e => setFormData({ ...formData, price_type: e.target.value as Service['price_type'] })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Per Hour</option>
                    <option value="daily">Per Day</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'Saving...' : editingService ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
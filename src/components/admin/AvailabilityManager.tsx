import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvailabilitySlot {
  id: string;
  location: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  max_bookings: number;
}

const locations = [
  { id: 'online', name: 'Online', icon: '💻' },
  { id: 'studio', name: 'Studio', icon: '🏢' },
  { id: 'biostore', name: 'Shop Online', icon: '🌿' },
  { id: 'gym', name: 'Palestra', icon: '💪' }
];

const daysOfWeek = [
  { id: 0, name: 'Domenica' },
  { id: 1, name: 'Lunedì' },
  { id: 2, name: 'Martedì' },
  { id: 3, name: 'Mercoledì' },
  { id: 4, name: 'Giovedì' },
  { id: 5, name: 'Venerdì' },
  { id: 6, name: 'Sabato' }
];

export default function AvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [formData, setFormData] = useState({
    location: 'online',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    max_bookings: 1,
    is_active: true
  });

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadSlots(selectedLocation);
    } else {
      loadSlots();
    }
  }, [selectedLocation]);

  const loadSlots = async (locationFilter?: string) => {
    try {
      let query = supabase
        .from('availability_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (locationFilter) {
        query = query.eq('location', locationFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSlot) {
        const { error } = await supabase
          .from('availability_slots')
          .update(formData)
          .eq('id', editingSlot.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('availability_slots')
          .insert([formData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingSlot(null);
      setFormData({
        location: 'online',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        max_bookings: 1,
        is_active: true
      });
      loadSlots(selectedLocation);
    } catch (error) {
      console.error('Error saving slot:', error);
      alert('Errore nel salvare lo slot');
    }
  };

  const handleEdit = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setFormData({
      location: slot.location,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_bookings: slot.max_bookings,
      is_active: slot.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo slot?')) return;

    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSlots(selectedLocation);
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Errore nell\'eliminazione dello slot');
    }
  };

  const toggleActive = async (slot: AvailabilitySlot) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .update({ is_active: !slot.is_active })
        .eq('id', slot.id);

      if (error) throw error;
      loadSlots(selectedLocation);
    } catch (error) {
      console.error('Error toggling slot:', error);
    }
  };

  const groupSlotsByDay = (slots: AvailabilitySlot[]) => {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.day_of_week]) {
        acc[slot.day_of_week] = [];
      }
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {} as Record<number, AvailabilitySlot[]>);
  };

  const groupedSlots = groupSlotsByDay(slots);

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestione Disponibilità</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configura gli orari disponibili per ogni location di consulenza
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlot(null);
            setShowForm(!showForm);
            setFormData({
              location: 'online',
              day_of_week: 1,
              start_time: '09:00',
              end_time: '10:00',
              max_bookings: 1,
              is_active: true
            });
          }}
          className="px-4 py-2 bg-brand-burgundy text-white rounded-xl hover:bg-opacity-90 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Slot</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtra per Location
        </label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
        >
          <option value="">Tutte le location</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>
              {location.icon} {location.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingSlot ? 'Modifica Slot' : 'Nuovo Slot'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                required
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.icon} {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giorno della Settimana
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                required
              >
                {daysOfWeek.map(day => (
                  <option key={day.id} value={day.id}>
                    {day.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ora Inizio
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ora Fine
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero Massimo Prenotazioni
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_bookings}
                onChange={(e) => setFormData({ ...formData, max_bookings: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Slot Attivo
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90"
              >
                {editingSlot ? 'Aggiorna' : 'Crea'} Slot
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSlot(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {daysOfWeek.map(day => {
          const daySlots = groupedSlots[day.id] || [];
          if (daySlots.length === 0 && selectedLocation) return null;

          return (
            <div key={day.id} className="bg-white rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-brand-burgundy/10 to-brand-gold/10 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-brand-burgundy" />
                  <h4 className="font-semibold text-gray-900">{day.name}</h4>
                  <span className="text-sm text-gray-600">
                    ({daySlots.length} slot{daySlots.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {daySlots.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Nessuno slot configurato per questo giorno
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        slot.is_active
                          ? 'bg-white border-green-200 hover:border-green-300'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy text-sm rounded-lg font-medium">
                            {locations.find(l => l.id === slot.location)?.icon} {locations.find(l => l.id === slot.location)?.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            Max {slot.max_bookings} prenotazion{slot.max_bookings !== 1 ? 'i' : 'e'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(slot)}
                          className={`p-2 rounded-lg transition-colors ${
                            slot.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={slot.is_active ? 'Disattiva' : 'Attiva'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(slot)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          title="Modifica"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

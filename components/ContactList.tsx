
import React, { useState } from 'react';
import { Plus, Trash2, UserPlus, Phone, UserCheck, PhoneCall } from 'lucide-react';
import { EmergencyContact } from '../types';

interface Props {
  contacts: EmergencyContact[];
  setContacts: React.Dispatch<React.SetStateAction<EmergencyContact[]>>;
}

const ContactList: React.FC<Props> = ({ contacts, setContacts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', relation: '' });

  const handleAdd = () => {
    if (contacts.length >= 5) return;
    if (!formData.name || !formData.phone) return;

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      ...formData
    };

    setContacts([...contacts, newContact]);
    setFormData({ name: '', phone: '', relation: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="py-6 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Trusted Circle</h2>
          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            {contacts.length}/5
          </span>
        </div>
        <p className="text-slate-400 text-xs mb-6 font-medium">These contacts receive SMS and live location during SOS events.</p>

        <div className="space-y-4">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                <UserCheck size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{contact.name}</p>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <span className="text-indigo-600/60">{contact.relation}</span>
                  <span>•</span>
                  <span>{contact.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a 
                  href={`tel:${contact.phone}`}
                  className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  title="Call Contact"
                >
                  <PhoneCall size={18} />
                </a>
                <button 
                  onClick={() => handleDelete(contact.id)}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {contacts.length === 0 && !isAdding && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <UserPlus size={40} />
              </div>
              <p className="text-slate-400 text-sm font-bold">No emergency contacts yet.</p>
              <p className="text-[10px] text-slate-300 mt-1 uppercase font-black tracking-widest">Safety first, add them now</p>
            </div>
          )}

          {isAdding && (
            <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-200 space-y-4 animate-in zoom-in-95 duration-200 shadow-xl shadow-indigo-100/50">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Name</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 00000 00000" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mother, Sister" 
                    value={formData.relation}
                    onChange={(e) => setFormData({...formData, relation: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleAdd}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  Confirm & Save
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="bg-slate-100 text-slate-500 px-6 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isAdding && contacts.length < 5 && (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-3 py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
            >
              <Plus size={24} />
              Add Trusted Person
            </button>
          )}
        </div>
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
          <PhoneCall size={24} />
        </div>
        <div>
          <h4 className="font-black text-amber-900 text-sm mb-1 uppercase tracking-tight">Direct Emergency Calls</h4>
          <p className="text-amber-800/70 text-[11px] leading-relaxed">
            Click the phone icon next to a contact to initiate a direct call. In Panic Mode, Aparajita attempts to connect these automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactList;

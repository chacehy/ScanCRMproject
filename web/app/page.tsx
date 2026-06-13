'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import {
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Loader2,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  X,
  Check,
  Flame,
  Archive,
  RefreshCw,
  Clock,
  Compass,
  LogOut
} from 'lucide-react';

interface LeadDetails {
  company?: string;
  job_title?: string;
  website?: string;
  where_met?: string;
  why_met?: string;
  [key: string]: unknown;
}

interface Lead {
  id: string;
  type: string;
  created_at: string;
  status: string; // 'new', 'followed_up', 'hot', 'archived'
  notes: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  details: LeadDetails;
}

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formWhereMet, setFormWhereMet] = useState('');
  const [formWhyMet, setFormWhyMet] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState('new');

  // Auth States
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Custom Alert & Confirm Dialog State
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDialog((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Load leads from Supabase
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch leads on session change
  useEffect(() => {
    if (session?.user) {
      Promise.resolve().then(() => {
        fetchLeads();
      });
    } else {
      Promise.resolve().then(() => setLeads([]));
    }
  }, [session]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setActionLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          showAlert('Account Created', 'Successfully registered and signed in.');
        } else {
          showAlert('Check Your Inbox', 'Please check your email for the confirmation link to complete registration.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setSession(data.session);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setSelectedLead(null);
      setIsEditPanelOpen(false);
      setIsAddModalOpen(false);
    } catch (err) {
      const error = err as Error;
      console.error('Error signing out:', error);
      showAlert('Error', 'Failed to sign out.');
    } finally {
      setActionLoading(false);
    }
  };

  // Set form values when editing a lead
  const openEditPanel = (lead: Lead) => {
    setSelectedLead(lead);
    setFormName(lead.customer_name || '');
    setFormCompany(lead.details?.company || '');
    setFormTitle(lead.details?.job_title || '');
    setFormEmail(lead.customer_email || '');
    setFormPhone(lead.customer_phone || '');
    setFormWebsite(lead.details?.website || '');
    setFormWhereMet(lead.details?.where_met || '');
    setFormWhyMet(lead.details?.why_met || '');
    setFormNotes(lead.notes || '');
    setFormStatus(lead.status || 'new');
    setIsEditPanelOpen(true);
  };

  const openAddModal = () => {
    setFormName('');
    setFormCompany('');
    setFormTitle('');
    setFormEmail('');
    setFormPhone('');
    setFormWebsite('');
    setFormWhereMet('');
    setFormWhyMet('');
    setFormNotes('');
    setFormStatus('new');
    setIsAddModalOpen(true);
  };

  // Save changes (Update lead)
  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      setActionLoading(true);
      const updatedDetails: LeadDetails = {
        ...selectedLead.details,
        company: formCompany,
        job_title: formTitle,
        website: formWebsite,
        where_met: formWhereMet,
        why_met: formWhyMet,
      };

      const { error } = await supabase
        .from('leads')
        .update({
          customer_name: formName,
          customer_email: formEmail,
          customer_phone: formPhone,
          notes: formNotes,
          status: formStatus,
          details: updatedDetails,
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      // Update local state
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? {
                ...l,
                customer_name: formName,
                customer_email: formEmail,
                customer_phone: formPhone,
                notes: formNotes,
                status: formStatus,
                details: updatedDetails,
              }
            : l
        )
      );

      // Update selected lead to reflect changes
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              customer_name: formName,
              customer_email: formEmail,
              customer_phone: formPhone,
              notes: formNotes,
              status: formStatus,
              details: updatedDetails,
            }
          : null
      );

      setIsEditPanelOpen(false);
    } catch (err) {
      console.error('Error updating lead:', err);
      showAlert('Update Failed', 'Failed to save changes. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create new lead (manual add)
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      setActionLoading(true);
      const newId = 'manual_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const newLead = {
        id: newId,
        type: 'manual',
        customer_name: formName,
        customer_email: formEmail,
        customer_phone: formPhone,
        notes: formNotes,
        status: formStatus,
        details: {
          company: formCompany,
          job_title: formTitle,
          website: formWebsite,
          where_met: formWhereMet,
          why_met: formWhyMet,
        },
        created_at: new Date().toISOString(),
        user_id: session?.user?.id,
      };

      const { error } = await supabase.from('leads').insert([newLead]);

      if (error) throw error;

      setLeads((prev) => [newLead, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding lead:', err);
      showAlert('Addition Failed', 'Failed to add contact. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete lead
  const handleDeleteLead = (id: string) => {
    showConfirm(
      'Confirm Deletion',
      'Are you sure you want to remove this contact from your CRM? This action cannot be undone.',
      async () => {
        try {
          setActionLoading(true);
          const { error } = await supabase.from('leads').delete().eq('id', id);

          if (error) throw error;

          setLeads((prev) => prev.filter((l) => l.id !== id));
          if (selectedLead?.id === id) {
            setSelectedLead(null);
            setIsEditPanelOpen(false);
          }
        } catch (err) {
          console.error('Error deleting lead:', err);
          showAlert('Deletion Failed', 'Failed to delete contact.');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Seed mock data for demonstration
  const handleSeedMockData = async () => {
    if (!session?.user) return;
    try {
      setActionLoading(true);
      const mockLeads = [
        {
          id: 'mock_1_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'business_card',
          customer_name: 'Sarah Chen',
          customer_phone: '+1 (415) 889-1092',
          customer_email: 'sarah.chen@prismatech.io',
          status: 'hot',
          notes: 'Spoke at length about building an offline-first mobile synchronizer. She is looking for an outsourced agency to build a prototype next quarter.',
          details: {
            company: 'Prisma Technologies',
            job_title: 'Director of Platform Engineering',
            website: 'www.prismatech.io',
            where_met: 'TechCrunch Disrupt SF 2026',
            why_met: 'Potential dev agency client or advisor',
          },
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          user_id: session.user.id,
        },
        {
          id: 'mock_2_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'business_card',
          customer_name: 'Marcus Vance',
          customer_phone: '+44 20 7946 0958',
          customer_email: 'm.vance@vancecap.co.uk',
          status: 'new',
          notes: 'Met during the coffee break. Interested in AI agent workflows. Promised to send him our developer stack summary.',
          details: {
            company: 'Vance Capital Partners',
            job_title: 'Managing Director',
            website: 'www.vancecap.co.uk',
            where_met: 'London Fintech Week 2026',
            why_met: 'Angel investor or scaling advice',
          },
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          user_id: session.user.id,
        },
        {
          id: 'mock_3_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'business_card',
          customer_name: 'Elena Rostova',
          customer_phone: '+49 89 2019 3881',
          customer_email: 'elena.rostova@quantum-dynamics.de',
          status: 'followed_up',
          notes: 'Elena is conducting research into neuromorphic computing interfaces. We discussed potential integration with web canvases. Sent follow up email.',
          details: {
            company: 'Quantum Dynamics GmbH',
            job_title: 'Head of Research',
            website: 'www.quantum-dynamics.de',
            where_met: 'Munich AI Summit',
            why_met: 'Research partnership & tech advisory',
          },
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          user_id: session.user.id,
        }
      ];

      const { error } = await supabase.from('leads').insert(mockLeads);
      if (error) throw error;
      
      await fetchLeads();
      showAlert('Database Seeded', 'Successfully added 3 mock contacts to your CRM.');
    } catch (err) {
      const error = err as Error & { details?: string };
      console.error('Error seeding mock data:', error.message || error, error.details || '');
      showAlert('Seeding Failed', `Could not populate database: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and search logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        lead.customer_name?.toLowerCase().includes(searchLower) ||
        lead.customer_email?.toLowerCase().includes(searchLower) ||
        lead.customer_phone?.toLowerCase().includes(searchLower) ||
        lead.notes?.toLowerCase().includes(searchLower) ||
        lead.details?.company?.toLowerCase().includes(searchLower) ||
        lead.details?.job_title?.toLowerCase().includes(searchLower) ||
        lead.details?.where_met?.toLowerCase().includes(searchLower) ||
        lead.details?.why_met?.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const isNew = leads.filter((l) => l.status === 'new').length;
    const hot = leads.filter((l) => l.status === 'hot').length;
    const followedUp = leads.filter((l) => l.status === 'followed_up').length;
    return { total, isNew, hot, followedUp };
  }, [leads]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-blue-900/40 bg-blue-950/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.08em] rounded-sm">
            <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
            New
          </span>
        );
      case 'followed_up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-purple-900/40 bg-purple-950/20 text-purple-400 text-[9px] font-bold uppercase tracking-[0.08em] rounded-sm">
            <Check className="w-2.5 h-2.5" strokeWidth={1.5} />
            Contacted
          </span>
        );
      case 'hot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-900/40 bg-amber-950/20 text-amber-400 text-[9px] font-bold uppercase tracking-[0.08em] rounded-sm">
            <Flame className="w-2.5 h-2.5" strokeWidth={1.5} />
            Hot
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-zinc-700/30 bg-zinc-900/20 text-zinc-400 text-[9px] font-bold uppercase tracking-[0.08em] rounded-sm">
            <Archive className="w-2.5 h-2.5" strokeWidth={1.5} />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-405 font-sans">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans tracking-tight antialiased flex items-center justify-center p-6 relative overflow-x-hidden">
        {/* Film grain overlay */}
        <div 
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] mix-blend-overlay bg-repeat bg-[size:100px_100px]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
          }} 
        />
        {/* Soft Ambient lighting */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(255,255,255,0.025),transparent)]" />
        
        {/* Double Bezel Auth Card */}
        <div className="relative w-full max-w-sm p-1 bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-2xl z-10 animate-in zoom-in-95 duration-200">
          <div className="bg-zinc-950 border border-white/[0.02] p-8 rounded-md flex flex-col gap-6">
            
            <div className="text-center">
              <div className="w-8 h-8 rounded-sm bg-zinc-100 flex items-center justify-center font-bold text-zinc-950 text-sm mx-auto shadow-inner mb-3">
                CD
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isSignUp ? 'Create account' : 'Sign in to CardDex'}
              </h2>
              <p className="text-[9px] text-zinc-500 font-bold tracking-[0.15em] uppercase mt-1">
                Personal CRM Sync
              </p>
            </div>

            {authError && (
              <div className="px-3.5 py-2.5 rounded-sm bg-red-500/10 border border-red-900/30 text-red-400 text-xs font-semibold leading-relaxed tracking-tight">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.05]">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one'}
              </button>
            </div>

          </div>
        </div>

        {/* Custom Dialog overlay for alerts */}
        {dialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div 
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={dialog.onConfirm}
            />
            <div className="relative w-full max-w-sm p-1 bg-white/[0.015] border border-white/[0.08] rounded-lg shadow-2xl z-10">
              <div className="bg-zinc-950 border border-white/[0.02] p-6 rounded-md flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{dialog.title}</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{dialog.message}</p>
                </div>
                <div className="flex gap-2 justify-end mt-2 border-t border-white/[0.05] pt-4">
                  <button
                    onClick={dialog.onConfirm}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-sm bg-zinc-100 hover:bg-white text-zinc-950"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans tracking-tight antialiased overflow-x-hidden relative">
      
      {/* 1. Pure SVG Tactile Noise / Film Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] mix-blend-overlay bg-repeat bg-[size:100px_100px]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
        }} 
      />

      {/* 2. Soft Ambient Lighting Orb */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.02),transparent)]" />

      {/* 3. Sleek Sharp Top Header */}
      <header className="w-full border-b border-white/[0.08] bg-zinc-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-zinc-100 flex items-center justify-center font-bold text-zinc-950 text-xs shadow-inner">
            CD
          </div>
          <div>
            <h1 className="font-bold tracking-[-0.03em] text-white text-sm">CardDex</h1>
            <p className="text-[8px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-0.5">Personal CRM</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Always Available Mock Seeder Button */}
          <button
            onClick={handleSeedMockData}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 hover:text-white text-[10px] font-bold tracking-tight transition-all duration-300 active:scale-[0.98] cursor-pointer"
            title="Seed Mock Contacts"
          >
            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-400" strokeWidth={1.5} />}
            Seed Data
          </button>
          
          <button
            onClick={fetchLeads}
            className="p-2 rounded-sm border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-all duration-300 active:scale-[0.95] cursor-pointer"
            title="Sync Contacts"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.25} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            New Contact
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-red-950/30 hover:bg-red-500/10 text-red-400 text-[10px] font-bold tracking-tight transition-all duration-300 active:scale-[0.95] cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8 relative z-10">

        {/* 4. Asymmetrical Bento Grid Statistics - Calibrated Micro-Radius */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Encounters Bento - Double Width */}
          <div className="col-span-2 p-[1px] bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-xl">
            <div className="h-full bg-zinc-950/20 border border-white/[0.01] p-6 rounded-md flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em]">Total Encounters</span>
                <div className="w-5 h-5 rounded-sm bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500">
                  <Compass className="w-3 h-3" strokeWidth={1.25} />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-light tracking-[-0.04em] text-white font-mono">{stats.total}</span>
                <span className="text-xs text-zinc-500 font-semibold tracking-tight">saved profiles</span>
              </div>
            </div>
          </div>

          {/* Needs outreach Bento */}
          <div className="p-[1px] bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-xl">
            <div className="h-full bg-zinc-950/20 border border-white/[0.01] p-6 rounded-md flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em]">Needs Action</span>
                <div className="w-5 h-5 rounded-sm bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400/80">
                  <Clock className="w-3 h-3" strokeWidth={1.25} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-light tracking-[-0.04em] text-blue-400 font-mono">{stats.isNew}</span>
                <p className="text-[9px] text-zinc-500 mt-1 font-bold uppercase tracking-wider">Uncontacted</p>
              </div>
            </div>
          </div>

          {/* Hot leads Bento */}
          <div className="p-[1px] bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-xl">
            <div className="h-full bg-zinc-950/20 border border-white/[0.01] p-6 rounded-md flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em]">Hot Leads</span>
                <div className="w-5 h-5 rounded-sm bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400/80">
                  <Flame className="w-3 h-3" strokeWidth={1.25} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-light tracking-[-0.04em] text-amber-400 font-mono">{stats.hot}</span>
                <p className="text-[9px] text-zinc-500 mt-1 font-bold uppercase tracking-wider">Active Deals</p>
              </div>
            </div>
          </div>

        </section>

        {/* 5. Controls */}
        <section className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          
          {/* Search Double Bezel - Calibrated Micro-Radius */}
          <div className="p-[1px] bg-white/[0.015] border border-white/[0.06] rounded-md flex-1 max-w-md">
            <div className="relative bg-zinc-950/60 rounded-sm border border-white/[0.01]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" strokeWidth={1.25} />
              <input
                type="text"
                placeholder="Search name, company, notes, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-sm bg-transparent text-zinc-200 placeholder-zinc-650 focus:outline-none text-xs font-medium tracking-tight"
              />
            </div>
          </div>

          {/* Filter tabs - Calibrated Micro-Radius */}
          <div className="flex gap-1 items-center overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-2">
              Filter:
            </span>
            {[
              { label: 'All', value: 'all' },
              { label: 'New', value: 'new' },
              { label: 'Contacted', value: 'followed_up' },
              { label: 'Hot', value: 'hot' },
              { label: 'Archived', value: 'archived' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-sm text-[10px] font-bold border transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  statusFilter === filter.value
                    ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
                    : 'bg-white/[0.02] text-zinc-500 border-white/[0.04] hover:text-zinc-300 hover:border-white/[0.08]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* 6. Contacts Database - Calibrated Micro-Radius, custom Mobile Layout */}
        <section className="relative">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" strokeWidth={1.25} />
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Accessing Ledger</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-[1px] bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-xl">
              <div className="bg-zinc-950/20 border border-white/[0.01] p-16 rounded-md text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-sm bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4 text-zinc-500">
                  <User className="w-4 h-4" strokeWidth={1.25} />
                </div>
                <h3 className="font-bold text-zinc-200 text-sm tracking-tight">No records located</h3>
                <p className="text-zinc-500 text-xs max-w-xs mt-1 mb-6 leading-relaxed">
                  Modify search filters, scan a card via the mobile app, or seed standard mock profiles.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-[1px] bg-white/[0.01] border border-white/[0.06] rounded-lg shadow-xl overflow-hidden">
              <div className="bg-zinc-950/20 border border-white/[0.01] rounded-md overflow-hidden">
                
                {/* A. Desktop View - Structured Table */}
                <div className="hidden md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                        <th className="px-6 py-4">Name & Title</th>
                        <th className="px-6 py-4">Organization</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Location Met</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Saved</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => openEditPanel(lead)}
                          className={`hover:bg-white/[0.015] active:scale-[0.995] active:bg-white/[0.005] transition-all duration-300 cursor-pointer group ${
                            selectedLead?.id === lead.id ? 'bg-white/[0.015]' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-zinc-100 group-hover:text-white transition-colors tracking-tight text-sm">
                                {lead.customer_name}
                              </div>
                              <div className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-tight">
                                {lead.details?.job_title || 'No Title'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300 font-semibold">
                            {lead.details?.company || <span className="text-zinc-650 font-normal">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {lead.customer_email && (
                                <span className="text-zinc-400 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-zinc-655" strokeWidth={1.25} />
                                  {lead.customer_email}
                                </span>
                              )}
                              {lead.customer_phone && (
                                <span className="text-zinc-500 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-zinc-655" strokeWidth={1.25} />
                                  {lead.customer_phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-655" strokeWidth={1.25} />
                              {lead.details?.where_met || <span className="text-zinc-650">—</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                          <td className="px-6 py-4 text-zinc-500 font-mono">
                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditPanel(lead)}
                                className="p-2 rounded-sm border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
                                title="Edit Profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" strokeWidth={1.25} />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 rounded-sm border border-white/[0.04] bg-white/[0.02] hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all cursor-pointer"
                                title="Remove Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.25} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* B. Mobile View - Structured Cards instead of table */}
                <div className="block md:hidden flex flex-col divide-y divide-white/[0.05]">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => openEditPanel(lead)}
                      className="p-5 active:bg-white/[0.015] transition-all flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-zinc-100 text-sm tracking-tight">{lead.customer_name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{lead.details?.job_title || 'No Title'}</p>
                        </div>
                        {getStatusBadge(lead.status)}
                      </div>
                      
                      {lead.details?.company && (
                        <div className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.25} />
                          {lead.details.company}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 text-[11px] text-zinc-400">
                        {lead.customer_email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.25} />
                            {lead.customer_email}
                          </span>
                        )}
                        {lead.customer_phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.25} />
                            {lead.customer_phone}
                          </span>
                        )}
                        {lead.details?.where_met && (
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <MapPin className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.25} />
                            Met: {lead.details.where_met}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1 border-t border-white/[0.02] pt-2">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(lead.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          Details
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.25} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </section>
      </div>

      {/* 7. Double-Bezel Slide-over Details Drawer - Calibrated Micro-Radius */}
      {isEditPanelOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Blur Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEditPanelOpen(false)}
          />

          {/* Drawer nested bezel */}
          <div className="relative w-full max-w-lg h-full p-2 bg-[#050505] flex">
            <div className="w-full h-full p-1 bg-white/[0.015] border border-white/[0.06] rounded-l-lg shadow-2xl flex">
              <div className="w-full bg-zinc-950 border border-white/[0.02] rounded-l-md p-8 flex flex-col gap-6 overflow-y-auto z-10 relative">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">CRM Record</span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-1">{selectedLead.customer_name}</h3>
                  </div>
                  <button
                    onClick={() => setIsEditPanelOpen(false)}
                    className="p-2 rounded-sm bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Shortcuts */}
                <div className="flex gap-2 border-b border-white/[0.05] pb-5">
                  {selectedLead.customer_email && (
                    <a
                      href={`mailto:${selectedLead.customer_email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-zinc-300 hover:text-white transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.25} />
                      Email
                    </a>
                  )}
                  {selectedLead.customer_phone && (
                    <a
                      href={`tel:${selectedLead.customer_phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-zinc-300 hover:text-white transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.25} />
                      Call
                    </a>
                  )}
                  {selectedLead.details?.website && (
                    <a
                      href={`https://${selectedLead.details.website.replace(/^(https?:\/\/)/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-zinc-300 hover:text-white transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.25} />
                      Website
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500" strokeWidth={1.5} />
                    </a>
                  )}
                </div>

                {/* Form fields */}
                <form onSubmit={handleUpdateLead} className="flex-1 flex flex-col gap-6">
                  <div className="space-y-4">
                    
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Company</label>
                        <input
                          type="text"
                          value={formCompany}
                          onChange={(e) => setFormCompany(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Job Title</label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone</label>
                        <input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Website</label>
                      <input
                        type="text"
                        value={formWebsite}
                        onChange={(e) => setFormWebsite(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/[0.04] pt-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Location Met</label>
                        <input
                          type="text"
                          value={formWhereMet}
                          onChange={(e) => setFormWhereMet(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Context</label>
                        <input
                          type="text"
                          value={formWhyMet}
                          onChange={(e) => setFormWhyMet(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                      >
                        <option value="new">New</option>
                        <option value="followed_up">Contacted</option>
                        <option value="hot">Hot</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Detailed Notes</label>
                      <textarea
                        rows={4}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-white/[0.05] pt-5 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleDeleteLead(selectedLead.id)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-sm border border-red-900/30 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Delete
                    </button>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      Save Changes
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Double-Bezel Add Contact Modal - Calibrated Micro-Radius */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="relative w-full max-w-lg p-2 bg-[#050505] rounded-lg">
            <div className="w-full p-1 bg-white/[0.015] border border-white/[0.06] rounded-lg shadow-2xl">
              <div className="w-full bg-zinc-950 border border-white/[0.02] rounded-md p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
                
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
                  <h3 className="text-base font-bold text-white tracking-tight">Create CRM Profile</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-sm hover:bg-white/[0.02] text-zinc-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleAddLead} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sarah Chen"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Company</label>
                      <input
                        type="text"
                        placeholder="Prisma Tech"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Job Title</label>
                      <input
                        type="text"
                        placeholder="Platform Director"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</label>
                      <input
                        type="email"
                        placeholder="sarah@prismatech.io"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (415) 555-1234"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Website</label>
                    <input
                      type="text"
                      placeholder="www.prismatech.io"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Location Met</label>
                      <input
                        type="text"
                        placeholder="CES 2026"
                        value={formWhereMet}
                        onChange={(e) => setFormWhereMet(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight placeholder-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-sm bg-zinc-900/40 border border-white/[0.06] text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight"
                      >
                        <option value="new">New</option>
                        <option value="followed_up">Contacted</option>
                        <option value="hot">Hot</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Why Met & Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Discussed contract details..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-sm border border-white/[0.06] bg-zinc-900/20 text-white focus:outline-none focus:border-zinc-500 text-xs font-semibold tracking-tight resize-none placeholder-zinc-700"
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-2.5 rounded-sm border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contact'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Custom Minimalist Alert & Confirm Dialog Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
            onClick={dialog.type === 'alert' ? dialog.onConfirm : dialog.onCancel}
          />
          
          {/* Dialog Container */}
          <div className="relative w-full max-w-sm p-1 bg-white/[0.015] border border-white/[0.08] rounded-lg shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="bg-zinc-950 border border-white/[0.02] p-6 rounded-md flex flex-col gap-4">
              
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{dialog.title}</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{dialog.message}</p>
              </div>

              <div className="flex gap-2 justify-end mt-2 border-t border-white/[0.05] pt-4">
                {dialog.type === 'confirm' && (
                  <button
                    onClick={dialog.onCancel}
                    className="px-4 py-2 border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={dialog.onConfirm}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-sm ${
                    dialog.title.toLowerCase().includes('delete') || dialog.title.toLowerCase().includes('remove')
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-900/30'
                      : 'bg-zinc-100 hover:bg-white text-zinc-950'
                  }`}
                >
                  {dialog.title.toLowerCase().includes('delete') ? 'Delete' : 'Confirm'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

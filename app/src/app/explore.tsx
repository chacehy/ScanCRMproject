import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  View,
  Linking,
  Platform,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Search,
  Building2,
  MapPin,
  Target,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  X,
  Inbox,
  LogOut,
} from 'lucide-react-native';

import { Card, bezelStyles } from '@/components/card';
import { Label } from '@/components/label';
import { StatusBadge } from '@/components/status-badge';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const c = Colors.dark;

interface LeadDetails {
  company?: string;
  job_title?: string;
  website?: string;
  where_met?: string;
  why_met?: string;
  [key: string]: any;
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

export default function HistoryScreen() {
  // App States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch leads from Supabase
  const fetchLeads = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      const errMsg = 'Failed to load contacts from CRM: ' + err.message;
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh automatically when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchLeads(true);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeads(false);
  };

  // Delete lead from database
  const handleDeleteLead = async (id: string) => {
    const confirmDelete = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const res = window.confirm('Are you sure you want to delete this contact?');
          resolve(res);
        } else {
          Alert.alert(
            'Confirm Delete',
            'Are you sure you want to remove this contact from your CRM?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    };

    const confirm = await confirmDelete();
    if (!confirm) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;

      // Update local state
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedLead(null);

      const successMsg = 'Contact removed successfully.';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Deleted', successMsg);

    } catch (err: any) {
      console.error('Failed to delete lead:', err);
      const errMsg = 'Failed to delete contact: ' + err.message;
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Database Error', errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Launch native app shortcuts
  const handleEmail = (emailAddress: string) => {
    if (!emailAddress) return;
    Linking.openURL(`mailto:${emailAddress}`).catch(() => {
      Alert.alert('Error', 'Could not open mail app.');
    });
  };

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not launch dialer.');
    });
  };

  const handleWebsite = (webUrl: string) => {
    if (!webUrl) return;
    const formattedUrl = webUrl.startsWith('http') ? webUrl : `https://${webUrl}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert('Error', 'Could not open browser.');
    });
  };

  // Filter leads by search query
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(q) ||
      lead.details?.company?.toLowerCase().includes(q) ||
      lead.details?.job_title?.toLowerCase().includes(q) ||
      lead.details?.where_met?.toLowerCase().includes(q) ||
      lead.customer_email?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Header and Search Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>History</Text>
            <Label style={{ marginTop: 2 }}>
              {leads.length} {leads.length === 1 ? 'contact' : 'contacts'}
            </Label>
          </View>

          <Pressable
            onPress={async () => {
              try {
                await supabase.auth.signOut();
              } catch (err: any) {
                const errorMsg = 'Failed to sign out: ' + err.message;
                if (Platform.OS === 'web') alert(errorMsg);
                else Alert.alert('Error', errorMsg);
              }
            }}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { backgroundColor: 'rgba(248,113,113,0.12)' },
            ]}
          >
            <LogOut size={12} color={c.danger} strokeWidth={2} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Search size={15} color={c.muted} strokeWidth={1.75} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, company, event…"
            placeholderTextColor={c.faint}
            style={styles.searchBar}
          />
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={c.text} />
          <Label style={{ marginTop: Spacing.three }}>Loading contacts</Label>
        </View>
      ) : filteredLeads.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.text} />}
        >
          <View style={styles.emptyTile}>
            <Inbox size={24} color={c.muted} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyText}>No contacts yet</Text>
          <Text style={styles.emptySub}>
            {leads.length === 0
              ? 'Scan a business card on the Scan tab to start building your CRM.'
              : 'Nothing matches that search. Try a different term.'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.text} />}
        >
          {filteredLeads.map((lead) => (
            <Pressable
              key={lead.id}
              onPress={() => setSelectedLead(lead)}
              style={({ pressed }) => [bezelStyles.bezel, pressed && { opacity: 0.85 }]}
            >
              <View style={[bezelStyles.inner, styles.card]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: Spacing.two }}>
                    <Text style={styles.cardName}>{lead.customer_name}</Text>
                    <Text style={styles.cardTitle}>{lead.details?.job_title || 'No title'}</Text>
                  </View>
                  <StatusBadge status={lead.status} />
                </View>

                {lead.details?.company && (
                  <View style={styles.cardRow}>
                    <Building2 size={13} color={c.muted} strokeWidth={1.75} />
                    <Text style={styles.cardCompany}>{lead.details.company}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.cardRow}>
                    <MapPin size={12} color={c.faint} strokeWidth={1.75} />
                    <Text style={styles.cardLocation}>
                      {lead.details?.where_met || 'Location not set'}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardDate}>
                      {new Date(lead.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <ChevronRight size={14} color={c.faint} strokeWidth={2} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Details Overlay Modal */}
      <Modal
        visible={selectedLead !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedLead(null)}
      >
        {selectedLead && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Label>CRM record</Label>
                  <Text style={styles.modalName}>{selectedLead.customer_name}</Text>
                  <Text style={styles.modalRole}>
                    {selectedLead.details?.job_title || 'No job title'}
                    {selectedLead.details?.company ? `  ·  ${selectedLead.details.company}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedLead(null)} style={styles.closeButton}>
                  <X size={16} color={c.text} strokeWidth={2} />
                </Pressable>
              </View>

              {/* Quick actions */}
              <View style={styles.quickRow}>
                {selectedLead.customer_email ? (
                  <Pressable
                    onPress={() => handleEmail(selectedLead.customer_email)}
                    style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: c.backgroundSelected }]}
                  >
                    <Mail size={15} color={c.text} strokeWidth={1.75} />
                    <Text style={styles.quickText}>Email</Text>
                  </Pressable>
                ) : null}
                {selectedLead.customer_phone ? (
                  <Pressable
                    onPress={() => handleCall(selectedLead.customer_phone)}
                    style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: c.backgroundSelected }]}
                  >
                    <Phone size={15} color={c.text} strokeWidth={1.75} />
                    <Text style={styles.quickText}>Call</Text>
                  </Pressable>
                ) : null}
                {selectedLead.details?.website ? (
                  <Pressable
                    onPress={() => handleWebsite(selectedLead.details.website!)}
                    style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: c.backgroundSelected }]}
                  >
                    <Globe size={15} color={c.text} strokeWidth={1.75} />
                    <Text style={styles.quickText}>Website</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Scrollable details */}
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: Spacing.four, gap: Spacing.three }}>

                <Card contentStyle={styles.detailCard}>
                  <DetailRow Icon={MapPin} label="Where met" value={selectedLead.details?.where_met || 'Not specified'} />
                  {selectedLead.details?.why_met ? (
                    <DetailRow Icon={Target} label="Why it matters" value={selectedLead.details.why_met} />
                  ) : null}
                  {selectedLead.customer_email ? (
                    <DetailRow Icon={Mail} label="Email" value={selectedLead.customer_email} />
                  ) : null}
                  {selectedLead.customer_phone ? (
                    <DetailRow Icon={Phone} label="Phone" value={selectedLead.customer_phone} />
                  ) : null}
                </Card>

                <View>
                  <Label style={{ marginBottom: Spacing.two, marginLeft: Spacing.one }}>Notes</Label>
                  <Card contentStyle={styles.notesBlock}>
                    <Text style={styles.notesText}>
                      {selectedLead.notes || 'No notes taken.'}
                    </Text>
                  </Card>
                </View>

              </ScrollView>

              {/* Action Footer */}
              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => handleDeleteLead(selectedLead.id)}
                  disabled={actionLoading}
                  style={({ pressed }) => [styles.deleteButton, pressed && { backgroundColor: 'rgba(248,113,113,0.12)' }]}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={c.danger} />
                  ) : (
                    <Text style={styles.deleteText}>Delete</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setSelectedLead(null)}
                  style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>

            </View>
          </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Icon size={15} color={c.muted} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1 }}>
        <Label>{label}</Label>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    padding: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: c.text,
    fontWeight: '800',
    fontSize: 30,
    letterSpacing: -1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: Radii.sm,
  },
  logoutText: {
    color: c.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.three,
    zIndex: 1,
  },
  searchBar: {
    height: 44,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: Radii.sm,
    paddingLeft: 40,
    paddingRight: Spacing.three,
    fontSize: 14,
    color: c.text,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  centerContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  emptyTile: {
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    backgroundColor: c.backgroundElement,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyText: {
    color: c.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  emptySub: {
    color: c.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 260,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardName: {
    color: c.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardTitle: {
    color: c.muted,
    fontSize: 12,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardCompany: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    paddingTop: Spacing.two,
  },
  cardLocation: {
    color: c.muted,
    fontSize: 12,
  },
  cardDate: {
    color: c.muted,
    fontSize: 11,
    fontFamily: undefined,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    backgroundColor: c.background,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    borderWidth: 1,
    borderColor: c.hairline,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  modalName: {
    color: c.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.one,
  },
  modalRole: {
    color: c.muted,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  quickBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: Radii.sm,
    backgroundColor: c.backgroundElement,
  },
  quickText: {
    color: c.text,
    fontSize: 13,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  detailCard: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    backgroundColor: c.backgroundElement,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailValue: {
    color: c.text,
    fontSize: 14,
    marginTop: 3,
  },
  notesBlock: {
    padding: Spacing.three,
  },
  notesText: {
    color: c.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    paddingTop: Spacing.three,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: c.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  doneButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  doneText: {
    color: c.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
});

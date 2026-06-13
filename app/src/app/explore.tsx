import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  View,
  Linking,
  Platform,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

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
  const theme = useTheme();

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
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'New' };
      case 'followed_up':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Followed Up' };
      case 'hot':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Hot' };
      default:
        return { bg: 'rgba(113, 113, 122, 0.15)', text: '#71717a', label: 'Archived' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header and Search Bar */}
      <ThemedView style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="subtitle" style={styles.title}>History</ThemedText>
          
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
              { 
                borderColor: theme.backgroundSelected, 
                backgroundColor: pressed ? 'rgba(239, 68, 68, 0.1)' : 'transparent' 
              }
            ]}
          >
            <ThemedText type="code" style={{ color: '#ef4444', fontSize: 10, fontWeight: 'bold' }}>SIGN OUT</ThemedText>
          </Pressable>
        </View>
        
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search contacts, companies, events..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchBar, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: 'rgba(0,0,0,0.1)' }]}
        />
      </ThemedView>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
            Loading contacts...
          </ThemedText>
        </View>
      ) : filteredLeads.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        >
          <ThemedText style={styles.emptyIcon}>📂</ThemedText>
          <ThemedText type="default" style={styles.emptyText}>No contacts found</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptySub}>
            {leads.length === 0 
              ? 'Scan some business cards on the first tab to build your CRM database.' 
              : 'Try matching other criteria in your search.'}
          </ThemedText>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        >
          {filteredLeads.map((lead) => {
            const statusBadge = getStatusBadgeStyle(lead.status);
            return (
              <Pressable
                key={lead.id}
                onPress={() => setSelectedLead(lead)}
                style={({ pressed }) => [
                  styles.card,
                  { 
                    backgroundColor: theme.backgroundElement, 
                    borderColor: pressed ? '#6366f1' : 'rgba(255,255,255,0.03)' 
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: Spacing.two }}>
                    <ThemedText type="smallBold" style={styles.cardName}>{lead.customer_name}</ThemedText>
                    <ThemedText type="code" themeColor="textSecondary" style={styles.cardTitle}>
                      {lead.details?.job_title || 'No Title'}
                    </ThemedText>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                    <ThemedText style={[styles.statusText, { color: statusBadge.text }]}>
                      {statusBadge.label}
                    </ThemedText>
                  </View>
                </View>

                {lead.details?.company && (
                  <ThemedText type="small" style={styles.cardCompany}>
                    🏢 {lead.details.company}
                  </ThemedText>
                )}

                <View style={styles.cardFooter}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.cardLocation}>
                    📍 {lead.details?.where_met || 'Met location not set'}
                  </ThemedText>

                  <ThemedText type="code" themeColor="textSecondary" style={styles.cardDate}>
                    {new Date(lead.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
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
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="default" style={styles.modalName}>{selectedLead.customer_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {selectedLead.details?.job_title || 'No Job Title'}
                  </ThemedText>
                </View>
                <Pressable onPress={() => setSelectedLead(null)} style={styles.closeButton}>
                  <ThemedText style={{ fontSize: 18, color: theme.text }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Scrollable details */}
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: Spacing.four }}>
                
                {/* Company & Location Card */}
                <View style={[styles.detailGroup, { borderBottomWidth: 1, borderBottomColor: theme.backgroundSelected }]}>
                  {selectedLead.details?.company && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailEmoji}>🏢</ThemedText>
                      <View>
                        <ThemedText type="code" themeColor="textSecondary">Company</ThemedText>
                        <ThemedText type="small" style={{ color: theme.text }}>{selectedLead.details.company}</ThemedText>
                      </View>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailEmoji}>📍</ThemedText>
                    <View>
                      <ThemedText type="code" themeColor="textSecondary">Where Met</ThemedText>
                      <ThemedText type="small" style={{ color: theme.text }}>
                        {selectedLead.details?.where_met || 'Not specified'}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedLead.details?.why_met && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailEmoji}>🎯</ThemedText>
                      <View>
                        <ThemedText type="code" themeColor="textSecondary">Why Met</ThemedText>
                        <ThemedText type="small" style={{ color: theme.text }}>{selectedLead.details.why_met}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Coordinates & Shortcuts */}
                <View style={[styles.detailGroup, { borderBottomWidth: 1, borderBottomColor: theme.backgroundSelected }]}>
                  
                  {/* Email */}
                  {selectedLead.customer_email ? (
                    <Pressable onPress={() => handleEmail(selectedLead.customer_email)} style={styles.actionRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="code" themeColor="textSecondary">Email Address</ThemedText>
                        <ThemedText type="small" style={{ color: theme.text }}>{selectedLead.customer_email}</ThemedText>
                      </View>
                      <ThemedText style={styles.actionArrow}>✉️</ThemedText>
                    </Pressable>
                  ) : null}

                  {/* Phone */}
                  {selectedLead.customer_phone ? (
                    <Pressable onPress={() => handleCall(selectedLead.customer_phone)} style={styles.actionRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="code" themeColor="textSecondary">Phone Number</ThemedText>
                        <ThemedText type="small" style={{ color: theme.text }}>{selectedLead.customer_phone}</ThemedText>
                      </View>
                      <ThemedText style={styles.actionArrow}>📞</ThemedText>
                    </Pressable>
                  ) : null}

                  {/* Website */}
                  {selectedLead.details?.website ? (
                    <Pressable onPress={() => handleWebsite(selectedLead.details.website!)} style={styles.actionRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="code" themeColor="textSecondary">Website</ThemedText>
                        <ThemedText type="small" style={{ color: theme.text }}>{selectedLead.details.website}</ThemedText>
                      </View>
                      <ThemedText style={styles.actionArrow}>🌐</ThemedText>
                    </Pressable>
                  ) : null}
                </View>

                {/* Notes Section */}
                <View style={styles.detailGroup}>
                  <ThemedText type="code" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>
                    Interaction Notes
                  </ThemedText>
                  <ThemedView type="backgroundSelected" style={styles.notesBlock}>
                    <ThemedText type="small" style={{ fontStyle: 'italic', lineHeight: 20 }}>
                      {selectedLead.notes || 'No notes taken.'}
                    </ThemedText>
                  </ThemedView>
                </View>

              </ScrollView>

              {/* Action Footer */}
              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => handleDeleteLead(selectedLead.id)}
                  disabled={actionLoading}
                  style={[styles.deleteButton, { borderColor: theme.backgroundSelected }]}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <ThemedText type="smallBold" style={{ color: '#ef4444' }}>
                      Delete Contact
                    </ThemedText>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setSelectedLead(null)}
                  style={[styles.closeModalButton, { backgroundColor: '#6366f1' }]}
                >
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>

            </ThemedView>
          </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.four,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  title: {
    fontWeight: '800',
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  centerContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardCompany: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.02)',
    paddingTop: Spacing.two,
  },
  cardLocation: {
    fontSize: 11,
  },
  cardDate: {
    fontSize: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: Spacing.two,
    borderTopRightRadius: Spacing.two,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    paddingBottom: Spacing.three,
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  detailGroup: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailEmoji: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  actionArrow: {
    fontSize: 18,
  },
  notesBlock: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: Spacing.three,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalButton: {
    flex: 1,
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.one,
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  Platform,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Camera, ImagePlus, Sparkles, RotateCcw, ScanLine } from 'lucide-react-native';

import { Monogram } from '@/components/brand';
import { Card } from '@/components/card';
import { Label } from '@/components/label';
import { STATUS, type StatusKey } from '@/components/status-badge';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const c = Colors.dark;

// Resolve Next.js backend URL based on platform/environment
const getBackendUrl = () => {
  // Production/deployed backend, e.g. https://your-web-app.vercel.app
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return '';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const SCAN_STATUSES: StatusKey[] = ['new', 'followed_up', 'hot'];

export default function ScanScreen() {
  const router = useRouter();

  // App States
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  // Mapped OCR Field States
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Relationship Question States
  const [whereMet, setWhereMet] = useState('');
  const [whyMet, setWhyMet] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new'); // 'new', 'followed_up', 'hot', 'archived'

  // Request camera and media library permissions
  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library access to scan business cards!'
        );
        return false;
      }
    }
    return true;
  };

  // Launch camera
  const handleTakePhoto = async () => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          triggerOcrProcess(asset.base64);
        } else {
          throw new Error('Base64 data missing from captured photo');
        }
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      const errMsg = 'Failed to capture photo. Please try again.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    }
  };

  // Launch photo library selector
  const handlePickPhoto = async () => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          triggerOcrProcess(asset.base64);
        } else {
          throw new Error('Base64 data missing from library photo');
        }
      }
    } catch (err) {
      console.error('Error picking photo:', err);
      const errMsg = 'Failed to load photo. Please try again.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    }
  };

  // Simulate OCR scan for testing
  const handleSimulateScan = () => {
    setScanning(true);
    setFormVisible(false);
    setTimeout(() => {
      setName('Sarah Chen');
      setCompany('Prisma Technologies');
      setJobTitle('Director of Platform Engineering');
      setEmail('sarah.chen@prismatech.io');
      setPhone('+1 (415) 889-1092');
      setWebsite('www.prismatech.io');
      setWhereMet('TechCrunch Disrupt SF 2026');
      setWhyMet('Potential dev agency client or advisor');
      setNotes('Sample contact. Replace with your own details.');
      setStatus('hot');
      setFormVisible(true);
      setScanning(false);
    }, 1000);
  };

  // Trigger Backend OCR Route
  const triggerOcrProcess = async (base64Str: string) => {
    setScanning(true);
    setFormVisible(false);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${base64Str}` }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();

      // Set mapped OCR fields
      setName(data.name || '');
      setCompany(data.company || '');
      setJobTitle(data.jobTitle || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setWebsite(data.website || '');

      // Prepopulate notes if it was seeded/mocked
      if (data._isMock) {
        setNotes('Sample contact. Replace with your own details.');
      } else {
        setNotes('');
      }

      // Reset context questions
      setWhereMet('');
      setWhyMet('');
      setStatus('new');
      setFormVisible(true);

    } catch (error: any) {
      console.error('Ocr request failed:', error);
      const errMsg = 'Scan failed: ' + error.message + '\n\nYou can still fill out the contact fields manually.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Scan Warning', errMsg);

      // Open empty form for manual entry if OCR failed
      setName('');
      setCompany('');
      setJobTitle('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setWhereMet('');
      setWhyMet('');
      setNotes('');
      setFormVisible(true);
    } finally {
      setScanning(false);
    }
  };

  // Save Lead to Supabase
  const handleSaveContact = async () => {
    if (!name.trim()) {
      const warning = 'Name field is required!';
      if (Platform.OS === 'web') alert(warning);
      else Alert.alert('Validation Error', warning);
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User session not found. Please log in again.');

      const newId = 'lead_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

      const newLead = {
        id: newId,
        type: 'business_card',
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        status: status,
        notes: notes.trim(),
        details: {
          company: company.trim(),
          job_title: jobTitle.trim(),
          website: website.trim(),
          where_met: whereMet.trim(),
          why_met: whyMet.trim(),
        },
        created_at: new Date().toISOString(),
        user_id: user.id,
      };

      const { error } = await supabase.from('leads').insert([newLead]);

      if (error) throw error;

      const successMsg = 'Contact successfully added to CRM!';
      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('Saved', successMsg);
      }

      // Reset Screen State
      setImageUri(null);
      setFormVisible(false);

      // Navigate to History Tab
      router.replace('/explore');

    } catch (error: any) {
      console.error('Save failed:', error);
      const errMsg = 'Failed to save contact to CRM: ' + error.message;
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Database Error', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setFormVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Branded Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Monogram size={30} />
            <View>
              <Text style={styles.headerTitle}>CardDex</Text>
              <Label style={{ letterSpacing: 2.5 }}>Scanner</Label>
            </View>
          </View>
        </View>

        {/* Start State - Prompts user to scan or pick photo */}
        {!scanning && !formVisible && (
          <Card contentStyle={styles.startCard}>
            <View style={styles.iconTile}>
              <ScanLine size={26} color={c.text} strokeWidth={1.5} />
            </View>

            <Text style={styles.cardPrompt}>Scan a business card</Text>
            <Text style={styles.cardDesc}>
              Line the card up flat and fill the frame. We&apos;ll pull out the name, company, and contact details for you.
            </Text>

            <View style={styles.buttonGroup}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
              >
                <Camera size={16} color={c.primaryText} strokeWidth={2} />
                <Text style={styles.primaryText}>Take photo</Text>
              </Pressable>

              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: c.backgroundSelected }]}
              >
                <ImagePlus size={16} color={c.text} strokeWidth={1.75} />
                <Text style={styles.secondaryText}>Upload from gallery</Text>
              </Pressable>

              <Pressable
                onPress={handleSimulateScan}
                style={({ pressed }) => [styles.ghostButton, pressed && { backgroundColor: c.backgroundSelected }]}
              >
                <Sparkles size={15} color={c.muted} strokeWidth={1.75} />
                <Text style={styles.ghostText}>Use sample contact</Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Scanning State */}
        {scanning && (
          <Card contentStyle={styles.loadingCard}>
            <ActivityIndicator size="large" color={c.text} style={{ marginBottom: Spacing.four }} />
            <Text style={styles.loadingTitle}>Reading the card</Text>
            <Text style={styles.loadingDesc}>
              Extracting the name, company, and contact details from your image…
            </Text>
          </Card>
        )}

        {/* Form State - Displays parsed OCR fields and relationship questions */}
        {formVisible && (
          <View style={styles.formContainer}>

            {/* Scanned Image Preview */}
            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <Pressable onPress={handleReset} style={styles.resetBadge}>
                  <RotateCcw size={12} color="#fff" strokeWidth={2} />
                  <Text style={styles.resetBadgeText}>Retake</Text>
                </Pressable>
              </View>
            )}

            <Label style={styles.sectionTitle}>Contact details</Label>

            <Card contentStyle={styles.formSection}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Label>Full name *</Label>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sarah Chen"
                  placeholderTextColor={c.faint}
                  style={styles.input}
                />
              </View>

              {/* Company & Job Title */}
              <View style={styles.gridRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.two }]}>
                  <Label>Company</Label>
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    placeholder="e.g. Prisma Tech"
                    placeholderTextColor={c.faint}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Label>Job title</Label>
                  <TextInput
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="e.g. Director"
                    placeholderTextColor={c.faint}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Label>Email address</Label>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. sarah@prismatech.io"
                  placeholderTextColor={c.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Label>Phone number</Label>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +1 (415) 555-1234"
                  placeholderTextColor={c.faint}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <Label>Website</Label>
                <TextInput
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="e.g. www.prismatech.io"
                  placeholderTextColor={c.faint}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </Card>

            <Label style={[styles.sectionTitle, { marginTop: Spacing.four }]}>Meeting context</Label>

            <Card contentStyle={styles.formSection}>
              {/* Where met */}
              <View style={styles.inputGroup}>
                <Label>Where did you meet them? *</Label>
                <TextInput
                  value={whereMet}
                  onChangeText={setWhereMet}
                  placeholder="e.g. TechCrunch, a cafe, a conference"
                  placeholderTextColor={c.faint}
                  style={styles.input}
                />
              </View>

              {/* Why met */}
              <View style={styles.inputGroup}>
                <Label>Why does this contact matter?</Label>
                <TextInput
                  value={whyMet}
                  onChangeText={setWhyMet}
                  placeholder="e.g. Potential client, supplier, hire"
                  placeholderTextColor={c.faint}
                  style={styles.input}
                />
              </View>

              {/* Lead Status */}
              <View style={styles.inputGroup}>
                <Label>Follow-up status</Label>
                <View style={styles.statusRow}>
                  {SCAN_STATUSES.map((key) => {
                    const s = STATUS[key];
                    const active = status === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setStatus(key)}
                        style={[
                          styles.statusButton,
                          active && { backgroundColor: s.color + '1f', borderColor: s.color + '80' },
                        ]}
                      >
                        <s.Icon size={12} color={active ? s.color : c.muted} strokeWidth={2} />
                        <Text style={[styles.statusButtonText, { color: active ? s.color : c.muted }]}>
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Detailed Notes */}
              <View style={styles.inputGroup}>
                <Label>Notes</Label>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Anything you'll want to remember later…"
                  placeholderTextColor={c.faint}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.textArea]}
                />
              </View>
            </Card>

            {/* Form Save Button */}
            <View style={styles.submitContainer}>
              <Pressable
                onPress={handleSaveContact}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && { opacity: 0.85 },
                  saving && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={c.primaryText} />
                ) : (
                  <Text style={styles.primaryText}>Save to CRM</Text>
                )}
              </Pressable>

              <Pressable onPress={handleReset} disabled={saving} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.four,
    marginTop: Spacing.one,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  startCard: {
    padding: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  iconTile: {
    width: 60,
    height: 60,
    borderRadius: Radii.md,
    backgroundColor: c.backgroundElement,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  cardPrompt: {
    color: c.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: Spacing.two,
  },
  cardDesc: {
    color: c.muted,
    textAlign: 'center',
    marginBottom: Spacing.five,
    lineHeight: 19,
    fontSize: 13,
  },
  buttonGroup: {
    width: '100%',
    gap: Spacing.two,
  },
  primaryButton: {
    height: 48,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: c.primary,
  },
  primaryText: {
    color: c.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    height: 48,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.backgroundElement,
  },
  secondaryText: {
    color: c.text,
    fontWeight: '600',
    fontSize: 14,
  },
  ghostButton: {
    height: 44,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  ghostText: {
    color: c.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  loadingCard: {
    padding: Spacing.six,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  loadingTitle: {
    color: c.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  loadingDesc: {
    color: c.muted,
    textAlign: 'center',
    lineHeight: 19,
    fontSize: 13,
  },
  formContainer: {
    gap: Spacing.three,
  },
  previewContainer: {
    height: 160,
    width: '100%',
    borderRadius: Radii.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  resetBadge: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  resetBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    marginLeft: Spacing.one,
    letterSpacing: 2,
  },
  formSection: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  gridRow: {
    flexDirection: 'row',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    color: c.text,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  textArea: {
    height: 88,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitContainer: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  saveButton: {
    height: 50,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  cancelButton: {
    height: 46,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: c.muted,
    fontWeight: '600',
    fontSize: 14,
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  Platform,
  Alert,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

// Resolve Next.js backend URL based on platform/environment
const getBackendUrl = () => {
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

export default function ScanScreen() {
  const theme = useTheme();
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
        const errorMsg = 'We need camera and photo library access to scan business cards!';
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Permissions Required', errorMsg);
        }
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
      setNotes('Scanned using simulated OCR. Replace with actual text.');
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
        setNotes('Scanned using simulated OCR. Replace with actual text.');
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
      const errMsg = 'AI scanning failed: ' + error.message + '\n\nYou can still fill out the contact fields manually.';
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Logo/Branding Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>CardDex Scanner</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Snap business cards to instantly extract contact details
          </ThemedText>
        </ThemedView>

        {/* Start State - Prompts user to scan or pick photo */}
        {!scanning && !formVisible && (
          <ThemedView type="backgroundElement" style={styles.startCard}>
            <ThemedView style={styles.iconContainer}>
              <ThemedText style={styles.cameraIcon}>📸</ThemedText>
            </ThemedView>
            
            <ThemedText type="default" style={styles.cardPrompt}>
              Scan a Business Card
            </ThemedText>
            
            <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
              Using the phone camera, align the business card horizontally and snap a high-contrast image.
            </ThemedText>

            <View style={styles.buttonGroup}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? '#5046e6' : '#6366f1' }
                ]}
              >
                <ThemedText type="smallBold" style={styles.buttonText}>
                  Take Photo
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { 
                    backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                    borderColor: theme.backgroundSelected 
                  }
                ]}
              >
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Upload from Gallery
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSimulateScan}
                style={({ pressed }) => [
                  styles.tertiaryButton,
                  { 
                    backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                    borderColor: theme.backgroundSelected 
                  }
                ]}
              >
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Simulate Scan (Mock Contact)
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        )}

        {/* Scanning State */}
        {scanning && (
          <ThemedView type="backgroundElement" style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6366f1" style={{ marginBottom: Spacing.four }} />
            <ThemedText type="default" style={styles.loadingTitle}>
              Processing Card Image
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.loadingDesc}>
              Gemini AI is reading layout, extracting details, and mapping contact data...
            </ThemedText>
          </ThemedView>
        )}

        {/* Form State - Displays parsed OCR fields and relationship questions */}
        {formVisible && (
          <ThemedView style={styles.formContainer}>
            
            {/* Scanned Image Preview */}
            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <Pressable onPress={handleReset} style={styles.resetBadge}>
                  <ThemedText type="code" style={{ color: '#fff', fontSize: 10 }}>Retake Image</ThemedText>
                </Pressable>
              </View>
            )}

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              EXTRACTED CONTACT DETAILS
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.formSection}>
              
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Full Name *</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sarah Chen"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>

              {/* Company & Job Title */}
              <View style={styles.gridRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.two }]}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Company</ThemedText>
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    placeholder="e.g. Prisma Tech"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Job Title</ThemedText>
                  <TextInput
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="e.g. Director"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                </View>
              </View>

              {/* Email & Phone */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Email Address</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. sarah@prismatech.io"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Phone Number</ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +1 (415) 555-1234"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Website</ThemedText>
                <TextInput
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="e.g. www.prismatech.io"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
            </ThemedView>

            <ThemedText type="smallBold" themeColor="textSecondary" style={[styles.sectionTitle, { marginTop: Spacing.four }]}>
              MEETING CONTEXT & QUESTIONS
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.formSection}>
              
              {/* Where met */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Where did you meet them? *</ThemedText>
                <TextInput
                  value={whereMet}
                  onChangeText={setWhereMet}
                  placeholder="e.g. TechCrunch Conference, Cafe"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>

              {/* Why met */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Why / How can they help you?</ThemedText>
                <TextInput
                  value={whyMet}
                  onChangeText={setWhyMet}
                  placeholder="e.g. Potential agency client, Supplier"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>

              {/* Lead Status */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>CRM Follow-up Status</ThemedText>
                <View style={styles.statusRow}>
                  {[
                    { label: 'New', value: 'new' },
                    { label: 'Followed Up', value: 'followed_up' },
                    { label: 'Hot', value: 'hot' }
                  ].map((s) => (
                    <Pressable
                      key={s.value}
                      onPress={() => setStatus(s.value)}
                      style={[
                        styles.statusButton,
                        { borderColor: theme.backgroundSelected },
                        status === s.value && { backgroundColor: '#6366f1', borderColor: '#6366f1' }
                      ]}
                    >
                      <ThemedText 
                        type="code" 
                        style={[
                          { color: theme.text },
                          status === s.value && { color: '#ffffff', fontWeight: 'bold' }
                        ]}
                      >
                        {s.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Detailed Notes */}
              <View style={styles.inputGroup}>
                <ThemedText type="code" themeColor="textSecondary" style={styles.label}>Notes / Conversation Details</ThemedText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Write down details you will forget later..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.input, 
                    styles.textArea, 
                    { color: theme.text, borderColor: theme.backgroundSelected }
                  ]}
                />
              </View>
            </ThemedView>

            {/* Form Save Button */}
            <View style={styles.submitContainer}>
              <Pressable
                onPress={handleSaveContact}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: pressed ? '#5046e6' : '#6366f1' },
                  saving && { opacity: 0.7 }
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText type="smallBold" style={styles.buttonText}>
                    Save Contact to CRM
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                onPress={handleReset}
                disabled={saving}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' }
                ]}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Discard
                </ThemedText>
              </Pressable>
            </View>

          </ThemedView>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  headerTitle: {
    textAlign: 'center',
    fontWeight: '800',
  },
  startCard: {
    borderRadius: Spacing.two,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginTop: Spacing.three,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  cameraIcon: {
    fontSize: 28,
  },
  cardPrompt: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  cardDesc: {
    textAlign: 'center',
    marginBottom: Spacing.five,
    lineHeight: 18,
    fontSize: 13,
  },
  buttonGroup: {
    width: '100%',
    gap: Spacing.three,
  },
  primaryButton: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tertiaryButton: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    color: '#ffffff',
  },
  loadingCard: {
    borderRadius: Spacing.two,
    padding: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  loadingDesc: {
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 13,
  },
  formContainer: {
    gap: Spacing.three,
  },
  previewContainer: {
    height: 160,
    width: '100%',
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.two,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  resetBadge: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginLeft: Spacing.one,
  },
  formSection: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  gridRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusButton: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  submitContainer: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  saveButton: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

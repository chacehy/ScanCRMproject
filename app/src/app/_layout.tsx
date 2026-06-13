import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: '#050505' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

function AuthScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        if (data.session) {
          Alert.alert('Success', 'Account created and signed in successfully!');
        } else {
          Alert.alert('Verification Required', 'Please check your email inbox to verify your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.authContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.brandingContainer}>
            <View style={[styles.logoBox, { backgroundColor: colors.text }]}>
              <ThemedText style={{ color: colors.background, fontWeight: 'bold', fontSize: 18 }}>CD</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.brandTitle}>CardDex CRM</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.brandSubtitle}>
              Sign in or create a profile to sync leads in real-time
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.authCard}>
            <View style={styles.inputGroup}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.inputLabel}>Email Address</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: 'rgba(0,0,0,0.15)' }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.inputLabel}>Password</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: 'rgba(0,0,0,0.15)' }]}
              />
            </View>

            <Pressable
              onPress={handleAuth}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: pressed ? '#5046e6' : '#6366f1' },
                loading && { opacity: 0.7 }
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.toggleBtn}
          >
            <ThemedText type="code" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </ThemedText>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.five,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: 22,
  },
  brandSubtitle: {
    textAlign: 'center',
    marginTop: Spacing.one,
    fontSize: 13,
    lineHeight: 18,
  },
  authCard: {
    borderRadius: Spacing.two,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  submitBtn: {
    height: 48,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  toggleBtn: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
  },
});

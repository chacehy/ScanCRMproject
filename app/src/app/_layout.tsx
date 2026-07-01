import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkTheme, ThemeProvider } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Monogram } from '@/components/brand';
import { Card } from '@/components/card';
import { Label } from '@/components/label';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const c = Colors.dark;

export default function TabLayout() {
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
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color={c.text} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
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
          Alert.alert('Welcome', 'Your account is ready.');
        } else {
          Alert.alert('Confirm your email', 'Check your inbox for a link to verify your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      {/* ambient glow */}
      <View pointerEvents="none" style={styles.ambient} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.branding}>
            <Monogram size={48} />
            <Text style={styles.brandTitle}>CardDex</Text>
            <Label style={styles.brandKicker}>Personal CRM</Label>
          </View>

          <Card contentStyle={styles.cardInner}>
            <Text style={styles.cardHeading}>
              {isSignUp ? 'Create your account' : 'Sign in'}
            </Text>
            <Text style={styles.cardSub}>
              Sync every card you scan across your phone and the web.
            </Text>

            <View style={styles.inputGroup}>
              <Label>Email address</Label>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                placeholderTextColor={c.faint}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Password</Label>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={c.faint}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleAuth}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.primaryText} />
              ) : (
                <Text style={styles.submitText}>
                  {isSignUp ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>
          </Card>

          <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account?  Sign in' : 'Need an account?  Create one'}
            </Text>
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
    backgroundColor: c.background,
  },
  authContainer: {
    flex: 1,
    backgroundColor: c.background,
  },
  ambient: {
    position: 'absolute',
    top: -120,
    left: -60,
    right: -60,
    height: 380,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
  },
  scrollContent: {
    padding: Spacing.five,
    justifyContent: 'center',
    flexGrow: 1,
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.five,
    gap: Spacing.two,
  },
  brandTitle: {
    color: c.text,
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.8,
    marginTop: Spacing.one,
  },
  brandKicker: {
    letterSpacing: 3,
  },
  cardInner: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeading: {
    color: c.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardSub: {
    color: c.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -Spacing.two,
    marginBottom: Spacing.one,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    color: c.text,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  submitBtn: {
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    backgroundColor: c.primary,
  },
  submitText: {
    color: c.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  toggleBtn: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  toggleText: {
    color: c.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});

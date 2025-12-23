import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth, useAlert } from '@/template';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout/Screen';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { signInWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      showAlert('Error', error);
    }
  };

  const handleSendOTP = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter email and password');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    const { error } = await sendOTP(email);
    if (error) {
      showAlert('Error', error);
      return;
    }

    setShowOtpInput(true);
    showAlert('Success', 'Verification code sent to your email');
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showAlert('Error', 'Please enter verification code');
      return;
    }

    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) {
      showAlert('Error', error);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>ClothingStudio</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Professional product photography
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.toggleContainer}>
              <Button
                title="Login"
                onPress={() => {
                  setMode('login');
                  setShowOtpInput(false);
                }}
                variant={mode === 'login' ? 'primary' : 'outline'}
              />
              <View style={styles.toggleSpacer} />
              <Button
                title="Register"
                onPress={() => {
                  setMode('register');
                  setShowOtpInput(false);
                }}
                variant={mode === 'register' ? 'primary' : 'outline'}
              />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Email"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!showOtpInput}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Password"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!showOtpInput}
            />

            {mode === 'register' && !showOtpInput && (
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            {showOtpInput && (
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Enter verification code"
                placeholderTextColor={theme.textTertiary}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
              />
            )}

            {mode === 'login' ? (
              <Button
                title="Login"
                onPress={handleLogin}
                loading={operationLoading}
                fullWidth
              />
            ) : showOtpInput ? (
              <Button
                title="Verify & Create Account"
                onPress={handleVerifyOTP}
                loading={operationLoading}
                fullWidth
              />
            ) : (
              <Button
                title="Send Verification Code"
                onPress={handleSendOTP}
                loading={operationLoading}
                fullWidth
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  form: {
    gap: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  toggleSpacer: {
    width: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    minHeight: 48,
  },
});

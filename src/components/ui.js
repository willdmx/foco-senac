import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

/** @param {{title: string, onPress: () => void, variant?: string, disabled?: boolean, loading?: boolean, style?: import('react-native').StyleProp<import('react-native').ViewStyle>}} props */
export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const primary = variant === 'primary';
  const foreground = primary ? '#FFFFFF' : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [styles.button, primary ? styles.primary : variant === 'danger' ? styles.danger : variant === 'ghost' ? null : styles.secondary, (pressed || disabled || loading) && styles.dim, style]}>
      {loading && <ActivityIndicator size="small" color={foreground} />}
      <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}

/** @param {{label: string, selected?: boolean, onPress: () => void, disabled?: boolean}} props */
export function Chip({ label, selected = false, onPress, disabled = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} onPress={onPress} disabled={disabled}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, (pressed || disabled) && styles.dim]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** @param {{message: string, tone?: string, onDismiss?: () => void}} props */
export function Feedback({ message, tone = 'error', onDismiss }) {
  if (!message) return null;
  const success = tone === 'success';
  const color = success ? colors.success : tone === 'info' ? colors.primary : colors.danger;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: success ? colors.successSoft : tone === 'info' ? colors.primarySoft : colors.dangerSoft }]}>
      <Text style={[styles.feedbackText, { color }]}>{message}</Text>
      {onDismiss && <Pressable accessibilityRole="button" accessibilityLabel="Fechar mensagem" onPress={onDismiss} style={styles.dismiss}><Text style={{ color, fontSize: 22 }}>×</Text></Pressable>}
    </View>
  );
}

/** @param {{children: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle>}} props */
export function Screen({ children, style }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: colors.background },
  button: { minHeight: 52, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.primarySoft }, danger: { backgroundColor: colors.dangerSoft },
  buttonText: { fontSize: 15, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  dim: { opacity: 0.6 },
  chip: { minHeight: 44, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, lineHeight: 19, color: colors.muted, fontWeight: '500' },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  feedback: { padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackText: { flex: 1, fontSize: 14, lineHeight: 21 },
  dismiss: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});

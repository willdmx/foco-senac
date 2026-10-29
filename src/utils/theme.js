import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F6F7F9', surface: '#FFFFFF', text: '#172033', muted: '#667085',
  primary: '#4F46E5', primarySoft: '#EEEDFF', border: '#E5E7EF',
  success: '#187457', successSoft: '#E9F6EF', danger: '#B33B42', dangerSoft: '#FFF0F0',
  warning: '#895B12', warningSoft: '#FFF5DF',
};

export const commonStyles = StyleSheet.create({
  page: { padding: 24, gap: 24 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 23, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  card: { padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

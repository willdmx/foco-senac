import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PRIORIDADES, RECORRENCIAS } from '../utils/constants';
import { colors } from '../utils/theme';

function TaskCard({ task, onOpen, onToggle, busy }) {
  const priority = PRIORIDADES.find((item) => item.value === task.prioridade);
  const overdue = task.estaVencida();
  const high = task.prioridade === 'alta';
  return (
    <View style={[styles.card, task.concluida && styles.completedCard]}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${task.concluida ? 'Reabrir' : 'Concluir'} ${task.titulo}`} accessibilityState={{ checked: task.concluida, disabled: busy, busy }}
        disabled={busy} onPress={() => onToggle(task)} style={({ pressed }) => [styles.checkTarget, pressed && { opacity: 0.6 }]}>
        {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <View style={[styles.checkbox, task.concluida && styles.checked]}>{task.concluida && <Text style={styles.checkmark}>✓</Text>}</View>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Consultar tarefa: ${task.titulo}`} disabled={busy} onPress={() => onOpen(task.id)} style={styles.content}>
        <Text style={[styles.title, task.concluida && styles.completedTitle]} numberOfLines={2}>{task.titulo}</Text>
        {!!task.descricao && <Text style={styles.description} numberOfLines={1}>{task.descricao}</Text>}
        <View style={styles.tags}>
          <Text style={styles.category}>{task.categoria}</Text>
          <View style={[styles.priority, { backgroundColor: high ? colors.dangerSoft : task.prioridade === 'media' ? colors.warningSoft : colors.successSoft }]}>
            <Text style={[styles.priorityText, { color: high ? colors.danger : task.prioridade === 'media' ? colors.warning : colors.success }]}>{priority?.label}</Text>
          </View>
        </View>
        <Text style={[styles.deadline, overdue && { color: colors.danger }]}>{task.concluida ? 'Concluída' : task.getResumoPrazo()}</Text>
        {task.recorrencia !== 'nenhuma' && <Text style={styles.recurrence}>↻ {RECORRENCIAS.find((item) => item.value === task.recorrencia)?.label}</Text>}
        {task.subtarefas_total > 0 && <View style={styles.checklist}>
          <Text style={styles.deadline}>{task.subtarefas_concluidas}/{task.subtarefas_total} itens · {task.progresso_subtarefas}%</Text>
          <View accessibilityRole="progressbar" accessibilityLabel={`Checklist de ${task.titulo}`}
            accessibilityValue={{ min: 0, max: 100, now: task.progresso_subtarefas }} style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${task.progresso_subtarefas}%` }]} />
          </View>
        </View>}
      </Pressable>
      <Text accessible={false} style={styles.chevron}>›</Text>
    </View>
  );
}

export default memo(TaskCard);
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 12, padding: 10 },
  completedCard: { backgroundColor: '#FDFDFE' },
  checkTarget: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.5, borderColor: '#A9AFC0', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  content: { flex: 1, gap: 8, paddingVertical: 12, paddingLeft: 4 },
  title: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '600' },
  completedTitle: { color: colors.muted, textDecorationLine: 'line-through' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  category: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  priority: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  priorityText: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
  deadline: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  recurrence: { color: colors.primary, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  checklist: { gap: 6 },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  progressBar: { height: 4, backgroundColor: colors.success },
  chevron: { color: '#969CB0', fontSize: 25, padding: 8, alignSelf: 'center' },
});

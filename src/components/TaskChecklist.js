import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LIMITE_SUBTAREFA } from '../utils/constants';
import { colors } from '../utils/theme';
import { Button, Feedback } from './ui';

export default function TaskChecklist({
  itens, editor, novoTitulo, ocupado, acao, erro, precisaRecarregar,
  onRetry, onNovoTitulo, onAdicionar, onLimparNovo, onEditar, onTituloEdicao,
  onSalvarEdicao, onCancelarEdicao, onAlternar, onExcluir,
}) {
  const concluidos = itens.filter((item) => item.concluida).length;
  const progresso = itens.length ? Math.round((concluidos / itens.length) * 100) : 0;
  const bloqueado = ocupado || precisaRecarregar;
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>Checklist</Text>
        <Text style={styles.count}>{concluidos}/{itens.length} itens · {progresso}%</Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Progresso do checklist"
        accessibilityValue={{ min: 0, max: 100, now: progresso }} style={styles.track}>
        <View style={[styles.progress, { width: `${progresso}%` }]} />
      </View>
      <Text style={styles.hint}>Divida a tarefa em pequenos passos. Os itens têm status próprio e não concluem a tarefa automaticamente.</Text>

      {itens.length === 0 && <Text style={styles.empty}>Ainda sem itens. Adicione o primeiro passo abaixo.</Text>}
      {itens.map((item) => editor?.id === item.id ? (
        <View key={item.id} style={styles.editor}>
          <Text style={styles.label}>Editar item</Text>
          <TextInput value={editor.titulo} onChangeText={onTituloEdicao} editable={!ocupado}
            accessibilityLabel="Título do item em edição" maxLength={LIMITE_SUBTAREFA}
            placeholder="O que precisa ser feito?" placeholderTextColor={colors.muted}
            style={styles.input} autoCapitalize="sentences" onSubmitEditing={onSalvarEdicao} />
          <Text style={styles.counter}>{editor.titulo.length}/{LIMITE_SUBTAREFA}</Text>
          {!!erro && !precisaRecarregar && <Feedback message={erro} />}
          <View style={styles.editActions}>
            <Button title="Salvar item" onPress={onSalvarEdicao} disabled={bloqueado} loading={acao === 'salvar-item'} style={styles.flex} />
            <Button title="Cancelar" variant="ghost" onPress={onCancelarEdicao} disabled={ocupado} style={styles.flex} />
          </View>
        </View>
      ) : (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemContent}>
            <Pressable accessibilityRole="checkbox" accessibilityLabel={`${item.concluida ? 'Reabrir' : 'Concluir'} item: ${item.titulo}`}
              accessibilityState={{ checked: item.concluida, disabled: bloqueado || !!editor }} disabled={bloqueado || !!editor}
              onPress={() => onAlternar(item)} style={({ pressed }) => [styles.checkTarget, pressed && styles.pressed]}>
              {acao === `status-item-${item.id}` ? <ActivityIndicator size="small" color={colors.primary} /> : (
                <View style={[styles.check, item.concluida && styles.checked]}>
                  {item.concluida && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )}
            </Pressable>
            <Text style={[styles.itemTitle, item.concluida && styles.completed]}>{item.titulo}</Text>
          </View>
          <View style={styles.itemActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Editar item: ${item.titulo}`} disabled={bloqueado || !!editor}
              onPress={() => onEditar(item)} style={({ pressed }) => [styles.textButton, (pressed || bloqueado || !!editor) && styles.pressed]}>
              <Text style={styles.editText}>Editar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Excluir item: ${item.titulo}`} disabled={bloqueado || !!editor}
              onPress={() => onExcluir(item)} style={({ pressed }) => [styles.textButton, (pressed || bloqueado || !!editor) && styles.pressed]}>
              <Text style={styles.deleteText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {!!erro && (!editor || precisaRecarregar) && <Feedback message={erro} />}
      {precisaRecarregar && <Button title="Atualizar checklist" variant="secondary" onPress={onRetry} loading={acao === 'recarregar'} disabled={ocupado} />}

      <View style={styles.composer}>
        <Text style={styles.label}>Novo item</Text>
        <TextInput value={novoTitulo} onChangeText={onNovoTitulo} editable={!ocupado && !editor}
          accessibilityLabel="Título do novo item do checklist" maxLength={LIMITE_SUBTAREFA}
          placeholder="Ex.: revisar o capítulo 2" placeholderTextColor={colors.muted}
          autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={onAdicionar} style={styles.input} />
        <Text style={styles.counter}>{novoTitulo.length}/{LIMITE_SUBTAREFA}</Text>
        <Button title="＋ Adicionar item" variant="secondary" onPress={onAdicionar}
          disabled={ocupado || !!editor || precisaRecarregar} loading={acao === 'adicionar-item'} />
        {!!novoTitulo && <Button title="Limpar rascunho" variant="ghost" onPress={onLimparNovo} disabled={ocupado} />}
        {!!editor && <Text style={styles.hint}>Salve ou cancele a edição acima para adicionar outro item.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, color: colors.text, fontWeight: '700' },
  count: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  track: { height: 5, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  progress: { height: 5, borderRadius: 4, backgroundColor: colors.success },
  hint: { fontSize: 12, lineHeight: 19, color: colors.muted },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 22, paddingVertical: 8 },
  item: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 },
  itemContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.text, paddingVertical: 10 },
  completed: { textDecorationLine: 'line-through', color: colors.muted },
  checkTarget: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  check: { width: 23, height: 23, borderWidth: 1.5, borderColor: '#A9AFC0', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 },
  textButton: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  editText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.5 },
  editor: { padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft, gap: 10 },
  editActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flexGrow: 1 },
  composer: { gap: 9, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  input: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: '#F8F9FC', color: colors.text, fontSize: 15 },
  counter: { color: colors.muted, fontSize: 11, textAlign: 'right' },
});

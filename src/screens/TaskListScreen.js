import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import tarefaRepository from '../repositories';
import { CATEGORIAS, ORDENACOES, PRIORIDADES, STATUS } from '../utils/constants';
import { colors } from '../utils/theme';
import { Button, Chip, Feedback, Screen } from '../components/ui';
import TaskCard from '../components/TaskCard';
import { useFeedback } from '../components/FeedbackProvider';

const EMPTY_FILTERS = { status: 'todas', categoria: 'todas', prioridade: 'todas', ordenacao: 'recentes' };

export default function TaskListScreen({ onCreate, onOpen, filters, onFiltersChange }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendentes: 0, concluidas: 0 });
  const [loadedFilters, setLoadedFilters] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [sheet, setSheet] = useState('');
  const [draft, setDraft] = useState(filters);
  const request = useRef(0);
  const mutation = useRef(false);
  const mounted = useRef(false);
  const { notify } = useFeedback();
  const loading = loadedFilters !== filters;

  const load = useCallback(() => {
    const version = ++request.current;
    return Promise.all([tarefaRepository.listar(filters), tarefaRepository.obterIndicadores()]).then(([list, indicators]) => {
      if (version !== request.current) return;
      setTasks(list);
      setStats(indicators);
      setError('');
    }).catch((err) => {
      if (version === request.current) setError(err.message || 'Não foi possível carregar suas tarefas. Tente novamente.');
    }).finally(() => {
      if (version === request.current) { setLoadedFilters(filters); setRefreshing(false); }
    });
  }, [filters]);

  const latestLoad = useRef(load);
  useEffect(() => { latestLoad.current = load; }, [load]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    load();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') { setRefreshing(true); load(); } });
    return () => { request.current += 1; subscription.remove(); };
  }, [load]);

  const toggle = useCallback(async (task) => {
    if (mutation.current) return;
    mutation.current = true;
    setBusyId(task.id);
    try {
      await tarefaRepository.definirConclusao(task.id, !task.concluida);
      if (!mounted.current) return;
      notify(task.concluida ? 'Tarefa marcada como pendente.' : 'Tarefa concluída. Bom trabalho!');
      await latestLoad.current();
    } catch (err) { if (mounted.current) setError(err.message || 'Não foi possível mudar o status. Tente novamente.'); }
    finally { mutation.current = false; if (mounted.current) setBusyId(null); }
  }, [notify]);

  const filtered = filters.categoria !== 'todas' || filters.prioridade !== 'todas' || filters.status !== 'todas';
  const extraFilterCount = Number(filters.categoria !== 'todas') + Number(filters.prioridade !== 'todas');
  const progress = stats.total ? Math.round((stats.concluidas / stats.total) * 100) : 0;
  const sortingLabel = ORDENACOES.find((option) => option.value === filters.ordenacao)?.label;
  const changeStatus = (status) => onFiltersChange({ ...filters, status });
  const openFilters = () => { setDraft(filters); setSheet('filters'); };

  const header = (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brand}><View style={styles.logo}><View style={styles.logoInner} /></View><Text style={styles.brandName}>foco<Text style={{ color: colors.primary }}>.</Text></Text></View>
        <View style={styles.localBadge}><View style={styles.onlineDot} /><Text style={styles.localText}>Seu espaço pessoal</Text></View>
      </View>
      <View style={{ gap: 7 }}><Text style={styles.eyebrow}>UM PASSO DE CADA VEZ</Text><Text style={styles.heading}>Organize o dia.{ '\n' }Abra espaço para você.</Text><Text style={styles.subtitle}>Suas ideias viram planos. Seus planos, conquistas.</Text></View>
      <View style={styles.summary}>
        <View style={styles.summaryTop}><Text style={styles.summaryTitle}>Seu progresso</Text><Text style={styles.progressLabel}>{progress}% concluído</Text></View>
        <View accessibilityRole="progressbar" accessibilityLabel="Tarefas concluídas" accessibilityValue={{ min: 0, max: 100, now: progress }} style={styles.progressTrack}><View style={[styles.progressBar, { width: `${progress}%` }]} /></View>
        <View style={styles.stats}>
          {[{ label: 'Total', value: stats.total, status: 'todas' }, { label: 'Pendentes', value: stats.pendentes, status: 'pendentes' }, { label: 'Concluídas', value: stats.concluidas, status: 'concluidas' }].map((item, index) => (
            <Pressable key={item.status} accessibilityRole="button" accessibilityLabel={`${item.value} tarefas ${item.label.toLowerCase()}. Filtrar lista.`} onPress={() => changeStatus(item.status)} style={[styles.stat, index > 0 && styles.statBorder]}>
              <Text style={[styles.statValue, index === 2 && { color: colors.success }]}>{item.value}</Text><Text style={styles.statLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Minhas tarefas</Text><Text style={styles.resultCount}>{loading ? 'Carregando…' : `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`}</Text></View>
      <View style={styles.statusRow}>{STATUS.map((item) => <Chip key={item.value} label={item.label} selected={filters.status === item.value} onPress={() => changeStatus(item.value)} />)}</View>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" onPress={openFilters} style={styles.tool}><Text style={styles.toolText}>Filtros{extraFilterCount ? ` · ${extraFilterCount}` : ''}</Text><Text style={styles.toolIcon}>≡</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ordenar: ${sortingLabel}`} onPress={() => setSheet('sort')} style={[styles.tool, { flex: 1 }]}><Text style={styles.toolText}>{sortingLabel}</Text><Text style={styles.toolIcon}>↓</Text></Pressable>
      </View>
      {extraFilterCount > 0 && <Text style={styles.activeFilters}>{[filters.categoria !== 'todas' ? filters.categoria : '', filters.prioridade !== 'todas' ? `Prioridade ${PRIORIDADES.find((p) => p.value === filters.prioridade)?.label.toLowerCase()}` : ''].filter(Boolean).join(' · ')}</Text>}
      {!!error && !loading && <View style={{ gap: 8 }}><Feedback message={error} /><Button title="Tentar novamente" variant="secondary" onPress={() => { setLoadedFilters(null); load(); }} /></View>}
    </View>
  );

  return (
    <Screen>
      <FlatList data={loading || error ? [] : tasks} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list} ListHeaderComponent={header}
        renderItem={({ item }) => <TaskCard task={item} onOpen={onOpen} onToggle={toggle} busy={busyId === item.id} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={loading ? <ActivityIndicator accessibilityLabel="Carregando tarefas" color={colors.primary} style={styles.loading} /> : error ? null : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View>
            <Text style={styles.emptyTitle}>{filtered ? 'Nenhuma tarefa por aqui' : 'Tudo começa com um pequeno passo'}</Text>
            <Text style={styles.emptyText}>{filtered ? 'Tente outra combinação de filtros para encontrar suas tarefas.' : 'Adicione sua primeira tarefa e deixe o que importa à vista.'}</Text>
            {filtered && <Button title="Limpar filtros" variant="secondary" onPress={() => onFiltersChange({ ...EMPTY_FILTERS })} />}
          </View>
        )}
        ListFooterComponent={<Text style={styles.footerNote}>Feito para o seu ritmo. Salvo neste dispositivo.</Text>}
      />
      <View style={styles.createBar}><Button title="＋  Nova tarefa" onPress={onCreate} disabled={busyId !== null} /></View>
      <Modal visible={!!sheet} animationType="slide" transparent onRequestClose={() => setSheet('')}>
        <View style={styles.backdrop}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fechar opções" accessibilityRole="button" onPress={() => setSheet('')} />
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sectionTitle}>{sheet === 'filters' ? 'Encontre sua tarefa' : 'Ordenar tarefas'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar opções" onPress={() => setSheet('')} style={styles.close}><Text style={{ fontSize: 25, color: colors.muted }}>×</Text></Pressable></View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              {sheet === 'filters' ? <>
                <Text style={styles.filterLabel}>Categoria</Text><View style={styles.chips}>{['todas', ...CATEGORIAS].map((value) => <Chip key={value} label={value === 'todas' ? 'Todas' : value} selected={draft.categoria === value} onPress={() => setDraft({ ...draft, categoria: value })} />)}</View>
                <Text style={styles.filterLabel}>Prioridade</Text><View style={styles.chips}>{[{ value: 'todas', label: 'Todas' }, ...PRIORIDADES].map((item) => <Chip key={item.value} label={item.label} selected={draft.prioridade === item.value} onPress={() => setDraft({ ...draft, prioridade: item.value })} />)}</View>
                <Button title="Aplicar filtros" onPress={() => { onFiltersChange(draft); setSheet(''); }} /><Button title="Limpar filtros" variant="ghost" onPress={() => { onFiltersChange({ ...EMPTY_FILTERS, ordenacao: filters.ordenacao }); setSheet(''); }} />
              </> : <>{ORDENACOES.map((item) => <Chip key={item.value} label={item.label} selected={filters.ordenacao === item.value} onPress={() => { onFiltersChange({ ...filters, ordenacao: item.value }); setSheet(''); }} />)}<Text style={styles.emptyText}>Tarefas sem prazo ficam ao final ao ordenar por prazo.</Text></>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 22, paddingBottom: 16, flexGrow: 1 },
  header: { gap: 16, paddingTop: 16, paddingBottom: 18 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 30, height: 30, borderWidth: 3, borderRadius: 11, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  logoInner: { width: 9, height: 9, borderRadius: 3, backgroundColor: colors.primary },
  brandName: { fontSize: 29, letterSpacing: -1.5, fontWeight: '800', color: colors.text },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  localText: { color: colors.muted, fontSize: 11 },
  eyebrow: { fontSize: 10, letterSpacing: 1.7, fontWeight: '700', color: colors.primary },
  heading: { fontSize: 29, lineHeight: 36, fontWeight: '700', letterSpacing: -0.9, color: colors.text },
  subtitle: { fontSize: 13, lineHeight: 21, color: colors.muted },
  summary: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 4, gap: 16 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  progressLabel: { fontSize: 11, fontWeight: '600', color: colors.primary },
  progressTrack: { height: 5, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  progressBar: { height: 5, borderRadius: 4, backgroundColor: colors.primary },
  stats: { flexDirection: 'row' }, stat: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.text }, statLabel: { fontSize: 11, color: colors.muted },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  resultCount: { color: colors.muted, fontSize: 12 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolbar: { flexDirection: 'row', gap: 10 },
  tool: { minHeight: 44, borderRadius: 12, backgroundColor: '#ECEEF4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  toolText: { fontSize: 12, color: '#465068', flexShrink: 1 }, toolIcon: { fontSize: 16, color: colors.muted },
  activeFilters: { fontSize: 12, lineHeight: 18, color: colors.primary },
  loading: { padding: 30 },
  empty: { paddingHorizontal: 16, paddingVertical: 28, alignItems: 'center', gap: 14 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { fontSize: 27, color: colors.primary }, emptyTitle: { color: colors.text, fontWeight: '600', fontSize: 16, lineHeight: 23, textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  footerNote: { color: colors.muted, fontSize: 11, textAlign: 'center', marginVertical: 18 },
  createBar: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  backdrop: { flex: 1, backgroundColor: '#10182870', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '85%', paddingTop: 14, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { padding: 22, gap: 16 }, filterLabel: { color: colors.text, fontSize: 14, fontWeight: '600' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

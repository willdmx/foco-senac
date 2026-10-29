import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Screen } from '../components/ui';
import { useFeedback } from '../components/FeedbackProvider';
import tarefaRepository from '../repositories';
import { PRIORIDADES } from '../utils/constants';
import { formatarCriacao } from '../utils/dates';

/**
 * @param {{taskId: number, onBack: () => void, onEdit: (id: number) => void, onDeleted: () => void}} props
 */
export default function TaskDetailScreen({ taskId, onBack, onEdit, onDeleted }) {
  const { notify } = useFeedback();
  const [tarefa, setTarefa] = useState(/** @type {import('../models/Tarefa').default | null} */ (null));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const operacao = useRef(false);
  const prioridade = PRIORIDADES.find((item) => item.value === tarefa?.prioridade)?.label;

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro('');
      setFalhaCarga(false);
      try {
        const encontrada = await tarefaRepository.buscarPorId(taskId);
        if (ativo) setTarefa(encontrada);
      } catch {
        if (ativo) {
          setFalhaCarga(true);
          setErro('Não foi possível carregar a tarefa. Tente novamente.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [taskId, tentativa]);

  const voltar = useCallback(() => {
    if (!operacao.current) onBack();
  }, [onBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      voltar();
      return true;
    });
    return () => subscription.remove();
  }, [voltar]);

  async function alternarStatus() {
    if (operacao.current || !tarefa) return;
    operacao.current = true;
    setOcupado(true);
    setErro('');
    try {
      const novoStatus = !tarefa.concluida;
      await tarefaRepository.definirConclusao(taskId, novoStatus);
      const atualizada = await tarefaRepository.buscarPorId(taskId);
      setTarefa(atualizada);
      notify(novoStatus ? 'Tarefa concluída. Bom trabalho!' : 'Tarefa marcada como pendente.');
    } catch {
      setErro('Não foi possível atualizar o status. Tente novamente.');
    } finally {
      operacao.current = false;
      setOcupado(false);
    }
  }

  async function excluir() {
    if (operacao.current) return;
    operacao.current = true;
    setOcupado(true);
    setErro('');
    try {
      await tarefaRepository.excluir(taskId);
      notify('Tarefa excluída.');
      onDeleted();
    } catch {
      setErro('Não foi possível excluir a tarefa. Tente novamente.');
    } finally {
      operacao.current = false;
      setOcupado(false);
    }
  }

  function confirmarExclusao() {
    if (operacao.current || !tarefa) return;
    Alert.alert('Excluir tarefa?', `“${tarefa.titulo}” será excluída permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluir },
    ]);
  }

  return (
    <Screen>
      <View style={styles.topbar}>
        <Button title="‹ Voltar" variant="ghost" onPress={voltar} disabled={ocupado} />
        <Text style={styles.brand}>SUA TAREFA</Text>
      </View>
      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.muted}>Carregando detalhes…</Text>
        </View>
      ) : falhaCarga ? (
        <View style={styles.message}>
          <Feedback message={erro} />
          <Button title="Tentar novamente" onPress={() => setTentativa((atual) => atual + 1)} />
        </View>
      ) : !tarefa ? (
        <View style={styles.message}>
          <Text style={styles.title}>Tarefa não encontrada</Text>
          <Text style={styles.muted}>Ela pode ter sido excluída. Volte para conferir suas tarefas.</Text>
          <Button title="Ir para minhas tarefas" onPress={onBack} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.badges}>
            <View style={[styles.badge, tarefa.concluida ? styles.doneBadge : styles.pendingBadge]}>
              <Text style={[styles.badgeText, tarefa.concluida ? styles.doneText : styles.pendingText]}>
                {tarefa.concluida ? '✓  Concluída' : '○  Pendente'}
              </Text>
            </View>
            <Text style={styles.category}>{tarefa.categoria}</Text>
          </View>
          <Text style={styles.title}>{tarefa.titulo}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DESCRIÇÃO</Text>
            <Text selectable style={[styles.description, !tarefa.descricao && styles.muted]}>
              {tarefa.descricao || 'Nenhuma descrição adicionada.'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.metadata}>
              <Text style={styles.metadataLabel}>Prioridade</Text>
              <Text style={[styles.metadataValue, tarefa.prioridade === 'alta' && styles.urgent]}>{prioridade}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metadata}>
              <Text style={styles.metadataLabel}>Prazo</Text>
              <Text style={[styles.metadataValue, tarefa.estaVencida() && styles.urgent]}>{tarefa.getResumoPrazo()}</Text>
            </View>
            {tarefa.estaVencida() && <Text style={styles.overdue}>Prazo vencido. Você pode ajustar a data ou concluir a tarefa.</Text>}
            <View style={styles.divider} />
            <View style={styles.metadata}>
              <Text style={styles.metadataLabel}>Criada em</Text>
              <Text style={styles.metadataValue}>{formatarCriacao(tarefa.criado_em)}</Text>
            </View>
          </View>

          {!!erro && <Feedback message={erro} />}
          <Button title={tarefa.concluida ? 'Marcar como pendente' : '✓  Concluir tarefa'} onPress={alternarStatus} loading={ocupado} />
          <Button title="Editar tarefa" variant="secondary" disabled={ocupado} onPress={() => onEdit(taskId)} />
          <Button title="Excluir tarefa" variant="danger" disabled={ocupado} onPress={confirmarExclusao} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  brand: { color: '#737B8F', fontWeight: '800', fontSize: 11, letterSpacing: 2, marginRight: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  content: { padding: 24, paddingTop: 20, paddingBottom: 36, gap: 16 },
  message: { padding: 24, gap: 16 },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  doneBadge: { backgroundColor: '#E7F4EB' },
  pendingBadge: { backgroundColor: '#EEF0FF' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  doneText: { color: '#267044' },
  pendingText: { color: '#4F46E5' },
  category: { fontSize: 13, color: '#687185' },
  title: { fontSize: 30, lineHeight: 39, fontWeight: '800', color: '#172033', letterSpacing: -0.7, marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E7E9F0', padding: 20, gap: 16 },
  sectionLabel: { fontSize: 11, color: '#687185', fontWeight: '700', letterSpacing: 1.4 },
  description: { fontSize: 16, lineHeight: 26, color: '#30394B' },
  muted: { color: '#687185', fontSize: 14, lineHeight: 22 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  metadataLabel: { color: '#687185', fontSize: 14 },
  metadataValue: { color: '#172033', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  divider: { height: 1, backgroundColor: '#EEF0F5' },
  urgent: { color: '#BB4246' },
  overdue: { fontSize: 12, lineHeight: 19, color: '#BB4246' },
});

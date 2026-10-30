import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Feedback, Screen } from '../components/ui';
import TaskChecklist from '../components/TaskChecklist';
import { useFeedback } from '../components/FeedbackProvider';
import tarefaRepository from '../repositories';
import { PRIORIDADES, RECORRENCIAS } from '../utils/constants';
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
  const [acao, setAcao] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [itens, setItens] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [editor, setEditor] = useState(null);
  const [erroChecklist, setErroChecklist] = useState('');
  const [precisaRecarregar, setPrecisaRecarregar] = useState(false);
  const operacao = useRef(false);
  const ocupado = acao !== '';
  const temRascunho = !!novoTitulo.trim() || !!(editor && editor.titulo !== editor.original);
  const prioridade = PRIORIDADES.find((item) => item.value === tarefa?.prioridade)?.label;

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro('');
      setFalhaCarga(false);
      try {
        const encontrada = await tarefaRepository.buscarPorId(taskId);
        const checklist = encontrada ? await tarefaRepository.listarSubtarefas(taskId) : [];
        if (ativo) { setTarefa(encontrada); setItens(checklist); setPrecisaRecarregar(false); }
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

  const pedirSaida = useCallback((sair) => {
    if (operacao.current) return;
    if (!temRascunho) { sair(); return; }
    Alert.alert('Descartar rascunho do checklist?', 'Há um item que ainda não foi salvo. Os itens já salvos serão mantidos.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar e sair', style: 'destructive', onPress: sair },
    ]);
  }, [temRascunho]);

  const voltar = useCallback(() => pedirSaida(onBack), [onBack, pedirSaida]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      voltar();
      return true;
    });
    return () => subscription.remove();
  }, [voltar]);

  async function atualizarConteudo() {
    const atualizada = await tarefaRepository.buscarPorId(taskId);
    const checklist = atualizada ? await tarefaRepository.listarSubtarefas(taskId) : [];
    setTarefa(atualizada);
    setItens(checklist);
    setPrecisaRecarregar(false);
  }

  async function recarregar() {
    if (operacao.current) return;
    operacao.current = true;
    setAcao('recarregar');
    try {
      await atualizarConteudo();
      setErro('');
      setErroChecklist('');
    } catch {
      setErroChecklist('Não foi possível atualizar os dados. Seus rascunhos foram mantidos. Tente novamente.');
      setPrecisaRecarregar(true);
    } finally {
      operacao.current = false;
      setAcao('');
    }
  }

  async function alterarChecklist(nomeAcao, salvar, mensagem, aposSalvar = () => {}) {
    if (operacao.current || precisaRecarregar) return;
    operacao.current = true;
    setAcao(nomeAcao);
    setErroChecklist('');
    let persistiu = false;
    try {
      await salvar();
      persistiu = true;
      // Limpa o rascunho após a escrita, mesmo se uma consulta posterior falhar.
      // Assim, tentar atualizar a tela não cria o mesmo item duas vezes.
      aposSalvar();
      notify(mensagem);
      await atualizarConteudo();
    } catch (error) {
      if (persistiu) {
        setErroChecklist('A alteração foi salva, mas não foi possível atualizar a tela. Toque em Atualizar checklist.');
        setPrecisaRecarregar(true);
      } else {
        setErroChecklist(error instanceof Error ? error.message : 'Não foi possível salvar o item. Tente novamente.');
      }
    } finally {
      operacao.current = false;
      setAcao('');
    }
  }

  function adicionarItem() {
    if (editor || operacao.current) return;
    if (!novoTitulo.trim()) { setErroChecklist('Informe um título para adicionar um item ao checklist.'); return; }
    alterarChecklist('adicionar-item', () => tarefaRepository.criarSubtarefa(taskId, novoTitulo), 'Item adicionado ao checklist.', () => setNovoTitulo(''));
  }

  function salvarItem() {
    if (!editor || operacao.current) return;
    if (!editor.titulo.trim()) { setErroChecklist('O título do item não pode ficar vazio.'); return; }
    alterarChecklist('salvar-item', () => tarefaRepository.atualizarSubtarefa(editor.id, editor.titulo), 'Item atualizado.', () => setEditor(null));
  }

  function cancelarEdicao() {
    if (!editor || operacao.current) return;
    const cancelar = () => { setEditor(null); setErroChecklist(''); };
    if (editor.titulo === editor.original) { cancelar(); return; }
    Alert.alert('Descartar alteração do item?', 'O título original do item será mantido.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: cancelar },
    ]);
  }

  function excluirItem(item) {
    if (operacao.current || precisaRecarregar) return;
    Alert.alert('Excluir item?', `“${item.titulo}” será removido do checklist. A tarefa será mantida.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => alterarChecklist(`excluir-item-${item.id}`,
        () => tarefaRepository.excluirSubtarefa(item.id), 'Item excluído do checklist.') },
    ]);
  }

  async function alternarStatus() {
    if (operacao.current || !tarefa || precisaRecarregar || temRascunho) return;
    operacao.current = true;
    setAcao('status');
    setErro('');
    let persistiu = false;
    try {
      const novoStatus = !tarefa.concluida;
      const resultado = await tarefaRepository.definirConclusao(taskId, novoStatus);
      persistiu = true;
      notify(!novoStatus ? 'Tarefa marcada como pendente.' : resultado.gerada
        ? 'Tarefa concluída. A próxima ocorrência já está na lista, com os itens pendentes.' : 'Tarefa concluída. Bom trabalho!');
      await atualizarConteudo();
    } catch (error) {
      setErro(persistiu ? 'O status foi salvo, mas a tela não pôde ser atualizada. Atualize os dados antes de continuar.'
        : error instanceof Error ? error.message : 'Não foi possível atualizar o status. Tente novamente.');
      if (persistiu) setPrecisaRecarregar(true);
    } finally {
      operacao.current = false;
      setAcao('');
    }
  }

  async function excluir() {
    if (operacao.current) return;
    operacao.current = true;
    setAcao('excluir');
    setErro('');
    try {
      await tarefaRepository.excluir(taskId);
      notify('Tarefa excluída.');
      onDeleted();
    } catch {
      setErro('Não foi possível excluir a tarefa. Tente novamente.');
    } finally {
      operacao.current = false;
      setAcao('');
    }
  }

  function confirmarExclusao() {
    if (operacao.current || !tarefa) return;
    Alert.alert('Excluir tarefa?', `“${tarefa.titulo}” e todos os seus itens do checklist serão excluídos permanentemente.`, [
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
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
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
            <View style={styles.divider} />
            <View style={styles.metadata}>
              <Text style={styles.metadataLabel}>Repetição</Text>
              <Text style={styles.metadataValue}>{RECORRENCIAS.find((item) => item.value === tarefa.recorrencia)?.label}</Text>
            </View>
            {tarefa.recorrencia !== 'nenhuma' && <Text style={styles.hint}>Ao concluir, o próximo prazo será {tarefa.recorrencia === 'diaria' ? '1 dia' : '7 dias'} após o prazo desta ocorrência. O checklist será copiado com os itens pendentes.</Text>}
            {tarefa.origem_id !== null && <Text style={styles.hint}>Esta tarefa foi criada a partir da ocorrência nº {tarefa.origem_id}.</Text>}
            {tarefa.proxima_gerada && <Feedback tone="info" message="A próxima ocorrência já foi criada. Reabrir e concluir esta tarefa novamente não cria outra cópia." />}
          </View>

          <TaskChecklist itens={itens} editor={editor} novoTitulo={novoTitulo} ocupado={ocupado} acao={acao}
            erro={erroChecklist} precisaRecarregar={precisaRecarregar} onRetry={recarregar}
            onNovoTitulo={(value) => { setNovoTitulo(value); if (!precisaRecarregar) setErroChecklist(''); }}
            onAdicionar={adicionarItem} onLimparNovo={() => { setNovoTitulo(''); if (!precisaRecarregar) setErroChecklist(''); }}
            onEditar={(item) => { if (!operacao.current && !precisaRecarregar) { setEditor({ id: item.id, titulo: item.titulo, original: item.titulo }); setErroChecklist(''); } }}
            onTituloEdicao={(value) => { setEditor((atual) => ({ ...atual, titulo: value })); setErroChecklist(''); }}
            onSalvarEdicao={salvarItem} onCancelarEdicao={cancelarEdicao}
            onAlternar={(item) => alterarChecklist(`status-item-${item.id}`, () => tarefaRepository.definirConclusaoSubtarefa(item.id, !item.concluida), item.concluida ? 'Item marcado como pendente.' : 'Item concluído.')}
            onExcluir={excluirItem} />

          {!!erro && <Feedback message={erro} />}
          {precisaRecarregar && <Button title="Atualizar detalhes" variant="secondary" onPress={recarregar} disabled={ocupado} loading={acao === 'recarregar'} />}
          {temRascunho && <Text style={styles.hint}>Salve ou descarte o rascunho do checklist antes de mudar o status da tarefa.</Text>}
          <Button title={tarefa.concluida ? 'Marcar como pendente' : '✓  Concluir tarefa'} onPress={alternarStatus} loading={acao === 'status'} disabled={ocupado || precisaRecarregar || temRascunho} />
          <Button title="Editar tarefa" variant="secondary" disabled={ocupado} onPress={() => pedirSaida(() => onEdit(taskId))} />
          <Button title="Excluir tarefa" variant="danger" disabled={ocupado} loading={acao === 'excluir'} onPress={confirmarExclusao} />
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  hint: { color: '#687185', fontSize: 12, lineHeight: 20 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  metadataLabel: { color: '#687185', fontSize: 14 },
  metadataValue: { color: '#172033', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  divider: { height: 1, backgroundColor: '#EEF0F5' },
  urgent: { color: '#BB4246' },
  overdue: { fontSize: 12, lineHeight: 19, color: '#BB4246' },
});

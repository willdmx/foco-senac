import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Chip, Feedback, Screen } from '../components/ui';
import { useFeedback } from '../components/FeedbackProvider';
import tarefaRepository from '../repositories';
import { CATEGORIAS, PRIORIDADES, RECORRENCIAS, LIMITE_TITULO, LIMITE_DESCRICAO } from '../utils/constants';
import { formatarPrazo, parsePrazoBR } from '../utils/dates';
import { ValidationError } from '../utils/errors';

const FORM_VAZIO = {
  titulo: '', descricao: '', categoria: 'Pessoal', prioridade: 'media', prazo: '', recorrencia: 'nenhuma',
};

/** @param {string} texto */
function mascararData(texto) {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length > 4) return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
  return numeros.length > 2 ? `${numeros.slice(0, 2)}/${numeros.slice(2)}` : numeros;
}

/**
 * @param {{taskId?: number | null, onBack: () => void, onSaved: (tarefa: import('../models/Tarefa').default) => void}} props
 */
export default function TaskFormScreen({ taskId = null, onBack, onSaved }) {
  const editando = taskId !== null;
  const { notify } = useFeedback();
  const [form, setForm] = useState(FORM_VAZIO);
  const [original, setOriginal] = useState(JSON.stringify(FORM_VAZIO));
  const [carregando, setCarregando] = useState(editando);
  const [falhaCarga, setFalhaCarga] = useState('');
  const [erro, setErro] = useState('');
  const [campoErro, setCampoErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [jaGerouProxima, setJaGerouProxima] = useState(false);
  const operacao = useRef(false);
  const tituloRef = useRef(/** @type {TextInput | null} */ (null));
  const prazoRef = useRef(/** @type {TextInput | null} */ (null));
  const scrollRef = useRef(/** @type {ScrollView | null} */ (null));
  const alterado = JSON.stringify(form) !== original;

  useEffect(() => {
    if (!editando) return;
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setFalhaCarga('');
      try {
        const tarefa = await tarefaRepository.buscarPorId(taskId);
        if (!ativo) return;
        if (!tarefa) {
          setFalhaCarga('Esta tarefa não foi encontrada. Ela pode ter sido excluída.');
          return;
        }
        const valores = {
          titulo: tarefa.titulo,
          descricao: tarefa.descricao,
          categoria: tarefa.categoria,
          prioridade: tarefa.prioridade,
          prazo: tarefa.prazo ? formatarPrazo(tarefa.prazo) : '',
          recorrencia: tarefa.recorrencia,
        };
        setForm(valores);
        setOriginal(JSON.stringify(valores));
        setJaGerouProxima(tarefa.proxima_gerada);
      } catch {
        if (ativo) setFalhaCarga('Não foi possível abrir a tarefa. Tente novamente.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [editando, taskId, tentativa]);

  const pedirVolta = useCallback(() => {
    if (operacao.current) return;
    if (!alterado) { onBack(); return; }
    Alert.alert('Descartar alterações?', 'As alterações deste formulário ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onBack },
    ]);
  }, [alterado, onBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      pedirVolta();
      return true;
    });
    return () => subscription.remove();
  }, [pedirVolta]);

  /** @param {keyof typeof FORM_VAZIO} campo @param {string} valor */
  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    if (campoErro === campo) { setErro(''); setCampoErro(''); }
  }

  async function salvar() {
    if (operacao.current) return;
    setErro('');
    setCampoErro('');
    if (!form.titulo.trim()) {
      setErro('Dê um título à tarefa antes de salvar.');
      setCampoErro('titulo');
      tituloRef.current?.focus();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    operacao.current = true;
    setSalvando(true);
    try {
      const dados = { ...form, prazo: parsePrazoBR(form.prazo) };
      const tarefa = editando
        ? await tarefaRepository.atualizar(taskId, dados)
        : await tarefaRepository.criar(dados);
      if (!tarefa) throw new Error('A tarefa salva não está disponível.');
      Keyboard.dismiss();
      notify(editando ? 'Alterações salvas.' : 'Tarefa criada. Um passo de cada vez!');
      onSaved(tarefa);
    } catch (error) {
      if (error instanceof ValidationError) {
        setErro(error.message);
        setCampoErro(error.field);
        if (error.field === 'titulo') tituloRef.current?.focus();
        if (error.field === 'prazo') prazoRef.current?.focus();
      } else {
        setErro('Não foi possível salvar a tarefa. Seus dados continuam aqui; tente novamente.');
      }
    } finally {
      operacao.current = false;
      setSalvando(false);
    }
  }

  return (
    <Screen>
      <View style={styles.topbar}>
        <Button title="‹ Voltar" variant="ghost" onPress={pedirVolta} disabled={salvando} />
        <Text style={styles.brand}>FOCO</Text>
      </View>
      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.hint}>Abrindo sua tarefa…</Text>
        </View>
      ) : falhaCarga ? (
        <View style={styles.errorContainer}>
          <Feedback message={falhaCarga} />
          <Button title="Tentar novamente" onPress={() => setTentativa((atual) => atual + 1)} />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>{editando ? 'AJUSTE SEUS PLANOS' : 'DÊ O PRÓXIMO PASSO'}</Text>
              <Text style={styles.title}>{editando ? 'Editar tarefa' : 'Nova tarefa'}</Text>
              <Text style={styles.subtitle}>Organize o que importa. Informe um título e, se a tarefa se repetir, um prazo.</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Título <Text style={styles.required}>*</Text></Text>
                <TextInput ref={tituloRef} value={form.titulo}
                  onChangeText={(value) => alterar('titulo', value)} placeholder="O que você precisa fazer?"
                  placeholderTextColor="#858C9B" accessibilityLabel="Título da tarefa, obrigatório"
                  maxLength={LIMITE_TITULO} editable={!salvando} autoCapitalize="sentences" returnKeyType="next"
                  style={[styles.input, campoErro === 'titulo' && styles.inputError]} />
                <Text style={styles.counter}>{form.titulo.length}/{LIMITE_TITULO}</Text>
                {campoErro === 'titulo' && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{erro}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Descrição <Text style={styles.optional}>· opcional</Text></Text>
                <TextInput value={form.descricao} onChangeText={(value) => alterar('descricao', value)}
                  placeholder="Anotações, etapas ou detalhes importantes…" placeholderTextColor="#858C9B"
                  accessibilityLabel="Descrição da tarefa, opcional" maxLength={LIMITE_DESCRICAO}
                  multiline textAlignVertical="top" editable={!salvando} style={[styles.input, styles.textarea]} />
                <Text style={styles.counter}>{form.descricao.length}/{LIMITE_DESCRICAO}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chips}>
                  {CATEGORIAS.map((categoria) => (
                    <Chip key={categoria} label={categoria} selected={form.categoria === categoria}
                      onPress={() => alterar('categoria', categoria)} disabled={salvando} />
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Prioridade</Text>
                <View style={styles.chips}>
                  {PRIORIDADES.map((prioridade) => (
                    <Chip key={prioridade.value} label={prioridade.label} selected={form.prioridade === prioridade.value}
                      onPress={() => alterar('prioridade', prioridade.value)} disabled={salvando} />
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Repetição</Text>
                <View style={styles.chips}>
                  {RECORRENCIAS.map((recorrencia) => (
                    <Chip key={recorrencia.value} label={recorrencia.label} selected={form.recorrencia === recorrencia.value}
                      onPress={() => alterar('recorrencia', recorrencia.value)} disabled={salvando} />
                  ))}
                </View>
                <Text style={styles.hint}>{form.recorrencia === 'nenhuma'
                  ? 'Esta tarefa será realizada uma vez.'
                  : `Ao concluir, uma nova tarefa será criada com prazo ${form.recorrencia === 'diaria' ? '1 dia' : '7 dias'} após o prazo desta ocorrência. O checklist será copiado com todos os itens pendentes.`}</Text>
                {jaGerouProxima && <Text style={styles.hint}>Esta ocorrência já gerou a próxima. Alterações aqui não modificam a próxima tarefa.</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Prazo {form.recorrencia === 'nenhuma'
                  ? <Text style={styles.optional}>· opcional</Text> : <Text style={styles.required}>*</Text>}</Text>
                <TextInput ref={prazoRef} value={form.prazo} onChangeText={(value) => alterar('prazo', mascararData(value))}
                  placeholder="DD/MM/AAAA" placeholderTextColor="#858C9B"
                  accessibilityLabel={`Prazo ${form.recorrencia === 'nenhuma' ? 'opcional' : 'obrigatório'}, dia mês e ano`} keyboardType="number-pad" maxLength={10}
                  editable={!salvando} style={[styles.input, campoErro === 'prazo' && styles.inputError]} />
                {campoErro === 'prazo' && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{erro}</Text>}
                <Text style={styles.hint}>{form.recorrencia === 'nenhuma' ? 'Deixe em branco para uma tarefa sem prazo. ' : 'Tarefas com repetição precisam de uma data. '}Datas passadas serão sinalizadas como vencidas.</Text>
                {form.prazo !== '' && (
                  <Button title="Remover prazo" variant="ghost" onPress={() => alterar('prazo', '')} disabled={salvando} />
                )}
              </View>
            </View>

            {!!erro && !['titulo', 'prazo'].includes(campoErro) && <Feedback message={erro} />}
            <Button title={editando ? 'Salvar alterações' : 'Criar tarefa'} onPress={salvar} loading={salvando} />
            <Button title="Cancelar" variant="ghost" onPress={pedirVolta} disabled={salvando} />
            <Text style={styles.footer}>Seus planos ficam salvos neste dispositivo.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  brand: { color: '#737B8F', fontWeight: '800', fontSize: 12, letterSpacing: 3, marginRight: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorContainer: { padding: 24, gap: 16 },
  content: { padding: 24, paddingTop: 12, gap: 16, paddingBottom: 32 },
  heading: { gap: 8, marginBottom: 6 },
  eyebrow: { fontSize: 11, color: '#4F46E5', fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: '800', color: '#172033', letterSpacing: -1 },
  subtitle: { fontSize: 15, lineHeight: 23, color: '#687185' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E7E9F0', padding: 20, gap: 24 },
  field: { gap: 9 },
  label: { color: '#172033', fontSize: 15, fontWeight: '700' },
  required: { color: '#4F46E5' },
  optional: { color: '#737B8F', fontSize: 12, fontWeight: '400' },
  input: { backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: '#E1E4EC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#172033', minHeight: 50 },
  inputError: { borderColor: '#C63D47' },
  fieldError: { color: '#BB4246', fontSize: 13, lineHeight: 19 },
  textarea: { minHeight: 112 },
  counter: { fontSize: 11, color: '#737B8F', textAlign: 'right' },
  hint: { color: '#687185', fontSize: 12, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { color: '#737B8F', textAlign: 'center', fontSize: 12, lineHeight: 18 },
});

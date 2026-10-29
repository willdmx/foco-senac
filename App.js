import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import TaskListScreen from './src/screens/TaskListScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import { FeedbackProvider } from './src/components/FeedbackProvider';
import { colors } from './src/utils/theme';

export default function App() {
  // A navegação é estado local. A fonte de verdade das tarefas é o SQLite.
  const [navigation, setNavigation] = useState({ screen: 'list', taskId: null });
  const [filters, setFilters] = useState({ status: 'todas', categoria: 'todas', prioridade: 'todas', ordenacao: 'recentes' });
  const showList = useCallback(() => setNavigation({ screen: 'list', taskId: null }), []);
  const showDetail = useCallback((id) => setNavigation({ screen: 'detail', taskId: id }), []);
  const showCreate = useCallback(() => setNavigation({ screen: 'form', taskId: null }), []);
  const showEdit = useCallback((id) => setNavigation({ screen: 'form', taskId: id }), []);
  const formBack = useCallback(() => {
    setNavigation((current) => ({ screen: current.taskId ? 'detail' : 'list', taskId: current.taskId }));
  }, []);
  const afterSave = useCallback((task) => showDetail(task.id), [showDetail]);
  const Container = Platform.OS === 'ios' ? SafeAreaView : View;

  return (
    <Container style={[styles.container, Platform.OS === 'android' && styles.androidInsets]}>
      <StatusBar style="dark" />
      <FeedbackProvider>
        {navigation.screen === 'list' && <TaskListScreen filters={filters} onFiltersChange={setFilters} onCreate={showCreate} onOpen={showDetail} />}
        {navigation.screen === 'form' && <TaskFormScreen taskId={navigation.taskId} onBack={formBack} onSaved={afterSave} />}
        {navigation.screen === 'detail' && <TaskDetailScreen taskId={navigation.taskId} onBack={showList} onEdit={showEdit} onDeleted={showList} />}
      </FeedbackProvider>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Reserva inferior conservadora para gestos/botões do Android em edge-to-edge.
  androidInsets: { paddingTop: NativeStatusBar.currentHeight || 24, paddingBottom: 48 },
});

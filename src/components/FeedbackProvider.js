import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feedback } from './ui';

const FeedbackContext = createContext({ notify: (message) => { void message; } });

export function FeedbackProvider({ children }) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const notify = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <FeedbackContext.Provider value={{ notify }}>
      {children}
      {!!message && <View style={styles.toast}><Feedback message={message} tone="success" onDismiss={() => setMessage('')} /></View>}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
const styles = StyleSheet.create({ toast: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6, width: '100%', maxWidth: 720, alignSelf: 'center' } });

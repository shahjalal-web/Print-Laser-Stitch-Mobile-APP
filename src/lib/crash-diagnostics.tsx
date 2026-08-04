import { Component, useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type CapturedError = { message: string; stack?: string; source: string };

let capturedError: CapturedError | null = null;
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function capture(source: string, error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  capturedError = { message: err.message, stack: err.stack, source };
  notifyListeners();
}

/** Installs a handler for JS errors thrown outside of React's render cycle
 * (event handlers, timers, native callbacks) so they render on screen
 * instead of silently terminating the app in a release build. */
export function installGlobalErrorHandler() {
  const g = globalThis as unknown as {
    ErrorUtils?: { setGlobalHandler: (cb: (error: Error, isFatal?: boolean) => void) => void };
    __crashDiagnosticsInstalled?: boolean;
  };
  if (!g.ErrorUtils || g.__crashDiagnosticsInstalled) return;
  g.__crashDiagnosticsInstalled = true;
  g.ErrorUtils.setGlobalHandler((error) => capture('global', error));
}

export function useGlobalCrashError(): CapturedError | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);
  return capturedError;
}

export function CrashScreen({ message, stack, source }: CapturedError) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Debug build — error caught ({source})</Text>
        <Text style={styles.message}>{message}</Text>
        {stack ? <Text style={styles.stack}>{stack}</Text> : null}
      </ScrollView>
    </View>
  );
}

type BoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    capture('render', error);
  }

  render() {
    if (this.state.error) {
      return <CrashScreen message={this.state.error.message} stack={this.state.error.stack} source="render" />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0000', paddingTop: 60 },
  scroll: { padding: 16, paddingBottom: 60 },
  title: { color: '#ff6b6b', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  message: { color: '#fff', fontSize: 14, marginBottom: 16 },
  stack: { color: '#ccc', fontSize: 11 },
});

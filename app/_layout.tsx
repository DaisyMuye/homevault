import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const refreshAll = useStore((s) => s.refreshAll);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
        setReady(true);
      } catch (e: any) {
        setError(e?.message || '初始化失败');
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😵</Text>
        <Text style={styles.title}>启动失败</Text>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🏠</Text>
        <ActivityIndicator size="large" color="#FF8C69" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="room/[id]" />
        <Stack.Screen name="cabinet/[id]" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="search" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-room" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-cabinet" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    gap: 12,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700', color: '#3D2B1F' },
  message: { fontSize: 14, color: '#8B7355', textAlign: 'center', paddingHorizontal: 40 },
  loadingText: { fontSize: 15, color: '#8B7355' },
});

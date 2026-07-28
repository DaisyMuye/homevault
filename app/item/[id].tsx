import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { ActionLog } from '../../types';
import { getItemHistory } from '../../lib/database';

const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
  green: '#4CAF50',
  gray: '#D0D0D0',
};

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const items = useStore((s) => s.items);
  const takeItem = useStore((s) => s.takeItem);
  const returnItem = useStore((s) => s.returnItem);

  const item = Object.values(items).flat().find((i) => i.id === id);
  const [history, setHistory] = useState<ActionLog[]>([]);

  useEffect(() => {
    if (id) getItemHistory(id).then(setHistory);
  }, [id]);

  const handleTake = () => {
    if (!item) return;
    Alert.alert('拿走物品', `确定拿走「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认拿走',
        onPress: async () => {
          await takeItem(item.id);
          router.back();
        },
      },
    ]);
  };

  const handleReturn = () => {
    if (!item) return;
    Alert.alert('放回物品', `确定已将「${item.name}」放回原位吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '已放回',
        onPress: async () => {
          await returnItem(item.id);
          router.back();
        },
      },
    ]);
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: '物品详情', headerStyle: { backgroundColor: COLORS.card }, headerTintColor: COLORS.text }} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>物品不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: item.name,
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageSection}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.mainImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.emoji}>{getItemEmoji(item.name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>数量</Text>
            <Text style={styles.infoValue}>{item.quantity}</Text>
          </View>
          {item.notes ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>备注</Text>
              <Text style={styles.infoValue}>{item.notes}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>状态</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'in_place' ? COLORS.green : COLORS.gray }]} />
              <Text style={styles.statusText}>
                {item.status === 'in_place' ? '在家' : '已拿走'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.actionBtn, item.status === 'in_place' ? styles.takeBtn : styles.returnBtn]}
          onPress={item.status === 'in_place' ? handleTake : handleReturn}
        >
          <Ionicons
            name={item.status === 'in_place' ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={22}
            color="#FFF"
          />
          <Text style={styles.actionBtnText}>
            {item.status === 'in_place' ? '拿走物品' : '放回物品'}
          </Text>
        </Pressable>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>操作记录</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistory}>暂无记录</Text>
          ) : (
            history.map((log) => (
              <View key={log.id} style={styles.historyItem}>
                <Ionicons
                  name={log.action === 'take' ? 'arrow-up-circle' : 'arrow-down-circle'}
                  size={20}
                  color={log.action === 'take' ? COLORS.primary : COLORS.green}
                />
                <View style={styles.historyContent}>
                  <Text style={styles.historyAction}>
                    {log.action === 'take' ? '拿走了' : '放回了'}
                  </Text>
                  <Text style={styles.historyTime}>
                    {formatDateTime(log.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getItemEmoji(name: string): string {
  const map: Record<string, string> = {
    '钥匙': '🔑', '充电器': '🔋', '笔': '✏️', '手机': '📱',
    '钱包': '👛', '耳机': '🎧', '书': '📖', '剪刀': '✂️',
    '杯子': '☕', '遥控器': '📺', '数据线': '🔌',
    '纸巾': '🧻', '雨伞': '☂️', '刀': '🔪', '碗': '🍚',
    '衣服': '👕', '鞋': '👟', '包': '👜', '药': '💊',
    '证件': '🪪', '工具': '🔧', '电池': '🔋',
  };
  for (const [key, emoji] of Object.entries(map)) {
    if (name.includes(key)) return emoji;
  }
  return '📦';
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 64 },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  itemName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EB',
  },
  infoLabel: { fontSize: 15, color: COLORS.textSecondary },
  infoValue: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  takeBtn: { backgroundColor: COLORS.primary },
  returnBtn: { backgroundColor: COLORS.green },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  historySection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  historyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  noHistory: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EB',
  },
  historyContent: { flex: 1 },
  historyAction: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  historyTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { ItemWithPath } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
  green: '#4CAF50',
  gray: '#D0D0D0',
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const searchResults = useStore((s) => s.searchResults);
  const search = useStore((s) => s.search);
  const takeItem = useStore((s) => s.takeItem);
  const returnItem = useStore((s) => s.returnItem);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    search(text);
  }, [search]);

  const handleTake = (item: ItemWithPath) => {
    Alert.alert('拿走物品', `确定拿走「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认拿走',
        onPress: async () => {
          await takeItem(item.id);
          search(query);
        },
      },
    ]);
  };

  const handleReturn = (item: ItemWithPath) => {
    Alert.alert('放回物品', `确定已将「${item.name}」放回吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '已放回',
        onPress: async () => {
          await returnItem(item.id);
          search(query);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="搜索物品名称..."
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); search(''); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>取消</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.results}>
        {query.trim() === '' ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color="#D5C5B5" />
            <Text style={styles.emptyText}>输入物品名称开始搜索</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#D5C5B5" />
            <Text style={styles.emptyText}>没有找到匹配的物品</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>找到 {searchResults.length} 件物品</Text>
            {searchResults.map((item) => (
              <View key={item.id} style={styles.resultItem}>
                <Pressable
                  style={styles.resultInfo}
                  onPress={() => router.push(`/item/${item.id}`)}
                >
                  <Text style={styles.resultEmoji}>{getItemEmoji(item.name)}</Text>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultName, item.status === 'taken' && styles.resultNameTaken]}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultPath}>
                      {item.roomName} › {item.cabinetName}
                    </Text>
                    {item.status === 'taken' && (
                      <Text style={styles.resultStatus}>⚪ 已拿走</Text>
                    )}
                  </View>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    item.status === 'in_place' ? styles.takeBtn : styles.returnBtn,
                  ]}
                  onPress={() => item.status === 'in_place' ? handleTake(item) : handleReturn(item)}
                >
                  <Text style={styles.actionBtnText}>
                    {item.status === 'in_place' ? '拿走' : '放回'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  results: { padding: 16, paddingBottom: 40 },
  resultCount: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  resultInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultEmoji: { fontSize: 28 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  resultNameTaken: { color: COLORS.textSecondary },
  resultPath: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  resultStatus: { fontSize: 11, color: '#B8A88A', marginTop: 2 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  takeBtn: { backgroundColor: COLORS.primary },
  returnBtn: { backgroundColor: COLORS.green },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});

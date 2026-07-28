import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Item } from '../../types';
import RenameModal from '../../components/RenameModal';

const EMPTY_ITEMS: Item[] = [];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GAP = 12;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GAP) / 2;

const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
  green: '#4CAF50',
  gray: '#D0D0D0',
};

export default function CabinetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const items = useStore((s) => s.items[id || ''] || EMPTY_ITEMS);
  const loadItems = useStore((s) => s.loadItems);
  const updateItem = useStore((s) => s.updateItem);
  const cabinetsByRoom = useStore((s) => s.cabinets);
  const cabinet = Object.values(cabinetsByRoom).flat().find((c) => c.id === id);
  const [renameTarget, setRenameTarget] = useState<Item | null>(null);

  useEffect(() => {
    if (id) loadItems(id);
  }, [id]);

  const handleItemAction = (item: Item) => {
    Alert.alert(item.name, '选择操作', [
      { text: '取消', style: 'cancel' },
      {
        text: '重命名',
        onPress: () => setRenameTarget(item),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          Alert.alert('删除物品', `确定删除「${item.name}」吗？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: () => useStore.getState().deleteItem(item.id, id!),
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: cabinet?.name || '柜子',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.grid}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>这个柜子还是空的</Text>
            <Text style={styles.emptySubtext}>点击下方按钮添加物品</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.itemCard, item.status === 'taken' && styles.itemCardTaken]}
              onPress={() => router.push(`/item/${item.id}`)}
              onLongPress={() => handleItemAction(item)}
            >
              <View style={styles.itemThumb}>
                {item.thumbnailUri ? (
                  <Image source={{ uri: item.thumbnailUri }} style={styles.thumbImg} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.itemEmoji}>{getItemEmoji(item.name)}</Text>
                  </View>
                )}
                {item.status === 'taken' && (
                  <View style={styles.takenBadge}>
                    <Ionicons name="remove" size={16} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={[styles.itemName, item.status === 'taken' && styles.itemNameTaken]}>
                {item.name}
              </Text>
              {item.quantity > 1 && (
                <Text style={styles.itemQty}>×{item.quantity}</Text>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push(`/add-item?cabinetId=${id}`)}>
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.fabText}>添加物品</Text>
      </Pressable>

      <RenameModal
        visible={renameTarget !== null}
        currentName={renameTarget?.name || ''}
        title="修改物品名称"
        placeholder="输入新名称"
        onConfirm={(name) => {
          if (renameTarget && id) {
            updateItem(renameTarget.id, { ...renameTarget, name });
            setRenameTarget(null);
          }
        }}
        onCancel={() => setRenameTarget(null)}
      />
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
    '证件': '🪪', '工具': '🔧', '电池': '🔋', '胶带': '📎',
  };
  for (const [key, emoji] of Object.entries(map)) {
    if (name.includes(key)) return emoji;
  }
  return '📦';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GAP,
    paddingBottom: 100,
  },
  itemCard: {
    width: ITEM_SIZE,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  itemCardTaken: {
    opacity: 0.6,
    backgroundColor: '#F5F0EB',
  },
  itemThumb: {
    width: ITEM_SIZE - 24,
    height: ITEM_SIZE - 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  itemEmoji: { fontSize: 32 },
  takenBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  itemNameTaken: { color: COLORS.textSecondary },
  itemQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF8C69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  empty: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { fontSize: 18, color: COLORS.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#B8A88A' },
});

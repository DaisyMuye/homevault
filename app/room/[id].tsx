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
import { Cabinet } from '../../types';
import RenameModal from '../../components/RenameModal';

const EMPTY_CABINETS: Cabinet[] = [];

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
};

export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rooms = useStore((s) => s.rooms);
  const cabinets = useStore((s) => s.cabinets[id || ''] || EMPTY_CABINETS);
  const loadCabinets = useStore((s) => s.loadCabinets);
  const updateCabinet = useStore((s) => s.updateCabinet);
  const room = rooms.find((r) => r.id === id);
  const [renameTarget, setRenameTarget] = useState<Cabinet | null>(null);

  useEffect(() => {
    if (id) loadCabinets(id);
  }, [id]);

  const handleCabinetAction = (cabinet: Cabinet) => {
    Alert.alert(cabinet.name, '选择操作', [
      { text: '取消', style: 'cancel' },
      {
        text: '重命名',
        onPress: () => setRenameTarget(cabinet),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          Alert.alert('删除柜子', `确定删除「${cabinet.name}」吗？里面物品也会被删除。`, [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: () => useStore.getState().deleteCabinet(cabinet.id, id!),
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
          title: room?.name || '房间',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.grid}>
        {cabinets.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>还没有柜子</Text>
            <Text style={styles.emptySubtext}>点击下方按钮拍照添加</Text>
          </View>
        ) : (
          cabinets.map((cabinet) => (
            <Pressable
              key={cabinet.id}
              style={styles.cabinetCard}
              onPress={() => router.push(`/cabinet/${cabinet.id}`)}
              onLongPress={() => handleCabinetAction(cabinet)}
            >
              <View style={styles.cabinetThumb}>
                {cabinet.thumbnailUri ? (
                  <Image source={{ uri: cabinet.thumbnailUri }} style={styles.thumbImg} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="cube" size={32} color={COLORS.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.cabinetName}>{cabinet.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push(`/add-cabinet?roomId=${id}`)}>
        <Ionicons name="camera" size={24} color="#FFF" />
        <Text style={styles.fabText}>拍柜子</Text>
      </Pressable>

      <RenameModal
        visible={renameTarget !== null}
        currentName={renameTarget?.name || ''}
        title="修改柜子名称"
        placeholder="输入新名称"
        onConfirm={(name) => {
          if (renameTarget) {
            updateCabinet(renameTarget.id, { ...renameTarget, name });
            setRenameTarget(null);
          }
        }}
        onCancel={() => setRenameTarget(null)}
      />
    </View>
  );
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
  cabinetCard: {
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
  cabinetThumb: {
    width: ITEM_SIZE - 24,
    height: ITEM_SIZE - 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  cabinetName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
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

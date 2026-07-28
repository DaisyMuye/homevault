import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  PanResponder,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Room } from '../../types';
import RenameModal from '../../components/RenameModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
};

const MIN_CANVAS_W = SCREEN_WIDTH - 40;
const MIN_CANVAS_H = SCREEN_HEIGHT - 250;

export default function HomePage() {
  const router = useRouter();
  const rooms = useStore((s) => s.rooms);
  const updateRoom = useStore((s) => s.updateRoom);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [renameTarget, setRenameTarget] = useState<Room | null>(null);

  const canvasW = Math.max(MIN_CANVAS_W, ...rooms.map(r => r.positionX + r.width + 40), 400);
  const canvasH = Math.max(MIN_CANVAS_H, ...rooms.map(r => r.positionY + r.height + 40), 400);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏠 我的家</Text>
        <Pressable
          style={styles.searchBtn}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchText}>搜索全家物品...</Text>
        </Pressable>
      </View>

      {rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color="#D5C5B5" />
          <Text style={styles.emptyTitle}>还没有房间</Text>
          <Text style={styles.emptySubtitle}>先创建你的第一个房间吧</Text>
          <Pressable
            style={styles.emptyAddBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
            <Text style={styles.emptyAddText}>添加房间</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.canvas}
          contentContainerStyle={styles.canvasContent}
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={[styles.floorPlan, { width: canvasW, height: canvasH }]}>
              {rooms.map((room) => (
                <DraggableRoom
                  key={room.id}
                  room={room}
                  onTap={() => router.push(`/room/${room.id}`)}
                  onDragEnd={(x, y) => {
                    updateRoom({ ...room, positionX: x, positionY: y });
                  }}
                  onResize={(w, h) => {
                    updateRoom({ ...room, width: w, height: h });
                  }}
                  onDelete={() => {
                    Alert.alert('删除房间', `确定删除「${room.name}」吗？\n里面的柜子和物品也会被删除。`, [
                      { text: '取消', style: 'cancel' },
                      { text: '删除', style: 'destructive', onPress: () => useStore.getState().deleteRoom(room.id) },
                    ]);
                  }}
                  onRename={() => setRenameTarget(room)}
                />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {rooms.length > 0 && (
        <Pressable style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.fabText}>添加房间</Text>
        </Pressable>
      )}

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建房间</Text>
            <TextInput
              style={styles.input}
              placeholder="房间名称（如 卧室、书房）"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setShowAddModal(false); setNewRoomName(''); }}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={async () => {
                  if (newRoomName.trim()) {
                    try {
                      await useStore.getState().addRoom(newRoomName.trim());
                      setNewRoomName('');
                      setShowAddModal(false);
                    } catch (e) {
                      Alert.alert('错误', '创建房间失败，请重试');
                    }
                  }
                }}
              >
                <Text style={styles.confirmBtnText}>创建</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <RenameModal
        visible={renameTarget !== null}
        currentName={renameTarget?.name || ''}
        title="修改房间名称"
        placeholder="输入新名称"
        onConfirm={(name) => {
          if (renameTarget) {
            updateRoom({ ...renameTarget, name });
            setRenameTarget(null);
          }
        }}
        onCancel={() => setRenameTarget(null)}
      />
    </View>
  );
}

function DraggableRoom({
  room,
  onTap,
  onDragEnd,
  onResize,
  onDelete,
  onRename,
}: {
  room: Room;
  onTap: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const posRef = useRef({ x: room.positionX, y: room.positionY });
  const sizeRef = useRef({ w: room.width, h: room.height });
  const startPosRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  useEffect(() => {
    posRef.current = { x: room.positionX, y: room.positionY };
    sizeRef.current = { w: room.width, h: room.height };
  }, [room.positionX, room.positionY, room.width, room.height]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        movedRef.current = false;
        startPosRef.current = { ...posRef.current };
      },
      onPanResponderMove: (_, g) => {
        movedRef.current = true;
        posRef.current = {
          x: startPosRef.current.x + g.dx,
          y: startPosRef.current.y + g.dy,
        };
      },
      onPanResponderRelease: () => {
        if (movedRef.current) {
          onDragEnd(posRef.current.x, posRef.current.y);
        } else {
          onTap();
        }
      },
    })
  ).current;

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const newW = Math.max(80, sizeRef.current.w + g.dx);
        const newH = Math.max(60, sizeRef.current.h + g.dy);
        onResize(newW, newH);
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.roomBlock,
        {
          left: room.positionX,
          top: room.positionY,
          width: room.width,
          height: room.height,
          backgroundColor: room.color,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable style={styles.roomInner} onPress={onTap}>
        <Text style={styles.roomIcon}>{getRoomEmoji(room.name)}</Text>
        <Text style={styles.roomName} numberOfLines={2}>{room.name}</Text>
      </Pressable>

      <Pressable style={styles.roomDelete} onPress={onDelete}>
        <Ionicons name="close-circle" size={18} color="#FF6B6B" />
      </Pressable>
      <Pressable style={styles.roomRename} onPress={onRename}>
        <Ionicons name="pencil" size={14} color="#8B7355" />
      </Pressable>

      <View style={styles.resizeHandle} {...resizeResponder.panHandlers}>
        <Ionicons name="resize" size={12} color="#AAA" />
      </View>
    </View>
  );
}

function getRoomEmoji(name: string): string {
  const map: Record<string, string> = {
    '卧室': '🛏️', '书房': '📚', '客厅': '🛋️', '厨房': '🍳',
    '餐厅': '🍽️', '卫生间': '🚿', '阳台': '🌿', '储物间': '📦',
    '衣柜': '👔', '玄关': '🚪', '走廊': '🚶',
  };
  for (const [key, emoji] of Object.entries(map)) {
    if (name.includes(key)) return emoji;
  }
  return '📦';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchText: { color: COLORS.textSecondary, fontSize: 15, flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyAddText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  canvas: { flex: 1 },
  canvasContent: { padding: 20 },
  floorPlan: { position: 'relative' },
  roomBlock: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  roomIcon: { fontSize: 28, marginBottom: 4 },
  roomName: { fontSize: 13, fontWeight: '600', color: '#3D2B1F', textAlign: 'center' },
  roomDelete: { position: 'absolute', top: 4, right: 4, zIndex: 10 },
  roomRename: { position: 'absolute', top: 4, left: 4, zIndex: 10, padding: 2 },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E0D5C5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: COLORS.background },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

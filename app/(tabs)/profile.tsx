import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { ActionLogWithItem } from '../../types';

const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
  green: '#4CAF50',
  gray: '#BDBDBD',
};

export default function ProfilePage() {
  const actionLogs = useStore((s) => s.actionLogs);
  const takenItems = useStore((s) => s.takenItems);
  const loadActionLogs = useStore((s) => s.loadActionLogs);
  const loadTakenItems = useStore((s) => s.loadTakenItems);
  const returnItem = useStore((s) => s.returnItem);
  const deleteActionLog = useStore((s) => s.deleteActionLog);
  const [activeTab, setActiveTab] = useState<'logs' | 'taken'>('taken');

  useEffect(() => {
    loadActionLogs();
    loadTakenItems();
  }, []);

  const handleReturn = (itemId: string, itemName: string) => {
    Alert.alert('放回物品', `确定已将「${itemName}」放回原位吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '已放回',
        onPress: () => returnItem(itemId),
      },
    ]);
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert('删除记录', '确定删除这条操作记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteActionLog(logId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 我的</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'taken' && styles.activeTab]}
          onPress={() => setActiveTab('taken')}
        >
          <Ionicons
            name="bag-check"
            size={18}
            color={activeTab === 'taken' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'taken' && styles.activeTabText]}>
            已拿物品
          </Text>
          {takenItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{takenItems.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'logs' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
            操作记录
          </Text>
        </Pressable>
      </View>

      {activeTab === 'taken' ? (
        <TakenItemsView items={takenItems} onReturn={handleReturn} />
      ) : (
        <ActionLogsView
          logs={actionLogs}
          takenItems={takenItems}
          onReturn={handleReturn}
          onDelete={handleDeleteLog}
        />
      )}
    </View>
  );
}

function TakenItemsView({
  items,
  onReturn,
}: {
  items: ReturnType<typeof useStore.getState>['takenItems'];
  onReturn: (id: string, name: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="checkmark-circle" size={48} color={COLORS.green} />
        <Text style={styles.emptyText}>全部物品都在原位 🎉</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.sectionHeader}>
        当前拿走了 {items.length} 件物品
      </Text>
      {items.map((item) => (
        <View key={item.id} style={styles.logItem}>
          <View style={styles.logIcon}>
            <Text style={styles.logEmoji}>{getItemEmoji(item.name)}</Text>
          </View>
          <View style={styles.logContent}>
            <Text style={styles.logItemName}>{item.name}</Text>
            <Text style={styles.logPath}>
              {item.roomName} › {item.cabinetName}
            </Text>
            <Text style={styles.logTime}>
              拿走于 {formatTime(item.takenAt || '')}
            </Text>
          </View>
          <Pressable
            style={styles.returnBtn}
            onPress={() => onReturn(item.id, item.name)}
          >
            <Text style={styles.returnBtnText}>放回</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function ActionLogsView({
  logs,
  takenItems,
  onReturn,
  onDelete,
}: {
  logs: ActionLogWithItem[];
  takenItems: ReturnType<typeof useStore.getState>['takenItems'];
  onReturn: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  if (logs.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="document-text" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>还没有操作记录</Text>
      </View>
    );
  }

  const takenItemIds = new Set(takenItems.map((t) => t.id));
  const grouped = groupByDate(logs);

  return (
    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 30 }}>
      {Object.entries(grouped).map(([date, items]) => (
        <View key={date}>
          <Text style={styles.dateHeader}>{date}</Text>
          {items.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Pressable
                style={styles.logDelete}
                onPress={() => onDelete(log.id)}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color="#CCC" />
              </Pressable>
              <View style={styles.logIcon}>
                <Ionicons
                  name={log.action === 'take' ? 'arrow-up-circle' : 'arrow-down-circle'}
                  size={24}
                  color={log.action === 'take' ? '#FF8C69' : '#4CAF50'}
                />
              </View>
              <View style={styles.logContent}>
                <Text style={styles.logItemName}>
                  {log.action === 'take' ? '拿走了 ' : '放回了 '}
                  <Text style={{ fontWeight: '700' }}>{log.itemName}</Text>
                </Text>
                <Text style={styles.logPath}>
                  {log.roomName} › {log.cabinetName}
                </Text>
                <Text style={styles.logTime}>
                  {formatTime(log.timestamp)}
                </Text>
              </View>
              {log.action === 'take' && takenItemIds.has(log.itemId) && (
                <Pressable
                  style={styles.returnBtn}
                  onPress={() => onReturn(log.itemId, log.itemName)}
                >
                  <Text style={styles.returnBtnText}>放回</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function groupByDate(logs: ActionLogWithItem[]): Record<string, ActionLogWithItem[]> {
  const groups: Record<string, ActionLogWithItem[]> = {};
  for (const log of logs) {
    const date = log.timestamp.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  }
  return groups;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getItemEmoji(name: string): string {
  const map: Record<string, string> = {
    '钥匙': '🔑', '充电器': '🔋', '笔': '✏️', '手机': '📱',
    '钱包': '👛', '耳机': '🎧', '书': '📖', '剪刀': '✂️',
    '胶带': '📎', '杯子': '☕', '遥控器': '📺', '数据线': '🔌',
     '纸巾': '🧻', '雨伞': '☂️',
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
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  activeTab: { backgroundColor: '#FFE8E0' },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  activeTabText: { color: COLORS.primary },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  dateHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logIcon: { marginRight: 12 },
  logEmoji: { fontSize: 24 },
  logContent: { flex: 1 },
  logItemName: { fontSize: 15, color: COLORS.text, marginBottom: 2 },
  logPath: { fontSize: 12, color: COLORS.textSecondary },
  logTime: { fontSize: 11, color: '#B8A88A', marginTop: 2 },
  logDelete: { position: 'absolute', top: 6, right: 6, zIndex: 10, padding: 4 },
  returnBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  returnBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});

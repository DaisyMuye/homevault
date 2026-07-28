import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useStore } from '../store/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
};

const ROOM_PALETTE = ['#FFE4B5', '#B5D8FF', '#FFB5C5', '#B5FFB5', '#FFD5B5', '#D5B5FF', '#FFFFB5', '#B5FFFF'];

export default function AddRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState(ROOM_PALETTE[0]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const rooms = useStore.getState().rooms;
    await useStore.getState().addRoom(name.trim(), color);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '添加房间', headerStyle: { backgroundColor: COLORS.card }, headerTintColor: COLORS.text }} />
      <View style={styles.content}>
        <Text style={styles.label}>房间名称</Text>
        <TextInput
          style={styles.input}
          placeholder="如 卧室、书房、厨房"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>选择颜色</Text>
        <View style={styles.colorGrid}>
          {ROOM_PALETTE.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Pressable style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>创建房间</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E0D5C5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: COLORS.primary },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});

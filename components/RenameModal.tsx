import { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
};

interface RenameModalProps {
  visible: boolean;
  currentName: string;
  placeholder?: string;
  title: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function RenameModal({
  visible,
  currentName,
  placeholder,
  title,
  onConfirm,
  onCancel,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder || '输入名称'}
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => name.trim() && onConfirm(name.trim())}
            >
              <Text style={styles.confirmText}>确定</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 40,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
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
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.background },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

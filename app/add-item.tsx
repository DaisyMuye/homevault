import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';
import { processToThumbnail, saveOriginalImage } from '../lib/imageProcessor';
import ImageCropper from '../components/ImageCropper';
import PixelProcessor from '../components/PixelProcessor';

const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
};

export default function AddItem() {
  const { cabinetId } = useLocalSearchParams<{ cabinetId: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('提示', '需要相册权限');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (e) {
      Alert.alert('提示', '无法访问相册');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入物品名称');
      return;
    }
    if (!cabinetId) return;
    const qty = parseInt(quantity, 10) || 1;

    setIsProcessing(true);
    try {
      let thumbnailUri: string | null = null;
      let savedPhotoUri: string | null = null;
      const sourceUri = cropUri || photoUri;

      if (sourceUri) {
        savedPhotoUri = await saveOriginalImage(photoUri!);
        thumbnailUri = await processToThumbnail(sourceUri);
      }

      await useStore.getState().addItem({
        cabinetId,
        name: name.trim(),
        quantity: Math.max(1, qty),
        notes: notes.trim(),
        photoUri: savedPhotoUri,
        thumbnailUri,
      });
      router.back();
    } catch (e) {
      Alert.alert('错误', '创建失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '添加物品', headerStyle: { backgroundColor: COLORS.card }, headerTintColor: COLORS.text }} />
      
      <Pressable style={styles.photoArea} onPress={handlePickImage}>
        {cropUri || photoUri ? (
          <Image source={{ uri: cropUri || photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={40} color={COLORS.primary} />
            <Text style={styles.photoText}>拍物品</Text>
          </View>
        )}
        {(cropUri || photoUri) && (
          <Pressable style={styles.retakeBtn} onPress={handlePickImage}>
            <Ionicons name="camera-outline" size={16} color="#FFF" />
            <Text style={styles.retakeText}>重拍</Text>
          </Pressable>
        )}
      </Pressable>

      <Text style={styles.label}>物品名称 *</Text>
      <TextInput
        style={styles.input}
        placeholder="如 钥匙、充电器、笔记本"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>数量</Text>
      <TextInput
        style={styles.input}
        placeholder="1"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>备注</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="放这个位置的具体说明..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <Pressable
        style={[styles.createBtn, isProcessing && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={isProcessing}
      >
        <Text style={styles.createBtnText}>
          {isProcessing ? '处理中...' : '添加物品'}
        </Text>
      </Pressable>

      {photoUri && (
        <ImageCropper
          visible={showCropper}
          imageUri={photoUri}
          onCrop={(uri) => {
            setCropUri(uri);
            setShowCropper(false);
          }}
          onCancel={() => {
            setPhotoUri(null);
            setCropUri(null);
            setShowCropper(false);
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  photoArea: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0D5C5',
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 8,
  },
  photoText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  retakeBtn: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, gap: 4,
  },
  retakeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E0D5C5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});

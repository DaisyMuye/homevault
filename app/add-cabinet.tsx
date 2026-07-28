import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';
import { processToThumbnail, saveOriginalImage } from '../lib/imageProcessor';
import ImageCropper from '../components/ImageCropper';

const COLORS = {
  primary: '#FF8C69',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#3D2B1F',
  textSecondary: '#8B7355',
};

export default function AddCabinet() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
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
      Alert.alert('提示', '请输入柜子名称');
      return;
    }
    if (!roomId) return;

    setIsProcessing(true);
    try {
      const sourceUri = cropUri || photoUri;

      if (sourceUri) {
        const savedPhotoUri = await saveOriginalImage(photoUri!);
        const thumbUri = await processToThumbnail(sourceUri);

        await useStore.getState().addCabinet({
          roomId,
          name: name.trim(),
          photoUri: savedPhotoUri,
          thumbnailUri: thumbUri,
          positionX: 0,
          positionY: 0,
        });
        router.back();
      } else {
        await useStore.getState().addCabinet({
          roomId,
          name: name.trim(),
          photoUri: null,
          thumbnailUri: null,
          positionX: 0,
          positionY: 0,
        });
        router.back();
      }
    } catch (e) {
      Alert.alert('错误', '创建失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '添加柜子', headerStyle: { backgroundColor: COLORS.card }, headerTintColor: COLORS.text }} />
      <View style={styles.content}>
        <Pressable style={styles.photoArea} onPress={handlePickImage}>
          {cropUri || photoUri ? (
            <Image source={{ uri: cropUri || photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color={COLORS.primary} />
              <Text style={styles.photoText}>拍柜子</Text>
            </View>
          )}
          {(cropUri || photoUri) && (
            <Pressable style={styles.retakeBtn} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={16} color="#FFF" />
              <Text style={styles.retakeText}>重拍</Text>
            </Pressable>
          )}
        </Pressable>

        <Text style={styles.label}>柜子名称</Text>
        <TextInput
          style={styles.input}
          placeholder="如 书桌抽屉、衣柜、书架"
          value={name}
          onChangeText={setName}
        />

        <Pressable
          style={[styles.createBtn, isProcessing && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={isProcessing}
        >
          <Text style={styles.createBtnText}>
            {isProcessing ? '处理中...' : '创建柜子'}
          </Text>
        </Pressable>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  photoArea: {
    width: '100%',
    height: 220,
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
    marginBottom: 20,
  },
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

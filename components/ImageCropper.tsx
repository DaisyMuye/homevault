import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  Dimensions,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN = Dimensions.get('window');
const HANDLE_SIZE = 28;
const MIN_SIZE = 60;

interface CropRect {
  x: number;
  y: number;
  size: number;
}

export default function ImageCropper({
  visible,
  imageUri,
  onCrop,
  onCancel,
}: {
  visible: boolean;
  imageUri: string;
  onCrop: (croppedUri: string) => void;
  onCancel: () => void;
}) {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cropDisplay, setCropDisplay] = useState({ left: 0, top: 0, size: 200 });
  const cropRef = useRef<CropRect>({ x: 0, y: 0, size: 200 });

  useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (w, h) => {
        setImgSize({ w, h });
      });
    }
  }, [imageUri]);

  const scale = imgSize.w > 0 ? (SCREEN.width - 40) / imgSize.w : 1;
  const displayH = imgSize.h * scale;
  const [containerH, setContainerH] = useState(400);
  const imgOffsetY = Math.max(0, (containerH - displayH) / 2);

  useEffect(() => {
    if (imgSize.w > 0 && imgSize.h > 0) {
      const s = Math.min(imgSize.w, imgSize.h) * 0.8;
      const r: CropRect = {
        x: (imgSize.w - s) / 2,
        y: (imgSize.h - s) / 2,
        size: s,
      };
      cropRef.current = r;
      syncDisplay();
    }
  }, [imgSize.w, imgSize.h]);

  function syncDisplay() {
    const c = cropRef.current;
    setCropDisplay({
      left: c.x * scale + 20,
      top: c.y * scale + imgOffsetY,
      size: c.size * scale,
    });
  }

  function clamp() {
    const c = cropRef.current;
    const max = Math.min(imgSize.w, imgSize.h);
    c.size = Math.max(MIN_SIZE, Math.min(max, c.size));
    c.x = Math.max(0, Math.min(imgSize.w - c.size, c.x));
    c.y = Math.max(0, Math.min(imgSize.h - c.size, c.y));
    syncDisplay();
  }

  function useDragHandler(onDrag: (dx: number, dy: number) => void) {
    return useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (_, g) =>
            Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
          onPanResponderMove: (_, g) => {
            onDrag(g.dx / scale, g.dy / scale);
          },
          onPanResponderRelease: () => clamp(),
        }),
      [scale, imgSize.w, imgSize.h]
    );
  }

  const centerPan = useDragHandler((dx, dy) => {
    const c = cropRef.current;
    c.x = Math.max(0, Math.min(imgSize.w - c.size, c.x + dx));
    c.y = Math.max(0, Math.min(imgSize.h - c.size, c.y + dy));
    syncDisplay();
  });

  const cornerPan = (corner: string) =>
    useDragHandler((dx, dy) => {
      const c = cropRef.current;
      const s0 = c.size;
      let nx = c.x, ny = c.y, ns = s0;

      switch (corner) {
        case 'tl':
          ns = s0 - Math.max(dx, dy);
          nx = c.x + (s0 - ns);
          ny = c.y + (s0 - ns);
          break;
        case 'tr':
          ns = s0 - dy;
          ny = c.y + (s0 - ns);
          break;
        case 'bl':
          ns = s0 - dx;
          nx = c.x + (s0 - ns);
          break;
        case 'br':
          ns = s0 + Math.max(dx, dy);
          break;
        case 'tm':
          ns = s0 - dy;
          ny = c.y + (s0 - ns);
          nx = c.x + (s0 - ns) / 2;
          break;
        case 'bm':
          ns = s0 + dy;
          nx = c.x - (ns - s0) / 2;
          break;
        case 'lm':
          ns = s0 - dx;
          nx = c.x + (s0 - ns);
          ny = c.y + (s0 - ns) / 2;
          break;
        case 'rm':
          ns = s0 + dx;
          ny = c.y - (ns - s0) / 2;
          break;
      }

      const max = Math.min(imgSize.w, imgSize.h);
      ns = Math.max(MIN_SIZE, Math.min(max, ns));
      nx = Math.max(0, Math.min(imgSize.w - ns, nx));
      ny = Math.max(0, Math.min(imgSize.h - ns, ny));

      cropRef.current = { x: nx, y: ny, size: ns };
      syncDisplay();
    });

  const tlPan = cornerPan('tl');
  const trPan = cornerPan('tr');
  const blPan = cornerPan('bl');
  const brPan = cornerPan('br');
  const tmPan = cornerPan('tm');
  const bmPan = cornerPan('bm');
  const lmPan = cornerPan('lm');
  const rmPan = cornerPan('rm');

  const handleConfirm = async () => {
    const c = cropRef.current;
    const cropPixels = {
      originX: Math.round(c.x),
      originY: Math.round(c.y),
      width: Math.round(c.size),
      height: Math.round(c.size),
    };
    try {
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      const result = await manipulateAsync(imageUri, [{ crop: cropPixels }], {
        format: SaveFormat.JPEG,
        compress: 0.9,
      });
      onCrop(result.uri);
    } catch {
      onCancel();
    }
  };

  const hs = HANDLE_SIZE;
  const hh = hs / 2;
  const s = cropDisplay.size;
  const valid = s > 0 && isFinite(s);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onCancel} style={styles.topBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.topTitle}>裁剪照片</Text>
          <Pressable onPress={handleConfirm} style={styles.topBtn}>
            <Ionicons name="checkmark" size={24} color="#FF8C69" />
          </Pressable>
        </View>

        <View
          style={styles.imageArea}
          onLayout={(e: LayoutChangeEvent) => setContainerH(e.nativeEvent.layout.height)}
        >
          {imgSize.w > 0 && (
            <Image
              source={{ uri: imageUri }}
              style={{ width: SCREEN.width - 40, height: displayH }}
              resizeMode="contain"
            />
          )}

          {valid && (
            <>
              {/* Mask overlay */}
              <View style={[styles.mask, {
                left: cropDisplay.left, top: cropDisplay.top,
                width: cropDisplay.size, height: cropDisplay.size,
              }]} />

              {/* Corners */}
              <View style={[styles.corner, { left: cropDisplay.left - hh, top: cropDisplay.top - hh }]} {...tlPan.panHandlers} />
              <View style={[styles.corner, { left: cropDisplay.left + s - hh, top: cropDisplay.top - hh }]} {...trPan.panHandlers} />
              <View style={[styles.corner, { left: cropDisplay.left - hh, top: cropDisplay.top + s - hh }]} {...blPan.panHandlers} />
              <View style={[styles.corner, { left: cropDisplay.left + s - hh, top: cropDisplay.top + s - hh }]} {...brPan.panHandlers} />

              {/* Edge midpoints */}
              <View style={[styles.edge, { left: cropDisplay.left + s / 2 - 9, top: cropDisplay.top - 9 }]} {...tmPan.panHandlers} />
              <View style={[styles.edge, { left: cropDisplay.left + s / 2 - 9, top: cropDisplay.top + s - 9 }]} {...bmPan.panHandlers} />
              <View style={[styles.edge, { left: cropDisplay.left - 9, top: cropDisplay.top + s / 2 - 9 }]} {...lmPan.panHandlers} />
              <View style={[styles.edge, { left: cropDisplay.left + s - 9, top: cropDisplay.top + s / 2 - 9 }]} {...rmPan.panHandlers} />

              {/* Center drag */}
              <View style={[styles.center, {
                left: cropDisplay.left, top: cropDisplay.top,
                width: cropDisplay.size, height: cropDisplay.size,
              }]} {...centerPan.panHandlers} />
            </>
          )}
        </View>

        <Text style={styles.hint}>拖拽四角或边缘调整裁剪区域</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBtn: { padding: 8 },
  topTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mask: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF8C69',
    borderRadius: 2,
  },
  corner: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FF8C69',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 20,
  },
  edge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF8C69',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 20,
  },
  center: { position: 'absolute', zIndex: 5 },
  hint: {
    color: '#AAA',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});

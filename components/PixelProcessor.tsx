import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { getPixelArtHtml } from '../lib/pixelProcessor';

interface PixelProcessorProps {
  imageBase64: string;
  onComplete: (dataUri: string) => void;
  onError: (msg: string) => void;
}

export default function PixelProcessor({ imageBase64, onComplete, onError }: PixelProcessorProps) {
  const processedRef = useRef(false);

  return (
    <WebView
      style={styles.hidden}
      originWhitelist={['*']}
      source={{ html: getPixelArtHtml(imageBase64) }}
      javaScriptEnabled
      onMessage={(e) => {
        if (processedRef.current) return;
        processedRef.current = true;
        try {
          const msg = JSON.parse(e.nativeEvent.data);
          if (msg.type === 'result') onComplete(msg.data);
          else onError(msg.msg || 'Unknown error');
        } catch {
          onError('Parse error');
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { width: 1, height: 1, opacity: 0, position: 'absolute', top: -999, left: -999 },
});

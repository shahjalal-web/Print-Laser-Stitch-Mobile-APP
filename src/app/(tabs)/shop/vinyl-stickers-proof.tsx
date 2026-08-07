import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { emitProofBridgeResult } from '@/lib/proof-bridge';

/** Landing screen for the mobile-proof web page's redirect
 * (printlaserstitchmobile://shop/vinyl-stickers-proof?...). Forwards the result
 * to the vinyl-stickers screen underneath via proof-bridge, then pops
 * itself off the stack immediately so the configurator is left untouched. */
export default function VinylStickersProofScreen() {
  const params = useLocalSearchParams<Record<string, string>>();

  useEffect(() => {
    WebBrowser.dismissBrowser();

    const status = params.status;
    if (status === 'approved' || status === 'changes-requested') {
      emitProofBridgeResult({
        status,
        proofUrl: params.proofUrl || undefined,
        cutlineUrl: params.cutlineUrl || undefined,
        shape: params.shape ?? '',
        borderThickness: params.borderThickness ?? 'normal',
        roundedCorners: params.roundedCorners ?? 'none',
        removedBackground: params.removedBackground === 'true',
        lowResolution: params.lowResolution === 'true',
        changeNote: params.changeNote || undefined,
      });
    } else {
      emitProofBridgeResult({ status: 'cancelled' });
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/shop/vinyl-stickers');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenBackground style={styles.flex}>
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

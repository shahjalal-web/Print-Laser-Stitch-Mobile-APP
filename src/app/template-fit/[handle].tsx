import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart-store';
import type { NewCartItem } from '@/lib/cart-types';
import { SAFE_IN } from '@/lib/template-fit/constants';
import { flattenAndUpload } from '@/lib/template-fit/flatten-api';
import type { TemplateFitPayload, TemplateFitSide as Side } from '@/lib/template-fit/types';

type Rotation = 0 | 90 | 180 | 270;

type SideState = {
  naturalWidth: number;
  naturalHeight: number;
  fitMode: 'fill' | 'fit';
  zoom: number;
  offsetXIn: number;
  offsetYIn: number;
  rotation: Rotation;
  flipX: boolean;
  flipY: boolean;
  confirmed: boolean;
};

type TransformSnapshot = Pick<
  SideState,
  'fitMode' | 'zoom' | 'offsetXIn' | 'offsetYIn' | 'rotation' | 'flipX' | 'flipY'
>;

type HistoryState = { stack: TransformSnapshot[]; index: number };

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const BASELINE: TransformSnapshot = {
  fitMode: 'fill',
  zoom: 1,
  offsetXIn: 0,
  offsetYIn: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
};

function initialSideState(): SideState {
  return { naturalWidth: 0, naturalHeight: 0, confirmed: false, ...BASELINE };
}

function snapshotOf(s: SideState): TransformSnapshot {
  return {
    fitMode: s.fitMode,
    zoom: s.zoom,
    offsetXIn: s.offsetXIn,
    offsetYIn: s.offsetYIn,
    rotation: s.rotation,
    flipX: s.flipX,
    flipY: s.flipY,
  };
}

function rotate90(rotation: Rotation, delta: 90 | -90): Rotation {
  return ((((rotation + delta) % 360) + 360) % 360) as Rotation;
}

/** "Fill" (cover) or "Fit" (contain) base width in inches, before zoom. */
function baseFitWidthIn(
  naturalWidth: number,
  naturalHeight: number,
  bleedWIn: number,
  bleedHIn: number,
  mode: 'fill' | 'fit',
): number {
  const scalePerPxW = bleedWIn / naturalWidth;
  const scalePerPxH = bleedHIn / naturalHeight;
  const scale = mode === 'fill' ? Math.max(scalePerPxW, scalePerPxH) : Math.min(scalePerPxW, scalePerPxH);
  return naturalWidth * scale;
}

function effectiveNaturalSize(naturalWidth: number, naturalHeight: number, rotation: Rotation) {
  return rotation === 90 || rotation === 270
    ? { width: naturalHeight, height: naturalWidth }
    : { width: naturalWidth, height: naturalHeight };
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function TemplateFitScreen() {
  const { handle, payload: payloadParam } = useLocalSearchParams<{ handle: string; payload: string }>();
  const { addItem } = useCart();

  const payload = useMemo<TemplateFitPayload | null>(() => {
    if (!payloadParam) return null;
    try {
      const parsed = JSON.parse(payloadParam) as TemplateFitPayload;
      return parsed.productHandle === handle ? parsed : null;
    } catch {
      return null;
    }
  }, [payloadParam, handle]);

  useEffect(() => {
    if (!payload && handle) {
      router.replace({ pathname: '/shop/product/[handle]', params: { handle } });
    }
  }, [payload, handle]);

  if (!payload) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  return <FitStudioBody payload={payload} onAddItem={addItem} />;
}

function FitStudioBody({
  payload,
  onAddItem,
}: {
  payload: TemplateFitPayload;
  onAddItem: (item: NewCartItem) => void;
}) {
  const bleedWIn = payload.widthIn + 2 * payload.bleedIn;
  const bleedHIn = payload.heightIn + 2 * payload.bleedIn;

  const availableSides = useMemo(
    () => (Object.keys(payload.sides) as Side[]).filter((s) => payload.sides[s]),
    [payload.sides],
  );

  const [activeSide, setActiveSide] = useState<Side>(availableSides[0] ?? 'front');
  const [stateBySide, setStateBySide] = useState<Record<Side, SideState>>({
    front: initialSideState(),
    back: initialSideState(),
  });
  const [historyBySide, setHistoryBySide] = useState<Record<Side, HistoryState>>({
    front: { stack: [BASELINE], index: 0 },
    back: { stack: [BASELINE], index: 0 },
  });
  const [showAlign, setShowAlign] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidthPx, setContainerWidthPx] = useState(0);

  useEffect(() => {
    for (const side of availableSides) {
      const input = payload.sides[side];
      if (!input) continue;
      Image.getSize(
        input.fileUrl,
        (width, height) => {
          setStateBySide((prev) => ({ ...prev, [side]: { ...prev[side], naturalWidth: width, naturalHeight: height } }));
        },
        () => setError('Could not load your uploaded design.'),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSides.join(','), payload.sides.front?.fileUrl, payload.sides.back?.fileUrl]);

  const current = stateBySide[activeSide];
  const currentInput = payload.sides[activeSide];
  const history = historyBySide[activeSide];

  const rotated = current.rotation === 90 || current.rotation === 270;
  const eff = effectiveNaturalSize(current.naturalWidth, current.naturalHeight, current.rotation);

  const drawnWidthIn =
    currentInput && current.naturalWidth
      ? baseFitWidthIn(eff.width, eff.height, bleedWIn, bleedHIn, current.fitMode) * current.zoom
      : 0;
  const drawnHeightIn = eff.width ? drawnWidthIn * (eff.height / eff.width) : 0;
  const ownWidthIn = rotated ? drawnHeightIn : drawnWidthIn;
  const ownHeightIn = rotated ? drawnWidthIn : drawnHeightIn;

  const pxPerIn = containerWidthPx > 0 ? containerWidthPx / bleedWIn : 0;
  const containerHeightPx = containerWidthPx * (bleedHIn / bleedWIn);
  const ownWidthPx = ownWidthIn * pxPerIn;
  const ownHeightPx = ownHeightIn * pxPerIn;

  // Live-drag/pinch position on the UI thread — mirrors the website's
  // "mutate the DOM transform during drag, commit to state once on release"
  // pattern (see project memory: setState-per-pointermove is visibly janky),
  // just using Reanimated shared values instead of a direct DOM ref.
  const offsetXSV = useSharedValue(0);
  const offsetYSV = useSharedValue(0);
  const zoomSV = useSharedValue(1);
  const startOffsetXSV = useSharedValue(0);
  const startOffsetYSV = useSharedValue(0);
  const startZoomSV = useSharedValue(1);

  useEffect(() => {
    offsetXSV.value = current.offsetXIn;
    offsetYSV.value = current.offsetYIn;
    zoomSV.value = current.zoom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, current.offsetXIn, current.offsetYIn, current.zoom]);

  function updateSide(side: Side, patch: Partial<SideState>) {
    setStateBySide((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }));
  }

  function pushHistory(side: Side, snap: TransformSnapshot) {
    setHistoryBySide((prev) => {
      const h = prev[side];
      const stack = [...h.stack.slice(0, h.index + 1), snap];
      return { ...prev, [side]: { stack, index: stack.length - 1 } };
    });
  }

  function commitAndPush(side: Side, patch: Partial<SideState>) {
    const merged = { ...stateBySide[side], ...patch };
    updateSide(side, patch);
    pushHistory(side, snapshotOf(merged));
  }

  // Gestures capture `activeSide` via closure at creation time (each
  // render), but the .onEnd runOnJS callback fires after a real device
  // delay — a ref avoids acting on a stale side if it changed mid-gesture.
  const activeSideRef = useRef(activeSide);
  activeSideRef.current = activeSide;

  function commitDrag(offsetXIn: number, offsetYIn: number) {
    commitAndPush(activeSideRef.current, { offsetXIn, offsetYIn });
  }

  function commitZoom(zoom: number) {
    commitAndPush(activeSideRef.current, { zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) });
  }

  function undo() {
    if (history.index <= 0) return;
    const newIndex = history.index - 1;
    updateSide(activeSide, history.stack[newIndex]);
    setHistoryBySide((prev) => ({ ...prev, [activeSide]: { ...prev[activeSide], index: newIndex } }));
  }

  function redo() {
    if (history.index >= history.stack.length - 1) return;
    const newIndex = history.index + 1;
    updateSide(activeSide, history.stack[newIndex]);
    setHistoryBySide((prev) => ({ ...prev, [activeSide]: { ...prev[activeSide], index: newIndex } }));
  }

  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  function setFitMode(mode: 'fill' | 'fit') {
    commitAndPush(activeSide, { fitMode: mode, zoom: 1, offsetXIn: 0, offsetYIn: 0 });
  }
  function fitToDesign() {
    commitAndPush(activeSide, { fitMode: 'fit', zoom: 1, offsetXIn: 0, offsetYIn: 0 });
  }
  function adjustZoom(delta: number) {
    commitAndPush(activeSide, { zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + delta)) });
  }
  function rotateBy(delta: 90 | -90) {
    commitAndPush(activeSide, { rotation: rotate90(current.rotation, delta) });
  }
  function toggleFlip(axis: 'x' | 'y') {
    commitAndPush(activeSide, axis === 'x' ? { flipX: !current.flipX } : { flipY: !current.flipY });
  }

  function alignOffsetX(h: 'left' | 'center' | 'right'): number {
    if (h === 'left') return payload.bleedIn - bleedWIn / 2 + drawnWidthIn / 2;
    if (h === 'right') return bleedWIn / 2 - payload.bleedIn - drawnWidthIn / 2;
    return 0;
  }
  function alignOffsetY(v: 'top' | 'middle' | 'bottom'): number {
    if (v === 'top') return payload.bleedIn - bleedHIn / 2 + drawnHeightIn / 2;
    if (v === 'bottom') return bleedHIn / 2 - payload.bleedIn - drawnHeightIn / 2;
    return 0;
  }
  function applyAlignX(h: 'left' | 'center' | 'right') {
    commitAndPush(activeSide, { offsetXIn: alignOffsetX(h) });
    setShowAlign(false);
  }
  function applyAlignY(v: 'top' | 'middle' | 'bottom') {
    commitAndPush(activeSide, { offsetYIn: alignOffsetY(v) });
    setShowAlign(false);
  }

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startOffsetXSV.value = offsetXSV.value;
      startOffsetYSV.value = offsetYSV.value;
    })
    .onUpdate((e) => {
      if (!pxPerIn) return;
      offsetXSV.value = startOffsetXSV.value + e.translationX / pxPerIn;
      offsetYSV.value = startOffsetYSV.value + e.translationY / pxPerIn;
    })
    .onEnd(() => {
      runOnJS(commitDrag)(offsetXSV.value, offsetYSV.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startZoomSV.value = zoomSV.value;
    })
    .onUpdate((e) => {
      zoomSV.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, startZoomSV.value * e.scale));
    })
    .onEnd(() => {
      runOnJS(commitZoom)(zoomSV.value);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const leftPx = containerWidthPx / 2 + offsetXSV.value * pxPerIn - ownWidthPx / 2;
    const topPx = containerHeightPx / 2 + offsetYSV.value * pxPerIn - ownHeightPx / 2;
    return {
      width: ownWidthPx,
      height: ownHeightPx,
      transform: [
        { translateX: leftPx },
        { translateY: topPx },
        { rotate: `${current.rotation}deg` },
        { scaleX: current.flipX ? -1 : 1 },
        { scaleY: current.flipY ? -1 : 1 },
      ],
    };
  });

  function handleConfirmSide() {
    if (!currentInput) return;
    updateSide(activeSide, { confirmed: true });
    const next = availableSides.find((s) => s !== activeSide && !stateBySide[s].confirmed);
    if (next) setActiveSide(next);
  }

  const allConfirmed = availableSides.every((s) => stateBySide[s].confirmed);

  async function handleContinueToCart() {
    setError(null);
    setFinalizing(true);
    try {
      const extraProperties: Record<string, string> = { ...payload.cartItem.extraProperties };

      await Promise.all(
        availableSides.map(async (side) => {
          const input = payload.sides[side];
          const st = stateBySide[side];
          if (!input) return;
          const stEff = effectiveNaturalSize(st.naturalWidth, st.naturalHeight, st.rotation);
          const drawW = baseFitWidthIn(stEff.width, stEff.height, bleedWIn, bleedHIn, st.fitMode) * st.zoom;
          const filename =
            input.fileName ??
            (payload.effectiveUploadMode === 'front-back' ? `${side}-design.png` : 'design.png');
          const url = await flattenAndUpload({
            imageUrl: input.fileUrl,
            filename,
            bleedWIn,
            bleedHIn,
            widthIn: drawW,
            offsetXIn: st.offsetXIn,
            offsetYIn: st.offsetYIn,
            rotation: st.rotation,
            flipX: st.flipX,
            flipY: st.flipY,
          });

          if (payload.effectiveUploadMode === 'front-back') {
            extraProperties[side === 'front' ? 'Front Design' : 'Back Design'] = url;
            if (input.fileName) {
              extraProperties[side === 'front' ? 'Front Design Filename' : 'Back Design Filename'] = input.fileName;
            }
          } else {
            extraProperties[`${payload.uploadLabel} File`] = url;
            if (input.fileName) extraProperties[`${payload.uploadLabel} Filename`] = input.fileName;
          }
        }),
      );

      onAddItem({
        kind: 'product',
        title: payload.cartItem.title,
        subtitle: Object.values(payload.cartItem.selectedOptions).join(' · ') || 'Standard',
        thumbnail: payload.cartItem.thumbnail,
        unitLabel: `$${payload.cartItem.unitPrice.toFixed(2)} each`,
        totalPrice: payload.cartItem.unitPrice * payload.cartItem.qty,
        quantity: payload.cartItem.qty,
        variantId: payload.cartItem.variantId,
        productTitle: payload.cartItem.productTitle,
        selectedOptions: payload.cartItem.selectedOptions,
        qty: payload.cartItem.qty,
        unitPrice: payload.cartItem.unitPrice,
        extraProperties,
      });
      router.replace('/cart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload your design. Please try again.');
    } finally {
      setFinalizing(false);
    }
  }

  const trimLeftPct = (payload.bleedIn / bleedWIn) * 100;
  const trimTopPct = (payload.bleedIn / bleedHIn) * 100;
  const safeLeftPct = ((payload.bleedIn + SAFE_IN) / bleedWIn) * 100;
  const safeTopPct = ((payload.bleedIn + SAFE_IN) / bleedHIn) * 100;

  const effectiveDpi = current.naturalWidth && drawnWidthIn ? eff.width / drawnWidthIn : null;
  const quality: 'high' | 'medium' | 'low' | null =
    effectiveDpi == null ? null : effectiveDpi >= 200 ? 'high' : effectiveDpi >= 100 ? 'medium' : 'low';
  const recommendedPx =
    quality && quality !== 'high' ? { w: Math.ceil(drawnWidthIn * 200), h: Math.ceil(drawnHeightIn * 200) } : null;

  return (
    <ScreenBackground style={styles.flex}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary">
              Position your artwork inside the print guides for {payload.widthIn}&quot; × {payload.heightIn}&quot;.
            </ThemedText>
          </View>

          {availableSides.length > 1 && (
            <View style={styles.sideTabs}>
              {availableSides.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setActiveSide(s)}
                  style={[styles.sideTab, s === activeSide && styles.sideTabActive]}>
                  <ThemedText type="smallBold" style={s === activeSide ? { color: '#fff' } : undefined} themeColor={s === activeSide ? undefined : 'textSecondary'}>
                    {stateBySide[s].confirmed ? '✓ ' : ''}
                    {s === 'front' ? 'Front' : 'Back'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.toolbar}>
            <View style={styles.toolbarRow}>
              {quality && (
                <View
                  style={[
                    styles.badge,
                    quality === 'high' ? styles.badgeHigh : quality === 'medium' ? styles.badgeMedium : styles.badgeLow,
                  ]}>
                  <ThemedText type="small" style={styles.badgeText}>
                    {quality === 'high' ? '✓ High' : quality === 'medium' ? '⚠ Medium' : '⚠ Low'}
                  </ThemedText>
                </View>
              )}
              <Pressable onPress={() => setFitMode('fill')} hitSlop={6}>
                <ThemedText type="small" style={current.fitMode === 'fill' ? styles.toolActive : undefined} themeColor={current.fitMode === 'fill' ? undefined : 'textSecondary'}>
                  Fill
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary">
                /
              </ThemedText>
              <Pressable onPress={() => setFitMode('fit')} hitSlop={6}>
                <ThemedText type="small" style={current.fitMode === 'fit' ? styles.toolActive : undefined} themeColor={current.fitMode === 'fit' ? undefined : 'textSecondary'}>
                  Fit
                </ThemedText>
              </Pressable>
              <Pressable onPress={fitToDesign} style={styles.pillButton} hitSlop={6}>
                <ThemedText type="small" themeColor="textSecondary">
                  ⤢ Fit to design
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.toolbarRow}>
              <IconButton label="−" onPress={() => adjustZoom(-0.1)} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.zoomLabel}>
                {Math.round(current.zoom * 100)}%
              </ThemedText>
              <IconButton label="+" onPress={() => adjustZoom(0.1)} />
              <View style={styles.toolbarSpacer} />
              <IconButton label="⟲" onPress={() => rotateBy(-90)} />
              <IconButton label="⟳" onPress={() => rotateBy(90)} />
              <IconButton label="⇋" onPress={() => toggleFlip('x')} active={current.flipX} />
              <IconButton label="⇵" onPress={() => toggleFlip('y')} active={current.flipY} />
              <IconButton label="⚑" onPress={() => setShowAlign((v) => !v)} active={showAlign} />
              <IconButton label="↺" onPress={undo} disabled={!canUndo} />
              <IconButton label="↻" onPress={redo} disabled={!canRedo} />
            </View>

            {showAlign && (
              <View style={styles.alignGrid}>
                {(['left', 'center', 'right'] as const).map((h) => (
                  <Pressable key={h} style={styles.alignButton} onPress={() => applyAlignX(h)}>
                    <ThemedText type="small">{h[0].toUpperCase() + h.slice(1)}</ThemedText>
                  </Pressable>
                ))}
                {(['top', 'middle', 'bottom'] as const).map((v) => (
                  <Pressable key={v} style={styles.alignButton} onPress={() => applyAlignY(v)}>
                    <ThemedText type="small">{v[0].toUpperCase() + v.slice(1)}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View
            style={[styles.board, { height: containerHeightPx || undefined, aspectRatio: bleedWIn / bleedHIn }]}
            onLayout={(e) => setContainerWidthPx(e.nativeEvent.layout.width)}>
            <GestureDetector gesture={composedGesture}>
              <View style={StyleSheet.absoluteFill}>
                {currentInput && containerWidthPx > 0 && drawnWidthIn > 0 && (
                  <AnimatedImage
                    key={activeSide}
                    source={{ uri: currentInput.fileUrl }}
                    style={[styles.designImage, imageAnimatedStyle]}
                  />
                )}
              </View>
            </GestureDetector>

            {payload.bleedIn > 0 && (
              <>
                <View pointerEvents="none" style={styles.bleedLine} />
                <View
                  pointerEvents="none"
                  style={[
                    styles.trimLine,
                    { left: `${trimLeftPct}%`, right: `${trimLeftPct}%`, top: `${trimTopPct}%`, bottom: `${trimTopPct}%` },
                  ]}
                />
              </>
            )}
            <View
              pointerEvents="none"
              style={[
                styles.safeLine,
                { left: `${safeLeftPct}%`, right: `${safeLeftPct}%`, top: `${safeTopPct}%`, bottom: `${safeTopPct}%` },
              ]}
            />
          </View>

          <View style={styles.legend}>
            {payload.bleedIn > 0 && (
              <>
                <ThemedText type="small" style={{ color: '#f87171' }}>
                  ■ Bleed
                </ThemedText>
                <ThemedText type="small">■ Trim</ThemedText>
              </>
            )}
            <ThemedText type="small" style={{ color: '#34d399' }}>
              ■ Safe
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Drag to reposition, pinch to zoom. Keep important content inside the green safe line.
          </ThemedText>
          {recommendedPx && (
            <ThemedText type="small" style={styles.qualityHint}>
              For crisp printing, use an image at least {recommendedPx.w}×{recommendedPx.h}px at this size — yours is{' '}
              {current.naturalWidth}×{current.naturalHeight}px.
            </ThemedText>
          )}

          {error && (
            <View style={styles.errorBox}>
              <ThemedText type="small" style={{ color: '#fca5a5' }}>
                {error}
              </ThemedText>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {!current.confirmed && (
            <Pressable style={styles.confirmButton} disabled={finalizing} onPress={handleConfirmSide}>
              <ThemedText type="smallBold" style={{ color: Brand.cyan }}>
                {availableSides.length > 1 ? `Looks good — confirm ${activeSide}` : 'Looks good'}
              </ThemedText>
            </Pressable>
          )}
          <Pressable
            style={[styles.continueButton, (!allConfirmed || finalizing) && styles.continueButtonDisabled]}
            disabled={!allConfirmed || finalizing}
            onPress={handleContinueToCart}>
            {finalizing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText type="smallBold" style={styles.continueButtonText}>
                Continue to Cart
              </ThemedText>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function IconButton({
  label,
  onPress,
  active,
  disabled,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[styles.iconButton, active && styles.iconButtonActive, disabled && styles.iconButtonDisabled]}>
      <ThemedText type="small" style={active ? { color: Brand.cyan } : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
  header: { alignItems: 'center', marginTop: Spacing.three, gap: 2 },
  sideTabs: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.three },
  sideTab: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sideTabActive: { borderColor: Brand.cyan, backgroundColor: 'rgba(24, 211, 232, 0.15)' },
  toolbar: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  toolbarSpacer: { flex: 1 },
  toolActive: { color: Brand.yellow },
  pillButton: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  zoomLabel: { minWidth: 40, textAlign: 'center' },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconButtonActive: { backgroundColor: 'rgba(24, 211, 232, 0.2)' },
  iconButtonDisabled: { opacity: 0.3 },
  badge: { borderRadius: Spacing.five, paddingHorizontal: Spacing.two, paddingVertical: 3, borderWidth: 1 },
  badgeHigh: { borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  badgeMedium: { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  badgeLow: { borderColor: 'rgba(248, 113, 113, 0.4)', backgroundColor: 'rgba(248, 113, 113, 0.1)' },
  badgeText: { fontSize: 10, textTransform: 'uppercase' },
  alignGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  alignButton: {
    flexBasis: '31%',
    alignItems: 'center',
    borderRadius: Spacing.one,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  board: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#121212',
    overflow: 'hidden',
    width: '100%',
  },
  designImage: { position: 'absolute', left: 0, top: 0 },
  bleedLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.8)',
    borderStyle: 'dashed',
  },
  trimLine: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  safeLine: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(52, 211, 153, 0.9)', borderStyle: 'dashed' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.three, marginTop: Spacing.two },
  hint: { textAlign: 'center', marginTop: Spacing.two },
  qualityHint: { textAlign: 'center', marginTop: Spacing.one, color: '#fbbf24' },
  errorBox: {
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    padding: Spacing.two,
  },
  footer: { padding: Spacing.four, gap: Spacing.two },
  confirmButton: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.4)',
    backgroundColor: 'rgba(24, 211, 232, 0.1)',
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  continueButton: {
    borderRadius: Spacing.three,
    backgroundColor: Brand.yellow,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.16)' },
  continueButtonText: { color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
});

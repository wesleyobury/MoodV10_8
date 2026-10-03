/**
 * Built for Today, live text (Oct 2026 hybrid streaming).
 *
 * The workout is on screen before its explanation is finished. While the server writes (`pending`), this shows the card's
 * text area with a soft cursor, polls GET /bft and reveals the validated sentences it gets back at a quick reading pace, so
 * MOOD appears to explain the workout it just built. Nothing unvalidated ever reaches it: the server only hands over complete
 * sentences that passed the factual gate.
 *
 *   not pending (normal / reopened workout) -> the saved message, as plain text, immediately
 *   first poll already 'done'              -> the saved message, immediately (no replayed animation)
 *   writing -> streaming -> done           -> cursor, then a word-snapped reveal, cursor fades out
 *   fallback, or nothing by the deadline   -> the composer copy fades in (it was never shown before, so nothing changes under
 *                                             the reader); text already revealed is never replaced
 *
 * Layout: an invisible copy of the longer of (fallback, incoming text) reserves the height from the first frame, and the
 * visible text is laid over it, so the card does not grow line by line and the page below does not move.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { COLORS } from '../../constants/brand';
import { getV3Bft } from '../../utils/v3Api';
import { FIRST_SENTENCE_DEADLINE_MS, POLL_MS, SETTLE_DEADLINE_MS, extendsShown, revealStep, visibleEnd } from '../../utils/v3BftReveal';

export type BftSource = 'llm' | 'composer';

interface Props {
  token: string | null;
  workoutId: string | null;
  job: string | null;
  pending: boolean;
  /** The composer copy: shown when not pending, and the fallback while pending. */
  fallback: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  testID?: string;
  /** Called once when the message is final (to update the envelope / cache on screen). */
  onSettled?: (text: string, source: BftSource) => void;
}

export function BftLiveText(props: Props) {
  // decided once per mount: the Cart keys this component by workout + job, so a new job remounts it
  const [live] = useState(props.pending && !!props.token && !!props.workoutId);
  if (!live) {
    return (
      <Text style={props.style} numberOfLines={props.numberOfLines} testID={props.testID}>
        {props.fallback}
      </Text>
    );
  }
  return <Live {...props} />;
}

function Live({ token, workoutId, job, fallback, style, numberOfLines, testID, onSettled }: Props) {
  const [target, setTarget] = useState('');
  const [vis, setVis] = useState(0);
  const [done, setDone] = useState(false);
  const [blinkOn, setBlinkOn] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const targetRef = useRef('');
  const countRef = useRef(0);
  const reduceMotion = useRef(false);
  const settledRef = useRef(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => (reduceMotion.current = !!v))
      .catch(() => undefined);
  }, []);

  // ---- polling: only validated, complete sentences ever arrive here
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const t0 = Date.now();
    let watched = false; // saw the job still writing: only then is the reveal animated

    const show = (text: string, instant: boolean) => {
      if (!text || text === targetRef.current || !extendsShown(targetRef.current, text)) return;
      targetRef.current = text;
      if (instant || reduceMotion.current) {
        countRef.current = text.length;
        setVis(text.length);
      }
      setTarget(text);
    };
    const finish = (text: string, source: BftSource) => {
      if (settledRef.current) return;
      settledRef.current = true;
      if (source === 'composer' && !targetRef.current) {
        // the fallback was never on screen: fade it in rather than type it (it is not being "written")
        fade.setValue(0);
        targetRef.current = text;
        countRef.current = text.length;
        setTarget(text);
        setVis(text.length);
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }
      setDone(true);
      onSettledRef.current?.(targetRef.current || text, targetRef.current && source === 'llm' ? 'llm' : source);
    };

    const tick = async () => {
      if (!alive) return;
      const p = token && workoutId ? await getV3Bft(token, workoutId).catch(() => null) : null;
      if (!alive) return;
      const elapsed = Date.now() - t0;
      if (p === 'stop') return finish(targetRef.current || fallback, targetRef.current ? 'llm' : 'composer');
      if (p && (!job || !p.job || p.job === job)) {
        if (p.status === 'writing' || p.status === 'streaming') watched = true;
        if (p.text && (p.status === 'streaming' || p.status === 'done')) show(p.text, !watched);
        if (p.status === 'done' && p.text) return finish(p.text, 'llm');
        if (p.status === 'fallback' || (p.status === 'done' && !p.text)) {
          return finish(targetRef.current || p.blurb || fallback, targetRef.current ? 'llm' : 'composer');
        }
      }
      if (!targetRef.current && elapsed > FIRST_SENTENCE_DEADLINE_MS) return finish(fallback, 'composer');
      if (elapsed > SETTLE_DEADLINE_MS) return finish(targetRef.current || fallback, targetRef.current ? 'llm' : 'composer');
      timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workoutId, job]);

  // ---- reveal: quick reading pace, re-rendering only when a whole word becomes visible
  useEffect(() => {
    if (!target || countRef.current >= target.length) return;
    let raf: number | null = null;
    let last = Date.now();
    const step = () => {
      const now = Date.now();
      countRef.current = revealStep(countRef.current, targetRef.current.length, now - last);
      last = now;
      const v = visibleEnd(targetRef.current, countRef.current);
      setVis((cur) => (cur === v ? cur : v));
      if (countRef.current < targetRef.current.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [target]);

  const typing = vis < target.length;
  const showCursor = !(done && !typing);
  // blink only while waiting (nothing new to reveal yet); solid while words are appearing
  useEffect(() => {
    if (!showCursor || typing) {
      setBlinkOn(true);
      return;
    }
    const iv = setInterval(() => setBlinkOn((b) => !b), 530);
    return () => clearInterval(iv);
  }, [showCursor, typing]);

  const shown = target.slice(0, vis);
  const reserve = target.length > fallback.length ? target : fallback;
  return (
    <View testID={testID}>
      <Text style={[style, styles.reserve]} numberOfLines={numberOfLines} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {reserve}
      </Text>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Text style={style} numberOfLines={numberOfLines} accessibilityLabel={done ? target : shown}>
          {shown}
          {showCursor ? (
            // the space before the cursor is a line-break opportunity: the cursor may wrap, a word never jumps
            <Text style={[styles.cursor, !blinkOn && styles.cursorOff]}>{shown ? ' ▍' : '▍'}</Text>
          ) : null}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  reserve: { opacity: 0 },
  cursor: { color: COLORS.accent, opacity: 0.75 },
  cursorOff: { opacity: 0 },
});

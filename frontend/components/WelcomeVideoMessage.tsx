/**
 * WelcomeVideoMessage — renders a `welcome_video` DM attachment.
 *
 * The welcome DM from the officialmoodapp account can be a video (managed from
 * the admin dashboard / app-config, swappable without an app build). This card
 * shows a thumbnail-first poster with a play button; tapping loads the video
 * (expo-video) with native controls. Any aspect ratio is shown without cropping
 * (contentFit="contain" on a dark frame).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { cloudinaryThumbnailUrlFromVideoUrl } from '../utils/cloudinaryVideo';

interface WelcomeVideoMessageProps {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

export default function WelcomeVideoMessage({
  videoUrl,
  thumbnailUrl,
  caption,
}: WelcomeVideoMessageProps) {
  const [started, setStarted] = useState(false);
  // V2.1 — fall back to a Cloudinary-derived poster frame when app config has no
  // explicit welcome_video_thumbnail_url. Without this the DM rendered
  // `posterFallback` — a blank grey box — which is what made the founder video
  // look broken rather than unplayed. TutorialGrid and ExerciseLookupSheet
  // already use this same helper, so this matches how the rest of the app
  // derives posters instead of inventing a second convention.
  const poster = thumbnailUrl || cloudinaryThumbnailUrlFromVideoUrl(videoUrl);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  const handlePlay = () => {
    setStarted(true);
    try {
      player.play();
    } catch {
      // Best-effort — native controls remain available.
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        {!started ? (
          <TouchableOpacity style={styles.posterWrap} activeOpacity={0.9} onPress={handlePlay}>
            {poster ? (
              <Image source={{ uri: poster }} style={styles.media} contentFit="contain" transition={150} />
            ) : (
              <View style={[styles.media, styles.posterFallback]} />
            )}
            <View style={styles.playBtn}>
              <Ionicons name="play" size={26} color="#0c0c0c" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        ) : (
          <VideoView player={player} style={styles.media} contentFit="contain" nativeControls allowsFullscreen />
        )}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const CARD_W = 214;
const CARD_H = 286; // 3:4 — fits portrait or landscape via contain

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    maxWidth: CARD_W,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  frame: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0c0c0d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  posterWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    backgroundColor: '#141417',
  },
  playBtn: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(244,195,22,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  caption: {
    color: '#dcdce2',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 2,
  },
});

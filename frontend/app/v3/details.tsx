/**
 * /v3/details (retired in H2). The Phase 2.5/2.6 Details screen merged into the Workout Cart (/v3/workout): block facts,
 * thumbnails, cues, load guidance, progression and Swap Exercise now live in the Cart and its row detail sheet.
 * Kept as a redirect so any old link or deep link still lands on the same workout.
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function V3DetailsRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={id ? ({ pathname: '/v3/workout', params: { id } } as any) : '/'} />;
}

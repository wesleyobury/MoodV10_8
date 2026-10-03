/**
 * V3 exercise imagery: the thumbnail library is the primary source (canonical id, every generated exercise covered), the older
 * verified photos are a fallback only, wrong mappings from the pass-4 audit never come back through the fallback, and an unknown
 * id resolves to null (monogram). Run: node --import tsx --test utils/v3ExerciseImages.test.ts   (or yarn test:v3-media)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { V3_EXERCISE_IMAGES, exerciseImageSource, exerciseImageUrl } from './v3ExerciseImages';
import { V3_EXERCISE_THUMBS, thumbUrl } from './v3ExerciseThumbs';

const REMOVED = ["banded_squat_jump", "barbell_incline_press", "burpee", "cable_pressdown", "chin_up", "db_incline_press", "db_jumping_jack", "db_lateral_raise", "db_overhead_extension", "db_rear_delt_fly", "db_step_up_pop", "ez_preacher_curl", "ez_reverse_curl", "ez_skull_crusher", "front_squat", "hack_squat", "incline_db_curl", "jump_squat", "leg_press_calf_raise", "low_to_high_cable_fly", "machine_preacher_curl", "mb_backward_toss", "mb_chest_pass", "mb_overhead_throw", "mb_rotational_slam", "mb_rotational_throw", "mb_scoop_toss", "mb_shot_put", "neutral_grip_lat_pulldown", "seated_calf_raise", "seated_leg_curl", "sissy_squat", "split_jump", "standing_calf_raise_machine", "sumo_deadlift", "treadmill_incline_walk", "walking_lunge"];

test('library: 301 canonical ids, versioned Cloudinary URLs', () => {
  assert.equal(Object.keys(V3_EXERCISE_THUMBS).length, 301);
  for (const [id, v] of Object.entries(V3_EXERCISE_THUMBS)) {
    assert.match(id, /^[a-z0-9_]+$/, id);
    assert.match(v, /^v\d+$/, id);
    assert.equal(thumbUrl(id), `https://res.cloudinary.com/dfsygar5c/image/upload/${v}/mood/v3/exercises/${id}.jpg`);
  }
});

test('library covers every exercise the generator produces (blocks and Athletic warm-ups)', () => {
  const FIX: { workout: any }[] = JSON.parse(readFileSync(join(__dirname, 'v3Session', '__fixtures__', 'envelopes.json'), 'utf8'));
  const ids = new Set<string>();
  for (const f of FIX) {
    for (const b of f.workout.blocks) for (const it of b.items) ids.add(it.exercise.id);
    for (const x of f.workout.warmup?.items ?? []) if (x.exercise?.id) ids.add(x.exercise.id);
  }
  const missing = [...ids].filter((id) => !V3_EXERCISE_THUMBS[id]);
  assert.deepEqual(missing, []);
  assert.ok(ids.size > 200);
});

test('resolution order: library first, legacy photo second, monogram last; video thumbnails ignored', () => {
  assert.equal(exerciseImageSource({ exercise: { id: 'barbell_back_squat', media: { thumbnail_url: 'https://x/y.jpg' } } }), 'library');
  assert.equal(exerciseImageUrl({ exercise: { id: 'barbell_back_squat', media: null } }), thumbUrl('barbell_back_squat'));
  assert.equal(exerciseImageUrl({ exercise: { id: 'chin_up', media: { thumbnail_url: 'https://x/chin.jpg' } } }), thumbUrl('chin_up'));
  assert.equal(exerciseImageSource({ exercise: { id: 'no_such_exercise', media: { thumbnail_url: 'https://x/y.jpg' } } }), 'none');
  assert.equal(exerciseImageUrl({ exercise: { id: 'no_such_exercise', media: null } }), null);
  assert.equal(exerciseImageUrl({ exercise: null }), null);
});

test('legacy fallback: removed (wrong) mappings stay removed, remaining entries are https', () => {
  for (const id of REMOVED) assert.equal(V3_EXERCISE_IMAGES[id], undefined, id);
  for (const [id, url] of Object.entries(V3_EXERCISE_IMAGES)) assert.match(url, /^https:\/\//, id);
});

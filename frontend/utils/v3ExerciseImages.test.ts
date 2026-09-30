/**
 * Cart exercise images (founder pass 4 media audit). Every entry was checked by eye; these mappings were removed because the
 * picture contradicts the exercise (grip, implement, position) or the variation cannot be seen. A wrong picture is worse than
 * the monogram, so they must never come back without a new, verified image.
 * Run: node --import tsx --test utils/v3ExerciseImages.test.ts   (or yarn test:v3-media)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { V3_EXERCISE_IMAGES, exerciseImageSource, exerciseImageUrl } from './v3ExerciseImages';

const REMOVED = ["banded_squat_jump", "barbell_incline_press", "burpee", "cable_pressdown", "chin_up", "db_incline_press", "db_jumping_jack", "db_lateral_raise", "db_overhead_extension", "db_rear_delt_fly", "db_step_up_pop", "ez_preacher_curl", "ez_reverse_curl", "ez_skull_crusher", "front_squat", "hack_squat", "incline_db_curl", "jump_squat", "leg_press_calf_raise", "low_to_high_cable_fly", "machine_preacher_curl", "mb_backward_toss", "mb_chest_pass", "mb_overhead_throw", "mb_rotational_slam", "mb_rotational_throw", "mb_scoop_toss", "mb_shot_put", "neutral_grip_lat_pulldown", "seated_calf_raise", "seated_leg_curl", "sissy_squat", "split_jump", "standing_calf_raise_machine", "sumo_deadlift", "treadmill_incline_walk", "walking_lunge"];

test('removed (wrong) mappings stay removed', () => {
  for (const id of REMOVED) assert.equal(V3_EXERCISE_IMAGES[id], undefined, id);
});

test('84 verified static images, all Cloudinary https', () => {
  assert.equal(Object.keys(V3_EXERCISE_IMAGES).length, 84);
  for (const [id, url] of Object.entries(V3_EXERCISE_IMAGES)) assert.match(url, /^https:\/\/(res\.cloudinary\.com|customer-assets\.emergentagent\.com)\//, id);
});

test('static photo only; video thumbnails are never used (monogram instead)', () => {
  assert.equal(exerciseImageSource({ exercise: { id: 'barbell_back_squat', media: { thumbnail_url: 'https://x/y.jpg' } } }), 'mood');
  assert.equal(exerciseImageUrl({ exercise: { id: 'barbell_back_squat', media: { thumbnail_url: 'https://x/y.jpg' } } }), V3_EXERCISE_IMAGES.barbell_back_squat);
  assert.equal(exerciseImageUrl({ exercise: { id: 'chin_up', media: { thumbnail_url: 'https://x/chin.jpg' } } }), null);
  assert.equal(exerciseImageSource({ exercise: { id: 'chin_up', media: { thumbnail_url: 'https://x/chin.jpg' } } }), 'none');
  assert.equal(exerciseImageSource({ exercise: { id: 'chin_up', media: null } }), 'none');
});

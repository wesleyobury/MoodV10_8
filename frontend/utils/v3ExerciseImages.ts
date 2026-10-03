/**
 * Static Cart imagery for V3 exercises. Keyed by the V3 exercise id.
 *
 * Source: the V2 exercise-card library MOOD already owns (frontend/data/*-data.ts: 1,435 workout cards, 727 unique images),
 * plus the V2 equipment photos for machines and implements. Images are indexed per workout CARD, not per exercise, so only
 * single-movement cards (or an image verified by eye) are used, matched by exact id, exact name, or a validated normalized
 * name / manual match of the same movement AND implement. Multi-movement card covers are never used (they often show a
 * different movement). Founder pass 3 audit: every entry below was visually checked; 17 earlier entries that showed a
 * different movement or implement (e.g. incline press -> shoulder press, the generic med-ball photo on 7 throws) were removed.
 * Founder pass 4 verification: every remaining entry was viewed again at full size; 20 more were removed where the picture
 * contradicts the exercise (grip, implement, body position) or the variation cannot be seen (list: V3 Updates exercise media audit).
 * Founder policy (post pass 4): Cart and exercise images are static photos only (the set is moving to AI-generated photos in one
 * visual theme). Exercise-video thumbnails are never used as images. Anything not listed shows the monogram tile.
 */
import { thumbUrl } from './v3ExerciseThumbs';

export const V3_EXERCISE_IMAGES: Record<string, string> = {
  air_bike: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240950/mood_app/workout_images/foko2r38_download_2_.jpg', // Air Bike <- V2 equipment (air bike)
  arnold_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240980/mood_app/workout_images/64d4m132_arnold_press.jpg', // Arnold Press <- V2 card
  banded_broad_jump: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241153/mood_app/workout_images/j83mxy4p_download_1_.jpg', // Banded Broad Jump <- V2 card
  barbell_back_squat: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241296/mood_app/workout_images/wwl8m04q_back_squat.jpg', // manual <- V2 card compound-legs-workouts-data.ts:Back Squat Burnout
  barbell_bench_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg', // Barbell Bench Press <- V2 card
  barbell_hip_thrust: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240679/mood_app/workout_images/mr69uwpz_bb_hip_thrust.jpg', // exact_id <- V2 card glutes-workouts-data.ts:Tempo Hip Thrust
  barbell_overhead_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241017/mood_app/workout_images/kv2n6i9e_download.jpg', // Barbell Overhead Press <- V2 card (standing barbell overhead press)
  barbell_rdl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240638/mood_app/workout_images/46ki5rsl_download_15_.jpg', // exact_id <- V2 card hamstrings-workouts-data.ts:Barbell RDL
  battle_rope_waves: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241369/mood_app/workout_images/264ds1si_download.jpg', // Battle Rope Waves <- V2 equipment (battle rope)
  bench_dip: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240900/mood_app/workout_images/pkwqrz0u_bdips.jpg', // Bench Dip <- V2 card
  box_jump: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240628/mood_app/workout_images/wok1mz8a_rbj.jpg', // Box Jump <- V2 card
  cable_curl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240573/mood_app/workout_images/f0ehglmc_cable_curl_2.jpg', // Cable Curl <- V2 card
  cable_fly: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240776/mood_app/workout_images/szkempjn_download_9_.jpg', // manual <- V2 card chest-workouts-data.ts:Cable Burn
  cable_front_raise: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240994/mood_app/workout_images/d3k00azw_image.jpg', // Cable Front Raise <- V2 card
  cable_glute_kickback: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241390/mood_app/workout_images/coxrp5yp_gk.jpg', // manual <- V2 card glutes-workouts-data.ts:Cable High Kickback
  cable_lateral_raise: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241019/mood_app/workout_images/ndk3n5nw_image.jpg', // Cable Lateral Raise <- V2 card
  cable_pull_through: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241343/mood_app/workout_images/hgi9y71r_cpt.jpg', // normalized <- V2 card glutes-workouts-data.ts:Cable Pull‑Through
  cable_rear_delt_fly: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241001/mood_app/workout_images/gchfnmx0_image.jpg', // Single-Arm Cable Rear-Delt Fly <- V2 card (single arm rear delt fly)
  chest_supported_db_row: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240748/mood_app/workout_images/rw2y880d_chest_supported_db_row.jpg', // Chest-Supported Dumbbell Row <- V2 card
  chest_supported_row_machine: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241290/mood_app/workout_images/m556b5a2_scsr_1.jpg', // manual <- V2 card back-workouts-data.ts:Pause Rows
  db_alternating_curl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg', // Alternating Dumbbell Curl <- V2 card
  db_push_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240984/mood_app/workout_images/8rj9v297_db_push_press.jpg', // manual <- V2 card shoulders-workouts-data.ts:Heavy Push Press Builder
  db_rdl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241323/mood_app/workout_images/5v2oyit3_dbrdl.jpg', // exact_id <- V2 card compound-legs-workouts-data.ts:DB RDL
  db_shoulder_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241020/mood_app/workout_images/njrg622y_shoulder_press.jpg', // Seated Dumbbell Shoulder Press <- V2 card
  db_skull_crusher: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240804/mood_app/workout_images/4yj3bfg1_lying_db_sc.jpg', // exact_id <- V2 card triceps-workouts-data.ts:Lying DB Skullcrushers
  db_snatch: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241147/mood_app/workout_images/gp7crm2s_dbsn.jpg', // manual <- V2 card explosiveness-weights-data.ts:DB Snatch Alternating
  db_step_up: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/7tvi5pvu_db%20step%20up.png', // manual <- V2 card compound-legs-workouts-data.ts:Tempo Step-Ups
  ez_bar_curl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg', // EZ-Bar Curl <- V2 card
  face_pull: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241042/mood_app/workout_images/z8ycso14_face_pull.jpg', // Face Pull <- V2 card
  front_foot_elevated_split_squat: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241295/mood_app/workout_images/rvwet9i1_db_elevated_split_squat.jpg', // exact_name <- V2 card compound-legs-workouts-data.ts:Front-Foot Elevated Split Squat
  goblet_squat: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241347/mood_app/workout_images/iq16b1nm_download.jpg', // Goblet Squat <- V2 card
  good_morning: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240665/mood_app/workout_images/9wufahvm_bb_goodmorning.jpg', // normalized <- V2 card hamstrings-workouts-data.ts:Barbell Hip Hinge Good Morning
  hammer_curl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg', // Hammer Curl <- V2 card
  hang_high_pull: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240999/mood_app/workout_images/ehcn1tsd_High_pull.jpg', // manual <- V2 card shoulders-workouts-data.ts:High Pull Control
  hanging_knee_raise: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/t73he7a9_hanging%20knee%20raise%202.png', // Hanging Knee Raise <- V2 card
  hanging_leg_raise: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240898/mood_app/workout_images/n5wg8sb5_download_17_.jpg', // Hanging Leg Raise <- V2 card
  hip_abduction_machine: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240686/mood_app/workout_images/swjfi31g_hip_abductor_2.jpg', // manual <- V2 card glutes-workouts-data.ts:Triple Drop Abduction
  inverted_row: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241216/mood_app/workout_images/cvdrz3i5_inverted_rows.jpg', // manual <- V2 card calisthenics-all-workouts-data.ts:Volume Pull
  jump_rope: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240959/mood_app/workout_images/vj88wh1r_download.jpg', // Jump Rope <- V2 equipment (jump rope)
  kettlebell_deadlift: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/wt6q1tpv_kb%20deadlift.png', // Kettlebell Deadlift <- V2 card
  kettlebell_swing: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/pj2fe7fs_kb%20swing%202.png', // Kettlebell Swing <- V2 card
  landmine_press_single_arm: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240998/mood_app/workout_images/e2d8369i_landmine_sa_press.jpg', // Single-Arm Landmine Press <- V2 card
  landmine_push_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241028/mood_app/workout_images/rrxbxdk3_image.jpg', // exact_id <- V2 card shoulders-workouts-data.ts:Landmine Push Press Builder
  landmine_rotational_punch: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241159/mood_app/workout_images/p9g3x5md_ssrp.jpg', // manual <- V2 card explosiveness-weights-data.ts:Split Stance Rotation Punch
  landmine_split_jerk: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241145/mood_app/workout_images/g4orfvp8_lmsjl.jpg', // manual <- V2 card explosiveness-weights-data.ts:Landmine Split Jerk Ladder
  lat_pulldown: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240551/mood_app/workout_images/j967e9c7_download_9_.jpg', // manual <- V2 card back-workouts-data.ts:Pulldown + Hold
  lateral_lunge: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241344/mood_app/workout_images/hiyqkn20_db_lat_lunge.jpg', // Lateral Lunge <- V2 card
  leg_extension: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240641/mood_app/workout_images/er89oli2_download_23_.jpg', // Leg Extension <- V2 card
  leg_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241269/mood_app/workout_images/2wjzuq6x_leg_press_2.jpg', // Leg Press <- V2 card
  lying_leg_curl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240645/mood_app/workout_images/o9f5gltv_Screenshot_2025-12-02_at_10_29_39_PM.jpg', // exact_name <- V2 card hamstrings-workouts-data.ts:Lying Leg Curl
  machine_chest_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241305/mood_app/workout_images/67nyth7l_download_2_.jpg', // normalized <- V2 card chest-workouts-data.ts:Heavy Machine
  machine_crunch: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240722/mood_app/workout_images/g9c1g1gr_ab_crunch_machine.jpg', // manual <- V2 card abs-workouts-data.ts:Slow Eccentric Machine Crunch
  machine_glute_kickback: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240675/mood_app/workout_images/haz45wxi_glute_kickback_2.jpg', // manual <- V2 card glutes-workouts-data.ts:Single-Leg Kickback
  machine_shoulder_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240996/mood_app/workout_images/dq10rl9d_download_4_.jpg', // Machine Shoulder Press <- V2 card
  med_ball_slam: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240600/mood_app/workout_images/dkiyafwm_download_1_.jpg', // manual <- V2 card bodyweight-explosiveness-data.ts:Slam Cluster Density
  overhead_cable_extension: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240563/mood_app/workout_images/44n90zpn_OH_tri_ext.jpg', // Overhead Cable Triceps Extension <- V2 card (overhead cable extension)
  pec_deck: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg', // normalized <- V2 card chest-workouts-data.ts:Fly Control
  pendulum_squat: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/4ei74z7h_Pendullum%20squat.png', // Pendulum Squat <- V2 card
  plank: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240908/mood_app/workout_images/rptdlvng_download_12_.jpg', // exact_id <- V2 card abs-workouts-data.ts:Forearm Plank Hold
  pull_up: 'https://customer-assets.emergentagent.com/job_ba98ecac-d9ff-4da8-8b26-c72f04702bfb/artifacts/67090cjn_pull%20up%202.avif', // normalized <- V2 card back-workouts-data.ts:Tempo Pull-Ups
  push_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241152/mood_app/workout_images/hsftvvu7_download_9_.jpg', // Push Press <- V2 card
  reverse_lunge: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241281/mood_app/workout_images/cnnnnm30_db_reverse_lunge.jpg', // Reverse Lunge <- V2 card
  rope_pressdown: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241088/mood_app/workout_images/kn9gulrn_download_2_.jpg', // manual <- V2 card triceps-workouts-data.ts:Rope Pushdown
  row_erg: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg', // Row Erg <- V2 equipment (row erg)
  seated_cable_row: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240705/mood_app/workout_images/9zff190v_scr.jpg', // manual <- V2 card back-workouts-data.ts:Cable Row Drop Set
  single_arm_db_row: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240692/mood_app/workout_images/2ctzlc7l_SA_db_row.jpg', // Single-Arm Dumbbell Row <- V2 card
  single_leg_db_calf_raise: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241341/mood_app/workout_images/comj9q78_download_4_.jpg', // normalized <- V2 card calves-workouts-data.ts:Single‑Leg DB Calf Raise
  single_leg_leg_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241354/mood_app/workout_images/pfq28xzl_Screenshot_2025-12-06_at_7_18_57_PM.jpg', // Single-Leg Leg Press <- V2 card (single leg press)
  ski_erg: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240954/mood_app/workout_images/lv55gxbj_download.jpg', // SkiErg <- V2 equipment (skierg)
  sled_push: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240625/mood_app/workout_images/tpb5vjf0_download_8_.jpg', // Sled Push <- V2 card
  smith_incline_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240770/mood_app/workout_images/hag08c16_download_14_.jpg', // Smith Machine Incline Press <- V2 card (smith incline press)
  smith_shoulder_press: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241010/mood_app/workout_images/hphatpce_Smith-Machine-Shoulder-Press.jpg', // Smith Machine Shoulder Press <- V2 card
  smith_squat: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241300/mood_app/workout_images/ynnuugau_smith_squat.jpg', // manual <- V2 card compound-legs-workouts-data.ts:Heavy Smith Squat
  speed_trap_bar_deadlift: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg', // Speed Trap-Bar Deadlift <- V2 card (trap bar deadlift)
  split_jerk: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241167/mood_app/workout_images/rr22go80_download_3_.jpg', // Split Jerk <- V2 card
  stair_climber: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240943/mood_app/workout_images/clikf991_download.jpg', // Stair Climber <- V2 equipment (stair)
  stationary_bike: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240949/mood_app/workout_images/fbe3z3jx_download_1_.jpg', // Stationary Bike <- V2 equipment (stationary bike)
  step_up_pop: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240614/mood_app/workout_images/nro93355_slbj.jpg', // Explosive Step-Up (Pop) <- V2 card (step up pop)
  t_bar_row: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240755/mood_app/workout_images/zwx4bge7_t_bar_row_2.jpg', // T-Bar Row <- V2 card
  trap_bar_deadlift: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg', // Trap-Bar Deadlift <- V2 card
  trap_bar_jump: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241140/mood_app/workout_images/dpe352d2_tbj.jpg', // Trap-Bar Jump Squat <- V2 card (trap bar jump)
  treadmill_run: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240938/mood_app/workout_images/6512s28r_download.jpg', // Treadmill Run <- V2 equipment (treadmill)
  weighted_pull_up: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240752/mood_app/workout_images/z868brwr_wighted_pull_up.jpg', // normalized <- V2 card back-workouts-data.ts:Weighted Pull-Ups
  zercher_squat: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/5n35ypfy_zercher%20squat.png', // manual <- V2 card compound-legs-workouts-data.ts:Tempo Zercher Squat
};

/**
 * The image a V3 exercise row shows. Resolution order (founder UX pass, thumbnail library):
 *   1. the V3 exercise thumbnail library (utils/v3ExerciseThumbs, one visual theme, keyed by canonical exercise id;
 *      every exercise the generator can produce is covered);
 *   2. the older verified static photo above (kept only as a fallback for an id that ever leaves the library);
 *   3. null: the caller renders its monogram tile. Nothing here ever blocks a workout.
 * Video-library thumbnails (exercise.media.thumbnail_url) are intentionally ignored; video only drives the Watch demo button.
 */
export function exerciseImageUrl(item: { exercise?: { id?: string; media?: { thumbnail_url?: string | null } | null } | null }): string | null {
  const id = item.exercise?.id;
  if (!id) return null;
  return thumbUrl(id) ?? V3_EXERCISE_IMAGES[id] ?? null;
}

export function exerciseImageSource(item: Parameters<typeof exerciseImageUrl>[0]): 'library' | 'mood' | 'none' {
  const id = item.exercise?.id;
  if (id && thumbUrl(id)) return 'library';
  return exerciseImageUrl(item) ? 'mood' : 'none';
}

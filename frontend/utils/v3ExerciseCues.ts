/**
 * MOOD coaching for the V3 exercise library (founder review 6): four lines per exercise, each about something different,
 * so the two cues on the set screen never repeat each other and change as the athlete moves through the sets.
 *
 *   setup       how to get into position before the first rep (stance, grip, bench / seat / cable height)
 *   form        what a good rep looks like while it moves (path, range, joint positions, where it is felt)
 *   efficiency  how to get the most out of each rep (intent, tempo, the muscle that drives, a pause)
 *   fatigue     what breaks down first on this lift late in a hard set, and how to hold it or when to stop
 *
 * The set screen shows two (exerciseCues): first set setup + form, middle sets form + efficiency, last set fatigue +
 * efficiency. Keyed by exercise id (the same ids as utils/v3ExerciseThumbs). Plain language, no dashes.
 */
export interface ExerciseCoaching {
  setup: string;
  form: string;
  efficiency: string;
  fatigue: string;
}

export const V3_COACHING: Record<string, ExerciseCoaching> = {
  chest_supported_row_machine: {
    setup: 'Set the seat so the pad hits your sternum and your arms just reach the handles at full stretch.',
    form: 'Pull the handles to your lower ribs, elbows skimming your sides, then reach fully forward.',
    efficiency: 'Lead with the elbows, not the hands, and squeeze your shoulder blades together for a one-count hold.',
    fatigue: 'Last reps: your chest will want to peel off the pad; stay pinned to it, or end the set.',
  },
  chest_supported_db_row: {
    setup: 'Set the bench near 30 degrees, lie chest down, and let the dumbbells hang under your shoulders.',
    form: 'Row the bells toward your hips in a slight arc, elbows at roughly 45 degrees from your torso.',
    efficiency: 'Drive with your mid back, pausing one beat at the top before a slow two-second lower.',
    fatigue: 'Last reps: your chest will lift off the pad and your neck will crane; stay down or end the set.',
  },
  chest_supported_rear_delt_row: {
    setup: 'Lie chest down on a low incline and hold light dumbbells with palms facing your feet.',
    form: 'Pull with elbows flared wide to shoulder height, upper arms nearly perpendicular to your body.',
    efficiency: 'Pause a beat at the top and lower for two seconds; keep the shoulder blades quiet so rear delts work.',
    fatigue: 'Last reps: your traps will shrug the weight up; keep your shoulders down from your ears, or stop.',
  },
  barbell_row: {
    setup: 'Grip the bar just outside your knees, hinge to about a 45 degree torso, and keep knees soft.',
    form: 'Pull the bar to your lower ribs along your thighs, then lower it until your arms are fully straight.',
    efficiency: 'Drive the elbows back fast, squeeze a beat at the top, and take two seconds to lower.',
    fatigue: 'Last reps: your torso will rise to cheat the bar up; hold your hinge angle, or rack it.',
  },
  pendlay_row: {
    setup: 'Start with the bar on the floor over mid-foot, torso near parallel, back flat, shins vertical.',
    form: 'Explode the bar from the floor to your lower chest, then return it to a dead stop every rep.',
    efficiency: 'Reset your brace on the floor between reps and make each pull as fast as possible.',
    fatigue: 'Last reps: your back will round as you yank it off the floor; if bar speed drops, end the set.',
  },
  meadows_row: {
    setup: 'Stand side-on to the landmine sleeve in a staggered stance, front forearm resting on your knee.',
    form: 'Row the thick sleeve end up past your hip, letting the shoulder stretch down at the bottom.',
    efficiency: 'Pull your elbow up and back toward the ceiling for a big lat and upper back contraction.',
    fatigue: 'Last reps: your torso will twist open to finish; keep your hips and chest square, or stop.',
  },
  t_bar_row: {
    setup: 'Straddle the bar, feet shoulder width, hinge to about 45 degrees, and take a neutral grip.',
    form: 'Row the plates to your upper stomach, keep the bar close, and let your arms fully extend each rep.',
    efficiency: 'Squeeze your shoulder blades together at the top and lower slowly for two seconds.',
    fatigue: 'Last reps: your knees and hips will bounce the weight up; hold still from the waist down or end it.',
  },
  single_arm_db_row: {
    setup: 'Plant one hand and knee on a flat bench, other foot wide on the floor, back flat and hips level.',
    form: 'Row the dumbbell toward your hip pocket, elbow close, then let it hang to a full stretch.',
    efficiency: 'Start each pull by drawing the shoulder blade back; keep a loose grip so the lat drives, not the biceps.',
    fatigue: 'Last reps: your torso will rotate open to heave it up; keep the chest facing the floor, or stop.',
  },
  bent_over_db_row: {
    setup: 'Hold a dumbbell in each hand, hinge forward to about 45 degrees with soft knees and a flat back.',
    form: 'Row both bells to your lower ribs with elbows tracking back, then lower to a full arm hang.',
    efficiency: 'Pause briefly with your shoulder blades pinched, then take two seconds on the way down.',
    fatigue: 'Last reps: you\'ll stand taller to finish them; keep your torso angle fixed, or end the set.',
  },
  seated_cable_row: {
    setup: 'Sit with feet on the platform, knees soft, torso upright, holding the handle at arm\'s length.',
    form: 'Pull the handle to your belly button, elbows tight, then let the shoulders reach forward at the end.',
    efficiency: 'Lead with the elbows and squeeze your shoulder blades for one second before the return.',
    fatigue: 'Last reps: you\'ll lean way back to finish; stay tall over your hips and stop when you can\'t.',
  },
  single_arm_cable_row: {
    setup: 'Set the cable at chest height, stagger your stance, and hold the handle with one arm extended.',
    form: 'Row the handle toward your hip, then let your shoulder reach forward on the return.',
    efficiency: 'Start each pull by drawing the shoulder blade back, then drive the elbow past your ribs.',
    fatigue: 'Last reps: your hips will twist to cheat; keep them facing the stack and finish with the arm.',
  },
  machine_low_row: {
    setup: 'Adjust the seat so the handles line up with your lower ribs and set your chest firmly on the pad.',
    form: 'Pull the handles back along your sides until your elbows pass your torso, then fully extend.',
    efficiency: 'Drive through your elbows and hold the squeeze for one count; lower with a slow two count.',
    fatigue: 'Last reps: your shoulders will roll forward at the finish; keep them pulled back, or end the set.',
  },
  machine_high_row: {
    setup: 'Set the seat so the handles sit just above head height and your thighs are locked under the pad.',
    form: 'Pull the handles down and back toward your upper chest in an arc, elbows ending at your sides.',
    efficiency: 'Think of driving elbows down into your back pockets to hit the lats and mid back.',
    fatigue: 'Last reps: you\'ll lean back and yank the handles; keep your torso still and stop when reps shorten.',
  },
  inverted_row: {
    setup: 'Set a bar about waist height, hang underneath with an overhand grip and your heels on the floor.',
    form: 'Pull your chest to the bar with elbows about 45 degrees, then lower until your arms are straight.',
    efficiency: 'Pause with your chest at the bar for one count, then take two full seconds to lower.',
    fatigue: 'Last reps: your hips will sag toward the floor; keep your body in a straight plank, or end the set.',
  },
  suspension_row: {
    setup: 'Shorten the straps, lean back with straight arms, and walk your feet forward to set the difficulty.',
    form: 'Pull your chest up to the handles, palms turning in, elbows close, then lower to full arm length.',
    efficiency: 'Squeeze your shoulder blades for a beat at the top, then lower for a slow two count.',
    fatigue: 'Last reps: your hips will drop first; squeeze your glutes to stay straight, or step your feet back.',
  },
  renegade_row: {
    setup: 'Set up in a push-up position on two dumbbells, feet wider than hips for a stable base.',
    form: 'Row one bell to your hip while the other arm presses hard into the floor, then switch sides.',
    efficiency: 'Row slowly and exhale as the bell rises; aim for zero hip shift, not a heavier dumbbell.',
    fatigue: 'Last reps: your hips will rotate and sway; if you can\'t keep them square, end the set.',
  },
  lat_pulldown: {
    setup: 'Lock your thighs under the pad and grip the bar a bit wider than shoulders, palms facing away.',
    form: 'Pull the bar to your upper chest with a slight lean back, then fully straighten your arms.',
    efficiency: 'Think about driving your elbows down to your hips so your lats, not arms, move the weight.',
    fatigue: 'Last reps: you\'ll swing your torso back to finish; stay at a slight lean or end the set there.',
  },
  neutral_grip_lat_pulldown: {
    setup: 'Attach a close neutral-grip handle, sit with thighs locked in, and lean back just slightly.',
    form: 'Pull the handle to your upper chest with elbows tracking in front of you, then fully extend.',
    efficiency: 'Drive the elbows down toward your back pockets and pause a beat with the chest up.',
    fatigue: 'Last reps: your shoulders will roll forward at the bottom; keep your chest tall or stop.',
  },
  single_arm_lat_pulldown: {
    setup: 'Sit or kneel under a high cable, holding the D-handle with one arm fully stretched overhead.',
    form: 'Pull your elbow down to your side, slightly behind your torso, then reach fully back up.',
    efficiency: 'Let the shoulder rise into a deep stretch at the top, then start each pull by dropping it down.',
    fatigue: 'Last reps: your torso will lean and twist; keep your ribs stacked, or end the set.',
  },
  straight_arm_pulldown: {
    setup: 'Face a high cable, hinge slightly at the hips, and hold the bar with nearly straight arms.',
    form: 'Sweep the bar down in an arc to your thighs, keeping the same soft bend in your elbows.',
    efficiency: 'Think about pushing the bar down with your lats; squeeze for one count at the hips.',
    fatigue: 'Last reps: your elbows will bend and it turns into a press; hold the arm angle or stop.',
  },
  cable_pullover: {
    setup: 'Set the cable high with a rope, step back, and hinge forward with arms overhead and a slight bend.',
    form: 'Pull the rope down in a wide arc until your hands reach your hips, then let it rise back slowly.',
    efficiency: 'Feel the lats lengthen at the top and pull from your armpits rather than your hands.',
    fatigue: 'Last reps: your lower back will arch to help; keep your ribs down, or end the set there.',
  },
  db_pullover: {
    setup: 'Lie on a flat bench holding one dumbbell over your chest, both palms cupping the top plate.',
    form: 'Lower the bell behind your head in an arc with soft elbows, then pull it back over your chest.',
    efficiency: 'Stretch deep at the bottom, then lift by driving the elbows forward toward your knees.',
    fatigue: 'Last reps: your elbows will bend more to shorten the lever; keep the angle fixed, or stop.',
  },
  pull_up: {
    setup: 'Hang from the bar with an overhand grip a bit wider than shoulders, legs together and still.',
    form: 'Pull until your chin clears the bar, then lower all the way to straight arms every rep.',
    efficiency: 'Start each rep by pulling your shoulders down, then drive your elbows toward your ribs.',
    fatigue: 'Last reps: you\'ll want to kick and shorten the bottom; keep legs quiet and full range, or stop.',
  },
  chin_up: {
    setup: 'Hang with an underhand grip about shoulder width, legs together and slightly in front of you.',
    form: 'Pull your chest toward the bar until your chin is over it, then lower to a full hang.',
    efficiency: 'Drive your elbows down to your sides and squeeze your biceps and lats at the top.',
    fatigue: 'Last reps: you\'ll crane your neck to get the chin over; if your chest can\'t rise, end the set.',
  },
  neutral_grip_pull_up: {
    setup: 'Grab the parallel handles with palms facing each other and hang with arms fully straight.',
    form: 'Pull up until your chin clears the handles, elbows tracking forward, then lower all the way.',
    efficiency: 'Lead with your chest and squeeze your shoulder blades down and together at the top.',
    fatigue: 'Last reps: your body will swing and kip; keep your legs still and stop when reps get short.',
  },
  weighted_pull_up: {
    setup: 'Secure the plate or dumbbell on a dip belt so it hangs centered, then hang with straight arms.',
    form: 'Pull until your chin passes the bar, then lower to a dead hang without letting the load swing.',
    efficiency: 'Keep the weight still beneath you and pull explosively from a set shoulder position.',
    fatigue: 'Last reps: the load will swing and range will shrink; stop before reps turn into partials.',
  },
  assisted_pull_up_machine: {
    setup: 'Set the assist weight so you can hit your reps, then kneel on the pad with an overhand grip.',
    form: 'Pull until your chin passes the handles, then lower until your arms are fully straight.',
    efficiency: 'Initiate by pulling your shoulders down, and lower slowly for three seconds to build strength.',
    fatigue: 'Last reps: you\'ll stop short at the top; keep full range or add assistance for the final reps.',
  },
  band_assisted_muscle_up: {
    setup: 'Loop a band over the bar, set a knee or foot in it, and take a false grip just outside shoulders.',
    form: 'Pull hard to your lower chest, whip your chest over the bar, then press out to straight arms.',
    efficiency: 'Keep the false grip tight so your wrists are already on top, which cuts the turnover time.',
    fatigue: 'Last reps: your pull will stop short of the turnover; end the set before you grind or chicken wing.',
  },
  bar_muscle_up: {
    setup: 'Hang with a shoulder width overhand or false grip and start a small, tight hollow to arch swing.',
    form: 'Pull the bar toward your hips, snap your chest over it, then press out to locked arms on top.',
    efficiency: 'Use the swing to time an aggressive, fast pull and turn the wrists over quickly.',
    fatigue: 'Last reps: one arm will chicken wing over the bar; end the set as soon as your pull slows.',
  },
  face_pull: {
    setup: 'Set a rope at upper chest height, grip with thumbs toward you, and step back to tension.',
    form: 'Pull the rope toward your eyes, splitting the ends apart, elbows high and even with your hands.',
    efficiency: 'Finish with your hands beside your ears and hold the squeeze for a full second.',
    fatigue: 'Last reps: your elbows will drop and it becomes a row; keep them high or reduce the weight.',
  },
  face_pull_to_external_rotation: {
    setup: 'Set a rope or band at face height, grip with thumbs back, and stand tall in a split stance.',
    form: 'Pull to your face with high elbows, then rotate your hands up and back into a double biceps pose.',
    efficiency: 'Pause for a second in the rotated position and lower each phase slowly.',
    fatigue: 'Last reps: the rotation will shorten first; finish it fully with hands back, or end the set.',
  },
  band_pull_apart: {
    setup: 'Hold a light band at shoulder height, arms straight, hands about shoulder width apart.',
    form: 'Pull the band apart until it touches your chest, keeping elbows nearly straight throughout.',
    efficiency: 'Squeeze your shoulder blades together and resist the band on the way back for two seconds.',
    fatigue: 'Last reps: your elbows will bend and your ribs will flare; keep arms straight, or end the set.',
  },
  prone_y_raise: {
    setup: 'Lie chest down on a low incline bench with light dumbbells hanging, thumbs pointing up.',
    form: 'Raise your arms up and out in a Y shape to ear height, then lower slowly to the start.',
    efficiency: 'Think of reaching long away from your body as you lift, holding the top for one count.',
    fatigue: 'Last reps: your traps will shrug the weight up; keep shoulders away from ears, or stop.',
  },
  reverse_pec_deck: {
    setup: 'Set the handles to their rear position, sit facing the pad, and grip at shoulder height.',
    form: 'Sweep your arms back in a wide arc until they line up with your torso, elbows softly bent.',
    efficiency: 'Push out to the sides with the backs of your hands and pause briefly at the end.',
    fatigue: 'Last reps: your chest will come off the pad to help; stay pressed into it, or end the set.',
  },
  cable_rear_delt_fly: {
    setup: 'Set a cable at shoulder height, stand side on, and grab the handle with your far hand.',
    form: 'Sweep your arm back in an arc until it lines up with your shoulder, keeping a soft elbow.',
    efficiency: 'Lead with the back of your hand and pause for a beat at the end of the range.',
    fatigue: 'Last reps: your torso will rotate to swing it; keep your chest facing forward or stop the set.',
  },
  db_rear_delt_fly: {
    setup: 'Hinge forward until your torso is nearly parallel, holding light dumbbells under your chest.',
    form: 'Raise your arms out wide to shoulder height with a slight elbow bend, then lower slowly.',
    efficiency: 'Think of spreading your hands apart to the walls, holding the top position for a beat.',
    fatigue: 'Last reps: your torso will rise and you\'ll swing; hold the hinge, or end the set.',
  },
  hang_high_pull: {
    setup: 'Start standing with the bar at mid thigh, overhand grip slightly wider than shoulders.',
    form: 'Explode with hips and legs, then pull the bar up to chest height with elbows high and wide.',
    efficiency: 'Snap your hips forward hard and let the momentum carry the bar into the arm pull.',
    fatigue: 'Last reps: bar speed will drop and your arms take over; end the set when your hips stop driving it.',
  },
  barbell_bench_press: {
    setup: 'Lie with eyes under the bar, feet planted flat, and shoulder blades pinched back and down.',
    form: 'Lower the bar to your lower chest with elbows at about 45 degrees, then press up and slightly back.',
    efficiency: 'Drive your feet into the floor and push the bar fast, lowering it under control for two seconds.',
    fatigue: 'Last reps: your butt will lift off the bench; keep it down and rack when reps slow sharply.',
  },
  barbell_incline_press: {
    setup: 'Set the bench at 30 degrees, plant your feet, and pull your shoulder blades back before unracking.',
    form: 'Lower the bar to your upper chest just under your collarbone, then press it straight up.',
    efficiency: 'Press through your upper chest and keep the forearms vertical at the bottom.',
    fatigue: 'Last reps: your elbows will flare wide; keep them slightly tucked, or rack the bar.',
  },
  close_grip_bench_press: {
    setup: 'Grip the bar just inside shoulder width, lie with eyes under it, and set your feet firm.',
    form: 'Lower to your lower chest with elbows tucked near your sides, then press up to lockout.',
    efficiency: 'Focus on extending your elbows and drive through your triceps at lockout.',
    fatigue: 'Last reps: the bar will drift toward your face; keep its path over your lower chest, or rack it.',
  },
  db_bench_press: {
    setup: 'Kick the bells up from your knees, lie back, plant your feet, and set shoulder blades down.',
    form: 'Lower the dumbbells to chest level with elbows at 45 degrees, then press up and slightly in.',
    efficiency: 'Push through your chest with a smooth tempo, lowering slowly for a deep stretch at the bottom.',
    fatigue: 'Last reps: the bells will drift apart unevenly; keep them level over your chest, or end the set.',
  },
  db_incline_press: {
    setup: 'Set the bench at 30 degrees, rest the bells on your thighs, then kick them up as you lie back.',
    form: 'Lower the dumbbells to your upper chest, forearms vertical, then press up until arms are straight.',
    efficiency: 'Press through the upper chest and squeeze at the top without banging the bells together.',
    fatigue: 'Last reps: your elbows will flare and shoulders will roll forward; keep them set, or stop.',
  },
  db_floor_press: {
    setup: 'Lie on the floor with knees bent, feet flat, holding the dumbbells above your chest.',
    form: 'Lower until your upper arms touch the floor at about 45 degrees, then press back to lockout.',
    efficiency: 'Pause on the floor for a full beat, then press without bouncing your elbows.',
    fatigue: 'Last reps: one bell will lag and your elbows will flare; keep both even, or end the set.',
  },
  machine_chest_press: {
    setup: 'Adjust the seat so the handles are at mid chest height and your back is flat on the pad.',
    form: 'Press the handles forward until arms are straight, then let them return to a deep stretch.',
    efficiency: 'Push through your chest and slow the return to about two seconds.',
    fatigue: 'Last reps: your shoulders will roll forward off the pad; keep them pinned back, or stop.',
  },
  machine_incline_press: {
    setup: 'Set the seat so the handles start just above your upper chest, back flat and feet planted.',
    form: 'Press up and forward until your arms are straight, then lower to a full stretch.',
    efficiency: 'Drive through your upper chest and keep a steady tempo, pausing briefly at the bottom.',
    fatigue: 'Last reps: your shoulders will shrug up; keep them down away from your ears, or end it.',
  },
  smith_bench_press: {
    setup: 'Set the bench so the bar lines up with your lower chest, then pinch your shoulder blades back.',
    form: 'Lower the bar to your lower chest with elbows at 45 degrees, then press it to lockout.',
    efficiency: 'Drive your feet into the floor and press with intent, lowering for a steady two count.',
    fatigue: 'Last reps: your lower back will arch too high; keep your butt down, or rack the bar.',
  },
  smith_incline_press: {
    setup: 'Set the bench at 30 degrees so the bar comes down to your upper chest, feet planted.',
    form: 'Lower the bar to just below your collarbone, then press it straight up to lockout.',
    efficiency: 'Squeeze your upper chest at the top and lower slowly for a deep stretch.',
    fatigue: 'Last reps: your elbows will flare wide; keep them near 45 degrees, or rack it.',
  },
  cable_chest_press: {
    setup: 'Set handles at chest height, stand in a split stance centered between the stacks.',
    form: 'Press the handles forward and slightly together until your arms are straight, then return.',
    efficiency: 'Squeeze your chest as the hands meet and resist the cables on the way back.',
    fatigue: 'Last reps: your torso will lean forward to finish; stay upright, or end the set.',
  },
  single_arm_cable_chest_press: {
    setup: 'Set the cable at chest height, face away, and stagger your stance with the opposite leg forward.',
    form: 'Press the handle straight out until your arm is extended, then return slowly to chest level.',
    efficiency: 'Drive through your chest, resisting the pull to rotate as you press.',
    fatigue: 'Last reps: your torso will twist toward the working side; stay square or end the set.',
  },
  cable_fly: {
    setup: 'Set the pulleys at shoulder height, step forward in a split stance with a slight lean.',
    form: 'Bring your hands together in a wide hugging arc in front of your chest, elbows softly bent.',
    efficiency: 'Squeeze the chest hard as the hands meet, and slow the return for a deep stretch.',
    fatigue: 'Last reps: your elbows will bend and it turns into a press; hold the arm angle, or stop.',
  },
  low_to_high_cable_fly: {
    setup: 'Set both pulleys at the bottom, step forward, and hold handles by your hips with palms up.',
    form: 'Sweep your hands up and in to meet at upper chest height, elbows softly bent.',
    efficiency: 'Squeeze your upper chest at the top, letting the cables pull you back slowly.',
    fatigue: 'Last reps: your shoulders will shrug up to lift; keep them down away from your ears, or stop.',
  },
  db_fly: {
    setup: 'Lie flat with feet planted, shoulder blades squeezed together, dumbbells over your chest.',
    form: 'Open in a wide arc with a soft bend at the elbows until you feel a deep pec stretch.',
    efficiency: 'Think of hugging a tree; squeeze the pecs hard for a beat with the dumbbells together.',
    fatigue: 'Last reps: the dumbbells will drop lower than you can own; shorten the arc or stop.',
  },
  pec_deck: {
    setup: 'Set the seat so the handles line up with mid chest; press your back flat to the pad.',
    form: 'Sweep the arms together in an arc, keeping elbows just below shoulder height.',
    efficiency: 'Squeeze for a full second when the handles meet, then let them drift back slowly.',
    fatigue: 'Last reps: the hands will want to push instead of hug; keep the arc wide or end the set.',
  },
  mb_chest_pass: {
    setup: 'Stand square to the wall in an athletic stance, ball held at the chest, elbows wide.',
    form: 'Step into the throw and punch the ball straight out, finishing with arms fully long.',
    efficiency: 'Throw every rep as hard as you can; catch, reset, and fire again with full intent.',
    fatigue: 'Last reps: throws will slow and hit lower on the wall; end the set once the power fades.',
  },
  push_up: {
    setup: 'Set hands just outside the shoulders, feet together, body in one line from head to heels.',
    form: 'Lower until the chest nearly touches the floor, elbows about 45 degrees from the body.',
    efficiency: 'Push the floor away hard and spread the shoulder blades wide at the top.',
    fatigue: 'Last reps: the hips will sag first; squeeze the glutes tight, or drop to the knees.',
  },
  explosive_push_up: {
    setup: 'Start in a strong plank with hands under the shoulders and glutes squeezed.',
    form: 'Drop to a few inches off the floor, then drive up hard enough for the hands to leave.',
    efficiency: 'Land softly with bent elbows and flow straight into the next rep without resting.',
    fatigue: 'Last reps: your hands will stop leaving the floor; end the set when the landings get heavy.',
  },
  deficit_push_up: {
    setup: 'Grip the handles or plates shoulder width apart with your body straight like a plank.',
    form: 'Lower until the chest sinks below the handles, then press back to full lockout.',
    efficiency: 'Pause for a beat in the bottom stretch, then drive up fast through the palms.',
    fatigue: 'Last reps: the depth will shrink first; keep going below the handles or stop.',
  },
  diamond_push_up: {
    setup: 'Make a diamond with thumbs and index fingers directly under your sternum.',
    form: 'Lower with the elbows tracking back along your ribs until the chest meets the hands.',
    efficiency: 'Drive through the heels of the hands and squeeze the triceps hard at the top.',
    fatigue: 'Last reps: the hips will sag toward the floor; squeeze the glutes or end the set.',
  },
  weighted_push_up: {
    setup: 'Have the plate placed high on your upper back, hands just wider than the shoulders.',
    form: 'Lower in one rigid line until the chest is a fist from the floor, then lock out.',
    efficiency: 'Spread the floor apart with your hands and press up fast on every rep.',
    fatigue: 'Last reps: the lower body will sag under the load; squeeze the glutes or stop.',
  },
  parallel_bar_dip: {
    setup: 'Grip the bars, lock the arms, and set the shoulders down away from your ears.',
    form: 'Lower with a slight forward lean until the upper arms are parallel to the floor.',
    efficiency: 'Drive up through the palms and squeeze the triceps hard at the top.',
    fatigue: 'Last reps: the shoulders will shrug up toward the ears; push them down or stop.',
  },
  assisted_dip_triceps: {
    setup: 'Pick an assist that allows clean reps, kneel on the pad, and lock out on the handles.',
    form: 'Lower with the elbows pointing straight back until they reach about 90 degrees.',
    efficiency: 'Drive up hard and pause at the top to keep the work in the triceps.',
    fatigue: 'Last reps: you will lean forward to cheat; keep the torso tall or end the set.',
  },
  seated_dip_machine: {
    setup: 'Set the seat so the handles start beside your ribs, and press your back to the pad.',
    form: 'Push the handles down to full arm lockout, keeping elbows tucked by your sides.',
    efficiency: 'Squeeze the triceps hard at the bottom, then let the handles rise slowly.',
    fatigue: 'Last reps: the shoulders will roll forward; keep the chest up or stop the set.',
  },
  bench_dip: {
    setup: 'Place hands on the bench edge by your hips, fingers forward, legs out in front.',
    form: 'Lower by bending the elbows straight back to about 90 degrees, hips close to the bench.',
    efficiency: 'Press up through the heels of the hands and lock the arms out fully each rep.',
    fatigue: 'Last reps: shoulders will roll forward at the bottom; cut the depth or stop.',
  },
  barbell_overhead_press: {
    setup: 'Grip just outside the shoulders, bar on the front delts, glutes and abs squeezed tight.',
    form: 'Press straight up, move your head back to clear the bar, then push it through at lockout.',
    efficiency: 'Drive the bar fast off the shoulders and finish with the biceps by the ears.',
    fatigue: 'Last reps: the bar will drift forward away from you; keep it over mid foot or rack it.',
  },
  db_shoulder_press: {
    setup: 'Set the bench upright, plant your feet, and start the dumbbells at ear height.',
    form: 'Press up and slightly in until the arms are straight, forearms vertical the whole way.',
    efficiency: 'Lower slowly to a full stretch, then drive up fast without bouncing at the bottom.',
    fatigue: 'Last reps: your back will peel off the pad; keep it pinned or end the set.',
  },
  machine_shoulder_press: {
    setup: 'Set the seat so the handles start at shoulder height, back flat against the pad.',
    form: 'Press to a full lockout, then lower until the hands are level with your chin.',
    efficiency: 'Push through the palms, smooth and fast up, and take two seconds on the way down.',
    fatigue: 'Last reps: the reps will get short at the bottom; keep full depth or stop.',
  },
  smith_shoulder_press: {
    setup: 'Set the bench under the bar so it lowers just in front of your face, grip shoulder width.',
    form: 'Lower the bar to chin level, then press up to full lockout over the shoulders.',
    efficiency: 'Drive up fast, then take a slow two-count lower while keeping your back pressed into the pad.',
    fatigue: 'Last reps: the hips will lift off the seat; stay seated or rack the bar.',
  },
  arnold_press: {
    setup: 'Sit tall with the dumbbells at chin height, palms facing you, elbows in front.',
    form: 'Rotate the palms outward as you press, finishing overhead with palms forward.',
    efficiency: 'Make the rotation smooth and continuous; reverse it slowly on the way down.',
    fatigue: 'Last reps: the twist will get rushed and short; finish each turn or stop.',
  },
  curl_to_arnold_press: {
    setup: 'Stand tall with dumbbells at your sides, palms forward, and your feet hip width.',
    form: 'Curl with the elbows pinned, then rotate the palms out and press overhead.',
    efficiency: 'Treat it as two clean moves; let the curl finish fully before the press starts.',
    fatigue: 'Last reps: you\'ll lean back and arch to push the weight up; stay stacked over your hips or stop.',
  },
  push_press: {
    setup: 'Bar on the front delts with a full grip, feet hip width, weight in the mid foot.',
    form: 'Dip straight down a few inches, then drive up and press the bar to lockout.',
    efficiency: 'Keep the dip short and fast, and only start pressing once the bar leaves your shoulders.',
    fatigue: 'Last reps: the dip gets sloppy and you start pressing it out; end the set when leg drive fades.',
  },
  db_push_press: {
    setup: 'Hold the dumbbells on the shoulders, palms facing in, feet set hip width.',
    form: 'Dip a few inches with an upright torso, then drive the dumbbells to lockout.',
    efficiency: 'Snap the knees and hips fast so the dumbbells fly up off the shoulders.',
    fatigue: 'Last reps: the dumbbells will drift forward as leg drive fades; end the set when that happens.',
  },
  landmine_press_single_arm: {
    setup: 'Stand staggered, hold the bar end at your shoulder, and lean slightly into it.',
    form: 'Press up and forward along the arc of the bar until your arm is fully straight.',
    efficiency: 'Reach long at the top to let the shoulder blade glide around your ribs.',
    fatigue: 'Last reps: the torso will twist to help; keep the hips square or end the set.',
  },
  half_kneeling_landmine_press: {
    setup: 'Kneel with the same side knee down as the pressing arm, front shin vertical.',
    form: 'Press the bar up and out to a full reach, keeping the wrist stacked over the elbow.',
    efficiency: 'Squeeze the glute of the down leg hard; it gives every press a stable base.',
    fatigue: 'Last reps: the torso will lean away to finish; stay tall or stop the set.',
  },
  landmine_push_press: {
    setup: 'Stand square with the bar end at your shoulder, knees soft, weight mid foot.',
    form: 'Dip a few inches, then extend the legs and punch the bar up and out to lockout.',
    efficiency: 'Time the arm to finish as the knees straighten for one fast, smooth push.',
    fatigue: 'Last reps: the bar will slow and your arm takes over; end the set when the legs stop launching it.',
  },
  landmine_squat_to_press: {
    setup: 'Hold the bar end at chest height with both hands, feet a bit wider than the hips.',
    form: 'Squat until the thighs are parallel, then stand and press the bar up and forward.',
    efficiency: 'Use the drive from standing to carry the bar into the press without a pause.',
    fatigue: 'Last reps: the squat will get shallow; keep full depth or end the set.',
  },
  z_press: {
    setup: 'Sit tall on the floor, legs straight and spread, dumbbells resting at the shoulders.',
    form: 'Press straight up until the arms lock, keeping your ribs down and head neutral.',
    efficiency: 'Lower slow to the shoulders; the seated position makes the delts do all the work.',
    fatigue: 'Last reps: you will lean back to finish; stay tall over your hips or stop.',
  },
  plate_front_raise: {
    setup: 'Hold the plate at 3 and 9 o\'clock, arms nearly straight, standing tall.',
    form: 'Raise the plate to eye level in a smooth arc, then lower it back to the thighs.',
    efficiency: 'Pause for one second at the top and squeeze the front delts before lowering.',
    fatigue: 'Last reps: you will swing with the hips; stay still or stop the set.',
  },
  cable_front_raise: {
    setup: 'Set the cable low, face away with the handle between your legs, feet planted.',
    form: 'Raise the arm straight forward to shoulder height with only a slight elbow bend.',
    efficiency: 'Pull smoothly and lower over three seconds; the cable keeps tension on the delt.',
    fatigue: 'Last reps: the torso will lean back to lift; stay upright or end the set.',
  },
  db_lateral_raise: {
    setup: 'Stand tall with a slight forward lean, dumbbells at your sides, elbows soft.',
    form: 'Raise the arms out to shoulder height, leading with the elbows, pinkies level.',
    efficiency: 'Think of pushing the weights out wide, not up; take two seconds on the way down.',
    fatigue: 'Last reps: the traps will shrug to help; keep the neck long or stop the set.',
  },
  cable_lateral_raise: {
    setup: 'Set the cable at hand height, stand side on, and hold the handle across your body.',
    form: 'Raise the arm out to shoulder height in a wide arc, keeping the elbow soft.',
    efficiency: 'Think of pushing the hand out wide, and pause briefly at the top before a slow return.',
    fatigue: 'Last reps: the torso will tilt away to finish; stay upright or end the set.',
  },
  lean_away_cable_lateral_raise: {
    setup: 'Hold the upright with your free hand, feet near the base, and lean away to arm\'s length.',
    form: 'Raise the working arm out to shoulder height while your body stays fixed.',
    efficiency: 'Lower slowly until the hand crosses your body, then lift straight out of that stretch without a rest.',
    fatigue: 'Last reps: you will pull with the support hand; hold the lean fixed or stop.',
  },
  machine_lateral_raise: {
    setup: 'Set the seat so your shoulders line up with the pivot, pads against your forearms.',
    form: 'Drive the pads out and up to shoulder height, then lower them under control.',
    efficiency: 'Lead with the elbows and hold the top position for one second.',
    fatigue: 'Last reps: the traps will shrug up; keep the neck long or end the set.',
  },
  lu_raise: {
    setup: 'Stand tall with light dumbbells at your sides, palms forward, thumbs pointing up.',
    form: 'Raise the arms out to the side and keep going until they meet overhead.',
    efficiency: 'Move slowly through the whole arc and keep the thumbs pointing up.',
    fatigue: 'Last reps: your traps will hike to finish overhead; stop the arc at shoulder height then.',
  },
  cable_pressdown: {
    setup: 'Set the pulley high, grip the bar shoulder width, and pin your elbows to your sides.',
    form: 'Push the bar down until the arms lock straight, then let it rise to chest height.',
    efficiency: 'Squeeze the triceps hard at the bottom for a beat before the slow return.',
    fatigue: 'Last reps: you will lean over the bar to push it; stand tall or stop.',
  },
  rope_pressdown: {
    setup: 'Set the pulley high, grab the rope with thumbs up, and tuck your elbows at your sides.',
    form: 'Push down and spread the rope ends apart at the bottom until the arms lock.',
    efficiency: 'Hold the lockout for one count, then let the rope rise slowly back to chest height.',
    fatigue: 'Last reps: your torso will lean in to push; stay tall or end the set.',
  },
  overhead_cable_extension: {
    setup: 'Face away from a low pulley, rope behind your head, staggered stance, slight lean.',
    form: 'Extend the arms fully overhead, keeping the elbows pointed forward by your ears.',
    efficiency: 'Sink into a deep stretch behind the head before every rep; that is the payoff.',
    fatigue: 'Last reps: the lower back will arch to push; keep the ribs down or end the set.',
  },
  cross_body_cable_triceps_extension: {
    setup: 'Set the cable at shoulder height, stand side on, and grab it with the far hand.',
    form: 'Extend the arm out across your body until the elbow locks straight.',
    efficiency: 'Keep the upper arm still in space and squeeze hard at the end of each rep.',
    fatigue: 'Last reps: the shoulder will rotate to help; keep it quiet or end the set.',
  },
  single_arm_cable_triceps_extension: {
    setup: 'Set the pulley high, grab the handle with one hand, and pin that elbow to your side.',
    form: 'Extend the forearm down until the arm locks, then return to just past 90 degrees.',
    efficiency: 'Hold the lockout for a beat, then take two seconds back up to keep tension on the triceps.',
    fatigue: 'Last reps: the shoulder will roll forward to help; keep it back or stop.',
  },
  cable_triceps_kickback: {
    setup: 'Set the pulley low, hinge forward, and hold your upper arm parallel to the floor.',
    form: 'Extend the forearm back until the arm locks straight in line with your body.',
    efficiency: 'Hold the finish for a second and squeeze the triceps before returning.',
    fatigue: 'Last reps: your upper arm will drop and swing; keep it parallel to the floor or end the set.',
  },
  db_overhead_extension: {
    setup: 'Sit tall and hold one dumbbell overhead with both hands cupping the top plate.',
    form: 'Lower it behind your head until the forearms pass parallel, then extend fully.',
    efficiency: 'Pause in the bottom stretch, then drive up with only the elbows moving.',
    fatigue: 'Last reps: the lower back will arch; squeeze the abs tight or stop the set.',
  },
  db_skull_crusher: {
    setup: 'Lie flat, press the dumbbells over your shoulders, and keep palms facing in.',
    form: 'Bend only at the elbows and lower the weights beside your head, then extend.',
    efficiency: 'Angle the upper arms slightly back to keep tension on the triceps at the top.',
    fatigue: 'Last reps: the dumbbells will drift toward your face; keep the path or stop.',
  },
  ez_skull_crusher: {
    setup: 'Lie flat, grip the EZ bar on the inner angles, and press it over your shoulders.',
    form: 'Lower the bar toward your forehead by bending only the elbows, then extend.',
    efficiency: 'Let the bar travel slightly behind your head for a bigger stretch each rep.',
    fatigue: 'Last reps: it will turn into a press; keep only the forearms moving or end the set.',
  },
  jm_press: {
    setup: 'Lie flat with a close grip just inside the shoulders and the bar over your chest.',
    form: 'Lower the bar toward your chin with the elbows tucked and pointing at your feet.',
    efficiency: 'Pause briefly when your forearms meet your biceps, then press back up without bouncing.',
    fatigue: 'Last reps: the bar path will drift toward your sternum; hold the line or rack it.',
  },
  machine_triceps_extension: {
    setup: 'Set the seat so your elbows line up with the machine\'s pivot, arms on the pad.',
    form: 'Extend until the arms lock straight, then return slowly to a full bend.',
    efficiency: 'Squeeze hard at the finish and take three seconds on the way back.',
    fatigue: 'Last reps: the shoulders will roll forward to push; stay back or stop.',
  },
  barbell_curl: {
    setup: 'Stand tall, grip the bar shoulder width with palms up, and arms straight down.',
    form: 'Curl the bar up to your upper chest with elbows fixed at your sides.',
    efficiency: 'Squeeze the biceps at the top and lower over two to three seconds.',
    fatigue: 'Last reps: the hips will swing to start the bar; stay still or end the set.',
  },
  ez_bar_curl: {
    setup: 'Stand tall and grip the EZ bar on the angled section, arms hanging long.',
    form: 'Curl up until the forearms are vertical, keeping elbows fixed by your ribs.',
    efficiency: 'Drive the pinkies up hard at the top to get a stronger biceps squeeze.',
    fatigue: 'Last reps: the hips will swing to start the bar; stay still or stop the set.',
  },
  ez_preacher_curl: {
    setup: 'Set the seat so your armpits sit snug at the top edge, upper arms flat and parallel.',
    form: 'Curl the bar up to about chin height, then lower until the arms are nearly straight.',
    efficiency: 'Own the bottom stretch; slow down there and never let the bar drop.',
    fatigue: 'Last reps: the shoulders will lift off the pad to cheat; stay down or end the set.',
  },
  machine_preacher_curl: {
    setup: 'Set the seat so your upper arms lie flat on the pad and armpits sit at the top edge.',
    form: 'Curl the handles up to a full squeeze, then lower until the elbows almost lock.',
    efficiency: 'Pause at the top for one second and take three seconds on the way down.',
    fatigue: 'Last reps: the reps will cut short at the bottom; keep full range or stop.',
  },
  spider_curl: {
    setup: 'Lie chest down on an incline bench with your arms hanging straight below.',
    form: 'Curl the dumbbells up with the upper arms vertical, then lower to full extension.',
    efficiency: 'Squeeze for one count at the top and lower for three seconds to keep the biceps loaded.',
    fatigue: 'Last reps: the elbows will swing forward to finish; keep them still or stop.',
  },
  incline_db_curl: {
    setup: 'Set the bench at about 60 degrees, sit back, and let your arms hang behind you.',
    form: 'Curl without letting the elbows move forward, then lower to a full stretch.',
    efficiency: 'Curl with the pinkies twisting up at the top for a full biceps squeeze.',
    fatigue: 'Last reps: your head and shoulders will lift off the pad; stay back or stop.',
  },
  bayesian_cable_curl: {
    setup: 'Set the pulley low, face away, and step forward until the arm sits behind you.',
    form: 'Curl from the deep stretch with the elbow kept back behind your torso.',
    efficiency: 'Lower slowly and squeeze hard at the top; this angle works the long head.',
    fatigue: 'Last reps: the reps will get short at the bottom; keep the full stretch or end the set.',
  },
  cable_curl: {
    setup: 'Set the pulley low, grip the bar shoulder width, and step back to load the cable.',
    form: 'Curl up to your chest with elbows fixed at your sides, then lower to full length.',
    efficiency: 'Squeeze at the top and fight the cable\'s pull all the way down.',
    fatigue: 'Last reps: you will lean away from the cable; stay upright or end the set.',
  },
  high_cable_curl: {
    setup: 'Set both pulleys just above head height and stand centered between them.',
    form: 'Keep elbows pinned at shoulder height and curl the handles toward your ears.',
    efficiency: 'Hold the peak squeeze for one second, then let the cable pull your forearms out slowly.',
    fatigue: 'Last reps: the elbows will start dropping toward your ribs; keep them high or end the set.',
  },
  hammer_curl: {
    setup: 'Stand tall with dumbbells at your sides, palms facing your thighs.',
    form: 'Curl with thumbs leading up until the dumbbell reaches the front of your shoulder.',
    efficiency: 'Squeeze the handle hard and take three seconds on the way down to load the forearm.',
    fatigue: 'Last reps: your torso will start rocking the weight up; stay still or stop the set.',
  },
  db_alternating_curl: {
    setup: 'Stand tall, dumbbells hanging at your sides with palms facing forward.',
    form: 'Curl one arm at a time, elbow fixed at your side, until the forearm is vertical.',
    efficiency: 'Squeeze the biceps hard at the top of each rep before switching to the other arm.',
    fatigue: 'Last reps: the shoulder will roll forward to help; keep it back, or end the set.',
  },
  zottman_curl: {
    setup: 'Stand tall with dumbbells at your sides, palms facing forward, elbows by your ribs.',
    form: 'Curl up palms up, rotate to palms down at the top, then lower in that overhand grip.',
    efficiency: 'Take three full seconds on the overhand lowering; that is where the forearms grow.',
    fatigue: 'Last reps: the wrists will start bending back on the way down; keep them straight or stop.',
  },
  ez_reverse_curl: {
    setup: 'Grab the EZ bar overhand at shoulder width and let it hang at your thighs.',
    form: 'Curl up with knuckles leading until the bar reaches chest height, elbows pinned.',
    efficiency: 'Squeeze the bar hard and pause at the top, then lower for three seconds to load the forearms.',
    fatigue: 'Last reps: your wrists will curl down and the bar sags; keep them flat or end the set.',
  },
  barbell_back_squat: {
    setup: 'Set the bar on your upper traps, feet shoulder width, toes out slightly, big breath held.',
    form: 'Sit down between your heels until hips pass the knees, knees tracking over the toes.',
    efficiency: 'Drive the floor away through your midfoot and push your back into the bar out of the hole.',
    fatigue: 'Last reps: the hips will want to shoot up first; keep the chest rising with them, or rack it.',
  },
  front_squat: {
    setup: 'Rest the bar on your front delts with fingertips under it and elbows up high.',
    form: 'Sit straight down with a tall torso until your hips drop below the knees.',
    efficiency: 'Drive up by pushing your knees out over the toes and lead the ascent with your chest.',
    fatigue: 'Last reps: the elbows will drop and the bar rolls forward; lift them up or rack it.',
  },
  zercher_squat: {
    setup: 'Cradle the bar in the crook of your elbows, hands clasped, feet just past shoulder width.',
    form: 'Sit down with a tall chest until the elbows nearly touch your knees, then stand.',
    efficiency: 'Squeeze the bar into your body and push the floor away evenly through both feet.',
    fatigue: 'Last reps: your upper back will round over the bar; stay tall or set it down.',
  },
  goblet_squat: {
    setup: 'Hold one dumbbell vertically against your chest, feet shoulder width, toes out.',
    form: 'Sit between your heels until elbows brush the inner knees, chest staying tall.',
    efficiency: 'Pause for a second at the bottom, then drive up through your whole foot.',
    fatigue: 'Last reps: the weight will drift away from your chest; keep it tucked in or stop the set.',
  },
  hack_squat: {
    setup: 'Set your shoulders under the pads and place feet shoulder width in the middle of the platform.',
    form: 'Lower until your thighs pass parallel, knees tracking in line with your toes.',
    efficiency: 'Push the platform away through your midfoot and keep constant tension short of lockout.',
    fatigue: 'Last reps: your heels will want to lift; keep the whole foot planted or end the set.',
  },
  leg_press: {
    setup: 'Sit with your back flat on the pad and feet shoulder width mid-platform.',
    form: 'Lower the sled until knees reach about 90 degrees, then press without locking out.',
    efficiency: 'Take two seconds down and drive up hard through your heels and midfoot.',
    fatigue: 'Last reps: your hips will peel off the seat at the bottom; shorten the depth or stop.',
  },
  single_leg_leg_press: {
    setup: 'Place one foot in the middle of the platform and rest the other on the floor or frame.',
    form: 'Lower until that knee reaches about 90 degrees, tracking straight over the toes.',
    efficiency: 'Drive through the heel of the working foot and keep the hips square on the seat.',
    fatigue: 'Last reps: the knee will start caving inward; push it out over the toes or end the set.',
  },
  pendulum_squat: {
    setup: 'Set your back flat against the pad, shoulders under the yokes, feet slightly forward.',
    form: 'Sink deep along the arc until hamstrings meet calves, knees traveling over the toes.',
    efficiency: 'Pause briefly in the bottom stretch, then drive up hard through your whole foot.',
    fatigue: 'Last reps: depth will start shrinking; hold full range or rack it and end the set.',
  },
  pit_shark_belt_squat: {
    setup: 'Fasten the belt snug on your hips and stand tall before releasing the handles.',
    form: 'Sit straight down with a vertical torso as deep as your hips allow, then stand.',
    efficiency: 'Drive up through your midfoot and squeeze the glutes hard at the top of each rep.',
    fatigue: 'Last reps: you will start pulling on the handles; let go of the help or end the set.',
  },
  smith_squat: {
    setup: 'Set the bar on your upper traps and place feet slightly in front of the bar line.',
    form: 'Lower until your hips drop to knee height, knees tracking over the toes.',
    efficiency: 'Drive the bar up by pushing the floor away through your midfoot at a steady pace.',
    fatigue: 'Last reps: your lower back will start to round at the bottom; cut depth or stop.',
  },
  speed_box_squat: {
    setup: 'Load about half your max and set a box so your thighs hit parallel when seated.',
    form: 'Sit back to the box under control, pause briefly, then stand up in one fast motion.',
    efficiency: 'Move the bar as fast as possible on every rep; reset your breath between reps.',
    fatigue: 'Last reps: bar speed will drop first; end the set the moment a rep looks slower than the first.',
  },
  sissy_squat: {
    setup: 'Hold a support with one hand, rise onto the balls of your feet, feet hip width.',
    form: 'Drive your knees forward and lean back so hips, shoulders, and knees stay in one line.',
    efficiency: 'Lower slowly to feel the quads stretch, then push the knees back to stand.',
    fatigue: 'Last reps: your hips will fold and you\'ll sit back; stop when the knee-to-shoulder line breaks.',
  },
  heel_elevated_db_squat: {
    setup: 'Stand with heels on a plate or wedge, dumbbells at your sides, feet hip width.',
    form: 'Sit straight down with an upright torso, knees traveling well past the toes.',
    efficiency: 'Lower over three seconds and feel the quads take the load on the way up.',
    fatigue: 'Last reps: your weight will drift onto the toes; keep pressure through the midfoot or stop.',
  },
  air_squat: {
    setup: 'Stand with feet shoulder width, toes slightly out, arms ready to reach forward.',
    form: 'Sit hips down and back until thighs pass parallel, knees tracking over the toes.',
    efficiency: 'Reach your arms forward as you lower and squeeze the glutes to stand all the way up.',
    fatigue: 'Last reps: your depth will get shallow; hit the same depth every rep or end the set.',
  },
  banded_squat_jump: {
    setup: 'Stand on the band or place it above your knees, feet shoulder width apart.',
    form: 'Dip to a quarter squat, then jump straight up and land softly through bent knees.',
    efficiency: 'Jump as high as possible on each rep and reset your stance before the next one.',
    fatigue: 'Last reps: jump height will drop and landings get loud; end the set when either happens.',
  },
  jump_squat: {
    setup: 'Stand with feet shoulder width, arms at your sides ready to swing.',
    form: 'Dip to a quarter squat and jump straight up, landing softly on the balls of your feet.',
    efficiency: 'Swing your arms up hard as you leave the ground to add height to every jump.',
    fatigue: 'Last reps: height will drop and your knees will cave on landing; end the set when either shows up.',
  },
  db_jump_squat: {
    setup: 'Hold light dumbbells at your sides, feet shoulder width apart, chest tall.',
    form: 'Dip to a quarter squat and jump straight up, keeping the weights still at your sides.',
    efficiency: 'Explode off the floor as fast as possible and stick each landing before the next rep.',
    fatigue: 'Last reps: landings will get heavy and noisy; end the set when your jump height drops.',
  },
  bulgarian_split_squat: {
    setup: 'Rest your rear laces on a bench and place the front foot about two feet ahead.',
    form: 'Drop the back knee straight toward the floor until the front thigh is parallel.',
    efficiency: 'Drive up through the front heel and keep your weight on the front leg throughout.',
    fatigue: 'Last reps: the front knee will start caving inward; push it out over the toes or stop.',
  },
  rfe_split_squat_jump: {
    setup: 'Rest your rear foot on a bench and set the front foot far enough forward to drop deep.',
    form: 'Lower under control, then jump up off the front leg and land soft in the same spot.',
    efficiency: 'Drive up fast from the bottom and use your arms to add height to each jump.',
    fatigue: 'Last reps: jump height will drop and landings will wobble; end the set when either happens.',
  },
  front_foot_elevated_split_squat: {
    setup: 'Place the front foot on a small plate or step, back foot on the floor, dumbbells at sides.',
    form: 'Lower the back knee until it nearly touches the floor, front knee over the toes.',
    efficiency: 'Sink into the deep stretch at the bottom, then press up through the front heel.',
    fatigue: 'Last reps: your torso will tip forward; stay upright or end the set.',
  },
  walking_lunge: {
    setup: 'Stand tall with dumbbells at your sides and space to walk 10 or more steps.',
    form: 'Step forward and lower until both knees reach about 90 degrees, back knee near the floor.',
    efficiency: 'Push through the front heel to drive straight into the next step without pausing.',
    fatigue: 'Last reps: your steps will shorten; keep each stride long or end the set.',
  },
  reverse_lunge: {
    setup: 'Stand tall with feet hip width and dumbbells hanging at your sides.',
    form: 'Step back and lower the back knee toward the floor, front shin near vertical.',
    efficiency: 'Lower for a two count and drive up fast; a slight forward lean puts more glute into it.',
    fatigue: 'Last reps: you will start pushing off the back foot; stay on the front heel or stop.',
  },
  reverse_lunge_knee_drive_hop: {
    setup: 'Stand tall with feet hip width, arms ready to drive like a sprinter.',
    form: 'Step back into a lunge, then drive that back knee up and hop off the front foot.',
    efficiency: 'Punch the opposite arm up with the knee drive to get the most height on each hop.',
    fatigue: 'Last reps: hops will get low and the front foot landing will wobble; end the set then.',
  },
  reverse_lunge_to_press: {
    setup: 'Hold dumbbells at shoulder height, palms facing in, feet hip width apart.',
    form: 'Step back into a lunge, return to standing, then press both dumbbells overhead.',
    efficiency: 'Use the drive out of the lunge to carry the dumbbells up, and exhale as you press.',
    fatigue: 'Last reps: the lower back will arch on the press; squeeze the glutes or stop the set.',
  },
  curtsy_lunge: {
    setup: 'Stand tall with dumbbells at your sides and feet hip width apart.',
    form: 'Step one foot behind and across the other, lowering until the front thigh is parallel.',
    efficiency: 'Keep your hips square forward and drive up through the front heel to feel the glute.',
    fatigue: 'Last reps: the front knee will cave inward; keep it over the toes or end the set.',
  },
  lateral_lunge: {
    setup: 'Stand with feet together holding a dumbbell at your chest or both at your sides.',
    form: 'Step wide to the side and sit the hips back over that heel, the other leg straight.',
    efficiency: 'Push hard off the bent leg\'s heel to snap back to the start in one move.',
    fatigue: 'Last reps: your chest will collapse toward the floor; keep it up or end the set.',
  },
  lateral_step_up: {
    setup: 'Stand beside a box with dumbbells at your sides and the near foot on top.',
    form: 'Push up through the box leg until it is straight, hips level, knee over the toes.',
    efficiency: 'Lean slightly over the box leg and take three seconds to lower so the glute and quad do the work.',
    fatigue: 'Last reps: you will start pushing off the floor foot; keep it light or stop the set.',
  },
  db_step_up: {
    setup: 'Face a knee-height box with dumbbells at your sides and one full foot planted on top.',
    form: 'Drive up until the box leg is straight, then lower the same leg back down slowly.',
    efficiency: 'Lean slightly forward and push through the top heel to finish with a glute squeeze.',
    fatigue: 'Last reps: you will start bouncing off the floor leg; keep it passive or end the set.',
  },
  bw_step_up: {
    setup: 'Face a box at knee height and place one full foot on top, hands at your sides.',
    form: 'Stand up on the box leg until it is straight, then step down under control.',
    efficiency: 'Drive through the top heel and finish tall with the glute squeezed at the top.',
    fatigue: 'Last reps: your knee will drift inward on the push; track it over the toes or stop.',
  },
  box_step_up_glute: {
    setup: 'Use a box above knee height and plant one full foot on top, dumbbells at your sides.',
    form: 'Lean your torso forward and stand up until the hip fully extends at the top.',
    efficiency: 'Push through the heel on top and squeeze the glute hard for a beat at the top.',
    fatigue: 'Last reps: you will start springing off the floor foot; keep it passive or end the set.',
  },
  step_up_pop: {
    setup: 'Face a box about knee height and place your whole foot flat on top.',
    form: 'Drive through the box foot and pop off the top, then land softly on that same foot.',
    efficiency: 'Drive the free knee up hard and swing your arms to get maximum pop each rep.',
    fatigue: 'Last reps: the pop will shrink and landings will get sloppy; end the set when either happens.',
  },
  db_step_up_pop: {
    setup: 'Hold light dumbbells at your sides and place your whole foot flat on the box.',
    form: 'Drive up through the box leg and pop off the top, landing back on that foot softly.',
    efficiency: 'Explode up as fast as possible and keep the dumbbells quiet against your sides.',
    fatigue: 'Last reps: the pop will shrink and your landing balance will slip; end the set at that point.',
  },
  leg_extension: {
    setup: 'Line your knees up with the machine pivot and set the pad on your lower shins.',
    form: 'Extend fully until your legs are straight, then lower until knees reach 90 degrees.',
    efficiency: 'Pause for a full second at the top and squeeze your quads before lowering slowly.',
    fatigue: 'Last reps: your hips will lift off the seat; grip the handles and stay seated or stop.',
  },
  seated_leg_curl: {
    setup: 'Line your knees with the pivot, pad above the heels, and lock the thigh pad down tight.',
    form: 'Curl your heels down and back as far as possible, then let them return slowly.',
    efficiency: 'Pull your toes up toward the shins and squeeze the hamstrings hard at the bottom.',
    fatigue: 'Last reps: your hips will slide forward on the seat; stay back or end the set.',
  },
  lying_leg_curl: {
    setup: 'Lie face down, knees just off the bench edge, pad just above your heels.',
    form: 'Curl your heels toward your glutes, then lower until the legs are nearly straight.',
    efficiency: 'Hold the squeeze for a second at the top and take three seconds to lower.',
    fatigue: 'Last reps: your hips will rise off the pad; press them down or end the set.',
  },
  single_leg_leg_curl: {
    setup: 'Lie face down with knees just off the pad and the roller above one heel.',
    form: 'Curl that heel toward your glute through a full range, then lower nearly straight.',
    efficiency: 'Lead with the heel and pause at the top to feel the hamstring fully shorten.',
    fatigue: 'Last reps: the hip on the working side will lift; press it into the pad or stop.',
  },
  standing_single_leg_curl: {
    setup: 'Stand facing the machine with the pad behind one ankle and hold the handles.',
    form: 'Curl your heel up toward your glute while the thigh stays pointed straight down.',
    efficiency: 'Squeeze for a beat at the top and lower over two to three seconds.',
    fatigue: 'Last reps: the knee will swing forward to cheat; keep it pinned or end the set.',
  },
  slider_hamstring_curl: {
    setup: 'Lie on your back with heels on sliders, knees bent, and hips lifted into a bridge.',
    form: 'Slide your heels out until legs are nearly straight, then pull them back under you.',
    efficiency: 'Take three seconds to slide out, then pull back in with a firm heel drag into the floor.',
    fatigue: 'Last reps: your hips will sag to the floor; keep them up or end the set.',
  },
  nordic_curl: {
    setup: 'Kneel on a pad with your ankles anchored under a bar or held by a partner.',
    form: 'Lower your body forward slowly from the knees, keeping hips straight with your torso.',
    efficiency: 'Fight the fall as long as possible, then catch yourself and pull back up with the hamstrings.',
    fatigue: 'Last reps: your hips will bend to shorten the lever; end the set when they do.',
  },
  reverse_nordic: {
    setup: 'Kneel with knees hip width on a pad, toes flat behind you, torso tall.',
    form: 'Lean back from the knees as far as you can control, then pull yourself back up.',
    efficiency: 'Lean back slowly over three seconds, then exhale as the quads pull you back upright.',
    fatigue: 'Last reps: the hips will start folding back; shorten the range or end the set.',
  },
  roman_chair_ghd_raise: {
    setup: 'Set your knees just behind the pad and lock your feet firmly against the footplate.',
    form: 'Lower your torso until parallel, then curl up by bending the knees until upright.',
    efficiency: 'Drive your toes into the plate and pull with the hamstrings to finish the raise.',
    fatigue: 'Last reps: the hips will bend to help; keep them straight or end the set.',
  },
  back_extension_45: {
    setup: 'Set the pad just below your hip crease so you can hinge freely, feet locked in.',
    form: 'Lower your torso toward the floor, then rise until your body forms one straight line.',
    efficiency: 'Lower for two seconds and drive up by squeezing the glutes, as if pushing your hips into the pad.',
    fatigue: 'Last reps: you will start hyperextending at the top; stop at a straight line or end it.',
  },
  good_morning: {
    setup: 'Set the bar on your upper traps, feet hip width, and unlock your knees slightly.',
    form: 'Push your hips back until your torso is nearly parallel, keeping a flat back.',
    efficiency: 'Drive your hips forward to stand and feel the hamstrings load on the way down.',
    fatigue: 'Last reps: your back will start to round; cut the range or end the set.',
  },
  conventional_deadlift: {
    setup: 'Stand with the bar over midfoot, feet hip width, and grip just outside your legs.',
    form: 'Push the floor away and keep the bar in contact with your legs until you stand tall.',
    efficiency: 'Pull the slack out of the bar before it leaves the floor, then drive hard through the legs.',
    fatigue: 'Last reps: your back will round as hips rise; keep the chest up or put the bar down.',
  },
  sumo_deadlift: {
    setup: 'Take a wide stance, toes out, shins near the bar, and grip inside your knees.',
    form: 'Push your knees out over the toes and drive the hips toward the bar to stand tall.',
    efficiency: 'Pull the slack out and wedge your hips to the bar, then push the floor away rather than yanking.',
    fatigue: 'Last reps: your hips will rise before the bar moves; keep them low or end the set.',
  },
  trap_bar_deadlift: {
    setup: 'Stand centered in the trap bar with feet hip width and handles at your sides.',
    form: 'Sit your hips down, then stand up tall in one smooth push with arms long.',
    efficiency: 'Drive through your whole foot and squeeze the glutes hard at lockout.',
    fatigue: 'Last reps: your back will start to round off the floor; reset each rep or stop.',
  },
  speed_trap_bar_deadlift: {
    setup: 'Stand centered in the trap bar, hands mid-handle, shins vertical and hips above knees.',
    form: 'Drive the floor away and finish tall with glutes squeezed, then lower the bar under control.',
    efficiency: 'Use a light load and make every rep explosive; reset your brace on the floor between reps.',
    fatigue: 'Last reps: bar speed will slow first; end the set the moment a rep is slower than the rest.',
  },
  trap_bar_jump: {
    setup: 'Load the trap bar light, grab the handles, and set feet hip width with a slight knee bend.',
    form: 'Dip quickly, then jump straight up through the whole foot, keeping the arms long.',
    efficiency: 'Think about pushing the ground away as fast as possible; reset fully before each jump.',
    fatigue: 'Last reps: jump height will drop and landings get loud and stiff; stop the set when they do.',
  },
  rack_pull: {
    setup: 'Set the pins just below the knees, bar over midfoot, and pull the slack out of the bar.',
    form: 'Drive the hips forward until you stand tall, bar dragging up the thighs the whole way.',
    efficiency: 'Squeeze the bar hard and pull the shoulders down before it leaves the pins.',
    fatigue: 'Last reps: the upper back will want to round; stay proud through the chest or rack it.',
  },
  kettlebell_deadlift: {
    setup: 'Stand with the bell between your feet, in line with the ankles, feet hip width apart.',
    form: 'Hinge back until the hands reach the handle, then stand by driving the hips through.',
    efficiency: 'Pull the handle like you want to snap it, locking the lats before the bell leaves the floor.',
    fatigue: 'Last reps: your knees will start doing all the work; keep pushing your hips back toward the wall.',
  },
  barbell_rdl: {
    setup: 'Start standing with the bar at the hips, hands just outside the legs, knees softly bent.',
    form: 'Push the hips back and slide the bar down the thighs until you feel a deep hamstring stretch.',
    efficiency: 'Lower for a slow three count, then drive the hips forward hard to stand back up.',
    fatigue: 'Last reps: your low back will round to find depth; stop each rep where the stretch ends.',
  },
  db_rdl: {
    setup: 'Hold the dumbbells at your thighs, feet hip width, knees unlocked but not bent much.',
    form: 'Push the hips back and let the bells trace the front of the legs to about mid-shin.',
    efficiency: 'Pause briefly in the stretch, then squeeze the glutes to snap the hips forward.',
    fatigue: 'Last reps: the bells drift forward from the legs; pull them back in tight or end the set.',
  },
  kickstand_db_rdl: {
    setup: 'Set the back toe beside the front heel; that kickstand foot is for balance only.',
    form: 'Hinge on the front leg, hips square, bells sliding down the shin until hamstring stretch.',
    efficiency: 'Lower for three seconds, then drive the front hip forward hard to stand tall.',
    fatigue: 'Last reps: your weight will shift onto the back toe; stay loaded on the front foot or stop.',
  },
  single_leg_rdl: {
    setup: 'Stand on one leg with a soft knee, dumbbell in the opposite hand, eyes on the floor ahead.',
    form: 'Tip forward as the free leg reaches back, keeping the hips level until a hamstring stretch.',
    efficiency: 'Move slowly and own the balance; reach the back heel long like it is pushing a wall.',
    fatigue: 'Last reps: the hip will open toward the ceiling; point the back toes down or end the set.',
  },
  kettlebell_swing: {
    setup: 'Set the bell a foot in front of you, feet a bit wider than hips, and hike it back high.',
    form: 'Snap the hips forward to float the bell to chest height, arms relaxed like ropes.',
    efficiency: 'Exhale sharply at the top and squeeze glutes and abs hard, like a standing plank.',
    fatigue: 'Last reps: the swing will lose height and turn into a squat; end the set when power drops.',
  },
  cable_pull_through: {
    setup: 'Set the cable at the bottom, face away holding the rope between your legs, step out two feet.',
    form: 'Hinge back until the hands pass between the knees, then drive the hips forward to stand.',
    efficiency: 'Squeeze the glutes hard for a one count at lockout; keep the arms passive like hooks.',
    fatigue: 'Last reps: you\'ll start squatting it down; keep the shins vertical and push the hips back.',
  },
  barbell_hip_thrust: {
    setup: 'Rest the shoulder blades on the bench edge, bar padded over the hip crease, feet flat.',
    form: 'Drive the hips up until the torso is level, shins vertical at the top, chin tucked.',
    efficiency: 'Pause one second at the top and squeeze the glutes as if pinching a coin.',
    fatigue: 'Last reps: your low back will arch to fake lockout; keep ribs down and stop when glutes can\'t finish.',
  },
  machine_hip_thrust: {
    setup: 'Set the pad across the hip crease, back on the support, feet flat about hip width apart.',
    form: 'Push through the heels to lift until the hips are level, then lower until they nearly touch.',
    efficiency: 'Hold the top for a full second; think about tilting the pelvis under as you squeeze.',
    fatigue: 'Last reps: your knees will cave in; press them out over your toes and finish with the glutes.',
  },
  smith_hip_thrust: {
    setup: 'Line the Smith bar over the hip crease with a pad, upper back on the bench, feet planted.',
    form: 'Lift the hips straight up the bar path until the torso is flat, shins vertical at the top.',
    efficiency: 'Squeeze the glutes for a beat at lockout, then lower slowly for a two count.',
    fatigue: 'Last reps: your ribs will flare and your back takes over; keep the chin tucked or rack it.',
  },
  db_hip_thrust: {
    setup: 'Sit with shoulders on the bench and hold one dumbbell flat across the hip crease.',
    form: 'Drive the hips up to a straight line from knees to shoulders, then lower under control.',
    efficiency: 'Push through the heels and hold the top a full second; slow reps make up for light weight.',
    fatigue: 'Last reps: your hips will stop short of lockout; get full extension every rep or end the set.',
  },
  b_stance_hip_thrust: {
    setup: 'Set the working foot flat under the knee and the other heel a step forward, toes up.',
    form: 'Drive up through the working heel to full hip extension, keeping the pelvis level.',
    efficiency: 'Pause one second at the top squeezing the working glute, then lower for two seconds.',
    fatigue: 'Last reps: the kickstand leg starts pushing; lighten that heel or finish the set there.',
  },
  barbell_glute_bridge: {
    setup: 'Lie on the floor with the bar padded over the hips, heels about a foot from your butt.',
    form: 'Press the hips up until thighs and torso form a line, then lower to a light floor touch.',
    efficiency: 'Squeeze and hold the top a beat; the short range lets you go heavy, so own each lockout.',
    fatigue: 'Last reps: your low back will arch for height; tuck the pelvis and stop when the glutes quit.',
  },
  glute_bridge: {
    setup: 'Lie on your back, knees bent, heels close enough to brush with your fingertips.',
    form: 'Lift the hips until knees, hips, and shoulders line up, then lower slowly to the floor.',
    efficiency: 'Pause two seconds at the top and squeeze the glutes as hard as you can each rep.',
    fatigue: 'Last reps: your hamstrings may start cramping; pull the heels closer and keep squeezing.',
  },
  single_leg_glute_bridge: {
    setup: 'Lie back with one foot planted near your butt, the other knee hugged or leg held straight.',
    form: 'Push through the planted heel to lift the hips level, then lower with the pelvis square.',
    efficiency: 'Pause one second at the top, then lower over two seconds without resting on the floor.',
    fatigue: 'Last reps: the free side hip drops; keep both hip bones level or stop the set.',
  },
  frog_pump: {
    setup: 'Lie back with the soles of the feet together, knees out wide, dumbbell held on the hips.',
    form: 'Pump the hips up in a short range, squeezing the glutes hard at the top of every rep.',
    efficiency: 'Use a quick, steady rhythm and tilt the pelvis under at the top to max out the squeeze.',
    fatigue: 'Last reps: your knees will drift together; push them wide and keep each pump crisp.',
  },
  cable_glute_kickback: {
    setup: 'Strap the cuff to your ankle at the low pulley, hold the frame, and hinge slightly forward.',
    form: 'Kick the leg straight back and slightly out, stopping when the glute is fully squeezed.',
    efficiency: 'Hold the end position one second and lower slowly; do not let the stack slam.',
    fatigue: 'Last reps: your low back will arch to swing the leg higher; shorten the range and stay square.',
  },
  machine_glute_kickback: {
    setup: 'Set the pad on the back of the working foot or knee, chest on the support, hips square.',
    form: 'Press the leg back until the hip is fully extended, then return slowly to start.',
    efficiency: 'Drive through the heel and pause at the top; aim for the glute, not the hamstring.',
    fatigue: 'Last reps: the torso twists to push the pad; stay square or end the set there.',
  },
  hip_abduction_machine: {
    setup: 'Sit tall with the pads on the outside of the knees and adjust to a comfortable start width.',
    form: 'Push the knees out as wide as possible, then let the pads return slowly to start.',
    efficiency: 'Lean slightly forward to bias the glutes more, and pause one second at the widest point.',
    fatigue: 'Last reps: you\'ll rock your torso to force reps; stay still and take short partials instead.',
  },
  hip_adduction_machine: {
    setup: 'Sit tall with the pads on the inside of the knees, set to a stretch that feels comfortable.',
    form: 'Squeeze the knees together until the pads meet, then open back to the stretch slowly.',
    efficiency: 'Take three seconds on the way out; the stretch at the open end is where you grow.',
    fatigue: 'Last reps: your hips will lift off the seat to cheat; stay seated or end the set.',
  },
  cable_hip_abduction: {
    setup: 'Attach the cuff to the outside ankle at a low pulley, stand side on, and hold the frame.',
    form: 'Lift the leg out to the side and slightly back, stopping when the hip is fully squeezed.',
    efficiency: 'Lead with the heel and pause at the top; keep the stack from touching between reps.',
    fatigue: 'Last reps: your torso will lean away to lift higher; stay upright and shorten the range.',
  },
  cable_hip_adduction: {
    setup: 'Attach the cuff to the inside ankle at a low pulley, stand side on, and hold the frame.',
    form: 'Sweep the leg across the body past the standing foot, then return slowly to start.',
    efficiency: 'Squeeze the inner thigh at the finish and let the cable stretch you on the way back.',
    fatigue: 'Last reps: your hips will twist to help; keep both hip bones facing forward or stop the set.',
  },
  side_lying_hip_abduction: {
    setup: 'Lie on your side with the bottom knee bent, top leg straight in line with the torso.',
    form: 'Raise the top leg toward the ceiling, heel leading, then lower without resting it.',
    efficiency: 'Point the toes slightly down and pause at the top to keep tension on the side glute.',
    fatigue: 'Last reps: the leg will drift forward to use the hip flexor; keep it in line or stop.',
  },
  banded_lateral_walk: {
    setup: 'Loop the band above the knees or at the ankles, sink into a quarter squat, feet hip width.',
    form: 'Step sideways with the lead foot, then follow without letting the feet come together.',
    efficiency: 'Keep constant tension on the band and push the knees out with every single step.',
    fatigue: 'Last reps: you\'ll stand taller and shuffle; stay low and take smaller steps.',
  },
  standing_calf_raise_machine: {
    setup: 'Set the pads on your shoulders and the balls of the feet on the edge, heels hanging free.',
    form: 'Lower the heels into a deep stretch, then rise as high onto the big toe as you can.',
    efficiency: 'Pause two seconds in the bottom stretch to kill the bounce, then drive up hard.',
    fatigue: 'Last reps: your knees will bend to help; keep them straight and take shorter reps.',
  },
  seated_calf_raise: {
    setup: 'Set the pad snug on the lower thighs and the balls of the feet on the platform edge.',
    form: 'Drop the heels into a full stretch, then press up as high as possible onto the toes.',
    efficiency: 'Hold the top one second and the bottom two; slow reps beat heavy bouncing here.',
    fatigue: 'Last reps: the range will shrink to tiny bounces; keep the full stretch or end the set.',
  },
  leg_press_calf_raise: {
    setup: 'Sit in the leg press, legs nearly straight, balls of the feet on the bottom of the plate.',
    form: 'Push the plate away by pointing the toes, then let the heels travel back into a stretch.',
    efficiency: 'Keep the safeties on and pause in the stretch; drive through the big toe on each rep.',
    fatigue: 'Last reps: your knees will bend to push the plate; keep the same slight bend or end the set.',
  },
  hack_squat_calf_raise: {
    setup: 'Stand in the hack squat with shoulders under the pads, balls of the feet on the platform edge.',
    form: 'Lower the heels into a deep stretch, then rise as tall onto the toes as you can.',
    efficiency: 'Hold the top squeeze one second and keep the stretch slow; no bouncing out of the bottom.',
    fatigue: 'Last reps: your knees will soften to help lift; keep them straight and take what range is left.',
  },
  smith_calf_raise: {
    setup: 'Set a plate or step under the Smith bar, balls of feet on its edge, bar across the traps.',
    form: 'Lower the heels below the step for a stretch, then rise straight up onto the toes.',
    efficiency: 'Pause at the bottom to remove the bounce and push through the big toe at the top.',
    fatigue: 'Last reps: your weight will roll onto the pinky toes; keep it centered or end the set.',
  },
  single_leg_db_calf_raise: {
    setup: 'Stand on one foot on a step edge, dumbbell in the same hand, other hand on a support.',
    form: 'Lower the heel well below the step, then rise as high as you can onto the big toe.',
    efficiency: 'Pause in the stretch for two seconds; use the support hand for balance, not to pull.',
    fatigue: 'Last reps: your ankle will roll outward; keep weight over the big toe or finish the set.',
  },
  plank: {
    setup: 'Set the elbows under the shoulders, forearms flat, feet together, body in one straight line.',
    form: 'Hold the hips level with the shoulders, glutes squeezed, neck long and eyes on the floor.',
    efficiency: 'Pull the elbows toward the toes without moving them to make every second harder.',
    fatigue: 'Last reps: your hips will sag first as the hold drags on; tuck the pelvis or end the hold.',
  },
  weighted_plank: {
    setup: 'Have a partner place the plate on your upper back once you are set on your forearms.',
    form: 'Keep a straight line from head to heels, hips level, and the plate steady and centered.',
    efficiency: 'Squeeze the glutes and quads hard; tension through the whole body holds the weight.',
    fatigue: 'Last reps: your low back will sag under the plate; end the hold before your hips drop.',
  },
  side_plank: {
    setup: 'Set the elbow under the shoulder, legs stacked, and lift into a line from head to feet.',
    form: 'Push the hips forward and up so they do not sag toward the floor or drift backward.',
    efficiency: 'Press the forearm into the floor and reach the top arm long to build tension.',
    fatigue: 'Last reps: your bottom hip will dip first; lift it back up or end the hold.',
  },
  copenhagen_plank: {
    setup: 'Lie on your side with the top leg on the bench, inner knee or ankle resting on the pad.',
    form: 'Lift the hips so the body forms one line, bottom leg hanging or tucked under the bench.',
    efficiency: 'Press the top leg down into the bench hard; that inner thigh squeeze holds you up.',
    fatigue: 'Last reps: your hips will sag and rotate; end the hold before you lose the straight line.',
  },
  hollow_hold: {
    setup: 'Lie on your back, arms overhead, legs straight, and press the low back flat into the floor.',
    form: 'Lift the shoulders and legs a few inches, holding a shallow banana shape with toes pointed.',
    efficiency: 'Reach the hands and toes away from each other to stretch the body long and tight.',
    fatigue: 'Last reps: your low back will lift off the floor; bend the knees or raise the legs to reset.',
  },
  dead_bug: {
    setup: 'Lie back with arms straight up, knees bent at 90 degrees over hips, low back pressed down.',
    form: 'Lower the opposite arm and leg toward the floor slowly, then return and switch sides.',
    efficiency: 'Exhale fully as you reach out; move slowly enough that the torso never shifts.',
    fatigue: 'Last reps: your low back will peel off the floor; shorten the reach and keep it pinned.',
  },
  ab_wheel_rollout: {
    setup: 'Kneel on a pad with the wheel under the shoulders, hips slightly tucked, arms straight.',
    form: 'Roll forward as far as you can hold a straight line, then pull back with the abs.',
    efficiency: 'Exhale as you roll out over three seconds and keep your hips tucked so your abs stay loaded.',
    fatigue: 'Last reps: your low back will sag at full reach; shorten the rollout or end the set.',
  },
  dragon_flag: {
    setup: 'Lie on the bench and grip it behind your head, shoulders down on the pad.',
    form: 'Lift the body into a straight line resting on the upper back, then lower it slowly as one piece.',
    efficiency: 'Take four seconds or more on the way down; the lowering is where the strength builds.',
    fatigue: 'Last reps: your hips will bend to make it easier; tuck the knees or stop the set there.',
  },
  hanging_knee_raise: {
    setup: 'Hang from the bar with an overhand grip, arms straight, shoulders pulled slightly down.',
    form: 'Pull the knees toward the chest and curl the pelvis up, then lower without swinging.',
    efficiency: 'Exhale as you lift and pause a beat at the top with the pelvis curled toward your ribs.',
    fatigue: 'Last reps: a swing will start building; pause at the bottom to reset before each rep.',
  },
  hanging_leg_raise: {
    setup: 'Hang from the bar with a shoulder-width grip, legs together and the body still.',
    form: 'Raise straight legs to hip height or higher by rolling the pelvis up, then lower slowly.',
    efficiency: 'Lead with the hips, not the feet, and take a full two seconds on the way down.',
    fatigue: 'Last reps: your legs will stop short and swing; bend the knees and finish with knee raises.',
  },
  captains_chair_knee_raise: {
    setup: 'Rest the forearms on the pads, grip the handles, and press the back flat into the pad.',
    form: 'Lift the knees toward the chest, curling the hips up and off the back pad at the top.',
    efficiency: 'Pause at the top and lower for two seconds so the legs never just drop.',
    fatigue: 'Last reps: your knees will stop at hip height; keep curling the pelvis up or end the set.',
  },
  cable_crunch: {
    setup: 'Kneel facing a high pulley, rope held beside your head, hips stacked over the knees.',
    form: 'Curl the ribs toward the hips, rounding the spine until the elbows reach the thighs.',
    efficiency: 'Exhale fully as you crunch, pause one count at the bottom, then rise slowly.',
    fatigue: 'Last reps: your hips will hinge back to move the weight; keep them still or stop the set.',
  },
  machine_crunch: {
    setup: 'Adjust the seat so the pads sit on your chest or shoulders, feet hooked under the rollers.',
    form: 'Curl the torso down by rounding the spine, pulling the ribs toward the hips.',
    efficiency: 'Exhale hard at the bottom and hold one second; return slowly to keep tension on.',
    fatigue: 'Last reps: your arms will start pulling the pads; keep them passive and finish with the abs.',
  },
  decline_sit_up: {
    setup: 'Hook the feet under the pads, sit on the decline bench, arms crossed or hands by the ears.',
    form: 'Lower the torso back until it is nearly flat, then curl up by rounding the spine.',
    efficiency: 'Lower slowly for three seconds and exhale as you curl back up to the top.',
    fatigue: 'Last reps: you\'ll yank on your neck; keep the chin tucked and slow down or stop.',
  },
  weighted_sit_up: {
    setup: 'Lie back with knees bent, feet anchored, and hold a plate across the chest.',
    form: 'Curl up one segment at a time until the torso is upright, then lower the same way.',
    efficiency: 'Exhale on the way up and take three seconds to lower so the abs work in both directions.',
    fatigue: 'Last reps: the plate will drift off your chest to swing you up; hug it in or end the set.',
  },
  reverse_crunch: {
    setup: 'Lie on your back, knees bent at 90 degrees over the hips, palms flat beside you.',
    form: 'Curl the hips off the floor and roll the knees toward the chest, then lower slowly.',
    efficiency: 'Exhale as the hips curl up and pause a beat with your knees close to your chest.',
    fatigue: 'Last reps: you\'ll rock with momentum; pause at the bottom before each rep.',
  },
  mountain_climber: {
    setup: 'Start in a high plank, hands under the shoulders, body straight from head to heels.',
    form: 'Drive one knee toward the chest, then switch legs quickly while the hips stay level.',
    efficiency: 'Keep a steady, fast rhythm and land on the balls of the feet each time you switch.',
    fatigue: 'Last reps: your hips will pike up; drop them back to plank height and slow the pace.',
  },
  pallof_press: {
    setup: 'Set the cable at chest height, stand side on, feet hip width, handle held at the sternum.',
    form: 'Press the handle straight out until the arms lock, then bring it back to the chest.',
    efficiency: 'Hold two seconds at full extension and fight the cable pulling you toward the stack.',
    fatigue: 'Last reps: your torso will rotate toward the cable; step closer to lighten it or stop.',
  },
  pallof_step_out: {
    setup: 'Stand side-on to a chest-high cable, feet hip-width, handle held at your sternum.',
    form: 'Press the arms straight, then take small side steps away while the hands stay centered.',
    efficiency: 'Squeeze your glutes and ribs down so the cable\'s pull is resisted from the trunk, not the arms.',
    fatigue: 'Last reps: your shoulders will twist toward the anchor; step back in if you can\'t stay square.',
  },
  cable_wood_chop: {
    setup: 'Set the pulley high, stand side-on in a wide stance, both hands stacked on the handle.',
    form: 'Pull diagonally from high to low across the body, finishing outside the far knee.',
    efficiency: 'Let the turn come from your hips and trunk; the arms just stay long and guide the handle.',
    fatigue: 'Last reps: your arms will start doing the pulling; lighten it or stop once the hips quit turning.',
  },
  landmine_rotation: {
    setup: 'Stand square to the landmine, feet shoulder-width, arms long, holding the bar end at chest height.',
    form: 'Arc the bar side to side toward each hip, keeping elbows nearly straight throughout.',
    efficiency: 'Pivot the back foot as you turn and slow the bar down before it crosses to the other side.',
    fatigue: 'Last reps: your low back will start swinging the bar; shorten the arc or stop the set.',
  },
  landmine_rotational_punch: {
    setup: 'Stand side-on to the landmine in an athletic stance, bar end held at the back shoulder.',
    form: 'Rotate the hips toward the bar\'s path and punch it up and out to a long arm.',
    efficiency: 'Drive from the back foot so the turn fires first and the arm finishes the punch fast.',
    fatigue: 'Last reps: the punch will slow and your back heel stops turning; end the set when that happens.',
  },
  landmine_rotational_clean_press: {
    setup: 'Set the bar end at one hip, feet wider than shoulders, hinged with a flat back.',
    form: 'Extend the hips to pop the bar to the opposite shoulder, then rotate and press it overhead.',
    efficiency: 'Let the hip snap make the bar float; catch it softly before driving the press upward.',
    fatigue: 'Last reps: the bar will stop floating and you\'ll curl it up; end the set at that point.',
  },
  farmer_carry: {
    setup: 'Deadlift the dumbbells from the floor with a flat back, handles centered in a crushing grip.',
    form: 'Walk with short, quick steps, shoulders pulled back and down, eyes on the horizon.',
    efficiency: 'Crush the handles as hard as you can; a harder grip keeps your shoulders tight and steps steady.',
    fatigue: 'Last reps: your grip will fade and shoulders round forward; set the bells down before they slip.',
  },
  suitcase_carry: {
    setup: 'Pick up one dumbbell beside you with a hinge, the free hand relaxed at your side.',
    form: 'Walk in a straight line with the shoulders level; resist the weight pulling you sideways.',
    efficiency: 'Squeeze the obliques on the free side to stay upright and keep your steps quiet.',
    fatigue: 'Last reps: you\'ll lean toward the weight; stop and switch hands when you can\'t stay level.',
  },
  front_rack_carry: {
    setup: 'Clean the dumbbells to your shoulders, elbows tucked in front, heads resting on the delts.',
    form: 'Walk tall with steady, heel-to-toe steps and the ribs stacked over the pelvis.',
    efficiency: 'Hold the bells high and close so the upper back works, not the forearms.',
    fatigue: 'Last reps: your elbows will drop and your low back will arch; reset the rack or set the bells down.',
  },
  waiter_carry: {
    setup: 'Press one dumbbell overhead to lockout, bicep by the ear, the free arm out for balance.',
    form: 'Walk slowly with the bell stacked over your shoulder and the wrist straight.',
    efficiency: 'Pull the working shoulder down into its socket while reaching the weight to the ceiling.',
    fatigue: 'Last reps: the bell will drift forward; lower it to your shoulder before the elbow bends.',
  },
  overhead_carry: {
    setup: 'Press both dumbbells overhead, palms facing in, arms locked and close to the head.',
    form: 'Walk with short steps, keeping the bells directly over your heels the whole way.',
    efficiency: 'Reach long through the arms so the shoulders shrug up toward the ears and stay active.',
    fatigue: 'Last reps: your low back will arch to hold the weight; lower the bells once the ribs flare.',
  },
  turkish_get_up: {
    setup: 'Lie on your back, bell pressed up in one hand, same-side knee bent with foot flat.',
    form: 'Move through roll, post, bridge, sweep and stand, eyes on the bell until standing.',
    efficiency: 'Pause briefly at each position; slow, deliberate transitions are where the strength builds.',
    fatigue: 'Last reps: your arm will drift off vertical; stay slow, and stop if you can\'t hold the lockout.',
  },
  hang_power_clean: {
    setup: 'Start standing with a clean-width grip, then hinge until the bar is just above your knees.',
    form: 'Keep the bar brushing the thighs, extend violently, and pull under into a quarter-squat catch.',
    efficiency: 'Finish the hip snap before the arms bend; let the legs throw the bar, then meet it fast.',
    fatigue: 'Last reps: your elbows will turn over slowly and the catch gets soft; end the set when that starts.',
  },
  db_hang_power_clean: {
    setup: 'Hold the dumbbells at your sides, hinge until they hang just above the knees, back flat.',
    form: 'Jump the hips forward, shrug, and rotate the elbows fast to catch the bells on the shoulders.',
    efficiency: 'Let the hips launch the dumbbells; the arms only guide them in close to the body.',
    fatigue: 'Last reps: the bells will start reverse-curling up; stop when the catch gets loud and heavy.',
  },
  hang_clean_to_box_knee_drive: {
    setup: 'Stand facing a box at about knee height, dumbbells at your sides, feet hip-width.',
    form: 'Clean the bells to the shoulders, then step up and drive the trailing knee to hip height.',
    efficiency: 'Use one sharp hip snap for the clean and push hard through the box heel to stand tall.',
    fatigue: 'Last reps: the knee drive will get lazy and you\'ll wobble on top; end the set when it does.',
  },
  kb_clean_and_press: {
    setup: 'Set the bell between your feet, hinge back, grab the handle and hike it behind you.',
    form: 'Swing it up close to rack on the forearm, then press overhead to a locked elbow.',
    efficiency: 'Pause in the rack, squeeze the glutes, then press; let the hip drive do the clean.',
    fatigue: 'Last reps: the bell will bang your forearm; stop when the clean no longer lands softly.',
  },
  power_snatch: {
    setup: 'Grip wide enough that the bar sits in your hip crease, shoulders over the bar, back flat.',
    form: 'Push the floor away, keep the bar close, and punch under into a locked overhead catch.',
    efficiency: 'Be patient off the floor and explode at the hips; the bar should feel weightless at the top.',
    fatigue: 'Last reps: the bar will swing away from you and the catch gets soft; end the set there.',
  },
  kb_snatch: {
    setup: 'Stand with the bell a foot in front, hike it back hard between the legs, back flat.',
    form: 'Swing up close to the body and punch the hand through so the bell lands quietly overhead.',
    efficiency: 'Snap the hips to float the bell, and exhale sharply as you lock it out.',
    fatigue: 'Last reps: the bell will flip over and slam your forearm; stop when that or a grip slip starts.',
  },
  db_snatch: {
    setup: 'Set one dumbbell between your feet, squat to grip it, chest up and back flat.',
    form: 'Drive straight up, keep the bell close, and punch to a locked arm in one motion.',
    efficiency: 'Jump through the floor with both legs; the arm only guides the bell to the ceiling.',
    fatigue: 'Last reps: you\'ll start pressing out the top; end the set when you can\'t catch it locked.',
  },
  split_jerk: {
    setup: 'Rack the bar on your shoulders, grip just outside them, feet under the hips.',
    form: 'Dip straight down, drive up, and split the feet as you punch under the bar.',
    efficiency: 'Keep the dip short and fast so the legs, not the arms, send the bar up.',
    fatigue: 'Last reps: your front foot will land short or the bar finishes behind you; stop the set then.',
  },
  landmine_split_jerk: {
    setup: 'Hold the bar end at one shoulder, feet hip-width, torso tall and facing the anchor.',
    form: 'Dip and drive, then split the feet as the arm punches the bar up to full extension.',
    efficiency: 'Make it one fast sequence; lock the arm before your feet hit the floor.',
    fatigue: 'Last reps: your split will get short and the front knee will drift; end the set when landings get sloppy.',
  },
  barbell_thruster: {
    setup: 'Front rack the bar with elbows high, feet shoulder-width, toes turned slightly out.',
    form: 'Squat to depth, then stand and press in one motion, finishing with arms locked.',
    efficiency: 'Use the leg drive to launch the bar through the sticking point; don\'t pause at the top of the squat.',
    fatigue: 'Last reps: your elbows will drop in the hole; lift them first, or rack it and rest.',
  },
  db_thruster: {
    setup: 'Hold the dumbbells on your shoulders, elbows forward, feet shoulder-width apart.',
    form: 'Squat below parallel, then drive up and press the bells overhead in one flow.',
    efficiency: 'Exhale as you press and let the hips carry the weight up past your face.',
    fatigue: 'Last reps: your chest will tip forward at the bottom; keep it tall or end the set.',
  },
  db_squat_to_press: {
    setup: 'Rack the dumbbells at your shoulders, stance shoulder-width, elbows pointed forward.',
    form: 'Squat down with control, stand fully, then press the bells straight overhead.',
    efficiency: 'Finish the squat with your glutes before you start pressing; two clean, separate parts.',
    fatigue: 'Last reps: your low back will arch on the press; pull the ribs down or end the set.',
  },
  db_clean_to_press: {
    setup: 'Hold the dumbbells at your sides, hinge until they\'re just above the knees, back flat.',
    form: 'Snap the hips, catch the bells on the shoulders, then press them to locked arms.',
    efficiency: 'Let the hip snap make the clean easy so you save the shoulders for the press.',
    fatigue: 'Last reps: the clean will turn into a curl and the press into a lean back; end the set then.',
  },
  devil_press: {
    setup: 'Set two dumbbells on the floor shoulder-width; hands on the handles in a plank.',
    form: 'Burpee down, jump the feet in, then swing both bells from the floor to overhead.',
    efficiency: 'Hinge hard and let the hips throw the bells up; keep them close on the way past your face.',
    fatigue: 'Last reps: your back will round on the swing; slow down and reset each rep, or stop the set.',
  },
  wall_ball: {
    setup: 'Stand an arm\'s length from the wall, ball at chin height, elbows tucked under it.',
    form: 'Squat below parallel, then drive up and release the ball toward the target.',
    efficiency: 'Make it one rhythm; catch high and ride the ball straight down into the next squat.',
    fatigue: 'Last reps: your squat will get shallow; keep the depth, or rest briefly and restart.',
  },
  med_ball_slam: {
    setup: 'Stand feet shoulder-width with the slam ball held at the waist, arms relaxed.',
    form: 'Reach the ball overhead onto your toes, then pull it down hard just in front of your feet.',
    efficiency: 'Throw the ball through the floor with your lats and abs, and exhale on impact.',
    fatigue: 'Last reps: the slam will lose its pop and the ball barely bounces; end the set there.',
  },
  mb_rotational_slam: {
    setup: 'Stand feet shoulder-width, slam ball held at the chest, knees soft.',
    form: 'Lift the ball overhead, then rotate and slam it down outside one foot, alternating sides.',
    efficiency: 'Pivot the opposite foot so the hips swing the ball down with full force.',
    fatigue: 'Last reps: the turn will shrink and the arms take over; stop the set when that happens.',
  },
  mb_rotational_throw: {
    setup: 'Stand side-on to a wall about a body length away, ball at the back hip.',
    form: 'Load into the back hip, then rotate and throw the ball into the wall at chest height.',
    efficiency: 'Let the hips turn first and the arms follow, like swinging a bat.',
    fatigue: 'Last reps: throw speed will drop and you\'ll reach with the arms; end the set when it does.',
  },
  mb_overhead_throw: {
    setup: 'Stand in a staggered stance facing a wall or open space, ball held overhead.',
    form: 'Bring the ball behind your head, then throw it forward hard, following through with both hands.',
    efficiency: 'Whip from the abs and lats like a soccer throw-in; release at eye level.',
    fatigue: 'Last reps: you\'ll arch your low back to launch it; stop once the throw stops traveling.',
  },
  mb_shot_put: {
    setup: 'Stand side-on to a wall, ball held at the back shoulder, elbow behind it.',
    form: 'Push off the back foot, rotate, and drive the ball out like a shot put, arm fully extended.',
    efficiency: 'Turn the hips first, then punch; the arm is the last link to fire.',
    fatigue: 'Last reps: the ball will stop jumping off your hand and timing slips; end the set there.',
  },
  mb_scoop_toss: {
    setup: 'Stand side-on to a wall in an athletic stance, ball held low at the back hip.',
    form: 'Scoop the ball low to high across the body and release it into the wall at head height.',
    efficiency: 'Shift your weight from back leg to front as you release for maximum speed.',
    fatigue: 'Last reps: the scoop will flatten and the release comes late; stop when throws lose snap.',
  },
  mb_backward_toss: {
    setup: 'Stand with feet shoulder-width, ball held at arm\'s length, with open space behind you.',
    form: 'Hinge to swing the ball between the legs, then extend and throw it back over your head.',
    efficiency: 'Jump with the throw so the hips launch the ball as high and far as possible.',
    fatigue: 'Last reps: throw distance will drop and landings will wobble; end the set when either shows up.',
  },
  mb_step_behind_throw: {
    setup: 'Stand side-on to the wall, ball at the chest, feet a little narrower than shoulders.',
    form: 'Step the back foot behind the front, load the hip, then rotate and throw into the wall.',
    efficiency: 'Use the step to build momentum and let it carry straight into a fast hip turn.',
    fatigue: 'Last reps: the step behind will slow and throws lose speed; stop the set at that point.',
  },
  bear_crawl_ball_toss: {
    setup: 'Start on hands and toes with the knees an inch off the floor, ball in front of you.',
    form: 'Crawl forward with opposite hand and foot together, keeping the hips level and low.',
    efficiency: 'Explode into the toss from a squat, then follow the ball and reset before crawling.',
    fatigue: 'Last reps: your hips will rise during the crawl; lower them to knee height or end the set.',
  },
  battle_rope_waves: {
    setup: 'Stand facing the anchor, feet shoulder-width, knees bent, rope ends held at the hips.',
    form: 'Make alternating waves from the shoulders that travel all the way to the anchor.',
    efficiency: 'Snap short and fast from the shoulders and exhale every few waves to hold the pace.',
    fatigue: 'Last reps: you\'ll stand up tall and the waves shrink; sink back down and keep the rhythm.',
  },
  box_jump: {
    setup: 'Stand a foot from the box, feet hip-width, arms ready to swing back.',
    form: 'Swing the arms, load the hips, and jump up to land softly with both feet flat on top.',
    efficiency: 'Drive the arms up hard on takeoff and pull the knees up to meet the box.',
    fatigue: 'Last reps: you\'ll barely clear the box and land loud; end the set, and step down every rep.',
  },
  seated_box_jump: {
    setup: 'Sit on a bench or box with the thighs parallel, feet flat, the jump box in front of you.',
    form: 'Swing the arms, drive off the seat without rocking, and land quietly on the box.',
    efficiency: 'Take off from a dead stop so all the power comes from the hips, not momentum.',
    fatigue: 'Last reps: jump height will drop and your knees will cave on landing; stop the set then.',
  },
  single_leg_box_jump: {
    setup: 'Stand on one leg a foot from a low box, the other knee slightly bent.',
    form: 'Load the hip, swing the arms, and jump to land on the same leg, knee over the toes.',
    efficiency: 'Hold the landing for a second to own your balance before stepping down.',
    fatigue: 'Last reps: your knee will wobble on landing and jumps get short; end the set when that starts.',
  },
  lateral_box_jump: {
    setup: 'Stand beside the box, feet hip-width, the inside foot about a foot from it.',
    form: 'Jump sideways onto the box and land square, both feet flat and knees soft.',
    efficiency: 'Swing the arms up and across to carry you sideways, then step down to reset.',
    fatigue: 'Last reps: landings will turn shaky and your feet clip the edge; stop the set when that starts.',
  },
  pogo_to_box_jump: {
    setup: 'Stand a foot from the box, weight on the balls of the feet, knees nearly straight.',
    form: 'Do quick, stiff-ankle pogo hops, then load the hips and jump onto the box.',
    efficiency: 'Keep ground contact short on the pogos, and let that bounce feed the final jump.',
    fatigue: 'Last reps: the pogos will slow and the box landing gets heavy; end the set at that point.',
  },
  lateral_bound_to_box_jump: {
    setup: 'Stand on one leg a few feet to the side of the box, the other foot lifted.',
    form: 'Bound sideways, stick the landing on the opposite leg, then jump up onto the box.',
    efficiency: 'Absorb the bound quietly, then explode straight up with an aggressive arm swing.',
    fatigue: 'Last reps: the bound landing will wobble and the box jump loses height; stop the set then.',
  },
  broad_jump: {
    setup: 'Stand feet hip-width, toes on a line, arms up and ready to swing back.',
    form: 'Swing the arms back, hinge, then jump forward and land softly on both feet.',
    efficiency: 'Throw the arms forward and project the hips out to cover the most distance.',
    fatigue: 'Last reps: you won\'t stick the landing and distance falls off; end the set when that happens.',
  },
  consecutive_broad_jump: {
    setup: 'Stand feet hip-width with a clear runway, arms ready to swing back.',
    form: 'Jump forward, land on both feet, and rebound straight into the next jump.',
    efficiency: 'Keep the landings quick and springy; spend as little time on the ground as you can.',
    fatigue: 'Last reps: jumps will shorten and landings collapse; stop the set as soon as that starts.',
  },
  banded_broad_jump: {
    setup: 'Attach a band around your hips anchored behind you, then step out to take up slack.',
    form: 'Swing the arms back, hinge, then jump forward against the band and land softly.',
    efficiency: 'Drive hard through the hips to overcome the band\'s pull at takeoff.',
    fatigue: 'Last reps: the band will yank you backward on landing; end the set when you can\'t stick it.',
  },
  broad_jump_to_vertical: {
    setup: 'Stand feet hip-width, arms at your sides, with space ahead to land and jump again.',
    form: 'Broad jump forward, land on both feet, then rebound straight up as high as you can.',
    efficiency: 'Stay springy on the first landing so its energy feeds the vertical jump.',
    fatigue: 'Last reps: your knees will cave on the first landing; end the set when you can\'t land stable.',
  },
  broad_jump_to_sprint: {
    setup: 'Stand at the start line, feet hip-width, with a clear lane ahead of you.',
    form: 'Broad jump forward, land, and go straight into a sprint on the very next step.',
    efficiency: 'Stay low out of the landing and drive the arms hard for the first few strides.',
    fatigue: 'Last reps: you\'ll pause on the landing and the sprint start slows; end the set when that starts.',
  },
  countermovement_jump: {
    setup: 'Stand feet hip-width, arms relaxed, weight evenly across the whole foot.',
    form: 'Dip quickly into a quarter squat, then jump straight up and land softly.',
    efficiency: 'Make the dip fast and short so the stretch launches you higher.',
    fatigue: 'Last reps: jump height will drop and knees cave on landing; stop the set when either shows.',
  },
  reactive_vertical_jump: {
    setup: 'Stand feet hip-width, knees soft, weight on the balls of the feet.',
    form: 'Jump up, land, and immediately rebound into the next jump with minimal ground time.',
    efficiency: 'Keep the ankles stiff and swing the arms up hard; a short, quick dip beats a deep one.',
    fatigue: 'Last reps: ground contacts will get longer and height falls off; end the set at that point.',
  },
  drop_jump: {
    setup: 'Stand on the edge of a low box, feet hip-width, arms relaxed at your sides.',
    form: 'Step off, land on both feet, and immediately jump straight up as high as you can.',
    efficiency: 'Land on the balls of your feet with stiff ankles and swing the arms up as you rebound.',
    fatigue: 'Last reps: the landing will get heavy and the rebound lower; stop the set when that happens.',
  },
  split_jump: {
    setup: 'Set up in a split stance, feet hip-width apart, back knee just above the floor.',
    form: 'Drive up explosively, switch legs in the air, and land soft in the opposite split.',
    efficiency: 'Use the arms to drive the jump and keep the torso tall through the switch.',
    fatigue: 'Last reps: your switch will slow and landings jar the front knee; end the set when that starts.',
  },
  skater_hop: {
    setup: 'Start on one leg with a soft bend, chest over the knee, and the free foot tucked behind.',
    form: 'Push off the outside edge of the foot and land softly on the opposite leg.',
    efficiency: 'Swing your arms across the body to add distance; reach for width, not height.',
    fatigue: 'Last reps: landings will get loud or wobbly and the free foot taps down; end the set then.',
  },
  lateral_single_leg_hop: {
    setup: 'Stand on one foot, hips loaded back, eyes on a landing spot to the side.',
    form: 'Hop sideways and land on the same foot, freezing for a full two count each time.',
    efficiency: 'Pick a distance you can stick every rep; quality landings beat longer hops.',
    fatigue: 'Last reps: your landing knee will cave or you\'ll need a second touch; stop the set then.',
  },
  single_leg_hop: {
    setup: 'Balance on one foot with a slight knee bend, eyes on a spot a body length ahead.',
    form: 'Hop forward and land quietly on the same foot, sitting the hips back to absorb.',
    efficiency: 'Swing both arms hard on takeoff to add distance without extra effort from the leg.',
    fatigue: 'Last reps: you\'ll wobble on landing or the knee drifts inside the foot; end the set then.',
  },
  single_leg_hop_to_sprint: {
    setup: 'Stand tall on one leg with a slight forward lean, arms cocked and ready to swing.',
    form: 'Land the hop under your hips, then drive out low with fast, pushing first steps.',
    efficiency: 'Make the transition seamless; the moment you land, attack the ground into the sprint.',
    fatigue: 'Last reps: the landing will stall and first steps lose their snap; stop the set at that point.',
  },
  alternating_bound: {
    setup: 'Start from a short jog-in or a staggered stance, chest tall over the hips.',
    form: 'Push off one leg and land on the other, driving the lead knee up and forward each stride.',
    efficiency: 'Hang in the air briefly and use big opposite arm swings to cover more ground.',
    fatigue: 'Last reps: bounds will shrink to running strides and landings collapse; end the set then.',
  },
  banded_lateral_bound: {
    setup: 'Anchor the band at your hip, step out until it pulls, and stand on the outside leg.',
    form: 'Bound away from the anchor and stick the landing on one foot, hip and knee stacked.',
    efficiency: 'Resist the band\'s pull on the return; move with intent rather than letting it yank you.',
    fatigue: 'Last reps: the band will start winning and pull you back early; end the set when it does.',
  },
  line_hops: {
    setup: 'Stand beside a line on the balls of your feet, feet together and knees slightly soft.',
    form: 'Hop side to side over the line with small, quick contacts and level hips.',
    efficiency: 'Keep the hops low and snappy; think of the floor as hot so you get off it fast.',
    fatigue: 'Last reps: your feet will land on the line and contacts slow; end the set when that starts.',
  },
  pogo_hop: {
    setup: 'Stand tall with feet hip width, ankles locked stiff, and arms relaxed by your sides.',
    form: 'Bounce off the balls of your feet using the ankles, with only a slight knee bend.',
    efficiency: 'Spend as little time on the ground as possible; push the floor away like a spring.',
    fatigue: 'Last reps: your heels will touch down and the bounce turns into a squat; end the set then.',
  },
  jump_rope: {
    setup: 'Size the rope so the handles reach your armpits when you stand on the middle.',
    form: 'Turn the rope with the wrists and clear it with small hops on the balls of the feet.',
    efficiency: 'Find a steady rhythm and relax the shoulders so the rope does the work.',
    fatigue: 'Last reps: your arms will widen and swing big; pull the elbows in and turn from the wrists.',
  },
  jumping_jack: {
    setup: 'Stand tall with feet together, arms at your sides, and a slight bend in the knees.',
    form: 'Jump the feet just past shoulder width as the arms sweep overhead, then return together.',
    efficiency: 'Stay light and rhythmic, landing softly and syncing the arm and leg timing.',
    fatigue: 'Last reps: landings will get heavy and flat footed; stay on the balls of your feet.',
  },
  db_jumping_jack: {
    setup: 'Hold light dumbbells at your sides, feet together, shoulders down away from ears.',
    form: 'Jump the feet out as you raise the weights to shoulder height with straight arms.',
    efficiency: 'Keep the dumbbells light and exhale as they rise; match the arm rhythm to your feet.',
    fatigue: 'Last reps: the weights will start swinging with momentum; slow the pace or end the set.',
  },
  burpee: {
    setup: 'Stand with feet hip width and hands ready to plant just outside your feet.',
    form: 'Squat down, jump the feet back to a straight plank, chest to floor, then jump back in.',
    efficiency: 'Find a pace you can repeat; exhale on the jump and land softly every time.',
    fatigue: 'Last reps: your hips will sag at the bottom; step the feet back instead of jumping if needed.',
  },
  snap_down: {
    setup: 'Stand tall on your toes with arms reaching overhead, ready to pull down fast.',
    form: 'Snap the arms down and drop into a quarter squat, landing on both feet at once.',
    efficiency: 'Hit the athletic position as fast as possible, then freeze it for a full second.',
    fatigue: 'Last reps: landings will get noisy and your heels slam first; end the set when that starts.',
  },
  acceleration_sprint: {
    setup: 'Set a staggered stance with the front foot under the hip and body leaning forward.',
    form: 'Push hard into the ground with each step, keeping a straight line from head to heel.',
    efficiency: 'Pump the arms hard and let your torso rise gradually over the first few strides.',
    fatigue: 'Last reps: your first three steps will lose their pop; rest fully between reps or stop there.',
  },
  falling_start_sprint: {
    setup: 'Stand tall on the balls of your feet with feet together and arms ready to pump.',
    form: 'Lean forward as one stiff line until you must step, then drive into the sprint.',
    efficiency: 'Fire the first step low and quick right under your hips; do not reach out in front.',
    fatigue: 'Last reps: you\'ll bend at the waist and the first step slows; stop the set when that starts.',
  },
  half_kneeling_start_sprint: {
    setup: 'Kneel on one knee with the front foot flat under you and arms in a running position.',
    form: 'Drive off the front foot and pull the back knee through to stand and sprint low.',
    efficiency: 'Keep the chest low over the first two steps and punch the arms hard.',
    fatigue: 'Last reps: you\'ll pop straight up out of the kneel; end the set when you stop driving forward.',
  },
  push_up_start_sprint: {
    setup: 'Start lying chest down with hands under your shoulders, ready to press up fast.',
    form: 'Press up, bring one foot under the hips, and drive forward at a low angle.',
    efficiency: 'Get off the floor in one quick motion; the sprint starts before you stand tall.',
    fatigue: 'Last reps: your first steps will turn short and upright; stop the set when you lose the low angle.',
  },
  split_stance_start_sprint: {
    setup: 'Set the feet in a split with front shin angled forward and weight on the front leg.',
    form: 'Drive the back knee through fast and push the ground behind you to start the sprint.',
    efficiency: 'Stay low for the first few steps and pump the opposite arm hard with each push.',
    fatigue: 'Last reps: your first step will get short and you\'ll stand up early; end the set then.',
  },
  drop_step_sprint: {
    setup: 'Stand in an athletic stance, feet shoulder width, weight on the balls of the feet.',
    form: 'Open the hip and pivot the back foot behind you, then sprint in the new direction.',
    efficiency: 'Turn the head and chest with the hips so your whole body points where you are going.',
    fatigue: 'Last reps: the drop step will get wide and sloppy; stop when the first stride loses snap.',
  },
  crossover_sprint: {
    setup: 'Stand sideways to the lane in an athletic stance with weight centered over your feet.',
    form: 'Turn the hips and swing the trail leg across the body, then sprint forward.',
    efficiency: 'Drive the crossover knee hard and use a strong arm swing to turn quickly.',
    fatigue: 'Last reps: your feet will stall during the turn and the start slows; end the set then.',
  },
  shuffle_crossover_sprint: {
    setup: 'Start in a low athletic stance, feet wider than your shoulders, chest up.',
    form: 'Shuffle a few steps without the feet touching, then cross over and sprint out.',
    efficiency: 'Make the switch from shuffle to sprint sharp, with no extra steps in between.',
    fatigue: 'Last reps: your shuffle will get tall and feet click together; stop the set when that starts.',
  },
  sprint_to_stick: {
    setup: 'Start in a staggered stance with marks set for the sprint and the stop zone.',
    form: 'Sprint hard, then sink into a low, balanced stance with feet wide.',
    efficiency: 'Begin braking a few strides early with short, choppy steps so you stop smoothly.',
    fatigue: 'Last reps: you\'ll overrun the stop zone or your knees cave on the stick; end the set then.',
  },
  backpedal_to_stick: {
    setup: 'Stand in an athletic stance with weight forward on the balls of your feet.',
    form: 'Backpedal with short, quick steps, then plant and freeze in a low, balanced stance.',
    efficiency: 'Keep the chest over your toes as you move back so you can stop on demand.',
    fatigue: 'Last reps: you\'ll lean back onto your heels and the stop gets wobbly; end the set then.',
  },
  cut_and_go: {
    setup: 'Set a cone for the cut and start in a staggered stance a few strides away.',
    form: 'Approach, lower the hips, plant the outside foot, and push off in the new direction.',
    efficiency: 'Shorten the steps before the cut so the plant is fast and powerful, not drawn out.',
    fatigue: 'Last reps: your plant knee will drift inward or the cut gets rounded; end the set then.',
  },
  pro_agility_shuttle: {
    setup: 'Straddle the middle line in a three point or athletic stance, lines 5 yards each side.',
    form: 'Run 5 yards, touch the line, turn 10 yards back, touch, then finish 5 yards through.',
    efficiency: 'Stay low through every turn and push hard off the outside foot each time.',
    fatigue: 'Last reps: your turns will get rounded and you\'ll miss the line; stop the set when that starts.',
  },
  short_shuttle: {
    setup: 'Set two lines 5 to 10 yards apart and start in a low athletic stance.',
    form: 'Sprint to the line, plant, touch it, and sprint back with a sharp change of direction.',
    efficiency: 'Drop the hips before each turn so you decelerate quickly and reaccelerate hard.',
    fatigue: 'Last reps: you\'ll drift past the line and turns will lose speed; end the set at that point.',
  },
  lateral_shuffle_stick: {
    setup: 'Set up in a wide athletic stance with knees bent and chest leaning slightly forward.',
    form: 'Shuffle sideways with the feet never touching, then stop dead on the outside foot.',
    efficiency: 'Push off the trail leg each step and stay level; avoid bobbing up and down.',
    fatigue: 'Last reps: you\'ll slide past the mark and need extra steps to stop; end the set then.',
  },
  lateral_shuffle: {
    setup: 'Stand in a wide athletic stance, knees bent, hips back, weight on the balls of the feet.',
    form: 'Step sideways with the lead foot, keeping the feet apart and toes pointed forward.',
    efficiency: 'Push from the trail leg and keep your head level, like moving under a low bar.',
    fatigue: 'Last reps: your hips will pop up; sit back down and shorten the steps.',
  },
  carioca: {
    setup: 'Stand sideways with feet shoulder width, arms out for balance, and knees soft.',
    form: 'Alternate crossing the trail leg in front and behind, letting the hips rotate freely.',
    efficiency: 'Keep the shoulders square to the front while the hips do the twisting; stay light.',
    fatigue: 'Last reps: your steps will tangle and get heavy; slow down to regain rhythm, then speed up.',
  },
  dot_drill: {
    setup: 'Stand on the balls of your feet with the dot pattern in front, knees slightly bent.',
    form: 'Hit each dot cleanly in the set pattern, keeping your hips centered over the grid.',
    efficiency: 'Stay low and quick, using the ankles and keeping each foot contact very brief.',
    fatigue: 'Last reps: you\'ll miss dots and look down for the pattern; stop the set when that starts.',
  },
  wall_drill: {
    setup: 'Place your hands on a wall at shoulder height and lean in until you form a straight line.',
    form: 'Drive one knee up to hip height with the toes pulled up, then switch legs.',
    efficiency: 'Snap the foot down under the hips and strike the floor hard with each switch.',
    fatigue: 'Last reps: your hips will bend and drop toward the wall; hold the straight lean or stop.',
  },
  a_march: {
    setup: 'Stand tall with feet under your hips and arms bent at 90 degrees.',
    form: 'March forward, lifting each knee to hip height with the toes pulled toward the shin.',
    efficiency: 'Drive the foot down under you and pump the opposite arm in sync with the leg.',
    fatigue: 'Last reps: your support heel will sink and your chest will lean back; stay tall on the ball of the foot.',
  },
  a_skip: {
    setup: 'Stand tall on the balls of your feet with your arms bent and relaxed.',
    form: 'Skip forward, driving one knee to hip height while the other foot strikes the floor.',
    efficiency: 'Strike the ground under your hips with a stiff ankle for a quick, springy bounce.',
    fatigue: 'Last reps: your knee drive will drop and contacts get slow; keep knees to hip height or stop.',
  },
  power_skip: {
    setup: 'Stand tall with a short run-in space and arms ready to swing big.',
    form: 'Skip forward and drive the lead knee and opposite arm up as high as possible.',
    efficiency: 'Push hard off the ground with each skip to reach maximum height, not distance.',
    fatigue: 'Last reps: skip height will fall and the arm swing shortens; end the set when that starts.',
  },
  high_knees: {
    setup: 'Stand with feet hip width, elbows bent at 90 degrees, weight on the balls of the feet.',
    form: 'Run in place, bringing each knee up to hip height with quick, light foot contacts.',
    efficiency: 'Pump the arms fast and stay tall so each leg cycles quickly through the motion.',
    fatigue: 'Last reps: you\'ll lean back to lift the legs; slow down a little and stay tall.',
  },
  leg_swings: {
    setup: 'Hold a wall or rack for balance and stand on one leg with a soft knee.',
    form: 'Swing the free leg forward and back, keeping the torso still and upright.',
    efficiency: 'Let the leg move freely; relax the hip so the swing gets bigger with each pass.',
    fatigue: 'Last reps: you\'ll lean your torso to swing higher; keep it still and let the hip open up.',
  },
  worlds_greatest_stretch: {
    setup: 'Step into a long lunge and plant both hands inside the front foot.',
    form: 'Drop the elbow toward the instep, then rotate and reach the hand up to the ceiling.',
    efficiency: 'Follow the rotating hand with your eyes and exhale as you open up the chest.',
    fatigue: 'Last reps: you\'ll rush the rotation; slow down, sink the hips lower, and reach a bit further.',
  },
  sled_push: {
    setup: 'Grip the handles at chest height with arms long and lean in to about 45 degrees.',
    form: 'Take short, powerful steps on the balls of the feet, pushing the floor back behind you.',
    efficiency: 'Keep the sled moving at a steady speed; restarting from a stop costs the most energy.',
    fatigue: 'Last reps: your back will round and hips rise; shorten the push or end the set.',
  },
  plate_push: {
    setup: 'Set your hands on the plate with straight arms and a flat back.',
    form: 'Drive forward with quick steps on the balls of your feet, legs pumping hard.',
    efficiency: 'Stay low through the hips and push the plate in a straight line.',
    fatigue: 'Last reps: your feet will start to slip; shorten the stride to keep traction or stop.',
  },
  sled_pull: {
    setup: 'Face the sled in a low athletic stance with the rope taut and arms extended.',
    form: 'Pull hand over hand, drawing the rope to your hip with each pull.',
    efficiency: 'Squeeze the shoulder blades on each pull and keep a steady rhythm.',
    fatigue: 'Last reps: your back will round; keep the chest high or end the set.',
  },
  treadmill_run: {
    setup: 'Start slow, then raise the speed to a pace you can hold for the full work time.',
    form: 'Land under your hips with a relaxed stride and swing the arms front to back.',
    efficiency: 'Stay relaxed through the shoulders and hands while keeping a steady rhythm.',
    fatigue: 'Last reps: your stride will get heavy; shorten it and quicken your turnover.',
  },
  treadmill_incline_walk: {
    setup: 'Set the incline and speed, then stand tall in the middle of the belt.',
    form: 'Push through the whole foot and drive the hips forward with each step.',
    efficiency: 'Take slightly shorter steps on steep inclines and squeeze the glute of each push-off leg.',
    fatigue: 'Last reps: you\'ll want to grab the rails; keep your hands off and slow the speed instead.',
  },
  stair_climber: {
    setup: 'Set a speed you can hold, stand tall, and let your fingertips rest on the rails.',
    form: 'Step through the whole foot, pushing the heel down to drive up each step.',
    efficiency: 'Use full steps and a steady rhythm so your glutes and quads do the climbing.',
    fatigue: 'Last reps: you\'ll lean forward and hang on the rails; slow the speed rather than collapse.',
  },
  stationary_bike: {
    setup: 'Set the seat so the knee keeps a slight bend at the bottom of the pedal stroke.',
    form: 'Pedal smoothly, pushing down and pulling up with even pressure through each stroke.',
    efficiency: 'Keep a steady cadence and pick resistance that lets you push hard without bouncing.',
    fatigue: 'Last reps: you\'ll start rocking side to side; lower the resistance a little and stay seated.',
  },
  air_bike: {
    setup: 'Set the seat so the knee keeps a slight bend at the bottom of the pedal stroke.',
    form: 'Push one handle as you pull the other, driving the pedals in a smooth rhythm.',
    efficiency: 'Settle into a pace you can hold, then spike the effort only in the final push.',
    fatigue: 'Last reps: your arms will slow first; keep pumping them so the legs are not working alone.',
  },
  row_erg: {
    setup: 'Strap the foot so the strap crosses the widest part, sit tall, arms long.',
    form: 'Drive with the legs, swing the back, then pull the handle to your lower ribs.',
    efficiency: 'Take about twice as long to slide forward as you do to drive back.',
    fatigue: 'Last reps: your arms will bend early; keep them straight until the legs finish pushing.',
  },
  ski_erg: {
    setup: 'Stand tall, feet hip width, and reach the handles overhead with soft elbows.',
    form: 'Pull the handles down while hinging at the hips, finishing with hands by the thighs.',
    efficiency: 'Exhale on every pull and keep a quick, relaxed recovery so the next stroke starts fast.',
    fatigue: 'Last reps: the pull will become all arms; drop your body weight into the handles to keep power.',
  },
};

/** Back-compat: the two first-set cues per exercise (setup, form). */
export const V3_EXERCISE_CUES: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(V3_COACHING).map(([k, c]) => [k, [c.setup, c.form]]),
) as Record<string, [string, string]>;

/** Where the athlete is in this exercise's sets: the coach's words change with it. */
export type CuePhase = 'first' | 'middle' | 'last';

export function cuePhase(setIndex: number, setCount: number): CuePhase {
  if (setCount <= 1 || setIndex <= 0) return 'first';
  return setIndex >= setCount - 1 ? 'last' : 'middle';
}

const SCALING_RE = /Too hard:[^.]*\.\s*Too easy:[^.]*\./i;

/** "Make it fit you" as a cue: the Too hard / Too easy sentences of the scaling detail, for scalable bodyweight work. */
export function scalingCue(scaling: { short: string; detail: string } | null | undefined): string | null {
  if (!scaling) return null;
  const m = SCALING_RE.exec(scaling.detail);
  return m ? m[0].trim() : scaling.short;
}

const WEAK = /^(control the movement|keep good form|brace your core|breathe)\.?$/i;

const STOP = new Set(
  'the a an and or to of your you in on at for with it is as then be do not no each every one until from up down into this that by over under through keep let last reps rep set sets stop end hold them they will seconds'.split(' '),
);
function words(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length > 3 && !STOP.has(w)));
}
/** Two lines that make the same point (most of the shorter one's content words appear in the other). */
export function sameCue(a: string, b: string): boolean {
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;
  const wa = words(a), wb = words(b);
  const small = wa.size <= wb.size ? wa : wb, big = small === wa ? wb : wa;
  if (small.size === 0) return false;
  let n = 0;
  small.forEach((w) => { if (big.has(w)) n++; });
  return n / small.size >= 0.6;
}

/**
 * The cues for the set on screen, by where the athlete is in the exercise (cuePhase):
 *   first   setup + form (the scaling line first on scalable bodyweight work)
 *   middle  form + efficiency
 *   last    fatigue + efficiency (closest to failure: what breaks down and how to hold it)
 * Timed holds / intervals read "Last seconds:" instead of "Last reps:". Exercises outside the MOOD library fall back to
 * the engine's cues. Never two lines that say the same thing; weak generic lines dropped.
 */
export function exerciseCues(
  item: { exercise?: { id?: string; name?: string } | null; cues?: string[] | null; prescription?: { scaling?: { short: string; detail: string } | null; kind?: string | null } | null },
  max = 2,
  phase: CuePhase = 'first',
  timed = false,
): string[] {
  const out: string[] = [];
  const push = (c: string | null | undefined) => {
    if (!c) return;
    let t = c.trim();
    if (!t || t.length < 10 || WEAK.test(t)) return;
    if (timed) t = t.replace(/^Last reps:/, 'Last seconds:');
    if (out.some((x) => sameCue(x, t))) return;
    out.push(t);
  };
  const lib = V3_COACHING[item.exercise?.id ?? ''];
  if (lib) {
    if (phase === 'first') { push(scalingCue(item.prescription?.scaling)); push(lib.setup); push(lib.form); }
    else if (phase === 'middle') { push(lib.form); push(lib.efficiency); }
    else { push(lib.fatigue); push(lib.efficiency); }
    // short of lines (a duplicate dropped): fill from the rest, in coaching order
    for (const c of [lib.form, lib.efficiency, lib.setup, lib.fatigue]) if (out.length < max) push(c);
  } else {
    if (phase === 'first') push(scalingCue(item.prescription?.scaling));
    for (const c of item.cues ?? []) push(c);
  }
  return out.slice(0, max);
}

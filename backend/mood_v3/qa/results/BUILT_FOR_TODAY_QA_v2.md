# Built for Today QA pack (magic-moment pass)

Hook -> Proof -> optional Cue. Every message must pass the First-Sentence Test: sentence one names what MOOD knows about you today and the change it caused. Composer output (the LLM writer is off until the production key is set).

## Previous pack re-graded by the new gate: 28 of 30 now FAIL

- **S0** Strength · no State: The big lift comes first: Barbell Hip Thrust, heavy, while you've got the most to give. Then the targeted work fills in the volume around it. Hit the main lift hard, then let the volume do its job.  
  <sub>FAIL: filler: do its job</sub>
- **S1** Strength · Low Energy: Your working sets stop a little further from failure, so the energy you do have goes into quality work. The movements are stable and low-friction, so your effort goes into the muscle instead of the balancing act.  
  <sub>FAIL: filler: quality work; first sentence: sentence one does not name what the user told us today; personal: low_energy not visible in the first two sentences</sub>
- **S2** Strength · Amped: You've got extra juice today, so we're using it. The accessories run closer to the edge than usual; one of your lifts finishes with a rest-pause. Spend the energy on the work that matters, not on rushing.  
  <sub>FAIL: filler: (work|things|stuff) that matters?; first sentence: sentence one does not name what the user told us today; personal: amped not visible in the first two sentences</sub>
- **S3** Strength · Irritated: When you're wound up, simple and heavy beats clever. The main lifts get heavier and the reps come down, and every rep of Barbell Hip Thrust moves with intent. Attack each set, then actually take your rest.  
  <sub>FAIL: first sentence: sentence one does not make the cause explicit</sub>
- **S4** Strength · Bored: A little novelty goes a long way, so we built some in. Frog Pump comes in where you'd usually see something more familiar, and one of your lifts switches to one-and-a-half reps on the last set.  
  <sub>FAIL: first sentence: sentence one names the State but no concrete change it caused</sub>
- **S6** Strength · Stressed: Your head's full enough today, so the session isn't going to add to it. The reps stay controlled and rhythmic. Follow the plan, breathe between sets, and let the rhythm carry you.  
  <sub>FAIL: first sentence: sentence one names the State but no concrete change it caused</sub>
- **S7** Strength · Amped + Sore legs: With your legs sore, we built today around Upper Pull so they can recover. Neutral-Grip Lat Pulldown runs closer to the edge than usual, so that readiness turns into real work. Chest-Supported Machine Row finishes with a drop set.  
  <sub>FAIL: filler: \breal work\b; first sentence: sentence one names the soreness but not the State</sub>
- **S8** Strength · Low Energy + Amped: Machine Glute Kickback and Leg Extension leave a couple of good reps in the tank, but Barbell Hip Thrust runs closer to the edge than usual. Smooth reps today. You should walk out better than you walked in.  
  <sub>FAIL: filler: walk out better; first sentence: sentence one does not name what the user told us today; personal: low_energy not visible in the first two sentences; personal: amped not visible in the first two sentences</sub>
- **S9** Strength · Bored + Stressed · Upper Body: You want something new but not something complicated, and you can have both. Every rep moves at a steady, unhurried tempo, and Parallel Bar Dip and Bayesian Cable Curl come in where you'd usually see something more familiar.  
  <sub>FAIL: first sentence: two States told, sentence one resolves only one; personal: stressed not visible in the first two sentences</sub>
- **W1** Sweat · Stressed: Your head's full enough today, so the session isn't going to add to it. The pace stays somewhere you can repeat. Follow the plan, breathe between sets, and let the rhythm carry you.  
  <sub>FAIL: first sentence: sentence one names the State but no concrete change it caused</sub>
- **W2** Sweat · Amped: You showed up ready to go, and the session is built to take advantage. The main block runs at a harder pace. Spend the energy on the work that matters, not on rushing.  
  <sub>FAIL: filler: (work|things|stuff) that matters?; filler: take advantage; first sentence: sentence one does not make the cause explicit</sub>
- **W3** Sweat · Amped + Stressed: You've got energy but a busy head, so the effort goes up while the plan stays simple. You get one more round than usual, but the breaks between efforts get a little longer.  
  <sub>FAIL: first sentence: two States told, sentence one resolves only one; personal: amped not visible in the first two sentences</sub>
- **W4** Sweat · Low Energy + Bored · Engine: The effort sits at a level you can hold the whole way, so the energy you do have goes into quality work. Kickstand Dumbbell RDL and Dumbbell Floor Press come in where you'd usually see something more familiar.  
  <sub>FAIL: filler: quality work; first sentence: sentence one does not name what the user told us today; personal: low_energy not visible in the first two sentences; personal: bored not visible in the first two sentences</sub>
- **W5** Sweat · Irritated · 30 min: It's straight rounds today instead of a timed circuit, so that edge has somewhere useful to go. Thirty minutes, so the main work stays and the filler goes.  
  <sub>FAIL: filler: \bfiller\b; filler: somewhere useful</sub>
- **A0** Athletic · no State: Dumbbell Jump Squat goes first, while your legs are fresh, because explosive work only counts when it's fast. Then Landmine Push Press and Kettlebell Swing keep the explosive theme going. Fresh, fast and crisp beats tired and busy.  
  <sub>FAIL: filler: fresh, fast and crisp</sub>
- **A1** Athletic · Low Energy: The number of explosive sets comes down while each one stays full intent, so the energy you do have goes into quality work. It's done in about 35 minutes because everything that matters is already there. No filler.  
  <sub>FAIL: filler: quality work; filler: \bfiller\b; first sentence: sentence one does not name what the user told us today; personal: low_energy not visible in the first two sentences</sub>
- **A2** Athletic · Amped: Energy's high, so today asks a little more of you. Front Squat and Countermovement Jump are paired so the heavy set wakes up the explosive one. Push where it counts and let the rest take care of itself.  
  <sub>FAIL: filler: where it (counts|matters); filler: take care of itself; filler: asks a little more of you; first sentence: sentence one does not name what the user told us today; personal: amped not visible in the first two sentences</sub>
- **A3** Athletic · Sore legs: Your legs are sore, so the power work moves to the upper body with no jumping or sprinting. Today is built around upper-body power, starting with Dumbbell Push Press before any fatigue sets in. Every rep fast, every rest full.  
  <sub>FAIL: filler: every rep fast, every rest full</sub>
- **A4** Athletic · Irritated + Stressed: Broad Jump to Stick gives you something to hit hard, a few reps at a time, and the order is simple and nothing asks you to react on the fly. Attack each set, then actually take your rest.  
  <sub>FAIL: first sentence: two States told, sentence one resolves only one; personal: stressed not visible in the first two sentences</sub>
- **A5** Athletic · Bored: A little novelty goes a long way, so we built some in. Drop Jump brings something you haven't done lately. Treat the new pieces as a challenge, not a test.  
  <sub>FAIL: filler: not a test; first sentence: sentence one names the State but no concrete change it caused</sub>
- **X1** Sparse · Strength Arms · 30 min · beginner: EZ-Bar Preacher Curl sets the tone today, and the rest of the session builds around it. Thirty minutes, so the main work stays and the filler goes. Straightforward, focused, and built to leave you better, not wrecked.  
  <sub>FAIL: filler: \bfiller\b; filler: straightforward, (hard|focused); first sentence: no-State day: sentence one ignores the strongest real input</sub>
- **X2** Sparse · Sweat Engine · 30 min: The work comes in waves on the Treadmill Run so you can keep producing without fading halfway through. It should feel solidly hard, never frantic. Pace the first round like you'll have to repeat it, because you will.  
  <sub>FAIL: first sentence: no-State day: sentence one ignores the strongest real input</sub>
- **X3** Sparse · Athletic Speed + Plyo: Speed comes first while you're fresh: Pogo to Box Jump sets up today's vertical power work. The strength work comes last and still moves fast, building the engine behind the explosive stuff. Every rep fast, every rest full.  
  <sub>FAIL: filler: every rep fast, every rest full</sub>
- **P1** Personal · Strength · Amped · Chest + Triceps · build muscle · advanced: Your chest and triceps each get direct work, in that order. Parallel Bar Dip gets pushed a rep closer to failure, so that readiness turns into real work. For muscle, the volume lives in the accessory work.  
  <sub>FAIL: filler: \breal work\b; first sentence: sentence one does not name what the user told us today</sub>
- **P2** Personal · Strength · Low Energy · Quads + Glutes · build strength: Quads and glutes both get their own dedicated work. Every set leaves a couple of good reps in the tank, so every set you do has a purpose. Strength is the goal, so the main lift gets priority and everything else supports it.  
  <sub>FAIL: filler: has a purpose; first sentence: sentence one does not name what the user told us today; personal: low_energy not visible in the first two sentences</sub>
- **P3** Personal · Sweat · Irritated · Chest + Back · conditioning goal · free weights: Your chest and back shape the station picks, but it's still a conditioning session. The main block runs at a harder pace, so you can push hard without overthinking it.  
  <sub>FAIL: first sentence: sentence one does not name what the user told us today; personal: irritated not visible in the first two sentences</sub>
- **P4** Personal · Athletic · Amped + Sore shoulders · athleticism goal: Your shoulders are sore, so the explosive work stays in the legs and nothing goes overhead. The main movement steps up to Dumbbell Jump Squat. Since athleticism is the goal, speed and power lead and strength backs them up.  
  <sub>FAIL: first sentence: sentence one names the soreness but not the State; personal: amped not visible in the first two sentences</sub>
- **P5** Personal · Strength · Stressed + Sore lower back · feel-better goal: Your lower back is sore, so today is a Glutes + Legs session that leaves it alone. Every rep moves at a steady, unhurried tempo. You're training to feel better, so the work stays steady rather than punishing.  
  <sub>FAIL: first sentence: sentence one names the soreness but not the State; personal: stressed not visible in the first two sentences</sub>

## New pack

### S0 · Strength · no State
*Strength · Glutes + Legs* · 38 words · hook `structure` · first sentence PASS (structure) · gate PASS

> It's a Glutes + Legs day, and Barbell Hip Thrust leads it, heavy and early. The accessories come in pairs, so the session keeps moving once the heavy work is done. Take your full rest between the heavy sets.

<sub>Old synthesis line: As an intermediate lifter, rest-pause on the final set on Machine Glute Kickback is on the table. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: lead_lift, accessory_build</sub>

### S1 · Strength · Low Energy
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You're low on energy today, so every set leaves a couple of good reps in the tank, and you get stable, supported movements instead of balance-heavy ones. Leg Extension and Machine Glute Kickback each drop a set.

<sub>Old synthesis line: You're low on energy today, so we're keeping you further from failure, leaning into stable, low-friction movements and trimming accessory volume. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: further_from_failure, stable_choices, trimmed_extras</sub>

### S2 · Strength · Amped
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You've got extra energy today, so the accessories run a rep closer to failure than usual, and the last set of Machine Glute Kickback turns into a rest-pause. Barbell Hip Thrust anchors today, done heavy and early.

<sub>Old synthesis line: You're amped today, so we're taking Machine Glute Kickback and Leg Extension a rep closer to failure and using rest-pause on the final set on Machine Glute Kickback. As an intermediate lifter, rest-pause on the final set on Machine Glute Kickback is on the table. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: closer_to_failure, intensifier, lead_lift</sub>

### S3 · Strength · Irritated
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You came in wound up, so Barbell Hip Thrust goes heavy for fewer reps, and every rep of it moves with full intent. After that, 2 accessory movements add volume. Take your full rest between the heavy sets.

<sub>Old synthesis line: You're irritated today, so we're building the session around heavy, simple compound work and driving every rep of Barbell Hip Thrust with intent.</sub>

<sub>Story facts used: heavier_main, explosive_intent, accessory_build</sub>

### S4 · Strength · Bored
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You're bored of the usual, so Frog Pump comes in for your usual picks, and it switches to one-and-a-half reps on the last set. Heavy work leads today: Barbell Hip Thrust first, while you're fresh.

<sub>Old synthesis line: You're bored today, so we're changing the feel with 1.5 reps on the Frog Pump and bringing in 1 less-familiar movement. As an intermediate lifter, 1.5 reps on Frog Pump is on the table.</sub>

<sub>Story facts used: fresh_movements, intensifier, lead_lift</sub>

### S5 · Strength · Sore shoulders
*Strength · Glutes + Legs* · 39 words · hook `sore` · first sentence PASS (state) · gate PASS

> Your shoulders are sore, so we built today around Glutes + Legs so they can recover. The big lift comes first: Barbell Hip Thrust, heavy, while you've got the most to give. Take your full rest between the heavy sets.

<sub>Old synthesis line: Your shoulders are sore, so we're moving the work elsewhere: today is a Glutes + Legs session that leaves them alone. As an intermediate lifter, the top-set scheme is in play.</sub>

<sub>Story facts used: sore_reroute, lead_lift</sub>

### S6 · Strength · Stressed
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You're stressed today, so every rep moves at a steady, controlled tempo. The big lift comes first: Barbell Hip Thrust, heavy, while you've got the most to give. Keep every rep smooth; there's no clock on this one.

<sub>Old synthesis line: You're stressed today, so the session runs on autopilot: controlled, rhythmic reps. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: controlled_tempo, lead_lift</sub>

### S7 · Strength · Amped + Sore legs
*Strength · Upper Pull* · 37 words · hook `state` · first sentence PASS (state) · gate PASS

> Amped today: Neutral-Grip Lat Pulldown gets pushed a rep closer to failure. Your legs are sore too, so they get the day off while Upper Pull takes over. Take those sets to the last clean rep.

<sub>Old synthesis line: Your legs are sore, so we're moving the work elsewhere: today is an Upper Pull session that leaves them alone. You're amped today, so we're taking Neutral-Grip Lat Pulldown a rep closer to failure and using drop set on the final set on Chest-Supported Machine Row. As an intermediate lifter, drop set on the final set on Chest-Supported Machine Row is on the table.</sub>

<sub>Story facts used: closer_to_failure, sore_reroute</sub>

### S8 · Strength · Low Energy + Amped
*Strength · Glutes + Legs* · 40 words · hook `pair` · first sentence PASS (state) · gate PASS

> You're amped but low on energy, so energy sets the budget and the drive goes into one place: Barbell Hip Thrust gets pushed a rep closer to failure. Machine Glute Kickback and Leg Extension stop a little further from failure.

<sub>Old synthesis line: You're amped but running on less energy than usual, so energy sets the budget and the readiness goes into one place: Barbell Hip Thrust. Everything around it stays further from failure. As an intermediate lifter, 1.5 reps on Machine Glute Kickback is on the table. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: closer_to_failure, further_from_failure</sub>

### S9 · Strength · Bored + Stressed · Upper Body
*Strength · Upper Body* · 38 words · hook `pair` · first sentence PASS (state) · gate PASS

> You're bored but stressed, so the new stuff is in the movements, not the structure: Parallel Bar Dip replaces a usual pick, while the reps stay controlled and rhythmic. Today opens with Dumbbell Bench Press while you're fresh.

<sub>Old synthesis line: You're bored and stressed, so the novelty is in the movements (3 less-familiar ones) while the structure stays plain and predictable.</sub>

<sub>Story facts used: fresh_movements, controlled_tempo, lead_lift</sub>

### W0 · Sweat · no State
*Sweat · Hybrid* · 35 words · hook `structure` · first sentence PASS (structure) · gate PASS

> Sled Push and Single-Arm Overhead Carry sit between trips to the Row Erg, so the engine work never stops for long. After the main block, a quick Treadmill Run piece tops off the conditioning.

<sub>Story facts used: sweat_shape, second_piece</sub>

### W1 · Sweat · Stressed
*Sweat · Circuit* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You've got a lot on your mind today, so the pace sits where you can hold it every round. Farmer Carry, Kettlebell Deadlift and Dead Bug come around every round, so the goal is output you can repeat.

<sub>Old synthesis line: You're stressed, so the session runs in fixed, repeatable rounds of Farmer Carry, Kettlebell Deadlift, Dead Bug and Push-Up at a controlled effort: settle in and just work, no clock to race.</sub>

<sub>Story facts used: sustainable_pace, sweat_shape</sub>

### W2 · Sweat · Amped
*Sweat · Circuit* · 34 words · hook `state` · first sentence PASS (state) · gate PASS

> You've got extra energy today, so the target effort for the main block goes up a notch. Every minute on the minute, so the clock sets the pace. Expect the later rounds to bite.

<sub>Old synthesis line: You're amped, so that readiness goes into a harder pace.</sub>

<sub>Story facts used: harder_pace, sweat_shape</sub>

### W3 · Sweat · Amped + Stressed
*Sweat · Engine* · 38 words · hook `pair` · first sentence PASS (state) · gate PASS

> Amped but stressed means more effort, not more complexity: you get one more round than usual, while you get more recovery between efforts. Hard efforts and short breaks on the Air Bike, repeated until the block is done.

<sub>Old synthesis line: You're amped but stressed, so the session stays simple and predictable (long intervals) and the extra energy goes into an extra round on the Air Bike rather than into a busier structure. A balanced session, which is the point of a consistency goal.</sub>

<sub>Story facts used: extra_round, more_recovery, sweat_shape</sub>

### W4 · Sweat · Low Energy + Bored · Engine
*Sweat · Engine* · 45 words · hook `pair` · first sentence PASS (state) · gate PASS

> You're bored but low on energy, so the change comes from new movements, not more work: Kickstand Dumbbell RDL replaces a usual pick, and the pace sits where you can hold it every round. Go a little lighter on the new movements until they click.

<sub>Old synthesis line: You're bored and low on energy, so the change of scenery comes from the modality and the stations, not from more work: long intervals at a sustainable effort. A balanced session, which is the point of a consistency goal.</sub>

<sub>Story facts used: fresh_movements, sustainable_pace</sub>

### W5 · Sweat · Irritated · 30 min
*Sweat · Circuit* · 37 words · hook `state` · first sentence PASS (state) · gate PASS

> Since you came in wound up, it's straight rounds instead of a timed circuit. With 30 minutes, the session trims to 4 exercises and Air Bike still leads. Settle into the new format on the first round.

<sub>Old synthesis line: You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. A balanced session, which is the point of a consistency goal.</sub>

<sub>Story facts used: shape_change, short_window</sub>

### A0 · Athletic · no State
*Athletic · Power* · 37 words · hook `structure` · first sentence PASS (structure) · gate PASS

> Today is built around vertical power, starting with Dumbbell Jump Squat before any fatigue sets in. Then Landmine Push Press and Kettlebell Swing keep the explosive theme going. If a rep slows down, the set is done.

<sub>Old synthesis line: Today is primarily vertical power: Dumbbell Jump Squat comes first, while you're fresh, then Landmine Push Press for upper-body power and Kettlebell Swing for total-body explosiveness, and Front-Foot Elevated Split Squat and Push-Up, done for bar speed, build the strength behind it.</sub>

<sub>Story facts used: quality_first, then_more</sub>

### A1 · Athletic · Low Energy
*Athletic · Power* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> You're low on energy today, so there are fewer explosive sets, and each one is all-out, plus the landings get cut back. Every movement is simple to coordinate. If a rep slows down, the set is done.

<sub>Old synthesis line: You're low on energy, so today's athletic work stays focused: 2 athletic movements instead of 3, 6 explosive sets and simple movements. You still train explosively without turning the session into a grind. Today is primarily horizontal power: Lateral Box Jump comes first, while you're fresh, then Med-Ball Chest Pass for upper-body power, and Dumbbell Step-Up and Suspension Trainer Row, done for bar speed, build the strength behind it.</sub>

<sub>Story facts used: fewer_efforts, less_impact, simple_power</sub>

### A2 · Athletic · Amped
*Athletic · Power* · 40 words · hook `state` · first sentence PASS (state) · gate PASS

> Amped today: every heavy set of Front Squat goes straight into Countermovement Jump. Then Kettlebell Swing, Dumbbell Push Press and Med-Ball Rotational Slam keep the explosive theme going. Rest fully after each pair so the explosive reps stay fast.

<sub>Old synthesis line: You're amped, so we're spending that readiness on quality rather than piling on volume: a heavy-light contrast pair (Front Squat into Countermovement Jump) and heavier strength work (Front Squat at 3 reps, about 1 from failure), with the jumps, throws and lifts kept low-rep and explosive. Today is primarily vertical power: heavy Front Squat paired with Countermovement Jump, so the heavy set primes the explosive one, with full recovery after every pair, then Kettlebell Swing for total-body explosiveness, Dumbbell Push Press for upper-body power and Med-Ball Rotational Slam for rotational power.</sub>

<sub>Story facts used: contrast, then_more</sub>

### A3 · Athletic · Sore legs
*Athletic · Power* · 35 words · hook `sore` · first sentence PASS (state) · gate PASS

> Your legs are sore, so the power work moves to the upper body with no jumping or sprinting. Today is built around upper-body power, starting with Dumbbell Push Press before any fatigue sets in.

<sub>Old synthesis line: Your legs are sore, so the power work moves to the upper body: Dumbbell Push Press and Med-Ball Rotational Slam, with no jumping or sprinting. Today is primarily upper-body power: Dumbbell Push Press comes first, while you're fresh, then Med-Ball Rotational Slam for rotational power and Med-Ball Shot-Put Throw for more rotational power, and Single-Arm Dumbbell Row and Half-Kneeling Single-Arm Landmine Press, done for bar speed, build the strength behind it.</sub>

<sub>Story facts used: sore_shift_upper, quality_first</sub>

### A4 · Athletic · Irritated + Stressed
*Athletic · Full-Body Athlete* · 39 words · hook `pair` · first sentence PASS (state) · gate PASS

> Irritated and stressed means hard work without the chaos: Broad Jump to Stick leads, kept to a few hard reps so it stays explosive, and there are no reactive or complicated drills. Hit each rep hard, then reset fully.

<sub>Old synthesis line: You're irritated and stressed, so it's simple explosive work without complicated drills: Broad Jump to Stick first, then straightforward strength. Today is primarily horizontal power: Broad Jump to Stick comes first, while you're fresh, then Dumbbell Push Press for upper-body power and Med-Ball Rotational Throw for rotational power, and Barbell Hip Thrust, done for bar speed, builds the strength behind it.</sub>

<sub>Story facts used: forceful_athletic, no_chaos</sub>

### A5 · Athletic · Bored
*Athletic · Speed + Plyo* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> Bored today: there's lateral and rotational work you don't usually see. Today is built around elastic, reactive ability, starting with Drop Jump before any fatigue sets in. Give the new movements one crisp set before going all-out.

<sub>Old synthesis line: You're bored, so we're changing the movement experience with Drop Jump, lateral and rotational work and different tools (box, landmine, med ball) rather than simply adding more work. Today is primarily elastic, reactive ability: Drop Jump comes first, while you're fresh, then Lateral Bound to Box Jump for horizontal power, Landmine Rotational Punch for rotational power and Step-Behind Rotational Throw for more rotational power.</sub>

<sub>Story facts used: fresh_athletic, quality_first</sub>

### X1 · Sparse · Strength Arms · 30 min · beginner
*Strength · Arms* · 38 words · hook `input` · first sentence PASS (input) · gate PASS

> You're newer to lifting, so every movement is beginner-friendly and every set keeps at least two reps in reserve. You've got 30 minutes, so it's a tight 3-exercise session with EZ-Bar Preacher Curl up first.

<sub>Old synthesis line: As a newer lifter, you get approachable movements and two reps in reserve on the main work; the progress comes from adding load, not from grinding. The session stays balanced rather than specialised, which is the point of a consistency goal.</sub>

<sub>Story facts used: level_beginner, short_window</sub>

### X2 · Sparse · Sweat Engine · 30 min
*Sweat · Engine* · 38 words · hook `input` · first sentence PASS (input) · gate PASS

> You've got 30 minutes, so it's one focused block on the Treadmill Run. It should feel solidly hard, never frantic. The work comes in waves on the Treadmill Run so you can keep producing without fading halfway through.

<sub>Old synthesis line: A balanced session, which is the point of a consistency goal.</sub>

<sub>Story facts used: short_window, effort_band, sweat_shape</sub>

### X3 · Sparse · Athletic Speed + Plyo
*Athletic · Speed + Plyo* · 36 words · hook `structure` · first sentence PASS (structure) · gate PASS

> Today is built around vertical power, starting with Pogo to Box Jump before any fatigue sets in. Then Lateral Bound to Box Jump, Landmine Push Press and Med-Ball Rotational Slam keep the explosive theme going.

<sub>Old synthesis line: Today is primarily vertical power: Pogo to Box Jump comes first, while you're fresh, then Lateral Bound to Box Jump for horizontal power, Landmine Push Press for upper-body power and Med-Ball Rotational Slam for rotational power, and Trap-Bar Jump Squat, done for bar speed, builds the strength behind it.</sub>

<sub>Story facts used: quality_first, then_more</sub>

### P1 · Personal · Strength · Amped · Chest + Triceps · build muscle · advanced
*Strength · Upper Push* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> Since you're amped, Parallel Bar Dip gets pushed a rep closer to failure, and Dumbbell Bench Press goes heavy for fewer reps. With chest and triceps as your Target, each gets its own direct work, in that order.

<sub>Old synthesis line: You're amped today, so we're taking Parallel Bar Dip a rep closer to failure and pushing the main lifts to the heavy end of their range. You're advanced, so Dumbbell Bench Press runs to a rep from failure, and your muscle goal is why 3 accessory movements sit behind the main lifts at moderate reps. Both chest and triceps get direct work, in that order.</sub>

<sub>Story facts used: closer_to_failure, heavier_main, target_split</sub>

### P2 · Personal · Strength · Low Energy · Quads + Glutes · build strength
*Strength · Glutes + Legs* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> Running low today: every set leaves a couple of good reps in the tank. With quads and glutes as your Target, each gets its own direct work, in that order. Stop each set with two good reps left.

<sub>Old synthesis line: You're low on energy today, so we're keeping you further from failure. Your strength goal keeps Barbell Hip Thrust heavy and the accessories in a supporting role. Both quads and glutes get direct work, in that order.</sub>

<sub>Story facts used: further_from_failure, target_split</sub>

### P3 · Personal · Sweat · Irritated · Chest + Back · conditioning goal · free weights
*Sweat · Circuit* · 38 words · hook `state` · first sentence PASS (state) · gate PASS

> The main block runs at a harder pace, because you came in wound up. You asked for chest and back, so the stations lean that way, and it's still a conditioning session. Expect the later rounds to bite.

<sub>Old synthesis line: You're irritated, so that energy gets somewhere physical to go: Burpee, Dumbbell Push Press and Front-Rack Carry. The movements stay simple so you can focus on output, not coordination. You asked for chest + back, so the stations lean that way. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.</sub>

<sub>Story facts used: harder_pace, target_lean</sub>

### P4 · Personal · Athletic · Amped + Sore shoulders · athleticism goal
*Athletic · Full-Body Athlete* · 39 words · hook `state` · first sentence PASS (state) · gate PASS

> Amped today: the main movement steps up to Dumbbell Jump Squat, and it gets an extra set, still low-rep and fast. Your shoulders are sore too, so the explosive work stays in the legs and nothing goes overhead.

<sub>Old synthesis line: Your shoulders are sore, so the power work stays in the lower body (Dumbbell Jump Squat) and nothing is pressed or thrown overhead. You're amped, so we're spending that readiness on quality rather than piling on volume: one extra quality set of Dumbbell Jump Squat, with the jumps, throws and lifts kept low-rep and explosive. Today is primarily vertical power: Dumbbell Jump Squat comes first, while you're fresh, then Kettlebell Swing for total-body explosiveness and Med-Ball Shot-Put Throw for rotational power, and Bulgarian Split Squat, done for bar speed, builds the strength behind it.</sub>

<sub>Story facts used: demanding_primary, extra_quality_set, sore_shift_lower</sub>

### P5 · Personal · Strength · Stressed + Sore lower back · feel-better goal
*Strength · Glutes + Legs* · 37 words · hook `state` · first sentence PASS (state) · gate PASS

> You've got a lot on your mind today, so every rep moves at a steady, controlled tempo. Your lower back is sore too, so the session moves to Glutes + Legs and keeps it out of the work.

<sub>Old synthesis line: Your lower back is sore, so we're moving the work away from it: today is a Glutes + Legs session that leaves it alone. You're stressed today, so the session runs on autopilot: controlled, rhythmic reps. Your feel-better goal keeps the compound work two reps from failure: steady, not grinding.</sub>

<sub>Story facts used: controlled_tempo, sore_reroute</sub>

### R1 · Repeat ×5 · Strength · Low Energy

1. Low energy today: every working set stops a little further from failure, and Leg Extension and Machine Glute Kickback each drop a set. There's no pairing or circuit to manage. Stop each set with two good reps left.  *(state, overlap with earlier 0.0)*
2. Every set leaves a couple of good reps in the tank, and you get stable, supported movements instead of balance-heavy ones, because you're low on energy. It's straight sets, one exercise at a time.  *(state, overlap with earlier 0.0)*
3. Your energy's low today, so Leg Extension comes out. The big lift comes first: Barbell Hip Thrust, heavy, while you've got the most to give. Put what you have into the main lifts.  *(state, overlap with earlier 0.0)*
4. You're running low today, so every working set stops a little further from failure, and the main lifts use moderate weights with a few more reps. It's a Glutes + Legs day, starting with Barbell Hip Thrust while you're fresh.  *(state, overlap with earlier 0.123)*
5. Every working set stops a little further from failure, because your energy's low today. The movements lean stable and supported. If a rep starts to grind, that set is done.  *(state, overlap with earlier 0.123)*

### R2 · Repeat ×5 · Sweat · no State

1. The Row Erg anchors every round, with Sled Push and Farmer Carry in between. It should feel solidly hard, never frantic. After the main block, a quick Air Bike piece tops off the conditioning.  *(structure, overlap with earlier 0.0)*
2. Same stations, every round: Kettlebell Snatch, Push-Up and Burpee, so you can settle in and hold your pace. A shorter second piece on the Air Bike follows the main block.  *(structure, overlap with earlier 0.017)*
3. The reps climb each round, so the session builds on itself. Then a short Treadmill Run block finishes the session. Hard enough to count, controlled enough to repeat.  *(structure, overlap with earlier 0.0)*
4. Today is built on repeatable rounds of Kettlebell Swing, Push-Up and Overhead Carry, not one huge redline effort. Then a short Air Bike block finishes the session.  *(structure, overlap with earlier 0.061)*
5. Sled Push and Front-Rack Carry sit between trips to the Row Erg, so the engine work never stops for long. It should feel solidly hard, never frantic.  *(structure, overlap with earlier 0.137)*

### R3 · Repeat ×5 · Athletic · Amped

1. Extra energy today: you get a tougher main movement in Kettlebell Snatch. The strength work (Dumbbell Jump Squat) comes last and is done for speed, not grinding. Own the first rep of every set; speed beats load.  *(state, overlap with earlier 0.0)*
2. You came in amped, so the main movement steps up to Dumbbell Jump Squat. Bulgarian Split Squat gets heavier. If a rep slows down, the set is done.  *(state, overlap with earlier 0.017)*
3. Since you came in with extra energy, every heavy set of Front Squat goes straight into Box Jump. Then Lateral Single-Leg Hop to Stick, Dumbbell Push Press and Med-Ball Rotational Throw keep the explosive theme going.  *(state, overlap with earlier 0.016)*
4. Amped today: every heavy set of Barbell Romanian Deadlift goes straight into Broad Jump to Stick. Then Hang Clean to Box Knee Drive, Single-Leg Box Jump and Med-Ball Slam keep the explosive theme going. Rest fully after each pair so the explosive reps stay fast.  *(state, overlap with earlier 0.095)*
5. You've got extra energy today, so you get a tougher main movement in Hang Clean to Box Knee Drive. The strength work goes heavier, starting with Front Squat.  *(state, overlap with earlier 0.13)*

### R4 · Repeat ×5 · Strength · Amped + Sore shoulders

1. You're amped today, so Trap-Bar Deadlift gets pushed a rep closer to failure. Your shoulders are sore too, so today is a Glutes + Legs session that leaves them alone. Take those sets to the last clean rep.  *(state, overlap with earlier 0.0)*
2. You're amped but your shoulders are sore, so they get the day off while Glutes + Legs takes over and the extra effort goes there: Barbell Hip Thrust goes heavy for fewer reps. Machine Glute Kickback finishes with a rest-pause.  *(state, overlap with earlier 0.028)*
3. Your shoulders are sore and you're amped, so the session moves to Glutes + Legs and keeps them out of the work, and that's where the readiness goes: the accessories run a rep closer to failure than usual. Barbell Hip Thrust anchors today, done heavy and early.  *(state, overlap with earlier 0.067)*
4. Since you came in with extra energy, Trap-Bar Deadlift runs a rep closer to failure than usual, and the main lifts get heavier and the reps come down. Your shoulders are sore too, so they get the day off while Glutes + Legs takes over.  *(state, overlap with earlier 0.157)*
5. You've got extra energy today, so Barbell Hip Thrust gets an extra working set. Your shoulders are sore too, so the session moves to Glutes + Legs and keeps them out of the work.  *(state, overlap with earlier 0.25)*

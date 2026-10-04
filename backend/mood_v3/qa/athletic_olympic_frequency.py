"""Olympic-derivative frequency, no State, commercial gym: 120 sessions per level x goal (60 users x 30 / 60 min).
    python -m mood_v3.qa.athletic_olympic_frequency
"""
from mood_v3 import service as S
OLY = {'hang_power_clean', 'power_snatch', 'split_jerk', 'push_press', 'hang_high_pull', 'db_hang_power_clean', 'db_snatch', 'kb_snatch', 'hang_clean_to_box_knee_drive'}
BAR = {'hang_power_clean', 'power_snatch', 'split_jerk', 'push_press', 'hang_high_pull'}
GOALS = ['improve_athleticism', 'build_strength', 'build_muscle', 'stay_consistent', 'lose_weight_conditioning', 'feel_better_reduce_stress']
if __name__ == '__main__':
    for lv in ('beginner', 'intermediate', 'advanced'):
        for g in GOALS:
            n = a = b = 0
            for u in range(60):
                for dur in (30, 60):
                    env, _ = S.generate_workout(dict(direction='athletic', experience=lv, duration=dur, goal=g, states=[], date='2026-10-12'), f'of{u}|{lv}|{g}|{dur}')
                    ids = {it['exercise']['id'] for bl in env['workout']['blocks'] for it in bl['items']}
                    n += 1; a += bool(ids & OLY); b += bool(ids & BAR)
            print(f"{lv:12} {g:26} any {a / n:4.0%}  barbell {b / n:4.0%}")

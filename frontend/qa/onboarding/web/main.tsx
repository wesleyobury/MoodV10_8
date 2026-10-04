import React from 'react'; import { AppRegistry, View } from 'react-native';
import Intro from '../../../app/onboarding-funnel/intro';
import Pref from '../../../app/onboarding-funnel/v3-preference';
import Goal from '../../../app/onboarding-funnel/v3-goal';
import Exp from '../../../app/onboarding-funnel/v3-experience';
import Freq from '../../../app/onboarding-funnel/v3-frequency';
import Barrier from '../../../app/onboarding-funnel/v3-barrier';
import Proof from '../../../app/onboarding-funnel/step-6-social-proof';
import Reveal from '../../../app/onboarding-funnel/profile-reveal';
import { ProfileConstruction } from '../../../components/onboarding/ProfileConstruction';
import V3Build from '../../../app/v3/build';
import { barrierPrefill } from '../../../utils/v3Profile';
import { router as stubRouter, _setCurrent } from '../../v3/web/stubs/router';

const FULL = { trainingPreference: 'lifting', v3Goal: 'build_strength', experience: 'advanced', experienceDetail: 'serious', trainingFrequency: '3-4', barrier: 'boredom', v3Mode: 'new', firstName: 'Wesley' };
const ORDER = ['trainingPreference', 'v3Goal', 'experienceDetail', 'trainingFrequency', 'barrier'];
const ROUTES: Record<string, [React.ComponentType<any>, number]> = {
  intro: [Intro, 0], preference: [Pref, 0], goal: [Goal, 1], experience: [Exp, 2], frequency: [Freq, 3], barrier: [Barrier, 4],
  proof: [Proof, 5], build: [ProfileConstruction, 5], reveal: [Reveal, 5], buildscreen: [V3Build, 5],
};
const h = new URLSearchParams(location.hash.slice(1).replace(/^([a-z]+)/, 'r=$1'));
const route = h.get('r') || 'intro';
const [Screen, answered] = ROUTES[route] ?? ROUTES.intro;
const sel = h.get('sel') === '1';
const preset = h.get('p'); // optional JSON override
const a: any = { v3Mode: 'new', firstName: 'Wesley' };
const n = answered + (sel ? 1 : 0);
for (const k of ORDER.slice(0, Math.max(n, route === 'build' || route === 'reveal' || route === 'proof' ? 5 : n))) a[k] = (FULL as any)[k];
if (n >= 3 || route === 'build' || route === 'reveal') a.experience = FULL.experience;
if (preset) Object.assign(a, JSON.parse(decodeURIComponent(preset)));
(window as any).__answers = a;
if (route === 'buildscreen') {
  // Build opened by Home right after the reveal: the first-Home handoff the construction screen wrote.
  const dir = ({ lifting: 'strength', conditioning: 'sweat', athletic: 'athletic' } as any)[a.trainingPreference] ?? 'strength';
  const profile = { training_preference: a.trainingPreference, goal: a.v3Goal, experience: a.experience, training_frequency: a.trainingFrequency, biggest_barrier: a.barrier };
  localStorage.clear();
  localStorage.setItem('@mood_v3_first_home_v1:u1', JSON.stringify({ version: 1, pending: true, created_at: new Date().toISOString(), mode: 'new', default_direction: dir, default_duration: 60, default_equipment: 'commercial_gym', profile, prefill: barrierPrefill(a.barrier), launch_build: false }));
  // stale state from an earlier run on this device (the bug Wes hit in dev): last Direction Strength, today's State Stressed
  localStorage.setItem('@mood_v3_last_direction_v1:u1', 'strength');
  localStorage.setItem('@mood_v3_day_states_v1:u1', JSON.stringify({ date: new Date().toLocaleDateString('en-CA'), states: ['stressed'], soreness: [], set: true }));
  stubRouter.replace({ pathname: '/v3/build', params: { first: '1' } });
  _setCurrent((window as any).__stack[0]);
}
function App() { return <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}><Screen /></View>; }
AppRegistry.registerComponent('App', () => App);
AppRegistry.runApplication('App', { rootTag: document.getElementById('root') });

import React from 'react'; import { AppRegistry, View, ScrollView, Text } from 'react-native';
import V3Home from '../../../components/v3/V3Home'; import V3WorkoutScreen from '../../../app/v3/workout'; import V3Session from '../../../app/v3/session'; import V3Details from '../../../app/v3/details'; import { PreviewSections } from '../../../components/v3/PreviewSections';
import { WorkoutOverview } from '../../../components/v3/WorkoutOverview';
import { useCurrentRoute, _setCurrent } from './stubs/router';
const PACK: any[] = require('../../../utils/dev/v3PackFixture.json');
function App() {
  const hash = typeof location !== 'undefined' ? location.hash.slice(1) : '';
  if (hash.startsWith('pack=')) {
    const [k, mode] = hash.slice(5).split('/');
    const e = PACK.find((p) => p.key === k);
    return <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>{e?.envelope.workout && mode === 'preview' ? <View><Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{e.envelope.workout.archetype.name}</Text><Text style={{ color: '#999' }}>{e.envelope.workout.duration.display}</Text><PreviewSections workout={e.envelope.workout} /></View> : e?.envelope.workout ? <WorkoutOverview envelope={e.envelope} onSwap={() => {}} /> : <Text style={{ color: '#fff' }}>{JSON.stringify(e?.envelope.conflict)}</Text>}</ScrollView>;
  }
  const r = useCurrentRoute(); const stack: any[] = (window as any).__stack;
  // Keep every stacked screen mounted (like a native stack); only the top is visible.
  return <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>{stack.map((rt, i) => { _setCurrent(rt); const S = rt.pathname === '/v3/workout' ? V3WorkoutScreen : rt.pathname === '/v3/session' ? V3Session : rt.pathname === '/v3/details' ? V3Details : V3Home; return <View key={i + rt.pathname + JSON.stringify(rt.params)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: i === stack.length - 1 ? 'flex' : 'none' } as any}><S /></View>; })}</View>;
}
AppRegistry.registerComponent('App', () => App);
AppRegistry.runApplication('App', { rootTag: document.getElementById('root') });

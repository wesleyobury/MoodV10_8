import React from 'react'; import { View } from 'react-native';
const INS = { top: 47, bottom: 34, left: 0, right: 0 };
export const useSafeAreaInsets = () => INS;
export const SafeAreaView = ({ style, edges = ['top', 'bottom', 'left', 'right'], ...p }: any) => (
  <View {...p} style={[style, { paddingTop: edges.includes('top') ? INS.top : 0, paddingBottom: edges.includes('bottom') ? INS.bottom : 0 }]} />
);

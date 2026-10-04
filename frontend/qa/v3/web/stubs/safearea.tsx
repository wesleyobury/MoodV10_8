import React from 'react'; import { View } from 'react-native';
export const useSafeAreaInsets = () => ({ top: 47, bottom: 34, left: 0, right: 0 });
export const SafeAreaView = (p: any) => <View {...p} />;

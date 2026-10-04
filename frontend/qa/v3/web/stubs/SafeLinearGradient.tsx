import React from 'react'; import { View } from 'react-native';
export function SafeLinearGradient({ colors, start, end, style, children }: any) {
  const ang = start && end ? Math.round((Math.atan2((end.x - start.x), -(end.y - start.y)) * 180) / Math.PI) : 180;
  return <View style={[style, { backgroundImage: `linear-gradient(${ang}deg, ${colors.join(',')})` } as any]}>{children}</View>;
}

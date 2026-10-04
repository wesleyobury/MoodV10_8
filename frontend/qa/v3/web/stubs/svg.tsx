// react-native-svg for the web harness: plain DOM SVG elements (QA only).
import React from 'react';
const el = (tag: string) => ({ children, style, ...p }: any) => React.createElement(tag, { ...p, style: Array.isArray(style) ? Object.assign({}, ...style) : style }, children);
const Svg = ({ children, width, height, style, viewBox }: any) =>
  React.createElement('svg', { width, height, viewBox, style: { position: style ? 'absolute' : undefined, left: 0, top: 0 } }, children);
export default Svg;
export const Circle = el('circle'), Path = el('path'), G = el('g'), Rect = el('rect'), Line = el('line'), Ellipse = el('ellipse'), Defs = el('defs'),
  LinearGradient = el('linearGradient'), RadialGradient = el('radialGradient'), Stop = el('stop'), ClipPath = el('clipPath'), Polygon = el('polygon'), Polyline = el('polyline'), Text = el('text'), Mask = el('mask');
export { Svg };

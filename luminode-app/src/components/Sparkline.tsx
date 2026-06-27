import React from 'react';
import Svg, { Polyline, Polygon } from 'react-native-svg';
import { Colors } from '../theme/tokens';

interface Props {
  color?: string;
  width?: number;
  height?: number;
}

const DATA = [4, 5, 3, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 12];

export default function Sparkline({ color = Colors.brandGlow, width = 100, height = 24 }: Props) {
  const max = 12;
  const step = width / (DATA.length - 1);

  const points = DATA.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');
  const fillPts = `0,${height} ${points} ${width},${height}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polygon points={fillPts} fill={color} fillOpacity={0.12} />
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

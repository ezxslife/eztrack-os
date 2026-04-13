import { StyleSheet, View } from "react-native";

import { useThemeColors, useThemeSpacing } from "@/theme";

export interface MiniChartProps {
  data: number[];
  type?: "line" | "bar" | "sparkline";
  color?: string;
  height?: number;
  width?: number;
  showLabels?: boolean;
}

function normalizeData(data: number[]): number[] {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return data.map((value) => (value - min) / range);
}

function LineChart({
  data,
  color,
  height,
  width,
}: {
  data: number[];
  color: string;
  height: number;
  width: number;
}) {
  const normalized = normalizeData(data);
  const spacing = useThemeSpacing();
  const colors = useThemeColors();

  if (normalized.length === 0) {
    return <View style={{ width, height, backgroundColor: colors.backgroundMuted }} />;
  }

  const pointSpacing = width / (normalized.length - 1 || 1);
  const points = normalized.map((value, index) => ({
    x: index * pointSpacing,
    y: height - value * height,
  }));

  return (
    <View style={{ width, height, position: "relative" }}>
      {/* Area fill */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: height * (1 - (normalized[0] || 0)),
          backgroundColor: `${color}20`,
        }}
      />

      {/* Line points */}
      {points.map((point, index) => (
        <View
          key={`point-${index}`}
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: color,
            left: point.x - 1.5,
            top: point.y - 1.5,
          }}
        />
      ))}
    </View>
  );
}

function BarChart({
  data,
  color,
  height,
  width,
}: {
  data: number[];
  color: string;
  height: number;
  width: number;
}) {
  const normalized = normalizeData(data);
  const spacing = useThemeSpacing();

  if (normalized.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: "rgba(107, 114, 128, 0.1)",
          borderRadius: 4,
        }}
      />
    );
  }

  const barWidth = Math.max(2, width / normalized.length - spacing[0.5]);
  const gapWidth = Math.max(1, width / normalized.length - barWidth);

  return (
    <View style={{ width, height, flexDirection: "row", alignItems: "flex-end", gap: gapWidth }}>
      {normalized.map((value, index) => (
        <View
          key={`bar-${index}`}
          style={{
            width: barWidth,
            height: Math.max(2, value * height),
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function SparklineChart({
  data,
  color,
  height,
  width,
}: {
  data: number[];
  color: string;
  height: number;
  width: number;
}) {
  const normalized = normalizeData(data);
  const colors = useThemeColors();

  if (normalized.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: colors.backgroundMuted,
          borderRadius: 4,
        }}
      />
    );
  }

  const pointSpacing = width / (normalized.length - 1 || 1);
  const points = normalized.map((value, index) => ({
    x: index * pointSpacing,
    y: height - value * height,
  }));

  return (
    <View style={{ width, height, position: "relative" }}>
      {/* Gradient area below line */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          backgroundColor: `${color}15`,
          borderRadius: 4,
        }}
      />

      {/* Subtle line */}
      {points.map((point, index) => {
        if (index === 0) return null;
        const prev = points[index - 1];

        return (
          <View
            key={`line-${index}`}
            style={{
              position: "absolute",
              left: prev.x,
              top: prev.y,
              width: Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2)),
              height: 1,
              backgroundColor: color,
              opacity: 0.6,
              transform: [
                {
                  rotate: `${Math.atan2(point.y - prev.y, point.x - prev.x)}rad`,
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

export function MiniChart({
  data,
  type = "sparkline",
  color: customColor,
  height = 48,
  width = 100,
  showLabels = false,
}: MiniChartProps) {
  const colors = useThemeColors();
  const color = customColor || colors.brandText;

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View style={styles.container}>
      {type === "line" && <LineChart data={data} color={color} height={height} width={width} />}
      {type === "bar" && <BarChart data={data} color={color} height={height} width={width} />}
      {type === "sparkline" && (
        <SparklineChart data={data} color={color} height={height} width={width} />
      )}
    </View>
  );
}

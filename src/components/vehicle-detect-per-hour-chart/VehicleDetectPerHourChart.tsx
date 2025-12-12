import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  LabelProps,
  ResponsiveContainer
} from "recharts";

// Types
import type { VehicleDetectPerHourChartData } from "../../features/chart/types";

// Utils
import { formatNumber } from "../../utils/commonFunction";

type VehicleDetectPerHourChartProps = {
  data: VehicleDetectPerHourChartData[];
  isPrint?: boolean;
};

const renderCustomizedLabel = (props: LabelProps, isPrint: boolean = false) => {
  const { x, y, value } = props;

  if (x == null || y == null || Number(value) === 0) return null;

  const barWidth = 35;
  const rectWidth = 50;
  const rectHeight = 30;
  const centerX = Number(x) + barWidth / 2;
  const rectX = centerX - rectWidth / 2;
  const rectY = Number(y) - rectHeight - 12;

  return (
    <g>
      <rect
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        rx={15}
        ry={15}
        fill="#9DBDE499"
      />

      <text
        x={centerX}
        y={rectY + rectHeight / 2}
        fill={!isPrint ? "#F7FAFE" : "#000000"}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
      >
        {formatNumber(Number(value))}
      </text>
    </g>
  );
};

const VehicleDetectPerHourChart: React.FC<VehicleDetectPerHourChartProps> = ({
  data,
  isPrint = false
}) => {

  const maxValue = Math.max(...data.map(d => d.count));

  return (
    <div style={{ width: "100%", height: "380px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 40, right: 0, left: 0, bottom: 10 }}
          style={{ pointerEvents: "none" }}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="vehicleGradientAm" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#2B9BED" />
              <stop offset="100%" stopColor="#1A6DDF" />
            </linearGradient>
            <linearGradient id="vehicleGradientPm" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#83A5DC" />
              <stop offset="100%" stopColor="#00939A" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeWidth={0.5}
            vertical={false}
            stroke={!isPrint ? "#384043" : "#777777"}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: !isPrint ? "#F7FAFE" : "#000000", fontSize: 14 }}
            tickLine={false}
          />

          <YAxis
            tickCount={13}
            {...(maxValue !== 0 && {
              domain: [
                0,
                (dataMax: number) =>
                  dataMax > 1000 ? dataMax + 100 : dataMax + 10
              ]
            })}
            tick={{ fill: !isPrint ? "#F7FAFE" : "#000000", fontSize: 14 }}
            strokeWidth={0}
          />

          <Bar barSize={35} dataKey="count" radius={[10, 10, 0, 0]}>
            {data.map((item) => {
              const hour = parseInt(item.label.split(":")[0], 10);
              const isAm = hour < 12;

              return (
                <Cell
                  key={item.hour}
                  fill={
                    isAm
                      ? "url(#vehicleGradientAm)"
                      : "url(#vehicleGradientPm)"
                  }
                />
              );
            })}
            <LabelList
              dataKey="count"
              content={(e) => renderCustomizedLabel(e, isPrint)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VehicleDetectPerHourChart;
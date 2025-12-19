import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, LabelProps, Cell } from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Types
import type {
  VehiclePassCheckpointWeeklyData
} from "../../features/chart/types";

// Utils
import { formatNumber, getWeekday } from "../../utils/commonFunction";

// i18n
import { useTranslation } from 'react-i18next';

dayjs.extend(utc);

type VehiclePassCheckpointWeeklyChartProps = {
  data: VehiclePassCheckpointWeeklyData[]
  isPrint?: boolean
}

const VehiclePassCheckpointWeeklyChart: React.FC<VehiclePassCheckpointWeeklyChartProps> = ({
  data,
  isPrint = false,
}) => {
  // i18n
  const { i18n } = useTranslation();

  const renderCustomizedLabel = (props: LabelProps & { index?: number }) => {
    const { x, y, width, value, index } = props;

    const item = index !== undefined ? data[index] : null;
    const total_vehicle = item?.total_vehicle ?? 0;

    if (total_vehicle === 0) return null;

    if (x == null || y == null || width == null || String(value) === "") {
      return null;
    }
    const radius = 13;

    return (
      <g>
        <circle cx={Number(x) + Number(width) - 15} cy={Number(y) - radius + 28} r={radius} fill="#FFFFFF" />
        <text
          x={Number(x) + Number(width) - 15}
          y={Number(y) - radius + 28}
          fill="#5F5F5F"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={i18n.language === "th" ? 12 : 10}
        >
          {getWeekday(String(value), i18n)}
        </text>
      </g>
    );
  };

  return (
    <BarChart
      style={{ width: '100%', maxHeight: '380px', aspectRatio: 1.618, pointerEvents: "none" }}
      data={data}
      margin={{ top: 0, right: 30, left: 25, bottom: 0 }}
      layout="vertical"
    >
      {/* Gradients */}
      <defs>
        <linearGradient id="day0" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EF381C" />
          <stop offset="100%" stopColor="#892010" />
        </linearGradient>
        <linearGradient id="day1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FADC39" />
          <stop offset="100%" stopColor="#948222" />
        </linearGradient>
        <linearGradient id="day2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2386C" />
          <stop offset="100%" stopColor="#6C1D38" />
        </linearGradient>
        <linearGradient id="day3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00A170" />
          <stop offset="100%" stopColor="#003B29" />
        </linearGradient>
        <linearGradient id="day4" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF993A" />
          <stop offset="100%" stopColor="#CB803A" />
        </linearGradient>
        <linearGradient id="day5" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#96DBDE" />
          <stop offset="100%" stopColor="#517678" />
        </linearGradient>
        <linearGradient id="day6" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9059AC" />
          <stop offset="100%" stopColor="#3B2446" />
        </linearGradient>
      </defs>

      <CartesianGrid strokeWidth={1} horizontal={!isPrint ? false : true} strokeDasharray="4" stroke={!isPrint ? "#508ABC" : "#2B9BED"} fill='#FFFFFF' />

      <XAxis 
        type="number"
        tickCount={12}
        tick={({ x, y, payload }) => {
          return (
            <text
              x={x}
              y={y + 10}
              textAnchor="middle"
              fill={!isPrint ? "#F7FAFE" : "#000000"}
              fontSize={14}
            >
              {formatNumber(payload.value)}
            </text>
          );
        }}
      />

      <YAxis 
        dataKey="dateFormat"
        type="category"
        tick={{ fill: !isPrint ? "#F7FAFE" : "#000000", fontSize: 14 }}
      />

      <Bar
        barSize={30}
        dataKey="total_vehicle"
        radius={[0, 20, 20, 0]}
      >
        {data.map((entry, index) => {
          const day = dayjs.utc(entry.date).get('day');

          // @ts-ignore
          return <Cell key={`tvd-${index}`} fill={`url(#day${day})`} />;
        })}
        <LabelList dataKey="date" content={renderCustomizedLabel} />
      </Bar>
    </BarChart>
  )
}

export default VehiclePassCheckpointWeeklyChart;
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, TooltipContentProps, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

// Types
import type {
  VehiclePassCheckpointYearlyData
} from "../../features/chart/types";

// Utils
import { formatNumber } from "../../utils/commonFunction";

// i18n
import { useTranslation } from 'react-i18next';

type CustomTooltipProps = TooltipContentProps<string | number, string> & {
  isPrint?: boolean;
};

type VehiclePassCheckpointYearlyChartProps = {
  data: VehiclePassCheckpointYearlyData[]
  isPrint?: boolean
}

const VehiclePassCheckpointYearlyChart: React.FC<VehiclePassCheckpointYearlyChartProps> = ({
  data,
  isPrint = false,
}) => {
  // i18n
  const { t, i18n } = useTranslation();

  const CustomTooltip = ({ active, payload, isPrint }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0].payload;
    const month = item.month;
    const total = item.total_vehicle;
    const totalBl = item.total_black_list;
    const totalWl = item.total_watch_list;
    const totalNormal = total - totalBl - totalWl;

    return (
      <div className={`bg-white rounded-[5px] shadow-md ${!isPrint ? "w-[130px] p-2" : "border border-[#2B9BED] w-[100px] h-[65px] p-1"}`}>
        <div className={`flex justify-between ${!isPrint ? "text-[#1A6DDF] text-[12px]" : "text-[#000000] text-[9px]"} font-extrabold`}>
          <p>
            {i18n.language === "th"
              ? dayjs(month).locale("th").format("MMMM")
              : dayjs(month).format("MMMM")}
          </p>

          <p>{formatNumber(total)}</p>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#ED473B] text-[10px] h-[20px]" : "text-[#000000] text-[8px] h-[10px]"}`}>
          <div className="flex gap-1 items-center">
            {
              !isPrint && (
                <div className="bg-[#ED473B] rounded-full w-1 h-1" />
              )
            }
            <p>{t('chart.black-list')}</p>
          </div>

          <p>{formatNumber(totalBl)}</p>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#FFCA36] text-[10px] h-[20px]" : "text-[#000000] text-[8px] h-[10px]"}`}>
          <div className="flex gap-1 items-center">
            {
              !isPrint && (
                <div className="bg-[#FFCA36] rounded-full w-1 h-1" />
              )
            }
            <p>{t('chart.watch-list')}</p>
          </div>

          <p>{formatNumber(totalWl)}</p>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#00939A] text-[10px] h-[20px]" : "text-[#000000] text-[8px] h-[10px]"}`}>
          <div className="flex gap-1 items-center">
            {
              !isPrint && (
                <div className="bg-[#00939A] rounded-full w-1 h-1" />
              )
            }
            <p>{t('chart.normal')}</p>
          </div>

          <p>{formatNumber(totalNormal)}</p>
        </div>
      </div>
    );
  };

  const StaticTooltips = ({ data, CustomTooltip, isPrint }: any) => {
    return (
      <>
        {data.map((item: any, index: number) => {
          const barWidth = 35;
          const gap = 15;
          const x = 60 + index * (barWidth + gap);
          
          const chartHeight = 280;
          const y = index % 2 === 0
            ? barWidth / 2 + 30
            : chartHeight - barWidth / 2 + 10;

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: x,
                top: y,
              }}
              className='h-full w-full'
            >
              <CustomTooltip active={true} payload={[{ payload: item }]} isPrint={isPrint} />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div style={{ width: "100%", height: "380px", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 40, right: 0, left: 0, bottom: 5 }}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="totalVehicle" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#2B9BED" />
              <stop offset="100%" stopColor="#1A6DDF" />
            </linearGradient>
            <linearGradient id="blackList" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ED473B" />
              <stop offset="100%" stopColor="#BA2835" />
            </linearGradient>
            <linearGradient id="watchList" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FFCA36" />
              <stop offset="100%" stopColor="#FFA10B" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeWidth={0.5} vertical={false} stroke={!isPrint ? "#384043" : "#777777"} />
          <XAxis 
            dataKey="monthFormat" 
            tick={{ fill: !isPrint ? "#F7FAFE" : "#000000", fontSize: 14 }} 
            tickLine={false} 
          />
          <YAxis
            tickCount={11}
            tickLine={false}
            axisLine={false}
            strokeWidth={0}
            tick={({ x, y, payload, index }) => {
              const fontSize = index % 2 === 0 ? 14 : 10;
              const fontColor = !isPrint ? index % 2 === 0 ? "#F7FAFE" : "#81898E" : "#000000";

              return (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="end"
                  fill={fontColor}
                  fontSize={fontSize}
                >
                  {formatNumber(payload.value)}
                </text>
              );
            }}
          />

          <Bar
            barSize={35}
            dataKey="total_vehicle"
            fill="url(#totalVehicle)"
            stackId={1}
            style={{ pointerEvents: "none" }}
          >
            {data.map((entry, index) => {
              const radius =
                entry.total_black_list === 0 && entry.total_watch_list === 0
                  ? [10, 10, 0, 0]
                  : [0, 0, 0, 0];

              // @ts-ignore
              return <Cell key={`tv-${index}`} radius={radius} />;
            })}
          </Bar>

          <Bar
            barSize={35}
            dataKey="total_watch_list"
            fill="url(#watchList)"
            stackId={1}
            style={{ pointerEvents: "none" }}
          >
            {data.map((entry, index) => {
              const radius =
                entry.total_black_list === 0
                  ? [10, 10, 0, 0]
                  : [0, 0, 0, 0];

              // @ts-ignore
              return <Cell key={`twl-${index}`} radius={radius} />;
            })}
          </Bar>

          <Bar
            barSize={35}
            dataKey="total_black_list"
            fill='url(#blackList)'
            radius={[10, 10, 0, 0]}
            stackId={1}
            style={{ pointerEvents: "none" }}
          />

          <Tooltip content={CustomTooltip} />
        </BarChart>
        {isPrint && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <StaticTooltips data={data} CustomTooltip={CustomTooltip} isPrint={true} />
          </div>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default VehiclePassCheckpointYearlyChart;
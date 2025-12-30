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

type CustomTooltipProps = Partial<
  TooltipContentProps<string | number, string>
> & {
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
  const { t, i18n } = useTranslation();

  const CustomTooltip = ({ active, payload, isPrint }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0].payload;
    const { month, total_vehicle: total, total_black_list: totalBl, total_watch_list: totalWl } = item;
    const totalNormal = total - totalBl - totalWl;

    return (
      <div className={`bg-white rounded-[5px] shadow-md mx-auto ${!isPrint ? "w-[130px] p-2" : "border border-[#2B9BED] w-full max-w-[100px] p-1 h-auto min-h-[65px]"}`}>
        <div className={`flex justify-between ${!isPrint ? "text-[#1A6DDF] text-[12px]" : "text-[#000000] text-[9px]"} font-extrabold`}>
          <p>
            {i18n.language === "th"
              ? dayjs().month(month - 1).locale("th").format("MMM")
              : dayjs().month(month - 1).format("MMM")}
          </p>
          <p>{formatNumber(total)}</p>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#ED473B] text-[10px]" : "text-[#000000] text-[7px]"}`}>
          <span>{t('chart.black-list')}</span>
          <span>{formatNumber(totalBl)}</span>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#FFCA36] text-[10px]" : "text-[#000000] text-[7px]"}`}>
          <span>{t('chart.watch-list')}</span>
          <span>{formatNumber(totalWl)}</span>
        </div>
        <div className={`flex items-center justify-between ${!isPrint ? "text-[#00939A] text-[10px]" : "text-[#000000] text-[7px]"}`}>
          <span>{t('chart.normal')}</span>
          <span>{formatNumber(totalNormal)}</span>
        </div>
      </div>
    );
  };

  const StaticTooltips = ({ data, isPrint }: { data: any[], isPrint: boolean }) => {
    const sectionWidth = 100 / data.length; 

    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-start" 
      style={{ paddingLeft: '60px'}}>
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              width: `${sectionWidth}%`,
              position: 'relative',
              marginTop: index % 2 === 0 ? '10px' : '240px',
            }}
            className="flex justify-center"
          >
            <CustomTooltip active={true} payload={[{ payload: item }]} isPrint={isPrint} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "380px", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 40, right: 10, left: 0, bottom: 5 }}
        >
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
            tick={{ fill: !isPrint ? "#F7FAFE" : "#000000", fontSize: 12 }} 
            tickLine={false} 
          />
          <YAxis
            width={60}
            tickCount={11}
            tickLine={false}
            axisLine={false}
            tick={({ x, y, payload, index }) => (
              <text x={x} y={y + 4} textAnchor="end" fill={!isPrint ? (index % 2 === 0 ? "#F7FAFE" : "#81898E") : "#000000"} fontSize={index % 2 === 0 ? 12 : 10}>
                {formatNumber(payload.value)}
              </text>
            )}
          />

          <Bar barSize={35} dataKey="total_vehicle" fill="url(#totalVehicle)" stackId={1}>
            {data.map((entry, index) => (
              <Cell key={`tv-${index}`} radius={entry.total_black_list === 0 && entry.total_watch_list === 0 ? ([5, 5, 0, 0] as any) : ([0, 0, 0, 0] as any)} />
            ))}
          </Bar>
          <Bar barSize={35} dataKey="total_watch_list" fill="url(#watchList)" stackId={1}>
            {data.map((entry, index) => (
              <Cell key={`twl-${index}`} radius={entry.total_black_list === 0 ? ([5, 5, 0, 0] as any) : ([0, 0, 0, 0] as any)} />
            ))}
          </Bar>
          <Bar barSize={35} dataKey="total_black_list" fill='url(#blackList)' radius={[5, 5, 0, 0]} stackId={1} />

          {!isPrint && <Tooltip content={<CustomTooltip />} />}
        </BarChart>
      </ResponsiveContainer>

      {isPrint && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ paddingRight: '10px' }}>
          <StaticTooltips data={data} isPrint={true} />
        </div>
      )}
    </div>
  )
}

export default VehiclePassCheckpointYearlyChart;
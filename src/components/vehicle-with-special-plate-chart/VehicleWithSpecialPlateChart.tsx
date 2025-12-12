import React from 'react';
import { Cell, Pie, PieChart } from 'recharts';

// Material UI
import Divider from '@mui/material/Divider';

// Types
import type {
  VehicleWithSpecialPlatePieData
} from "../../features/chart/types";

// i18n
import { useTranslation } from 'react-i18next';

type VehicleWithSpecialPlateChartProps = {
  data: VehicleWithSpecialPlatePieData[]
  isPrint?: boolean
}

const VehicleWithSpecialPlateChart: React.FC<VehicleWithSpecialPlateChartProps> = ({
  data,
  isPrint = false,
}) => {
  // i18n
  const { t } = useTranslation();

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className='relative flex items-center justify-center w-full h-full'>
      <PieChart 
        style={{ width: '100%', maxWidth: '330px', maxHeight: '80vh', aspectRatio: 1, pointerEvents: "none" }} 
        responsive
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        {/* Gradients */}
        <defs>
          <linearGradient id="blackList" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ED473B" />
            <stop offset="100%" stopColor="#BA2835" />
          </linearGradient>
          <linearGradient id="watchList" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFCA36" />
            <stop offset="100%" stopColor="#FFA10B" />
          </linearGradient>
        </defs>

        <Pie
          data={data}
          labelLine={false}
          dataKey="value"
          innerRadius="40%"
          cornerRadius="15%"
          paddingAngle={2}
          startAngle={90}
          endAngle={450}
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.name === 'blacklist' ? 'url(#blackList)' : 'url(#watchList)'} />
          ))}
        </Pie>

        {/* Middle Text */}
        <g>
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#2B9BED"
            fontSize={32}
            fontWeight="bold"
          >
            {total}
          </text>
          
          <line
            x1="40%"
            y1="52%"
            x2="60%"
            y2="52%"
            stroke="#2B9BED"
            strokeWidth={1}
            strokeLinecap="round"
          />

          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            fill="#2B9BED"
            fontSize={12}
            fontWeight={600}
          >
            {t('chart.vehicle')}
          </text>
        </g>
      </PieChart>

      {
        !isPrint && (
          <>
            {/* Black List */}
            <div className='absolute flex flex-col items-center justify-center top-10 left-8'>
              <p className='text-[#1A6DDF] text-[18px] font-bold'>Black List</p>
              <Divider sx={{ borderColor: "#ED473B", borderWidth: "2px", width: "100%"}} />
              <p className='text-[#1A6DDF] text-[26px] font-bold'>{data.length > 0 ? data[0].value : ""}</p>
            </div>

            {/* Watch List */}
            <div className='absolute flex flex-col items-center justify-center top-10 right-8'>
              <p className='text-[#1A6DDF] text-[18px] font-bold'>Watch List</p>
              <Divider sx={{ borderColor: "#FEC13D", borderWidth: "2px", width: "100%"}} />
              <p className='text-[#1A6DDF] text-[26px] font-bold'>{data.length > 1 ? data[1].value  : ""}</p>
            </div>
          </>
        )
      }
    </div>
  )
}

export default VehicleWithSpecialPlateChart;
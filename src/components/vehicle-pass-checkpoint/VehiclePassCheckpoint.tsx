import React from 'react'

// Material UI
import Divider from '@mui/material/Divider';

// Components
import BlockNumber from '../../components/block-number/BlockNumber';

// i18n
import { useTranslation } from 'react-i18next';

type VehiclePassCheckpointProps = {
  dailyDate: string;
  dailyValue: string;
  monthlyDate: string;
  monthlyValue: string;
  yearlyDate: string;
  yearlyValue: string;
}

const VehiclePassCheckpoint: React.FC<VehiclePassCheckpointProps> = ({
  dailyDate,
  dailyValue,
  monthlyDate,
  monthlyValue,
  yearlyDate,
  yearlyValue,
}) => {
  // i18n
  const { t } = useTranslation();

  return (
    <div className='px-2 pt-5'>
      <BlockNumber 
        title={t('chart.daily')}
        titleDate={dailyDate}
        count={dailyValue}
      />
      <Divider sx={{ borderColor: "#FEC13D" }} />
      <BlockNumber 
        title={t('chart.monthly')}
        titleDate={monthlyDate}
        count={monthlyValue}
      />
      <Divider sx={{ borderColor: "#FEC13D" }} />
      <BlockNumber 
        title={t('chart.yearly')}
        titleDate={yearlyDate}
        count={yearlyValue}
      />
    </div>
  )
}

export default VehiclePassCheckpoint;
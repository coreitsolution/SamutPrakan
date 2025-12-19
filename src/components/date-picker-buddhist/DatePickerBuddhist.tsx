import dayjs, { Dayjs } from 'dayjs';

// Material UI
import Typography from "@mui/material/Typography";
import { DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers"
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// i18n
import { useTranslation } from 'react-i18next';

// Utils
import buddhistEraAdapter from "../../utils/buddhistEraAdapter"

type CustomDatePickerProps = Omit<DatePickerProps<Dayjs>, 'value' | 'onChange'> & {
  id?: string
  label?: string
  labelTextSize?: string
  className?: string
  value: Date | null
  onChange: (date: Date | null, context: any) => void
  isWithTime?: boolean
  error?: boolean
  register?: any
  sx?: object
  maxDate?: Dayjs
  slotProps?: any;
}

const DatePickerBuddhist: React.FC<CustomDatePickerProps> = ({
  id,
  label,
  labelTextSize,
  onChange,
  value,
  isWithTime,
  error = false, 
  register,
  sx = {},
  maxDate,
  className,
  ...props
}) => {
  // i18n
  const { t, i18n } = useTranslation();

  const dayjsValue = value ? dayjs(value) : null;

  const handleDateChange = (date: dayjs.Dayjs | null, context: any) => {
    if (onChange) {
      onChange(date?.toDate() || null, context);
      if (register) {
        register.onChange({
          target: { name: register.name, value: date?.toDate() || null },
        });
      }
    }
  }

  const textFieldProps = {
    size: 'medium' as 'medium',
    style: { height: '40px', justifyContent: 'center' },
    fullWidth: true,
    inputProps: {
      placeholder: isWithTime ? t('placeholder.date-time') : t('placeholder.date'),
    },
    error: error,
    sx: {
      '& .MuiOutlinedInput-root': {
        height: '40px',
        borderRadius: '5px',
        backgroundColor: 'white',
        '& fieldset': {
          borderColor: error ? 'red' : 'default',
          borderWidth: '2px',
        },
        '&:hover fieldset': {
          borderColor: error ? 'red' : 'default',
          borderWidth: '2px',
        },
        '&.Mui-focused fieldset': {
          borderColor: error ? 'red' : 'default',
          borderWidth: '2px',
        },
      },
      ...sx,
    },
  }

  const datePickerProps = {
    value: dayjsValue,
    onChange: handleDateChange,
    slotProps: { 
      ...props.slotProps,
      textField: textFieldProps,
      toolbar: {
        toolbarFormat: props.views?.includes("year") && props.views.length === 1
                      ? "YYYY"
                      : "D MMMM",
      },
    },
    ...(maxDate && { maxDate }),
    openTo: props.openTo || "day",
    views: props.views ?? ["year", "month", "day"],
  };

  return (
    <div id={id} className={`flex flex-col w-full ${className || ''}`}>
      {label && (
        <Typography
          variant="subtitle1"
          color="white"
          sx={{ fontSize: labelTextSize }}
        >
          {label}
        </Typography>
      )}
      <LocalizationProvider 
        dateAdapter={i18n.language === "th" ? buddhistEraAdapter : AdapterDayjs} 
        adapterLocale={i18n.language === "th" ? "th" : "en"}
      >
        {
          !isWithTime ? 
          (
            <DatePicker
              {...props}
              {...datePickerProps}
              desktopModeMediaQuery="@media (min-width: 0px)"
            />
          ) : 
          (
            <DateTimePicker
              {...props as DateTimePickerProps<Dayjs>}
              {...datePickerProps}
              desktopModeMediaQuery="@media (min-width: 0px)"
            />
          )}
      </LocalizationProvider>
    </div>
  )
}

export default DatePickerBuddhist
import React, { useEffect, useState, useRef } from 'react'
import { useForm } from "react-hook-form";
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { useSelector } from "react-redux"
import { RootState } from "../../app/store"

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ExcelIcon from "../../assets/icons/excel.png";
import PDFIcon from "../../assets/icons/pdf.png";
import ChartIcon from "../../assets/icons/chart.png";
import ChartBlueIcon from "../../assets/icons/chart-blue.png";
import { Search } from "lucide-react";

// Material UI
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

// Components
import Loading from "../../components/loading/Loading";
import ChartLoading from "../../components/loading/ChartLoading";
import MultiSelectCameras from '../../components/multi-select/MultiSelectCameras';
import VehicleDetectPerHourChart from '../../components/vehicle-detect-per-hour-chart/VehicleDetectPerHourChart';
import VehiclePassCheckpoint from '../../components/vehicle-pass-checkpoint/VehiclePassCheckpoint';
import VehiclePassCheckpointYearly from '../../components/vehicle-pass-checkpoint-yearly-chart/VehiclePassCheckpointYearlyChart';
import VehiclePassCheckpointWeekly from '../../components/vehicle-pass-checkpoint-weekly-chart/VehiclePassCheckpointWeeklyChart';
import DatePickerBuddhist from '../../components/date-picker-buddhist/DatePickerBuddhist';
import VehicleWithSpecialPlateChart from "../../components/vehicle-with-special-plate-chart/VehicleWithSpecialPlateChart";
import { Icon } from '../../components/icons/Icon'

// Context
import { useHamburger } from "../../context/HamburgerContext";

// i18n
import { useTranslation } from 'react-i18next';

// Types
import {
  Camera,
  CameraResponse,
} from "../../features/types";
import {
  StatisticPdfData,
} from "../../features/chart/types";
import type { 
  VehicleDetectPerHourChartData, 
  VehiclePassCheckpointYearlyData,
  DetectionHourlyResponse,
  DetectionMonthlyResponse,
  DetectionWeeklyResponse,
  VehiclePassCheckpointWeeklyData,
  DetectionSummaryResponse,
  VehiclePassCheckpointData,
  DetectionSpecialPlateResponse,
  VehicleWithSpecialPlatePieData,
} from "../../features/chart/types";

// Utils
import { formatNumber, getWeekday, reformatString } from '../../utils/commonFunction';
import { fetchClient, combineURL } from "../../utils/fetchClient";
import { PopupMessage } from "../../utils/popupMessage"

// PDF
import { downloadStatisticPdf } from "./statistic-pdf/StatisticPdf";

// Config
import { getUrls } from '../../config/runtimeConfig';

dayjs.extend(buddhistEra)

interface FormData {
  checkpointPassYearly: Date | null;
  checkpointPassWeeklyStart: Date | null;
  checkpointPassWeeklyEnd: Date | null;
}

interface SpecialPlateData {
  specialPlateStart: Date | null;
  specialPlateEnd: Date | null;
}

type ChartProps = {

}

const Chart: React.FC<ChartProps> = ({}) => {
  const { isOpen } = useHamburger();
  const { CENTER_API } = getUrls();
  const currentDate = dayjs().toDate();
  const lastWeek = dayjs().subtract(1, 'week').toDate();

  // i18n
  const { t, i18n } = useTranslation();

  // Ref
  const vehicleDetectPerHourChartRef = useRef<HTMLDivElement>(null);
  const vehiclePassCheckpointYearlyRef = useRef<HTMLDivElement>(null);
  const vehiclePassCheckpointsWeeklyRef = useRef<HTMLDivElement>(null);
  const specialPlateChartRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Data
  const [selectedCameraObjects, setSelectedCameraObjects] = useState<{value: any, label: string}[]>([]);
  const [selectedCameraIds, setSelectedCameraIds] = useState<Camera[]>([]);
  const [cameraList, setCameraList] = useState<Camera[]>([]);
  const [formData, setFormData] = useState<FormData>({
    checkpointPassYearly: currentDate,
    checkpointPassWeeklyStart: lastWeek,
    checkpointPassWeeklyEnd: currentDate,
  });
  const [specialPlateData, setSpecialPlateData] = useState<SpecialPlateData>({
    specialPlateStart: currentDate,
    specialPlateEnd: currentDate,
  });
  const [detectionHourly, setDetectionHourly] = useState<VehicleDetectPerHourChartData[]>([]);
  const [detectionMonthly, setDetectionMonthly] = useState<VehiclePassCheckpointYearlyData[]>([]);
  const [detectionWeekly, setDetectionWeekly] = useState<VehiclePassCheckpointWeeklyData[]>([]);
  const [detectionSummary, setDetectionSummary] = useState<VehiclePassCheckpointData | null>(null);
  const [detectionSpecialPlate, setDetectionSpecialPlate] = useState<VehicleWithSpecialPlatePieData[]>([]);

  // Options
  const [camerasOption, setCamerasOption] = useState<{value: any, label: string}[]>([]);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSpecialPlateChartLoading, setIsSpecialPlateChartLoading] = useState(false);
  const [isWeeklyChartLoading, setIsWeeklyChartLoading] = useState(false);
  const [isMonthlyChartLoading, setIsMonthlyChartLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const cameraRefreshKey = useSelector((state: RootState) => state.refresh.cameraRefreshKey);

  const {
    register,
    formState: { errors },
    setValue,
    clearErrors,
    handleSubmit,
  } = useForm();

  useEffect(() => {
    setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
    setValue("specialPlateStart", currentDate);
    setValue("specialPlateEnd", currentDate);
  }, [])
  
  useEffect(() => {
    fetchCameraData();
  }, [cameraRefreshKey]);

  useEffect(() => {
    if (!cameraList.length) return;

    const hasAll = selectedCameraObjects.some(v => v.value === "0");
    const newList = hasAll
      ? cameraList
      : cameraList.filter(c => selectedCameraObjects.some(sc => sc.value === c.uid));

    setSelectedCameraIds(prev =>
      JSON.stringify(prev) !== JSON.stringify(newList) ? newList : prev
    );
  }, [selectedCameraObjects, cameraList]);

  useEffect(() => {
    if (!hasLoadedRef.current && cameraList.length > 0) {
      hasLoadedRef.current = true;
      const selectCheckpoint = cameraList.map(c => c.uid);
      fetchAllData(selectCheckpoint);
    }
  }, [cameraList]);

  useEffect(() => {
    if (cameraList) {
      const options = cameraList.map((row) => ({
        label: row.camera_name,
        value: row.uid,
      }))
      setCamerasOption([{ label: t('dropdown.all'), value: "0" }, ...options])
    }
  }, [cameraList, i18n.language, i18n.isInitialized])

  const handleCameraChange = (ids: string[]) => {
    let newIds: string[];

    if (ids.length === 0 || ids.includes("0")) {
      newIds = ["0"];
    } 
    else {
      newIds = ids;
    }

    const selectedObjects = camerasOption.filter(c => newIds.includes(c.value));
    setSelectedCameraObjects(selectedObjects);

    const hasAll = selectedObjects.some((v) => v.value === "0");
    
    setSelectedCameraIds(hasAll ? cameraList : cameraList.filter(c => newIds.includes(c.uid)));
  };

  const handleDateChange = async (key: keyof typeof formData, value: Date | null) => {
    const selectCheckpoint = selectedCameraIds.map((c) => c.uid);
    if (key === "checkpointPassWeeklyStart" && value) {
      setFormData(prev => ({
        ...prev,
        checkpointPassWeeklyStart: value,
        checkpointPassWeeklyEnd: dayjs(value).add(1, "week").toDate(),
      }));
      setIsWeeklyChartLoading(true);
      await fetchDetectionWeekly(selectCheckpoint);
      setTimeout(() => {
        setIsWeeklyChartLoading(false);
      }, 500)
      return;
    } 
    else if (key === "checkpointPassYearly" && value) {
      setFormData(prev => ({ ...prev, [key]: value }));
      setIsMonthlyChartLoading(true);
      await fetchDetectionMonthly(selectCheckpoint);
      setTimeout(() => {
        setIsMonthlyChartLoading(false);
      }, 500)
      return;
    }
    else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }

    await fetchNewData(key, value);
  };

  const handleDateSpecialPlateChange = async (key: keyof typeof specialPlateData, value: Date | null) => {
    setSpecialPlateData(prev => ({ ...prev, [key]: value }));
  };

  const handleClearSearch = async () => {
    setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
    setFormData({
      checkpointPassYearly: currentDate,
      checkpointPassWeeklyStart: lastWeek,
      checkpointPassWeeklyEnd: currentDate,
    });
    setSpecialPlateData({
      specialPlateStart: currentDate,
      specialPlateEnd: currentDate,
    });
    clearErrors();
  };

  const handleSearch = async () => {
    const selectCheckpoint = selectedCameraIds.map((c) => c.uid);

    await fetchAllData(selectCheckpoint);
  }

  const fetchAllData = async (selectCheckpoint: string[]) => {
    try {
      setIsLoading(true);
      await fetchDetectionHourly(selectCheckpoint);
      await fetchDetectionMonthly(selectCheckpoint);
      await fetchDetectionWeekly(selectCheckpoint);
      await fetchDetectionSummary(selectCheckpoint);
      await fetchDetectionSpecialPlates(selectCheckpoint);
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
    }
    finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const fetchCameraData = async () => {
    try {
      const res = await fetchClient<CameraResponse>(combineURL(CENTER_API, "/cameras/get"), {
        method: "GET",
        queryParams: {
          filter: `deleted=false`,
          limit: "1000",
        },
      });

      if (res.success) {
        setCameraList(res.data);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
    }
  };

  const fetchDetectionHourly = async (selectCheckpoint: string[]) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const todayStart = dayjs().startOf('day');
    const todayEnd = dayjs().endOf('day');

    try {
      const res = await fetchClient<DetectionHourlyResponse>(combineURL(CENTER_API, "/lpr-data/detection-hourly"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
          ...(
            selectCheckpoint.length > 0 && {
              cameraUids: selectCheckpoint.join(","),
            }
          )
        },
      });

      if (res.success) {
        const finalData = Array.from({ length: 24}).map((_, index) => {
          const dataHourly = res.data.find(d => (d.hour) === index);
          if (dataHourly) return dataHourly;
          return {
            hour: index,
            label: dayjs().hour(index).minute(0).second(0).format("HH:mm"),
            count: 0,
          }
        })
        setDetectionHourly(finalData);
      }
    }
    catch (error) {
      throw error;
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const fetchDetectionMonthly = async (selectCheckpoint: string[], date?: Date | null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const searchYear = date ? dayjs(date).format("YYYY") : formData.checkpointPassYearly ? dayjs(formData.checkpointPassYearly).format("YYYY") : undefined;
      const res = await fetchClient<DetectionMonthlyResponse>(combineURL(CENTER_API, "/lpr-data/detection-monthly"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          ...(
            searchYear && {
              year: searchYear,
            }
          ),
          ...(
            selectCheckpoint.length > 0 && {
              cameraUids: selectCheckpoint.join(","),
            }
          )
        },
      });

      if (res.success) {
        const updateData = res.data.map((data) => {
          return ({
            monthFormat: i18n.language === "th" ? dayjs().month(data.month - 1).locale("th").format('MMM') : dayjs().month(data.month - 1).format('MMM'),
            total_vehicle: data.total,
            total_black_list: data.bySpecialPlate?.find(b => b.plate_class_title_en?.toLowerCase() === "blacklist")?.count || 0,
            total_watch_list: data.bySpecialPlate?.find(b => b.plate_class_title_en?.toLowerCase() === "watchlist")?.count || 0,
            ...data,
          })
        });
        const finalData = Array.from({ length: 12}).map((_, index) => {
          const dataMonth = updateData.find(d => d.month === index + 1);
          if (dataMonth) return dataMonth;
          return {
            monthFormat: i18n.language === "th" ? dayjs().month(index).locale("th").format('MMM') : dayjs().month(index).format('MMM'),
            total_vehicle: 0,
            total_black_list: 0,
            total_watch_list: 0,
            month: index + 1,
          }
        })
        setDetectionMonthly(finalData);
      }
    }
    catch (error) {
      throw error;
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const fetchDetectionWeekly = async (selectCheckpoint: string[], startDate?: Date | null, endDate?: Date | null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const searchStartDate = startDate ? dayjs(startDate).toISOString() : formData.checkpointPassWeeklyStart ? dayjs(formData.checkpointPassWeeklyStart).toISOString() : null;
      const searchEndDate = endDate ? dayjs(endDate).toISOString() : formData.checkpointPassWeeklyEnd ? dayjs(formData.checkpointPassWeeklyEnd).toISOString() : null;
      const res = await fetchClient<DetectionWeeklyResponse>(combineURL(CENTER_API, "/lpr-data/detection-weekly"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          ...(
            searchStartDate && {
              startDate: searchStartDate,
            }
          ),
          ...(
            searchEndDate && {
              endDate: searchEndDate,
            }
          ),
          ...(
            selectCheckpoint.length > 0 && {
              cameraUids: selectCheckpoint.join(","),
            }
          )
        },
      });

      if (res.success) {
        const updateData = res.data.map((data) => ({
          dateFormat: i18n.language === "th" ? dayjs(data.date).locale("th").format('DD/MM/BBBB') : dayjs(data.date).format('DD/MM/YYYY'),
          total_vehicle: data.count,
          ...data,
        }));
        const finalData = Array.from({ length: 7}).map((_, index) => {
          const dataWeekly = updateData.find(d => d.day_of_week === index);
          if (dataWeekly) return dataWeekly;
          return {
            date: i18n.language === "th" ? dayjs(formData.checkpointPassWeeklyStart).add(index, "day").toISOString() : dayjs(formData.checkpointPassWeeklyStart).add(index, "day").toISOString(),
            dateFormat: i18n.language === "th" ? dayjs(formData.checkpointPassWeeklyStart).add(index, "day").format('DD/MM/BBBB') : dayjs(formData.checkpointPassWeeklyStart).add(index, "day").format('DD/MM/YYYY'),
            total_vehicle: 0,
          }
        })
        setDetectionWeekly(finalData);
      }
    }
    catch (error) {
      throw error;
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const fetchDetectionSummary = async (selectCheckpoint: string[]) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetchClient<DetectionSummaryResponse>(combineURL(CENTER_API, "/lpr-data/detection-summary"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          ...(
            selectCheckpoint.length > 0 && {
              cameraUids: selectCheckpoint.join(","),
            }
          )
        },
      });

      if (res.success) {
        const currentDate = dayjs();
        setDetectionSummary(({
          ...res.data,
          todayDate: currentDate.toISOString(),
          thisMonthDate: currentDate.toISOString(),
          thisYearDate: currentDate.toISOString(),
        }));
      }
    }
    catch (error) {
      throw error;
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const fetchDetectionSpecialPlates = async (selectCheckpoint: string[], startDate?: Date | null, endDate?: Date | null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const searchStartDate = startDate ? dayjs(startDate).toISOString() : formData.checkpointPassWeeklyStart ? dayjs(formData.checkpointPassWeeklyStart).toISOString() : null;
      const searchEndDate = endDate ? dayjs(endDate).toISOString() : formData.checkpointPassWeeklyEnd ? dayjs(formData.checkpointPassWeeklyEnd).toISOString() : null;
      const res = await fetchClient<DetectionSpecialPlateResponse>(combineURL(CENTER_API, "/lpr-data/detection-special-plates"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          ...(
            searchStartDate && {
              startDate: searchStartDate,
            }
          ),
          ...(
            searchEndDate && {
              endDate: searchEndDate,
            }
          ),
          ...(
            selectCheckpoint.length > 0 && {
              cameraUids: selectCheckpoint.join(","),
            }
          )
        },
      });

      if (res.success) {
        let updateData = [];

        updateData = res.data.byPlateClass
        .map((item) => {
          if (item.plate_class_title_en?.toLowerCase() === "blacklist") {
            return { name: "blacklist", value: item.count };
          }
          if (item.plate_class_title_en?.toLowerCase() === "watchlist") {
            return { name: "watchlist", value: item.count };
          }
          return null;
        })
        .filter((it) => it !== null);

        if (updateData.length === 0) {
          updateData = [
            { name: "blacklist", value: 0 },
            { name: "watchlist", value: 0 }
          ];
        }

        setDetectionSpecialPlate(updateData);
      }
    }
    catch (error) {
      throw error;
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const fetchNewData = async (key: keyof typeof formData, value: Date | null) => {
    const selectCheckpoint = selectedCameraIds.map((c) => c.uid);
    try {
      setIsLoading(true);
      switch (key) {
        case "checkpointPassYearly":
          await fetchDetectionMonthly(selectCheckpoint, value);
          break;
        case "checkpointPassWeeklyStart":
          await fetchDetectionWeekly(selectCheckpoint, value, value ? dayjs(value).subtract(1, 'week').toDate() : null);
          break;
        default:
          break;
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
    }
    finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const today = i18n.language === "th" ? dayjs().format('DD/MM/BBBB HH:mm:ss') : dayjs().format('DD/MM/YYYY HH:mm:ss');

    const sheet1 = workbook.addWorksheet(t('chart.vehicle-pass-checkpoint'));
    
    sheet1.columns = [
      { header: t('excel.column.data-range'), key: "dataRange", width: 10 },
      { header: t('excel.column.vehicle-volume'), key: "vehicleVolume", width: 10 },
      { header: t('excel.column.remark'), key: "remark", width: 20 },
    ];

    sheet1.insertRow(1, [t('excel.data-from'), today, '']);

    sheet1.addRows([
      { 
        dataRange: t('chart.daily'), 
        vehicleVolume: formatNumber(detectionSummary?.today || 0), 
        remark: `${t('excel.from')} : ${detectionSummary?.todayDate ? i18n.language === "th" ? `${t('excel.date')} ${dayjs(detectionSummary?.todayDate).locale("th").format('DD MMMM BBBB')}` : dayjs(detectionSummary?.todayDate).format('DD MMMM YYYY') : "-"}`
      },
      { 
        dataRange: t('chart.monthly'), 
        vehicleVolume: formatNumber(detectionSummary?.thisMonth  || 0), 
        remark: `${t('excel.from')} : ${detectionSummary?.thisMonthDate ? i18n.language === "th" ? `${t('excel.month')}${dayjs(detectionSummary?.thisMonthDate).locale("th").format('MMMM BBBB')}` : dayjs(detectionSummary?.thisMonthDate).format('MMMM YYYY') : "-"}`
      },
      { 
        dataRange: t('chart.yearly'), 
        vehicleVolume: formatNumber(detectionSummary?.thisYear  || 0), 
        remark: `${t('excel.from')} : ${detectionSummary?.thisYearDate ? i18n.language === "th" ? `${t('excel.year-unit')} ${dayjs(detectionSummary?.thisYearDate).locale("th").format('BBBB')}` : dayjs(detectionSummary?.thisYearDate).format('YYYY') : "-"}`
      },
    ]);

    const sheet2 = workbook.addWorksheet(t('chart.vehicle-detect-per-hour'));
    
    sheet2.columns = [
      { header: t('excel.column.data-range'), key: "dataRange", width: 10 },
      { header: t('excel.column.vehicle-volume'), key: "vehicleVolume", width: 10 },
    ];

    sheet2.insertRow(1, [t('excel.data-from'), today, '']);

    sheet2.addRows(detectionHourly.map((data) => (
      { 
        dataRange: data.label, 
        vehicleVolume: formatNumber(data.count), 
      }
    )));

    const sheet3 = workbook.addWorksheet(t('chart.vehicle-pass-checkpoint-yearly'));
    
    sheet3.columns = [
      { header: t('excel.column.month'), key: "month", width: 10 },
      { header: t('excel.column.black-list-volume'), key: "blackListVolume", width: 20 },
      { header: t('excel.column.watch-list-volume'), key: "watchListVolume", width: 20 },
      { header: t('excel.column.normal-volume'), key: "normalVolume", width: 20 },
      { header: t('excel.column.total-volume'), key: "totalVolume", width: 20 },
    ];

    const currentYear = dayjs();

    sheet3.insertRow(1, [t('excel.year'), i18n.language === "th" ? currentYear.format('BBBB') : currentYear.format('YYYY'), '']);

    sheet3.addRows(detectionMonthly.map((data) => (
      { 
        month: i18n.language === "th" ? dayjs().month(data.month - 1).locale("th").format('MMMM') : dayjs().month(data.month - 1).format('MMMM'), 
        blackListVolume: formatNumber(data.total_black_list), 
        watchListVolume: formatNumber(data.total_watch_list), 
        normalVolume: formatNumber(data.total_vehicle - (data.total_black_list + data.total_watch_list)), 
        totalVolume: formatNumber(data.total_vehicle)
      }
    )));

    const sheet4 = workbook.addWorksheet(t('chart.vehicle-pass-weekly'));

    sheet4.columns = [
      { header: t('excel.column.date'), key: "date", width: 10 },
      { header: t('excel.column.vehicle-volume'), key: "vehicleVolume", width: 10 },
    ];

    const fromDateSheet4 = i18n.language === "th" ? dayjs().format("DD/MM/BBBB") : dayjs().format("DD/MM/YYYY");
    const toDateSheet4 = i18n.language === "th" ? dayjs().format("DD/MM/BBBB") : dayjs().format("DD/MM/YYYY");

    sheet4.insertRow(1, [t('excel.data-from'), `${fromDateSheet4} - ${toDateSheet4}`, '']);

    sheet4.addRows(detectionWeekly.map((data) => (
      { 
        date: `${getWeekday(data.date, i18n)},${data.dateFormat}`, 
        vehicleVolume: formatNumber(data.total_vehicle), 
      }
    )));

    const sheet5 = workbook.addWorksheet(t('chart.special-plate'));

    sheet5.columns = [
      { header: t('excel.column.special-plate'), key: "specialPlate", width: 10 },
      { header: t('excel.column.vehicle-volume'), key: "vehicleVolume", width: 10 },
    ];

    const fromDateSheet5 = i18n.language === "th" ? dayjs().format("DD/MM/BBBB") : dayjs().format("DD/MM/YYYY");
    const toDateSheet5 = i18n.language === "th" ? dayjs().format("DD/MM/BBBB") : dayjs().format("DD/MM/YYYY");

    sheet5.insertRow(1, [t('excel.data-from'), `${fromDateSheet5} - ${toDateSheet5}`, '']);
    
    sheet5.addRows(detectionSpecialPlate.map((data) => (
      { 
        specialPlate: reformatString(data.name),
        vehicleVolume: formatNumber(data.value), 
      }
    )));

    const totalSpecialPlate = detectionSpecialPlate.reduce((prev, curr) => prev + curr.value, 0);

    sheet5.addRows([
      { 
        specialPlate: t('excel.total'),
        vehicleVolume: formatNumber(totalSpecialPlate), 
      }
    ])

    // Generate Excel file as blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${t('excel.file-name.chart')}.xlsx`);
  }

  const exportToPdf = async () => {
    setIsPrinting(true);
    setIsLoading(true);

    setTimeout(async () => {
      if (!vehicleDetectPerHourChartRef.current) return;
      if (!vehiclePassCheckpointYearlyRef.current) return;
      if (!vehiclePassCheckpointsWeeklyRef.current) return;
      if (!specialPlateChartRef.current) return;

      // VehicleDetectPerHourChart
      const vehicleDetectPerHourChartElement = vehicleDetectPerHourChartRef.current;
      const vehicleDetectPerHourChartCanvas = await html2canvas(vehicleDetectPerHourChartElement, {
        scale: 2,
      });
      const vehicleDetectPerHourChartImgData = vehicleDetectPerHourChartCanvas.toDataURL("image/png");

      // VehiclePassCheckpointYearly
      const vehiclePassCheckpointYearlyElement = vehiclePassCheckpointYearlyRef.current;
      const vehiclePassCheckpointYearlyCanvas = await html2canvas(vehiclePassCheckpointYearlyElement, {
        scale: 2,
      });
      const vehiclePassCheckpointYearlyImgData = vehiclePassCheckpointYearlyCanvas.toDataURL("image/png");

      // VehiclePassCheckpointWeekly
      const vehiclePassCheckpointsWeeklyElement = vehiclePassCheckpointsWeeklyRef.current;
      const vehiclePassCheckpointsWeeklyCanvas = await html2canvas(vehiclePassCheckpointsWeeklyElement, {
        scale: 2,
      });
      const vehiclePassCheckpointsWeeklyImgData = vehiclePassCheckpointsWeeklyCanvas.toDataURL("image/png");

      // VehicleWithSpecialPlateChart
      const specialPlateChartElement = specialPlateChartRef.current;
      const specialPlateChartCanvas = await html2canvas(specialPlateChartElement, {
        scale: 2,
        backgroundColor: "transparent"
      });
      const specialPlateChartImgData = specialPlateChartCanvas.toDataURL("image/png");

      const date = dayjs().format(i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD");
      const pdfName = `${t('file.statistic-data')}_${date}.pdf`;

      const hasAll = selectedCameraObjects.some(v => v.value === "0");

      const pdfData: StatisticPdfData  = {
        checkpoints: hasAll ? t('dropdown.all') : selectedCameraIds.map((c) => c.camera_name).join(", "),
        vehiclePassCheckpoints: detectionSummary || null,
        imageVehiclePassCheckpointsPerHour: vehicleDetectPerHourChartImgData,
        imageVehiclePassCheckpointsYearly: vehiclePassCheckpointYearlyImgData,
        vehiclePassCheckpointsYearlyData: {
          year: dayjs(formData.checkpointPassYearly).format(i18n.language === "th" ? "BBBB" : "YYYY")
        },
        imageVehiclePassCheckpointsWeekly: vehiclePassCheckpointsWeeklyImgData,
        vehiclePassCheckpointsWeeklyData: {
          dateFrom: formData.checkpointPassWeeklyStart ? dayjs(formData.checkpointPassWeeklyStart).format(i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY") : "",
          dateTo: formData.checkpointPassWeeklyEnd ? dayjs(formData.checkpointPassWeeklyEnd).format(i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY") : "",
        },
        imageSpecialPlateChart: specialPlateChartImgData,
        specialPlateChartData: {
          dateFrom: specialPlateData.specialPlateStart ? dayjs(specialPlateData.specialPlateStart).format(i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY") : "",
          dateTo: specialPlateData.specialPlateEnd ? dayjs(specialPlateData.specialPlateEnd).format(i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY") : "",
          total_black_list: detectionSpecialPlate[0].value,
          total_watch_list: detectionSpecialPlate[1].value,
        }
      }

      await downloadStatisticPdf(
        pdfData, 
        pdfName, 
        t, 
        i18n,
      );

      setIsPrinting(false);
      setIsLoading(false);
    })
  }

  const handleSpecialPlateChartSearch = async (data: any) => {
    const selectCheckpoint = cameraList.map((c) => c.uid);

    setIsSpecialPlateChartLoading(true);
    await fetchDetectionSpecialPlates(selectCheckpoint, data.specialPlateStart, data.specialPlateEnd);
    setTimeout(() => {
      setIsSpecialPlateChartLoading(false);
    }, 500)
  }

  return (
    <div id='chart' className={`main-content flex flex-col gap-2 ${isOpen ? "pl-[130px]" : "pl-2.5"} pr-6 transition-all duration-500`}>
      { isLoading && <Loading /> }
      {/* Header */}
      <Typography variant="h5" color="white" className="font-bold">{t('screen.chart.title')}</Typography>

      {/* Search Filter Part */}
      <div className='flex flex-col sm:flex-row justify-between w-full gap-5'>
        <div className='w-full'>
          <div className='flex flex-1 w-full'>
            <div className='flex w-full gap-1'>
              <div className='flex flex-col w-full space-y-2'>
                <p className='text-[15px]'>{t('component.checkpoint-2')}</p>
                <div className='w-full items-center justify-center'>
                  <MultiSelectCameras 
                    limitTags={3} 
                    selectedValues={selectedCameraObjects}
                    options={camerasOption} 
                    onChange={handleCameraChange}
                    placeHolder={t('placeholder.checkpoint-2')}
                  />
                </div>
              </div>

              <div className='flex items-end gap-1 ml-2'>
                <Button
                  type='submit'
                  variant="contained"
                  className="primary-btn"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{
                    width: t('button.search-width'),
                    height: "40px",
                    textTransform: 'capitalize',
                    '& .MuiSvgIcon-root': { 
                      fontSize: 26 
                    } 
                  }}
                  >
                  {t('button.search')}
                </Button>
                <Button 
                  variant="outlined" 
                  className="secondary-btn" 
                  onClick={handleClearSearch}
                  sx={{
                    width: t('button.clear-width'),
                    height: "40px",
                    textTransform: 'capitalize',
                  }}
                >
                  {t('button.clear')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Export */}
        <div className='flex gap-1 items-end sm:justify-center justify-end'>
          <IconButton 
            className="tertiary-btn"
            sx={{
              borderRadius: "4px !important",
              height: "40px",
            }}
            onClick={exportToExcel}
          >
            <img src={ExcelIcon} alt='Excel Icon' className='w-5 h-5' />
          </IconButton>

          <IconButton 
            className="tertiary-btn"
            sx={{
              borderRadius: "4px !important",
              height: "40px",
            }}
            onClick={exportToPdf}
          >
            <img src={PDFIcon} alt='PDF Icon' className='w-5 h-5' />
          </IconButton>
        </div>
      </div>

      <div className='flex flex-col py-2 gap-2 overflow-auto'>
        <div className='grid xl:grid-cols-[1fr_500px] gap-2'>
          {/* Vehicle Detect Per Hour Chart */}
          <div 
            className='border border-[#2B9BED] xl:rounded-[20px_0_0_0]'
          >
            <div className='flex flex-col p-2'>
              <div className='flex items-center justify-start gap-2'>
                <img src={ChartIcon} alt="Chart" className='w-5 h-5' />
                <Typography variant="body1" color="white" className="font-semibold">{t('chart.vehicle-detect-per-hour')}</Typography>
              </div>
              <div ref={vehicleDetectPerHourChartRef}>
                <VehicleDetectPerHourChart
                  data={detectionHourly}
                  isPrint={isPrinting}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Passing Checkpoint */}
          <div 
            className='border border-[#2B9BED] bg-white xl:rounded-[0_20px_0_0]'
          >
            <div className='flex flex-col p-2'>
              <div className='flex items-center justify-start gap-2'>
                <img src={ChartBlueIcon} alt="Chart" className='w-5 h-5' />
                <Typography variant="body1" color="#1A6DDF" className="font-semibold">{t('chart.vehicle-pass-checkpoint')}</Typography>
              </div>
              <VehiclePassCheckpoint
                dailyDate={i18n.language === "th" ? dayjs(detectionSummary?.todayDate).locale("th").format('DD MMMM BBBB') : dayjs(detectionSummary?.todayDate).format('DD MMMM YYYY')}
                dailyValue={detectionSummary?.today.toString() || ""}
                monthlyDate={i18n.language === "th" ? dayjs(detectionSummary?.thisMonthDate).locale("th").format('MMMM BBBB') : dayjs(detectionSummary?.thisMonthDate).format('MMMM YYYY')}
                monthlyValue={detectionSummary?.thisMonth.toString() || ""}
                yearlyDate={dayjs(detectionSummary?.thisYearDate).format(i18n.language === "th" ? 'BBBB' : 'YYYY')}
                yearlyValue={detectionSummary?.thisYear.toString() || ""}
              />
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 xl:grid-cols-[1fr_500px_500px] gap-2'>
          {/* Vehicle Passing Checkpoint Yearly */}
          <div 
            className='border border-[#2B9BED] xl:rounded-[0_0_0_20px] relative'
          >
            { isMonthlyChartLoading && <ChartLoading /> }
            <div className='flex flex-col p-2'>
              <div className='relative flex justify-between gap-2'>
                <div className='flex gap-2 items-start justify-start'>
                  <img src={ChartIcon} alt="Chart" className='w-5 h-5' />
                  <Typography variant="body1" color="white" className="font-semibold">{t('chart.vehicle-pass-checkpoint-yearly')}</Typography>
                </div>
                <div className='absolute flex items-end justify-end w-[100px] right-0 bottom-[-30px] z-[10]'>
                  <DatePickerBuddhist 
                    value={formData.checkpointPassYearly} 
                    onChange={(e) => handleDateChange("checkpointPassYearly", e)}
                    openTo="year"
                    views={['year']}
                  />
                </div>
              </div>
              <div ref={vehiclePassCheckpointYearlyRef} className='relative'>
                <VehiclePassCheckpointYearly
                  data={detectionMonthly}
                  isPrint={isPrinting}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Passing Checkpoint Weekly */}
          <div className='border border-[#2B9BED] relative'>
            { isWeeklyChartLoading && <ChartLoading /> }
            <div className='flex flex-col p-2 gap-4'>
              <div className='flex items-center justify-start gap-2'>
                <img src={ChartIcon} alt="Chart" className='w-5 h-5' />
                <Typography variant="body1" color="white" className="font-semibold">{t('chart.vehicle-pass-weekly')}</Typography>
              </div>
              <div className='flex items-center justify-center'>
                <div className='flex items-center justify-center w-[75%] gap-3'>
                  <DatePickerBuddhist 
                    value={formData.checkpointPassWeeklyStart} 
                    onChange={(e) => handleDateChange("checkpointPassWeeklyStart", e)}
                  />
                  <Divider sx={{ borderColor: "#5F5F5F", width: "5px" }} />
                  <DatePickerBuddhist 
                    value={formData.checkpointPassWeeklyEnd} 
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
              <div ref={vehiclePassCheckpointsWeeklyRef}>
                <VehiclePassCheckpointWeekly
                  data={detectionWeekly}
                  isPrint={isPrinting}
                />
              </div>
            </div>
          </div>

          {/* Special Plate */}
          <div 
            className='border border-[#2B9BED] bg-white xl:rounded-[0_0_20px_0] relative'
          >
            { isSpecialPlateChartLoading && <ChartLoading /> }
            <div className='flex flex-col p-2'>
              <div className='flex items-center justify-start gap-2'>
                <img src={ChartBlueIcon} alt="Chart" className='w-5 h-5' />
                <Typography variant="body1" color="#1A6DDF" className="font-semibold">{t('chart.special-plate')}</Typography>
              </div>
              <form onSubmit={handleSubmit(handleSpecialPlateChartSearch)} className='flex items-center justify-center mt-2'>
                <div className='flex items-center justify-center w-[75%] gap-3'>
                  <DatePickerBuddhist 
                    value={specialPlateData.specialPlateStart} 
                    onChange={(e) => {
                      handleDateSpecialPlateChange("specialPlateStart", e);
                      setValue("specialPlateStart", e);
                    }}
                    error={!!errors.arrest_date}
                    register={register("specialPlateStart", { 
                      required: true,
                    })}
                  />
                  <Divider sx={{ borderColor: "#5F5F5F", width: "5px" }} />
                  <DatePickerBuddhist 
                    value={specialPlateData.specialPlateEnd} 
                    onChange={(e) => {
                      handleDateSpecialPlateChange("specialPlateEnd", e);
                      setValue("specialPlateEnd", e);
                    }}
                    error={!!errors.arrest_date}
                    register={register("specialPlateEnd", { 
                      required: true,
                    })}
                  />
                  <IconButton
                    type='submit'
                    className='primary-btn'
                    sx={{
                      borderRadius: 2,
                      height: "40px",
                      width: "40px",
                    }}
                  >
                    <Icon icon={Search} size={30} color="#FFFFFF"></Icon>
                  </IconButton>
                </div>
              </form>
              <div ref={specialPlateChartRef}>
                <VehicleWithSpecialPlateChart 
                  data={detectionSpecialPlate}
                  isPrint={isPrinting}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chart;
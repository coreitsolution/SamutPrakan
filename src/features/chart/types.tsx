export interface VehicleDetectPerHourChartData {
  hour: number;
  label: string;
  count: number;
}

export interface DetectionHourlyResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: VehicleDetectPerHourChartData[];
}

export interface DetectionSummary {
  today: number;
  thisMonth: number;
  thisYear: number;
}

export interface DetectionSummaryResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: DetectionSummary;
}

export interface VehiclePassCheckpointData {
  todayDate: string;
  today: number;
  thisMonthDate: string;
  thisMonth: number;
  thisYearDate: string;
  thisYear: number;
}

export interface DetectionMonthly {
  month: number;
  label: string;
  total: number;
  bySpecialPlate: ByPlateClass[];
}

export interface ByPlateClass {
  plate_class_id: number | null;
  plate_class_title_en: string;
  count: number;
}

export interface DetectionMonthlyResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: DetectionMonthly[];
}

export interface VehiclePassCheckpointYearlyData {
  month: number;
  monthFormat?: string;
  total_vehicle: number;
  total_black_list: number;
  total_watch_list: number;
}

export interface DetectionWeekly {
  date: string;
  day_of_week: number;
  label: string;
  count: number;
}

export interface DetectionWeeklyResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: DetectionWeekly[];
}

export interface VehiclePassCheckpointWeeklyData {
  date: string;
  dateFormat?: string;
  total_vehicle: number;
}

export interface VehicleWithSpecialPlateData {
  id: number;
  date: string;
  total_black_list: number;
  total_watch_list: number;
  total_vehicle: number;
}

export interface VehicleWithSpecialPlatePieData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export interface DetectionSpecialPlate {
  total: number;
  byPlateClass: ByPlateClass[];
}

export interface DetectionSpecialPlateResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: DetectionSpecialPlate;
}

interface SpecialPlateChartData {
  dateFrom: string;
  dateTo: string;
  total_black_list: number;
  total_watch_list: number;
}

interface Year {
  year: string;
}

export interface StatisticPdfData {
  checkpoints: string;
  vehiclePassCheckpoints: VehiclePassCheckpointData | null;
  imageVehiclePassCheckpointsPerHour: string;
  imageVehiclePassCheckpointsYearly: string;
  vehiclePassCheckpointsYearlyData: Year;
  imageVehiclePassCheckpointsWeekly: string;
  vehiclePassCheckpointsWeeklyData: DateRange;
  imageSpecialPlateChart: string;
  specialPlateChartData: SpecialPlateChartData;
}
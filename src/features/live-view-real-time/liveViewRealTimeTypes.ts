import { VehicleBodyTypeDetail, VehicleColorDetail, VehicleMakesDetail, VehicleModelsDetail } from "../dropdown/dropdownTypes"
import { MapPosition, DirectionDetail } from "../types"
export interface LastRecognitionResult {
  message?: string
  status?: string
  success?: string
  data?: LastRecognitionData[]
}

export interface RegionInfo {
  id: number
  name_th: string
  name: string
}

export interface LastRecognitionData {
  id: number
  camera_info: CameraInfo
  epoch_start: string
  epoch_end: string
  camera_id: number
  plate: string
  plate_confidence: string
  gps_latitude: number
  gps_longitude: number
  is_special_plate: boolean
  plate_image_url: string
  region_info: RegionInfo
  vehicle_body_type: string
  vehicle_body_type_info: VehicleBodyTypeDetail
  vehicle_color: string
  vehicle_color_info: VehicleColorDetail
  vehicle_image_url: string
  vehicle_make: string
  vehicle_make_info: VehicleMakesDetail
  vehicle_make_model: string
  vehicle_model_info: VehicleModelsDetail
  special_plate_id: number
  special_plate: LprSpecialPlateDetail | null
  camera_name: string
  map?: MapPosition[]
  directionDetail?: DirectionDetail[]
}

export interface RealTimeLprData {
  id: number
  camera_uid: string
  camera: string
  checkpoint_name: string
  vehicle_make: string
  vehicle_body_type_en: string
  vehicle_body_type_th: string
  vehicle_model: string
  vehicle_color: string
  vehicle_color_en: string
  vehicle_color_th: string
  plate: string
  plate_prefix: string
  plate_number: string
  region_code: string
  region_name_en: string
  region_name_th: string
  vehicle_image_url: string
  plate_image_url: string
  overview_image_url: string
  epoch_end: string
  plate_confidence: string
  is_special_plate: number
  special_plate_id: number | null
  plate_class_title_en: string
  plate_class_title_th: string
  map?: MapPosition[]
  directionDetail?: DirectionDetail[]
}

export interface AlprDataResponse {
  message?: string
  status?: string
  success?: string
  data?: AlprData[]
}

export interface AlprData {
  id: number;
  ref_id: number;
  company_id: string;
  organization: string;
  camera_uid: string;
  checkpoint_uid: string; 
  checkpoint_name: string;
  checkpoint_ip: string;
  gps_latitude: number;
  gps_longitude: number;
  epoch_start: string; 
  epoch_end: string;
  country_code: string;
  region_code: string;
  region_confidence: number;
  plate: string;
  plate_prefix: string;
  plate_number: string;
  plate_confidence: number;
  is_special_plate: boolean;
  special_plate_id: number;
  plate_class_id: number;
  vehicle_body_type: string;
  vehicle_body_type_confidence: number;
  vehicle_make: string;
  vehicle_make_confidence: number;
  vehicle_model: string;
  vehicle_model_confidence: number;
  vehicle_color: string;
  vehicle_color_confidence: number;
  vehicle_year: string;
  vehicle_year_confidence: number;
  travel_direction: number;
  source_image_width: number;
  source_image_height: number;
  overview_image_width: number;
  overview_image_height: number;
  vehicle_region_x: number;
  vehicle_region_y: number;
  vehicle_region_width: number;
  vehicle_region_height: number;
  plate_x1: number;
  plate_x2: number;
  plate_x3: number;
  plate_x4: number;
  plate_y1: number;
  plate_y2: number;
  plate_y3: number;
  plate_y4: number;
  overview_image_url: string;
  vehicle_image_url: string;
  plate_image_url: string;
  lane: string;
  data_sync_state: string;
  data_sync_date: string;
  images_sync_state: string;
  images_sync_date: string;
  data_sync_retry_count: number;
  image_sync_retry_count: number;
  user_data: string;
  created_at: string;
  updated_at: string;
  alpr_camera_id: number;
}

export interface CameraInfo {
  id: number
  camera_name: string
}

export interface LprSpecialPlateDetail {
  id: number
  plate_class_info: PlateClass
  behavior: string
  case_owner_name: string
  case_owner_agency: string
}

export interface PlateClass {
  id: number
  title_en: string
}

export interface VehicleCountResult {
  message?: string
  status?: string
  success?: string
  data?: VehicleCountData[]
}

export interface VehicleCountData {
  startHour: string
  endHour: string
  normalPlateCount: number
  specialPlateCount: number
  totalCount: number
}

export interface ConnectionResult {
  id: number
  sendingTime: string
  ipServer: string
  port: number
  host: number
  sendCompleted: number
  pending: number
  status: number
}

export interface SystemStatusResult {
  message?: string
  status?: string
  success?: string
  data?: SystemStatusData[]
}

export interface SystemStatusData {
  id: number
  log_timestamp: string
  log_level: string
  category: string
  status: string
  details: string
  created_at: string
  updated_at: string
}

export interface ZipDownload {
  message?: string
  status?: string
  success?: string
  data?: ZipDownloadDetail
}

export interface ZipDownloadDetail {
  zipUrl: string
}
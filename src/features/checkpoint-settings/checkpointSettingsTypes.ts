import { Pagination } from "../types"

export interface Checkpoint {
  id: number;
  uid: string;
  checkpoint_uid?: string;
  checkpoint_name: string;
  checkpoint_ip: string;
  organization: string;
  province_code: string;
  province_name?: string;
  district_code: string;
  district_name?: string;
  subdistrict_code: string;
  subdistrict_name?: string;
  route: string;
  latitude: number;
  longitude: number;
  serial_number: string;
  license_key: string;
  officer_name: string;
  officer_phone: string;
  live_view_count: number;
  visible?: boolean;
  active?: boolean;
  deleted?: boolean;
  alive?: number;
  last_online?: string;
  last_check?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckpointResponse {
  message?: string
  status?: string
  success?: boolean
  pagination: Pagination
  data: Checkpoint[]
}

export type NewCheckpointSetting = Omit<Checkpoint, "id">;
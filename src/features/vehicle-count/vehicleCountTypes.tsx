export interface VehicleCount {
  count: number;
}

export interface VehicleCountResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: VehicleCount;
}
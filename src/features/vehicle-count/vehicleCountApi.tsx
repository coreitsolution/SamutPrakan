// Config
import { getUrls } from '../../config/runtimeConfig';
import { isDevEnv } from "../../config/environment";

// Utils
import { fetchClient, combineURL } from "../../utils/fetchClient"

// Types
import {
  VehicleCountResponse,
} from './vehicleCountTypes';

// Mocks
import { mockVehicleCount } from "../../mocks/mockVehicleCount";

const statusCode = 200;
const status = "Successful";
const success = true;
const message = "OK with data";

export const fetchVehicleCount = async (param?: Record<string, string>): Promise<VehicleCountResponse> => {
  const { CENTER_API } = getUrls();
  if (isDevEnv) {
    const data = {
      statusCode,
      status,
      success,
      message,
      data: mockVehicleCount
    }
    return Promise.resolve(data);
  }
  return await fetchClient<VehicleCountResponse>(combineURL(CENTER_API, "/lpr-data/detection-count"), {
    method: "GET",
    queryParams: param,
  });
};
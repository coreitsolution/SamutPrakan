import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// Constants
import { Status } from "../../constants/statusEnum";

// API
import { fetchVehicleCount } from "../../features/vehicle-count/vehicleCountApi";

// Types
import {
  VehicleCountResponse,
} from './vehicleCountTypes';

interface VehicleCountState {
  vehicleCount: VehicleCountResponse | null;
  cameraSelected: string[];
  vehicleCountStatus: Status;
  vehicleCountError: string | null;
}

const initialState: VehicleCountState = {
  vehicleCount: null,
  cameraSelected: [],
  vehicleCountStatus: Status.IDLE,
  vehicleCountError: null,
}

export const fetchVehicleCountThunk = createAsyncThunk(
  "vehicleCount/fetchVehicleCount",
  async (param?: Record<string, string>) => {
    const response = await fetchVehicleCount(param);
    return response;
  }
);

const vehicleCountSlice = createSlice({
  name: "vehicleCount",
  initialState,
  reducers: {
    setCameraSelected: (state, action: PayloadAction<string[]>) => {
      state.cameraSelected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleCountThunk.pending, (state) => {
        state.vehicleCountStatus = Status.LOADING;
        state.vehicleCountError = null;
      })
      .addCase(fetchVehicleCountThunk.fulfilled, (state, action) => {
        state.vehicleCountStatus = Status.SUCCEEDED;
        state.vehicleCount = action.payload;

        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {});
        }
      })
      .addCase(fetchVehicleCountThunk.rejected, (state, action) => {
        state.vehicleCountStatus = Status.FAILED;
        state.vehicleCountError =
          action.error.message || "Failed to fetch vehicle count";
      });
  }
})

export const { setCameraSelected } = vehicleCountSlice.actions;

export default vehicleCountSlice.reducer
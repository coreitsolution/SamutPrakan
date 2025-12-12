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
  checkpointSelected: string[];
  vehicleCountStatus: Status;
  vehicleCountError: string | null;
}

const initialState: VehicleCountState = {
  vehicleCount: null,
  checkpointSelected: [],
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
    setCheckpointSelected: (state, action: PayloadAction<string[]>) => {
      state.checkpointSelected = action.payload;
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
      })
      .addCase(fetchVehicleCountThunk.rejected, (state, action) => {
        state.vehicleCountStatus = Status.SUCCEEDED;
        state.vehicleCountError = action.error.message || "Failed to fetch vehicle count";
      })
  }
})

export const { setCheckpointSelected } = vehicleCountSlice.actions;

export default vehicleCountSlice.reducer
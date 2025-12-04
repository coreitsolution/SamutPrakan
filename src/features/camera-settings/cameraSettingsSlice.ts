import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchCameraSettings,
  deleteCameraSetting,
  startStream,
  stopStream,
  restartStream,
} from "./cameraSettingsAPI";
import {
  CameraSettings,
  CameraSettingsData,
  StreamDetail,
  StartStopStream,
} from "./cameraSettingsTypes";
import { Status } from "../../constants/statusEnum";

interface CameraSettingsState {
  cameraDetailSetting: CameraSettingsData[];
  cameraSettings: CameraSettings | null;
  streamDetail: StreamDetail[];
  cameraSettingsStatus: Status;
  cameraSettingsError: string | null;
}

const initialState: CameraSettingsState = {
  cameraSettings: null,
  cameraDetailSetting: [],
  streamDetail: [],
  cameraSettingsStatus: Status.IDLE,
  cameraSettingsError: null,
};

export const fetchCameraSettingsThunk = createAsyncThunk(
  "cameraSettings/fetchCameraSettings",
  async (param?: Record<string, string>) => {
    const response = await fetchCameraSettings(param);
    return response;
  }
);

export const deleteCameraSettingThunk = createAsyncThunk<number, number, { rejectValue: string }>(
  "cameraSettings/deleteCameraSetting",
  async (id: number, { rejectWithValue  }) => {
    try {
      await deleteCameraSetting(id);
      return id;
    } 
    catch (error) {
      return rejectWithValue((error as { message: string }).message || "Failed to delete camera setting"); 
    }
  }
);

export const postStartStreamThunk = createAsyncThunk(
  "cameraSettings/startStream",
  async (uid: StartStopStream) => {
    const response = await startStream(uid);
    return response;
  }
);

export const postStopStreamThunk = createAsyncThunk(
  "cameraSettings/stopStream",
  async (uid: StartStopStream) => {
    const response = await stopStream(uid);
    return response;
  }
);

export const postRestartStreamThunk = createAsyncThunk(
  "cameraSettings/restartStream",
  async () => {
    const response = await restartStream();
    return response;
  }
);


const cameraSettingsSlice = createSlice({
  name: "cameraSetting",
  initialState,
  reducers: {
    clearCameraSettingsData: (state) => {
      state.cameraSettingsStatus = Status.IDLE;
      state.cameraSettingsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCameraSettingsThunk.pending, (state) => {
        state.cameraSettingsStatus = Status.LOADING;
        state.cameraSettingsError = null;
      })
      .addCase(fetchCameraSettingsThunk.fulfilled, (state, action) => {
        state.cameraSettingsStatus = Status.SUCCEEDED;
        state.cameraSettings = action.payload;
      })
      .addCase(fetchCameraSettingsThunk.rejected, (state, action) => {
        state.cameraSettingsStatus = Status.FAILED;
        state.cameraSettingsError = action.error.message || "Failed to fetch cameraSettings";
      })
      .addCase(deleteCameraSettingThunk.pending, (state) => {
        state.cameraSettingsStatus = Status.LOADING;
        state.cameraSettingsError = null;
      })
      .addCase(deleteCameraSettingThunk.fulfilled, (state, action) => {
        state.cameraSettingsStatus = Status.SUCCEEDED;
        if (state.cameraDetailSetting) {
          state.cameraDetailSetting = state.cameraDetailSetting.filter(
            (setting) => setting.id !== action.payload
          );
        }
      })
      .addCase(deleteCameraSettingThunk.rejected, (state, action) => {
        state.cameraSettingsStatus = Status.FAILED;
        state.cameraSettingsError = action.payload || "Failed to delete camera setting";
      })

      // Stream
      .addCase(postStartStreamThunk.pending, (state) => {
        state.cameraSettingsStatus = Status.LOADING;
        state.cameraSettingsError = null;
      })
      .addCase(postStartStreamThunk.fulfilled, (state) => {
        state.cameraSettingsStatus = Status.SUCCEEDED;
      })
      .addCase(postStartStreamThunk.rejected, (state, action) => {
        state.cameraSettingsStatus = Status.FAILED;
        state.cameraSettingsError = action.error.message || "Failed to post start stream";
      })

      .addCase(postStopStreamThunk.pending, (state) => {
        state.cameraSettingsStatus = Status.LOADING;
        state.cameraSettingsError = null;
      })
      .addCase(postStopStreamThunk.fulfilled, (state) => {
        state.cameraSettingsStatus = Status.SUCCEEDED;
      })
      .addCase(postStopStreamThunk.rejected, (state, action) => {
        state.cameraSettingsStatus = Status.FAILED;
        state.cameraSettingsError = action.error.message || "Failed to post stop stream";
      })

      .addCase(postRestartStreamThunk.pending, (state) => {
        state.cameraSettingsStatus = Status.LOADING;
        state.cameraSettingsError = null;
      })
      .addCase(postRestartStreamThunk.fulfilled, (state) => {
        state.cameraSettingsStatus = Status.SUCCEEDED;
      })
      .addCase(postRestartStreamThunk.rejected, (state, action) => {
        state.cameraSettingsStatus = Status.FAILED;
        state.cameraSettingsError = action.error.message || "Failed to post restart stream";
      })
  },
});

export const { clearCameraSettingsData } = cameraSettingsSlice.actions;
export default cameraSettingsSlice.reducer;

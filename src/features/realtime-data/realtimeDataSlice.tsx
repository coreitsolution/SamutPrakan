import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "../../constants/statusEnum";
import { RealTimeLprData } from "../../features/types";

interface RealtimeDataState {
  realtimeData: RealTimeLprData[];
  toastNotification: RealTimeLprData[];
  realtimeDataStatus: Status;
  realtimeDataError: string | null;
}

const initialState: RealtimeDataState = {
  realtimeData: [],
  toastNotification: [],
  realtimeDataStatus: Status.IDLE,
  realtimeDataError: null,
}

const realtimeDataSlice = createSlice({
  name: "realtimeData",
  initialState,
  reducers: {
    upsertRealtimeData: (state, action: PayloadAction<RealTimeLprData>) => {
      const newItem = action.payload;
      
      const exists = state.realtimeData.some((d) => d.id === newItem.id);
      if (exists) return;

      state.realtimeData.unshift(newItem);

      const cameraItemsIndices = state.realtimeData
        .map((item, index) => (item.camera_uid === newItem.camera_uid ? index : -1))
        .filter((index) => index !== -1);

      if (cameraItemsIndices.length > 20) {
        const oldestIndexForThisCamera = cameraItemsIndices[cameraItemsIndices.length - 1];
        state.realtimeData.splice(oldestIndexForThisCamera, 1);
      }

      if (state.realtimeData.length > 1000) {
        state.realtimeData.pop();
      }
    },
    addToastMessage: (state, action: PayloadAction<RealTimeLprData>) => {
      const exists = state.toastNotification.some(t => t.id === action.payload.id);
      if (!exists) {
        state.toastNotification.push(action.payload);
      }
    },
    updateToastMessage: (state, action: PayloadAction<RealTimeLprData[]>) => {
      state.toastNotification = action.payload;
    },
  },
})

export const { upsertRealtimeData, addToastMessage, updateToastMessage } = realtimeDataSlice.actions;
export default realtimeDataSlice.reducer;
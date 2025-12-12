import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Constants
import { Status } from "../../constants/statusEnum";

// API
import {
  fetchSuspectPeople,
} from "./suspectPeopleApi";

// Types
import {
  SuspectPeopleResponse,
} from "../types";

interface DropdownState {
  suspectPeople: SuspectPeopleResponse | null;
  dropdownStatus: Status;
  dropdownError: string | null;
}

const initialState: DropdownState = {
  suspectPeople: null,
  dropdownStatus: Status.IDLE,
  dropdownError: null,
}

export const fetchSuspectPeopleThunk = createAsyncThunk(
  "suspectPeople/fetchSuspectPeople",
  async (param?: Record<string, string>) => {
    const response = await fetchSuspectPeople(param);
    return response;
  }
);

const specialPlateSlice = createSlice({
  name: "specialPlate",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuspectPeopleThunk.pending, (state) => {
        state.dropdownStatus = Status.LOADING;
        state.dropdownError = null;
      })
      .addCase(fetchSuspectPeopleThunk.fulfilled, (state, action) => {
        state.dropdownStatus = Status.SUCCEEDED;
        state.suspectPeople = action.payload;
      })
      .addCase(fetchSuspectPeopleThunk.rejected, (state, action) => {
        state.dropdownStatus = Status.SUCCEEDED;
        state.dropdownError = action.error.message || "Failed to fetch suspect people";
      });
  }
})

export default specialPlateSlice.reducer
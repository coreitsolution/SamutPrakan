import { getUrls } from '../../config/runtimeConfig';
import { fetchClient, combineURL } from "../../utils/fetchClient"
import { isDevEnv } from "../../config/environment"
import {
  CameraSettings,
  StartStopStream,
} from "./cameraSettingsTypes"
import {
  cameraDetailSettingsData,
} from "../../mocks/mockCameraSettings"

let mockData = [...cameraDetailSettingsData]
let mockDataDetail = [...cameraDetailSettingsData]

export const fetchCameraSettings = async (param?: Record<string, string>): Promise<CameraSettings> => {
  const { API_URL } = getUrls();
  if (isDevEnv) {
    const data = {
      data: mockData,
      pagination: {
        page: 1,
        maxPage: 1,
        limit: 10,
        count: 1,
        countAll: 1,
      },
    }
    return Promise.resolve(data)
  }
  return await fetchClient<CameraSettings>(combineURL(API_URL, "/cameras/get"), {
    method: "GET",
    queryParams: param,
  })
}

export const deleteCameraSetting = async (id: number): Promise<void> => {
  const { API_URL } = getUrls();
  if (isDevEnv) {
    const index = mockDataDetail.findIndex((setting) => setting.id === id)
    if (index !== -1) {
      mockDataDetail.splice(index, 1)
    }
    return Promise.resolve()
  }

  const deleteId = { id: id }
  return await fetchClient<void>(combineURL(API_URL, `/cameras/delete`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deleteId),
  })
}

export const startStream = async (uid: StartStopStream) => {
  const { STREAM_URL } = getUrls();
  if (isDevEnv) {

  }
  return await fetchClient(combineURL(STREAM_URL, "/live/start"), {
    method: "POST",
    body: JSON.stringify(uid),
    isStream: true,
  })
}

export const stopStream = async (uid: StartStopStream) => {
  const { STREAM_URL } = getUrls();
  if (isDevEnv) {

  }
  return await fetchClient(combineURL(STREAM_URL, "/live/stop"), {
    method: "POST",
    body: JSON.stringify(uid),
    isStream: true,
  })
}

export const restartStream = async () => {
  const { SERVICE_1_URL } = getUrls();
  if (isDevEnv) {

  }
  return await fetchClient(combineURL(SERVICE_1_URL, "/services/restart-live"), {
    method: "POST",
    isService1: true,
  })
}
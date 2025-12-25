import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../../../app/store"
import { format } from "date-fns"
import { fetchClient, combineURL } from "../../../utils/fetchClient"
import { getUrls } from '../../../config/runtimeConfig';
import { useForm } from "react-hook-form";

// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from "@mui/material/Typography";

// Types
import {
  CameraDetailSettings,
  CameraSettingsDataResponse,
} from "../../../features/camera-settings/cameraSettingsTypes"
import { 
  Districts,
  SubDistricts,
  DistrictsDetail, 
  SubDistrictsDetail,
} from "../../../features/dropdown/dropdownTypes";
import {
  Option,
} from "../../../features/types";

// Components
import TextBox from "../../../components/text-box/TextBox"
import AutoComplete from "../../../components/auto-complete/AutoComplete"

// Icon
import { Icon } from "../../../components/icons/Icon"
import { Save } from "lucide-react"

// Pop-up
import { PopupMessage, PopupMessageWithCancel } from "../../../utils/popupMessage"

// Utils
import { getId } from "../../../utils/commonFunction"

// Constants
import { DEFAULT_DETECTION_AREA } from "../../../constants/detectionArea"

// i18n
import { useTranslation } from "react-i18next";

interface FormData {
  uid?: string;
  checkpointId: string;
  isLocationSettingOpen: boolean;
  isSensorSettingOpen: boolean;
  rtspLiveView: string;
  streamEncodeSelect: number | Option;
  apiServer: string;
  rtspProcess: string;
  number_of_detections: number;
  province_code: string | Option;
  district_code: string | Option;
  subdistrict_code: string | Option;
  route: string;
  latitude: string;
  longitude: string;
};

interface CameraSettingProps {
  open: boolean
  closeDialog: () => void
  selectedRow: CameraDetailSettings | null
  isEditMode: boolean
}

const CameraSetting: React.FC<CameraSettingProps> = ({
  open,
  closeDialog,
  selectedRow,
  isEditMode,
}) => {
  // i18n
  const { t, i18n } = useTranslation();

  const { API_URL } = getUrls();

  const [originalData, setOriginalData] = useState<CameraDetailSettings | null>(
    null
  )
  const [formData, setFormData] = useState<FormData>({
    uid: undefined,
    checkpointId: "",
    isLocationSettingOpen: false,
    isSensorSettingOpen: false,
    rtspLiveView: "",
    streamEncodeSelect: 0,
    apiServer: "",
    rtspProcess: "",
    number_of_detections: 0,
    province_code: "",
    district_code: "",
    subdistrict_code: "",
    route: "",
    latitude: "",
    longitude: "",
  })
  const [districtsList, setDistrictsList] = useState<DistrictsDetail[]>([])
  const [subDistrictsList, setSubDistrictsList] = useState<SubDistrictsDetail[]>([])

  const {
    provinces,
    streamEncodes,
  } = useSelector((state: RootState) => state.dropdownData)

  // Options
  const [streamEncodesOptions, setStreamEncodesOptions] = useState<{ label: string ,value: number }[]>([])
  const [provincesOptions, setProvincesOptions] = useState<{ label: string ,value: string }[]>([])
  const [subDistrictsOptions, setSubDistrictsOptions] = useState<{ label: string ,value: string }[]>([])
  const [districtsOptions, setDistrictsOptions] = useState<{ label: string ,value: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm();

  useEffect(() => {
    if (isEditMode && selectedRow) {
      setFormData((prev) => ({
        ...prev,
        uid: selectedRow.uid,
        isLoading: false,
        isLocationSettingOpen: false,
        isSensorSettingOpen: false,
        checkpointId: selectedRow.camera_name,
        rtspLiveView: selectedRow.rtsp_live_url,
        streamEncodeSelect: selectedRow.stream_encode_id,
        apiServer: selectedRow.api_server_url,
        rtspProcess: selectedRow.rtsp_process_url,
        number_of_detections: 0,
        province_code: selectedRow.province_code,
        district_code: selectedRow.district_code,
        subdistrict_code: selectedRow.subdistrict_code,
        route: selectedRow.route,
        latitude: selectedRow.latitude.toString(),
        longitude: selectedRow.longitude.toString(),
      }))
      setOriginalData(selectedRow)

      setValue("checkpointId", selectedRow.camera_name);
      setValue("rtspLiveView", selectedRow.rtsp_live_url);
      setValue("streamEncodeSelect", selectedRow.stream_encode_id);
      setValue("apiServer", selectedRow.api_server_url);
      setValue("rtspProcess", selectedRow.rtsp_process_url);
      setValue("number_of_detections", 0);
      setValue("province_code", selectedRow.province_code);
      setValue("district_code", selectedRow.district_code);
      setValue("subdistrict_code", selectedRow.subdistrict_code);
      setValue("route", selectedRow.route);
      setValue("latitude", selectedRow.latitude.toString());
      setValue("longitude", selectedRow.longitude.toString());
    }
    else {
      setFormData({
        uid: undefined,
        checkpointId: "",
        isLocationSettingOpen: false,
        isSensorSettingOpen: false,
        rtspLiveView: "",
        streamEncodeSelect: 0,
        apiServer: "",
        rtspProcess: "",
        number_of_detections: 0,
        province_code: "",
        district_code: "",
        subdistrict_code: "",
        route: "",
        latitude: "",
        longitude: "",
      })

      setValue("checkpointId", "");
      setValue("rtspLiveView", "");
      setValue("streamEncodeSelect", "");
      setValue("apiServer", "");
      setValue("rtspProcess", "");
      setValue("number_of_detections", 0);
      setValue("province_code", "");
      setValue("district_code", "");
      setValue("subdistrict_code", "");
      setValue("route", "");
      setValue("latitude", "");
      setValue("longitude", "");
    }
  }, [
    open
  ])

  useEffect(() => {
    if (streamEncodes && streamEncodes.data) {
      const options = streamEncodes.data.map((row) => ({
        label: row.encode_name,
        value: row.id,
      }))
      setStreamEncodesOptions(options)
    }
  }, [streamEncodes])

  useEffect(() => {
    if (provinces && provinces.data) {
      const options = provinces.data.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.province_code,
      }))
      setProvincesOptions(options)
    }
  }, [provinces, i18n.language])

  useEffect(() => {
    if (districtsList) {
      const options = districtsList.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.district_code,
      }))
      setDistrictsOptions(options)
    }
  }, [districtsList, i18n.language])

  useEffect(() => {
    if (subDistrictsList) {
      const options = subDistrictsList.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.subdistrict_code,
      }))
      setSubDistrictsOptions(options)
    }
  }, [subDistrictsList, i18n.language])

  useEffect(() => {
    const fetchData = async () => {
      if (formData.province_code) {
        const res = await fetchClient<Districts>(combineURL(API_URL, "/districts/get"), {
          method: "GET",
          queryParams: {
            filter: `province_code=${formData.province_code}`
          },
        });
        if (res && res.data) {
          setDistrictsList(res.data)
        }
      }
      if (formData.province_code && formData.district_code) {
        const res = await fetchClient<SubDistricts>(combineURL(API_URL, "/subdistricts/get"), {
          method: "GET",
          queryParams: {
            filter: `province_code=${formData.province_code},district_code=${formData.district_code}`
          },
        });
        if (res && res.data) {
          setSubDistrictsList(res.data)
        }
      }
    }
    fetchData()
  }, [formData.province_code, formData.district_code, formData.subdistrict_code])

  const hasChanges = () => {
    if (!originalData || !formData) return false;
    return (
      originalData.camera_name !== formData.checkpointId ||
      originalData.rtsp_live_url !== formData.rtspLiveView ||
      originalData.rtsp_process_url !== formData.rtspProcess ||
      originalData.stream_encode_id !== formData.streamEncodeSelect ||
      originalData.api_server_url !== formData.apiServer ||
      originalData.province_code !== formData.province_code ||
      originalData.district_code !== formData.district_code ||
      originalData.subdistrict_code !== formData.subdistrict_code ||
      originalData.route !== formData.route ||
      originalData.latitude !== formData.latitude ||
      originalData.longitude !== formData.longitude
    );
  };

  const handleDropdownChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValue(key, value);
  }

  const createCameraSettings = async (data: any) => {
    const defaultDetectionArea = DEFAULT_DETECTION_AREA

    try {
      const body = {
        camera_name: data.checkpointId,
        rtsp_live_url: data.rtspLiveView,
        rtsp_process_url: data.rtspProcess,
        stream_encode_id: getId(data.streamEncodeSelect),
        api_server_url: data.apiServer || "",
        province_code: getId(data.province_code),
        district_code: getId(data.district_code),
        subdistrict_code: getId(data.subdistrict_code),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        route: data.route,
        detection_area: JSON.stringify(defaultDetectionArea),
        visible: true,
        active: true,
      }

      const result = await fetchClient<CameraSettingsDataResponse>(combineURL(API_URL, "/cameras/create"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      })

      if (!result.success) {
        PopupMessage(t('message.error.something-wrong-occur'), (result.message || t('message.error.something-wrong-occur')), "error");
        return;
      }
  
      PopupMessage(t('message.success.data-saved-successfully'), t('message.success.data-saved-successfully-detail'), "success")
      closeDialog();
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.something-wrong-occur'), t('message.error.setting-camera-error', { error: errorMessage }), "error");
    }
  }

  const updateCameraSettings = async (data: any) => {
    if (!selectedRow?.id) {
      console.error("The selected row does not have a valid 'id'.");
      return null;
    }

    const confirmed = await PopupMessageWithCancel(t('message.warning.edit-confirmation'), t('message.warning.do-you-want-to-continue'), t('button.confirm'), t('button.cancel'), "warning", "#FDB600")

    if (!confirmed) return;

    try {
      const body = {
        uid: selectedRow.uid,
        checkpoint_uid: selectedRow.checkpoint_uid,
        camera_name: data.checkpointId,
        rtsp_live_url: data.rtspLiveView,
        rtsp_process_url: data.rtspProcess,
        stream_encode_id: getId(data.streamEncodeSelect),
        api_server_url: data.apiServer || "",
        province_code: getId(data.province_code),
        district_code: getId(data.district_code),
        subdistrict_code: getId(data.subdistrict_code),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        route: data.route,
        visible: true,
        active: true,
        createdAt: selectedRow.created_at,
        updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      }

      const result = await fetchClient<CameraSettingsDataResponse>(combineURL(API_URL, "/cameras/update"), {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      })

      if (!result.success) {
        PopupMessage(t('message.error.error-while-updating-data'), (result.message || t('message.error.something-wrong-occur')), "error");
        return;
      }
  
      PopupMessage(t('message.success.data-saved-successfully'), t('message.success.data-saved-successfully-detail'), "success")
      closeDialog();
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.something-wrong-occur'), t('message.error.setting-update-camera-error', { error: errorMessage }), "error");
    }
  };
  

  const onSubmit = async (data: any) => {
    if (isEditMode && selectedRow) {
      if (!hasChanges()) {
        PopupMessage(
          t('message.warning.no-change-found'),
          t('message.warning.data-not-change'),
          "warning"
        )
        return;
      }
  
      await updateCameraSettings(data);
    } 
    else {
      await createCameraSettings(data);
    }   
  }

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValue(key, value);
  }

  const handleLatitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const cleaned = input
                      .replace(/[^0-9.]/g, '')     
                      .replace(/(\..*)\./g, '$1'); 
    
    handleTextChange("latitude", cleaned)
    return cleaned
  }

  const handleLongitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const cleaned = input
                      .replace(/[^0-9.]/g, '')     
                      .replace(/(\..*)\./g, '$1'); 
    
    handleTextChange("longitude", cleaned)
    return cleaned
  }

  const handleProvinceChange = (
    event: React.SyntheticEvent,
    value: { value: any ,label: string } | null
  ) => {
    event.preventDefault()
    if (value) {
      handleDropdownChange("province_code", value.value)
    }
    else {
      handleDropdownChange("province_code", '')
      handleDropdownChange("district_code", '')
      handleDropdownChange("subdistrict_code", '')
    }
  }

  const handleDistrictChange = (
    event: React.SyntheticEvent,
    value: { value: any ,label: string } | null
  ) => {
    event.preventDefault()
    if (value) {
      handleDropdownChange("district_code", value.value)
    }
    else {
      handleDropdownChange("district_code", '')
      handleDropdownChange("subdistrict_code", '')
    }
  }

  const handleSubDistrictChange = (
    event: React.SyntheticEvent,
    value: { value: any ,label: string } | null
  ) => {
    event.preventDefault()
    if (value) {
      handleDropdownChange("subdistrict_code", value.value)
    }
    else {
      handleDropdownChange("subdistrict_code", '')
    }
  }

  const handleStreamEncodeChange = (
    event: React.SyntheticEvent,
    value: { value: any ,label: string } | null
  ) => {
    event.preventDefault()
    if (value) {
      handleDropdownChange("streamEncodeSelect", value.value)
    }
    else {
      handleDropdownChange("streamEncodeSelect", '')
    }
  }

  const handleCloseDialog = () => {
    clearData();
    closeDialog();
  }

  const clearData = () => {
    setFormData({
      uid: undefined,
      checkpointId: "",
      isLocationSettingOpen: false,
      isSensorSettingOpen: false,
      rtspLiveView: "",
      streamEncodeSelect: 0,
      apiServer: "",
      rtspProcess: "",
      number_of_detections: 0,
      province_code: "",
      district_code: "",
      subdistrict_code: "",
      route: "",
      latitude: "",
      longitude: "",
    })
    setValue("checkpointId", "");
    setValue("rtspLiveView", "");
    setValue("streamEncodeSelect", "");
    setValue("apiServer", "");
    setValue("rtspProcess", "");
    setValue("number_of_detections", "");
    setValue("province_code", "");
    setValue("district_code", "");
    setValue("subdistrict_code", "");
    setValue("route", "");
    setValue("latitude", "");
    setValue("longitude", "");
    clearErrors();
  }

  return (
    <Dialog id="camera-setting" open={open} maxWidth="xl" fullWidth sx={{ zIndex: 1000 }}>
      <DialogTitle className="bg-black">
        <div>
          <Typography variant="h5" color="white" className="font-bold">{t('screen.camera-setting')}</Typography>
        </div>
      </DialogTitle>
      <DialogContent className="bg-black">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-black text-white p-[30px] border-[1px] border-dodgerBlue w-full">
            {/* Header */}
            <div>
              <div className="flex mb-[20px]">
                <label className="text-[20px]">{t('text.camera-data')}</label>
              </div>
              <div className="grid grid-cols-2 lt1443:grid-cols-1 gap-[60px]">
                {/* First Column */}
                <div>
                  <div className="my-[10px]">
                    <TextBox
                      id="checkpoint-id"
                      label={t('component.id-camera')}
                      value={formData.checkpointId}
                      onChange={(event) =>
                        handleTextChange("checkpointId", event.target.value)
                      }
                      sx={{ marginTop: "15px", fontSize: "15px" }}
                      register={register("checkpointId", { 
                        required: true,
                      })}
                      error={!!errors.checkpointId}
                    />
                  </div>
                  <div className="my-[10px]">
                    <TextBox
                      id="rtsp-live-view"
                      label={t('component.rtsp-live-view')}
                      value={formData.rtspLiveView}
                      onChange={(event) =>
                        handleTextChange("rtspLiveView", event.target.value)
                      }
                      sx={{ marginTop: "15px", fontSize: "15px" }}
                      register={register("rtspLiveView", { 
                        required: true,
                      })}
                      error={!!errors.rtspLiveView}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <AutoComplete 
                      id="province-select"
                      sx={{ marginTop: "15px"}}
                      value={formData.province_code}
                      onChange={handleProvinceChange}
                      options={provincesOptions}
                      label={t('component.province-name')}
                      labelFontSize="15px"
                      register={register("province_code", { 
                        required: true,
                      })}
                      error={!!errors.province_code}
                    />
                    <AutoComplete 
                      id="district-select"
                      sx={{ marginTop: "15px"}}
                      value={formData.district_code}
                      onChange={handleDistrictChange}
                      options={districtsOptions}
                      label={t('component.district-name')}
                      labelFontSize="15px"
                      disabled={!formData.province_code  ? true : false}
                      register={register("district_code", { 
                        required: true,
                      })}
                      error={!!errors.district_code}
                    />
                  </div>
                  <TextBox
                    id="latitude"
                    label={t('component.location-lat')}
                    value={formData.latitude}
                    onChange={handleLatitudeChange}
                    sx={{ marginTop: "15px", fontSize: "15px" }}
                    register={register("latitude", { 
                      required: true,
                    })}
                    error={!!errors.latitude}
                  />
                </div>
                {/* Seconds Column */}
                <div>
                  <div className="grid grid-cols-2 gap-[60px] my-[10px]">
                    <AutoComplete 
                      id="stream-encode-select"
                      sx={{ marginTop: "15px"}}
                      value={formData.streamEncodeSelect}
                      onChange={handleStreamEncodeChange}
                      options={streamEncodesOptions}
                      label={t('component.stream-encode')}
                      labelFontSize="15px"
                      register={register("streamEncodeSelect", { 
                        required: true,
                      })}
                      error={!!errors.streamEncodeSelect}
                    />
                    <TextBox
                      id="api-server"
                      label={t('component.api-server')}

                      value={formData.apiServer}
                      onChange={(event) =>
                        handleTextChange("apiServer", event.target.value)
                      }
                      sx={{ marginTop: "15px", fontSize: "15px" }}
                      register={register("apiServer", { 
                        required: true,
                      })}
                      error={!!errors.apiServer}
                    />
                  </div>
                  <div className="my-[10px]">
                    <TextBox
                      id="rtsp-process"
                      label={t('component.rtsp-process')}

                      value={formData.rtspProcess}
                      onChange={(event) =>
                        handleTextChange("rtspProcess", event.target.value)
                      }
                      sx={{ marginTop: "15px", fontSize: "15px" }}
                      register={register("rtspProcess", { 
                        required: true,
                      })}
                      error={!!errors.rtspProcess}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <AutoComplete 
                      id="subdistrict-select"
                      sx={{ marginTop: "15px"}}
                      value={formData.subdistrict_code}
                      onChange={handleSubDistrictChange}
                      options={subDistrictsOptions}
                      label={t('component.sub-district-name')}
                      labelFontSize="15px"
                      disabled={!formData.district_code ? true : false}
                      register={register("subdistrict_code", { 
                        required: true,
                      })}
                      error={!!errors.subdistrict_code}
                    />
                    <TextBox
                      id="route"
                      label={t('component.route-name')}

                      value={formData.route}
                      onChange={(event) =>
                        handleTextChange("route", event.target.value)
                      }
                      sx={{ marginTop: "15px", fontSize: "15px" }}
                      register={register("route", { 
                        required: true,
                      })}
                      error={!!errors.route}
                    />
                  </div>
                  <TextBox
                    id="longitude"
                    label={t('component.location-lon')}
                    value={formData.longitude}
                    onChange={handleLongitudeChange}
                    sx={{ marginTop: "15px", fontSize: "15px" }}
                    register={register("longitude", { 
                      required: true,
                    })}
                    error={!!errors.longitude}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end my-6 ml-7">
            <button
              type="submit"
              className="flex items-center justify-center bg-dodgerBlue w-[90px] h-[40px] rounded mr-[10px]"
            >
              <Icon icon={Save} size={20} color="white" />
              <span className="ml-[5px] text-white">{t('button.confirm')}</span>
            </button>
            <button
              type="button"
              className="bg-white border-[1px] border-dodgerBlue text-dodgerBlue w-[90px] h-[40px] rounded"
              onClick={handleCloseDialog}
            >
              {t('button.cancel')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CameraSetting

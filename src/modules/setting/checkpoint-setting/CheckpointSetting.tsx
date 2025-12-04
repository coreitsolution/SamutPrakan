import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../../../app/store"
import { fetchClient, combineURL } from "../../../utils/fetchClient"
import { getUrls } from '../../../config/runtimeConfig';
import { useForm } from "react-hook-form";

// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

// Types
import { 
  Districts,
  DistrictsDetail, 
  SubDistricts,
  SubDistrictsDetail,
  Option,
} from "../../../features/dropdown/dropdownTypes";
import { 
  CheckpointResponse,
  Checkpoint,
} from "../../../features/checkpoint-settings/checkpointSettingsTypes"

// Components
import TextBox from "../../../components/text-box/TextBox"
import AutoComplete from "../../../components/auto-complete/AutoComplete"

// Icon
import { Icon } from "../../../components/icons/Icon"
import { Save } from "lucide-react"

// Pop-up
import { PopupMessage, PopupMessageWithCancel } from "../../../utils/popupMessage"

// Utils
import { formatPhone, getId } from "../../../utils/commonFunction"

// i18n
import { useTranslation } from "react-i18next";

interface CheckpointSettingProps {
  open: boolean
  closeDialog: () => void
  checkpointData: Checkpoint | null
  isEditMode: boolean
}

interface FormData {
  id?: number
  checkpoint_ip: string
  checkpoint_name: string
  organization: string
  province_code: string | Option
  district_code: string | Option
  subdistrict_code: string | Option
  route: string
  latitude: string
  longitude: string
  case_owner_name: string
  case_owner_phone: string
  pcSerialNumber: string
  license: string
}

const CheckpointSetting: React.FC<CheckpointSettingProps> = ({
  open,
  closeDialog,
  checkpointData,
  isEditMode,
}) => {

  // i18n
  const { t, i18n } = useTranslation();

  const { API_URL } = getUrls();

  const [formData, setFormData] = useState<FormData>({
    id: undefined,
    checkpoint_ip: "",
    checkpoint_name: "",
    organization: "",
    province_code: "",
    district_code: "",
    subdistrict_code: "",
    route: "",
    latitude: "",
    longitude: "",
    case_owner_name: "",
    case_owner_phone: "",
    pcSerialNumber: "",
    license: "",
  })

  const {
    provinces,
    prefix,
    positions,
  } = useSelector((state: RootState) => state.dropdownData)

  const { authData } = useSelector((state: RootState) => state.auth);

  // Options
  const [provincesOptions, setProvincesOptions] = useState<{ label: string ,value: string }[]>([])
  const [subDistrictsOptions, setSubDistrictsOptions] = useState<{ label: string ,value: string }[]>([])
  const [districtsOptions, setDistrictsOptions] = useState<{ label: string ,value: string }[]>([])
  
  // Data
  const [districtsList, setDistrictsList] = useState<DistrictsDetail[]>([])
  const [subDistrictsList, setSubDistrictsList] = useState<SubDistrictsDetail[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm();

  useEffect(() => {
    if (
      provinces?.data &&
      provinces?.data?.length > 0 &&
      prefix?.data && prefix?.data.length > 0 &&
      positions?.data && positions?.data.length > 0
    ) {
      if (isEditMode && checkpointData) {
        const ownerPrefix = prefix?.data?.find((prefix) => prefix.id === authData?.userInfo?.title_id)
        const ownerName = authData.userInfo ? `${ownerPrefix ? i18n.language === "th" ? ownerPrefix.title_th : ownerPrefix.title_en : ""}${authData?.userInfo?.firstname} ${authData?.userInfo?.lastname}` : "-";
        const ownerPhone = authData.userInfo ? formatPhone(authData?.userInfo?.phone) : "-";

        setFormData((prev) => ({
          ...prev,
          id: checkpointData.id,
          checkpoint_ip: checkpointData.checkpoint_ip,
          checkpoint_name: checkpointData.checkpoint_name,
          organization: checkpointData.organization,
          province_code: checkpointData.province_code,
          district_code: checkpointData.district_code,
          subdistrict_code: checkpointData.subdistrict_code,
          route: checkpointData.route,
          latitude: checkpointData.latitude.toString(),
          longitude: checkpointData.longitude.toString(),
          case_owner_name: ownerName,
          case_owner_phone: ownerPhone,
          pcSerialNumber: checkpointData.serial_number,
          license: checkpointData.license_key,
        }));

        setValue("checkpoint_ip", checkpointData.checkpoint_ip);
        setValue("checkpoint_name", checkpointData.checkpoint_name);
        setValue("organization", checkpointData.organization);
        setValue("province_code", checkpointData.province_code);
        setValue("district_code", checkpointData.district_code);
        setValue("subdistrict_code", checkpointData.subdistrict_code);
        setValue("route", checkpointData.route);
        setValue("latitude", checkpointData.latitude.toString());
        setValue("longitude", checkpointData.longitude.toString());
        setValue("case_owner_name", ownerName);
        setValue("case_owner_phone", ownerPhone);
        setValue("pcSerialNumber", checkpointData.serial_number);
        setValue("license", checkpointData.license_key);
      }
    }
  }, [
    provinces,
    prefix,
    positions,
    isEditMode,
    checkpointData,
  ])

  const handleDropdownChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValue(key, value);
  }

  useEffect(() => {
    const fetchData = async () => {
      if (formData.province_code) {
        const res = await fetchClient<Districts>(combineURL(API_URL, "/districts/get"), {
          method: "GET",
          queryParams: { 
            filter: `province_code=${formData.province_code}`,
            limit: "100",
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
            filter: `province_code=${formData.province_code},district_code=${formData.district_code}`,
            limit: "100",
          },
        });
        if (res && res.data) {
          setSubDistrictsList(res.data)
        }
      }
    }
    fetchData()
  }, [formData.province_code, formData.district_code, formData.subdistrict_code])

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

  const isDataChange = () => {
    return (
      formData.checkpoint_ip !== checkpointData?.checkpoint_ip ||
      formData.checkpoint_name !== checkpointData?.checkpoint_name ||
      formData.organization !== checkpointData?.organization ||
      formData.province_code !== checkpointData?.province_code ||
      formData.district_code !== checkpointData?.district_code ||
      formData.subdistrict_code !== checkpointData?.subdistrict_code ||
      formData.route !== checkpointData?.route ||
      formData.latitude !== checkpointData?.latitude.toString() ||
      formData.longitude !== checkpointData?.longitude.toString() ||
      formData.pcSerialNumber !== checkpointData?.serial_number ||
      formData.license !== checkpointData?.license_key
    )
  }

  const onSubmit = async (data: any) => {
    try {
      if (isEditMode && !isDataChange()) {
        PopupMessage(
          t('message.warning.no-change-found'),
          t('message.warning.data-not-change'),
          "warning"
        )
        return;
      }

      if (isDataChange()) {
        const confirmed = await PopupMessageWithCancel(t('message.warning.edit-confirmation'), t('message.warning.do-you-want-to-continue'), t('button.confirm'), t('button.cancel'), "warning")
      
        if (!confirmed) {
          return;
        }
      }

      const body = { 
        checkpoint_ip: "10.1.1.1",
        checkpoint_name: data.checkpoint_name,
        organization: data.organization,
        province_code: getId(data.province_code),
        district_code: getId(data.district_code),
        subdistrict_code: getId(data.subdistrict_code),
        route: data.route,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        serial_number: data.pcSerialNumber,
        license_key: data.license,
        officer_name: data.case_owner_name,
        officer_phone: data.case_owner_phone.replaceAll("-", "").slice(0, 10),
      }

      const result = await fetchClient<CheckpointResponse>(combineURL(API_URL, "/checkpoints/config"), {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!result.status) {
        PopupMessage(t('message.error.error-while-saving-data'), (result.message || t('message.error.something-wrong-occur')), "error")
        return;
      }

      PopupMessage(t('message.success.data-saved-successfully'), t('message.success.data-saved-successfully-detail'), "success")
      closeDialog();
    } 
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.something-wrong-occur'), t('message.error.setting-station-error', { error: errorMessage }), "error");
    }    
  }

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValue(key, value);
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

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value.replace(/\D/g, '');
    
    input = input.slice(0, 10);

    const formatted = formatPhone(input);

    handleTextChange("case_owner_phone", formatted);
  };

  const handleCloseDialog = () => {
    clearData();
    closeDialog();
  }

  const clearData = () => {
    const ownerPrefix = prefix?.data?.find((prefix) => prefix.id === authData?.userInfo?.title_id)
    const ownerName = authData.userInfo ? `${ownerPrefix ? i18n.language === "th" ? ownerPrefix.title_th : ownerPrefix.title_en : ""}${authData?.userInfo?.firstname} ${authData?.userInfo?.lastname}` : "-";
    const ownerPhone = authData.userInfo ? formatPhone(authData?.userInfo?.phone) : "-";

    setFormData({
      id: undefined,
      checkpoint_ip: "",
      checkpoint_name: "",
      organization: "",
      province_code: "",
      district_code: "",
      subdistrict_code: "",
      route: "",
      latitude: "",
      longitude: "",
      case_owner_name: ownerName,
      case_owner_phone: ownerPhone,
      pcSerialNumber: "",
      license: "",
    })
    setValue("checkpoint_ip", "");
    setValue("checkpoint_name", "");
    setValue("organization", "");
    setValue("province_code", "");
    setValue("district_code", "");
    setValue("subdistrict_code", "");
    setValue("route", "");
    setValue("latitude", "");
    setValue("longitude", "");
    setValue("case_owner_name", ownerName);
    setValue("case_owner_phone", ownerPhone);
    setValue("pcSerialNumber", "");
    setValue("license", "");
    clearErrors();
  }

  return (
    <Dialog id="checkpoint-setting" open={open} maxWidth="xl" fullWidth sx={{ zIndex: 1000 }}>
      <DialogTitle className='bg-black'>
        <div className="flex justify-between items-center bg-black">
          <Typography variant="h5" color="white" className="font-bold">{t('screen.add-edit-station')}</Typography>
          <button
            onClick={handleCloseDialog} 
            className="text-white bg-transparent border-0 text-[28px] pr-6"
          >
            &times;
          </button>
        </div>
      </DialogTitle>
      <DialogContent className='bg-black'>
        <form onSubmit={handleSubmit(onSubmit)} onError={(e) => console.log(e)}>
          <div className="bg-black text-white p-[30px] border-[1px] border-dodgerBlue w-full">
            {/* Checkpoint Information */}
            <div>
              <div className="flex mb-[20px]">
                <label className="text-[20px]">{t('text.station-data')}</label>
              </div>
              <div className="grid grid-cols-2 lt1443:grid-cols-1 gap-[60px]">
                {/* First Column */}
                <div>
                  <div className="my-[10px]">
                    <TextBox
                      id="checkpoint-name"
                      label={t('component.checkpoint-name')}
                      value={formData.checkpoint_name}
                      onChange={(event) =>
                        handleTextChange("checkpoint_name", event.target.value)
                      }
                      register={register("checkpoint_name", { 
                        required: true,
                      })}
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      error={!!errors.checkpoint_name}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <AutoComplete 
                      id="province-select"
                      sx={{ marginTop: "10px"}}
                      value={formData.province_code}
                      onChange={handleProvinceChange}
                      options={provincesOptions}
                      label={t('component.province-name')}
                      labelFontSize="16px"
                      register={register("province_code", { 
                        required: true,
                      })}
                      error={!!errors.province_code}
                    />
                    <AutoComplete 
                      id="district-select"
                      sx={{ marginTop: "10px"}}
                      value={formData.district_code}
                      onChange={handleDistrictChange}
                      options={districtsOptions}
                      label={t('component.district-name')}
                      labelFontSize="16px"
                      disabled={!formData.province_code  ? true : false}
                      register={register("district_code", { 
                        required: true,
                      })}
                      error={!!errors.district_code}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <TextBox
                      id="latitude"
                      label={t('component.location-lat')}
                      value={formData.latitude}
                      onChange={(event) =>
                        handleTextChange("latitude", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("latitude", { 
                        required: true,
                      })}
                      error={!!errors.latitude}
                    />
                    <TextBox
                      id="longitude"
                      label={t('component.location-lon')}
                      value={formData.longitude}
                      onChange={(event) =>
                        handleTextChange("longitude", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("longitude", { 
                        required: true,
                      })}
                      error={!!errors.longitude}
                    />
                  </div>
                </div>
                {/* Seconds Column */}
                <div>
                  <div className="my-[10px]">
                    <TextBox
                      id="organization"
                      label={t('component.organization-name')}
                      value={formData.organization}
                      onChange={(event) =>
                        handleTextChange("organization", event.target.value)
                      }
                      register={register("organization", { 
                        required: true,
                      })}
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      error={!!errors.organization}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <AutoComplete 
                      id="subdistrict-select"
                      sx={{ marginTop: "10px"}}
                      value={formData.subdistrict_code}
                      onChange={handleSubDistrictChange}
                      options={subDistrictsOptions}
                      label={t('component.sub-district-name')}
                      labelFontSize="16px"
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
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("route", { 
                        required: true,
                      })}
                      error={!!errors.route}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-[10px]">
                    <TextBox
                      id="serial-number"
                      label={t('component.pc-serial-number')}
                      value={formData.pcSerialNumber}
                      onChange={(event) =>
                        handleTextChange("pcSerialNumber", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("pcSerialNumber", { 
                        required: true,
                      })}
                      error={!!errors.pcSerialNumber}
                    />
                    <TextBox
                      id="license"
                      label={t('component.license')}
                      value={formData.license}
                      onChange={(event) =>
                        handleTextChange("license", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("license", { 
                        required: true,
                      })}
                      error={!!errors.license}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Divider sx={{ borderColor: "#2B9BED", my: "10px" }} />
            {/* Officer Information */}
            <div>
              <div className="flex mb-[20px]">
                <label className="text-[20px]">{t('text.officer-data')}</label>
              </div>
              <div className="grid grid-cols-2 gap-[60px]">
                <div className="grid grid-cols-2 gap-5 my-[10px]">
                  <TextBox
                    sx={{ marginTop: "10px", fontSize: "15px" }}
                    id="case-owner-name"
                    label={t('component.owner-name')}
                    value={formData.case_owner_name}
                    onChange={(event) =>
                      handleTextChange("case_owner_name", event.target.value)
                    }
                    placeholder={t('placeholder.owner-name')}
                    register={register("case_owner_name", { 
                      required: false,
                    })}
                    error={!!errors.case_owner_name}
                    disabled={true}
                  />

                  <TextBox
                    sx={{ marginTop: "10px", fontSize: "15px" }}
                    id="case-owner-phone"
                    label={t('component.phone')}
                    value={formData.case_owner_phone}
                    onChange={handlePhoneChange}
                    placeholder={t('placeholder.phone-number')}
                    register={register("case_owner_phone", { 
                      required: false,
                    })}
                    error={!!errors.case_owner_phone}
                    disabled={true}
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

export default CheckpointSetting

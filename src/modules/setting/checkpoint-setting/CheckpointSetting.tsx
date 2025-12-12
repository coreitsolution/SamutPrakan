import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "../../../app/store"
import { fetchClient, combineURL } from "../../../utils/fetchClient"
import { getUrls } from '../../../config/runtimeConfig';
import { useForm } from "react-hook-form";

// Material UI
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Types
import { 
  Districts,
  DistrictsResponse, 
  SubDistricts,
  SubDistrictsResponse,
  Option,
} from "../../../features/dropdown/dropdownTypes";
import { 
  CheckpointResponse,
  Checkpoint,
} from "../../../features/types"

// Components
import TextBox from "../../../components/text-box/TextBox"
import AutoComplete from "../../../components/auto-complete/AutoComplete"

// Icon
import { Save } from "lucide-react"

// Pop-up
import { PopupMessage, PopupMessageWithCancel } from "../../../utils/popupMessage"

// Utils
import { formatPhone, getId } from "../../../utils/commonFunction"

// i18n
import { useTranslation } from 'react-i18next';

interface FormData {
  uid?: string
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

interface CheckpointSettingProps {
  open: boolean
  onClose: () => void
  checkpointData: Checkpoint | null
  isEditMode: boolean
}

const CheckpointSetting: React.FC<CheckpointSettingProps> = ({
  open,
  onClose,
  checkpointData,
  isEditMode,
}) => {
  const { CENTER_API } = getUrls();

  // i18n
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    uid: undefined as string | undefined,
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

  const dispatch: AppDispatch = useDispatch()

  const {
    provinces,
    positions,
    prefix,
  } = useSelector((state: RootState) => state.dropdownData)
  const { authData } = useSelector((state: RootState) => state.auth);

  // Options
  const [provincesOptions, setProvincesOptions] = useState<{ label: string ,value: string }[]>([])
  const [subDistrictsOptions, setSubDistrictsOptions] = useState<{ label: string ,value: string }[]>([])
  const [districtsOptions, setDistrictsOptions] = useState<{ label: string ,value: string }[]>([])
  
  // Data
  const [districtsList, setDistrictsList] = useState<Districts[]>([])
  const [subDistrictsList, setSubDistrictsList] = useState<SubDistricts[]>([])

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
      positions?.data && positions?.data.length > 0 &&
      open
    ) {
      if (isEditMode && checkpointData) {
        const ownerPrefix = prefix?.data?.find((prefix) => prefix.id === authData?.userInfo?.title_id)
        const ownerName = authData.userInfo ? `${ownerPrefix ? i18n.language === "th" ? ownerPrefix.title_th : ownerPrefix.title_en : ""}${authData?.userInfo?.firstname} ${authData?.userInfo?.lastname}` : "-";
        const ownerPhone = authData.userInfo ? formatPhone(authData?.userInfo?.phone) : "-";

        setFormData((prev) => ({
          ...prev,
          uid: checkpointData.uid,
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
        }))
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
        setValue("pcSerialNumber", checkpointData.serial_number || "-");
        setValue("license", checkpointData.license_key);

      }
    }
  }, [
    provinces,
    prefix,
    positions,
    isEditMode,
    checkpointData,
    open,
  ])

  const handleDropdownChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValue(key, value);
  }

  useEffect(() => {
    const fetchData = async () => {
      if (formData.province_code) {
        try {
          const res = await fetchClient<DistrictsResponse>(combineURL(CENTER_API, "/districts/get"), {
            method: "GET",
            queryParams: { 
              filter: `province_code=${formData.province_code}`,
              limit: "100",
            },
          });
          if (res.success) {
            setDistrictsList(res.data);
          }
        }
        catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
        }
      }
      if (formData.district_code) {
        try {
          const res = await fetchClient<SubDistrictsResponse>(combineURL(CENTER_API, "/subdistricts/get"), {
            method: "GET",
            queryParams: { 
              filter: `province_code=${formData.province_code},district_code=${formData.district_code}`,
              limit: "100",
            },
          });
          if (res.success) {
            setSubDistrictsList(res.data);
          }
        }
        catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
        }
      }
    };
    fetchData();
  }, [dispatch, formData.province_code, formData.district_code]);

  useEffect(() => {
    if (provinces && provinces.data) {
      const options = provinces.data.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.province_code,
      }))
      setProvincesOptions(options)
    }
  }, [provinces])

  useEffect(() => {
    if (districtsList) {
      const options = districtsList.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.district_code,
      }))
      setDistrictsOptions(options)
    }
  }, [districtsList])

  useEffect(() => {
    if (subDistrictsList) {
      const options = subDistrictsList.map((row) => ({
        label: i18n.language === "th" ? row.name_th : row.name_en,
        value: row.subdistrict_code,
      }))
      setSubDistrictsOptions(options)
    }
  }, [subDistrictsList])

  const isDataChange = () => {
    return (
      formData.checkpoint_name !== checkpointData?.checkpoint_name ||
      formData.organization !== checkpointData?.organization ||
      formData.province_code !== checkpointData?.province_code ||
      formData.district_code !== checkpointData?.district_code ||
      formData.subdistrict_code !== checkpointData?.subdistrict_code ||
      formData.route !== checkpointData?.route ||
      formData.latitude !== checkpointData?.latitude ||
      formData.longitude !== checkpointData?.longitude ||
      formData.pcSerialNumber !== checkpointData?.serial_number ||
      formData.license !== checkpointData?.license_key
    )
  }

  const onSubmit = async (data: any) => {
    try {
      if (!isDataChange()) {
        PopupMessage(
          t('message.warning.no-change-found'),
          t('message.warning.data-not-change'),
          "warning"
        )
        return;
      }

      const confirmed = await PopupMessageWithCancel(t('message.warning.edit-confirmation'), t('message.warning.edit-confirmation-message'), t('button.confirm'), t('button.cancel'), "warning", "#FDB600")

      if (!confirmed) return;

      const body = JSON.stringify({
        uid: formData.uid,
        checkpoint_ip: formData.checkpoint_ip,
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
      })

      const response = await fetchClient<CheckpointResponse>(combineURL(CENTER_API, "/checkpoints/update"), {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body,
      })

      if (response.success) {
        PopupMessage(t('message.success.save-success'), t('message.success.save-success-message'), "success");
        clearData();
        onClose();
      }
    } 
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-saving'), errorMessage, "error");
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
  }

  const handleCloseDialog = () => {
    clearData();
    onClose();
  }

  const clearData = () => {
    const ownerPrefix = prefix?.data?.find((prefix) => prefix.id === authData?.userInfo?.title_id)
    const ownerName = authData.userInfo ? `${ownerPrefix ? i18n.language === "th" ? ownerPrefix.title_th : ownerPrefix.title_en : ""}${authData?.userInfo?.firstname} ${authData?.userInfo?.lastname}` : "-";
    const ownerPhone = authData.userInfo ? formatPhone(authData?.userInfo?.phone) : "-";

    setFormData({
      uid: undefined,
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
    setValue("checkpoint_name", "");
    setValue("organization", "");
    setValue("province_code", "");
    setValue("district_code", "");
    setValue("subdistrict_code", "");
    setValue("police_station_id", "");
    setValue("route", "");
    setValue("latitude", "");
    setValue("longitude", "");
    setValue("case_owner_name", ownerName);
    setValue("case_owner_phone", ownerPhone);
    setValue("pcSerialNumber", "");
    setValue("license", "");
    clearErrors();
  }

  const handleCancelClick = () => {
    clearData();
    onClose();
  };

  return (
    <Dialog id="checkpoint-setting" open={open} maxWidth="xl" fullWidth sx={{ zIndex: 1000 }}>
      <DialogTitle className='bg-black'>
        <div className="flex justify-between items-center bg-black">
          <Typography variant="h5" color="white" className="font-bold">{t('screen.checkpoint-setting.title')}</Typography>
          <button
            onClick={handleCloseDialog} 
            className="text-white bg-transparent border-0 text-[28px] pr-6"
          >
            &times;
          </button>
        </div>
      </DialogTitle>
      <DialogContent className='bg-black'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-black text-white p-[30px] border border-[#2B9BED] w-full">
            {/* Checkpoint Information */}
            <div>
              <div className="flex mb-[15px]">
                <label className="text-[20px]">{t('text.station-data')}</label>
              </div>
              <div className="grid grid-cols-2 lt1443:grid-cols-1 gap-[60px]">
                {/* First Column */}
                <div>
                  <div className="my-2.5">
                    <TextBox
                      id="checkpoint-name"
                      label={t('component.checkpoint-name')}
                      placeholder={t('placeholder.checkpoint-name')}
                      value={formData.checkpoint_name}
                      onChange={(event) =>
                        handleTextChange("checkpoint_name", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("checkpoint_name", { 
                        required: true,
                      })}
                      error={!!errors.checkpoint_name}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-2.5">
                    <AutoComplete 
                      id="province-select"
                      sx={{ marginTop: "10px"}}
                      value={formData.province_code}
                      onChange={handleProvinceChange}
                      options={provincesOptions}
                      label={t('component.province-name')}
                      placeholder={t('placeholder.province-name')}
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
                      placeholder={t('placeholder.district-name')}
                      labelFontSize="16px"
                      disabled={!formData.province_code ? true : false}
                      register={register("district_code", { 
                        required: true,
                      })}
                      error={!!errors.district_code}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-2.5">
                    <TextBox
                      id="latitude"
                      label={t('component.location-latitude')}
                      placeholder={t('placeholder.location-latitude')}
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
                      label={t('component.location-longitude')}
                      placeholder={t('placeholder.location-longitude')}
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
                  <div className="my-2.5">
                    <TextBox
                      id="organization"
                      label={t('component.organization-name')}
                      placeholder={t('placeholder.organization-name')}
                      value={formData.organization}
                      onChange={(event) =>
                        handleTextChange("organization", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      register={register("organization", { 
                        required: true,
                      })}
                      error={!!errors.organization}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5 my-2.5">
                    <AutoComplete 
                      id="subdistrict-select"
                      sx={{ marginTop: "10px"}}
                      value={formData.subdistrict_code}
                      onChange={handleSubDistrictChange}
                      options={subDistrictsOptions}
                      label={t('component.sub-district-name')}
                      placeholder={t('placeholder.sub-district-name')}
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
                      placeholder={t('placeholder.route-name')}
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
                  <div className="grid grid-cols-2 gap-5 my-2.5">
                    <TextBox
                      id="serial-number"
                      label={t('component.pc-serial-number')}
                      placeholder={t('placeholder.pc-serial-number')}
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
                      placeholder={t('placeholder.license')}
                      value={formData.license}
                      onChange={(event) =>
                        handleTextChange("license", event.target.value)
                      }
                      sx={{ marginTop: "10px", fontSize: "15px" }}
                      disabled={true}
                      register={register("license", { 
                        required: false,
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
              <div className="flex mb-[15px]">
                <label className="text-[20px]">{t('text.officer-data')}</label>
              </div>
              <div className="grid grid-cols-2 lt1443:grid-cols-1 gap-[60px]">
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
          <div className="flex justify-end my-6 ml-7 gap-2">
            <Button
              type='submit'
              variant="contained"
              className="primary-btn"
              startIcon={ <Save />}
              sx={{
                width: "100px",
                height: "40px",
                textTransform: "capitalize",
                '& .MuiSvgIcon-root': { 
                  fontSize: 20
                } 
              }}
            >
              {t('button.save')}
            </Button>
            <Button
              variant="text"
              className="cancel-btn"
              sx={{
                width: "100px",
                height: "40px",
                textTransform: "capitalize",
                '& .MuiSvgIcon-root': { 
                  fontSize: 20
                } 
              }}
              onClick={handleCancelClick}
            >
              {t('button.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CheckpointSetting

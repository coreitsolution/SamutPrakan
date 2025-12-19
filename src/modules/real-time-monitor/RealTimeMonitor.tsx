import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from "react-hook-form";
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { useSelector } from "react-redux"
import { RootState } from "../../app/store"
import { toast, ToastContainer } from 'react-toastify';
import { Map as LeafletMap } from 'leaflet';
import { AnimatePresence } from "framer-motion";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAppDispatch } from '../../app/hooks';

// Material UI
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

// Icons
import SearchIcon from '@mui/icons-material/Search';

// Context
import { useHamburger } from "../../context/HamburgerContext";

// Components
import MultiSelectCameras from '../../components/multi-select/MultiSelectCameras';
import BaseMap from '../../components/base-map/BaseMap';
import RealTimeToastify from '../../components/toastify/RealTimeToastify';
import FeedCard from '../../components/feed-card/FeedCard';
import FeedImages from '../../components/feed-images/FeedImages';

// Types
import {
  Camera,
  CameraResponse,
  SpecialPlate,
  NotificationList,
  RealTimeLprData,
} from "../../features/types";

// Images
import PinGoogleMap from "../../assets/icons/pin_google-maps.png";

// Utils
import { reformatString, getPlateTypeColor, formatNumber } from "../../utils/commonFunction";
import { fetchClient, combineURL } from "../../utils/fetchClient";
import { PopupMessage } from '../../utils/popupMessage';

// Hooks
import { useMapSearch } from "../../hooks/useOpenStreetMapSearch";

// Modules
import SearchCameras from "../search-cameras/SearchCameras";

// i18n
import { useTranslation } from 'react-i18next';

// Config
import { getUrls } from '../../config/runtimeConfig';

// API
import {
  updateToastMessage,
} from '../../features/realtime-data/realtimeDataSlice';
import {
  setCheckpointSelected
} from '../../features/vehicle-count/VehicleCountSlice';
import {
  fetchVehicleCountThunk
} from "../../features/vehicle-count/VehicleCountSlice";

dayjs.extend(buddhistEra);
dayjs.extend(utc);
dayjs.extend(timezone);

interface RealTimeMonitorProps {
  // Empty props as per original code
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = () => {
  const dispatch = useAppDispatch();
  const { CENTER_API, DETAIL_INFORMATION } = getUrls();

  // i18n
  const { t, i18n } = useTranslation();

  const { isOpen } = useHamburger()

  // Data
  const [prevCameraIds, setPrevCameraIds] = useState<Camera[]>([]);
  const [selectedCameraIds, setSelectedCameraIds] = useState<Camera[]>([]);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [cameraList, setCameraList] = useState<Camera[]>([])
  const [notificationList, setNotificationList] = useState<Map<string, NotificationList[]>>(new Map());
  const todayMidnight = dayjs().startOf('day');

  // State
  const [searchCheckpointsVisible, setSearchCheckpointsVisible] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isSearchClicked, setIsSearchClicked] = useState(true); 
  const [isShowLicensePlate, setIsShowLicensePlate] = useState(true);
  const [isShowFace, setIsShowFace] = useState(true);

  // Options
  const [camerasOption, setCamerasOption] = useState<{value: any, label: string}[]>([]);
  const [selectedCameraObjects, setSelectedCameraObjects] = useState<{value: any, label: string}[]>([]);

  // Ref
  const shownToastsRef = useRef<string[]>([]);

  // Redux
  const cameraRefreshKey = useSelector((state: RootState) => state.refresh.cameraRefreshKey);
  const sliceDropdown = useSelector((state: RootState) => state.dropdownData)
  const { toastNotification } = useSelector((state: RootState) => state.realTimeData)
  const sliceSpecialPlate = useSelector((state: RootState) => state.specialPlateData)
  // const sliceSuspectPeople = useSelector((state: RootState) => state.suspectPeopleData)
  const { realtimeData } = useSelector((state: RootState) => state.realTimeData)
  const { vehicleCount } = useSelector((state: RootState) => state.vehicleCountData)

  const {
    handleSubmit,
  } = useForm();
  
  const {
    searchSpecialCheckpoint,
    clearSearchPlaces,
    clearPlaceMarkerWithLocation,
  } = useMapSearch(map);

  useEffect(() => {
    return () => {
      setSearchCheckpointsVisible(false);
      setSelectedCameraIds([]);
      setSelectedCameraObjects([]);
      setPrevCameraIds([]);
    }
  }, [])

  useEffect(() => {
    setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
  }, [i18n.language, i18n.isInitialized])

  useEffect(() => {
    if (cameraList.length > 0) {
      const hasAll = selectedCameraObjects.some((v) => v.value === "0");
      const newCameraList = hasAll ? cameraList : cameraList.filter(c => selectedCameraObjects.map(sc => sc.value).includes(c.uid));
      setSelectedCameraIds(newCameraList);
      if (prevCameraIds.length === 0 && hasAll) {
        setPrevCameraIds(cameraList);
      }
      dispatch(fetchVehicleCountThunk({ cameraUids: cameraList.join(",") }));
    }
  }, [selectedCameraObjects, cameraList])

  useEffect(() => {
    if (cameraList) {
      const options = cameraList.map((row) => ({
        label: row.camera_name,
        value: row.uid,
      }))
      setCamerasOption([{ label: t('dropdown.all'), value: "0" }, ...options])
    }
  }, [cameraList, i18n.language, i18n.isInitialized])

  useEffect(() => {
    if (!toastNotification || toastNotification.length === 0 || !isSearchClicked) return;

    showToastsAndMapPin();
  }, [toastNotification, selectedCameraIds, isSearchClicked]);

  useEffect(() => {
    fetchData();
  }, [cameraRefreshKey]);

  useEffect(() => { 
    if (!notificationList || !isSearchClicked || !map) return;

    const runSearch = async () => {
      const camerasToProcess = isSearchClicked ? selectedCameraIds : prevCameraIds;

      const allNotificationItems: NotificationList[] = [];

      for (const camera of camerasToProcess) {
        const listForKey = notificationList.get(camera.uid) || [];

        const relevantList = listForKey.filter(item => 
            dayjs(item.detectTime, i18n.language === "th" ? "DD-MM-BBBB HH:mm:ss" : "DD-MM-YYYY HH:mm:ss").isAfter(todayMidnight)
        );

        const sortedList = [...relevantList].sort(
          (a, b) => new Date(a.detectTime).getTime() - new Date(b.detectTime).getTime()
        );

        const isLocationWithLabel = true;
        const defaultColor = "#FDCC0A";

        if (sortedList.length > 0) {
          const enhancedList = sortedList.map(item => ({
            ...item,
            iconColor: item.iconColor || "#DD2025",
            bgColor: item.bgColor || "#DD2025",
            isLocationWithLabel,
            isSpecialLocation: true
          }));

          allNotificationItems.push(...enhancedList); 
        } 
        else {
          const fallbackItem = {
            id: camera.id,
            camera_uid: camera.uid,
            camera_name: camera.camera_name || "",
            plate_number: "",
            plate_prefix: "",
            region_code: "",
            iconColor: defaultColor,
            bgColor: defaultColor,
            textShadow: "",
            isLocationWithLabel,
            isSpecialLocation: false,
            detectTime: "",
            camera_latitude: camera.latitude,
            camera_longitude: camera.longitude,
          };

          allNotificationItems.push(fallbackItem as NotificationList); 
        }
      }

      if (allNotificationItems.length > 0) {
        await searchSpecialCheckpoint(allNotificationItems); 
      }
    };

    runSearch();
  }, [notificationList, isSearchClicked, map]);


  useEffect(() => {
    if (map && cameraList.length > 0 && selectedCameraIds.length > 0 && isSearchClicked) {
      handleInitialSearch();
    }
  }, [map, cameraList, selectedCameraIds, isSearchClicked]);


  const fetchData = async () => {
    try {
      const res = await fetchClient<CameraResponse>(combineURL(CENTER_API, "/cameras/get"), {
        method: "GET",
        queryParams: {
          filter: `deleted=false`,
          limit: "5000",
        },
      });

      if (res.success) {
        setCameraList(res.data);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
    }
  };

  const showToastsAndMapPin = async () => {
    if (!isSearchClicked) return; 

    for (const data of toastNotification) {
      const uniqueKey = `${data.plate}-${data.epoch_end}`;

      if (shownToastsRef.current.includes(uniqueKey)) continue;

      // Match camera
      const cameraMatched = selectedCameraIds.find(
        (camera) => camera.uid === data.camera_uid
      );

      if (!cameraMatched) continue;

      shownToastsRef.current.unshift(uniqueKey);
      if (shownToastsRef.current.length > 20) {
        shownToastsRef.current = shownToastsRef.current.slice(0, 20);
      }

      const updatedData = {
        ...data,
        camera_name: cameraMatched.camera_name || "-",
        camera_latitude: cameraMatched.latitude || "",
        camera_longitude: cameraMatched.longitude || "",
      };

      const newEpochEnd = dayjs(data.epoch_end).format(
        i18n.language === "th" ? "DD-MM-BBBB HH:mm:ss" : "DD-MM-YYYY HH:mm:ss"
      );

      // Update notification list
      setNotificationList((prev) => {
        const newMap = new Map(prev);
        const key = data.camera_uid;
        const existing = newMap.get(key) || [];

        newMap.set(key, [
          ...existing,
          {
            id: data.id,
            camera_uid: data.camera_uid,
            camera_name: updatedData.camera_name,
            plate_number: data.plate_number,
            plate_prefix: data.plate_prefix,
            region_code: data.region_code,
            iconColor: data.color,
            bgColor: data.pin_background_color,
            textShadow: data.text_shadow,
            isLocationWithLabel: true,
            isSpecialLocation: true,
            detectTime: newEpochEnd,
            camera_latitude: updatedData.camera_latitude,
            camera_longitude: updatedData.camera_longitude,
          },
        ]);
        return newMap;
      });

      // Show toast
      toast(
        ({ closeToast, ...toastProps }) => (
          <RealTimeToastify
            closeToast={closeToast}
            titleName={data.title_name}
            color={data.color}
            alertData={updatedData}
            type={data.detect_type}
            onDelete={() => {
              setNotificationList((prev) => {
                const newMap = new Map(prev);
                newMap.forEach((list, key) => {
                  const filtered = list.filter(
                    (item) => item.id !== updatedData.id
                  );
                  if (filtered.length > 0) newMap.set(key, filtered);
                  else newMap.delete(key);
                });
                return newMap;
              });
              const newData = toastNotification.filter(
                (item) => item.id !== updatedData.id
              );
              dispatch(updateToastMessage(newData));
              closeToast();
            }}
            {...toastProps}
          />
        ),
        {
          toastId: `realtime-toast-${updatedData.id}`,
          containerId: "realtime-toast",
          position: "bottom-left",
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: true,
          autoClose: false,
          closeButton: false,
          style: { marginBottom: "5px" },
        }
      );
    }
  };

  const drawBaseMapPins = async (cameras: Camera[]) => {
      // Clear previous checkpoints first
      clearSearchPlaces();
      
      const data = cameras.map((camera) => {
          const iconColor = "#FDCC0A"; // Default color
          const isLocationWithLabel = true;
          const isSpecialLocation = false;

          return {
              id: camera.id,
              camera_uid: camera.uid,
              camera_name: camera.camera_name,
              plate_number: "",
              plate_prefix: "",
              region_code: "",
              iconColor,
              bgColor: iconColor,
              textShadow: "",
              isLocationWithLabel,
              isSpecialLocation,
              detectTime: "",
              camera_latitude: camera.latitude,
              camera_longitude: camera.longitude,
          }
      })
      
      await searchSpecialCheckpoint(data);
  }

  const handleCameraChange = (ids: string[]) => {
    let newIds: string[];

    if (ids.length === 0 || ids.includes("0")) {
      newIds = ["0"];
    } else {
      newIds = ids;
    }

    const selectedObjects = camerasOption.filter(c => newIds.includes(c.value));
    setSelectedCameraObjects(selectedObjects);

    const hasAll = selectedObjects.some((v) => v.value === "0");
    setSelectedCameraIds(hasAll ? cameraList : cameraList.filter(c => newIds.includes(c.uid)));

    if (isSearchClicked) {
        setIsSearchClicked(false);
    }
  };

  const handleInitialSearch = async () => {
    if (selectedCameraIds.length === 0) return;

    setIsSearchClicked(true); 
    
    dispatch(setCheckpointSelected(selectedCameraIds.map((c) => c.uid)));
    setPrevCameraIds(selectedCameraIds);

    await drawBaseMapPins(selectedCameraIds);
  }

  const handleSearch = async () => {
    if (selectedCameraIds.length === 0) {
      clearSearchPlaces();
      dispatch(setCheckpointSelected([]));
      setPrevCameraIds([]);
      if (cameraList.length > 0) {
        setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
      }
      return;
    }
    
    setIsSearchClicked(true);
    
    const removedIds = prevCameraIds.filter(id => !selectedCameraIds.some(c => c.uid === id.uid));

    if (removedIds.length > 0) {
      removedIds.forEach(camera => {
        const removedCheckpoint = cameraList.find(cp => cp.uid === camera.uid);
        if (removedCheckpoint) {
          const location = {
            lat: parseFloat(removedCheckpoint.latitude),
            lng: parseFloat(removedCheckpoint.longitude),
          };
          clearPlaceMarkerWithLocation(location);
        }
      });
    }

    dispatch(setCheckpointSelected(selectedCameraIds.map((c) => c.uid)));
    setPrevCameraIds(selectedCameraIds);

    await drawBaseMapPins(selectedCameraIds);
  };

  const handleClearSearch = async () => {
    setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
    clearSearchPlaces();
    setIsSearchClicked(false); 
    setPrevCameraIds([]);
    dispatch(setCheckpointSelected([]));
  };

  const handleMapLoad = useCallback((mapInstance: LeafletMap | null) => {
    setMap(mapInstance)
  }, []);

  const handleCamerasSelected = (cameraSelected: {value: any, label: string}[]) => {
    setSelectedCameraObjects(cameraSelected);
    
    let newIds: string[];
    if (cameraSelected.length === 0 || cameraSelected.some(c => c.value === "0")) {
      newIds = ["0"];
    } else {
      newIds = cameraSelected.map(c => c.value);
    }
    
    const hasAll = cameraSelected.some((v) => v.value === "0");
    const updatedSelectedCameraIds = hasAll ? cameraList : cameraList.filter(c => newIds.includes(c.uid));
    
    setSelectedCameraIds(updatedSelectedCameraIds); 

    if (updatedSelectedCameraIds.length > 0) {
      setTimeout(() => handleSearch(), 0); 
    } 
    else {
      handleSearch();
    }
  };

  const getProvinceName = (regionCode: string) => {
    const province = sliceDropdown.regions?.data.find(region => region.region_code === regionCode);
    return province?.name_th || "";
  }

  const checkSpecialPlate = (platePrefix: string, plateNumber: string, region: string): SpecialPlate | undefined => {
    const specialPlate = sliceSpecialPlate.specialPlates?.data.find(sp => sp.plate_prefix === platePrefix && sp.plate_number === plateNumber && sp.region_code === region && sp.deleted === false && sp.active === true);
    return specialPlate
  };

  // const checkSpecialPerson = (prefixId: number, firstName: string, lastName: string): SuspectPeople | undefined => {
  //   const suspectPerson = sliceSuspectPeople.suspectPeople?.data.find(sp => sp.title_id === prefixId && sp.firstname === firstName && sp.lastname === lastName);
  //   return suspectPerson
  // };

  const getPlateClassName = (classId: number) => {
    const plateType = sliceDropdown.plateTypes?.data.find(type => type.id === classId);
    return plateType?.title_en || "-";
  }

  const createFeedVehicleInfo = (data: RealTimeLprData, index: number) => {
    const specialPlateData = checkSpecialPlate(data.plate_prefix, data.plate_number, data.region_code);
    const specialPlateName = getPlateClassName(specialPlateData ? specialPlateData.plate_class_id : 0);
    const { color, feedBackgroundColor  } = getPlateTypeColor(specialPlateName);
    const provinceName = getProvinceName(data.region_code);
    
    const vehicleColor = sliceDropdown.vehicleColors?.data.find(color => color.color === data.vehicle_color);

    let newVehicleColor = "-";
    if (vehicleColor) {
      newVehicleColor = i18n.language === "th"
        ? vehicleColor.color_th || "-"
        : vehicleColor.color_en || "-";
    } 
    else {
      newVehicleColor = data.vehicle_color || "-";
    }
    return (
      <FeedCard id={data.id} index={index}>
        <p
          className="text-center"
          style={{ backgroundColor: feedBackgroundColor, color }}
        >
          {`${data.plate}${provinceName && ` ${provinceName}`}`}
        </p>

        <p className='bg-[#383A39] text-center'>
          {dayjs(data.epoch_end).format(i18n.language === 'th' ? 'DD-MM-BBBB HH:mm:ss' : 'DD-MM-YYYY HH:mm:ss')} | <span className='font-bold'>{`${data.plate_confidence}%`}</span>
        </p>

        {/* Checkpoint */}
        <div className='pl-[30px] col-span-2'>{`${t('text.checkpoint')}: ${cameraList.find(cp => cp.uid === data.camera_uid)?.camera_name || "-"}`}</div>

        {/* Images */}
        <FeedImages 
          image1={data.vehicle_image_url}
          image1Alt={"Vehicle Image"}
          image2={data.plate_image_url}
          image2Alt={"Plate Image"}
        />

        {/* Vehicle Info */}
        <div className="w-full h-full bg-[#161817]">
          <div className="h-full flex flex-col p-1 pl-3 space-y-2">
            {
              [
                { label: t('feed-data.type'), value: data.vehicle_body_type },
                { label: t('feed-data.brand'), value: data.vehicle_make },
                { label: t('feed-data.color'), value: newVehicleColor },
                { label: t('feed-data.model'), value: data.vehicle_model },
              ].map(({ label, value }, idx) => (
                <div className="flex" key={idx}>
                  <span className="w-[55px] text-left">{label}</span>
                  <span className="mx-1">:</span>
                  <span className="w-[135px] truncate" title={reformatString(value)}>
                    {reformatString(value)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </FeedCard>
    )
  }

  // const createFeedFaceInfo = (data: RealTimeLprData, index: number) => {
  //   const suspectPersonData = checkSpecialPerson(data.title_id, data.first_name, data.last_name);
  //   const prefix = sliceDropdown.prefix?.data.find(prefix => prefix.id === data.title_id);
  //   const newPrefix = i18n.language === "th"
  //     ? prefix?.title_th || ""
  //     : prefix?.title_en || "";
  //   const { color, backgroundColor  } = getPersonTypeColor(suspectPersonData ? suspectPersonData.person_class_id : 0);
  //   return (
  //     <FeedCard id={data.id} index={index}>
  //       <div className='grid grid-cols-[55%_45%]'>
  //         <p
  //         className="text-center"
  //         style={{ ...(backgroundColor && { backgroundColor }), color }}
  //       >
  //         {`${t('text.name')} : ${!newPrefix && !data.first_name && !data.last_name ? "-" : `${newPrefix}${data.first_name} ${data.last_name}`}`}
  //       </p>

  //         <p className='bg-[#383A39] text-center'>
  //           {dayjs(data.epoch_end).format(i18n.language === 'th' ? 'DD-MM-BBBB HH:mm:ss' : 'DD-MM-YYYY HH:mm:ss')} | <span className='font-bold'>{`${data.plate_confidence}%`}</span>
  //         </p>

  //         {/* Checkpoint */}
  //         <div className='pl-[30px] col-span-2'>{`${t('text.checkpoint')}: ${cameraList.find(cp => cp.uid === data.camera_uid)?.camera_name || "-"}`}</div>

  //         {/* Images */}
  //         <FeedImages data={data} />

  //         {/* Behavior Info */}
  //         <div className="w-full h-full bg-[#161817]">
  //           <div className="h-full flex flex-col p-1 pl-3 space-y-2">
  //             <div className="flex">
  //               <span className="w-[55px] text-left">{data.special_person_remark}</span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </FeedCard>
  //   )
  // }

  return (
    <div id="real-time-monitor" className={`main-content ${isOpen ? "pl-[130px]" : "pl-2.5"} pr-2.5 transition-all duration-500`}>
      <div className='flex flex-col w-full h-full overflow-y-auto'>
        {/* Header */}
        <Typography variant="h5" color="white" className="font-bold">{t('screen.real-time.title')}</Typography>
        
        {/* Search Filter Part */}
        <div className='flex lg:flex-row flex-col justify-between h-[100px] gap-2'>
          <form onSubmit={handleSubmit(handleSearch)}>
            <div className='flex mt-3 w-full'>
              <div className='flex w-[60vw] space-x-3'>
                <div className='flex flex-col w-full space-y-2'>
                  <p className='text-[15px]'>{t('component.checkpoint-2')}</p>
                  <div className='w-full items-center justify-center'>
                    <MultiSelectCameras 
                      limitTags={3} 
                      selectedValues={selectedCameraObjects}
                      options={camerasOption} 
                      onChange={handleCameraChange}
                      placeHolder={t('placeholder.checkpoint-2')}
                    />
                  </div>
                </div>
                <div className='flex items-end'>
                  <button 
                    type="button"
                    className="flex items-center justify-center bg-[#797979] w-[60px] h-10 rounded-[5px] cursor-pointer"
                    onClick={() => setSearchCheckpointsVisible(true)}>
                    <img src={PinGoogleMap} alt="Pin Google map" className='w-[25px] h-[25px]' />
                  </button>
                </div>

                <div className='flex items-end gap-2 ml-2'>
                  <Button
                    type='submit'
                    variant="contained"
                    className="primary-btn"
                    startIcon={<SearchIcon />}
                    sx={{
                      width: t('button.search-width'),
                      height: "40px",
                      textTransform: 'capitalize',
                      '& .MuiSvgIcon-root': { 
                        fontSize: 26 
                      } 
                    }}
                    >
                    {t('button.search')}
                  </Button>
                  <Button 
                    variant="outlined" 
                    className="secondary-btn" 
                    onClick={handleClearSearch}
                    sx={{
                      width: t('button.clear-width'),
                      height: "40px",
                      textTransform: 'capitalize',
                    }}
                  >
                    {t('button.clear')}
                  </Button>
                </div>
              </div>
            </div>
          </form>
          <div className='flex items-end justify-end'>
            {
              DETAIL_INFORMATION?.FILTER_FACE_AND_LICENSE_PLATE && (
                <FormGroup row>
                  <FormControlLabel 
                    control={
                    <Checkbox 
                      checked={isShowLicensePlate} 
                      onChange={(e) => setIsShowLicensePlate(e.target.checked)}
                      sx={{
                        fontSize: 16,
                        color: "#FFFFFF",
                        "&.Mui-checked": {
                          color: "#FFFFFF",
                        },
                        "& .MuiSvgIcon-root": {
                          fontSize: 30
                        }
                      }}
                    />
                    } 
                    label={t('checkbox.license-plate')} 
                  />
                  <FormControlLabel 
                    control={
                    <Checkbox 
                      checked={isShowFace} 
                      onChange={(e) => setIsShowFace(e.target.checked)}
                      sx={{
                        fontSize: 16,
                        color: "#FFFFFF",
                        "&.Mui-checked": {
                          color: "#FFFFFF",
                        },
                        "& .MuiSvgIcon-root": {
                          fontSize: 30
                        }
                      }}
                    />
                    } 
                    label={t('checkbox.face')} 
                  />
                </FormGroup>
              )
            }
            {
              DETAIL_INFORMATION?.TOTAL_VEHICLE_COUNT && (
                <div 
                  className='flex flex-col gap-1 bg-[#384043] w-[230px] px-3 py-2'
                  style={{
                    borderRadius: "0 20px 0 20px"
                  }}
                >
                  <p className='text-[12px] text-[#CCD0CF]'>{`${t('text.start-from')} : ${
                    i18n.language === "th" ? todayMidnight.format("DD-MM-BBBB HH:mm:ss") : todayMidnight.format("DD-MM-YYYY HH:mm:ss")}`}</p>
                  <div className='flex h-[50px] justify-end items-end gap-1 text-white'>
                    <p className='text-[38px]'>{formatNumber(vehicleCount?.data?.count || 0)}<span className='text-[12px] ml-1'>{t('text.list')}</span></p>
                  </div>
                  <Divider sx={{ borderColor: "#FFFFFF", width: "100%" }} />
                  <p className='text-[15px] text-[#CCD0CF] text-center'>{t('text.current-number-detections')}</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Content Part */}
        <div className='grid grid-cols-[70%_30%] lg:mt-3 mt-30 border border-[#2B9BED]'>
          {/* Map Part */}
          <div id="realtime-map-container" className='relative h-[75.5vh] w-full'>
            <BaseMap 
              onMapLoad={handleMapLoad}
            />

            {/* Toastify */}
            <div
              onMouseEnter={() => setShowScrollbar(true)}
              onMouseLeave={() => setShowScrollbar(false)}
            >
              <ToastContainer
                containerId="realtime-toast"
                position="bottom-left"
                hideProgressBar
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  left: '5px',
                  zIndex: 50,
                  maxHeight: '75vh',
                  overflowX: 'hidden',
                  overflowY: showScrollbar ? 'auto' : 'hidden',
                  scrollbarWidth: showScrollbar ? 'thin' : 'none',
                  msOverflowStyle: showScrollbar ? 'auto' : 'none',
                }}
                className={`${showScrollbar ? 'customScrollbar' : 'hide-scrollbar'}`}
                toastClassName={() =>
                  'bg-black mb-2'
                }
              />
            </div>
          </div>
          {/* Real Time Result */}
          <div className='h-[75.5vh] overflow-y-auto'>
            <AnimatePresence initial={false}>
              {
                realtimeData.map((data, index) => {
                  // Filter by the *previously* selected cameras (prevCameraIds which holds the *searched* cameras)
                  if (prevCameraIds.every((camera) => camera.uid !== data.camera_uid)) return null;
                  
                  return createFeedVehicleInfo(data, index);
                })
              }
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <SearchCameras 
        open={searchCheckpointsVisible}
        selectedCameras={handleCamerasSelected}
        onClose={() => setSearchCheckpointsVisible(false)}
      />
    </div>
  )
}

export default RealTimeMonitor;
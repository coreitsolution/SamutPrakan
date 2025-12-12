import './App.css';
import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Nav from "./layout/nav";
import "./styles/Main.scss";
import { useRef, useEffect } from "react";
import { useAppDispatch } from './app/hooks';
import { useSelector } from "react-redux";
import { RootState } from "./app/store";
// import { RootState } from "./app/store";
// import { useSelector } from "react-redux";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';

// Screen
import Login from './modules/login/Login';
import RealTimeMonitor from './modules/real-time-monitor/RealTimeMonitor';
import SearchPlateWithCondition from './modules/search-plate-with-condition/SearchPlateWithCondition';
// import SearchPlateBeforeAfter from './modules/search-plate-before-after/SearchPlateBeforeAfter';
import Chart from './modules/chart/Chart';
import ManageUser from './modules/manage-user/ManageUser';
import AddEditUser from './modules/add-edit-user/AddEditUser';
import SpecialPlateScreen from './modules/special-plate/SpecialPlate';
import UserInfo from './modules/user-info/UserInfo';
import Setting from './modules/setting/Setting';
// import ManageLog from './modules/manage-log/ManageLog';
// import UsageStatisticsGraph from './modules/usage-statistics-graph/UsageStatisticsGraph';
// import EndUser from './modules/end-user/EndUser';
// import CameraInstallationPoints from './modules/camera-installation-points/CameraInstallationPoints';
// import CameraStatus from './modules/camera-status/CameraStatus';
import ManageCheckpointCameras from './modules/manage-checkpoint-cameras/ManageCheckpointCameras';

// API
import { clearError } from './features/auth/authSlice';
import { 
  fetchAreasThunk,
  fetchProvincesThunk,
  fetchStationsThunk,
  fetchVehicleColorsThunk,
  fetchVehicleMakesThunk,
  fetchDepartmentsThunk,
  fetchOfficerPositionsThunk,
  fetchPrefixThunk,
  fetchStatusThunk,
  fetchPersonTypesThunk,
  fetchPlateTypesThunk,
  fetchRegionsThunk,
  fetchUserGroupsThunk,
  fetchGeoRegionsThunk,
  fetchStreamEncodesThunk,
  fetchVehicleBodyTypesThunk,
  fetchVehicleModelThunk,
  fetchCheckpointsThunk,
} from './features/dropdown/dropdownSlice';
import {
  fetchSpecialPlatesThunk,
} from "./features/special-plate/specialPlateSlice";
import {
  fetchSuspectPeopleThunk,
} from "./features/suspect-people/suspectPeopleSlice";
import {
  upsertRealtimeData,
  addToastMessage,
} from './features/realtime-data/realtimeDataSlice';
import { addListNotification, NotificationType, removeNotification } from "./features/notification/notificationSlice";
import { triggerCameraRefresh, triggerRequestDeleteCamera } from "./features/refresh/refreshSlice";
import {
  fetchVehicleCountThunk
} from "./features/vehicle-count/VehicleCountSlice";

// Components
import AuthListener from './components/auth-listener/AuthListener';
import UpdateAlertPopup from './components/update-alert-popup/UpdateAlertPopup';
import RequestDeleteCameraAlert from './components/request-delete-camera-alert/RequestDeleteCameraAlert';
import ProtectedRoute from './components/protected-route/ProtectedRoute';
import CameraStatusPopup from './components/camera-status-popup/CameraStatusPopup';

// Config
import { getUrls } from './config/runtimeConfig';

// utils
import { getPlateTypeColor } from './utils/commonFunction'
import { toastChannel } from "./utils/channel";
import { useSse } from "./utils/useSse";
import { createNotificationToast } from "./utils/notification";
import { fetchClient, combineURL } from "./utils/fetchClient";

// Types
import { SpecialPlate, EventNotifyResponse, EventNotify, Checkpoint } from "./features/types";

// i18n
import { useTranslation } from "react-i18next";

const PrivateRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { CENTER_SERVER_SENT_EVENTS_URL, CENTER_SERVER_SENT_EVENTS_TOKEN, CENTER_API } = getUrls();

  // i18n
  const { i18n } = useTranslation();

  const { authData } = useSelector((state: RootState) => state.auth);
  const { checkpointSelected } = useSelector((state: RootState) => state.vehicleCountData);

  const sliceSpecialPlate = useSelector((state: RootState) => state.specialPlateData);
  const sliceDropdown = useSelector((state: RootState) => state.dropdownData);
  
  toastChannel.onmessage = ({data}) => {
    const { id, toastId, messageId, action, data: updatedData } = data;
    if (action === "closeUpdateAlert" && toastId) {
      toast.update(toastId, {
        render: (props) => <UpdateAlertPopup {...props} data={updatedData} />,
        autoClose: 3000,
        progressClassName: "success-progress-bar",
        containerId: "notification-list-toast",
        toastId: id,
        hideProgressBar: false,
        theme: updatedData.theme,
        style: updatedData.style,
      });
    } else if (action === "closeRequestDeleteCameraAlert" && id) {
      toast.update(toastId, {
        render: (props) => <RequestDeleteCameraAlert {...props} data={updatedData} />,
        autoClose: 3000,
        progressClassName: "success-progress-bar",
        containerId: "notification-list-toast",
        toastId: id,
        hideProgressBar: false,
        theme: updatedData.theme,
        style: updatedData.style,
      });
    }
    else if (action === "closeCameraStatusAlert" && id) {
      toast.update(toastId, {
        render: (props) => <CameraStatusPopup {...props} data={updatedData} />,
        autoClose: 3000,
        progressClassName: "success-progress-bar",
        containerId: "notification-list-toast",
        toastId: id,
        hideProgressBar: false,
        theme: updatedData.theme,
        style: updatedData.style,
      });
    }
    if (action === "clear-all") {
      dispatch(addListNotification([]));
      return;
    }
    dispatch(removeNotification(messageId));
  };

  useEffect(() => {
    dispatch(clearError())
    if (authData && !authData.token) {
      navigate('/login', { replace: true })
    }
    else {
      dispatch(fetchAreasThunk());
      dispatch(fetchProvincesThunk(
        {
          orderBy: i18n.language === "th" ? "name_th" : "name_en",
          limit: "100"
        }
      ));
      dispatch(fetchStationsThunk());
      dispatch(fetchVehicleColorsThunk(
        {
          orderBy: "id.asc",
          limit: "500"
        }
      ));
      dispatch(fetchVehicleMakesThunk(
        {
          orderBy: "id.asc",
          limit: "500"
        }
      ));
      dispatch(fetchVehicleBodyTypesThunk(
        {
          orderBy: "id.asc",
          limit: "500"
        }
      ));
      dispatch(fetchVehicleModelThunk(
        {
          orderBy: "id.asc",
          limit: "500"
        }
      ));
      dispatch(fetchDepartmentsThunk());
      dispatch(fetchOfficerPositionsThunk());
      dispatch(fetchPrefixThunk(
        {
          orderBy: i18n.language === "th" ? "title_th" : "title_en",
          limit: "100"
        }
      ));
      dispatch(fetchStatusThunk());
      dispatch(fetchPersonTypesThunk());
      dispatch(fetchPlateTypesThunk());
      dispatch(fetchRegionsThunk(
        {
          orderBy: i18n.language === "th" ? "name_th" : "name_en",
          limit: "100"
        }
      ));
      dispatch(fetchGeoRegionsThunk(
        {
          orderBy: "id.asc",
          limit: "100"
        }
      ));
      dispatch(fetchUserGroupsThunk(
        {
          orderBy: "id.asc",
          limit: "100"
        }
      ));
      dispatch(fetchSpecialPlatesThunk(
        {
          filter: "deleted=false",
          limit: "1000"
        }
      ));
      dispatch(fetchStreamEncodesThunk());
      dispatch(fetchCheckpointsThunk({
        limit: "100"
      }));
      fetchNotification();
      dispatch(fetchSuspectPeopleThunk(
        {
          filter: "deleted=false",
          limit: "1000"
        }
      ));
      dispatch(fetchVehicleCountThunk());
    }
  }, [dispatch, navigate, authData]);

  useEffect(() => {
    const bc = new BroadcastChannel("specialPlateChannel");
    bc.onmessage = (event) => {
      if (event.data === "reload") {
        dispatch(fetchSpecialPlatesThunk({ filter: "deleted=false", limit: "1000" }));
      }
    };
    return () => bc.close();
  }, [dispatch]);

  const createCameraNotification = async (cameraData: any) => {
    const isOnline = cameraData.current_status.toString().toLowerCase() === "online" ? true : false;
    const type: NotificationType = isOnline
      ? "cameraOnline"
      : "cameraOffline"

    createNotificationToast({
      dispatch,
      component: CameraStatusPopup,
      theme: "dark",
      type,
      title: isOnline ? "alert.camera-online" : "alert.camera-offline",
      content: isOnline
        ? [cameraData.camera_name, cameraData.camera_ip]
        : [
            "alert.camera-offline-content-2",
            cameraData.camera_name,
            cameraData.camera_ip,
          ],
      isOnline,
      messageId: `${cameraData.event_id}_${cameraData.timestamp}`,
      style: { 
        minHeight: isOnline ? "220px" : "250px",
        maxHeight: isOnline ? "220px" : "250px",
      },
      closeAction: "closeCameraStatusAlert",
      id: cameraData.event_id
    });
  };

  const handleRealtimeMessage = async (message: any) => {   
    dispatch(upsertRealtimeData(message));
    dispatch(fetchVehicleCountThunk(checkpointSelected.length > 0 ?
      {
        checkpointUids: checkpointSelected.join(",")
      } : 
      undefined
    ));

    const specialPlateData = await checkSpecialPlate(message.plate_prefix, message.plate_number, message.region_code);
    
    if (!specialPlateData) return;
    
    const { backgroundColor, title, pinBackgroundColor, showAlert, textShadow } = await getPlateTypeColor(specialPlateData.plate_class_id);
    
    if (!showAlert) return; 

    const updatedData = {
      ...message,
      plate_class_name: getPlateClassName(specialPlateData.plate_class_id),
      special_plate_remark: specialPlateData.behavior,
      special_plate_owner_name: specialPlateData.case_owner_name,
      special_plate_owner_agency: specialPlateData.case_owner_agency,
      title_name: title,
      color: backgroundColor,
      pin_background_color: pinBackgroundColor,
      text_shadow: textShadow,
    }
    dispatch(addToastMessage(updatedData));
  };

  const handleCheckpointDataMessage = (message: Checkpoint) => {
    createNotificationToast({
      dispatch,
      type: "newCheckpoint",
      component: UpdateAlertPopup,
      title: "alert.new-checkpoint-update",
      content: "alert.new-checkpoint-update-content",
      variables: { checkpointName: message.checkpoint_name || "-" },
      messageId: message.created_at,
      style: { minHeight: "108px", maxHeight: "108px" },
      updateAction: () => dispatch(triggerCameraRefresh()),
      id: message.id
    });
  };

  const handleCameraDataMessage = (message: any) => {
    createNotificationToast({
      dispatch,
      type: "newCamera",
      component: UpdateAlertPopup,
      title: "alert.new-camera-update",
      content: "alert.new-camera-update-content",
      variables: { cameraName: message.camera_name || "-" },
      messageId: message.timestampUtc,
      style: { minHeight: "108px", maxHeight: "108px" },
      updateAction: () => dispatch(triggerCameraRefresh()),
      id: message.id
    });
  };

  const listener = (message: any) => {
    const isUpdatePage = location.pathname.includes('/manage-checkpoint-cameras');

    createNotificationToast({
      dispatch,
      type: "requestDelete",
      component: RequestDeleteCameraAlert,
      theme: "light",
      content: "alert.request-delete-camera-content",
      variables: { number: message.data.all_request_count + 1 },
      messageId: message.timestampUtc,
      style: {
        paddingTop: "45px",
        minHeight: "161px",
        maxHeight: "161px",
      },
      updateAction: () => {
        if (isUpdatePage) dispatch(triggerRequestDeleteCamera());
        else navigate("/center/manage-checkpoint-cameras", { replace: true });
      },
      closeAction: "closeRequestDeleteCameraAlert",
      id: message.id
    });
  };

  const checkSpecialPlate = (platePrefix: string, plateNumber: string, region: string): SpecialPlate | undefined => {
    const specialPlate = sliceSpecialPlate.specialPlates?.data.find(sp => sp.plate_prefix === platePrefix && sp.plate_number === plateNumber && sp.region_code === region && sp.deleted === 0 && sp.active === 1);
    return specialPlate
  };

  const getPlateClassName = (classId: number) => {
    const plateType = sliceDropdown.plateTypes?.data.find(type => type.id === classId);
    return plateType?.title_en || "-";
  }

  const fetchNotification = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetchClient<EventNotifyResponse>(combineURL(CENTER_API, "/event-notify/get"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          page: "1",
          limit: "100",
          filter: `is_confirm=false,event_timestamp>=${dayjs(authData.userInfo?.created_at).toISOString()}`,
          orderBy: "id.desc"
        }
      })

      if (response.success) {
        const data = response.data.map((row: EventNotify) => {
          const isOnline = row.data.current_status.toString().toLowerCase() === "online" ? true : false;
          const type: NotificationType = isOnline
              ? "cameraOnline"
              : "cameraOffline"
          
          return {
            id: row.id,
            theme: "dark" as "dark",
            userId: "",
            type,
            title: isOnline ? "alert.camera-online" : "alert.camera-offline",
            content: isOnline
              ? [row.data.camera_name, row.data.camera_ip]
              : [
                  "alert.camera-offline-content-2",
                  row.data.camera_name,
                  row.data.camera_ip,
                ],
            isOnline,
            messageId: `${row.id}_${row.event_timestamp}`,
            closeAction: "closeCameraStatusAlert",
            style: { 
              minHeight: isOnline ? "220px" : "250px",
              maxHeight: isOnline ? "220px" : "250px",
            },
          }
        });

        dispatch(
          addListNotification(data)
        );
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(errorMessage)
    }
    finally {
      clearTimeout(timeoutId);
    }
  }

  const enabled = Boolean(authData.token);

  useSse(
    CENTER_SERVER_SENT_EVENTS_URL,
    CENTER_SERVER_SENT_EVENTS_TOKEN,
    "lpr_data_event",
    handleRealtimeMessage,
    enabled
  );

  useSse(
    CENTER_SERVER_SENT_EVENTS_URL,
    CENTER_SERVER_SENT_EVENTS_TOKEN,
    "camera_status_event",
    createCameraNotification,
    enabled,
    false
  );

  useSse(
    CENTER_SERVER_SENT_EVENTS_URL,
    CENTER_SERVER_SENT_EVENTS_TOKEN,
    "camera-data",
    handleCheckpointDataMessage,
    enabled,
  );

  useSse(
    CENTER_SERVER_SENT_EVENTS_URL,
    CENTER_SERVER_SENT_EVENTS_TOKEN,
    "checkpoint-data",
    handleCameraDataMessage,
    enabled,
  );

  useSse(
    CENTER_SERVER_SENT_EVENTS_URL,
    CENTER_SERVER_SENT_EVENTS_TOKEN,
    "delete-camera-request",
    listener,
    enabled,
  );

  return <>{children}</>;
}

function Layout() {
  return (
    <>
      <ToastContainer 
        containerId="notification-list-toast"
        position="top-right"
        newestOnTop={true}
        style={{ 
          top: '70px', 
          right: '10px',
          width: '400px',
          minHeight: '90vh',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        closeButton={true}
        pauseOnFocusLoss={false}
      />
      <Nav />
      <Outlet />
    </>
  )
}

function App() {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const { authData } = useSelector((state: RootState) => state.auth);
  
  return (
    <div ref={constraintsRef} className='min-h-screen min-w-screen'>
      <AuthListener />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
          <PrivateRouteWrapper>
            <Layout />
          </PrivateRouteWrapper>
          }
        >
          <Route path='center/real-time-monitor' element={
            <ProtectedRoute 
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.center.realtime.select
              : undefined
              }
            >
              <RealTimeMonitor />
            </ProtectedRoute>
          } />
          <Route path='center/search-plate-with-condition' element={
            <ProtectedRoute 
              permission={authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center.conditionSearch.select
                : undefined
              }
            >
              <SearchPlateWithCondition />
            </ProtectedRoute>
          }></Route>
          <Route path='center/manage-user' element={
            <ProtectedRoute 
              permission={authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center.manageUser.select
                : undefined
              }
            >
              <ManageUser />
            </ProtectedRoute>
          }></Route>
          <Route path="center/special-plate" element={
            <ProtectedRoute
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.checkpoint.specialPlateManage.select
              : undefined
              }
            >
              <SpecialPlateScreen />
            </ProtectedRoute>
          } />
          <Route path='center/manage-user/add-edit-user' element={
            <ProtectedRoute 
              permission={authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center.manageUser.select
                : undefined
              }
            >
              <AddEditUser />
            </ProtectedRoute>
          }></Route>
          <Route path='center/user-info' element={
            <UserInfo />
          }></Route>
          <Route path='center/setting' element={
            <ProtectedRoute 
              permission={authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center.setting.select
                : undefined
              }
            >
              <Setting />
            </ProtectedRoute>
          }></Route>
          <Route path='center/manage-checkpoint-cameras' element={
            <ProtectedRoute 
              permission={
                authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center?.manageCheckpointCameras?.select
                : undefined
              }>
              <ManageCheckpointCameras />
            </ProtectedRoute>
          }></Route>
          <Route path='center/chart' element={
            <ProtectedRoute 
              permission={
                authData?.userInfo?.permissions
                ? authData.userInfo.permissions.center?.chart?.select
                : undefined
              }>
              <Chart />
            </ProtectedRoute>
          }></Route>
          {/* <Route path='center/chart/log' element={<ManageLog />}></Route>
          <Route path='center/chart/graph' element={<UsageStatisticsGraph />}></Route>
          <Route path='center/chart/end-user' element={<EndUser />}></Route>
          <Route path='center/chart/camera-installation-points' element={<CameraInstallationPoints />}></Route>
          <Route path='center/chart/camera-status' element={<CameraStatus />}></Route> */}
        </Route>
      </Routes>
    </div>
  )
}

export default App

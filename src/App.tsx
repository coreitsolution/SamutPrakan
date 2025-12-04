import './App.css'
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Nav from "./layout/nav"
import "./styles/Main.scss"
import { useRef, useEffect } from "react"
import { useAppDispatch } from './app/hooks'
import { RootState } from "./app/store"
import { useSelector } from "react-redux"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { triggerCameraRefresh } from './features/refresh/refreshSlice';

// API
import { clearError } from './features/auth/authSlice'
import {
  fetchProvincesThunk,
  fetchDataStatusThunk,
  fetchRegistrationTypesThunk,
  fetchPoliceDivisionsThunk,
  fetchPersonTitlesThunk,
  fetchPositionThunk,
  fetchRegionsThunk,
  fetchStreamEncodesThunk,
  fetchVehicleBodyTypesThunk,
  fetchVehicleColorsThunk,
  fetchVehicleMakesThunk,
  fetchVehicleModelsThunk,
  fetchPersonTypesThunk,
  fetchStatusThunk,
} from "./features/dropdown/dropdownSlice"
import { 
  fetchCameraSettingsThunk,
} from "./features/camera-settings/cameraSettingsSlice"
import {
  upsertRealtimeData,
} from './features/realtime-data/realtimeDataSlice';

// Types
import { CameraSettings } from "./features/camera-settings/cameraSettingsTypes"

// Screen
import Login from './modules/login/Login'
import SpecialRegistration from './modules/special-plate/SpecialPlatePage'
import CCTV from './modules/cctv/CCTV'
import Setting from './modules/setting/Setting'
import SpecialRegistrationDetected from './modules/special-registration-detected/SpecialRegistrationDetected'
// import SuspectPeopleDetected from './modules/suspect-people-detected/SuspectPeopleDetected'
// import SpecialSuspectPerson from './modules/special-suspect-person/SpecialSuspectPerson'
// import Chart from './modules/chart/Chart'
import UserInfo from './modules/user-info/UserInfo'

// Components
import FullScreenButton from './components/full-screen-button/FullScreenButton'
import AuthListener from './components/auth-listener/AuthListener'
import CameraAlert from './components/camera-alert/CameraAlert'
import ProtectedRoute from './components/protected-route/ProtectedRoute';

// Config
import { getUrls } from './config/runtimeConfig';

// utils
import { fetchClient, combineURL } from "./utils/fetchClient";
import { useSse } from "./utils/useSse";
// i18n
import { useTranslation } from "react-i18next";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { VITE_SERVER_SENT_EVENTS_URL, VITE_SERVER_SENT_EVENTS_TOKEN, API_URL } = getUrls();
  const { authData } = useSelector((state: RootState) => state.auth)

  // i18n
  const { i18n } = useTranslation();
  
  useEffect(() => {
    dispatch(clearError())
    if (authData && !authData.token) {
      navigate('/login', { replace: true })
    }
    else {
      dispatch(fetchProvincesThunk({
        "orderBy": i18n.language === "th" ? "name_th" : "name_en",
        "limit": "100",
      }));
      dispatch(fetchDataStatusThunk());
      dispatch(fetchRegistrationTypesThunk({
        "filter": "visible:true"
      }));
      dispatch(fetchPoliceDivisionsThunk());
      dispatch(fetchPersonTitlesThunk({
        "orderBy": i18n.language === "th" ? "title_th" : "title_en",
      }));
      dispatch(fetchPositionThunk());
      dispatch(fetchRegionsThunk({
        "orderBy": i18n.language === "th" ? "name_th" : "name_en",
        "limit": "100",
      }));
      dispatch(fetchStreamEncodesThunk());
      dispatch(fetchVehicleBodyTypesThunk());
      dispatch(fetchVehicleColorsThunk());
      dispatch(fetchVehicleMakesThunk());
      dispatch(fetchVehicleModelsThunk());
      dispatch(fetchPersonTypesThunk({
        "filter": "visible:true"
      }));
      dispatch(fetchCameraSettingsThunk({
        "filter": "deleted:false"
      }))
      dispatch(fetchStatusThunk());
    }
  }, [dispatch, navigate, authData])

  const fetchDeletedCamera = async (cameraUid: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let cameraName = "";
    
    try {
      const response = await fetchClient<CameraSettings>(combineURL(API_URL, "/cameras/get"), {
        method: "GET",
        signal: controller.signal,
        queryParams: { 
          filter: `cam_uid=${cameraUid}`,
        },
      });

      if (response.success) {
        cameraName = response.data[0].camera_name;
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    }
    finally {
      clearTimeout(timeoutId);
    }

    return cameraName;
  }

  const listener = async (message: any) => {
    const isReactive = message.event === "reactivate-camera";
    const isUpdatePage = location.pathname.includes('/settings');
    const cameraName = await fetchDeletedCamera(message.data.camera_uid);

    toast(
      (props) => (
        <CameraAlert
          {...props}
          data={{
            cameraName: cameraName || "-",
            approved: message.data.approved ?? false,
            timestamp: message.timestampUtc,
            isReactive,
            onUpdate: () => {
              if (isUpdatePage) {
                dispatch(triggerCameraRefresh())
              }
              else {
                navigate('/checkpoint/settings', { replace: true })
              }
            },
            updateVisible: true,
          }}
        />
      ),
      {
        autoClose: false,
        theme: 'light',
      }
    );
  }

  const handleWebSocketMessage = (message: any) => {
    dispatch(upsertRealtimeData(message));
  }

  {
    authData.token && 
    useSse(
      VITE_SERVER_SENT_EVENTS_URL,
      VITE_SERVER_SENT_EVENTS_TOKEN,
      "lpr_data_event",
      handleWebSocketMessage,
    );
  }

  {
    authData.token && 
    useSse(
      VITE_SERVER_SENT_EVENTS_URL,
      VITE_SERVER_SENT_EVENTS_TOKEN,
      "delete-camera-approved",
      listener,
    );
  }

  {
    authData.token && 
    useSse(
      VITE_SERVER_SENT_EVENTS_URL,
      VITE_SERVER_SENT_EVENTS_TOKEN,
      "reactivate-camera",
      listener,
    );
  }

  return children
}

function Layout() {
  return (
    <>
      <ToastContainer newestOnTop={true}/>
      <Nav />
      <Outlet />
    </>
  )
}

function App() {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { authData } = useSelector((state: RootState) => state.auth);

  return (
    <div ref={constraintsRef} className='min-h-screen min-w-screen'>
      {location.pathname !== '/login' && (
        <FullScreenButton constraintsRef={constraintsRef} />
      )}
      <AuthListener />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
          }
        >
          <Route path="checkpoint/special-registration" element={
            <ProtectedRoute
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.checkpoint.specialPlateManage.select
              : undefined
              }
            >
              <SpecialRegistration />
            </ProtectedRoute>
          } />
          <Route path="checkpoint/cctv" element={
            <ProtectedRoute
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.checkpoint.realtime.select
              : undefined
              }
            >
              <CCTV />
            </ProtectedRoute>
          } />
          <Route path="checkpoint/settings" element={
            <ProtectedRoute
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.checkpoint.setting.select
              : undefined
              }
            >
              <Setting />
            </ProtectedRoute>
          } />
          <Route path="checkpoint/special-registration-detected" element={
            <ProtectedRoute
              permission={authData?.userInfo?.permissions
              ? authData.userInfo.permissions.checkpoint.specialPlateSearch.select
              : undefined
              }
            >
              <SpecialRegistrationDetected />
            </ProtectedRoute>
          } />
          <Route path="checkpoint/user-info" element={<UserInfo />} />
          {/* <Route path="checkpoint/suspect-people-detected" element={<SuspectPeopleDetected />} /> */}
          {/* <Route path="checkpoint/special-suspect-person" element={<SpecialSuspectPerson />} /> */}
          {/* <Route path="checkpoint/chart" element={<Chart />} /> */}
        </Route>
      </Routes>
    </div>
  )
}

export default App

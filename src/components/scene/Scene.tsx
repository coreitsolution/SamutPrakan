import React, { useState, useRef, useEffect } from "react";
import { Viewer, Entity } from "resium";
import {
  Color,
  Cartesian3,
  Viewer as CesiumViewer,
  Rectangle,
  Math as CesiumMath,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Components
import { VideoPlayer } from "../video-player/VideoPlayer";
import { Icon } from "../icons/Icon";
import RealtimeSetting from "./realtime-setting/RealtimeSetting";

// MUI
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";

// i18n
import { useTranslation } from "react-i18next";

// Icons
import { Settings, X } from "lucide-react";
import OneScreen from "../../assets/icons/1_screen.png";
import FourScreen from "../../assets/icons/4_screen.png";
import FourScreenWithMain from "../../assets/icons/4_screen_with_main.png";
import NineScreen from "../../assets/icons/9_screen.png";

// Types
import { Camera } from "../../features/types";

// Utils
import { PopupMessage } from "../../utils/popupMessage";

// Constants
const VIDEO = {
  WIDTH: 290,
  HEIGHT: 150,
  GAP: 30,
  RIGHT: 16,
  TOP: 2,
  BOTTOM: 16,
};

const TH_LA_BOUNDS = Rectangle.fromDegrees(97.0, 5.0, 110.0, 22.5);

const INITIAL_VIEW = {
  destination: Cartesian3.fromDegrees(103.5, 13.5, 3_500_000),
  orientation: {
    heading: 0,
    pitch: CesiumMath.toRadians(-90),
    roll: 0,
  },
};

interface SceneProps {
  open: boolean;
  onClose: () => void;
  cameraList: Camera[];
  setLoading: (loading: boolean) => void;
  selectedUid: string | null;
}

const Scene: React.FC<SceneProps> = ({ 
  open, 
  onClose, 
  cameraList, 
  setLoading,
  selectedUid,
}) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [cesiumReady, setCesiumReady] = useState(false);
  const [openRealtimeSetting, setOpenRealtimeSetting] = useState(false);

  // Data
  const [tabValue, setTabValue] = useState(0);
  const [cameraStyle, setCameraStyle] = useState("one-screen");
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [cameraShowList, setCameraShowList] = useState<Camera[]>([]);
  const [playingCameraList, setPlayingCameraList] = useState<Camera[]>([]);

  // Refs
  const viewerRef = useRef<CesiumViewer | null>(null);
  const isProgrammaticMove = useRef(false);

  // Layout
  const layoutConfig: Record<
    string,
    { grid: string; max: number; main?: boolean }
  > = {
    "one-screen": {
      grid: "grid-cols-1",
      max: 1,
    },
    "four-screen-with-main": {
      grid: "grid-cols-[75%_1fr] grid-rows-4",
      max: 5,
      main: true,
    },
    "four-screen": {
      grid: "grid-cols-2",
      max: 4,
    },
    "nine-screen": {
      grid: "grid-cols-3",
      max: 9,
    },
  };

  const videoSlots = [
    { top: VIDEO.TOP, right: VIDEO.RIGHT },
    { top: VIDEO.TOP + (VIDEO.HEIGHT + VIDEO.GAP), right: VIDEO.RIGHT },
    { top: VIDEO.TOP + 2 * (VIDEO.HEIGHT + VIDEO.GAP), right: VIDEO.RIGHT },
    { bottom: VIDEO.BOTTOM, right: VIDEO.RIGHT },
    { bottom: VIDEO.BOTTOM, right: VIDEO.RIGHT + VIDEO.WIDTH + VIDEO.GAP },
  ];
  const currentLayout = layoutConfig[cameraStyle];
  
  const visibleCameras = React.useMemo(() => {
    return playingCameraList.slice(0, layoutConfig[cameraStyle].max);
  }, [playingCameraList, cameraStyle]);

  useEffect(() => {
    if (selectedUid) {
      setTabValue(1);
      setCameraStyle("one-screen");
      setPlayingCameraList(cameraList.filter((c) => c.uid === selectedUid).map((prev) => ({
        ...prev,
        is_selected: true
      })));
    }
    else {
      setTabValue(0);
    }
  }, [selectedUid])

  useEffect(() => {
    if (tabValue === 0 && viewerRef.current && cesiumReady) {
      isProgrammaticMove.current = true;
      viewerRef.current.camera.flyTo({
        ...INITIAL_VIEW,
        duration: 1.5,
        complete: () => {
          isProgrammaticMove.current = false;
        },
      });
    }

    if (tabValue !== 0) {
      setCameraShowList([]);
      setSelectedCamera(null);
      setPlayingCameraList(visibleCameras.map((prev) => ({
        ...prev,
        is_selected: true
      })));
    }
  }, [tabValue, cesiumReady]);

  useEffect(() => {
    if (tabValue !== 1) return;
    if (selectedUid) return;

    setPlayingCameraList(cameraList.slice(0, layoutConfig[cameraStyle].max).map((prev) => ({
      ...prev,
      is_selected: true
    })));
  }, [cameraStyle, tabValue, selectedUid]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || tabValue !== 0) return;

    // Space
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = false; 
    }
    viewer.scene.backgroundColor = Color.BLACK;
    viewer.scene.skyBox = undefined;

    viewer.scene.globe.showWaterEffect = false;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.debugShowFramesPerSecond = false;

    // Globe
    const layers = viewer.imageryLayers;
    if (layers.length > 0) {
      const layer = layers.get(0);
      layer.brightness = 0.5;
      layer.contrast = 1.2;
    }

    isProgrammaticMove.current = true;

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(100.5231, 13.7367, 25_000_000),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0,
      },
      complete: () => {
        isProgrammaticMove.current = false;
      },
    });

    const clampCamera = () => {
      if (isProgrammaticMove.current) return;

      const carto = viewer.camera.positionCartographic;
      if (!carto) return;

      const { west, east, south, north } = TH_LA_BOUNDS;
      let lon = carto.longitude;
      let lat = carto.latitude;

      const isOut = lon < west || lon > east || lat < south || lat > north;

      if (isOut) {
        const clampedLon = Math.min(Math.max(lon, west), east);
        const clampedLat = Math.min(Math.max(lat, south), north);

        viewer.camera.setView({
          destination: Cartesian3.fromRadians(clampedLon, clampedLat, carto.height),
          orientation: {
            heading: viewer.camera.heading,
            pitch: viewer.camera.pitch,
            roll: viewer.camera.roll
          },
        });
      }
    };

    viewer.scene.postRender.addEventListener(clampCamera);

    setLoading(false);
    return () => {
      if (!viewer.isDestroyed() && viewer.scene?.postRender) {
        viewer.scene.postRender.removeEventListener(clampCamera);
      }
    };
  }, [cesiumReady, tabValue]);

  const flyToCamera = (camera: Camera) => {
    if (!viewerRef.current) return;
    viewerRef.current.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        Number(camera.longitude),
        Number(camera.latitude),
        1500
      ),
      duration: 1.8,
    });
  };

  const toggleCamera = (camera: Camera) => {
    setCameraShowList((prev) => {
      const exists = prev.some((c) => c.uid === camera.uid);
      if (exists) return prev.filter((c) => c.uid !== camera.uid);

      if (prev.length >= 5) {
        PopupMessage(t("info.can-not-select-camera-more-than-five"), "", "info");
        return prev;
      }
      return [...prev, camera];
    });
  };

  const screenButtons = (src: string, alt: string, style: string) => {
    return (
      <IconButton
        sx={{
          padding: "0 2px 0 2px",
          width: "40px",
          borderRadius: "2px",
          backgroundColor: cameraStyle === style ? "#2B9BED" : "#333",
          "&:hover": {
            backgroundColor: cameraStyle === style ? "#77BFF4" : "#555",
          },
          "&:disabled": {
            backgroundColor: "#555",
            cursor: "not-allowed",
          },
        }}
        title={alt}
        onClick={() => {
          setCameraStyle(style);
        }}
        disabled={selectedUid ? true : false}
      >
        <img src={src} alt={alt} />
      </IconButton>
    )
  }

  const getHeight = () => {
    if (cameraStyle === "one-screen") {
      return "h-[69vh]";
    } 
    else if (cameraStyle === "four-screen-with-main") {
      return "h-[16.45vh]";
    } 
    else if (cameraStyle === "four-screen") {
      return "h-[34vh]";
    }
    else {
      return "h-[22.3vh]";
    }
  }

  return (
    <Dialog 
      id='scene'
      open={open} 
      maxWidth={false} 
      fullWidth
      slotProps={{
        paper: {
          style: { 
            backgroundColor: 'black', 
            boxShadow: 'none',
            margin: 0,
            width: "80vw",
            height: "81vh",
            maxWidth: 1300,
            maxHeight: 800,
            zIndex: 1300,
          },
        },
        backdrop: {
          style: { backgroundColor: 'rgba(0, 0, 0, 0.6)' }
        },
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: "black", height: "80vh" }}>
        {/* Tab */}
        <div className="relative flex justify-center w-full">
          <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)}
            className="h-full bg-black rounded-t-[5px]"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "transparent !important",
              },
              "& .MuiTab-root": {
                color: "#ADADAD",
              },
              "& .Mui-selected": {
                color: "white !important",
                backgroundColor: "#2B9BED",
                borderTopRightRadius: "3px",
                borderTopLeftRadius: "3px",
              },
            }}
            style={{
              width: "300px"
            }}
          >
            <Tab label={t("tab.camera-list")} />
            <Tab label={t("tab.real-time-camera")} />
          </Tabs>

          <div className="absolute right-2 top-2">
            <IconButton
              sx={{
                padding: 0,
                width: "35px",
              }} 
              onClick={onClose}
            >
              <Icon icon={X} color="#fff" />
            </IconButton>
          </div>
        </div>

        {/* Map */}
        <div 
          className="relative w-full h-[calc(80vh-48px)] overflow-hidden"
          style={{ display: tabValue === 0 ? 'block' : 'none' }}
        >
          <Viewer
            creditContainer="cesium-credits"
            ref={(v) => {
              viewerRef.current = v?.cesiumElement ?? null;
              v?.cesiumElement?.scene.globe.tileLoadProgressEvent.addEventListener(
                (r) => (r === 0) && setCesiumReady(true)
              );
            }}
            animation={false}
            timeline={false}
            baseLayerPicker={false}
            geocoder={false}
            homeButton={false}
            fullscreenButton={false}
            requestRenderMode={false}
            maximumRenderTimeChange={Infinity}
            navigationHelpButton={false}
            selectionIndicator={false}
            infoBox={false}
            terrainProvider={undefined}
            targetFrameRate={30}
            style={{ width: "100%", height: "100%" }}
          >
            {cesiumReady &&
              cameraList.map((camera) => (
                <Entity
                  key={camera.uid}
                  position={Cartesian3.fromDegrees(
                    Number(camera.longitude),
                    Number(camera.latitude),
                    30
                  )}
                  point={{
                    pixelSize: 8,
                    color:
                      selectedCamera?.uid === camera.uid
                        ? Color.RED
                        : Color.fromCssColorString("#2B9BED"),
                    outlineWidth: 1,
                    outlineColor: Color.BLACK,
                  }}
                  label={
                  selectedCamera?.uid === camera.uid
                    ? {
                        text: 
  `${camera.camera_name}\n(${Number(camera.latitude).toFixed(5)}, ${Number(camera.longitude).toFixed(5)})`,
                        font: "14px sans-serif",
                        fillColor: Color.WHITE,
                        outlineColor: Color.BLACK,
                        outlineWidth: 3,
                        style: 2,
                        verticalOrigin: 1,
                        pixelOffset: new Cartesian3(0, -20, 0),
                        showBackground: true,
                        backgroundColor: Color.fromCssColorString("rgba(0,0,0,0.85)"),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        eyeOffset: new Cartesian3(0, 0, -10),
                      }
                    : undefined
                }
                />
              ))}
          </Viewer>

          {/* License */}
          <div
            id="cesium-credits"
            style={{
              position: "absolute",
              bottom: 0,
              left: 10,
              width: "90%",
            }}
          />

          {/* Camera list sidebar */}
          <div
            id="camera-list-globe"
            className="absolute top-5 left-4 z-[2000] bg-gray-800/90 w-[280px] h-[400px] rounded-[5px] overflow-y-auto backdrop-blur-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "auto",
              backdropFilter: "blur(6px)",
            }}
          >
            {cameraList.map((camera) => {
              const checked = cameraShowList.some(
                (c) => c.uid === camera.uid
              );

              return (
                <div
                  key={camera.uid}
                  onClick={() => {
                    setSelectedCamera((prev) => {
                      if (prev?.uid === camera.uid) return prev;
                      return camera;
                    });
                    flyToCamera(camera);
                  }}
                  className={`w-full flex items-center gap-2 p-1 cursor-pointer rounded-[5px]
                    ${
                      selectedCamera?.uid === camera.uid
                        ? "bg-[#2B9BED]"
                        : "hover:bg-[#77BFF4]"
                    }`}
                  title={`(${camera.latitude}, ${camera.longitude})`}
                >
                  <Checkbox
                    checked={checked}
                    onClick={(e) => e.stopPropagation()} 
                    onChange={() => toggleCamera(camera)}
                    size="small"
                    sx={{
                      color: "#fff",
                      "&.Mui-checked": {
                        color: "#fff",
                      },
                    }}
                  />

                  <span className="text-white text-sm">
                    {camera.camera_name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Video */}
          {cameraShowList.map((camera, i) => {
            const slot = videoSlots[i];
            if (!slot) return null;

            return (
              <div
                key={camera.uid}
                className="absolute z-[2500] bg-black border border-gray-700 rounded"
                style={{
                  width: VIDEO.WIDTH,
                  height: VIDEO.HEIGHT,
                  pointerEvents: "auto",
                  contain: "layout paint",
                  transform: "translateZ(0)",
                  ...slot,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full">
                  <VideoPlayer
                    streamUrl={camera.mjpeg_stream_url || ""}
                    id={camera.uid}
                    customClass="w-full h-full"
                  />

                  <div className="absolute top-0 px-2 py-1 bg-black/40 w-full">
                    <label className="text-white text-xs">
                      {`${t("text.checkpoint")}: ${camera.camera_name}`}
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {
          tabValue === 1 && (
            <>
              <div 
                className="flex flex-col p-2"
                style={{ display: tabValue === 1 ? 'block' : 'none' }}
              >
                <div className={`grid ${currentLayout.grid} gap-2`}>
                  {visibleCameras.map((camera, index) => {
                    const isMain =
                      cameraStyle === "four-screen-with-main" && index === 0;
                    return (
                      <div
                        key={camera.uid ?? index}
                        className={`relative bg-black border border-gray-600 ${
                          isMain ? "row-span-4" : ""
                        }`}
                      >
                        <VideoPlayer
                          streamUrl={camera.mjpeg_stream_url || ""}
                          id={camera.uid}
                          customClass={isMain ? `h-[68.98vh] w-full` : `${getHeight()} w-full`}
                        />

                        <div className="absolute top-0 px-2 py-1 bg-black/30 w-full">
                          <label className="text-white text-sm">
                            {`${t("text.checkpoint")}: ${camera.camera_name}`}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {
                    Array.from({
                      length: currentLayout.max - visibleCameras.length,
                    }).map((_, index) => {
                      return (
                        <div
                          key={`empty-slot-${index}`}
                          className={`relative bg-black border border-dashed border-gray-600 flex items-center justify-center`}
                        >
                          <div
                            className={`flex items-center justify-center text-gray-500 text-sm ${getHeight()} w-full`}
                          >
                            {t("text.no-camera")}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className={`flex w-full pt-2 justify-between`}>
                  <div className="flex gap-2">
                    {
                      [
                        { src: OneScreen, alt: "1 Screen", style: "one-screen" },
                        { src: FourScreenWithMain, alt: "4 Screen with main", style: "four-screen-with-main" },
                        { src: FourScreen, alt: "4 Screen", style: "four-screen" },
                        { src: NineScreen, alt: "9 Screen", style: "nine-screen" },
                      ].map((button, index) => (
                        <React.Fragment key={index}>
                          {screenButtons(button.src, button.alt, button.style)}
                        </React.Fragment>
                      ))
                    }
                  </div>

                  <IconButton
                    className="realtime-setting"
                    sx={{
                      padding: "2px 0 2px 0",
                      width: "35px",
                    }}
                    onClick={() => setOpenRealtimeSetting(true)}
                  >
                    <Icon icon={Settings} size={25} color="#FFFFFF" />
                  </IconButton>
                </div>
              </div>

              {
                openRealtimeSetting && (
                  <RealtimeSetting
                    open={openRealtimeSetting}
                    onClose={() => setOpenRealtimeSetting(false)}
                    cameraList={cameraList.filter((c) => !playingCameraList.some((p) => p.uid === c.uid))}
                    playingCameraList={playingCameraList}
                    setNewPlayCameraList={(cameras) => {
                      setPlayingCameraList(cameras);
                    }}
                    cameraLimit={layoutConfig[cameraStyle].max}
                  />
                )
              }
            </>
          )
        }
      </DialogContent>
    </Dialog>
  );
};

export default Scene;

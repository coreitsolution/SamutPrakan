import { useEffect, useState, useCallback, useRef } from "react"
import DOTInform from "../dot-inform/DotInform";
import { fetchClient, combineURL } from "../../../../utils/fetchClient";
import { useSelector } from "react-redux"
import { RootState } from "../../../../app/store"
import dayjs from "dayjs";
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Map as LeafletMap } from 'leaflet';

// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';

// Types
import { RealTimeLprData, AlprDataResponse, AlprData } from "../../../../features/live-view-real-time/liveViewRealTimeTypes";

// Utils
import { reformatString } from "../../../../utils/commonFunction"

// Config
import { getUrls } from '../../../../config/runtimeConfig';

// Component
import Loading from "../../../../components/loading/Loading"
import BaseMap, { BaseMapRef } from '../../../../components/base-map/BaseMap';

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import { useMapSearch } from "../../../../hooks/useOpenStreetMapSearch";

dayjs.extend(buddhistEra)

interface LocationDialog {
  open: boolean;
  close: () => void;
  detailData: RealTimeLprData | null;
}

export default function LocationDetailDialog({
  open,
  detailData,
  close,
}: LocationDialog) {
  const { IMAGE_URL, API_URL } = getUrls();
  // Ref
  const mapRef = useRef<BaseMapRef>(null);

  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [vehicleData, setVehicleData] = useState<AlprData[]>([]);
  const [map, setMap] = useState<LeafletMap | null>(null);

  const { cameraSettings } = useSelector(
    (state: RootState) => state.cameraSettings
  )

  const {
    drawRoute,
  } = useMapSearch(map)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    if (open && detailData) {
      fetchVehicleRoute();
    }
  }, [open])

  useEffect(() => {
    if (vehicleData.length > 0) {
      const latLonList: { id: string; routeList: { lat: string; lon: string }[] }[] = [];
      latLonList.push({
          id: detailData?.epoch_end || "-",
          routeList: vehicleData.map((item) => {
            return {
              lat: item.gps_latitude.toString(),
              lon: item.gps_longitude.toString(),
            }
          }),
        })
      drawRoute(latLonList);
    }
  }, [vehicleData])

  const fetchVehicleRoute = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setIsLoading(true);
      const response = await fetchClient<AlprDataResponse>(combineURL(API_URL, "/lpr-data/get"), {
        method: "GET",
        signal: controller.signal,
        queryParams: { 
          filter: `plate=${detailData?.plate},region_code=${detailData?.region_code}`,
        },
      });

      if (response.success && response.data) {
        setVehicleData(response.data);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    }
    finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const handleMapLoad = useCallback((mapInstance: LeafletMap | null) => {
    setMap(mapInstance)
  }, []);

  return (
    <Dialog open={open} onClose={() => {}} className="absolute z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black bg-opacity-25 backdrop-blur-sm ">
        {isLoading && <Loading />}
        <div 
          className="bg-black 
          w-[90vw] h-[95vh] overflow-y-auto flex flex-col"
        >
          <DialogTitle className={`text-[25px] p-[20px]`}>
            <span className='text-white ml-[15px]'>{t('screen.map-route')}</span>
          </DialogTitle>
          
          <div className="flex flex-col">
            <div className="h-[80vh] mx-8">
              <div className="h-full">
                { 
                  detailData &&  
                    (
                      <div className={`grid grid-cols-[40%_1fr] w-full h-full`}>
                        <div className="border-[1px] border-charade">
                          <div
                            className={`flex flex-col w-full h-full relative `}
                          >
                            <BaseMap 
                              ref={mapRef}
                              onMapLoad={handleMapLoad}
                              zoomControl={false}
                              height="79.5vh"
                            />
                          </div>
                        </div>
                        <div className="border-l-[3px] border-y-[1px] border-r-[1px] border-charade">
                          <div className="flex flex-col mt-[-1px] h-[79.5vh] overflow-y-auto">
                            <div className="flex title-header">
                              <p
                                style={{
                                  color: "white",
                                  fontSize: "16px",
                                  padding: "10px",
                                }}
                              >
                                {t('text.detail')}
                              </p>
                            </div>

                            <div className="flex flex-col">
                              <div
                                className="flex p-2 bg-tuna"
                              >
                                <img
                                  width={20}
                                  height={20}
                                  src="/icons/car-front.png"
                                  alt="car"
                                />
                                <p
                                  className="ml-2"
                                  style={{ color: "white", fontWeight: "bolder", fontSize: "14px" }}
                                >
                                  {t('text.vehicle-data')}
                                </p>
                              </div>
                              <div className="flex flex-col w-full">
                                <div className="flex w-full">
                                  <div className="w-full">
                                    <DOTInform
                                      vehicle={{
                                        vehicleImage: `${IMAGE_URL}${detailData.vehicle_image_url}`,
                                        pathImage: `${IMAGE_URL}${detailData.plate_image_url}`,
                                        plateId: `${detailData.plate_prefix} ${detailData.plate_number} ${i18n.language === 'th' ? detailData.region_name_th : detailData.region_name_en }`,
                                        brand: reformatString(detailData.vehicle_make),
                                        color: i18n.language === 'th' ? reformatString(detailData.vehicle_color_th) : reformatString(detailData.vehicle_color_en),
                                        model: reformatString(detailData.vehicle_model),
                                        type: i18n.language === 'th' ? reformatString(detailData.vehicle_body_type_th) : reformatString(detailData.vehicle_body_type_en),
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col h-[394px] overflow-y-auto">
                                  <div className="flex p-2 bg-tuna">
                                    <img
                                      width={20}
                                      height={20}
                                      src="/icons/detail.png"
                                      alt="car"
                                    />
                                    <p
                                      className="ms-2"
                                      style={{
                                        fontWeight: "bolder",
                                        color: "white",
                                        fontSize: "14px",
                                      }}
                                    >
                                      {t('text.checkpoint-order-pass')}
                                    </p>
                                  </div>

                                  <div className="flex text-center text-white bg-swamp p-2 text-[14px]">
                                    <div className="w-2/3 font-semibold bg-table-title">
                                      {t('table.column.station-checkpoint')}
                                    </div>
                                    <div className="w-1/3 bg-table-title">
                                      {t('table.column.time')}
                                    </div>
                                  </div>
                                  <div className="text-[14px]">
                                    {
                                      vehicleData.map((item, index) => 
                                        (
                                          <div className="flex" key={index}>
                                            <div className="w-2/3 font-semibold bg-title p-1">
                                              {`${item.checkpoint_name}/${cameraSettings?.data.find((c) => c.uid === item.camera_uid)?.camera_name || "-"}`}
                                            </div>
                                            <div className="w-1/3 bg-content p-1">
                                              {item.epoch_end ? dayjs(item.epoch_end).format(i18n.language === "th" ? 'DD/MM/BBBB (HH:mm:ss)' : 'DD/MM/YYYY (HH:mm:ss)') : "-"}
                                            </div>
                                          </div>
                                        )
                                      )
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                  )
                }
              </div>
            </div>
            {/* Footer */}
            <div className='flex justify-end mx-8 mt-3'>
              <button 
                type="button" 
                className="bg-white text-black w-[90px] h-[40px] rounded" 
                onClick={close}
              >
                {t('button.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

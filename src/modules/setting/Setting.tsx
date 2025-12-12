import React, { useEffect, useState } from 'react'
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

// Material UI
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { SelectChangeEvent } from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';

// Constant
import { SETTING_ROW_PER_PAGES } from "../../constants/dropdown";

// Icon
import SearchIcon from '@mui/icons-material/Search';
// import CSVIcon from "../../assets/icons/csv.png";
import { Icon } from '../../components/icons/Icon'
import { Pencil } from 'lucide-react';

// i18n
import { useTranslation } from 'react-i18next';

// Context
import { useHamburger } from "../../context/HamburgerContext";

// Components
import Loading from "../../components/loading/Loading";
import MultiSelect from '../../components/multi-select/MultiSelect';
import PaginationComponent from '../../components/pagination/Pagination';

// Utils
import { fetchClient, combineURL } from "../../utils/fetchClient";
import { formatNumber } from '../../utils/commonFunction';
import { PopupMessage } from '../../utils/popupMessage';

// Types
import { 
  Camera, 
  CameraResponse, 
  CheckpointResponse,
  Checkpoint,
} from "../../features/types";
import { 
  DistrictsResponse, 
  SubDistrictsResponse,
} from "../../features/dropdown/dropdownTypes";

// Modules
import CameraSetting from "./camera-setting/CameraSetting";
import SensorSetting from './sensor-setting/SensorSetting';
import CheckpointSetting from './checkpoint-setting/CheckpointSetting';

// Config
import { getUrls } from '../../config/runtimeConfig';

interface SettingProps {

}

const Setting: React.FC<SettingProps> = ({}) => {
  const { isOpen } = useHamburger();
  const { CENTER_API } = getUrls();

  // i18n
  const { t } = useTranslation();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [openCameraSetting, setOpenCameraSetting] = useState(false);
  const [openSensorSetting, setOpenSensorSetting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [openCheckpointSetting, setOpenCheckpointSetting] = useState(false);
  const [isCheckpointEditMode, setIsCheckpointEditMode] = useState(false);

  // Data
  const [selectedCheckpointObjects, setSelectedCheckpointObjects] = useState<{value: any, label: string}[]>([]);
  const [selectedCheckpointIds, setSelectedCheckpointIds] = useState<string[]>([]);
  const [cameraList, setCameraList] = useState<Camera[]>([])
  const [selectedRow, setSelectedRow] = useState<Camera | null>(null)
  const [checkpointData, setCheckpointData] = useState<Checkpoint | null>(null)

  // Option
  const [checkpointOption, setCheckpointOption] = useState<{value: any, label: string}[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(SETTING_ROW_PER_PAGES[SETTING_ROW_PER_PAGES.length - 1]);
  const [rowsPerPageOptions] = useState(SETTING_ROW_PER_PAGES);

  const sliceDropdown = useSelector(
    (state: RootState) => state.dropdownData
  );

  const cameraRefreshKey = useSelector((state: RootState) => state.refresh.cameraRefreshKey);

  useEffect(() => {
    fetchCameras(page, rowsPerPage);

    return () => {
      setCameraList([]);
    }
  }, [cameraRefreshKey]);

  useEffect(() => {
    if (sliceDropdown.checkpoints && sliceDropdown.checkpoints.data) {
      const options = sliceDropdown.checkpoints.data.map((row) => ({
        label: row.checkpoint_name,
        value: row.uid,
      }));
      setCheckpointOption(options);
    }
  }, [sliceDropdown.checkpoints]);

  const fetchCameras = async (page: number, limit: number, filter?: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      setIsLoading(true);
      const response = await fetchClient<CameraResponse>(combineURL(CENTER_API, "/cameras/get"), {
        method: "GET",
        signal: controller.signal,
        queryParams: {
          page: page.toString(),
          limit: limit.toString(),
          ...(filter ? { filter } : { filter: "deleted=false" })
        }
      })

      if (response.success) {
        const updated = await Promise.all(
          response.data.map(async (camera: Camera) => {
            const { 
              checkpoint_name,
              organization,
              serial_number,
              license_key, 
            } = await fetchCheckpointInfo(camera.checkpoint_uid);
            return {
              ...camera,
              checkpoint_name,
              organization,
              serial_number,
              license_key,
            }
          })
        );
        setCameraList(updated);
        setTotalPages(prev => {
          if (prev > response.pagination.maxPage) {
            return response.pagination.maxPage;
          }
          else {
            return prev;
          }
        })
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-fetching-data'), errorMessage, "error");
    }
    finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const fetchCheckpointSetting = async (checkpoint_uid: string) => {
    try {
      const response = await fetchClient<CheckpointResponse>(combineURL(CENTER_API, "/checkpoints/get"), {
        method: "GET",
        queryParams: { 
          filter: `uid=${checkpoint_uid}`
        },
      });

      if (response.success && response.data.length > 0) {
        const provinceName = sliceDropdown.provinces && sliceDropdown.provinces.data && sliceDropdown.provinces.data.find(p => p.province_code === response.data[0].province_code)?.name_th || "";
        const districtName = await fetchDistrictName(response.data[0].district_code);
        const subdistrictName = await fetchSubdistrictName(response.data[0].subdistrict_code);

        setCheckpointData({
          ...response.data[0],
          province_name: provinceName,
          district_name: districtName,
          subdistrict_name: subdistrictName,
        });

      } 
      else {
        setCheckpointData(null);
      }
    }
    catch (error) {
      setCheckpointData(null);
    }
  }

  const fetchDistrictName = async (districtId: string) => {
    try {
      const response = await fetchClient<DistrictsResponse>(combineURL(CENTER_API, "/districts/get"), {
        method: "GET",
        queryParams: { 
          filter: `district_code:${districtId}`
        },
      });

      return response.data ? response.data[0].name_th : "";
    } 
    catch (error) {
      return "";
    }
  }

  const fetchSubdistrictName = async (subdistrictId: string) => {
    try {
      const response = await fetchClient<SubDistrictsResponse>(combineURL(CENTER_API, "/subdistricts/get"), {
        method: "GET",
        queryParams: { 
          filter: `subdistrict_code:${subdistrictId}`
        },
      });

      return response.data ? response.data[0].name_th : "";
    } 
    catch (error) {
      return "";
    }
  }

  const fetchCheckpointInfo = async (checkpoint_uid: string) => {
    let checkpoint_name = "";
    let organization = "";
    let serial_number = "" as string | null;
    let license_key = "" as string | null;
    try {
      const response = await fetchClient<CheckpointResponse>(combineURL(CENTER_API, "/checkpoints/get"), {
        method: "GET",
        queryParams: { 
          filter: `uid:${checkpoint_uid}`
        },
      });

      if (response.data) {
        checkpoint_name = response.data[0].checkpoint_name;
        organization = response.data[0].organization;
        serial_number = response.data[0].serial_number;
        license_key = response.data[0].license_key;
      }

      return {
        checkpoint_name,
        organization,
        serial_number,
        license_key,
      };
    } 
    catch (error) {
      return {
        checkpoint_name,
        organization,
        serial_number,
        license_key,
      };
    }
  }

  const onChangeCheckpoint = (ids: string[]) => {
    setSelectedCheckpointIds(ids);
    const selectedObjects = checkpointOption.filter(cp => ids.includes(cp.value.toString()));
    setSelectedCheckpointObjects(selectedObjects);
  };

  const handleEdit = (data: Camera) => {
    setIsEdit(true);
    setOpenCameraSetting(true);
    setSelectedRow(data);
  }

  const handleRowsPerPageChange = async (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value));
  };

  const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
    event.preventDefault();
    setPage(value);
  };

  const handlePageInputKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
  
      setPage(pageInput);
    }
  };

  const handlePageInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const cleaned = input.replace(/\D/g, '');

    if (cleaned) {
      const numberInput = Number(cleaned);
      if (numberInput > 0 && numberInput <= totalPages) {
        setPageInput(numberInput);
      }
    }
    else if (cleaned === "") {
      setPageInput(1);
    }
    return cleaned;
  }

  const handleCameraSettingClose = async () => {
    setOpenCameraSetting(false);
    const filter = selectedCheckpointIds.length > 0 ? `checkpoint_uid=${selectedCheckpointIds.join(",")},deleted=false` : "";
    setCameraList([]);
    await fetchCameras(page, rowsPerPage, filter);
  }

  const handleSensorSettingClose = async () => {
    setSelectedRow(null);
    setOpenSensorSetting(false);
    await fetchCameras(page, rowsPerPage);
  }

  const handleSensorSettingClick = (item: Camera) => {
    setSelectedRow(item);
    setOpenSensorSetting(true);
  }

  const handleSearchClick = async () => {
    if (selectedCheckpointIds.length === 1) {
      await fetchCheckpointSetting(selectedCheckpointIds[0].toString());
    }
    else {
      setCheckpointData(null);
    }
    setCameraList([]);
    const filter = selectedCheckpointIds.length > 0 ? `checkpoint_uid=${selectedCheckpointIds.join(",")},deleted=false` : "";
    await fetchCameras(page, rowsPerPage, filter);
  }

  const handleCheckpointSettingClick = () => {
    setOpenCheckpointSetting(true);
    setIsCheckpointEditMode(checkpointData !== null);
  }

  const handleCheckpointSettingClose = async () => {
    setSelectedRow(null);
    setOpenCheckpointSetting(false);
    if (selectedCheckpointIds.length === 1) {
      await fetchCheckpointSetting(selectedCheckpointIds[0].toString());
    }
  }

  return (
    <div id='setting' className={`main-content ${isOpen ? "pl-[130px]" : "pl-2.5"} transition-all duration-500`}>
      { isLoading && <Loading /> }
      <div className='flex flex-col w-full gap-3 pr-5'>
        {/* Header */}
        <Typography variant="h5" color="white" className="font-bold">{t('screen.setting.title')}</Typography>

        {/* Filter Part */}
        <div className='grid grid-cols-3'>
          <div className='flex items-end justify-center gap-3'>
            <div className='flex flex-col w-full space-y-2'>
              <p className='text-[15px]'>{t('component.checkpoint')}</p>
              <div className='w-full items-center justify-center'>
                <MultiSelect 
                  limitTags={2} 
                  selectedValues={selectedCheckpointObjects}
                  options={checkpointOption} 
                  onChange={onChangeCheckpoint}
                  placeHolder={t('placeholder.checkpoint-all')}
                />
              </div>
            </div>
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
              onClick={handleSearchClick}
            >
              {t('button.search')}
            </Button>
          </div>
        </div>

        {/* Checkpoint Data */}
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between'>
            <Typography variant="h6" color="white" className="font-bold">{t('text.station-data')}</Typography>
            <div className='flex gap-2'>
              <Button
                onClick={() => handleCheckpointSettingClick()}
                variant="contained"
                className="primary-btn gap-1"
                disabled={!checkpointData}
                title={t('placeholder.add-checkpoint-data')}
              >
                <Icon icon={Pencil} size={20} color="white" />
                <span className='ml-[5px] text-white text-[15px]'>{t('button.add-checkpoint-data')}</span>
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-4 gap-y-5 gap-x-2 py-[15px] px-[10px] border-[1px] border-[#2B9BED]'>
            {
              (() => {
                const address = checkpointData?.province_name ? `${t('text.sub-district')}${checkpointData?.subdistrict_name}/ ${t('text.district')}${checkpointData?.district_name}/ ${t('text.province')}${checkpointData?.province_name}` : "-";
                const latLon = checkpointData ? `${checkpointData.latitude}, ${checkpointData.longitude}` : "-";
                const checkpointInfo = checkpointData?.checkpoint_name || "-";
                const organization = checkpointData?.organization || "-";
                const route = checkpointData?.route || "-";

                return (
                  <>
                    <p title={checkpointInfo} className='text-white text-[15px] truncate'>{`${t('text.station-data')} : ${checkpointInfo}`}</p>
                    <p title={organization} className='text-white text-[15px] truncate'>{`${t('text.agency')} : ${organization}`}</p>
                    <p title={address} className='text-white text-[15px] truncate'>{`${t('text.address')} : ${address}`}</p>
                    <p title={route} className='text-white text-[15px] truncate'>{`${t('text.route')} : ${route}`}</p>
                    <p title={latLon} className='text-white text-[15px] truncate'>{`${t('text.latLon')}  : ${latLon}`}</p>
                  </>
                )
              })()
            }
          </div>
        </div>

        <div className='flex flex-col gap-3 mt-2'>
          <Typography variant="h6" color="white" className="font-bold">{t('text.camera-list')}</Typography>
          <label>{`${t('table.amount')} ${formatNumber(cameraList.length)} ${t('table.list')}`}</label>
        </div>

        {/* Result Table */}
        <div>
          <TableContainer
            component={Paper} 
            className='mt-2'
            sx={{ height: "45vh", backgroundColor: "transparent" }}
          >
            <Table sx={{ minWidth: 650, backgroundColor: "#48494B"}}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#242727", position: "sticky", top: 0, zIndex: 1 }}>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "2%" }}>{t('table.column.no')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "10%" }}>{t('table.column.station')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "5%" }}>{t('table.column.camera-status')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "10%" }}>{t('table.column.camera-id')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "10%" }}>{t('table.column.camera-location')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "5%" }}>{t('table.column.camera-detect')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "2%" }}>{t('table.column.camera-sensor-setting')}</TableCell>
                  <TableCell align="center" sx={{ color: "#FFFFFF", width: "2%" }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ backgroundColor: "#48494B" }}>
                {
                  cameraList.map((data, index) => 
                    <TableRow 
                      key={index} 
                      sx={{
                        '& td, & th': { borderBottom: '1px dashed #ADADAD' }
                      }}
                    >
                      <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", height: "83px", textAlign: "center" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", height: "83px" }}>
                        {data.checkpoint_name}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", height: "83px", textAlign: "center" }}>
                        {
                          (() => {
                            const color = data.active === 1 ? "bg-[#4CB64C]" : "bg-[#ADADAD]";
                            return (
                              <label
                                className={`w-[80px] h-[30px] inline-flex items-center justify-center rounded
                                ${color}`}
                              >
                                { data.active === 1 ? t('text.active') : t('text.inactive') }
                              </label>
                            )
                          })()
                        }
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", height: "83px", textAlign: "center" }}>
                        {data.camera_name}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", height: "83px", textAlign: "center" }}>
                        {`${data.latitude}, ${data.longitude}`}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", height: "83px", textAlign: "end" }}>
                        {formatNumber(data.detection_count || 0)}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", height: "83px", textAlign: "center" }}>
                        <Button onClick={() => handleSensorSettingClick(data)}>
                          <img 
                            src={`/icons/sensor-setting${data.detection_area && data.detection_area.trim() !== "{}" ? "-green" : ""}.png`}
                            style={{ height: "30px", width: "30px" }} 
                            alt="Sensor Setting" 
                          />
                        </Button>
                      </TableCell>
                      <TableCell align="center"
                        sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", height: "83px" }}
                        className='flex justify-center items-center'
                      >
                        <div className='flex items-center justify-center gap-1'>
                          <IconButton
                            sx={{
                              borderRadius: "4px !important",
                            }}
                            onClick={() => handleEdit(data)}
                          >
                            <Pencil color='#FFFFFF' size={20} />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Part */}
          <div className={`${cameraList.length > 0 ? "flex" : "hidden"} items-center justify-between bg-[var(--background-color)] py-3 pl-1 sticky bottom-0`}>
            <PaginationComponent 
              page={page} 
              onChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={rowsPerPageOptions}
              handleRowsPerPageChange={handleRowsPerPageChange}
              totalPages={totalPages}
              pageInput={pageInput.toString()}
              handlePageInputKeyDown={handlePageInputKeyDown}
              handlePageInputChange={handlePageInputChange}
            />
          </div>
        </div>

        {/* Modules */}
        {
          openCameraSetting && (
            <CameraSetting open={openCameraSetting} onClose={handleCameraSettingClose} selectedRow={selectedRow} isEdit={isEdit} />
          )
        }
        {
          openSensorSetting && (
            <SensorSetting open={openSensorSetting} onClose={handleSensorSettingClose} selectedRow={selectedRow} />
          )
        }
        {
          openCheckpointSetting && (
            <CheckpointSetting open={openCheckpointSetting} onClose={handleCheckpointSettingClose} checkpointData={checkpointData} isEditMode={isCheckpointEditMode} />
          )
        }
      </div>
    </div>
  )
}

export default Setting;
// import React, { useState, useEffect } from 'react'
// import { useForm } from "react-hook-form";
// import { useSelector, useDispatch } from "react-redux";
// import { RootState, AppDispatch } from "../../app/store";
// import Papa from "papaparse";

// // Material UI
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableRow from '@mui/material/TableRow';
// import TableHead from '@mui/material/TableHead';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import { SelectChangeEvent } from '@mui/material/Select';
// import Paper from '@mui/material/Paper';
// import IconButton from '@mui/material/IconButton';

// // Icons
// import CSVIcon from "../../assets/icons/csv.png";
// import PDFIcon from "../../assets/icons/pdf.png";
// import SearchIcon from '@mui/icons-material/Search';
// import { Upload, X } from "lucide-react";
// import { Icon } from '../../components/icons/Icon'

// // Types
// import { FileData, SuspectPersonSearch } from "../../features/search/SearchTypes";
// import { Camera } from "../../features/types";

// // Context
// import { useHamburger } from "../../context/HamburgerContext";

// // Components
// import Loading from "../../components/loading/Loading";
// import TextBox from '../../components/text-box/TextBox';
// import DatePickerBuddhist from "../../components/date-picker-buddhist/DatePickerBuddhist";
// import AutoComplete from '../../components/auto-complete/AutoComplete';
// import MultiSelectCameras from '../../components/multi-select/MultiSelectCameras';
// import PaginationComponent from '../../components/pagination/Pagination';
// import Image from '../../components/image/Image';
// import ProgressBarWithLabel from "../../components/progress-bar/ProgressBarWithLabel";

// // Utils
// import { PopupMessage } from '../../utils/popupMessage';
// import { formatThaiID, formatNumber, getPersonTypeColor, downloadFile, formatPhone } from "../../utils/commonFunction"
// import { fetchClient, combineURL } from "../../utils/fetchClient"

// // Mocks
// import { mockSuspectPersonSearch } from "../../mocks/mockSuspectPerson";

// // Constant
// import { SUSPECT_PERSON_SEARCH_ROW_PER_PAGES } from "../../constants/dropdown";

// // i18n
// import { useTranslation } from 'react-i18next';

// // Types
// import {
//   DistrictsResponse,
// } from "../../features/dropdown/dropdownTypes";

// // Config
// import { getUrls } from '../../config/runtimeConfig';
// import dayjs from 'dayjs';

// // PDF
// import { downloadSearchResultPdf } from "./suspect-people-pdf/SuspectPeoplePdf";

// interface FormData {
//   firstName: string
//   lastName: string
//   nationalId: string
//   start_date_time: Date | null
//   end_date_time: Date | null
//   province_id: number
//   district_id: number
//   person_class_id: number
//   checkpoints_id: number[]
//   imagesData: FileData | null
// };

// interface SearchSuspectPersonProps {

// }

// const SearchSuspectPerson: React.FC<SearchSuspectPersonProps> = ({}) => {
//   const { isOpen } = useHamburger();
//   const dispatch: AppDispatch = useDispatch()
//   const { CENTER_API, CENTER_FILE_URL } = getUrls();

//   // State
//   const [searchCheckpointsVisible, setSearchCheckpointsVisible] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isHideImage, setIsHideImage] = useState(false);  
//   const [searchCamerasVisible, setSearchCamerasVisible] = useState(false);
//   const [pageLoading, setPageLoading] = useState(false);

//   // Data
//   const [selectedCameraObjects, setSelectedCameraObjects] = useState<{value: any, label: string}[]>([]);
//   const [selectedCheckpointObjects, setSelectedCheckpointObjects] = useState<Camera[]>([]);
//   const [suspectPersonSearchList, setSuspectPersonSearchList] = useState<SuspectPersonSearch[]>([]);
//   const [cameraList, setCameraList] = useState<Camera[]>([]);
//   const [progress, setProgress] = useState(0);
//   const [progressMessage, setProgressMessage] = useState<string>("");
  
//   // Option
//   const [camerasOption, setCamerasOption] = useState<{ label: string ,value: any }[]>([]);
//   const [personTypesOptions, setPersonTypesOptions] = useState<{ label: string ,value: number }[]>([]);
//   const [provinceOptions, setProvinceOptions] = useState<{ label: string ,value: number }[]>([]);
//   const [districtOptions, setDistrictOptions] = useState<{ label: string ,value: number }[]>([]);

//   // Pagination
//   const [page, setPage] = useState(1);
//   const [pageInput, setPageInput] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalData, setTotalData] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(SUSPECT_PERSON_SEARCH_ROW_PER_PAGES[SUSPECT_PERSON_SEARCH_ROW_PER_PAGES.length - 1]);
//   const [rowsPerPageOptions] = useState(SUSPECT_PERSON_SEARCH_ROW_PER_PAGES);

//   // i18n
//   const { t, i18n } = useTranslation();

//   // Constants
//   const CHUNK_SIZE = 500;
//   const REQUEST_LIMIT = 5000;

//   const sliceDropdown = useSelector(
//     (state: RootState) => state.dropdownData
//   );

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     clearErrors,
//   } = useForm();

//   const [formData, setFormData] = useState<FormData>({
//     firstName: "",
//     lastName: "",
//     nationalId: "",
//     start_date_time: null,
//     end_date_time: null,
//     province_id: 0,
//     district_id: 0,
//     person_class_id: 0,
//     checkpoints_id: [],
//     imagesData: null,
//   });

//   useEffect(() => {
//     setSuspectPersonSearchList(mockSuspectPersonSearch);
//   }, [mockSuspectPersonSearch])

//   useEffect(() => {
//     setProvinceOptions([{ label: t('dropdown.all'), value: 0 }]);
//     setDistrictOptions([{ label: t('dropdown.all'), value: 0 }]);
//     setSelectedCameraObjects([{ label: t('dropdown.all'), value: "0" }]);
//   }, [i18n.language, i18n.isInitialized])

//   useEffect(() => {
//     if (cameraList) {
//       const options = cameraList.map((row) => ({
//         label: row.camera_name,
//         value: row.uid,
//       }))
//       setCamerasOption([{ label: t('dropdown.all'), value: "0" }, ...options])
//     }
//   }, [cameraList, i18n.language, i18n.isInitialized])

//   useEffect(() => {
//     if (sliceDropdown.provinces && sliceDropdown.provinces.data) {
//       const options = sliceDropdown.provinces.data.map((row) => ({
//         label: row.name_th,
//         value: row.id,
//       }));
//       setProvinceOptions(options);
//     }
//   }, [sliceDropdown.provinces]);
  
//   useEffect(() => {
//     if (sliceDropdown.personTypes && sliceDropdown.personTypes.data) {
//       const options = sliceDropdown.personTypes.data.map((row) => ({
//         label: row.title_en,
//         value: row.id,
//       }));
//       setPersonTypesOptions(options);
//     }
//   }, [sliceDropdown.personTypes]);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (formData.province_id) {
//         const res = await fetchClient<DistrictsResponse>(combineURL(CENTER_API, "/districts/get"), {
//           method: "GET",
//           queryParams: {
//             province_id: formData.province_id.toString(),
//           },
//         });
//         if (res && res.data) {
//           const options = res.data.map((row) => ({
//             label: row.name_th,
//             value: row.id,
//           }));
//           setDistrictOptions(options);
//         }
//       }
//     };
//     fetchData();
//   }, [dispatch, formData.province_id]);

//   const handleTextChange = (key: keyof typeof formData, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//     setValue(key, value);
//   };

//   const handleDropdownChange = (key: keyof typeof formData, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//     setValue(key, value);
//   };

//   const handleStartDateTimeChange = (date: Date | null) => {
//     setFormData((prevState) => ({
//       ...prevState,
//       start_date_time: date,
//     }));
//   };
  
//   const handleEndDateTimeChange = (date: Date | null) => {
//     setFormData((prevState) => ({
//       ...prevState,
//       end_date_time: date,
//     }));
//   };

//   const handleProvinceChange = (
//     event: React.SyntheticEvent,
//     value: { value: any ,label: string } | null
//   ) => {
//     event.preventDefault();
//     if (value) {
//       handleDropdownChange("province_id", value.value);
//     }
//     else {
//       handleDropdownChange("province_id", '');
//     }
//   };

//   const handleDistrictChange = (
//     event: React.SyntheticEvent,
//     value: { value: any ,label: string } | null
//   ) => {
//     event.preventDefault();
//     if (value) {
//       handleDropdownChange("district_id", value.value);
//     }
//     else {
//       handleDropdownChange("district_id", '');
//     }
//   };

//   const handlePersonTypesChange = (
//     event: React.SyntheticEvent,
//     value: { value: any ,label: string } | null
//   ) => {
//     event.preventDefault();
//     if (value) {
//       handleDropdownChange("person_class_id", value.value);
//     }
//     else {
//       handleDropdownChange("person_class_id", '');
//     }
//   };

//   const handleCheckPointChange = (ids: string[]) => {
//     console.log(ids)
//     // setFormData((prev) => ({ ...prev, ["checkpoints_id"]: ids }));
//     // const selectedObjects = checkpointsOption.filter(cp => ids.includes(cp.id));
//     // setSelectedCheckpointObjects(selectedObjects);
//   };

//   const handleClearSearch = async () => {
//     setSelectedCheckpointObjects([]);
//   };

//   // const handleDeleteImage = useCallback(async (position: number, url: string) => {
//   //   try {
//   //     const deleteFile: DeleteRequestData = {
//   //       url: url
//   //     }
//   //     await deleteFileUpload(deleteFile)
//   //   }
//   //   catch (error) {

//   //   }
//   //   setFormData((prev) => {
//   //     const updatedImagesData = { ...prev.imagesData }
//   //     delete updatedImagesData[position]

//   //     return {
//   //       ...prev,
//   //       imagesData: updatedImagesData,
//   //     }
//   //   })
//   // }, [dispatch])

//   const handleRowsPerPageChange = async (event: SelectChangeEvent) => {
//     setRowsPerPage(parseInt(event.target.value));
//   };

//   const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
//     event.preventDefault();
//     setPage(value);
//   };

//   const handlePageInputKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
//     if (event.key === 'Enter') {
//       event.preventDefault();
  
//       setPage(pageInput);
//     }
//   };

//   const handlePageInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const input = event.target.value;
//     const cleaned = input.replace(/\D/g, '');

//     if (cleaned) {
//       const numberInput = Number(cleaned);
//       if (numberInput > 0 && numberInput <= totalPages) {
//         setPageInput(numberInput);
//       }
//     }
//     else if (cleaned === "") {
//       setPageInput(1);
//     }
//     return cleaned;
//   };

//   const handleNationalIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const input = event.target.value;
//     const cleaned = input.replace(/\D/g, '');
    
//     if (cleaned.length <= 13) {
//       const formatted = formatThaiID(cleaned)
//       handleTextChange("nationalId", formatted)
//     }
//     return cleaned
//   }

//   const handleCameraChange = (ids: string[]) => {
//     let newIds: string[];

//     if (ids.length === 0 || ids.includes("0")) {
//       newIds = ["0"];
//     } else {
//       newIds = ids;
//     }

//     const selectedObjects = camerasOption.filter((camera) =>
//       newIds.includes(camera.value)
//     );

//     setSelectedCameraObjects(selectedObjects);
//   };

//   const handleSearch = () => {

//   }

//   const exportToCsv = async () => {
//     try {
//       // if (totalData > CHUNK_SIZE) {
//       //   const confirmed = await PopupMessageCustomTextWithCancel(t('message.warning.export-all-confirmation'), t('message.warning.export-all-confirmation-message', { totalNumber: totalData }), t('button.confirm'), t('button.cancel'), "warning", "#FDB600")
        
//       //   if (!confirmed) return;

//       //   await handleExportAllDataInCsvConfirm();
//       //   return;
//       // }

//       setPageLoading(true);
//       setProgress(0);
//       setProgressMessage(t('progress-bar.data-downloading'));

//       // const response = await fetchNewData(
//       //   1,
//       //   CHUNK_SIZE
//       // );

//       setProgress(80);
//       setProgressMessage(t('progress-bar.csv-file-preparing'));

//       const csvBlob = await generateDataToExport(suspectPersonSearchList);
//       const date = dayjs().format(i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD");
//       const csvName = `${t('file.suspect-people')}_${date}.csv`;

//       downloadFile(csvName, URL.createObjectURL(csvBlob));

//       setProgress(100);
//       setProgressMessage(t('progress-bar.file-download-complete'));
//       setPageLoading(false);
//     }
//     catch (error) {
//       setProgress(0);
//       setProgressMessage("");
//       setPageLoading(false);
//       const errorMessage = error instanceof Error ? error.message : String(error)
//       PopupMessage(t('message.error.error-while-export-data'), errorMessage, "error");
//     }
//   }

//   const exportToPdf = async () => {
//     // if (totalData > CHUNK_SIZE) {
//     //   const confirmed = await PopupMessageCustomTextWithCancel(t('message.warning.export-all-confirmation'), t('message.warning.export-all-confirmation-message', { totalNumber: totalData }), t('button.confirm'), t('button.cancel'), "warning", "#FDB600")
      
//     //   if (!confirmed) return;

//     //   await handleExportAllDataInPdfConfirm();
//     //   return;
//     // }

//     setPageLoading(true);
//     setProgress(0);
//     setProgressMessage(t('progress-bar.data-downloading'));

//     // const response = await fetchNewData(
//     //   1,
//     //   CHUNK_SIZE
//     // );

//     setProgress(80);
//     setProgressMessage(t('progress-bar.pdf-file-preparing'));

//     // const updateData = response.data.map((item) => {
//     //   const plateType = sliceDropdown.plateTypes?.data.find(
//     //     (pt) => pt.id === item.special_plate_id
//     //   );

//     //   return {
//     //     ...item,
//     //     isBlackList:
//     //       plateType?.title_en?.trim().toLowerCase() === "blacklist" || false,
//     //     special_plate_name: i18n.language === "th" ? plateType?.title_th ?? "" : plateType?.title_en ?? "",
//     //   };
//     // });

//     const date = dayjs().format(i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD");
//     const pdfName = `${t('file.suspect-people')}_${date}.pdf`;
//     await downloadSearchResultPdf(suspectPersonSearchList, pdfName, t, i18n, CENTER_FILE_URL);

//     setProgress(100);
//     setProgressMessage(t('progress-bar.file-download-complete'));
//     setPageLoading(false);
//   }

//   const generateDataToExport = async (data: SuspectPersonSearch[]) => {
//     const columnLabels = {
//       prefix: t('csv.column.prefix'),
//       firstName: t('csv.column.first-name'),
//       lastName: t('csv.column.last-name'),
//       accuracy: t('csv.column.percent-match'),
//       checkpoint: t('csv.column.checkpoint'),
//       date: t('csv.column.date'),
//       time: t('csv.column.time'),
//       personType: t('csv.column.person-type'),      
//       behavior: t('csv.column.behavior'),
//       ownerName: t('csv.column.owner-name'),
//       phone: t('csv.column.phone'),
//     };

//     const dataRows = data.map((data) => {
//       const personType = sliceDropdown?.prefix?.data.find(pf => pf.id === data.title_id);

//       return ({
//         [columnLabels.prefix]: data.prefix,
//         [columnLabels.firstName]: data.firstName,
//         [columnLabels.lastName]: data.lastName,
//         [columnLabels.accuracy]: data.percentConfidence,
//         [columnLabels.checkpoint]: data.checkpoints.length > 0 ? data.checkpoints[0].checkpointName : "-",
//         [columnLabels.date]: data.dateTime ? dayjs(data.dateTime).format(i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY") : "-",
//         [columnLabels.time]: data.dateTime ? dayjs(data.dateTime).format("HH:mm:ss") : "-",
//         [columnLabels.personType]: personType ? i18n.language === "th" ? personType.title_th : personType.title_en : "-",
//         [columnLabels.behavior]: data.remark || "-",
//         [columnLabels.ownerName]: data.ownerName || "-",
//         [columnLabels.phone]: data.ownerPhone ? formatPhone(data.ownerPhone) : "-",
//       })
//     });

//     const csvString =
//         t('file.suspect-people') + "\n" + 
//         Papa.unparse(dataRows, { columns: Object.values(columnLabels) });

//     const csvWithBOM = "\uFEFF" + csvString;
//     return new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
//   }

//   return (
//     <div id='search-suspect-person' className={`main-content ${isOpen ? "pl-[130px]" : "pl-2.5"} transition-all duration-500`}>
//       { isLoading && <Loading /> }
//       {
//         pageLoading && <ProgressBarWithLabel message={progressMessage} value={progress} />
//       }
//       <div className='flex flex-col w-full'>
//         {/* Header */}
//         <Typography variant="h5" color="white" className="font-bold">{t('screen.search-suspect-people.title')}</Typography>

//         {/* Filter Part */}
//         <form className='grid grid-cols-5 gap-y-3 gap-3 pr-[60px]' onSubmit={handleSubmit(handleSearch)}>
//           <div className='row-span-3'>
//             {/* Image Upload Section */}
//             <div id="image-import-part" className="flex flex-col items-center">
//               <div className="flex items-center justify-center w-full h-[240px] mt-[5px] bg-[#D9D9D9] overflow-hidden px-3">

//                 {formData.imagesData ? (
//                   /* Image Preview */
//                   <div className="relative flex items-center justify-center w-full h-full">
//                     <Image
//                       imageSrc={`${CENTER_FILE_URL}${formData.imagesData.url}`} 
//                       imageAlt={`Upload Image`}
//                       className="object-contain w-full h-[250px]" 
//                     />

//                     <button
//                       type="button"
//                       className="absolute z-[52] top-1 right-1 text-white bg-white border border-[#2B9BED] rounded-[5px] w-[25px] h-[25px] flex items-center justify-center hover:cursor-pointer"
//                       // onClick={() => handleDeleteImage(formData.imagesData.url)}
//                     >
//                       <Icon icon={X} size={15} color="#2B9BED" />
//                     </button>
//                   </div>
//                 ) : (
//                   /* No Image - upload prompt */
//                   <div className="flex flex-col justify-center items-center gap-3">
//                     <label className="text-[#2A2C2E] text-[14px]">
//                       {t('text.search-with-image')}
//                     </label>

//                     <label
//                       htmlFor="image-upload"
//                       className="relative flex flex-col gap-2 items-center justify-center
//                                 w-[130px] h-[130px] rounded-[5px] border border-[#C5C8CB]
//                                 bg-white overflow-hidden cursor-pointer hover:bg-gray-100"
//                     >
//                       <Icon icon={Upload} size={50} color="#2F5552" />
//                       <span className="text-[#2F5552] text-[14px]">
//                         {t('text.upload-image')}
//                       </span>

//                       {/* Hidden File Input */}
//                       <input
//                         id="image-upload"
//                         type="file"
//                         name="images"
//                         accept="image/*"
//                         multiple
//                         className="absolute inset-0 opacity-0 cursor-pointer"
//                         // onChange={handleImageUpload}
//                       />
//                     </label>
//                   </div>
//                 )}
                
//               </div>
//             </div>

//           </div>

//           <TextBox
//             sx={{ marginTop: "5px", fontSize: "15px" }}
//             id="first-name"
//             label={t("component.first-name")}
//             value={formData.firstName}
//             onChange={(event) =>
//               handleTextChange("firstName", event.target.value)
//             }
//             register={register("firstName", { 
//               required: false,
//             })}
//             error={!!errors.firstName}
//           />

//           <TextBox
//             sx={{ marginTop: "5px", fontSize: "15px" }}
//             id="surname"
//             label={t("component.last-name")}
//             value={formData.lastName}
//             onChange={(event) =>
//               handleTextChange("lastName", event.target.value)
//             }
//             register={register("lastName", { 
//               required: false,
//             })}
//             error={!!errors.lastName}
//           />

//           <TextBox
//             sx={{ marginTop: "5px", fontSize: "15px" }}
//             id="id-card-number"
//             label={t("component.id-card-number")}
//             value={formData.nationalId}
//             onChange={handleNationalIdChange}
//             register={register("nationalId", { 
//               required: false,
//             })}
//             error={!!errors.nationalId}
//           />

//           <AutoComplete 
//             id="person-type-select"
//             sx={{ marginTop: "5px"}}
//             value={formData.person_class_id}
//             onChange={handlePersonTypesChange}
//             options={personTypesOptions}
//             label={t("component.person-type")}
//             placeholder={t("placeholder.person-type")}
//             labelFontSize="15px"
//             register={register("personType", { 
//               required: true,
//             })}
//             error={!!errors.personType}
//           />

//           <AutoComplete 
//             id="province-select"
//             sx={{ marginTop: "5px"}}
//             value={formData.province_id}
//             onChange={handleProvinceChange}
//             options={provinceOptions}
//             label={t("component.province")}
//             labelFontSize="15px"
//             placeholder={t("placeholder.province")}
//             register={register("province", { 
//               required: false,
//             })}
//             error={!!errors.province}
//           />

//           <AutoComplete 
//             id="district-select"
//             sx={{ marginTop: "5px"}}
//             value={formData.district_id}
//             onChange={handleDistrictChange}
//             options={districtOptions}
//             label={t("component.district")}
//             labelFontSize="15px"
//             placeholder={t("placeholder.district")}
//             register={register("district", { 
//               required: false,
//             })}
//             error={!!errors.district}
//           />

//           <div className='col-span-2'>
//             <Typography sx={{ fontSize: "15px" }} variant='subtitle1' color='white'>{t('component.checkpoint-2')}</Typography>
//             <div className='flex gap-3 mt-[5px]'>
//               <div className='flex-1'>
//                 <MultiSelectCameras 
//                   limitTags={2} 
//                   options={camerasOption} 
//                   onChange={handleCameraChange}
//                   selectedValues={selectedCameraObjects}
//                   placeHolder={t('placeholder.checkpoint-2')}
//                   isLocationButton={true}
//                   onIconClick={() => setSearchCamerasVisible(true)}
//                 />
//               </div>
//             </div>
//           </div>

//           <div>
//             <Typography sx={{ fontSize: "15px"}} variant='subtitle1' color='white'>
//               {t('component.start-time')}
//             </Typography>
//             <DatePickerBuddhist
//               value={formData.start_date_time}
//               sx={{
//                 marginTop: "8px",
//                 borderRadius: "5px",
//                 backgroundColor: "white",
//                 "& .MuiTextField-root": {
//                   height: "fit-content",
//                 },
//                 "& .MuiOutlinedInput-input": {
//                   fontSize: 14
//                 }
//               }}
//               className="w-full"
//               id="start-date-time"
//               onChange={(value) => handleStartDateTimeChange(value)}
//               isWithTime={true}
//               error={!!errors.start_date_time}
//               register={register("start_date_time", { 
//                 required: true,
//               })}
//             >
//             </DatePickerBuddhist>
//           </div>

//           <div>
//             <Typography sx={{ fontSize: "15px"}} variant='subtitle1' color='white'>
//               {t('component.end-time')}
//             </Typography>
//             <DatePickerBuddhist
//               value={formData.end_date_time}
//               sx={{
//                 marginTop: "8px",
//                 borderRadius: "5px",
//                 backgroundColor: "white",
//                 "& .MuiTextField-root": {
//                   height: "fit-content",
//                 },
//                 "& .MuiOutlinedInput-input": {
//                   fontSize: 14
//                 }
//               }}
//               className="w-full"
//               id="end-date-time"
//               onChange={(value) => handleEndDateTimeChange(value)}
//               isWithTime={true}
//               error={!!errors.end_date_time}
//               register={register("end_date_time", { 
//                 required: true,
//               })}
//             >
//             </DatePickerBuddhist>
//           </div>
//         </form>

//         {/* Footer Part */}
//         <div className={`flex justify-between mt-5 pr-[30px]`}>
//           <div className='flex items-end'>
//             <label>{`${t('table.amount')} ${formatNumber(totalData)} ${t('table.list')}`}</label>
//           </div>
//           {/* Button Part */}
//           <div className='flex gap-2'>
//             <div className='flex gap-1'>
//               <Button
//                 type='submit'
//                 variant="contained"
//                 className="primary-btn"
//                 startIcon={<SearchIcon />}
//                 sx={{
//                   width: t('button.search-width'),
//                   textTransform: "capitalize",
//                   '& .MuiSvgIcon-root': { 
//                     fontSize: 26 
//                   } 
//                 }}
//                 >
//                 {t('button.search')}
//               </Button>
//               <Button 
//                 variant="outlined" 
//                 className="secondary-btn" 
//                 onClick={handleClearSearch}
//                 sx={{
//                   width: t('button.clear-width'),
//                   textTransform: "capitalize",
//                 }}
//               >
//                 {t('button.clear')}
//               </Button>
//             </div>

//             <div className='flex gap-1'>
//               <IconButton 
//                 className="tertiary-btn"
//                 sx={{
//                   borderRadius: "4px !important",
//                 }}
//                 onClick={exportToCsv}
//               >
//                 <img src={CSVIcon} alt='CSV Icon' className='w-5 h-5' />
//               </IconButton>

//               <IconButton 
//                 className="tertiary-btn"
//                 sx={{
//                   borderRadius: "4px !important",
//                 }}
//                 onClick={exportToPdf}
//               >
//                 <img src={PDFIcon} alt='PDF Icon' className='w-5 h-5' />
//               </IconButton>
//             </div>
//           </div>
//         </div>

//         {/* Result Table */}
//         <div className="pr-[30px]">
//           <TableContainer 
//             component={Paper} 
//             className='mt-1'
//             sx={{ height: "50vh", backgroundColor: "transparent" }}
//           >
//             <Table sx={{ minWidth: 650, backgroundColor: "#48494B"}}>
//               <TableHead>
//                 <TableRow sx={{ backgroundColor: "#242727", position: "sticky", top: 0, zIndex: 1 }}>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.no')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.prefix')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.full-name')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.image')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.percentage-match')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.checkpoint')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.date-time-range')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF" }}>{t('table.column.person-type-2')}</TableCell>
//                   <TableCell align="center" sx={{ color: "#FFFFFF", width: 450 }}>{t('table.column.behavior')}</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody sx={{ backgroundColor: "#48494B" }}>
//                 {
//                   suspectPersonSearchList.map((data, index) => (
//                     <TableRow key={index}>
//                       <TableCell sx={{ textAlign: "center", backgroundColor: "#393B3A", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>{index + 1}</TableCell>
//                       <TableCell
//                         sx={{ backgroundColor: "#48494B", color: "#FFFFFF", textAlign: "center", borderBottom: "1px dashed #ADADAD" }}
//                       >
//                       {
//                         (() => {
//                           const personType = sliceDropdown?.prefix?.data.find(pf => pf.id === data.title_id);
//                           return personType ? i18n.language === "th" ? personType.title_th : personType.title_en : "-";
//                         })()
//                       }
//                       </TableCell>
//                       <TableCell sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>{data.name}</TableCell>
//                       <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>
//                         <div className='flex items-center justify-center space-x-1 h-10'>
//                           {
//                             isHideImage ? 
//                             "--" : 
//                             <div className='flex'>
//                               <Image
//                                 imageSrc={data.imagesData ? `${CENTER_FILE_URL}${data.imagesData.url}` : ""} 
//                                 imageAlt={`image`}
//                                 className='w-[60px] h-[60px]'
//                               />
//                             </div>
//                           }
//                         </div>
//                       </TableCell>
//                       <TableCell sx={{ textAlign: "center", backgroundColor: "#393B3A", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>{data.percentConfidence}</TableCell>
//                       <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>
//                         {
//                           data.checkpoints.map((checkpoint) => checkpoint.checkpointName).join(", ")
//                         }
//                       </TableCell>
//                       <TableCell sx={{ backgroundColor: "#393B3A", color: "#FFFFFF", textAlign: "center", borderBottom: "1px dashed #ADADAD" }}>{data.dateTime ? dayjs(data.dateTime).format(i18n.language === "th" ? "DD/MM/BBBB (HH:mm:ss)" : "DD/MM/YYYY (HH:mm:ss)") : "-"}</TableCell>
//                       <TableCell sx={{ backgroundColor: "#48494B", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>
//                         {
//                           (() => {
//                             const personType = personTypesOptions.find(pt => pt.value === data.person_class_id);
//                             const { color, backgroundColor } = getPersonTypeColor(data.person_class_id);
//                             return (
//                               <div className='flex justify-center items-center'>
//                                 <label
//                                   className={`w-20 h-[30px] inline-flex items-center justify-center rounded font-bold`}
//                                   style={{ color: color, backgroundColor: backgroundColor }}
//                                 >
//                                   { personType?.label || "-" }
//                                 </label>
//                               </div>
//                             )
//                           })()
//                         }
//                       </TableCell>
//                       <TableCell sx={{ backgroundColor: data.person_class_id === 1 ? "#EC313161" : "#393B3A", color: "#FFFFFF", borderBottom: "1px dashed #ADADAD" }}>{data.remark}</TableCell>
//                     </TableRow>
//                   ))
//                 }
//               </TableBody>
//             </Table>
//           </TableContainer>

//           <div className={`${suspectPersonSearchList.length > 0 ? "flex" : "hidden"} items-center justify-between bg-(--background-color) py-3 pl-1 sticky bottom-0`}>
//             <PaginationComponent 
//               page={page} 
//               onChange={handlePageChange}
//               rowsPerPage={rowsPerPage}
//               rowsPerPageOptions={rowsPerPageOptions}
//               handleRowsPerPageChange={handleRowsPerPageChange}
//               totalPages={totalPages}
//               pageInput={pageInput.toString()}
//               handlePageInputKeyDown={handlePageInputKeyDown}
//               handlePageInputChange={handlePageInputChange}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// };

// export default SearchSuspectPerson;
import React, {useState, useEffect} from 'react'
import { useForm } from "react-hook-form";

// Material UI
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';

// Icons
import { Icon } from '../../components/icons/Icon'
import { Save, Trash2 } from "lucide-react";

// Types
import { UserPermission } from '../../features/types';
import { 
  UserGroup, 
  CenterPermissionKey,
  CheckpointPermissionsKey,
  UserGroupResponse,
} from "../../features/dropdown/dropdownTypes";

// Icons
import { KeyboardArrowUp } from '@mui/icons-material';

// Components
import AutoComplete from '../../components/auto-complete/AutoComplete';
import Loading from "../../components/loading/Loading";

// i18n
import { useTranslation } from 'react-i18next';

// Utils
import { reformatString } from "../../utils/commonFunction";
import { fetchClient, combineURL } from "../../utils/fetchClient";
import { PopupMessage } from '../../utils/popupMessage';

// Config
import { getUrls } from '../../config/runtimeConfig';

interface ManagePermissionProps {
  open: boolean;
  onClose: () => void;
  isCenter: boolean;
}

const ManagePermission: React.FC<ManagePermissionProps> = ({open, onClose, isCenter}) => {
  const { CENTER_API } = getUrls();
  
  // Data
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  // Options
  const [userRolesOptions, setUserRolesOptions] = useState<{ label: string ,value: number }[]>([]);

  // State
  const [isAccordionCenterOpen, setIsAccordionCenterOpen] = useState(true);
  const [isAccordionCheckpointOpen, setIsAccordionCheckpointOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDefaultPermission, setIsDefaultPermission] = useState(true);
  const [isNewPermission, setIsNewPermission] = useState(false);

  // Constants
  const USER_ROLE_ID = 1;

  // Key
  const centerKeys: CenterPermissionKey[] = [
    "realtime",
    "conditionSearch",
    // "beforeAfterSearch",
    "specialPlateManage",
    // "specialPlateSearch",
    // "executiveReport",
    "manageUser",
    "setting",
    "manageCheckpointCameras",
    "chart",
  ];
  const checkpointKeys: CheckpointPermissionsKey[] = [
    "realtime",
    // "suspiciousPersonManage",
    // "suspiciousPersonSearch",
    "specialPlateManage",
    "specialPlateSearch",
    "setting",
  ];

  // i18n
  const { t } = useTranslation();

  // Constant
  const DEFAULT_CENTER_PERMISSION = {
    realtime: {
      select: false,
    },
    conditionSearch: {
      select: false,
    },
    // beforeAfterSearch: {
    //   select: false,
    // },
    specialPlateManage: {
      select: false,
    },
    // specialPlateSearch: {
    //   select: false,
    // },
    // executiveReport: {
    //   select: false,
    // },
    manageUser: {
      select: false,
    },
    setting: {
      select: false,
    },
    manageCheckpointCameras: {
      select: false,
    },
    chart: {
      select: false,
    }
  };

  const DEFAULT_CENTER_PERMISSION_NAME = {
    realtime: {
      name: t('text.ct-real-time-vehicle-analysis-system'),
    },
    conditionSearch: {
      name: t('text.ct-conditional-search'),
    },
    // beforeAfterSearch: {
    //   name: t('text.ct-before-after-search'),
    // },
    suspectPersonManage: {
      name: t('text.ct-suspicious-person-search'),
    },
    suspectPersonSearch: {
      name: t('text.ct-suspicious-person-manage'),
    },
    specialPlateManage: {
      name: t('text.ct-special-plate-manage'),
    },
    // specialPlateSearch: {
    //   name: t('text.ct-special-plate-search'),
    // },
    // executiveReport: {
    //   name: t('text.ct-executive-report'),
    // },
    manageUser: {
      name: t('text.ct-manage-user'),
    },
    setting: {
      name: t('text.ct-setting'),
    },
    manageCheckpointCameras: {
      name: t('text.ct-checkpoint-cameras'),
    },
    chart: {
      name: t('text.ct-chart'),
    }
  };

  const DEFAULT_CHECKPOINT_PERMISSION = {
    realtime: {
      select: false,
    },
    // suspectPersonManage: {
    //   select: false,
    // },
    // suspectPersonSearch: {
    //   select: false,
    // },
    specialPlateManage: {
      select: false,
    },
    specialPlateSearch: {
      select: false,
    },
    setting: {
      select: false,
    },
  };

  const DEFAULT_CHECKPOINT_PERMISSION_NAME = {
    realtime: {
      name: t('text.cp-real-time'),
    },
    // suspiciousPersonManage: {
    //   name: t('text.cp-special-plate-search'),
    // },
    // suspiciousPersonSearch: {
    //   name: t('text.cp-special-plate-manage'),
    // },
    specialPlateManage: {
      name: t('text.cp-suspicious-person-search'),
    },
    specialPlateSearch: {
      name: t('text.cp-suspicious-person-manage'),
    },
    setting: {
      name: t('text.cp-setting'),
    },
  };

  const {
    register,
    handleSubmit,
    setValue,
  } = useForm();

  const [formData, setFormData] = useState<UserPermission>({
    userRoleId: USER_ROLE_ID,
    group_name: '',
    center: DEFAULT_CENTER_PERMISSION,
    checkpoint: DEFAULT_CHECKPOINT_PERMISSION,
  });

  useEffect(() => {
    if (open) {
      fetchUserPermission(isCenter);
      setValue("roleType", "object");
    }
    else {
      clearData();
    }
  }, [open])

  useEffect(() => {
    if (userGroups) {
      const options = userGroups.map((row) => ({
        label: reformatString(row.group_name),
        value: row.id,
      }));
      setUserRolesOptions(options);
    }
  }, [userGroups]);

  const fetchUserPermission = async (isCenter: boolean) => {
    if (isCenter) {

    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      setIsLoading(true);
      const response = await fetchClient<UserGroupResponse>(combineURL(CENTER_API, "/user-groups/get"), {
        method: "GET",
        signal: controller.signal,
      });

      if (response.success && response.data.length > 0) {
        setUserGroups(response.data);
        setFormData({
          userRoleId: response.data[0].id,
          group_name: response.data[0].group_name,
          center: response.data[0].permissions.center,
          checkpoint: response.data[0].permissions.checkpoint
        });
        setIsDefaultPermission(true);
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
  };

  const addNewPermission = async (data: any) => {
    try {
      setIsLoading(true);

      const body = {
        group_name: data.userRoleName.toString().toLowerCase(),
        description: "",
        permissions: {
          center: formData.center,
          checkpoint: formData.checkpoint
        }
      }

      const response = await fetchClient<UserGroupResponse>(combineURL(CENTER_API, "/user-groups/create"), {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.success) {
        PopupMessage(t('message.success.save-success'), t('message.success.save-success-message'), "success");
        fetchUserPermission(isCenter);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-saving'), errorMessage, "error");
    }
    finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const updatePermission = async () => {
    try {
      setIsLoading(true);

      const body = {
        id: formData.userRoleId,
        group_name: formData.group_name,
        permissions: {
          center: formData.center,
          checkpoint: formData.checkpoint
        }
      }

      const response = await fetchClient<UserGroupResponse>(combineURL(CENTER_API, "/user-groups/update"), {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (response.success) {
        PopupMessage(t('message.success.save-success'), t('message.success.save-success-message'), "success");
        fetchUserPermission(isCenter);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-saving'), errorMessage, "error");
    }
    finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const deletePermission = async (id: number) => {
    try {
      setIsLoading(true);

      const response = await fetchClient<UserGroupResponse>(combineURL(CENTER_API, "/user-groups/delete"), {
        method: "DELETE",
        queryParams: {
          ids: [id].toString()
        },
      });

      if (response.success) {
        PopupMessage(t('message.success.delete-success'), "", "success");
        fetchUserPermission(isCenter);
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      PopupMessage(t('message.error.error-while-deleting-data'), errorMessage, "error");
    }
    finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500)
    }
  }

  const handleDropdownChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUserRoleChange = (
    event: React.SyntheticEvent,
    value: { value: any ,label: string } | null
  ) => {
    event.preventDefault();

    if (typeof value === "string") {
      setFormData((prev) => ({
        ...prev,
        center: DEFAULT_CENTER_PERMISSION,
        checkpoint: DEFAULT_CHECKPOINT_PERMISSION,
      }));
      setIsNewPermission(true);
      setValue("userRoleName", value);
      setValue("roleType", "string");
    }
    else if (value) {
      handleDropdownChange("userRoleId", value.value);
      userGroups.forEach((permission) => {
        if (permission.id === value.value) {
          setFormData((prev) => ({
            ...prev,
            group_name: permission.group_name,
            center: permission.permissions.center ?? DEFAULT_CENTER_PERMISSION,
            checkpoint: permission.permissions.checkpoint ?? DEFAULT_CHECKPOINT_PERMISSION
          }));
        }
      });
      setValue("userRoleName", value);
      setValue("roleType", "object");
      if (value.label.toString().toLowerCase() === "admin" || value.label.toString().toLowerCase() === "user" || value.label.toString().toLowerCase() === "super user") {
        setIsDefaultPermission(true);
      }
      else {
        setIsDefaultPermission(false);
      }
    }
    else {
      handleDropdownChange("userRoleId", '');
      setValue("userRoleName", '');
      setValue("roleType", "");
    }
  };

  const handleInputChange = (
    event: React.SyntheticEvent<Element, Event> | React.ChangeEvent<{}>, 
    value: string
  ) => {
    if (event === null) return;
    if (value === "") {
      setIsNewPermission(false);
      setIsDefaultPermission(true);
    }
    setValue("userRoleName", value);
    setValue("roleType", "string");
  }

  const handleStatusCenterChange = (event: React.ChangeEvent<HTMLInputElement>, key: keyof typeof formData.center) => {
    const isChecked = event.target.checked;
    
    setFormData((prevState) => ({
      ...prevState,
      center: {
        ...prevState.center,
        [key]: {
          select: isChecked
        }
      }
    }));
  };

  const handleStatusCheckpointChange = (event: React.ChangeEvent<HTMLInputElement>, key: keyof typeof formData.checkpoint) => {
    const isChecked = event.target.checked;
    
    setFormData((prevState) => ({
      ...prevState,
      checkpoint: {
        ...prevState.checkpoint,
        [key]: {
          ...prevState.checkpoint[key],
          select: isChecked
        }
      }
    }));
  };

  const getCheckedCount = (isCenter: boolean) => {
    if (isCenter) {
      const centerCheckedCount = centerKeys.reduce((count, key) => {
        return count + (formData.center[key]?.select ? 1 : 0);
      }, 0);
      return {centerCheckedCount, checkpointCheckedCount: 0};
    }
    else {
      const checkpointCheckedCount = checkpointKeys.reduce((count, key) => {
        return count + (formData.checkpoint[key]?.select ? 1 : 0);
      }
      , 0);
      return {centerCheckedCount: 0, checkpointCheckedCount};
    }
  };

  const handleCancelClick = () => {
    setFormData((prev) => ({
      ...prev,
      userRoleId: USER_ROLE_ID,
      group_name: '',
      center: DEFAULT_CENTER_PERMISSION,
      checkpoint: DEFAULT_CHECKPOINT_PERMISSION,
    }));
    setUserGroups([]);
    onClose();
  };

  const handleSaveClick = async (data: any) => {
    if (data.roleType === "string" || isNewPermission) {
      await addNewPermission(data);
    }
    else if (data.roleType === "object") {
      await updatePermission();
    }
  }

  const handleDeletePermission = async () => {
    const data = userRolesOptions.find((opt) => opt.value === formData.userRoleId)
  
    if (!data) return;
    await deletePermission(data?.value);
  }

  const clearData = () => {
    setValue("roleType", "");
    setValue("userRoleName", "");
  }

  return (
    <Dialog id='manage-user-permission' open={open} maxWidth="xl" fullWidth>
      { isLoading && <Loading /> }
      <DialogTitle className='bg-black'>
        {/* Header */}
        {
          (() => {
            const {centerCheckedCount, checkpointCheckedCount} = getCheckedCount(isCenter)
            return (
              <div 
              className='flex justify-between items-end'
              >
                <Typography variant="h5" component="div" color="white" className="font-bold">
                  {`${t('screen.manage-user-permission.title')} (${isCenter ? t('switch.center') : t('switch.checkpoint')})`}
                </Typography>
                <div className='text-white text-[14px]'>
                  { 
                    `${t('text.selected-count')} : ${isCenter ? centerCheckedCount : checkpointCheckedCount}` 
                  }
                </div>
              </div>
            )
          })()
        }
      </DialogTitle>
      <DialogContent className='bg-black'>
        <form className='flex flex-col' onSubmit={handleSubmit(handleSaveClick)}>
          {/* User Role */}
          <div className='flex gap-2'>
            <div className='w-[350px]'>
              <AutoComplete 
                id="user-role-select"
                sx={{ marginTop: "10px"}}
                value={
                  userRolesOptions.find((opt) => opt.value === formData.userRoleId) || null
                }
                onChange={handleUserRoleChange}
                onInputChange={handleInputChange}
                options={userRolesOptions}
                label={t('component.user-permission')}
                labelFontSize="15px"
                freeSolo={true}
                register={register("userRoleName", { 
                  required: false,
                })}
              />
            </div>

            {
              isDefaultPermission ? null : (
                <div className='flex items-end justify-center mb-[-2px]'>
                <IconButton onClick={() => handleDeletePermission()}>
                  <Icon icon={Trash2} size={29} color="#FF0000" />
                </IconButton>
              </div>
              )
            }
          </div>

          {/* Permission Table */}
          <div className='h-[65vh]'>
            <TableContainer 
              component={Paper} 
              className='mt-5'
              sx={{ maxHeight: "63vh", backgroundColor: "transparent" }}
            >
              <Table sx={{ minWidth: 650, backgroundColor: "#48494B"}}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#242727", position: "sticky", top: 0, zIndex: 1 }}>
                    <TableCell align="center" sx={{ color: "#FFFFFF", width: "75%" }}>{t('table.column.active-menu')}</TableCell>
                    <TableCell align="center" sx={{ color: "#FFFFFF", width: "15%" }}>{t('table.column.access-right')}</TableCell>
                    <TableCell align="center" sx={{ color: "#FFFFFF", width: "10%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 0, padding: "0px" }}>
                      {
                        isCenter ? (
                          <>
                            {/* Center Permission */}
                            <Accordion
                              expanded={isAccordionCenterOpen}
                              onChange={() => setIsAccordionCenterOpen(!isAccordionCenterOpen)}
                              sx={{
                                "&.MuiAccordion-root" : {
                                  "&.Mui-expanded" : {
                                    margin: "1px 0px",
                                  }
                                }
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<KeyboardArrowUp sx={{ fontSize: "28px", color: "black"}} />}
                                sx={{
                                  backgroundColor: "#CCD0CF",
                                  flexDirection: "row-reverse",
                                  gap: "10px"
                                }}
                                id="center-permission-part"
                              >
                                <Typography component="span" style={{ color: "black", fontWeight: 500 }}>
                                  {t('accordion-summary.center')}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ padding: 0 }}>
                                <Table>
                                  <TableBody>
                                    {centerKeys.map((key) => (
                                      <TableRow
                                        key={`center-permission-${key}`}
                                        sx={{ '& td, & th': { borderBottom: '1px dashed #D9D9D9' } }}
                                      >
                                        <TableCell
                                          align="center"
                                          sx={{
                                            backgroundColor: "#393B3A",
                                            color: "#FFFFFF",
                                            paddingLeft: "50px",
                                            textAlign: "left",
                                            width: "75%"
                                          }}
                                        >
                                          {DEFAULT_CENTER_PERMISSION_NAME[key].name}
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{
                                            backgroundColor: "#48494B",
                                            color: "#FFFFFF",
                                            padding: "0px",
                                            width: "5%"
                                          }}
                                        >
                                          <Checkbox
                                            sx={{
                                              color: "#FFFFFF",
                                              "&.Mui-checked": { color: "#FFFFFF" },
                                              "& .MuiSvgIcon-root": { fontSize: 30 }
                                            }}
                                            checked={formData.center[key]?.select || false}
                                            onChange={(e) => handleStatusCenterChange(e, key)}
                                          />
                                        </TableCell>
                                        <TableCell
                                          sx={{ backgroundColor: "#393B3A", padding: "0px", width: "14%" }}
                                        />
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionDetails>
                            </Accordion>
                          </>
                        ) : (
                          <>
                            {/* Checkpoint Permission */}
                            <Accordion
                              expanded={isAccordionCheckpointOpen}
                              onChange={() => setIsAccordionCheckpointOpen(!isAccordionCheckpointOpen)}
                              sx={{
                                "&.MuiAccordion-root" : {
                                  "&.Mui-expanded" : {
                                    margin: "1px 0px",
                                  }
                                }
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<KeyboardArrowUp sx={{ fontSize: "28px", color: "black"}} />}
                                sx={{
                                  backgroundColor: "#CCD0CF",
                                  flexDirection: "row-reverse",
                                  gap: "10px"
                                }}
                                id="center-permission-part"
                              >
                                <Typography component="span" style={{ color: "black", fontWeight: 500 }}>
                                  {t('accordion-summary.checkpoint')}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ padding: 0 }}>
                                <Table>
                                  <TableBody>
                                    {checkpointKeys.map((key) => (
                                      <TableRow
                                        key={`checkpoint-permission-${key}`}
                                        sx={{ '& td, & th': { borderBottom: '1px dashed #D9D9D9' } }}
                                      >
                                        <TableCell
                                          align="center"
                                          sx={{
                                            backgroundColor: "#393B3A",
                                            color: "#FFFFFF",
                                            paddingLeft: "50px",
                                            textAlign: "left",
                                            width: "75%"
                                          }}
                                        >
                                          {DEFAULT_CHECKPOINT_PERMISSION_NAME[key].name}
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{
                                            backgroundColor: "#48494B",
                                            color: "#FFFFFF",
                                            padding: "0px",
                                            width: "5%"
                                          }}
                                        >
                                          <Checkbox
                                            sx={{
                                              color: "#FFFFFF",
                                              "&.Mui-checked": { color: "#FFFFFF" },
                                              "& .MuiSvgIcon-root": { fontSize: 30 }
                                            }}
                                            checked={formData.checkpoint[key]?.select || false}
                                            onChange={(e) => handleStatusCheckpointChange(e, key)}
                                          />
                                        </TableCell>
                                        <TableCell
                                          sx={{ backgroundColor: "#393B3A", padding: "0px", width: "14%" }}
                                        />
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionDetails>
                            </Accordion>
                          </>
                        )
                      }
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Button Part */}
          <div className='flex justify-end mt-5 gap-2'>
            <Button
              type="submit"
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
};

export default ManagePermission;
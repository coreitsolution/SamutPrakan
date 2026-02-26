import React from "react";

// MUI
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";

// i18n
import { useTranslation } from "react-i18next";

// Types
import { Camera } from "../../../features/types";

// Icons
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { Icon } from "../../icons/Icon";

// Utils
import { PopupMessage } from '../../../utils/popupMessage';

type RealtimeSettingProps = {
  open: boolean;
  onClose: () => void;
  cameraList: Camera[];
  playingCameraList: Camera[];
  setNewPlayCameraList: (cameras: Camera[]) => void;
  cameraLimit: number;
};

const RealtimeSetting: React.FC<RealtimeSettingProps> = ({
  open,
  onClose,
  cameraList,
  playingCameraList,
  setNewPlayCameraList,
  cameraLimit,
}) => {
  // i18n
  const { t } = useTranslation();

  // Data
  const [left, setLeft] = React.useState<Camera[]>(cameraList);
  const [right, setRight] = React.useState<Camera[]>(playingCameraList);
  const [leftChecked, setLeftChecked] = React.useState<Camera[]>([]);
  const [rightChecked, setRightChecked] = React.useState<Camera[]>([]);
  const [selected, setSelected] = React.useState<Camera | null>(null);

  const canAddToRight = (count: number) => right.length + count <= cameraLimit;

  const handleClose = (isConfirm: boolean) => {
    if (isConfirm) {
      if (right.length === 0) {
        PopupMessage(t('message.error.must-select-at-least-one-camera'), "", "error");
        return;
      }

      setNewPlayCameraList(
        right.map((prev) => ({
          ...prev,
          is_selected: true,
        }))
      );
    }
    onClose();
  };

  const toggleChecked = (camera: Camera, isLeft: boolean) => {
    if (isLeft) {
      setLeftChecked((prev) =>
        prev.some((c) => c.uid === camera.uid)
          ? prev.filter((c) => c.uid !== camera.uid)
          : [...prev, camera]
      );
    } 
    else {
      setRightChecked((prev) =>
        prev.some((c) => c.uid === camera.uid)
          ? prev.filter((c) => c.uid !== camera.uid)
          : [...prev, camera]
      );
    };
  };

  const moveRight = () => {
    const toMove = leftChecked.filter((c) =>
      left.some((l) => l.uid === c.uid)
    );
    if (!toMove.length) return;

    if (!canAddToRight(toMove.length)) {
      PopupMessage(t('message.info.camera-limit-exceeded'), "", "info");
      return;
    }

    setLeft((prev) => prev.filter((c) => !toMove.some(m => m.uid === c.uid)));
    setRight((prev) => [...prev, ...toMove]);
    setLeftChecked([]);
  };

  const moveAllRight = () => {
    if (!canAddToRight(left.length)) {
      PopupMessage(t('message.info.camera-limit-exceeded'), "", "info");
      return;
    }

    setRight((prev) => [...prev, ...left]);
    setLeft([]);
    setLeftChecked([]);
  };

  const moveAllLeft = () => {
    setRight((prev) => prev.filter((c) => !right.includes(c)));
    setLeft((prev) => [...prev, ...right]);
    setRightChecked([]);
  };

  const moveLeft = () => {
    const toMove = rightChecked.filter((c) =>
      right.some((r) => r.uid === c.uid)
    );
    if (!toMove.length) return;

    setRight((prev) => prev.filter((c) => !toMove.includes(c)));
    setLeft((prev) => [...prev, ...toMove]);
    setRightChecked([]);
  };

  const moveUp = () => {
    if (!selected) return;
    const index = right.findIndex((c) => c.uid === selected.uid);
    if (index <= 0) return;

    const next = [...right];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRight(next);
  };

  const moveDown = () => {
    if (!selected) return;
    const index = right.findIndex((c) => c.uid === selected.uid);
    if (index === -1 || index === right.length - 1) return;

    const next = [...right];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setRight(next);
  };

  const renderList = (items: Camera[], isLeft: boolean) => (
    <div className="flex flex-col justify-center items-center gap-2">
      <label>{isLeft ? t("text.camera-list") : t("text.select-camera-list")}</label>
      <Paper sx={{ width: 240, height: 300, overflow: "auto" }}>
        <List dense>
          {items.map((item) => {
            const isChecked = isLeft ? leftChecked.some((c) => c.uid === item.uid) : rightChecked.some((c) => c.uid === item.uid);
            const isSelected = selected?.uid === item.uid;

            return (
              <ListItemButton
                key={item.uid}
                selected={!isLeft && isSelected}
                onClick={() => {
                  if (isLeft) {
                    toggleChecked(item, isLeft);
                  } 
                  else {
                    setSelected(item);
                  }
                }}
                sx={{
                  backgroundColor: item.is_selected ? "#BCBCBC" : ""
                }}
              >
                <Checkbox
                  edge="start"
                  checked={isChecked}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChecked(item, isLeft);
                  }}
                />
                <ListItemText 
                  primary={item.camera_name} 
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>
    </div>
  );

  return (
    <Dialog
      open={open}
      maxWidth="xl"
    >
      <DialogTitle className="bg-black">
        <Typography variant="h5" color="white" className="font-bold">
          {t("screen.realtime-setting.title")}
        </Typography>
      </DialogTitle>

      <DialogContent className="bg-black text-white">
        <div className="flex flex-col w-full gap-4">
          <div className="p-4 border border-[#2B9BED]">
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid>{renderList(left, true)}</Grid>

              <Grid>
                <Grid container direction="column" gap={1}>
                  <IconButton 
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveAllRight}
                    disabled={right.length + left.length > cameraLimit}
                  >
                    <Icon icon={ChevronsRight} color="#fff" />
                  </IconButton>
                  <IconButton 
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveRight}
                    disabled={
                      leftChecked.length === 0 ||
                      right.length + leftChecked.length > cameraLimit
                    }
                  >
                    <Icon icon={ChevronRight} color="#fff" />
                  </IconButton>
                  <IconButton 
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveLeft}
                    disabled={rightChecked.length === 0}
                  >
                    <Icon icon={ChevronLeft} color="#fff" />
                  </IconButton>
                  <IconButton 
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveAllLeft}
                  >
                    <Icon icon={ChevronsLeft} color="#fff" />
                  </IconButton>
                </Grid>
              </Grid>

              <Grid>{renderList(right, false)}</Grid>

              <Grid>
                <Grid container direction="column" gap={1}>
                  <IconButton
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveUp}
                    disabled={!selected || !right.some((r) => r.uid === selected.uid)}
                  >
                    <Icon icon={ChevronUp} color="#fff" />
                  </IconButton>
                  <IconButton
                    className="list-item-btn"
                    sx={{
                      borderRadius: "4px"
                    }}
                    onClick={moveDown}
                    disabled={!selected || !right.some((r) => r.uid === selected.uid)}
                  >
                    <Icon icon={ChevronDown} color="#fff" />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="text"
              className="cancel-btn"
              sx={{ width: '100px', height: '40px', '& .MuiSvgIcon-root': { fontSize: 20 } }}
              onClick={() => handleClose(false)}
            >
              {t('button.cancel')}
            </Button>

            <Button
              variant="contained"
              className="primary-btn"
              sx={{ width: '100px', height: '40px', '& .MuiSvgIcon-root': { fontSize: 20 } }}
              onClick={() => handleClose(true)}
              disabled={right.length === 0}
            >
              {t('button.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealtimeSetting;

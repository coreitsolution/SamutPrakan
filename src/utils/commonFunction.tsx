import bcrypt from 'bcryptjs';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Types
import { Option } from '../features/types';

dayjs.extend(utc);

// Constants
const SALT_ROUNDS = 10;

export const reformatString = (input: string): string => {
  if (!input) return "";

  return input
    .split('_') // Split the string by underscores
    .map(word => 
        word
            .split('-') // Split the string by hyphens
            .map(subWord => 
                /^[A-Z]+$/.test(subWord) ? subWord : subWord.charAt(0).toUpperCase() + subWord.slice(1).toLowerCase()
            )
            .join('-') // Rejoin the hyphenated parts
    )
    .join(' ') // Rejoin the parts with spaces
}

export const formatThaiID = (value: string) => {
  return value.replace(
    /(\d{1})(\d{0,4})?(\d{0,5})?(\d{0,2})?(\d{0,1})?/,
    (_, p1, p2, p3, p4, p5) => [p1, p2, p3, p4, p5].filter(Boolean).join('-')
  )
}

export const formatNumber = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price)
}

export const formatPhone = (value: string) => {
  return value.replace(
    /(\d{0,3})?(\d{0,3})?(\d{0,4})?/,
    (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-')
  )
}

export const isEquals = (a: any, b: any) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

export const isNumber = (value: string) => {
  return /^[0-9]*$/.test(value)
}

export const getFileNameWithoutExtension = (filePath: string): string => {
  const fileName = filePath.split('/').pop()?.split('\\').pop() || ""
  return fileName.split('.').slice(0, -1).join('.') || fileName 
}

export const makeRandomText = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => 
    characters[Math.floor(Math.random() * characters.length)]
  ).join('');
};

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hashed;
};

export const getId = (val: number | Option) => {
  return typeof val === "number" ? val : val.value;
};

export const getStringId = (val: string | Option) => {
  return typeof val === "string" ? val : val.value;
};

export const isStringMatch = (base: string, newString: string) => {
  if (!newString || !base) return false;

  // Except for "*"
  const escaped = base.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
  // Replace "*" with ".*" for matching
  const pattern = '^' + escaped.replace(/\*/g, '.*') + '$';
  const regex = new RegExp(pattern);

  return regex.test(newString);
};

export const getPlateTypeColor = (typeName: string) => {
  let color = "white";
  let backgroundColor = "white";
  let pinBackgroundColor = "black";
  let feedBackgroundColor = "#161817";
  let textShadow = "";
  let title = "";
  let showAlert = false;

  switch (typeName.toLowerCase()) {
    case "normal":
      title = "Normal";
      break;
    case "guest":
      title = "Guest";
      break;
    case "member":
      color = "white";
      backgroundColor = "#0099ff";
      pinBackgroundColor = "#0099ff";
      feedBackgroundColor = "#0099ff";
      title = "Member";
      showAlert = true;
      break;
    case "vip":
      color = "white";
      backgroundColor = "#009900";
      pinBackgroundColor = "#009900";
      feedBackgroundColor = "#009900";
      title = "VIP";
      showAlert = true;
      break;
    case "blacklist":
      color = "white";
      backgroundColor = "#FF0000";
      pinBackgroundColor = "#FF0000";
      feedBackgroundColor = "#FF0000";
      title = "BlackList";
      textShadow = "2px 0 #fff, -2px 0 #fff, 0 2px #fff, 0 -2px #fff, 1px 1px #fff, -1px -1px #fff, 1px -1px #fff, -1px 1px #fff";
      showAlert = true;
      break;
    case "watchList":
      color = "white";
      backgroundColor = "#FDB600";
      pinBackgroundColor = "#FDB600";
      feedBackgroundColor = "#FDB600";
      title = "WatchList";
      showAlert = true;
      break;
    default:
      color = "white";
      backgroundColor = "white";
      pinBackgroundColor = "black";
      feedBackgroundColor = "#161817";
      title = "";
      break;
  }
  return { color, backgroundColor, feedBackgroundColor, pinBackgroundColor, title, showAlert, textShadow }
}

export const getPersonTypeColor = (plateType: number | null) => {
  let color = "white";
  let backgroundColor = "";

  switch (plateType) {
    case 3:
      color = "white";
      backgroundColor = "#0099ff";
      break;
    case 4:
      color = "white";
      backgroundColor = "#009900";
      break;
    case 6:
      color = "white";
      backgroundColor = "#E5252A";
      break;
    case 7:
      color = "white";
      backgroundColor = "#FDCC0A";
      break;
    default:
      color = "white";
      backgroundColor = "white";
      break;
  }
  return { color, backgroundColor }
}

export const getImageFormat = (src: string) => {
  if (src.startsWith("data:image/png")) return "PNG";
  if (src.startsWith("data:image/jpeg") || src.startsWith("data:image/jpg")) return "JPEG";
  return "JPEG";
};

export const loadFont = async (fontPath: string): Promise<string> => {
  const response = await fetch(fontPath);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

export const showToast = (Component: any, data: any, theme: 'light' | 'dark', toastId: string, style?: React.CSSProperties) => {
  toast((props) => (
    <Component {...props} data={{ ...data, toastId }} />
  ), {
    autoClose: false,
    closeOnClick: false,
    draggable: false,
    theme,
    containerId: "notification-list-toast",
    toastId,
    style,
  });

  return toastId;
};

export const parseExcelDate = (dateValue: any) => {
  if (!dateValue) {
    return ""
  }
  if (typeof dateValue === "number") {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const correctedYear = year >= 2500 ? year - 543 : year;

    return `${correctedYear}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    let year = dateValue.getFullYear();
    if (year >= 2500) year -= 543;

    return `${year}-${String(dateValue.getMonth() + 1).padStart(2, "0")}-${String(dateValue.getDate()).padStart(2, "0")}`;
  }

  if (typeof dateValue === "string" && dateValue.includes("T")) {
    const date = new Date(dateValue);

    let year = date.getFullYear();
    if (year >= 2500) year -= 543;

    return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  if (typeof dateValue === "string") {
    const clean = dateValue.trim().replace(/[-.]/g, "/");

    const parts = clean.split("/");
    if (parts.length !== 3) return "";

    let [day, month, year] = parts;

    if (!day || !month || !year) return "";

    let numericYear = parseInt(year, 10);

    if (numericYear >= 2500) numericYear -= 543;

    return `${numericYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
}

export const isValidNationId = (id: string) => {
  if (!/^\d{13}$/.test(id)) {
    return false;
  }
  return true;
}

export const downloadFile = (fileName: string, url: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const getFilesDiff = (newArray: any[], oldFileArray: any[]) => {
  const currentURLs = newArray.map(data => data.url);
  const oldURLs = oldFileArray.map(data => data.url);

  // Find removed: in old but not in current
  const removed = oldFileArray.filter(data => !currentURLs.includes(data.url));

  // Find added: in current but not in old
  const added = newArray.filter(data => !oldURLs.includes(data.url));

  return { added, removed };
};

export const getWeekday = (dateString: string, i18n: any) => {
  const date = dayjs.utc(dateString);

  const day = date.get('day');
  const weekdaysEng = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
  const weekdaysTh = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  return i18n.language === "th" ? weekdaysTh[day] : weekdaysEng[day];
};


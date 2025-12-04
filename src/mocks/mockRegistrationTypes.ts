import { RegistrationTypesDetail, RegistrationTypes } from "../features/dropdown/dropdownTypes";
export const registrationTypesData: RegistrationTypesDetail[] = [
  {
    "id": 3,
    "title_en": "Blacklist",
    "title_th": "บุคคลเฝ้าระวัง",
    "visible": true,
    "active": true,
  },
  {
    "id": 2,
    "title_en": "Member",
    "title_th": "สมาชิก",
    "visible": true,
    "active": true,
  },
  {
    "id": 1,
    "title_en": "VIP",
    "title_th": "บุคคลสำคัญ",
    "visible": true,
    "active": true,
  }
];

export const registrationTypes: RegistrationTypes = 
  {
    data: registrationTypesData
  };


import { SuspectPeople } from "../features/types";

export const mockSuspectPeople: SuspectPeople[] = [
  {
    id: 1,
    title_id: 1,
    firstname: "สมหมาย",
    lastname: "หมายสม",
    idcard_number: "1234567890123",
    address: "123 หมู่ 5 ต.บางเขน อ.เมือง",
    province_code: "10",
    district_code: "101",
    subdistrict_code: "10101",
    zipcode: "10210",
    person_class_id: 1,
    case_number: "CASE12345",
    arrest_warrant_date: "2025-01-01",
    arrest_warrant_expire_date: "2025-12-31",
    behavior: "ลักลอบขนสินค้าเถื่อน",
    case_owner_name: "พ.ต.อ. สมชาย จงรักษ์",
    case_owner_phone: "0812345678",
    watchlist_images: [{
      "id": 1,
      "watchlist_id": 1,
      "title": "example string",
      "url": "example string",
      "notes": "example string",
      "created_at": "2024-06-07T12:34:56",
      "updated_at": "2024-06-07T12:34:56"
    }],
    watchlist_files: [
      {
        "id": 1,
        "watchlist_id": 1,
        "title": "example string",
        "url": "example string",
        "notes": "example string",
        "created_at": "2024-06-07T12:34:56",
        "updated_at": "2024-06-07T12:34:56"
      },
    ],
    visible: true,
    active: true,
    notes: "",
    createdAt: "2025-01-01T08:00:00Z",
    updatedAt: "2025-01-01T08:00:00Z",
  },
];
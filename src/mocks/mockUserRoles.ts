// Types
import { UserRole } from "../features/dropdown/dropdownTypes";

export const mockUserRoles: UserRole[] = [
  {
    id: 1,
    user_role: "ADMIN",
    active: true,
  },
  {
    id: 2,
    user_role: "USER",
    active: true,
  },
  {
    id: 3,
    user_role: "GUEST",
    active: false,
  },
];

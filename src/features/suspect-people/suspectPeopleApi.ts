// Config
import { getUrls } from '../../config/runtimeConfig';
import { isDevEnv } from "../../config/environment";

// Utils
import { fetchClient, combineURL } from "../../utils/fetchClient"

// Types
import {
  SuspectPeopleResponse,
} from "../types";

// Mocks
import { mockSuspectPeople } from "../../mocks/mockSuspectPeople";

const statusCode = 200;
const status = "Successful";
const success = true;
const message = "OK with data";
const pagination = {
    "page": 1,
    "maxPage": 8,
    "limit": 10,
    "count": 10,
    "countAll": 79
};

export const fetchSuspectPeople = async (param?: Record<string, string>): Promise<SuspectPeopleResponse> => {
  const { CENTER_API } = getUrls();
  if (isDevEnv) {
    const data = {
      statusCode,
      status,
      success,
      message,
      pagination,
      data: mockSuspectPeople
    }
    return Promise.resolve(data);
  }
  return await fetchClient<SuspectPeopleResponse>(combineURL(CENTER_API, "/watchlist/get"), {
    method: "GET",
    queryParams: param,
  });
};

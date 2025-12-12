// Components
import Image from '../image/Image';

// Types
import {
  RealTimeLprData,
} from "../../features/types";

// Config
import { getUrls } from '../../config/runtimeConfig';

interface FeedImagesProps {
  data: RealTimeLprData;
}

const FeedImages: React.FC<FeedImagesProps> = ({ data }) => {
  const { CENTER_FILE_URL } = getUrls();
  return (
    <div className="grid grid-cols-2">
      <Image
        imageSrc={data.detect_type === "vehicle"
          ? `${CENTER_FILE_URL}${data.vehicle_image_url}`
          : `${CENTER_FILE_URL}${data.suspect_person_detect_image}`
        }
        imageAlt={data.detect_type === "vehicle" ? "Vehicle" : "Detect Person"}
        className='h-[130px] w-full'
      />

      <Image
        imageSrc={data.detect_type === "vehicle"
          ? `${CENTER_FILE_URL}${data.plate_image_url}`
          : `${CENTER_FILE_URL}${data.suspect_person_image}`
        }
        imageAlt={data.detect_type === "vehicle" ? "Plate" : "Person"}
        className='h-1/2 w-full'
      />
    </div>
  )
};

export default FeedImages;
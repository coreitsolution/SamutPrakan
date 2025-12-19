// Components
import Image from '../image/Image';

// Config
import { getUrls } from '../../config/runtimeConfig';

interface FeedImagesProps {
  image1: string;
  image1Alt: string;
  image2: string;
  image2Alt: string;
}

const FeedImages: React.FC<FeedImagesProps> = ({ 
  image1, 
  image1Alt, 
  image2, 
  image2Alt 
}) => {
  const { CENTER_FILE_URL } = getUrls();
  return (
    <div className="grid grid-cols-2">
      <Image
        imageSrc={`${CENTER_FILE_URL}${image1}`}
        imageAlt={image1Alt}
        className='h-[130px] w-full'
      />

      <Image
        imageSrc={`${CENTER_FILE_URL}${image2}`}
        imageAlt={image2Alt}
        className='h-1/2 w-full'
      />
    </div>
  )
};

export default FeedImages;
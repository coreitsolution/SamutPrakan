import React, {useState, useCallback, useEffect} from 'react'
import { Map as LeafletMap } from 'leaflet';

// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Components
import BaseMap from '../../components/base-map/BaseMap';

// Hooks
import { useMapSearch } from "../../hooks/useOpenStreetMapSearch";

interface UserLocationProps {
  open: boolean;
  onClose: () => void;
  lat: string;
  lng: string;
  title: string;
}

const UserLocation: React.FC<UserLocationProps> = ({open, onClose, lat, lng, title}) => {
  // Data
  const [map, setMap] = useState<LeafletMap | null>(null);

  const {
    searchPlace,
    clearSearchPlaces,
  } = useMapSearch(map);

  useEffect(() => {
    if (map) {
      clearSearchPlaces();
      const latLng = `${lat}, ${lng}`;
      searchPlace(latLng, "#9F0C0C", true);
    }
  }, [map]);

  const handleMapLoad = useCallback((mapInstance: LeafletMap | null) => {
    setMap(mapInstance)
  }, []);

  return (
    <Dialog id='user-location' open={open} maxWidth="lg" fullWidth>
      <DialogTitle className='bg-black'>
        {/* Header */}
        <Typography variant="h5" component="div" color="white" className="font-bold">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent className='bg-black'>
        {/* Map Part */}
        <div className='relative h-[65vh] w-full border border-[#2B9BED]'>
          <BaseMap 
            onMapLoad={handleMapLoad}
            zoomControl={true}
            currentLocation={true}
          />
        </div>
        <div className='flex justify-end pt-4'>
          <Button
            variant="text"
            className="secondary-checkpoint-search-btn"
            sx={{
              width: "100px",
              height: "40px",
              '& .MuiSvgIcon-root': { 
                fontSize: 20
              } 
            }}
            onClick={onClose}
          >
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UserLocation;
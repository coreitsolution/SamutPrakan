import { useState, useCallback, useEffect } from 'react';
import L, { Map as LeafletMap, LatLngBounds, Polyline } from 'leaflet';
import polyline from '@mapbox/polyline';

// Types
import { SearchMapResult } from '../features/types';

// Utils
import { parseCoordinates, parseCoordinatesWith2Param } from '../utils/coordinates';

// Hooks
import { useMarkerManager } from './useMarkerManager';

// Config
import { getUrls } from '../config/runtimeConfig';

// Constants
import { MAP_PIN_ICON_COLOR } from '../constants/map';
const COUNT_OVER = 1000;

export const useMapSearch = (map: LeafletMap | null, ableToClick = false) => {
  const [searchResults, setSearchResults] = useState<SearchMapResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const markerManager = useMarkerManager(map);
  const [routes, setRoutes] = useState<Polyline[]>([]);

  const clearRoutes = () => {
    routes.forEach((route) => map?.removeLayer(route));
    setRoutes([]);
  };

  const clearSearchPlaces = async () => {
    setSearchResults([]);
    await markerManager.clearMarkers();
  }

  const clearPlaceMarkerWithLocation = async (location: { lat: number, lng: number }) => {
    await markerManager.clearMarkerByLocation(location);
  }

  const searchPlace = useCallback(async (query: string, iconColor: string = "#FDCC0A", isLocationWithLabel: boolean = false) => {
    setSearchResults([])
    if (!map) return
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      // First check if input is coordinates
      const coordinates = parseCoordinates(query)
      if (coordinates) {
        const result: SearchMapResult = {
          name: `${coordinates.lat}, ${coordinates.lng}`,
          location: coordinates
        }
        setSearchResults([result])
        map.setZoom(18)
        map.panTo(coordinates)
        await markerManager.createMarker(coordinates, iconColor, isLocationWithLabel)
        return
      }
    } 
    catch (error) {
      setSearchError('Error searching for place')
      setSearchResults([])
    } 
    finally {
      setIsSearching(false)
    }
  }, [map, markerManager]);

  const showCountInMap = useCallback(async (list: { lat: string; lon: string, count: number }[], count_over?: number) => {
    setSearchResults([])
    if (!map) return
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      markerManager.clearMarkers(); // Clear existing markers

      const bounds = new LatLngBounds([]);

      for (const item of list) {
        const coordinate = parseCoordinatesWith2Param(item.lat, item.lon);

        if (!coordinate) continue;

        const countOver = count_over ?? COUNT_OVER;

        const isOver = item.count >= countOver;
        const color1 = isOver ? "rgba(254,190,67,1)" : "rgba(249,191,192,1)";
        const color2 = isOver ? "rgba(253,204,10,1)" : "rgba(255,235,238,1)";

        await markerManager.createCountLabel(coordinate, item.count, color1, color2);
        bounds.extend(coordinate);
      }

      if (!bounds.isValid()) {
        map.fitBounds(bounds);
      }
    } 
    catch (error) {
      setSearchError('Error show count on map')
      setSearchResults([])
    } 
    finally {
      setIsSearching(false)
    }
  }, [map, markerManager]);

  const showCameraStatusInMap = useCallback(async (list: { lat: string; lon: string, status: number }[]) => {
    setSearchResults([])
    if (!map) return
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      markerManager.clearMarkers(); // Clear existing markers

      const bounds = new LatLngBounds([]);

      for (const item of list) {
        const coordinate = parseCoordinatesWith2Param(item.lat, item.lon);

        if (!coordinate) continue;

        let color = "";
        switch (item.status) {
          case 1:
            color = "#4CB64C";
            break
          case 2:
            color = "linear-gradient(90deg, rgba(254,190,67,1) 0%, rgba(253,204,10,1) 100%)";
            break
          case 3:
            color = "#DD2025";
            break
          default:
            color = "#FFFFFF";
            break
        }

        await markerManager.createCameraStatus(coordinate, color);
        bounds.extend(coordinate);
      }

      if (!bounds.isValid()) {
        map.fitBounds(bounds);
      }
    } 
    catch (error) {
      setSearchError('Error show count on map')
      setSearchResults([])
    } 
    finally {
      setIsSearching(false)
    }
  }, [map, markerManager]);

  const drawRoute = useCallback(
    async (
      routesData: { id: string; routeList: { lat: string; lon: string }[] }[]
    ) => {
      const { VITE_OSRM_URL } = getUrls();
      setSearchResults([]);
      if (!map) return;

      setIsSearching(true);
      setSearchError(null);

      try {
        await clearRoutes();
        await markerManager.clearMarkers();

        const newRoutes: Polyline[] = [];
        const allPoints = new LatLngBounds([]);
        let totalPoints = 0;

        for (let i = 0; i < routesData.length; i++) {
          const rawCoordinates: [number, number][] = routesData[i].routeList
            .map((p) => {
              const coord = parseCoordinatesWith2Param(p.lat, p.lon);
              return coord ? [coord.lat, coord.lng] : null;
            })
            .filter((c): c is [number, number] => c !== null);

          const color = MAP_PIN_ICON_COLOR[i % MAP_PIN_ICON_COLOR.length].color;

          // Create markers
          for (let j = 0; j < rawCoordinates.length; j++) {
            const [lat, lng] = rawCoordinates[j];

            let label = "";
            if (rawCoordinates.length > 1) label = `Route ${i + 1} (${j})`;

            await markerManager.createMarker(
              { lat, lng },
              color,
              false,
              label
            );

            allPoints.extend([lat, lng]);
            totalPoints++;
          }

          if (rawCoordinates.length > 1) {
            const coordsStr = rawCoordinates
              .map((c) => `${c[1]},${c[0]}`)
              .join(";");

            const url = `${VITE_OSRM_URL}/route/v1/driving/${coordsStr}?geometries=polyline&overview=full`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.routes?.length > 0) {
              const route = data.routes[0];

              const decoded = polyline.decode(route.geometry) as [
                number,
                number
              ][];

              const leafletCoords: L.LatLngTuple[] = decoded.map(
                ([lat, lng]) => [lat, lng] as L.LatLngTuple
              );

              decoded.forEach(([lat, lng]) => {
                allPoints.extend([lat, lng]);
              });

              const polylineLayer = L.polyline(leafletCoords, {
                color,
                weight: 3,
                opacity: 0.9
              }).addTo(map);

              newRoutes.push(polylineLayer);
            } 
            else {
              console.warn(`No route found for ${routesData[i].id}`);
            }
          }
        }

        setRoutes(newRoutes);

        if (totalPoints === 1) {
          map.setView(allPoints.getCenter(), 17);
        } 
        else if (totalPoints > 1) {
          map.fitBounds(allPoints, { padding: [40, 40] });
        }

      } 
      catch (err) {
        console.error(err);
        setSearchError("Error drawing the route.");
        setSearchResults([]);
      } 
      finally {
        setIsSearching(false);
      }
    },
    [map, markerManager]
  );

  const searchCameras = useCallback(async (query: {location: string, name: string}[], iconColor: string = "#DD2025", isLocationWithLabel: boolean = false) => {
    setSearchResults([])
    if (!map) return
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      const coordinatesList = [];
      const locationList = [];
      const bounds = new LatLngBounds([]);

      for (const q of query) {
        const coordinates = parseCoordinates(q.location)
        if (coordinates) {
          coordinatesList.push(coordinates);
          locationList.push({
            latLng: coordinates,
            name: q.name
          });
          bounds.extend(coordinates);
        }
      }
      
      if (coordinatesList.length > 0) {
        const result: SearchMapResult[] = coordinatesList.map(coordinates => ({
          name: `${coordinates.lat}, ${coordinates.lng}`,
          location: coordinates
        }));
        setSearchResults(result)
        await markerManager.createMarkerWithList(locationList, iconColor, isLocationWithLabel)

        if (bounds.isValid()) {
          if (coordinatesList.length === 1) {
            map.setView(coordinatesList[0], 15);
          } 
          else {
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        }
      }
    } 
    catch (error) {
      setSearchError('Error searching for place')
      setSearchResults([])
    } 
    finally {
      setIsSearching(false)
    }
  }, [map, markerManager]);
  
  const searchPlaceWithCurrentLocation = useCallback(async (query: string, isCurrentLocation = false) => {
    setSearchResults([]);
    if (!map) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const coordinates = parseCoordinates(query);
      if (isCurrentLocation) {
        if (coordinates) {
          const result: SearchMapResult = {
            name: `${coordinates.lat}, ${coordinates.lng}`,
            location: coordinates
          };
          setSearchResults([result]);
          map.setView([coordinates.lat, coordinates.lng], 17);
          markerManager.createMarker(coordinates);
          return;
        }
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.length) {
        setSearchError('No results found');
        return;
      }

      const result = {
        name: data[0].display_name,
        location: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        },
      };

      setSearchResults([result]);
      map.setView([result.location.lat, result.location.lng], 18);
      markerManager.createMarker(result.location);
    } 
    catch (error) {
      setSearchError('Error searching for place');
    } 
    finally {
      setIsSearching(false);
    }
  }, [map, markerManager]);

  const handleClick = useCallback(async (event: L.LeafletMouseEvent) => {
    const location = {
      lat: event.latlng.lat,
      lng: event.latlng.lng,
    };

    const result: SearchMapResult = {
      name: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
      location: location,
    };

    setSearchResults([result]);
    await markerManager.createMarker(location);
  }, [markerManager])

  useEffect(() => {
    if (!map) return;

    if (ableToClick) {
      map.on('click', handleClick);

      return () => {
        map.off('click', handleClick);
      };
    }
  }, [map, ableToClick, handleClick]);

  return {
    searchPlace,
    searchPlaceWithCurrentLocation,
    drawRoute,
    searchResults,
    isSearching,
    searchError,
    showCountInMap,
    showCameraStatusInMap,
    clearSearchPlaces,
    searchCameras,
    clearPlaceMarkerWithLocation,
  }
}
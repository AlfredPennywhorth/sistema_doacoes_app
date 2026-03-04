import * as Location from 'expo-location';
import { getDistance } from 'geolib';

export const requestLocationPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    return location;
};

// Calculates distance in meters between two lat/lon pairs
export const calculateDistance = (userLocation, itemLocation) => {
    if (!userLocation || !itemLocation) return null;
    return getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: itemLocation.latitude, longitude: itemLocation.longitude }
    );
};


// Define the levels for use across the application

// Zone levels for status and alerts

export const ZONE_LEVELS = {
    1: {
        label: 'Clear',
        color: 'emerald',
        hex: '#10b981',
        description: 'Conditions are normal'
    },
    2: {
        label: 'Caution',
        color: 'amber',
        hex: '#f59e0b',
        description: 'Minor issues, proceed with care'
    },
    3: {
        label: 'Warning',
        color: 'orange',
        hex: '#f97316',
        description: 'Significant disruption'
    },
    4: {
        label: 'Danger',
        color: 'red',
        hex: '#ef4444',
        description: 'Life safety threat'
    }
};

// export type ZoneLevelId = keyof typeof ZONE_LEVELS;

// Weather levels for environmental conditions

export const WEATHER_LEVELS = {
    1: {
        name: 'Fair',
        description: 'No action needed.',
        severity: 1, // Green
        icon: 'sun' // You can map these to icons in icons.js
    },
    2: {
        name: 'Inclement',
        description: 'Rain, light snow, or wind; requires caution.',
        severity: 2, // Yellow
        icon: 'cloud-rain'
    },
    3: {
        name: 'Severe',
        description: 'Thunderstorms, heavy snow, or high winds.',
        severity: 3, // Orange
        icon: 'cloud-lightning'
    },
    4: {
        name: 'Extreme',
        description: 'Tornado, Flash Flood, or Life-Threatening.',
        severity: 4, // Red
        icon: 'wind'
    }
};

// export type WeatherLevelId = keyof typeof WEATHER_LEVELS;

// User levels for access control and permissions

export const USER_LEVELS = {
    0: {
        label: 'Unverified',
        description: 'New account, restricted access.',
        power: 0,
        badge: 'bg-slate-100 text-slate-500'
    },
    1: {
        label: 'Verified',
        description: 'Confirmed neighbor; can check-in and chat.',
        power: 1,
        badge: 'bg-emerald-100 text-emerald-700'
    },
    2: {
        label: 'Zone Admin',
        description: 'Can manage status and alerts for zones.',
        power: 2,
        badge: 'bg-blue-100 text-blue-700'
    },
    3: {
        label: 'System Admin',
        description: 'Full system control and user management.',
        power: 3,
        badge: 'bg-purple-100 text-purple-700'
    }
};

// export type UserLevelId = keyof typeof USER_LEVELS;

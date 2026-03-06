import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from '../../shared/constants.ts';

export namespace Dropdowns {

    export const initLevelDropdowns = (): void => {
        const zoneLevelSelect = document.getElementById('zone-level-input') as HTMLSelectElement;
        const userLevelSelect = document.getElementById('user-level-input') as HTMLSelectElement;

        // Populate both dropdowns with USER_LEVELS
        [zoneLevelSelect, userLevelSelect].forEach((select: HTMLSelectElement) => {
            if (select) {
                // Clear existing options
                select.innerHTML = '';

                // Add options from USER_LEVELS constant
                Object.keys(USER_LEVELS).forEach((level: string) => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = `${level} ${USER_LEVELS[parseInt(level) as keyof typeof USER_LEVELS].label}`;
                    select.appendChild(option);
                });
            }
        });
    }

    export const initHazardDropdown = (): void => {
        const hazardSelect = document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement;
        if (!hazardSelect) return;

        hazardSelect.innerHTML = '';

        Object.keys(ZONE_LEVELS).forEach((levelId: string) => {
            const option = document.createElement('option');
            option.value = levelId;
            option.textContent = `${levelId} ${ZONE_LEVELS[parseInt(levelId) as keyof typeof ZONE_LEVELS].label}`;
            hazardSelect.appendChild(option);
        });
    };

    export const initWeatherDropdown = (): void => {
        const weatherSelect = document.getElementById('zone-weather-id-input') as HTMLSelectElement;
        if (!weatherSelect) return;

        weatherSelect.innerHTML = '';

        Object.keys(WEATHER_LEVELS).forEach((weatherId: string) => {
            const option = document.createElement('option');
            option.value = weatherId;
            option.textContent = `${weatherId} ${WEATHER_LEVELS[parseInt(weatherId) as keyof typeof WEATHER_LEVELS].name}`;
            weatherSelect.appendChild(option);
        });
    };

    export const initAnnouncementHazardDropdown = (): void => {
        const hazardSelect = document.getElementById('announcement-hazard-level-input') as HTMLSelectElement;
        if (!hazardSelect) return;

        hazardSelect.innerHTML = '';

        Object.keys(ZONE_LEVELS).forEach((levelId: string) => {
            const option = document.createElement('option');
            option.value = levelId;
            option.textContent = `${ZONE_LEVELS[parseInt(levelId) as keyof typeof ZONE_LEVELS].label}`;
            hazardSelect.appendChild(option);
        });
    };

};
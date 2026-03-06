// Extend Window interface for global functions
// .d.ts files are "Declaration" files. 
// They don't contain logic; they just describe the shape of things.

export { }; // This line is a TS trick to turn this into a module

declare global {
    interface Window {
        toggleAuthMode: (mode: string) => void;
        openProfile: () => Promise<void>;
        toggleTheme: () => void;
        openZone: (tagName: string) => void;
        goHome: () => void;
        openSettings: () => void;
        openMembers: () => Promise<void>;
        toggleHelpFilter: () => void;
        viewCheckInHistory: (userId: number, memberName: string) => Promise<void>;
        openCheckIn: () => void;
        submitCheckIn: (statusType: string) => Promise<void>;
        logout: () => void;
        openAdmin: () => void;
        openAdminSection: (section: string) => Promise<void>;
        updateUserLevel: (userId: number, newLevel: string | number) => Promise<void>;
        openUserEdit: (userId: number) => Promise<void>;
        closeUserEdit: () => void;
        openZoneEdit: (zoneId: number) => Promise<void>;
        closeZoneEdit: () => void;
        clearCurrentAnnouncement: () => Promise<void>;
    }
}



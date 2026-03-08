//src/client/modules/types.ts

// Type Definitions
export interface DashboardData {
    total_online?: number;
    members_count?: number;
    recently_ok?: number;
    help_alerts?: number;
    help_count?: number;
    zone_alerts?: number;
    non_green_count?: number;
    highest_severity?: number;
    announcement?: Announcement;
}

export interface Announcement {
    id: number;
    announcement_text: string;
    hazard_level_id: number;
    created_by_user_id?: number;
    created_by_user_name: string;
    created_at: string;
    is_active: boolean;
    cleared_at?: string;
    cleared_by_user_id?: number;
    cleared_by_user_name?: string;
}

export interface Post {
    id?: number;
    content: string;
    userName: string;
    tagName: string;
    timestamp: string;
}

export interface Tag {
    id: number;
    name: string;
    description?: string;
    hazard_level_id: number;
    access_level?: number;
    unread_count?: number;
    last_viewed_at?: string;
}

export interface User {
    id: number;
    name: string;
    full_name: string;
    email: string;
    phone_number?: string;
    physical_address?: string;
    user_level: number;
    bio?: string;
}

export interface Member extends User {
    timestamp?: string;
    status?: string;
    status_id?: number;
}

export interface CheckIn {
    id: string | number;
    timestamp: string;
    status: string;
    status_id: number;
}

export interface NavigateOptions {
    onNavigate?: () => void | Promise<void>;
}

export interface ViewConfig {
    el: HTMLElement | null;
}
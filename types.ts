
export interface User {
  username: string;
  age: number;
  email?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface SOSAlert {
  id: string;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  distance?: string;
}

export interface SafeExitConfig {
  targetTime: string; // HH:mm format
  contactIds: string[]; // Updated to support multiple contacts
  isActive: boolean;
}

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: Reply[];
  isLiked?: boolean;
}

export interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

export enum AppState {
  AUTH = 'AUTH',
  VERIFICATION = 'VERIFICATION',
  DASHBOARD = 'DASHBOARD',
  COMMUNITY = 'COMMUNITY',
  CONTACTS = 'CONTACTS',
  SOS_ACTIVE = 'SOS_ACTIVE'
}

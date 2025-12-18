export type Role = "admin" | "gerente" | "usuario";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: Role;
  avatar_url?: string;
  terms_accepted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface UserPermission {
  user_id: string;
  permission_id: string;
  created_at?: string;
  permission?: Permission;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  facilities: string[];
  status: "ativo" | "manutencao";
  image_url?: string;
  created_at?: string;
}

export interface RoomBlock {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_by: string;
  created_at?: string;
  room?: Room;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: "confirmado" | "cancelado";
  attendees_count: number;
  created_at?: string;
  user?: Profile;
  room?: Room;
}

export interface Settings {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
  user?: Profile;
}

export interface TimeSlot {
  time: string;
  display: string;
  index: number;
}

export interface BookingBlock {
  booking: Booking;
  startSlot: number;
  endSlot: number;
  duration: number;
}

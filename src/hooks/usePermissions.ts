import { useAuth } from "@/context/AuthContext";

export function usePermissions() {
  const { checkPermission, hasRole, permissions } = useAuth();

  return {
    checkPermission,
    hasRole,
    permissions,
    isAdmin: hasRole("admin"),
    isGerente: hasRole("gerente"),
    isUsuario: hasRole("usuario"),
    canBookRoom: checkPermission("book_room"),
    canViewAllSchedules: checkPermission("view_all_schedules"),
    canCancelOwnBooking: checkPermission("cancel_own_booking"),
    canCancelAnyBooking: checkPermission("cancel_any_booking"),
    canManageRooms: checkPermission("manage_rooms"),
    canBlockRoomMaintenance: checkPermission("block_room_maintenance"),
    canManageUsers: checkPermission("manage_users"),
  };
}


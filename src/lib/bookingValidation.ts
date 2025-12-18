import { addDays, differenceInMinutes, isAfter } from "date-fns";

export async function getSettings(): Promise<Record<string, string>> {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase.from("settings").select("*");

  if (error || !data) {
    return {
      max_booking_duration_hours: "4",
      max_days_ahead: "30",
    };
  }

  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function validateBookingDuration(
  startTime: Date,
  endTime: Date
): Promise<{ valid: boolean; error?: string }> {
  const settings = await getSettings();
  const maxHours = parseInt(settings.max_booking_duration_hours || "4", 10);
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const durationHours = durationMinutes / 60;

  if (durationMinutes <= 0) {
    return {
      valid: false,
      error: "O horário de término deve ser após o horário de início.",
    };
  }

  if (durationHours > maxHours) {
    return {
      valid: false,
      error: `A duração máxima permitida é de ${maxHours} horas.`,
    };
  }

  return { valid: true };
}

export async function validateBookingAdvance(
  startTime: Date
): Promise<{ valid: boolean; error?: string }> {
  const settings = await getSettings();
  const maxDays = parseInt(settings.max_days_ahead || "30", 10);
  const maxDate = addDays(new Date(), maxDays);
  const today = new Date();

  if (isAfter(startTime, maxDate)) {
    return {
      valid: false,
      error: `Você só pode agendar até ${maxDays} dias à frente.`,
    };
  }

  if (startTime < today) {
    return {
      valid: false,
      error: "Não é possível agendar para datas passadas.",
    };
  }

  return { valid: true };
}

export function validateRoomCapacity(
  attendeesCount: number,
  roomCapacity: number
): { valid: boolean; error?: string } {
  if (attendeesCount > roomCapacity) {
    return {
      valid: false,
      error: `A sala suporta no máximo ${roomCapacity} participantes.`,
    };
  }

  if (attendeesCount < 1) {
    return {
      valid: false,
      error: "O número de participantes deve ser pelo menos 1.",
    };
  }

  return { valid: true };
}

export async function validateRoomAvailability(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ valid: boolean; error?: string }> {
  const { supabase } = await import("@/lib/supabase");

  const { data: allBookings, error: bookingError } = await supabase
    .from("bookings")
    .select("id, title, start_time, end_time")
    .eq("room_id", roomId)
    .eq("status", "confirmado");

  if (bookingError) {
    return {
      valid: false,
      error: "Erro ao verificar disponibilidade da sala.",
    };
  }

  if (allBookings && allBookings.length > 0) {
    const conflictingBooking = allBookings.find((booking) => {
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    if (conflictingBooking) {
      return {
        valid: false,
        error: "Este horário já está ocupado por outra reserva.",
      };
    }
  }

  const { data: allBlocks, error: blocksError } = await supabase
    .from("room_blocks")
    .select("*")
    .eq("room_id", roomId);

  if (blocksError) {
    return {
      valid: false,
      error: "Erro ao verificar bloqueios da sala.",
    };
  }

  if (allBlocks && allBlocks.length > 0) {
    const hasBlock = allBlocks.some((block) => {
      const blockStart = new Date(block.start_time);
      const blockEnd = new Date(block.end_time);

      return (
        (startTime >= blockStart && startTime < blockEnd) ||
        (endTime > blockStart && endTime <= blockEnd) ||
        (startTime <= blockStart && endTime >= blockEnd)
      );
    });

    if (hasBlock) {
      return {
        valid: false,
        error: "A sala está bloqueada para manutenção neste período.",
      };
    }
  }

  return { valid: true };
}

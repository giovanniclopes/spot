import { addMinutes, format, parse, startOfDay } from "date-fns";
import type { Booking, TimeSlot, BookingBlock } from "@/types/database";

export const START_TIME = "05:50";
export const END_TIME = "19:00";
const SLOT_DURATION_MINUTES = 10;

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = parse(START_TIME, "HH:mm", new Date());
  const end = parse(END_TIME, "HH:mm", new Date());
  
  let current = start;
  let index = 0;

  while (current <= end) {
    slots.push({
      time: format(current, "HH:mm"),
      display: format(current, "HH:mm"),
      index: index++,
    });
    current = addMinutes(current, SLOT_DURATION_MINUTES);
  }

  return slots;
}

export function normalizeTimeToSlot(time: Date): Date {
  const slots = generateTimeSlots();
  const timeStr = format(time, "HH:mm");
  
  const slot = slots.find((s) => s.time === timeStr);
  if (slot) {
    return parse(slot.time, "HH:mm", time);
  }

  const closestSlot = slots.reduce((prev, curr) => {
    const prevTime = parse(prev.time, "HH:mm", new Date());
    const currTime = parse(curr.time, "HH:mm", new Date());
    const targetTime = parse(timeStr, "HH:mm", new Date());
    
    const prevDiff = Math.abs(prevTime.getTime() - targetTime.getTime());
    const currDiff = Math.abs(currTime.getTime() - targetTime.getTime());
    
    return currDiff < prevDiff ? curr : prev;
  });

  return parse(closestSlot.time, "HH:mm", time);
}

export function getBookingBlocks(
  bookings: Booking[],
  date: Date,
  slots: TimeSlot[]
): BookingBlock[] {
  const blocks: BookingBlock[] = [];

  bookings.forEach((booking) => {
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);

    if (
      format(startTime, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd") &&
      format(endTime, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
    ) {
      return;
    }

    const startSlot = slots.findIndex(
      (s) => s.time === format(startTime, "HH:mm")
    );
    let endSlot = slots.findIndex(
      (s) => s.time === format(endTime, "HH:mm")
    );

    if (startSlot !== -1 && endSlot !== -1) {
      blocks.push({
        booking,
        startSlot,
        endSlot: endSlot + 1,
        duration: endSlot + 1 - startSlot,
      });
    } else if (startSlot !== -1 && endSlot === -1) {
      blocks.push({
        booking,
        startSlot,
        endSlot: slots.length,
        duration: slots.length - startSlot,
      });
    }
  });

  return blocks;
}

export function checkTimeSlotAvailability(
  roomId: string,
  date: Date,
  startSlot: number,
  endSlot: number,
  bookings: Booking[],
  roomBlocks: any[] = []
): boolean {
  const slots = generateTimeSlots();
  const dayStart = startOfDay(date);
  
  const startTime = parse(slots[startSlot].time, "HH:mm", dayStart);
  const endTime = parse(slots[endSlot].time, "HH:mm", dayStart);

  const hasConflict = bookings.some((booking) => {
    if (booking.room_id !== roomId || booking.status !== "confirmado") {
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

  if (hasConflict) return false;

  const hasBlock = roomBlocks.some((block) => {
    if (block.room_id !== roomId) return false;

    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    return (
      (startTime >= blockStart && startTime < blockEnd) ||
      (endTime > blockStart && endTime <= blockEnd) ||
      (startTime <= blockStart && endTime >= blockEnd)
    );
  });

  return !hasBlock;
}

export function getSlotIndex(time: string): number {
  const slots = generateTimeSlots();
  return slots.findIndex((s) => s.time === time);
}

export function getTimeFromSlotIndex(index: number): string {
  const slots = generateTimeSlots();
  return slots[index]?.time || START_TIME;
}


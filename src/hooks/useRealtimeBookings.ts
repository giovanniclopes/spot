import { supabase } from "@/lib/supabase";
import type { Booking } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

export function useRealtimeBookings(
  date: Date,
  onUpdate: (bookings: Booking[]) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const newChannel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `start_time=gte.${dayStart.toISOString()},start_time=lt.${dayEnd.toISOString()}`,
        },
        async (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const { data: booking } = await supabase
              .from("bookings")
              .select("*, user:profiles(*), room:rooms(*)")
              .eq("id", payload.new.id)
              .single();

            if (booking) {
              const { data: allBookings } = await supabase
                .from("bookings")
                .select("*, user:profiles(*), room:rooms(*)")
                .eq("status", "confirmado")
                .gte("start_time", dayStart.toISOString())
                .lt("start_time", dayEnd.toISOString());

              if (allBookings) {
                onUpdateRef.current(allBookings as Booking[]);
              }
            }
          } else if (payload.eventType === "DELETE") {
            const { data: allBookings } = await supabase
              .from("bookings")
              .select("*, user:profiles(*), room:rooms(*)")
              .eq("status", "confirmado")
              .gte("start_time", dayStart.toISOString())
              .lt("start_time", dayEnd.toISOString());

            if (allBookings) {
              onUpdateRef.current(allBookings as Booking[]);
            }
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [date]);

  return channel;
}

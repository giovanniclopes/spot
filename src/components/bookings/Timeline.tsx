import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { supabase } from "@/lib/supabase";
import { generateTimeSlots, getBookingBlocks } from "@/lib/timeline";
import type { Booking, Room, RoomBlock } from "@/types/database";
import { addDays, format, parse, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingForm } from "./BookingForm";

interface TimelineProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export function Timeline({ selectedDate, onDateChange }: TimelineProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [minCapacity, setMinCapacity] = useState<number | "all">("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    roomId: string;
    startSlot: number;
    endSlot: number;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const slots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate);
    }
  }, [currentDate, onDateChange]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dayStart = startOfDay(currentDate);
      const dayEnd = addDays(dayStart, 1);

      const [roomsRes, bookingsRes, blocksRes] = await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .eq("status", "ativo")
          .order("floor", { ascending: true })
          .order("name"),
        supabase
          .from("bookings")
          .select("*, user:profiles(*), room:rooms(*)")
          .eq("status", "confirmado")
          .gte("start_time", dayStart.toISOString())
          .lt("start_time", dayEnd.toISOString()),
        supabase
          .from("room_blocks")
          .select("*, room:rooms(*)")
          .gte("start_time", dayStart.toISOString())
          .lt("start_time", dayEnd.toISOString()),
      ]);

      if (roomsRes.data) setRooms(roomsRes.data as Room[]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      if (blocksRes.data) setRoomBlocks(blocksRes.data as RoomBlock[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRealtimeUpdate = useCallback((updatedBookings: Booking[]) => {
    setBookings(updatedBookings);
  }, []);

  useRealtimeBookings(currentDate, handleRealtimeUpdate);

  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    if (selectedFloor !== "all") {
      filtered = filtered.filter((room) => room.floor === selectedFloor);
    }

    if (minCapacity !== "all") {
      filtered = filtered.filter((room) => room.capacity >= minCapacity);
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter((room) => {
        const roomBookingBlocks = getBookingBlocks(
          bookings.filter((b) => b.room_id === room.id),
          currentDate,
          slots
        );
        const roomBlocksForRoom = roomBlocks.filter(
          (rb) => rb.room_id === room.id
        );

        return slots.some((slot) => {
          const hasBooking = roomBookingBlocks.some(
            (b) => b.startSlot <= slot.index && b.endSlot > slot.index
          );

          const hasBlock = roomBlocksForRoom.some((block) => {
            const blockStart = new Date(block.start_time);
            const blockEnd = new Date(block.end_time);
            if (
              format(blockStart, "yyyy-MM-dd") !==
              format(currentDate, "yyyy-MM-dd")
            )
              return false;
            const slotTime = parse(slot.time, "HH:mm", currentDate);
            const blockStartTime = parse(
              format(blockStart, "HH:mm"),
              "HH:mm",
              currentDate
            );
            const blockEndTime = parse(
              format(blockEnd, "HH:mm"),
              "HH:mm",
              currentDate
            );
            return slotTime >= blockStartTime && slotTime < blockEndTime;
          });

          return !hasBooking && !hasBlock;
        });
      });
    }

    return filtered;
  }, [
    rooms,
    selectedFloor,
    minCapacity,
    showOnlyAvailable,
    bookings,
    roomBlocks,
    currentDate,
    slots,
  ]);

  const handleSlotClick = (roomId: string, slotIndex: number) => {
    setSelectedSlot({ roomId, startSlot: slotIndex, endSlot: slotIndex + 1 });
  };

  const handlePreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass sticky top-16 z-40 -mx-4 px-4 py-4 rounded-xl border shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              className="hover:shadow-soft transition-all shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 border border-brand-accent/20 rounded-lg shadow-sm flex-1 justify-center">
              <Calendar className="h-5 w-5 text-brand-primary shrink-0" />
              <span className="font-semibold text-sm sm:text-base text-center">
                {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="hover:shadow-soft transition-all shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              value={String(selectedFloor)}
              onValueChange={(v) =>
                setSelectedFloor(v === "all" ? "all" : parseInt(v))
              }
            >
              <SelectTrigger className="w-full shadow-sm">
                <SelectValue placeholder="Filtrar por andar" />
              </SelectTrigger>
              <SelectContent className="shadow-medium">
                <SelectItem value="all">Todos os andares</SelectItem>
                <SelectItem value="0">Térreo</SelectItem>
                <SelectItem value="1">1º Andar</SelectItem>
                <SelectItem value="2">2º Andar</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(minCapacity)}
              onValueChange={(v) =>
                setMinCapacity(v === "all" ? "all" : parseInt(v))
              }
            >
              <SelectTrigger className="w-full shadow-sm">
                <SelectValue placeholder="Capacidade mínima" />
              </SelectTrigger>
              <SelectContent className="shadow-medium">
                <SelectItem value="all">Todas as capacidades</SelectItem>
                <SelectItem value="4">4+ pessoas</SelectItem>
                <SelectItem value="8">8+ pessoas</SelectItem>
                <SelectItem value="12">12+ pessoas</SelectItem>
                <SelectItem value="20">20+ pessoas</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm bg-white">
              <Switch
                checked={showOnlyAvailable}
                onCheckedChange={setShowOnlyAvailable}
              />
              <label
                className="text-sm cursor-pointer"
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              >
                Apenas disponíveis
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden shadow-soft bg-white">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `120px repeat(${slots.length}, minmax(60px, 1fr))`,
              }}
            >
              <div
                className="sticky left-0 z-10 border-r p-3 font-semibold text-xs"
                style={{ backgroundColor: "#FAF9F8" }}
              >
                SALA
              </div>
              {slots.map((slot) => (
                <div
                  key={slot.index}
                  className="border-b border-r p-2 text-xs text-center text-gray-600 font-medium"
                  style={{
                    background:
                      "linear-gradient(to bottom, #FFFFFF 0%, #FAF9F8 100%)",
                  }}
                >
                  {slot.display}
                </div>
              ))}

              {filteredRooms.map((room) => {
                const roomBookings = getBookingBlocks(
                  bookings.filter((b) => b.room_id === room.id),
                  currentDate,
                  slots
                );

                const getBookingForSlot = (slotIndex: number) => {
                  return roomBookings.find(
                    (b) => b.startSlot <= slotIndex && b.endSlot > slotIndex
                  );
                };

                return (
                  <div key={room.id} className="contents">
                    <div
                      className="sticky left-0 z-10 border-r border-b p-3 font-medium shadow-sm"
                      style={{
                        background:
                          "linear-gradient(to right, #FFFFFF 0%, #F5F5F5 100%)",
                      }}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {room.name}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span>
                          {room.floor === 0 ? "Térreo" : `${room.floor}º`}
                        </span>
                        <span>•</span>
                        <Users className="h-3 w-3 inline" />
                        <span>{room.capacity}</span>
                      </div>
                    </div>
                    {slots
                      .map((slot) => {
                        const bookingBlock = getBookingForSlot(slot.index);
                        const isStartOfBooking = roomBookings.some(
                          (b) => b.startSlot === slot.index
                        );

                        const isBlocked = roomBlocks.some((block) => {
                          if (block.room_id !== room.id) return false;
                          const blockStart = new Date(block.start_time);
                          const blockEnd = new Date(block.end_time);
                          if (
                            format(blockStart, "yyyy-MM-dd") !==
                            format(currentDate, "yyyy-MM-dd")
                          )
                            return false;
                          const slotTime = parse(
                            slot.time,
                            "HH:mm",
                            currentDate
                          );
                          const blockStartTime = parse(
                            format(blockStart, "HH:mm"),
                            "HH:mm",
                            currentDate
                          );
                          const blockEndTime = parse(
                            format(blockEnd, "HH:mm"),
                            "HH:mm",
                            currentDate
                          );
                          return (
                            slotTime >= blockStartTime &&
                            slotTime < blockEndTime
                          );
                        });

                        if (bookingBlock) {
                          return (
                            <div
                              key={slot.index}
                              className="border-b border-r p-1 bg-gradient-to-br from-blue-100 to-blue-200 relative cursor-pointer hover:from-blue-200 hover:to-blue-300 transition-all shadow-inner-soft group"
                              onClick={() =>
                                setSelectedBooking(bookingBlock.booking)
                              }
                            >
                              {isStartOfBooking && (
                                <div className="flex items-center gap-2 p-1">
                                  <Avatar className="h-7 w-7 shrink-0 border-2 border-white shadow-soft">
                                    <AvatarImage
                                      src={
                                        bookingBlock.booking.user?.avatar_url
                                      }
                                    />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-brand-primary to-brand-accent text-white font-semibold">
                                      {getInitials(
                                        bookingBlock.booking.user?.full_name
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate text-brand-primary">
                                      {bookingBlock.booking.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {bookingBlock.booking.user?.full_name ||
                                        "Usuário"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (isBlocked) {
                          return (
                            <div
                              key={slot.index}
                              className="border-b border-r p-1 bg-gradient-to-br from-red-50 to-red-100 cursor-not-allowed min-h-[40px] shadow-inner-soft"
                            >
                              <div className="text-xs text-red-600 font-medium">
                                Bloqueada
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot.index}
                            className="border-b border-r p-1 bg-gradient-to-br from-white to-gray-50 hover:from-blue-100 hover:to-blue-100 transition-all cursor-pointer min-h-[40px] hover:shadow-sm"
                            onClick={() => handleSlotClick(room.id, slot.index)}
                          />
                        );
                      })
                      .filter(Boolean)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <BookingForm
          roomId={selectedSlot.roomId}
          date={currentDate}
          startSlot={selectedSlot.startSlot}
          endSlot={selectedSlot.endSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            setSelectedSlot(null);
            loadData();
          }}
        />
      )}

      {selectedBooking && (
        <Dialog open={true} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedBooking.title}</DialogTitle>
              <DialogDescription>Detalhes da reserva</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Sala</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.room?.name} •{" "}
                  {selectedBooking.room?.floor === 0
                    ? "Térreo"
                    : `${selectedBooking.room?.floor}º Andar`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Horário
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(selectedBooking.start_time),
                    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )}{" "}
                  - {format(new Date(selectedBooking.end_time), "HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.attendees_count} pessoa
                  {selectedBooking.attendees_count !== 1 ? "s" : ""}
                </p>
              </div>
              {selectedBooking.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Descrição</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.description}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1">Organizador</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedBooking.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedBooking.user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.user?.full_name || "Usuário"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEvent } from "https://esm.sh/ics@3.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking, user, room } = await req.json();

    if (!booking || !user || !room) {
      return new Response(JSON.stringify({ error: "Missing required data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);

    const icsEvent = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ] as [number, number, number, number, number],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ] as [number, number, number, number, number],
      title: booking.title,
      description: booking.description || `Reserva na sala ${room.name}`,
      location: `${room.name} - ${
        room.floor === 0 ? "Térreo" : `${room.floor}º Andar`
      }`,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: user.full_name, email: user.email },
    };

    const { error: icsError, value: icsContent } = createEvent(icsEvent);

    if (icsError || !icsContent) {
      console.error("Error creating ICS:", icsError);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured. Email sending disabled.");
      return new Response(
        JSON.stringify({
          message: "Email service not configured",
          ics: icsContent,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Spot <noreply@pontoforte.com>",
        to: [user.email],
        subject: `Reserva Confirmada: ${booking.title}`,
        html: `
          <h2>Reserva Confirmada</h2>
          <p>Olá ${user.full_name},</p>
          <p>Sua reserva foi confirmada com sucesso!</p>
          <h3>Detalhes da Reserva:</h3>
          <ul>
            <li><strong>Sala:</strong> ${room.name} - ${
          room.floor === 0 ? "Térreo" : `${room.floor}º Andar`
        }</li>
            <li><strong>Data:</strong> ${startDate.toLocaleDateString(
              "pt-BR"
            )}</li>
            <li><strong>Horário:</strong> ${startDate.toLocaleTimeString(
              "pt-BR",
              { hour: "2-digit", minute: "2-digit" }
            )} - ${endDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
            <li><strong>Título:</strong> ${booking.title}</li>
            ${
              booking.description
                ? `<li><strong>Descrição:</strong> ${booking.description}</li>`
                : ""
            }
            <li><strong>Participantes:</strong> ${booking.attendees_count}</li>
          </ul>
          <p>Obrigado por usar o Spot!</p>
        `,
        attachments: icsContent
          ? [
              {
                filename: "reserva.ics",
                content: Buffer.from(icsContent).toString("base64"),
              },
            ]
          : [],
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", ics: icsContent }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Email sent successfully", ics: icsContent }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

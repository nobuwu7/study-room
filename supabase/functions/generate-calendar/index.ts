import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CalendarRequest {
  scheduleId: string;
}

const generateICS = (schedule: any) => {
  const now = new Date();
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Parse schedule to extract time blocks
  const lines = schedule.generated_schedule.split('\n').filter((line: string) => line.trim());
  const events: string[] = [];

  lines.forEach((line: string) => {
    // Match time patterns like "7:00 AM - 8:00 AM" or "07:00 - 08:00"
    const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    
    if (timeMatch) {
      const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
      const description = line.replace(timeMatch[0], '').replace(/^[\s:-]+/, '').trim();
      
      // Convert to 24-hour format
      let start24Hour = parseInt(startHour);
      let end24Hour = parseInt(endHour);
      
      if (startPeriod?.toLowerCase() === 'pm' && start24Hour !== 12) start24Hour += 12;
      if (startPeriod?.toLowerCase() === 'am' && start24Hour === 12) start24Hour = 0;
      if (endPeriod?.toLowerCase() === 'pm' && end24Hour !== 12) end24Hour += 12;
      if (endPeriod?.toLowerCase() === 'am' && end24Hour === 12) end24Hour = 0;
      
      // Create recurring event (daily)
      const startDate = new Date(now);
      startDate.setHours(start24Hour, parseInt(startMin), 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(end24Hour, parseInt(endMin), 0, 0);
      
      // Generate UID
      const uid = `${schedule.id}-${start24Hour}${startMin}@studyroom.app`;
      
      events.push(`BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(now)}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
RRULE:FREQ=DAILY
SUMMARY:${description || 'Study Session'}
DESCRIPTION:${description}
END:VEVENT`);
    }
  });

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudyRoom//Study Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Study Schedule
X-WR-TIMEZONE:UTC
${events.join('\n')}
END:VCALENDAR`;

  return icsContent;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get schedule ID from URL params
    const url = new URL(req.url);
    const scheduleId = url.searchParams.get("scheduleId");

    if (!scheduleId) {
      throw new Error("Schedule ID is required");
    }

    // Fetch the schedule (public access - no auth required)
    const { data: schedule, error } = await supabase
      .from("study_schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();

    if (error) throw error;
    if (!schedule) throw new Error("Schedule not found");

    // Generate ICS file
    const icsContent = generateICS(schedule);

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="study-schedule.ics"',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error generating calendar:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sleepTime, wakeTime, energyPeaks, studyGoals } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert study schedule planner who creates concise, actionable schedules.

Create schedules that:
- Use ONE-LINER format for each time block (max 10 words)
- Focus on clear, specific actions
- Include time ranges (e.g., "7:00 AM - 8:00 AM")
- Minimize explanations and theories
- Use simple, direct language

Format each entry as:
TIME_RANGE - Brief activity description

Example format:
7:00 AM - 8:00 AM - Morning routine & breakfast
8:00 AM - 10:00 AM - Deep focus study session
10:00 AM - 10:15 AM - Quick break, stretch
`;

    const userPrompt = `Create a concise daily study schedule:

Sleep: ${sleepTime}
Wake: ${wakeTime}
Energy peaks: ${energyPeaks}
Goals: ${studyGoals}

Provide a simple hour-by-hour schedule with:
- Time blocks in format "HH:MM - HH:MM - Activity"
- ONE brief line per time block
- Strategic breaks every 90 minutes
- Peak study times during high energy periods
- 3-4 key tips at the end (one line each)

Keep it simple and scannable. No long explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const schedule = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ schedule }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating schedule:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
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

    const systemPrompt = `You are an expert study schedule planner who understands circadian rhythms and optimal learning windows. 
Create personalized study schedules that:
- Align with the user's natural energy patterns
- Include appropriate breaks based on biological needs
- Follow proven study techniques like the Pomodoro method
- Consider peak cognitive performance times
- Suggest break activities that help with recovery

Format your response as a structured daily schedule with specific time blocks, activities, and reasoning.`;

    const userPrompt = `Create a personalized daily study schedule for a student with these characteristics:
- Sleep time: ${sleepTime}
- Wake time: ${wakeTime}
- Energy peaks: ${energyPeaks}
- Study goals: ${studyGoals}

Please provide:
1. A detailed hour-by-hour schedule from wake time to sleep time
2. Optimal study blocks aligned with their energy levels
3. Strategic break times with suggested activities
4. Reasoning for why each time block is scheduled that way
5. Tips for maintaining this schedule

Format the schedule clearly with time blocks, activities, and brief explanations.`;

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
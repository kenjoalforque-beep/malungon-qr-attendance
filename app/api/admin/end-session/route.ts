import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  // Find active session
  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("*")
    .eq("status", "active")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !session) {
    return NextResponse.json(
      { error: "No active session found" },
      { status: 400 }
    );
  }

  // End the session
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "ended",
      is_active: false,
      ended_at: new Date().toISOString()
    })
    .eq("id", session.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

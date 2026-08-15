import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CREDIT_COST = 31;

export async function POST(request: NextRequest) {
  const { prompt, action = "kitchen_help" } = await request.json() as { prompt?: string; action?: string };
  if (!prompt?.trim()) return NextResponse.json({ error: "A kitchen question is required." }, { status: 400 });

  const auth = request.headers.get("authorization");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Local demo mode keeps the product usable before Supabase is connected.
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ content: localKitchenReply(prompt), creditsRemaining: 310, demo: true });
  }
  if (!auth) return NextResponse.json({ error: "Sign in with a magic link to use Miro AI." }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in with a magic link to use Miro AI." }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: debit, error: debitError } = await admin.rpc("consume_ai_credits", { p_user_id: user.id, p_amount: CREDIT_COST, p_action: action });
  if (debitError || !debit?.[0]?.success) return NextResponse.json({ error: debit?.[0]?.message || "Not enough credits." }, { status: 402 });

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", temperature: 0.65, messages: [
        { role: "system", content: "You are Miro, a warm practical kitchen assistant. Give safe, concise, actionable cooking advice. Do not claim medical expertise. Use normal cooking measures such as potatoes, cans, bulbs and tablespoons; mention grams only when useful." },
        { role: "user", content: prompt },
      ] }),
    });
    if (!response.ok) throw new Error("The kitchen connection is unavailable.");
    const data = await response.json();
    return NextResponse.json({ content: data.choices?.[0]?.message?.content || "Miro could not make a plan this time.", creditsRemaining: debit[0].credits_remaining });
  } catch (error) {
    await admin.rpc("refund_ai_credits", { p_user_id: user.id, p_amount: CREDIT_COST, p_action: `${action}:provider_error` });
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI request failed. Your credits were returned." }, { status: 502 });
  }
}

function localKitchenReply(prompt: string) {
  return `Miro’s local preview: I’d start with the protein and vegetables you mentioned, make one base sauce, and reserve two portions for the freezer. For “${prompt.slice(0, 90)}”, open the Deal Desk, confirm the items, then ask me again after Supabase and DeepSeek are connected.`;
}

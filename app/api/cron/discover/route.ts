import { NextResponse } from "next/server";

export async function GET(request:Request){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`) return NextResponse.json({error:"Unauthorised"},{status:401});
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({status:"skipped",reason:"Supabase server credentials are not configured."},{status:503});
  return NextResponse.json({status:"ready",message:"Discovery worker is configured; source adapter execution is enabled after production source approval."});
}

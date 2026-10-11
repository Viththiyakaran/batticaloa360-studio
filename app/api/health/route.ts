import { NextResponse } from "next/server";
export function GET(){return NextResponse.json({ok:true,service:"batticaloa360-studio",mode:process.env.NEXT_PUBLIC_DEMO_MODE!=="false"?"development":"production"})}

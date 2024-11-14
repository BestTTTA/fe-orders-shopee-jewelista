import { NextResponse } from "next/server";
import axios from "axios";

// เก็บค่าเวลาที่โทเค็นถูกสร้าง
let issuedAt = Date.now();
let refreshToken = "7164624357736c554661704d67627968"; // โทเค็นเริ่มต้น

export async function GET() {
  // ตรวจสอบว่าโทเค็นครบ 4 ชั่วโมงแล้วหรือยัง
  const currentTime = Date.now();
  const fourHours = 4 * 60 * 60 * 1000; // 4 ชั่วโมงในหน่วยมิลลิวินาที

  if (currentTime - issuedAt >= fourHours) {
    console.log("Token expired. Refreshing token...");

    try {
      const url = `https://order-api-dev.thetigerteamacademy.net/refresh_token?refresh_token=${refreshToken}`;
      const response = await axios.post(url, null, { headers: { accept: "application/json" } });

      // อัปเดตโทเค็นใหม่และเวลาออกโทเค็นใหม่
      refreshToken = response.data.refresh_token;
      issuedAt = Date.now(); // ตั้งเวลาใหม่เมื่อรีเฟรชโทเค็นสำเร็จ

      const newAccessToken = response.data.access_token;

      return NextResponse.json({ accessToken: newAccessToken, refreshToken });
    } catch (error) {
      console.error("Error refreshing token:", error);
      return NextResponse.json({ message: "Failed to refresh token" }, { status: 500 });
    }
  } else {
    console.log("Token is still valid.");
    return NextResponse.json({ message: "Token is still valid" });
  }
}

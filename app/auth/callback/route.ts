import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const authorization_code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!authorization_code) {
    return NextResponse.json(
      { error: "Missing authorization_code" }, 
      { status: 400 }
    );
  }

  // 1. Construct the Body as FormData
  // This satisfies Zapier's "multipart/form-data" requirement.
  const formData = new FormData();
  formData.append("grant_type", "authorization_code");
  formData.append("code", authorization_code);
  formData.append("redirect_uri", process.env.ZAPIER_OAUTH_REDIRECT_URI as string);

  // 2. Prepare Basic Auth Header
  const clientId = process.env.NEXT_PUBLIC_ZAPIER_OAUTH_CLIENT_ID;
  const clientSecret = process.env.ZAPIER_OAUTH_CLIENT_SECRET;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const res = await fetch("https://zapier.com/oauth/token/", {
      method: "POST",
      headers: {
        // IMPORTANT: Do NOT manually set "Content-Type" here.
        // Fetch detects the FormData body and sets "Content-Type: multipart/form-data; boundary=..." automatically.
        Authorization: `Basic ${authHeader}`,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const { access_token, refresh_token } = data;

      console.log("Successfully retrieved access token");
      // TODO: Store tokens in DB
      
      return NextResponse.redirect(`https://get-trace.app?accessToken=${access_token}&refreshToken=${refresh_token}`);
    } else {
      const errorText = await res.text();
      console.error("Zapier Token Error:", errorText);
      return NextResponse.redirect("https://get-trace.app/auth/callback/error");
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.redirect("https://get-trace.app/auth/callback/error");
  }
}
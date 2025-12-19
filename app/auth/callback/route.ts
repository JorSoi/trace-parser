import { access } from "fs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const authorization_code = searchParams.get("code");
  const state = searchParams.get("state");
  console.log(
    `CB received using code ${authorization_code} and state ${state}`,
  );

  if (!authorization_code || !state) {
    throw new Error("Request parameters are not complete");
  }

  console.log(`Requesting access_token with ${process.env.ZAPIER_OAUTH_CLIENT_ID}:${process.env.ZAPIER_OAUTH_CLIENT_SECRET}`);

  const res = await fetch("https://zapier.com/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization:
        "Basic " +
        btoa(
          `${process.env.ZAPIER_OAUTH_CLIENT_ID}:${process.env.ZAPIER_OAUTH_CLIENT_SECRET}`,
        ),
    },
    body: `grant_type=authorization_code&code=${authorization_code}&redirect_uri=${process.env.ZAPIER_OAUTH_REDIRECT_URI}`,
  });

  if (res.ok) {
    const { access_token, refresh_token } = await res.json();
    console.log("Retrieved access token: " + access_token);
    return NextResponse.redirect(`https://get-trace.app`);
  } else {
    console.log(res.body);
  }
  return NextResponse.redirect(`https://get-trace.app/auth/callback/error`);
}

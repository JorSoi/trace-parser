"use client";

import { redirect } from "next/navigation";

export default function AuthButton() {
  const handleClick = async () => {
    const params = {
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_ZAPIER_OAUTH_CLIENT_ID,
      redirect_uri: "https://get-trace.app/auth/callback",
      scope: "zap:all",
      response_mode: "query",
      state: "tney4952",
    };

    console.log(
      "Redirecting to: " +
        `https://api.zapier.com/v2/authorize?response_type=${params.response_type}&client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}&response_mode=${params.response_mode}&state=${params.state}`,
    );

    redirect(
      `https://api.zapier.com/v2/authorize?response_type=${params.response_type}&client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}&response_mode=${params.response_mode}&state=${params.state}`,
    );
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#ff4f00] text-white py-2 px-3 rounded-xl font-medium cursor-pointer"
    >
      Authenticate with Zapier
    </button>
  );
}

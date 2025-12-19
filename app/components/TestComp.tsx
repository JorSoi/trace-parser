"use client";

export default function AuthButton() {

  const handleClick = async () => {
    const params = {
        response_type: "code",
        client_id: "rVdTxlklAZifGYQidB4548iqOKEo7uZVLCdNHEhQ",
        redirect_uri: "https://get-trace.app/auth/callback",
        scope: "zap:all",
        response_mode: "query",
        state: "tney4952",
    }

    try {
        // const res = await fetch(`https://api.zapier.com/v2/authorize?response_type=${params.response_type}&client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}&response_mode=${params.response_mode}&state=${params.state}`);

        // if (res.ok) {
        //     const data = await res.json();
        //     alert(data);
        // } else {
        //     console.log(res);
        //     alert("Response was not okay:\n" + JSON.stringify(res.text));
        // }
        
        console.log(`https://api.zapier.com/v2/authorize?response_type=${params.response_type}&client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}&response_mode=${params.response_mode}&state=${params.state}`)
        
        
    } catch (e) {
        alert(e);
    }
  };

  return <button onClick={handleClick} className="bg-[#ff4f00] text-white py-2 px-3 rounded-xl font-medium cursor-pointer">Authenticate with Zapier</button>;
}

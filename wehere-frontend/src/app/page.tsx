/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Pusher from "pusher-js";

export default function Route() {
  const [thread, setThread] = React.useState<any>();
  const [pusherSubscription, setPusherSubscription] = React.useState<any>();

  const createNewThread = async () => {
    const response = await fetch("http://localhost:4096/api/create-thread", {
      method: "POST",
    });
    const data = await response.json();
    setThread(data.thread);
    setPusherSubscription(data.pusherSubscription);
  };

  const pusherChannelId: string | undefined =
    pusherSubscription?.pusherChannelId;

  React.useEffect(() => {
    if (!pusherChannelId) return;
    // TODO: get app id from env
    const pusher = new Pusher("efe46299f5b76a02250a", { cluster: "ap1" });
    const channel = pusher.subscribe(pusherChannelId);

    const listener = (event: unknown) => {
      console.log(event);
    };

    channel.bind("new-message", listener);

    return () => {
      channel.unbind("new-message", listener);
    };
  }, [pusherChannelId]);

  const [text, setText] = React.useState("");

  const sendMessage = async () => {
    const response = await fetch("http://localhost:4096/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: thread._id,
        threadPassword: thread.password,
        text: text,
      }),
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <main className="container">
      <h1>{`WeHere`}</h1>
      <button onClick={() => createNewThread()}>{"New Thread"}</button>
      <pre>{JSON.stringify({ thread, pusherSubscription }, null, 2)}</pre>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button onClick={sendMessage}>{"Send Message"}</button>
    </main>
  );
}

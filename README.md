# wehere-bot-4096

```sh
yarn workspace wehere-bot dev:bot
PORT=4096 yarn workspace wehere-backend dev
PORT=4098 yarn workspace wehere-frontend dev
```

TODO: remove `express` in `wehere-bot`

TODO: there are two approaches:

1. solve the sidebar logic first
2. solve the chat logic first

wehere-frontend/src/containers/PageChat/index.tsx

for the sidebar, think about pure HTML, CSS with media query and display: none
the sidebar on mobile is just a modal

Chat logic state: list of messages and list of pending messages, time range
possible actions: send message, load previous messages, load next messages, subscribe to pusher, unsubscribe

to start, create page /thread?threadId=...&threadPassword=...&pusherChannelId=...

TODO: remove the @/\* completely, avoid ../../..///
TODO: handle button Load Previous Messages properly

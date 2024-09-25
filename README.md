# wehere-bot-4096

## Developer's Guide

```sh
yarn workspace wehere-bot dev:bot
PORT=4096 yarn workspace wehere-backend dev
PORT=4098 yarn workspace wehere-frontend dev
```

## TODOs

```
TODO: use prosemirror to compose rich text
TODO: use Sentry to record errors in Telegram bot
TODO: use friendly display name
TODO: a mechanism to authenticate
TODO: consider to have `<RichTextViewer variant=<"unstyled" | "default">>`
TODO: use collection `config` to store availability and schedule
TODO: use template to reply mortal when they type /start
TODO: update the URL to set webhook
TODO: for reactions, split into two tasks: 1. Angel can send (one) reaction. 2. Mortal can send reactions. For each "sent message", the reaction shown is the latest reaction from the "proper direaction".
TODO: add "sent messages" to DB so that we keep the relation between thread messages and sent messages
```

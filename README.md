# wehere-bot-4096

```sh
yarn workspace wehere-bot dev:bot
PORT=4096 yarn workspace wehere-backend dev
PORT=4098 yarn workspace wehere-frontend dev
```

TODO: remove `express` in `wehere-bot`
TODO: use prosemirror to display/compose rich text
TODO: use friendly display name
TODO: IntroConvo
TODO: RichText display with prosemirror
TODO: info page
TODO: a mechanism to authenticate
TODO: integrate AngelActionOnMessage
TODO: change PersistentAutoReplyMessage to PersistentPreparedMessage { message, purpose }
TODO: think about removing PersistentChat or move AngelActionOnMessage to PersistentChat
TODO: actually, when angel says somthing and not replying to anyone, ask angel what do you want with this message. By doing so, we avoid AngelActionOnMessage. Make threadId in PersistentThreadMessage optional.

# wehere-bot-4096

```sh
yarn workspace wehere-bot dev:bot
PORT=4096 yarn workspace wehere-backend dev
PORT=4098 yarn workspace wehere-frontend dev
```

TODO: remove `express` in `wehere-bot`
TODO: migrate to getWehereUrlV2
TODO: use prosemirror to compose rich text
TODO: use friendly display name
TODO: a mechanism to authenticate
TODO: info page
TODO: make home page intro a template
TODO: allow to delete a thread
TODO: use POST instead of GET if caching is unreasonable, i.e. when there is secret in the request, or make the cache option compulsory
TODO: auto reply on web
TODO: apply more templates

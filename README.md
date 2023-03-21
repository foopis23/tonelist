# Tonelist2
Tonelist2 is a discord music bot that plays music from youtube and soundcloud. Its written in typescript with discord.js and lavalink.

## Features
- Play music from youtube and soundcloud
- Queue system
- Enqueue Youtube playlists
- Play music from a playlist

## Commands
- `enqueue <url>` - Enqueues a song from youtube or soundcloud
- `join` - Joins the voice channel you are in
- `leave` - Leaves the voice channel
- `list` - Lists the songs in the queue
- `ping` - Pings the bot
- `remove <index>` - Removes a song from the queue

## Env File Setup
There are 4 env files. `.env`, `.env.development`, `.env.production`, `.env.local`. `.env` and `.env.local` are always loaded. `.env.development` is loaded when `NODE_ENV='development'`. `.env.production` is loaded when `NODE_ENV='production'`. Each env files overrides the last in the order below.

1. `.env`
2. `.env.${NODE_ENV}`
3. `.env.local`

### Env Variables
| Name          | Description                                              |
| ------------- | -------------------------------------------------------- |
| LAVA_HOST     | the host for lavalink node                               |
| LAVA_PORT     | the port for lavalink node                               |
| LAVA_PASSWORD | the password for lavalink                                |
| TOKEN         | the discord bot token                                    |
| CLIENT_ID     | the discord bot client id                                |
| TEST_GUILDS   | command separated guild ids for to deploy guild commands |
| LOG_LEVEL     | the log level for the bot                                |
| NODE_ENV      | development or production                                |

## Application.yml
The `application.yml` file in the root is used to configure lavalink. Its just the default configuration for lavalink. If you are going to run lavalink in docker, you need to mount the `application.yml` file to `/opt/Lavalink/application.yml` in the container.

## Contributing
To contribute fork the repo and create a pull request. Please make sure to run `npm run lint` before creating a pull request.

### Running the project locally
The easiest way to run the project locally is using docker compose. You can run `docker-compose up` to start the bot and lavalink. You will need to create a `.env.local` file in the root of the project. The `.env.local` file should look like this:

```env
TOKEN=YOUR_TOKEN
CLIENT_ID=YOUR_CLIENT_ID
TEST_GUILDS=DISCORD_SERVER_ID
```

## License
Tonelist2 is licensed under the MIT License. See [LICENSE](LICENSE) for more information.


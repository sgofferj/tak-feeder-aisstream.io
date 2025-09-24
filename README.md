# tak-feeder-aisstream.io

[![Container build](https://github.com/sgofferj/tak-feeder-aisstream.io/actions/workflows/actions.yml/badge.svg)](https://github.com/sgofferj/tak-feeder-aisstream.io/actions/workflows/actions.yml)

Feed AIS data from aisstream.io into your TAK server

(C) 2023 Stefan Gofferje

Licensed under the GNU General Public License V3 or later.

## Description

aisstream.io is a new free AIS service. The author of this project is not affiliated with aisstream.io.

## Configuration

The following values are supported and can be provided either as environment variables or through an .env-file.

| Variable | Default | Purpose |
|----------|---------|---------|
| REMOTE_SERVER_URL | empty | (mandatory) TAK server full URL, e.g. ssl://takserver:8089 |
| REMOTE_SSL_USER_CERTIFICATE | empty | (mandatory for ssl) User certificate in PEM format |
| REMOTE_SSL_USER_KEY | empty | (mandatory for ssl) User certificate key file (xxx.key) |
| UPDATE_RATE | 5 | (optional) Update rate in seconds (how often data is sent to the server) |
| UUID | empty | (optional) Set feeder UID - if not set, the feeder will create one |
| CALLSIGN | ais-traffic-fin | (optional) Callsign for heartbeat |
| MYCOT | a-f-G-U | (optional) CoT type for heartbeat |
| API_KEY | empty | (mandatory) aisstream.io API key |
| TYPE_FILTER | 35 | (optional) Comma-separated list of AIS ship types to feed. **Be smart about it! Aisstream.io has _a lot_ of ships. If you feed too many AIS types, your TAK server will likely crash.**  A list of ship types can be found [here](https://api.vtexplorer.com/docs/ref-aistypes.html). |
| BBOX | [[[-90, -180], [90, 180]]] | bounding box to subscribe to in array notation |

Note: At the moment, only SSL TCP connections are supported.

A word about the update rate: Ships are moving fairly slow, so an update rate of 5 to 10 seconds should be sufficient. The container will cache all received position and metadata and submit all ships it has position data for to the TAK server.

## Certificates

These are the server-issued certificate and key files. Before using, the password needs to be removed from the key file with `openssl rsa -in cert.key -out cert-nopw.key`. OpenSSL will ask for the key password which usually is "atakatak".

## Container use

First, get your certificate and key and copy them to a suitable folder which needs to be added as a volume to the container.

### Image

The image is built for AMD64 and ARM64 and pushed to ghcr.io: _ghcr.io/sgofferj/tak-feeder-aisstream.io:latest_

### Docker

First, rename .env.example to .env and edit according to your needs \
Create and start the container:

```bash
docker run -d --env-file .env -v <path-to-data-directory>:/data:ro --name tak-feeder-aisstream.io --restart always ghcr.io/sgofferj/tak-feeder-aisstream.io:latest
```

### Docker compose

Here is an example for a docker-compose.yml file:

```yaml
version: '2.0'

services:
  aisstreamio:
    image: ghcr.io/sgofferj/tak-feeder-aisstream.io:latest
    restart: always
    networks:
      - default
    volumes:
      - <path to data-directory>:/data:ro
    environment:
      - REMOTE_SERVER_URL=ssl://tak-server:8089
      - REMOTE_SSL_USER_CERTIFICATE=/data/cert.pem
      - REMOTE_SSL_USER_KEY=/data/key.pem
      - CALLSIGN=aisfeeder
      - MYCOT=a-f-G-U
      - TYPE_FILTER=35
      - API_KEY=<your API key>
      - UPDATE_RATE=5
      - BBOX=[[[-90, -180], [90, 180]]]

networks:
  default:

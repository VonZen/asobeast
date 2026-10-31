#!/usr/bin/env python3
"""Forward localhost:3001 to the current Asobeast Web Apple Container.

No dependency on rtk; the container's address is looked up through Apple's
container CLI and refreshed whenever the upstream connection fails.
"""
import asyncio
import json
import os
import subprocess
import sys

CLI = os.getenv("CONTAINER_CLI", "/usr/local/bin/container")
LISTEN = "127.0.0.1"
PORT = 3001
WEB_PORT = 3000


def web_ip():
    result = subprocess.run(
        [CLI, "inspect", "asobeast-web"],
        check=True,
        capture_output=True,
        text=True,
        timeout=12,
    )
    networks = json.loads(result.stdout)[0]["status"]["networks"]
    matching = next((n for n in networks if n.get("network") == "asobeast"), None)
    if matching is None:
        raise RuntimeError("Web container is not attached to the asobeast network")
    return matching["ipv4Address"].split("/")[0]


async def relay(client_reader, client_writer):
    global current_ip
    try:
        try:
            web_reader, web_writer = await asyncio.open_connection(current_ip, WEB_PORT)
        except OSError:
            current_ip = await asyncio.to_thread(web_ip)
            web_reader, web_writer = await asyncio.open_connection(current_ip, WEB_PORT)

        async def pipe(reader, writer):
            try:
                while chunk := await reader.read(65536):
                    writer.write(chunk)
                    await writer.drain()
            except (ConnectionError, OSError):
                pass
            finally:
                writer.close()

        await asyncio.gather(
            pipe(client_reader, web_writer),
            pipe(web_reader, client_writer),
        )
    except (OSError, RuntimeError, subprocess.SubprocessError, ValueError) as error:
        print(f"Relay upstream unavailable: {error}", file=sys.stderr, flush=True)
    finally:
        client_writer.close()
        try:
            await client_writer.wait_closed()
        except (ConnectionError, OSError):
            pass


async def main():
    global current_ip
    current_ip = await asyncio.to_thread(web_ip)
    server = await asyncio.start_server(relay, LISTEN, PORT)
    print(f"Asobeast relay on {LISTEN}:{PORT} -> {current_ip}:{WEB_PORT}", flush=True)
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())

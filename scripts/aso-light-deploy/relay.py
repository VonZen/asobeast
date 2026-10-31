#!/usr/bin/env python3
"""Loopback-only forwarding for ASO-Light's Apple Container web service."""
import asyncio
import json
import os
import subprocess
import sys

CLI = os.environ.get("CONTAINER_CLI", "/usr/local/bin/container")
PORT = 3002
WEB_PORT = 80
current_ip = ""


def lookup_ip():
    result = subprocess.run(
        [CLI, "inspect", "aso-light-web"],
        capture_output=True, text=True, check=True, timeout=15,
    )
    containers = json.loads(result.stdout)
    addresses = containers[0]["status"]["networks"]
    for network in addresses:
        if network.get("network") == "aso-light":
            return network["ipv4Address"].split("/")[0]
    raise RuntimeError("ASO-Light Web container is not on network aso-light")


async def handle(client_reader, client_writer):
    global current_ip
    try:
        try:
            upstream_reader, upstream_writer = await asyncio.open_connection(current_ip, WEB_PORT)
        except (OSError, ConnectionError):
            current_ip = await asyncio.to_thread(lookup_ip)
            upstream_reader, upstream_writer = await asyncio.open_connection(current_ip, WEB_PORT)

        async def pipe(reader, writer):
            try:
                while data := await reader.read(65536):
                    writer.write(data)
                    await writer.drain()
            except (OSError, ConnectionError):
                pass
            finally:
                writer.close()

        await asyncio.gather(
            pipe(client_reader, upstream_writer),
            pipe(upstream_reader, client_writer),
        )
    except (OSError, ConnectionError, RuntimeError, subprocess.SubprocessError) as exc:
        print(f"ASO-Light relay upstream error: {exc}", file=sys.stderr, flush=True)
    finally:
        client_writer.close()


async def main():
    global current_ip
    current_ip = await asyncio.to_thread(lookup_ip)
    server = await asyncio.start_server(handle, "127.0.0.1", PORT)
    print(f"ASO-Light relay running on 127.0.0.1:{PORT}", flush=True)
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())

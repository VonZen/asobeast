#!/usr/bin/env python3
"""Restrict Mac localhost proxy forwarding to Apple Container VM gateways."""
import asyncio
import signal

BRIDGES = ["192.168.64.1", "192.168.65.1"]
PORT = 7891
UPSTREAM_HOST = "127.0.0.1"
UPSTREAM_PORT = 7890

async def handle(reader, writer):
    upstream = None
    try:
        remote_reader, upstream = await asyncio.open_connection(UPSTREAM_HOST, UPSTREAM_PORT)
        async def relay(src, dest):
            try:
                while chunk := await src.read(65536):
                    dest.write(chunk)
                    await dest.drain()
            except (OSError, ConnectionError):
                pass
            finally:
                dest.close()
        await asyncio.gather(relay(reader, upstream), relay(remote_reader, writer))
    except (OSError, ConnectionError):
        pass
    finally:
        writer.close()
        if upstream is not None:
            upstream.close()

async def main():
    servers = [await asyncio.start_server(handle, host, PORT) for host in BRIDGES]
    print("Apple Container gateway proxy forwarder started", flush=True)
    try:
        await asyncio.gather(*(s.serve_forever() for s in servers))
    finally:
        for server in servers:
            server.close()

if __name__ == "__main__":
    asyncio.run(main())

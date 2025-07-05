"""
WebSocket manager + Redis pub/sub bridge.
"""
import asyncio
import json
import time
import logging
from typing import Dict, Set, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from collections import defaultdict
from uuid import UUID


import redis.asyncio as aioredis
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.core.settings import settings

# Configuration
_CHANNEL = "ai-sync.response"
_HEARTBEAT_INTERVAL = 30  # Send ping every 30 seconds
_CLIENT_TIMEOUT = 60  # Disconnect if no pong received in 60 seconds
_MAX_MESSAGE_SIZE = 1024 * 64  # 64KB max message size
_RECONNECT_DELAY = 5  # Seconds to wait before reconnecting Redis

# Redis connection
_redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

# Logging
logger = logging.getLogger(__name__)


@dataclass
class ClientInfo:
    """Track WebSocket client information and statistics."""
    websocket: WebSocket
    connected_at: float
    last_ping: float
    last_pong: float
    company_ids: Set[UUID]  # Companies this client is interested in
    message_count: int = 0
    error_count: int = 0
    client_id: Optional[str] = None
    user_agent: Optional[str] = None


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[WebSocket, ClientInfo] = {}
        self._company_subscribers: Dict[UUID, Set[WebSocket]] = defaultdict(set)
        self._redis_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._stats = {
            "total_connections": 0,
            "total_messages": 0,
            "total_errors": 0,
            "start_time": time.time()
        }
    
    async def connect(self, ws: WebSocket, client_id: Optional[str] = None) -> None:
        """Accept WebSocket connection and track client info."""
        await ws.accept()
        
        # Extract client information
        headers = dict(ws.headers)
        user_agent = headers.get("user-agent", "Unknown")
        
        # Create client info
        now = time.time()
        client_info = ClientInfo(
            websocket=ws,
            connected_at=now,
            last_ping=now,
            last_pong=now,
            company_ids=set(),
            client_id=client_id,
            user_agent=user_agent
        )
        
        self.active[ws] = client_info
        self._stats["total_connections"] += 1
        
        # Send welcome message
        await self._send_to_client(ws, {
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "server_version": "2.0"
        })
        
        logger.info(
            f"WebSocket connected: client_id={client_id}, "
            f"total_active={len(self.active)}"
        )
    
    def disconnect(self, ws: WebSocket) -> None:
        """Remove WebSocket connection and clean up subscriptions."""
        client_info = self.active.get(ws)
        if client_info:
            # Remove from company subscribers
            for company_id in client_info.company_ids:
                self._company_subscribers[company_id].discard(ws)
                if not self._company_subscribers[company_id]:
                    del self._company_subscribers[company_id]
            
            # Calculate session duration
            duration = time.time() - client_info.connected_at
            
            logger.info(
                f"WebSocket disconnected: client_id={client_info.client_id}, "
                f"duration={duration:.1f}s, messages={client_info.message_count}"
            )
        
        self.active.pop(ws, None)
    
    async def subscribe_to_company(self, ws: WebSocket, company_id: UUID) -> None:
        """Subscribe a WebSocket to company-specific updates."""
        client_info = self.active.get(ws)
        if client_info:
            client_info.company_ids.add(company_id)
            self._company_subscribers[company_id].add(ws)
            
            await self._send_to_client(ws, {
                "type": "subscription",
                "company_id": str(company_id),
                "status": "subscribed"
            })
            
            logger.debug(f"Client subscribed to company {company_id}")
    
    async def unsubscribe_from_company(self, ws: WebSocket, company_id: UUID) -> None:
        """Unsubscribe a WebSocket from company-specific updates."""
        client_info = self.active.get(ws)
        if client_info and company_id in client_info.company_ids:
            client_info.company_ids.remove(company_id)
            self._company_subscribers[company_id].discard(ws)
            
            await self._send_to_client(ws, {
                "type": "subscription",
                "company_id": str(company_id),
                "status": "unsubscribed"
            })
    
    async def broadcast(self, msg: str, company_id: Optional[UUID] = None) -> None:
        """
        Broadcast message to all connected clients or specific company subscribers.
        Enhanced with better error handling and targeted delivery.
        """
        disconnected = []
        
        # Parse message to check for company-specific routing
        try:
            data = json.loads(msg)
            cid = data.get("company_id")
            target_company_id = company_id or (UUID(cid) if cid else None)
        except json.JSONDecodeError:
            target_company_id = company_id
            data = {"raw_message": msg}
        
        # Determine target clients
        if target_company_id and target_company_id in self._company_subscribers:
            targets = [
                (ws, self.active[ws]) 
                for ws in self._company_subscribers[target_company_id] 
                if ws in self.active
            ]
        else:
            targets = list(self.active.items())
        
        # Broadcast to targets
        for ws, client_info in targets:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(msg)
                    client_info.message_count += 1
                    self._stats["total_messages"] += 1
                else:
                    disconnected.append(ws)
            except WebSocketDisconnect:
                disconnected.append(ws)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                client_info.error_count += 1
                self._stats["total_errors"] += 1
                if client_info.error_count > 5:  # Too many errors
                    disconnected.append(ws)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)
    
    async def _send_to_client(self, ws: WebSocket, data: Dict[str, Any]) -> bool:
        """Send JSON data to a specific client with error handling."""
        try:
            if ws.client_state == WebSocketState.CONNECTED:
                message = json.dumps(data)
                if len(message) <= _MAX_MESSAGE_SIZE:
                    await ws.send_text(message)
                    return True
                else:
                    logger.warning(f"Message too large: {len(message)} bytes")
        except Exception as e:
            logger.error(f"Failed to send to client: {e}")
        
        return False
    
    async def redis_listener(self) -> None:
        """
        Enhanced Redis pub/sub listener with reconnection logic and multi-channel support.
        """
        retry_count = 0
        
        while True:
            try:
                pub = _redis.pubsub()
                
                # Subscribe to multiple channels
                channels = [
                    _CHANNEL,  # Main channel
                    f"{_CHANNEL}.company.*"  # Company-specific channels
                ]
                await pub.psubscribe(*channels)
                
                logger.info(f"Redis listener connected to channels: {channels}")
                retry_count = 0
                
                async for message in pub.listen():
                    if message["type"] in ["pmessage", "message"]:
                        channel = message.get("channel", "")
                        data = message["data"]
                        
                        # Extract company ID from channel if present
                        company_id = None
                        if ".company." in channel:
                            try:
                                company_id = UUID(channel.split(".company.")[-1])
                            except (ValueError, IndexError):
                                pass
                        
                        await self.broadcast(data, company_id=company_id)
                
            except asyncio.CancelledError:
                logger.info("Redis listener cancelled")
                break
            except Exception as e:
                retry_count += 1
                wait_time = min(_RECONNECT_DELAY * retry_count, 60)
                logger.error(
                    f"Redis listener error (attempt {retry_count}): {e}. "
                    f"Reconnecting in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)
        
        try:
            await pub.close()
        except:
            pass
    
    async def heartbeat_loop(self) -> None:
        """Send periodic heartbeats to detect disconnected clients."""
        while True:
            try:
                await asyncio.sleep(_HEARTBEAT_INTERVAL)
                
                now = time.time()
                disconnected = []
                
                for ws, client_info in list(self.active.items()):
                    # Check if client is still responsive
                    if now - client_info.last_pong > _CLIENT_TIMEOUT:
                        logger.warning(
                            f"Client timeout: {client_info.client_id}, "
                            f"last_pong={now - client_info.last_pong:.1f}s ago"
                        )
                        disconnected.append(ws)
                        continue
                    
                    # Send ping
                    try:
                        if ws.client_state == WebSocketState.CONNECTED:
                            await ws.send_json({
                                "type": "ping",
                                "timestamp": now
                            })
                            client_info.last_ping = now
                    except:
                        disconnected.append(ws)
                
                # Clean up disconnected clients
                for ws in disconnected:
                    self.disconnect(ws)
                    
            except asyncio.CancelledError:
                logger.info("Heartbeat loop cancelled")
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(5)
    
    async def handle_client_message(self, ws: WebSocket, message: str) -> None:
        """Handle incoming messages from clients."""
        client_info = self.active.get(ws)
        if not client_info:
            return
        
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "pong":
                client_info.last_pong = time.time()
            
            elif msg_type == "subscribe":
                company_id = data.get("company_id")
                if company_id:
                    await self.subscribe_to_company(ws, UUID(company_id))
            
            elif msg_type == "unsubscribe":
                company_id = data.get("company_id")
                if company_id:
                    await self.unsubscribe_from_company(ws, UUID(company_id))
            
            else:
                logger.debug(f"Unknown message type: {msg_type}")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from client: {message[:100]}")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        uptime = time.time() - self._stats["start_time"]
        
        return {
            "active_connections": len(self.active),
            "total_connections": self._stats["total_connections"],
            "total_messages": self._stats["total_messages"],
            "total_errors": self._stats["total_errors"],
            "uptime_seconds": uptime,
            "companies_monitored": len(self._company_subscribers),
            "clients": [
                {
                    "client_id": info.client_id,
                    "connected_duration": time.time() - info.connected_at,
                    "message_count": info.message_count,
                    "error_count": info.error_count,
                    "subscriptions": [str(cid) for cid in info.company_ids]
                }
                for info in self.active.values()
            ]
        }
    
    async def start_background_tasks(self) -> None:
        """Start background tasks for Redis listener and heartbeat."""
        if not self._redis_task or self._redis_task.done():
            self._redis_task = asyncio.create_task(self.redis_listener())
            
        if not self._heartbeat_task or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self.heartbeat_loop())
    
    async def stop_background_tasks(self) -> None:
        """Stop all background tasks gracefully."""
        tasks = []
        
        if self._redis_task and not self._redis_task.done():
            self._redis_task.cancel()
            tasks.append(self._redis_task)
            
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            tasks.append(self._heartbeat_task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Close all active connections
        for ws in list(self.active.keys()):
            try:
                await ws.close()
            except:
                pass
            self.disconnect(ws)


# Global instance
manager = ConnectionManager()
redis_task: Optional[asyncio.Task] = None  # Kept for backward compatibility
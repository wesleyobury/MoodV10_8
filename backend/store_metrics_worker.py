"""
Store-metrics background worker.

Runs `sync_store_metrics` shortly after startup and then once every
STORE_SYNC_INTERVAL_HOURS (default 12h), so iOS/Android download numbers refresh
themselves without a manual trigger. Mirrors the notification_worker lifecycle
(start on app startup, cancel on shutdown).

No-op (but harmless) when neither store is configured — it just logs that there's
nothing to sync and sleeps.
"""
from __future__ import annotations

import os
import asyncio
import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

import store_metrics

logger = logging.getLogger(__name__)

_INITIAL_DELAY_SEC = 90          # let the app finish booting first
_DEFAULT_INTERVAL_HOURS = 12
_BACKFILL_DAYS = int(os.environ.get("STORE_SYNC_BACKFILL_DAYS", "14"))


class StoreMetricsWorker:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._task: asyncio.Task | None = None
        self._interval = float(os.environ.get("STORE_SYNC_INTERVAL_HOURS", _DEFAULT_INTERVAL_HOURS)) * 3600

    async def start(self):
        if self._task and not self._task.done():
            return
        try:
            await store_metrics.ensure_indexes(self.db)
        except Exception as e:
            logger.warning("store_metrics index ensure failed: %s", e)
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _run_loop(self):
        await asyncio.sleep(_INITIAL_DELAY_SEC)
        while True:
            try:
                if store_metrics.asc.is_configured() or store_metrics.gpr.is_configured():
                    res = await store_metrics.sync_store_metrics(self.db, days=_BACKFILL_DAYS)
                    logger.info(
                        "📊 store metrics sync: %d rows, skipped=%s, errors=%d",
                        len(res.get("synced", [])), res.get("skipped"), len(res.get("errors", [])),
                    )
                else:
                    logger.info("store metrics sync skipped — no store configured (set ASC_* / GOOGLE_PLAY_REPORTS_BUCKET)")
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error("store metrics sync loop error: %s", e)
            await asyncio.sleep(self._interval)


_worker: StoreMetricsWorker | None = None


def get_store_metrics_worker(db: AsyncIOMotorDatabase) -> StoreMetricsWorker:
    global _worker
    if _worker is None:
        _worker = StoreMetricsWorker(db)
    return _worker


async def start_store_metrics_worker(db: AsyncIOMotorDatabase):
    await get_store_metrics_worker(db).start()


async def stop_store_metrics_worker():
    if _worker is not None:
        await _worker.stop()

from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pyodbc import Connection
from typing import AsyncGenerator, List, Dict, Any
from app.helpers import api_key_auth
from app.crud.factory import FactoryCRUD
from app.exceptions import InvalidMonthValue

import logging

logger = logging.getLogger(__name__)


def factory_router(
    product_line_db_list: List[Dict[str, Any]], lidb: AsyncGenerator
) -> APIRouter:
    router = APIRouter()
    crud = FactoryCRUD()

    @router.get("/ping")
    def ping():
        return {"ping": "pong"}

    @router.get("/linemonth", dependencies=[Depends(api_key_auth)])
    async def get_factory_energy_by_line_month(
        product: str, line: str, year: int, month: int, db: AsyncSession = Depends(lidb)
    ):
        try:
            if (product, line) not in product_line_db_list:
                logger.error(
                    f"[get_factory_energy_by_line_monthy] cannot get db information for product={product}, line={line}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot get db information for product={product}, line={line}",
                )
            line_id = product_line_db_list[(product, line)]["line_id"]
            return await crud.get_factory_energy_by_line_month(line_id, year, month, db)
        except InvalidMonthValue:
            logger.error("[get_by_line_monthly] Invalid month value")
            raise HTTPException(status_code=400, detail="Invalid month value")

    @router.get("/lineday", dependencies=[Depends(api_key_auth)])
    async def get_factory_energy_by_line_day(
        product: str,
        line: str,
        year: int,
        month: int,
        day: int,
        db: AsyncSession = Depends(lidb),
    ):
        try:
            if (product, line) not in product_line_db_list:
                logger.error(
                    f"[get_factory_energy_by_line_monthy] cannot get db information for product={product}, line={line}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot get db information for product={product}, line={line}",
                )
            line_id = product_line_db_list[(product, line)]["line_id"]
            return await crud.get_factory_energy_by_line_day(
                line_id, year, month, day, db
            )
        except InvalidMonthValue:
            logger.error("[get_by_line_monthly] Invalid month value")
            raise HTTPException(status_code=400, detail="Invalid month value")

    return router

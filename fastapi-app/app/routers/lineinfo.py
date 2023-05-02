from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session
from typing import Generator, List, Dict, Any
from app.helpers import api_key_auth
from app.crud.lineinfo import LineinfoCRUD
from app.exceptions import InvalidMonthValue

import logging

logger = logging.getLogger(__name__)


def lineinfo_router(
    product_line_db_list: List[Dict[str, Any]], lidb: Generator
) -> APIRouter:
    router = APIRouter()
    crud = LineinfoCRUD

    @router.get("/ping")
    def ping():
        return {"ping": "pong"}

    @router.get("/all", dependencies=[Depends(api_key_auth)])
    def get_all(db: Session = Depends(lidb)):
        return crud.get_all(db)

    @router.get("/linemonth", dependencies=[Depends(api_key_auth)])
    def get_lineinfo_by_line_monthy(
        product: str, line: str, month: int, year: int, db: Session = Depends(lidb)
    ):
        try:
            if (product, line) not in product_line_db_list:
                logger.error(
                    f"[get_lineinfo_by_line_monthy] cannot get db information for product={product}, line={line}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot get db information for product={product}, line={line}",
                )
            line_id = product_line_db_list[(product, line)]["line_id"]
            return crud.get_by_line_month(line_id, month, year, db)
        except InvalidMonthValue:
            logger.error("[get_by_line_monthly] Invalid month value")
            raise HTTPException(status_code=400, detail="Invalid month value")

    return router

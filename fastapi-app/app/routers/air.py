import logging
from fastapi import APIRouter, Path, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_async_db, valve_to_machine
from app.manager import SocketClient
from app.crud.air import AirCRUD
from app.schemas.air import (
    AirHistoryReport,
    AirHistoryReportWithTotal,
    AirRealtimeReport,
)
from app.exceptions import InvalidMonthValue, InvalidYearValue, InvalidDateValue
from app.helpers import api_key_auth

logger = logging.getLogger(__name__)


def air_router(product_line_db_list: List[Dict[str, Any]]) -> APIRouter:
    router = APIRouter()
    air_crud = AirCRUD()

    def _get_connection_info(product: str, line: str) -> tuple:
        if (product, line) not in product_line_db_list:
            logger.error(
                f"[get_daily_report_values] cannot get db information for product={product}, line={line}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Cannot get db information for product={product}, line={line}",
            )

        db_info = product_line_db_list[(product, line)]
        try:
            db_user = db_info["db_user"]
            db_pass = db_info["db_pass"]
            db_server = db_info["db_server"]
            db_port = db_info["db_port"]
            db_name = db_info["db_name"]
            valve_id_list = db_info["valve_list"]
            return db_user, db_pass, db_server, db_port, db_name, valve_id_list
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Database information is missing"
            )

    async def _get_db(product: str, line: str) -> AsyncSession:
        # from product and line
        #   use it to construct the session for database
        (
            db_user,
            db_pass,
            db_server,
            db_port,
            db_name,
            valve_id_list,
        ) = _get_connection_info(product, line)
        db = await get_pg_async_db(db_user, db_pass, db_server, db_port, db_name)

        machine_info_dict = {}
        machine_name_dict = {}
        for valve_id in valve_id_list:
            if valve_id in valve_to_machine:
                machine_no = valve_to_machine[valve_id]["machine_no"]
                machine_name = valve_to_machine[valve_id]["machine_name"]
                machine_info_dict[valve_id] = {
                    "mc_no": machine_no,
                    "mc_name": machine_name,
                }
                machine_name_dict[f"{machine_no}"] = machine_name

        return db, machine_info_dict, machine_name_dict

    @router.get(
        "/realtime",
        response_model=AirRealtimeReport,
        dependencies=[Depends(api_key_auth)],
    )
    async def get_realtime_report_values(
        product: str, line: str, padding_secs: int = 0, latest_mins: int = 1
    ):
        # this endpoint is used to get realtime data to be displayed in the realtime report
        try:
            _, machine_info_dict, machine_name_dict = await _get_db(product, line)
            x_axis, y_axis, race_data = air_crud.get_air_realtime(
                machine_info_dict, padding_secs, latest_mins
            )
            er = AirRealtimeReport(
                line=AirHistoryReport(
                    x_axis=x_axis, y_axis=y_axis, mc_map=machine_name_dict
                ),
                race=race_data,
            )
            return er
        except Exception as e:
            logger.error(f"[get_daily_report_values] Error during query from db {e}")
            raise HTTPException(status_code=400, detail="Error during query from db")

    @router.get(
        "/daily",
        response_model=AirHistoryReportWithTotal,
        dependencies=[Depends(api_key_auth)],
    )
    async def get_daily_report_values(
        product: str, line: str, year: int, month: int, date: int
    ):
        # this endpoint is used to get historical data to be displayed in the daily report
        try:
            db, machine_info_dict, machine_name_dict = await _get_db(product, line)
            x_axis, y_axis, total = await air_crud.get_air_consumption_daily(
                machine_info_dict, date, month, year, db
            )
            er = AirHistoryReportWithTotal(
                x_axis=x_axis, y_axis=y_axis, total=total, mc_map=machine_name_dict
            )
            await db.close()
            return er
        except InvalidDateValue:
            logger.error("[get_daily_report_values] Invalid date value")
            raise HTTPException(status_code=400, detail="Invalid date value")
        except InvalidMonthValue:
            logger.error("[get_daily_report_values] Invalid month value")
            raise HTTPException(status_code=400, detail="Invalid month value")
        except InvalidYearValue:
            logger.error("[get_daily_report_values] Invalid year value")
            raise HTTPException(status_code=400, detail="Invalid year value")
        except Exception as e:
            logger.error(f"[get_daily_report_values] Error during query from db {e}")
            raise HTTPException(status_code=400, detail="Error during query from db")

    @router.get(
        "/monthly",
        response_model=AirHistoryReportWithTotal,
        dependencies=[Depends(api_key_auth)],
    )
    async def get_monthly_report_values(product: str, line: str, year: int, month: int):
        # this endpoint is used to get historical data to be displayed in the monthly report
        try:
            db, machine_info_dict, machine_name_dict = await _get_db(product, line)
            x_axis, y_axis, total = await air_crud.get_air_consumption_monthly(
                machine_info_dict, month, year, db
            )
            er = AirHistoryReportWithTotal(
                x_axis=x_axis, y_axis=y_axis, total=total, mc_map=machine_name_dict
            )
            await db.close()
            return er
        except InvalidMonthValue:
            logger.error("[get_monthly_report_values] Invalid month value")
            raise HTTPException(status_code=400, detail="Invalid month value")
        except InvalidYearValue:
            logger.error("[get_monthly_report_values] Invalid year value")
            raise HTTPException(status_code=400, detail="Invalid year value")
        except Exception as e:
            logger.error(f"[get_monthly_report_values] Error during query from db {e}")
            raise HTTPException(status_code=400, detail="Error during query from db")

    @router.get(
        "/yearly",
        response_model=AirHistoryReportWithTotal,
        dependencies=[Depends(api_key_auth)],
    )
    async def get_yearly_report_values(product: str, line: str, year: int):
        # this endpoint is used to get historical data to be displayed in the yearly report
        try:
            db, machine_info_dict, machine_name_dict = await _get_db(product, line)
            x_axis, y_axis, total = await air_crud.get_air_consumption_yearly(
                machine_info_dict, year, db
            )
            er = AirHistoryReportWithTotal(
                x_axis=x_axis, y_axis=y_axis, total=total, mc_map=machine_name_dict
            )
            await db.close()
            return er
        except InvalidYearValue:
            logger.error("[get_yearly_report_values] Invalid year value")
            raise HTTPException(status_code=400, detail="Invalid year value")
        except Exception as e:
            logger.error(f"[get_yearly_report_values] Error during query from db {e}")
            raise HTTPException(status_code=400, detail="Error during query from db")

    return router

import logging
from math import prod
from typing import List, Dict, Any, Literal
from pathlib import Path
from fastapi import APIRouter, Depends, Header, Response
from fastapi.exceptions import HTTPException
from app.helpers import api_key_auth
from app.schemas.oee import OEEProductionReport, OEECycleTimeReport, OEEFaultOccurrenceReport
from app.exceptions import InvalidDateValue, InvalidMonthValue, InvalidYearValue, InvalidDayNight, MissingSectionCode, MissingCTLine
from app.crud.oee import OEECRUD

logger = logging.getLogger(__name__)

def _get_connection_info(product: str, line: str, product_line_db_list: List[Dict[str, Any]]) -> tuple:
    if (product, line) not in product_line_db_list:
        logger.error(f'[get_daily_report_values] cannot get db information for product={product}, line={line}')
        raise HTTPException(status_code=400, detail=f"Cannot get db information for product={product}, line={line}")

    db_info = product_line_db_list[(product, line)]
    try:
        db_user = db_info['db_user']
        db_pass = db_info['db_pass']
        db_server = db_info['db_server']
        db_port = db_info['db_port']
        db_name = db_info['db_name']
        db_provider = db_info['db_provider']
        line_id = db_info['line_id']
        if db_provider != 'postgresql' and db_provider != 'mssql':
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')
        return {'db_user': db_user, 'db_pass': db_pass, 'db_server': db_server, 'db_port': db_port, 'db_name': db_name, 'db_provider': db_provider, 'line_id': line_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Database information is missing')

def oee_router(product_line_db_oee_cycletime: List[Dict[str, Any]], product_line_db_oee_fault_occurrence: List[Dict[str, Any]]) -> APIRouter:
    router = APIRouter()
    oee_crud = OEECRUD()

    @router.get("/production", response_model=OEEProductionReport, dependencies=[Depends(api_key_auth)])
    def get_oee_production(product: str, line: str, date: int, month: int, year: int, period: Literal['Day', 'Night']):
        try:
            conn_info_dict = _get_connection_info(product, line, product_line_db_oee_fault_occurrence)
            numerator, denominator, percent, dekidata = oee_crud.get_production(date, month, year, period, conn_info_dict)
            return OEEProductionReport(numerator=numerator, denominator=denominator, percent=percent, dekidaka=dekidata)
        except InvalidDateValue:
            logger.error('[get_oee_production] Invalid date value')
            raise HTTPException(status_code=400, detail="Invalid date value")
        except InvalidMonthValue:
            logger.error('[get_oee_production] Invalid month value')
            raise HTTPException(status_code=400, detail="Invalid month value")
        except InvalidYearValue:
            logger.error('[get_oee_production] Invalid year value')
            raise HTTPException(status_code=400, detail="Invalid year value")
        except InvalidDayNight:
            logger.error('[get_oee_production] Invalid Day/Night value')
            raise HTTPException(status_code=400, detail="Invalid Day/Night value")
        except MissingSectionCode:
            logger.error('[get_oee_production] Section code cannot be found')
            raise HTTPException(status_code=400, detail="Section code cannot be found")
        except Exception as e:
            logger.error(f'[get_oee_production] Error during get oee production => {e}')
            raise HTTPException(status_code=400, detail=" Error during get oee production")

    @router.get("/cycle_time", response_model=OEECycleTimeReport, dependencies=[Depends(api_key_auth)])
    def get_oee_cycletime(product: str, line: str, date: int, month: int, year: int, period: Literal['Day', 'Night'], operator: str):
        try:
            conn_info_dict_cycle_time = _get_connection_info(product, line, product_line_db_oee_cycletime)
            conn_info_dict_fault_occur = _get_connection_info(product, line, product_line_db_oee_fault_occurrence)
            x_axis, y_axis, target, video_url, has_video = oee_crud.get_cycletime(date, month, year, period, operator, conn_info_dict_cycle_time, conn_info_dict_fault_occur)
            return OEECycleTimeReport(x_axis=x_axis, y_axis=y_axis, target=target, video_url=video_url, has_video=has_video)
        except InvalidDateValue:
            logger.error('[get_oee_cycle_time] Invalid date value')
            raise HTTPException(status_code=400, detail="Invalid date value")
        except InvalidMonthValue:
            logger.error('[get_oee_cycle_time] Invalid month value')
            raise HTTPException(status_code=400, detail="Invalid month value")
        except InvalidYearValue:
            logger.error('[get_oee_cycle_time] Invalid year value')
            raise HTTPException(status_code=400, detail="Invalid year value")
        except InvalidDayNight:
            logger.error('[get_oee_cycle_time] Invalid Day/Night value')
            raise HTTPException(status_code=400, detail="Invalid Day/Night value")
        except MissingSectionCode:
            logger.error('[get_oee_cycle_time] Section code cannot be found')
            raise HTTPException(status_code=400, detail="Section code cannot be found")
        except MissingCTLine:
            logger.error('[get_oee_cycle_time] c_line cannot be found')
            raise HTTPException(status_code=400, detail="Section code cannot be found")
        except Exception as e:
            logger.error(f'[get_oee_cycle_time] Error during get oee  cycle time => {e}')
            raise HTTPException(status_code=400, detail=" Error during get oee cycle time")

    @router.get("/fault_occurrence", response_model=OEEFaultOccurrenceReport, dependencies=[Depends(api_key_auth)])
    def get_oee_cycletime(product: str, line: str, date: int, month: int, year: int, period: Literal['Day', 'Night'], machine: str, mode: str = 'count'):
        try:
            conn_info_dict_fault_occur = _get_connection_info(product, line, product_line_db_oee_fault_occurrence)
            x_axis_all, x_axis_top_10, x_axis_top_20, y_axis_left_all, \
                y_axis_left_top_10, y_axis_left_top_20, y_axis_right_all, \
                y_axis_right_top_10, y_axis_right_top_20, mc_number_list_all, mc_number_list_top_10, mc_number_list_top_20 = oee_crud.get_fault_occurrence(date, month, year, period, machine, conn_info_dict_fault_occur, mode)
            return OEEFaultOccurrenceReport(
                x_axis_all=x_axis_all, x_axis_top_10=x_axis_top_10, x_axis_top_20=x_axis_top_20, y_axis_left_all=y_axis_left_all, y_axis_left_top_10=y_axis_left_top_10, y_axis_left_top_20=y_axis_left_top_20,
                y_axis_right_all=y_axis_right_all, y_axis_right_top_10=y_axis_right_top_10, y_axis_right_top_20=y_axis_right_top_20,
                mc_number_list_all=mc_number_list_all, mc_number_list_top_10=mc_number_list_top_10, mc_number_list_top_20=mc_number_list_top_20
            )
        except InvalidDateValue:
            logger.error('[get_oee_fault_occurrence] Invalid date value')
            raise HTTPException(status_code=400, detail="Invalid date value")
        except InvalidMonthValue:
            logger.error('[get_oee_fault_occurrence] Invalid month value')
            raise HTTPException(status_code=400, detail="Invalid month value")
        except InvalidYearValue:
            logger.error('[get_oee_fault_occurrence] Invalid year value')
            raise HTTPException(status_code=400, detail="Invalid year value")
        except InvalidDayNight:
            logger.error('[get_oee_fault_occurrence] Invalid Day/Night value')
            raise HTTPException(status_code=400, detail="Invalid Day/Night value")
        except MissingSectionCode:
            logger.error('[get_oee_fault_occurrence] Section code cannot be found')
            raise HTTPException(status_code=400, detail="Section code cannot be found")
        except Exception as e:
            logger.error(f'[get_oee_fault_occurrence] Error during get oee facult occurrence => {e}')
            raise HTTPException(status_code=400, detail=" Error during get oee facult occurrence")

    @router.get("/cycle_time_video")
    def get_oee_cycletime(n_mt_seq_to: int, range: str = Header(None)):
        ''' Streaming video from n_mt_seq_to
        '''
        CHUNK_SIZE = 1024*1024
        video_path = Path('/code/video.mp4')
        start, end = range.replace("bytes=", "").split("-")
        start = int(start)
        end = int(end) if end else start + CHUNK_SIZE

        with open(video_path, "rb") as video:
            video.seek(start)
            data = video.read(end - start)
            filesize = video_path.stat().st_size

            if end >= filesize:
                end = filesize - 1

            headers = {
                'Content-Range': f'bytes {str(start)}-{str(end)}/{str(filesize)}',
                'Accept-Ranges': 'bytes'
            }
            return Response(data, status_code=206, headers=headers, media_type="video/mp4")

    return router
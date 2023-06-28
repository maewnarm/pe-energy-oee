from pyodbc import Connection, Cursor
import json
from sqlalchemy.orm import Session
from app.exceptions import InvalidMonthValue, MissingLineInfo
from app.helpers import (
    convert_raw_statement_to_array_with_key,
    convert_array_to_dict_by_composite_columns,
)
from dotenv import dotenv_values

import logging

logger = logging.getLogger(__name__)

# load configuration from .env file
config = dotenv_values(".env")

with open(config["LINKAGE_FACTORY_ENERGY"]) as f:
    linkage_factory_energy = json.load(f)


class FactoryCRUD:
    def __init__(self):
        pass

    async def get_factory_energy_by_line_month(
        self, line: int, year: int, month: int, db: Connection = None
    ):
        if str(line) not in linkage_factory_energy:
            raise MissingLineInfo
        else:
            node_id = linkage_factory_energy[str(line)]
        if month < 1 or month > 12:
            raise InvalidMonthValue

        stmt = f"""
            SELECT date_trunc('minute',logtime) as logtime_,group_no,node_id,mea_type,avg(value) AS value FROM energy_tb_{year}_{month:02d}
            WHERE node_id IN ({",".join(node_id)})
            GROUP BY logtime_,group_no,node_id,mea_type
            ORDER BY logtime_
        """
        rs = convert_raw_statement_to_array_with_key(
            input=await db.execute(stmt), except_column=[]
        )
        return rs

    async def get_factory_energy_by_line_day(
        self, line: int, year: int, month: int, day: int, db: Connection = None
    ):
        if str(line) not in linkage_factory_energy:
            raise MissingLineInfo
        else:
            node_id = linkage_factory_energy[str(line)]
        if month < 1 or month > 12:
            raise InvalidMonthValue

        stmt = f"""
            SELECT date_trunc('minute',logtime) as logtime_,group_no,node_id,mea_type,avg(value) AS value FROM energy_tb_{year}_{month:02d}
            WHERE node_id IN ({",".join(node_id)}) AND 
            logtime BETWEEN '{year}-{month:02d}-{day:02d} 00:00:00+07:00' 
                AND '{year}-{month:02d}-{day:02d} 00:00:00+07:00'::TIMESTAMP WITH TIME ZONE + INTERVAL '1 DAY'
            GROUP BY logtime_,group_no,node_id,mea_type
            ORDER BY logtime_
        """
        print(stmt)
        rs = convert_raw_statement_to_array_with_key(
            input=await db.execute(stmt), except_column=[]
        )
        return rs

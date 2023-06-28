from pyodbc import Connection, Cursor
import json
from sqlalchemy.orm import Session
from app.exceptions import InvalidMonthValue, MissingLineInfo
from dotenv import dotenv_values

import logging

logger = logging.getLogger(__name__)

# load configuration from .env file
config = dotenv_values(".env")

with open(config["LINKAGE_LINEINFO"]) as f:
    linkage_lineinfo = json.load(f)


class LineinfoCRUD:
    def __init__(self):
        pass

    def _zip_data(self, cur: Cursor):
        columns = [r[0] for r in cur.description]
        data = [dict(zip(columns, r)) for r in cur.fetchall()]
        return data

    def get_all(self, db: Connection = None):
        stmt = f"""
            SELECT TOP 100 
                CAST(SectionCode AS NVARCHAR)SectionCode,
                CAST(WorkCenterCode AS NVARCHAR)WorkCenterCode,
                CAST(LineCode AS NVARCHAR)LineCode,
                CAST(LineName AS NVARCHAR)LineName,
                PlanDate,
                ProdPlan,
                ProdActual
            FROM [dbo].[vwDailySummary]
            ORDER BY SectionCode,WorkCenterCode,LineCode,PlanDate
        """
        rs = db.cursor().execute(stmt)
        data = self._zip_data(rs)
        return data

    def get_by_line_month(
        self, line: int, month: int, year: int, db: Connection = None
    ):
        if str(line) not in linkage_lineinfo:
            raise MissingLineInfo
        else:
            linecode = linkage_lineinfo[str(line)]
        if month < 1 or month > 12:
            raise InvalidMonthValue
        print(linecode)
        stmt = f"""
            SELECT 
                CAST(SectionCode AS NVARCHAR)SectionCode,
                CAST(WorkCenterCode AS NVARCHAR)WorkCenterCode,
                CAST(LineCode AS NVARCHAR)LineCode,
                CAST(LineName AS NVARCHAR)LineName,
                PlanDate,
                ProdPlan,
                ProdActual
            FROM [dbo].[vwDailySummary]
            WHERE LineCode = '{linecode}' AND MONTH(PlanDate) = {month} AND YEAR(PlanDate) = {year}
            ORDER BY SectionCode,WorkCenterCode,LineCode,PlanDate
        """
        rs = db.cursor().execute(stmt)
        data = self._zip_data(rs)
        return data

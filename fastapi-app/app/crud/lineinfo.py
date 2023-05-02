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

    def get_all(db: Session = None):
        stmt = f"""
            SELECT SectionCode,WorkCenterCode,LineCode,LineName,PlanDate,ProdPlan,ProdActual
            FROM [dbo].[vwDailySummary]
            ORDER BY SectionCode,WorkCenterCode,LineCode,PlanDate
        """
        rs = db.execute(stmt)
        data = [r for r in rs]
        return data

    def get_by_line_month(line: int, month: int, year: int, db: Session = None):
        if str(line) not in linkage_lineinfo:
            raise MissingLineInfo
        else:
            linecode = linkage_lineinfo[str(line)]
        if month < 1 or month > 12:
            raise InvalidMonthValue

        stmt = f"""
            SELECT SectionCode,WorkCenterCode,LineCode,LineName,PlanDate,ProdPlan,ProdActual
            FROM [dbo].[vwDailySummary]
            WHERE LineCode = '{linecode}' AND MONTH(PlanDate) = {month} AND YEAR(PlanDate) = {year}
            ORDER BY SectionCode,WorkCenterCode,LineCode,PlanDate
        """
        rs = db.execute(stmt)
        data = [r for r in rs]
        return data

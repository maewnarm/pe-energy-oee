import calendar
import datetime
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.manager import SocketClient
from app.exceptions import InvalidMonthValue, InvalidYearValue, InvalidDateValue
from app.helpers import (
    convert_raw_statement_to_array_with_key,
    convert_array_to_dict_by_composite_columns,
)

import logging

logger = logging.getLogger(__name__)


class AirCRUD:
    # this class continas methods to get data for report
    #   each method queries raw data and transform them to x, y axis data
    def __init__(self):
        pass

    async def get_air_consumption_daily(
        self,
        machine_info_dict: dict,
        date: int,
        month: int,
        year: int,
        db: AsyncSession,
    ) -> list:
        # this function gets data for daily report

        # validate correct data type
        assert isinstance(
            machine_info_dict, dict
        ), f"[get_air_consumption_daily] machine_info_dict is not a dictionary"
        assert isinstance(date, int), f"[get_air_consumption_daily] date is not int"
        assert isinstance(month, int), f"[get_air_consumption_daily] month is not int"
        assert isinstance(year, int), f"[get_air_consumption_daily] year is not int"
        assert isinstance(
            db, AsyncSession
        ), f"[get_air_consumption_daily] year is not AsyncSession"

        valve_id_list = [int(x) for x in list(machine_info_dict.keys())]
        valve_id_list_str = str(set(valve_id_list))

        # get current year as numer
        current_year = datetime.datetime.now().year

        # validate month is valid (between 1 and 12)
        if month < 1 or month > 12:
            raise InvalidMonthValue()

        # validate year is valid (in the future)
        if year > current_year:
            raise InvalidYearValue()

        # date_Range will tell the last date of the month
        date_range = calendar.monthrange(year, month)

        # validate date value in the range of valid date
        if date < 0 or date > date_range[1]:
            raise InvalidDateValue()

        # construdt datetime  object using date, month, year
        query_datetime = datetime.datetime(year, month, date)

        # create query to get daily data for air_consumption
        stmt = f"""
        SELECT TO_CHAR(air_timestamp, 'HH24:MI') as time, air_value, valve_unit_id as valve_id
        FROM air_consumption
        WHERE TO_CHAR(air_timestamp, 'YYYY-MM-DD') = '{query_datetime.strftime('%Y-%m-%d')}'
                AND valve_unit_id = ANY('{valve_id_list_str}')
        ORDER BY time, valve_unit_id ASC
        """
        rs = convert_raw_statement_to_array_with_key(
            input=await db.execute(stmt), except_column=[]
        )
        rs = convert_array_to_dict_by_composite_columns(rs, ["time", "valve_id"])

        # define list of x-axis and y-axis
        #   x-axis is the list contains time (every 15 mins)
        #   y-axis is the list of dictionary
        #       each dict map valve_id to the value
        x_axis = []
        y_axis = []

        # initial start time of the date
        #   start_time_tick = 00:00:00
        #   cur_time_time = time at tach x-axis (initial with start_time_tick)
        #   td = time delta which is used as criteria to stop the loop (time delta > 86400)
        # also define a variable to accumulate daily total value
        start_time_tick = datetime.datetime(year, month, date, 0, 0, 0, 0)
        cur_time_tick = start_time_tick
        td = cur_time_tick - start_time_tick
        total = 0.0

        # iterate for each time tick
        #   end iteration if the time delta (from start time) > 86400
        while td.total_seconds() < 86400:
            # get x-axis label in format of HOUR:MINUTE
            # and inittal y-axis with empty dictionary
            x_str = cur_time_tick.strftime("%H:%M")
            x_axis.append(x_str)
            y_axis.append({})

            # for each valve_id
            for valve_id in valve_id_list:
                # check if data at this mc exist or not
                #   if yes, get value and put in the y_axis
                #   otherwise, make it as 0
                rs_key = (x_str, valve_id)
                mc = machine_info_dict[valve_id]["mc_no"]
                if rs_key in rs:
                    y_axis[-1][f"{mc}"] = rs[rs_key]["air_value"]
                    total += float(rs[rs_key]["air_value"])
                else:
                    y_axis[-1][f"{mc}"] = 0

            # adjust time tick to next 15 minutes and update time delta
            cur_time_tick = cur_time_tick + datetime.timedelta(minutes=15)
            td = cur_time_tick - start_time_tick

        return x_axis, y_axis, total

    async def get_air_consumption_monthly(
        self, machine_info_dict: dict, month: int, year: int, db: AsyncSession = None
    ) -> list:
        # validate correct data type
        assert isinstance(
            machine_info_dict, dict
        ), f"[get_air_consumption_daily] machine_info_dict is not a dictionary"
        assert isinstance(month, int), f"[get_air_consumption_daily] month is not int"
        assert isinstance(year, int), f"[get_air_consumption_daily] year is not int"
        assert isinstance(
            db, AsyncSession
        ), f"[get_air_consumption_daily] year is not AsyncSession"

        valve_id_list = [int(x) for x in list(machine_info_dict.keys())]
        valve_id_list_str = str(set(valve_id_list))

        # get current year of the query
        current_year = datetime.datetime.now().year

        #  ensure that the month value is valid for query
        if month < 1 or month > 12:
            raise InvalidMonthValue()

        # ensure that the year value is valid for query
        if year > current_year:
            raise InvalidYearValue()

        # get start and end date of the month to be queried
        date_range = calendar.monthrange(year, month)
        begin_date = datetime.datetime(year, month, 1)
        end_date = datetime.datetime(year, month, date_range[1])

        # get data for the specific date and specific machines
        stmt = f"""
        SELECT date(air_timestamp) as date, sum(air_value) as sum_air_value , valve_unit_id as valve_id
        FROM air_consumption
        WHERE air_timestamp BETWEEN '{begin_date}' AND '{end_date}'
                    AND valve_unit_id = ANY('{valve_id_list_str}')
        GROUP BY date(air_timestamp), valve_unit_id
        ORDER BY date, valve_unit_id ASC
        """
        rs = convert_raw_statement_to_array_with_key(
            input=await db.execute(stmt), except_column=[]
        )
        rs = convert_array_to_dict_by_composite_columns(rs, ["date", "valve_id"])

        # define list of x-axis and y-axis
        #   x-axis is the list contains date
        #   y-axis is the list of dictionary
        #       each dict map mc_number to the value
        #   total is the accumulate of all values
        x_axis = []
        y_axis = []
        total = 0.0

        # for each date from 1 to the end of the month
        for d in range(1, date_range[1] + 1):
            # get x-axis label in format of DD-MM-YYYY
            # and inittal y-axis with empty dictionary
            x_date = datetime.date(year, month, d)
            x_str = x_date.strftime("%d-%b-%Y")
            x_axis.append(x_str)
            y_axis.append({})

            # for each valve id
            for valve_id in valve_id_list:
                # check if data at this mc exist or not
                #   if yes, get value and put in the y_axis
                #   otherwise, make it as 0
                rs_key = (x_date, valve_id)
                mc = machine_info_dict[valve_id]["mc_no"]
                if rs_key in rs:
                    y_axis[-1][f"{mc}"] = rs[rs_key]["sum_air_value"]
                    total += float(rs[rs_key]["sum_air_value"])
                else:
                    y_axis[-1][f"{mc}"] = 0

        return x_axis, y_axis, total

    async def get_air_consumption_yearly(
        self, machine_info_dict: dict, year: int, db: AsyncSession = None
    ) -> list:
        # this function get air consumption for yearly report

        # validate correct data type
        assert isinstance(
            machine_info_dict, dict
        ), f"[get_air_consumption_daily] machine_info_dict is not a dictionary"
        assert isinstance(year, int), f"[get_air_consumption_daily] year is not int"
        assert isinstance(
            db, AsyncSession
        ), f"[get_air_consumption_daily] year is not AsyncSession"

        valve_id_list = [int(x) for x in list(machine_info_dict.keys())]
        valve_id_list_str = str(set(valve_id_list))

        # get current year of the query
        current_year = datetime.datetime.now().year

        # check that the input year is valid
        if year > current_year:
            raise InvalidYearValue()

        # create datetime for the begin and end date of the year
        begin_date = datetime.datetime(year, 1, 1)
        end_date = datetime.datetime(year, 12, 31)

        # get data for the specific date and specific machines
        stmt = f"""
        SELECT TO_CHAR(air_timestamp, 'YYYY-MM') as month, sum(air_value) as sum_air_value, valve_unit_id as valve_id
        FROM air_consumption
        WHERE air_timestamp BETWEEN '{begin_date}' AND '{end_date}'
                    AND valve_unit_id = ANY('{valve_id_list_str}')
        GROUP BY TO_CHAR(air_timestamp, 'YYYY-MM'), valve_unit_id
        ORDER BY month, valve_unit_id ASC
        """
        rs = convert_raw_statement_to_array_with_key(
            input=await db.execute(stmt), except_column=[]
        )
        rs = convert_array_to_dict_by_composite_columns(rs, ["month", "valve_id"])

        # define list of x-axis and y-axis
        #   x-axis is the list contains date
        #   y-axis is the list of dictionary
        #       each dict map mc_number to the value
        #   total is the accumulate of all values
        x_axis = []
        y_axis = []
        total = 0.0

        # for each month
        for m in range(1, 13):
            # get x-axis label in format of DD-MM-YYYY
            # and inittal y-axis with empty dictionary
            x_date = datetime.date(year, m, 1)
            x_str = x_date.strftime("%b")
            x_axis.append(x_str)
            y_axis.append({})

            # for each valve id
            for valve_id in valve_id_list:
                # check if data at this mc exist or not
                #   if yes, get value and put in the y_axis
                #   otherwise, make it as 0
                rs_key = (x_date.strftime("%Y-%m"), valve_id)
                mc = machine_info_dict[valve_id]["mc_no"]
                if rs_key in rs:
                    y_axis[-1][f"{mc}"] = rs[rs_key]["sum_air_value"]
                    total += float(rs[rs_key]["sum_air_value"])
                else:
                    y_axis[-1][f"{mc}"] = 0
        return x_axis, y_axis, total

    def get_air_realtime(
        self, machine_info_dict: dict, keep_interval_secs: int = 0, latest_mins: int = 1
    ) -> list:
        # get latest air_data
        air_data = []

        # get valve_id_list
        valve_id_list = [int(x) for x in list(machine_info_dict.keys())]

        # define list of x-axis and y-axis
        #   x-axis is the list contains date
        #   y-axis is the list of dictionary
        #       each dict map mc_number to the value
        x_axis = []
        y_axis = []

        # initial start time of the date
        #   start_time_tick = current time - lastest_min mins
        #   cur_time_time = time at tach x-axis (initial with start_time_tick)
        #   td = time delta which is used as criteria to stop the loop {latest_mins * 60}
        start_time_tick = datetime.datetime.now() - datetime.timedelta(
            minutes=latest_mins
        )
        cur_time_tick = start_time_tick
        td = cur_time_tick - start_time_tick

        # iterate for each time tick
        #   end iteration if the time delta (from start time) > 600
        while td.total_seconds() <= latest_mins * 60:
            # get x-axis label in format of HOUR:MINUTE:SECOND
            # and inittal y-axis with empty dictionary
            x_str = cur_time_tick.strftime("%H:%M:%S")
            x_axis.append(x_str)
            y_axis.append({})

            # for each machine number,
            #    if keep_interval_sec is 0 and value is in the query => use it
            #    otherwise, set to 0
            for valve_id in valve_id_list:
                mc = machine_info_dict[valve_id]["mc_no"]
                if (x_str, valve_id) in air_data:
                    y_axis[-1][f"{mc}"] = air_data[(x_str, valve_id)]
                else:
                    y_axis[-1][f"{mc}"] = 0
            cur_time_tick = cur_time_tick + datetime.timedelta(seconds=1)
            td = cur_time_tick - start_time_tick

        #    if keep_interval_sec > 0, use last value in the interval
        if keep_interval_secs > 0:
            for idx, x in enumerate(x_axis):
                for mc_name in y_axis[idx]:
                    mc_id = mc_name
                    if (x, mc_id) in air_data:
                        y_axis[idx][mc_name] = air_data[(x, mc_id)]
                    else:
                        x_time = datetime.datetime.strptime(x, "%H:%M:%S")
                        for delta in range(1, keep_interval_secs + 1):
                            keep_time = x_time - datetime.timedelta(seconds=delta)
                            keep_time_str = keep_time.strftime("%H:%M:%S")
                            if (keep_time_str, mc_id) in air_data:
                                y_axis[idx][mc_name] = air_data[(keep_time_str, mc_id)]
                                break
        # get data for race chart
        # it is the lastest data for each id which value is not 0 (if possible)
        race_data = []
        for valve_id, machine_info in machine_info_dict.items():
            race_data.append({"x-axis": f"{machine_info['mc_no']}", "y-axis": 0.0})
            for y in y_axis[::-1]:
                if y[machine_info["mc_no"]] > 0:
                    race_data[-1]["y-axis"] = y[machine_info["mc_no"]]
                    break
        race_data = sorted(race_data, key=lambda i: i["y-axis"], reverse=True)
        return x_axis, y_axis, race_data

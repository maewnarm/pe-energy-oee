import calendar
import datetime
from platform import machine
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.manager import SocketClient
from app.exceptions import InvalidMonthValue, InvalidYearValue, InvalidDateValue
from app.helpers import (
    convert_raw_statement_to_array_with_key, convert_array_to_dict_by_composite_columns
)

import logging
logger = logging.getLogger(__name__)

class EnergyCRUD:
    def __init__(self):
        pass

    async def get_energy_consumption_daily(
            self, machine_info_dict: dict, date: int, month: int, year: int, db: AsyncSession = None
        ) -> List:
            # this function get energy consumption for daily report

            # validate correct data type
            assert isinstance(machine_info_dict, dict), f'[get_energy_consumption_daily] machine_info_dict is not a dictionary'
            assert isinstance(date, int), f'[get_energy_consumption_daily] date is not int'
            assert isinstance(month, int), f'[get_energy_consumption_daily] month is not int'
            assert isinstance(year, int), f'[get_energy_consumption_daily] year is not int'
            assert isinstance(db, AsyncSession), f'[get_energy_consumption_daily] year is not AsyncSession'

            breaker_id_list =[x for x in list(machine_info_dict.keys())]
            breaker_id_list_str = str(set(breaker_id_list))

            # get current year of the query
            current_year = datetime.datetime.now().year

            # ensure that the month value is valid for query
            if month < 1 or month > 12:
                raise InvalidMonthValue()

            # ensure that the year value is valid for query
            if year > current_year:
                raise InvalidYearValue()

            # get date range in this month in order to know the last date of this month
            date_range = calendar.monthrange(year, month)

            # ensure that the date is valid
            if date < 0 or date > date_range[1]:
                raise InvalidDateValue()

            # construct datetime object for the date to get report
            query_datetime = datetime.datetime(year, month, date)

            # get data for the specific date and specific machines
            stmt = f"""
            SELECT TO_CHAR(energy_timestamp, 'HH24:MI') as time, energy_value, breaker_unit_id as breaker_id
            FROM energy_power
            WHERE TO_CHAR(energy_timestamp, 'YYYY-MM-DD') = '{query_datetime.strftime('%Y-%m-%d')}'
                    AND breaker_unit_id = ANY('{breaker_id_list_str}')
            ORDER BY time, breaker_unit_id ASC
            """
            rs = convert_raw_statement_to_array_with_key(
                input=await db.execute(stmt), except_column=[]
            )
            rs = convert_array_to_dict_by_composite_columns(rs, ['time', 'breaker_id'])

            # define list of x-axis and y-axis
            #   x-axis is the list contains time (every 15 mins)
            #   y-axis is the list of dictionary
            #       each dict map mc_number to the value
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
                x_str = cur_time_tick.strftime('%H:%M')
                x_axis.append(x_str)
                y_axis.append({})
                
                # for each breaker_id
                for breaker_id in breaker_id_list:

                    # check if data at this mc exist or not
                    #   if yes, get value and put in the y_axis
                    #   otherwise, make it as 0
                    rs_key = (x_str, breaker_id)
                    mc = machine_info_dict[breaker_id]['mc_no']
                    if rs_key in rs:
                        y_axis[-1][f'{mc}'] = rs[rs_key]['energy_value']
                        total += float(rs[rs_key]['energy_value'])
                    else:
                        y_axis[-1][f'{mc}'] = 0

                # adjust time tick to next 15 minutes and update time delta
                cur_time_tick = cur_time_tick + datetime.timedelta(minutes=15)
                td = cur_time_tick - start_time_tick

            return x_axis, y_axis, total

    async def get_energy_consumption_monthly(
            self, machine_info_dict: dict, month: int, year: int, db: AsyncSession = None
        ) -> List:
            # this function get energy consumption for daily report

            # validate correct data type
            assert isinstance(machine_info_dict, dict), f'[get_energy_consumption_daily] machine_info_dict is not a dictionary'
            assert isinstance(month, int), f'[get_energy_consumption_daily] month is not int'
            assert isinstance(year, int), f'[get_energy_consumption_daily] year is not int'
            assert isinstance(db, AsyncSession), f'[get_energy_consumption_daily] year is not AsyncSession'

            breaker_id_list =[x for x in list(machine_info_dict.keys())]
            breaker_id_list_str = str(set(breaker_id_list))

            # get current year of the query
            current_year = datetime.datetime.now().year

            # ensure that the month value is valid for query
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
            SELECT date(energy_timestamp) as date, sum(energy_value) as sum_energy_value ,breaker_unit_id as breaker_id
            FROM energy_power
            WHERE energy_timestamp BETWEEN '{begin_date}' AND '{end_date}'
                    AND breaker_unit_id = ANY('{breaker_id_list_str}')
            GROUP BY date(energy_timestamp), breaker_unit_id
            ORDER BY date, breaker_unit_id ASC
            """
            rs = convert_raw_statement_to_array_with_key(
                input=await db.execute(stmt), except_column=[]
            )
            rs = convert_array_to_dict_by_composite_columns(rs, ['date', 'breaker_id'])

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
                x_str = x_date.strftime('%d-%b-%Y')
                x_axis.append(x_str)
                y_axis.append({})

                # for each breaker_id
                for breaker_id in breaker_id_list:

                    # check if data at this mc exist or not
                    #   if yes, get value and put in the y_axis
                    #   otherwise, make it as 0
                    rs_key = (x_date, breaker_id)
                    mc = machine_info_dict[breaker_id]['mc_no']
                    if rs_key in rs:
                        y_axis[-1][f'{mc}'] = rs[rs_key]['sum_energy_value']
                        total += float(rs[rs_key]['sum_energy_value'])
                    else:
                        y_axis[-1][f'{mc}'] = 0

            return x_axis, y_axis, total

    async def get_energy_consumption_yearly(
            self, machine_info_dict: dict, year: int, db: AsyncSession = None
        ) -> List:
            # this function get energy consumption for yearly report

            # validate correct data type
            assert isinstance(machine_info_dict, dict), f'[get_energy_consumption_daily] machine_info_dict is not a dictionary'
            assert isinstance(year, int), f'[get_energy_consumption_daily] year is not int'
            assert isinstance(db, AsyncSession), f'[get_energy_consumption_daily] year is not AsyncSession'

            breaker_id_list =[x for x in list(machine_info_dict.keys())]
            breaker_id_list_str = str(set(breaker_id_list))

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
            SELECT TO_CHAR(energy_timestamp, 'YYYY-MM') as month, sum(energy_value) as sum_energy_value, breaker_unit_id as breaker_id
            FROM energy_power
            WHERE energy_timestamp BETWEEN '{begin_date}' AND '{end_date}'
                    AND breaker_unit_id = ANY('{breaker_id_list_str}')
            GROUP BY TO_CHAR(energy_timestamp, 'YYYY-MM'), breaker_unit_id
            ORDER BY month, breaker_unit_id ASC
            """
            rs = convert_raw_statement_to_array_with_key(
                input=await db.execute(stmt), except_column=[]
            )
            rs = convert_array_to_dict_by_composite_columns(rs, ['month', 'breaker_id'])

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
                x_str = x_date.strftime('%b')
                x_axis.append(x_str)
                y_axis.append({})

                # for each breaker_id
                for breaker_id in breaker_id_list:
                    # check if data at this mc exist or not
                    #   if yes, get value and put in the y_axis
                    #   otherwise, make it as 0
                    rs_key = (x_date.strftime('%Y-%m'), breaker_id)
                    mc = machine_info_dict[breaker_id]['mc_no']
                    if rs_key in rs:
                        y_axis[-1][f'{mc}'] = rs[rs_key]['sum_energy_value']
                        total += float(rs[rs_key]['sum_energy_value'])
                    else:
                        y_axis[-1][f'{mc}'] = 0
            return x_axis, y_axis, total

    def get_energy_realtime(
            self, socketClient: SocketClient, machine_info_dict: dict, keep_interval_secs: int = 0, latest_mins: int = 1
        ) -> list:

        # get latest energy_data
        energy_data = socketClient.latest_energy_data

        breaker_id_list =[x for x in list(machine_info_dict.keys())]

        # define list of x-axis and y-axis
        #   x-axis is the list contains date
        #   y-axis is the list of dictionary
        #       each dict map mc_number to the value
        x_axis = []
        y_axis = []

        # initial start time of the date
        #   start_time_tick = current time - {latest_mins} mins
        #   cur_time_time = time at tach x-axis (initial with start_time_tick)
        #   td = time delta which is used as criteria to stop the loop (time delta > {latest_mins * 60})
        start_time_tick = datetime.datetime.now() - datetime.timedelta(minutes=latest_mins)
        cur_time_tick = start_time_tick
        td = cur_time_tick - start_time_tick

        # iterate for each time tick
        #   end iteration if the time delta (from start time) > 600
        while td.total_seconds() <= latest_mins * 60:

            # get x-axis label in format of HOUR:MINUTE:SECOND
            # and inittal y-axis with empty dictionary
            x_str = cur_time_tick.strftime('%H:%M:%S')
            x_axis.append(x_str)
            y_axis.append({})

            # for each machine number,
            #    if keep_interval_sec is 0 and value is in the query => use it
            #    otherwise, set to 0 
            for breaker_id in breaker_id_list:
                mc = machine_info_dict[breaker_id]['mc_no']
                if (x_str, breaker_id) in energy_data:
                    y_axis[-1][f'{mc}'] = energy_data[(x_str, breaker_id)]
                else:
                    y_axis[-1][f'{mc}'] = 0
            cur_time_tick = cur_time_tick + datetime.timedelta(seconds=1)
            td = cur_time_tick - start_time_tick

        #    if keep_interval_sec > 0, use last value in the interval
        if keep_interval_secs > 0:
            for idx, x in enumerate(x_axis):
                for mc_name in y_axis[idx]:
                    mc_id = mc_name
                    if (x, mc_id) in energy_data:
                        y_axis[idx][mc_name] = energy_data[(x, mc_id)]
                    else:
                        x_time = datetime.datetime.strptime(x, '%H:%M:%S')
                        for delta in range(1, keep_interval_secs+1):
                            keep_time = x_time - datetime.timedelta(seconds=delta)
                            keep_time_str = keep_time.strftime('%H:%M:%S')
                            if (keep_time_str, mc_id) in energy_data:
                                y_axis[idx][mc_name] = energy_data[(keep_time_str, mc_id)]
                                break
        # get data for race chart
        # it is the lastest data for each id which value is not 0 (if possible)
        race_data = []
        for breaker_id, machine_info in machine_info_dict.items():
            race_data.append({
                'x-axis': f"{machine_info['mc_no']}",
                'y-axis': 0.0
            })
            for y in y_axis[::-1]:
                if y[machine_info['mc_no']] > 0:
                    race_data[-1]['y-axis'] = y[machine_info['mc_no']]
                    break
        race_data = sorted(race_data, key=lambda i: i['y-axis'], reverse = True)

        return x_axis, y_axis, race_data
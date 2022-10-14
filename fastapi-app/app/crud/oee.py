from importlib.resources import path
import math
import random
import datetime
import calendar
import json
from unittest.loader import VALID_MODULE_NAME
import pyodbc
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from typing import Optional, Tuple, Literal, List, Dict
from fastapi.exceptions import HTTPException
from app.exceptions import InvalidDateValue, InvalidMonthValue, InvalidYearValue, InvalidDayNight, MissingSectionCode, MissingCTLine
from dotenv import dotenv_values

import logging
logger = logging.getLogger(__name__)

# load configuration from .env file
config = dotenv_values(".env")

with open(config['LINKAGE1']) as f:
    linkage_cycletime = json.load(f)

with open(config['LINKAGE2']) as f:
    linkage_fault_occur = json.load(f)

def _query_data_postgres(query_stmt: str, db_user: str, db_pass: str, db_server: str, db_port: str, db_name: str) -> Dict:
    DSN = f'dbname={db_name} user={db_user} password={db_pass} host={db_server} port={db_port}'
    connection = psycopg2.connect(DSN) 
    connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 
    cur = connection.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
    query_data_list = []
    try:
        # execut sql
        cur.execute(query_stmt)
        rs = cur.fetchall()
        for row in rs:
            dict_row = dict(row)
            query_data_list.append(dict_row)
        connection.close()
        return query_data_list
    except Exception as e:
        logger.error(f'[oee_crud] error during get data from postgresql => {e}')
        logger.error(query_stmt)
        raise HTTPException(status_code=400, detail=f'error during get data from postgresql')

def _query_data_mssql(query_stmt: str, db_user: str, db_pass: str, db_server: str, db_port: str, db_name: str) -> Dict:
    db_server = f'{db_server},{db_port}'
    cnxn = pyodbc.connect('DRIVER={ODBC Driver 18 for SQL Server};Encrypt=no;SERVER='+db_server+';DATABASE='+db_name+';ENCRYPT=yes;UID='+db_user+';PWD='+ db_pass)
    query_data_list = []
    try:
        # execut sql
        cursor =  cnxn.cursor().execute(query_stmt)
        columns = [column[0] for column in cursor.description]
        for row in cursor.fetchall():
           query_data_list.append(dict(zip(columns, row)))
        cnxn.close()
        return query_data_list
    except Exception as e:
        logger.error(f'[oee_crud] error during get data from mssql => {e}')
        logger.error(query_stmt)
        raise HTTPException(status_code=400, detail=f'error during get data from postgresql')

class OEECRUD:
    def __init__(self):
        pass

    def get_operators(self, conn_info_dict)->List:
        # get db connection
        try:
            db_user = conn_info_dict['db_user']
            db_pass = conn_info_dict['db_pass']
            db_server = conn_info_dict['db_server']
            db_port = conn_info_dict['db_port']
            db_name = conn_info_dict['db_name']
            db_provider = conn_info_dict['db_provider']
            line_id = conn_info_dict['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')
        
        # get c_line
        if str(line_id) not in linkage_cycletime:
            raise MissingCTLine
        else:
            c_line = linkage_cycletime[str(line_id)]

        # get all operators
        stmt = f"SELECT DISTINCT(c_op) from m_operator WHERE c_line = '{c_line}' ORDER BY c_op ASC"
        if db_provider == 'postgresql':
            operator_list_dict = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            operator_list_dict = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')
        operator_list = [x['c_op'] for x in operator_list_dict if x['c_op'] is not None]
        return operator_list

    def get_machines(self, conn_info_dict)->List:
        # get db connection
        try:
            db_user = conn_info_dict['db_user']
            db_pass = conn_info_dict['db_pass']
            db_server = conn_info_dict['db_server']
            db_port = conn_info_dict['db_port']
            db_name = conn_info_dict['db_name']
            db_provider = conn_info_dict['db_provider']
            line_id = conn_info_dict['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')
        
        # get section_code
        if str(line_id) not in linkage_fault_occur:
            raise MissingSectionCode
        else:
            sectionCode = linkage_fault_occur[str(line_id)]

        # get all operators
        stmt = f"SELECT DISTINCT(MCNumber) from Loss_RecordTable WHERE sectionCode = '{sectionCode}' ORDER BY MCNumber"
        if db_provider == 'postgresql':
            machine_list_dict = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            machine_list_dict = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')
        machine_list = [x['MCNumber'] for x in machine_list_dict if x['MCNumber'] is not None]
        return machine_list

    def get_production(self, date: int, month: int, year: int, period: Literal['Day', 'Night'], conn_info_dict: Dict[str, str])->Tuple:
        
        # get db connection
        try:
            db_user = conn_info_dict['db_user']
            db_pass = conn_info_dict['db_pass']
            db_server = conn_info_dict['db_server']
            db_port = conn_info_dict['db_port']
            db_name = conn_info_dict['db_name']
            db_provider = conn_info_dict['db_provider']
            line_id = conn_info_dict['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')

        # map Day, Night to D, N
        dayNight = period[0] if period == 'Day' or period == 'Night' else None
        if dayNight is None:
            raise InvalidDayNight

        # get time now
        now = datetime.datetime.now()
        query_date = datetime.datetime(year, month, date)

        # if query year is more than now, it is invalid
        if query_date.year > now.year:
            raise InvalidYearValue

        # if same year but month is more than now
        if (query_date.year == now.year and query_date.month > now.month) or month < 1 or month > 12:
            raise InvalidMonthValue

        # get date range in this month in order to know the last date of this month
        date_range = calendar.monthrange(year, month)

        # ensure that the date is valid
        if date < 0 or date > date_range[1]:
            raise InvalidDateValue()

        # get section_code
        if str(line_id) not in linkage_fault_occur:
            raise MissingSectionCode
        else:
            sectionCode = linkage_fault_occur[str(line_id)]

        # get data from db on the date and period
        stmt  = f"""
            SELECT * FROM Prod_PPASTable WHERE dayNight = '{dayNight}' and registDate = '{query_date.strftime('%Y-%m-%d')}' and sectionCode = '{sectionCode}' ORDER BY hour ASC
        """
        if db_provider == 'postgresql':
            production_data = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            production_data = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')

        # get dekidaka table
        dekidaka = []
        sumVolPerHr = 0
        accPlan = 0
        for prod_data in production_data:
            
            # split time period
            time_period = prod_data['monitor']
            time_period_split = time_period.split('-')
            start_time = time_period_split[0].strip()
            end_time = time_period_split[1].strip()

            # if cannot get prod_data (which should not be this case), set all to zero
            if prod_data is None:
                dekidaka.append({
                    'period': time_period,
                    'volumePerHr': '0',
                    'plan': '0',
                    'accPlan': '0',
                    'percent': '0.00'
                })
            else:
                data_datetime_start = datetime.datetime.strptime(f"{prod_data['registDate']} {start_time}", '%Y-%m-%d %H:%M')
                data_datetime_end = datetime.datetime.strptime(f"{prod_data['registDate']} {end_time}", '%Y-%m-%d %H:%M')

                # if prod_data['hour'] >= 15, we have to shift 1 day
                if prod_data['hour'] >= 15:
                    data_datetime_start += datetime.timedelta(days=1)
                    data_datetime_end += datetime.timedelta(days=1)

                # if query_date is before this period, we show as -
                if now < data_datetime_start:
                    dekidaka.append({
                        'period': time_period,
                        'volumePerHr': '-',
                        'plan': '-',
                        'accPlan': '-',
                        'percent': '-'
                    })
                # if query_datet is after this period, we have all data
                elif now > data_datetime_end:
                    dekidaka.append({
                        'period': time_period,
                        'volumePerHr': str(prod_data['volumePerHr']),
                        'plan': str(prod_data['plan100']),
                        'accPlan': str(prod_data['accPlan']),
                        'percent': "{:.2f}".format(prod_data['volumePerHr'] * 100/prod_data['plan100']) if prod_data['plan100'] != 0 else '-'
                    })
                    sumVolPerHr += prod_data['volumePerHr']
                    accPlan = prod_data['accPlan']
                # otherwise, calcualate current production
                else:
                    time_delta = query_date - data_datetime_start
                    time_delta_secs = time_delta.seconds

                    formula1 = ((time_delta_secs * 100) / prod_data['period']) + accPlan
                    dekidaka.append({
                        'period': time_period,
                        'volumePerHr': str(prod_data['volumePerHr']),
                        'plan': str(prod_data['plan100']),
                        'accPlan': str(prod_data['accPlan']),
                        'percent': "{:.2f}".format(prod_data['volumePerHr'] * 100/prod_data['plan100'])
                    })
                    sumVolPerHr += prod_data['volumePerHr']
                    accPlan = formula1
        p = "{:.2f}".format(sumVolPerHr * 100/accPlan) if accPlan != 0 else '-'
        return str(sumVolPerHr), str(accPlan), p, dekidaka
    
    def get_cycletime(self, date: int, month: int, year: int, period: Literal['Day', 'Night'], operator: str, conn_info_dict_cycletime: Dict[str, str], conn_info_dict_fault_occur: Dict[str, str])->Tuple: 
        
        # get data for target
        # get db connection
        try:
            db_user = conn_info_dict_fault_occur['db_user']
            db_pass = conn_info_dict_fault_occur['db_pass']
            db_server = conn_info_dict_fault_occur['db_server']
            db_port = conn_info_dict_fault_occur['db_port']
            db_name = conn_info_dict_fault_occur['db_name']
            db_provider = conn_info_dict_fault_occur['db_provider']
            line_id = conn_info_dict_fault_occur['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')

        # get section_code
        if str(line_id) not in linkage_fault_occur:
            raise MissingSectionCode
        else:
            sectionCode = linkage_fault_occur[str(line_id)]

        stmt  = f"""
            SELECT cycleTimeAverage FROM Prod_StdYearlyTable WHERE registYear = '{year}' AND registMonth = '{str(month).rjust(2, '0')}' AND sectionCode = '{sectionCode}'
        """
        if db_provider == 'postgresql':
            data = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            data = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')

        target = data[0].get('cycleTimeAverage', None)

        # get data for chart
        try:
            db_user = conn_info_dict_cycletime['db_user']
            db_pass = conn_info_dict_cycletime['db_pass']
            db_server = conn_info_dict_cycletime['db_server']
            db_port = conn_info_dict_cycletime['db_port']
            db_name = conn_info_dict_cycletime['db_name']
            db_provider = conn_info_dict_cycletime['db_provider']
            line_id = conn_info_dict_cycletime['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')

        # get c_line
        if str(line_id) not in linkage_cycletime:
            raise MissingCTLine
        else:
            c_line = linkage_cycletime[str(line_id)]

        # construct condition for datetime
        if period == 'Day':
            start = datetime.datetime(year, month, date, 7, 30)
            end = datetime.datetime(year, month, date, 19,29)
        else:
            start = datetime.datetime(year, month, date, 19, 30)
            end = datetime.datetime(year, month, date, 7,29)
            end = end + datetime.timedelta(days=1)

        now = datetime.datetime.now()
        now_end_delta = now - end
        now_end_days = now_end_delta.days

        stmt = f"""
            SELECT tct.n_ct as n_ct, tct.d_insert_datetime as d_insert_datetime, tct.n_mt_seq_to as n_mt_seq_to, tc.s_save_relative_path, tc.s_save_file
            FROM t_cycletime tct
            JOIN t_machinetime_history tmh
            ON tct.n_mt_seq_to = tmh.n_mt_seq
            JOIN  t_camera tc 
            ON tmh.n_seq = tc.n_seq
            WHERE tct.c_line = '{c_line}' AND tct.c_op = '{operator}' AND tct.d_insert_datetime >= '{start}' AND tct.d_insert_datetime <= '{end}'  
            ORDER BY d_insert_datetime ASC
        """

        if db_provider == 'postgresql':
            cycletime_data = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            cycletime_data = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')

        # outlier removal
        idx = 0
        logger.debug('Before remove outlier')
        while idx < len(cycletime_data):
            data = cycletime_data[idx]
            if math.fabs(float(data['n_ct']) - float(target)) > 3 * float(target):
                del cycletime_data[idx]
            else:
                idx += 1

        # if query date is similar to now, select last 100 samples
        # otherwise, sample for 100 samples
        now = datetime.datetime.now()
        if now.date == date and now.month == month and now.year == year:
            chart_data = cycletime_data[-100:]
        else:
            if len(cycletime_data) <= 100:
                chart_data = cycletime_data
            else:
                num_data = len(cycletime_data)
                step = num_data // 100
                chart_data = []
                idx = step
                while len(chart_data) < 100 and idx < len(cycletime_data):
                    chart_data.append(cycletime_data[idx])
                    idx += step

        # transform data to x and y axis
        x_axis = []
        y_axis = []
        video_url = []
        has_video = []
        for data in chart_data:
            x_axis.append(data['d_insert_datetime'].strftime('%H:%M:%S'))
            y_axis.append(float(data['n_ct']))
            found_video = False if data['s_save_file'] is None and data['s_save_relative_path'] is not None else True
            got_video = found_video and now_end_days < 31
            if got_video:
                rel_path = data['s_save_relative_path'].replace('\\', '/')
                url = f"http://{db_server}:8080/{rel_path}/{data['s_save_file']}"
                # url = f"http://{db_server}:33333/video.mp4"
            else:
                url = None
            video_url.append(url)
            has_video.append(got_video)
        return x_axis, y_axis, target, video_url, has_video

    def get_fault_occurrence(self, date: int, month: int, year: int, period: Literal['Day', 'Night'], machine: str, conn_info_dict_fault_occur: Dict[str, str], mode: str = 'count')->Tuple:
        # get data for target
        # get db connection
        try:
            db_user = conn_info_dict_fault_occur['db_user']
            db_pass = conn_info_dict_fault_occur['db_pass']
            db_server = conn_info_dict_fault_occur['db_server']
            db_port = conn_info_dict_fault_occur['db_port']
            db_name = conn_info_dict_fault_occur['db_name']
            db_provider = conn_info_dict_fault_occur['db_provider']
            line_id = conn_info_dict_fault_occur['line_id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Database information is missing')

        # get section_code
        if str(line_id) not in linkage_fault_occur:
            raise MissingSectionCode
        else:
            sectionCode = linkage_fault_occur[str(line_id)]

            # construct condition for datetime
        if period == 'Day':
            start = datetime.datetime(year, month, date, 7, 30)
            end = datetime.datetime(year, month, date, 19,29)
        else:
            start = datetime.datetime(year, month, date, 19, 30)
            end = datetime.datetime(year, month, date, 7,29)
            end = end + datetime.timedelta(days=1)

        if mode == 'sec':
            # query data
            stmt = f"""
                SELECT errorCode, SUM(Second) as value, STRING_AGG(MCNumber, ', ') as MCNumberList FROM Loss_RecordTable 
                WHERE sectionCode = '{sectionCode}' AND dateTimeStart >= '{start}' AND dateTimeStart <= '{end}'  AND MCNumber = '{machine}' 
                GROUP BY errorCode
                ORDER BY value DESC
            """
        else:
            stmt = f"""
                SELECT errorCode, COUNT(*) as value, STRING_AGG(MCNumber, ', ') as MCNumberList FROM Loss_RecordTable 
                WHERE sectionCode = '{sectionCode}' AND dateTimeStart >= '{start}' AND dateTimeStart <= '{end}'  AND MCNumber = '{machine}' 
                GROUP BY errorCode
                ORDER BY value DESC
            """
        if db_provider == 'postgresql':
            loss_data = _query_data_postgres(stmt, db_user, db_pass, db_server, db_port, db_name)
        elif db_provider == 'mssql':
            loss_data = _query_data_mssql(stmt, db_user, db_pass, db_server, db_port, db_name)
        else:
            raise HTTPException(status_code=400, detail=f'Database provider is not support: {db_provider}')

        # transform data to x_axis, y_axis
        x_axis_all = []
        y_axis_left_all = []
        mc_number_list_all = []
        for data in loss_data:
            if data['value'] > 0:
                x_axis_all.append(data['errorCode'])
                y_axis_left_all.append(data['value'])
                mc_number_list = data['MCNumberList'].split(',')
                clean_list = []
                for number in mc_number_list:
                    if number.strip() not in clean_list:
                        clean_list.append(number.strip())
                mc_number_list_all.append(' , '.join(clean_list))

        # get top 10, top20
        x_axis_top_10 = x_axis_all[:10]
        y_axis_left_top_10 = y_axis_left_all[:10]
        x_axis_top_20 = x_axis_all[:20]
        y_axis_left_top_20 = y_axis_left_all[:20]
        mc_number_list_top_10 = mc_number_list_all[:10]
        mc_number_list_top_20 = mc_number_list_all[:20]

        # calculate cdf
        sum_all = sum(y_axis_left_all)
        y_axis_right_all = []
        acc = 0
        for y in y_axis_left_all:
            acc += y
            y_axis_right_all.append(((acc)/sum_all) * max(y_axis_left_all))

        sum_top_10 = sum(y_axis_left_top_10)
        y_axis_right_top_10 = []
        acc = 0
        for y in y_axis_left_top_10:
            acc += y
            y_axis_right_top_10.append(((acc)/sum_top_10) * max(y_axis_left_top_10))

        sum_top_20 = sum(y_axis_left_top_20)
        y_axis_right_top_20 = []
        acc = 0
        for y in y_axis_left_top_20:
            acc += y
            y_axis_right_top_20.append(((acc)/sum_top_20) * max(y_axis_left_top_20))

        return x_axis_all, x_axis_top_10, x_axis_top_20, y_axis_left_all, y_axis_left_top_10, y_axis_left_top_20, y_axis_right_all, y_axis_right_top_10, y_axis_right_top_20, mc_number_list_all, mc_number_list_top_10, mc_number_list_top_20
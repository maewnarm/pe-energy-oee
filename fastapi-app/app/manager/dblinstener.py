from csv import DictReader
import threading
import psycopg2 
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import select
import time
import os
import datetime
from app.database import breaker_to_machine, valve_to_machine, PG_NOTIFY_CHANNEL

import logging
logger = logging.getLogger(__name__)

def _get_latest_air(dsn, valve_info_dict: DictReader, interval: int = 5):
    # get time range in the last interval
    #   stop_dt is current time
    #   start_dt is current time minus input interval
    stop_dt = datetime.datetime.now()
    start_dt = stop_dt - datetime.timedelta(minutes=interval)

    # get set of machine number as string
    valve_id_list = [int(x) for x in valve_info_dict.keys()]
    valve_id_list_str = str(set(valve_id_list))

    # query from database
    stmt = f"""
    SELECT TO_CHAR(air_timestamp, 'HH24:MI:SS') as time, valve_unit_id as valve_id, SUM(air_value) as air_value 
    From air_realtime
    WHERE air_timestamp BETWEEN '{start_dt}' AND '{stop_dt}'
        AND valve_unit_id = ANY('{valve_id_list_str}')
    GROUP BY time, valve_unit_id
    ORDER BY time, valve_unit_id ASC
    """
    try:
        # execut sql
        connection = psycopg2.connect(dsn) 
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 

        # cursor object to read from db
        cur = connection.cursor() 
        cur.execute(stmt)
        rs = cur.fetchall()

        # convert to dictionary 
        data_dict = {}
        for r in rs:
            data_dict[(r[0], r[1])] = r[2]
        cur.close()
        connection.close()
        return data_dict
    except Exception as e:
        logger.error(f'[dblistener] error during get last {interval} secs for air_realtime => {e}')
        return {}


def _get_latest_energy(dsn, breaker_info_dict: dict, interval: int = 5):
    # get time range in the last interval
    #   stop_dt is current time
    #   start_dt is current time minus input interval
    stop_dt = datetime.datetime.now()
    start_dt = stop_dt - datetime.timedelta(minutes=interval)

    # get set of machine number as string
    breaker_id_list = [int(x) for x in breaker_info_dict.keys()]
    breaker_id_list_str = str(set(breaker_id_list))

    # query from database
    stmt = f"""
    SELECT TO_CHAR(energy_timestamp, 'HH24:MI:SS') as time, breaker_unit_id as breaker_id, SUM(energy_value) as energy_value 
    From energy_realtime
    WHERE energy_timestamp BETWEEN '{start_dt}' AND '{stop_dt}'
        AND breaker_unit_id = ANY('{breaker_id_list_str}')
    GROUP BY time, breaker_unit_id
    ORDER BY time, breaker_unit_id ASC
    """

    try:
        # execut sql
        connection = psycopg2.connect(dsn) 
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 
        # cursor object to read from db
        cur = connection.cursor() 
        cur.execute(stmt)
        rs = cur.fetchall()
        data_dict = {}
        for r in rs:
            data_dict[(r[0], r[1])] = r[2]
        cur.close()
        connection.close()
        return data_dict
    except Exception as e:
        logger.error(f'[dblistener] error during get last {interval} secs for air_realtime => {e}')
        return {}    

def _get_breaker_machine_info_dict(breaker_id_list: list) -> dict:
    machine_info_dict = {}
    for breaker_id in breaker_id_list:
        if breaker_id in breaker_to_machine:
            machine_no = breaker_to_machine[breaker_id]['machine_no']
            machine_name = breaker_to_machine[breaker_id]['machine_name']
            machine_info_dict[breaker_id] = {'mc_no': machine_no, 'mc_name': machine_name}
    return machine_info_dict


def _get_valve_machine_info_dict(valve_id_list: list) -> dict:
    machine_info_dict = {}
    for valve_id in valve_id_list:
        if valve_id in valve_to_machine:
            machine_no = valve_to_machine[valve_id]['machine_no']
            machine_name = valve_to_machine[valve_id]['machine_name']
            machine_info_dict[valve_id] = {'mc_no': machine_no, 'mc_name': machine_name}
    return machine_info_dict

class DBListener:
    # This class listen for notify from the postgresql
    #   when the notify comes, we fetch latest data from the database
    #   and keep as properties of this clas
    def __init__(self, db_user: str, db_pass: str, db_server: str, db_port: str, 
        db_name: str, breaker_id_list: list, valve_id_list: list):
        if db_server == 'localhost' or db_server == '127.0.0.1':
            db_server = 'docker.for.win.localhost'
        # connection setting for postgresql
        self.dsn = f'dbname={db_name} user={db_user} password={db_pass} host={db_server} port={db_port} connect_timeout=1'
        self.breaker_info_dict = _get_breaker_machine_info_dict(breaker_id_list)
        self.valve_info_dict = _get_valve_machine_info_dict(valve_id_list)
        self.connection = psycopg2.connect(self.dsn) 
        self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 

        # cursor object to read from db
        self.cur = self.connection.cursor() 
        self.cur.execute(f"LISTEN {PG_NOTIFY_CHANNEL};")

        # latest data for air and energy
        self.latest_air_data = _get_latest_air(self.dsn, self.breaker_info_dict, 5)
        self.latest_energy_data = _get_latest_energy(self.dsn, self.valve_info_dict, 5)

        # thread object to call dblisten function in background
        self.thread = threading.Thread(target=self.dblisten, name="DBListner")
        self.thread.start()

    def terminate(self):
        # when the fastapi is shutdown, this function will be called
        #   to terminate the thread listen to the postgres notify
        print('terminated')
        self.connection.close()
        os._exit(0)

    def clean_energy(self):
        now = datetime.datetime.now()
        for key in self.latest_energy_data.keys():
            key_time = key[0]
            key_datetime = datetime.datetime(year=now.year, month=now.month, day=now.day, hour=now.hour, minute=now.minute)
            if key_time >= '23:55:00' and key_time <= '00:59:59':
                key_datetime = key_datetime - datetime.timedelta(days=1)
            if (now - key_datetime).seconds > 300:
                del self.latest_energy_data[key]

    def clean_air(self):
        now = datetime.datetime.now()
        for key in self.latest_air_data.keys():
            key_time = key[0]
            key_datetime = datetime.datetime(year=now.year, month=now.month, day=now.day, hour=now.hour, minute=now.minute)
            if key_time >= '23:55:00' and key_time <= '00:59:59':
                key_datetime = key_datetime - datetime.timedelta(days=1)
            if (now - key_datetime).seconds > 300:
                del self.latest_air_data[key]

    def dblisten(self):
        # this function listens to the notify signal from the postgres
        while True:
            # if self.connection.closed:
            #     print('Coinnection closed')
            #     self.connection = psycopg2.connect(self.dsn) 
            #     self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 

            #     # cursor object to read from db
            #     self.cur = self.connection.cursor() 
            #     self.cur.execute(f"LISTEN {PG_NOTIFY_CHANNEL};")
            # else:
            #     print('Connection open')
            # select.select([self.connection],[],[]) 
            # self.connection.poll()
            # while self.connection.notifies:
            #     noti = self.connection.notifies.pop(0)
            #     print(noti)
            #     # loop until cannot get notify
            #     #   and update the latest data for air or energ
            #     self.latest_air_data.update(_get_latest_air(self.dsn, self.valve_info_dict, 5))
            #     self.latest_energy_data.update(_get_latest_energy(self.dsn, self.breaker_info_dict, 5))
            #     self.clean_air()
            #     self.clean_energy()
            
            self.latest_air_data.update(_get_latest_air(self.dsn, self.valve_info_dict, 5))
            self.latest_energy_data.update(_get_latest_energy(self.dsn, self.breaker_info_dict, 5))
            time.sleep(0.5)
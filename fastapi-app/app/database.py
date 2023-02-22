from fastapi.exceptions import HTTPException
import psycopg2
import psycopg2.extras
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import dotenv_values

import logging

logger = logging.getLogger(__name__)

# load configuration from .env file
config = dotenv_values(".env")

# get postgresql connection information
USE_DOCKER = config["USE_DOCKER"] == "1"
print(USE_DOCKER)
PG_USER = config["PG_USER"]
PG_PASS = config["PG_PASS"]
PG_SERVER = config["PG_SERVER"]
PG_PORT = config["PG_PORT"]
PG_DB = config["PG_DB"]
# PG_NOTIFY_CHANNEL = config["PG_NOTIFY_CHANNEL"]
# PG_TRIGGER_FUNC_NAME = config["PG_TRIGGER_FUNC_NAME"]
# PG_TRIGGER_NAME = config["PG_TRIGGER_NAME"]
if USE_DOCKER and (PG_SERVER == "localhost" or PG_SERVER == "127.0.0.1"):
    PG_SERVER = "host.docker.internal"
DSN = (
    f"dbname={PG_DB} user={PG_USER} password={PG_PASS} host={PG_SERVER} port={PG_PORT}"
)
print(DSN)
# connect to the master database to get
#   1. db connection information for each product/line
#   2. machine information (number and name) for each breaker
#   3. machine information (number and name) for each valve
connection = psycopg2.connect(DSN)
connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
stmt = f"""
select products.product_id, products.full_name, parts.part_no, lines_parts.line_id, lines.line_name, lines_energy.breaker_list,
    lines_energy.valve_list, lines_databases.db_server, lines_databases.db_port, lines_databases.db_user, lines_databases.db_pass, lines_databases.db_name, lines_databases.db_provider
FROM products
JOIN parts
ON products.product_id = parts.product_id
JOIN lines_parts
ON parts.part_no = lines_parts.part_no
JOIN lines
ON lines_parts.line_id = lines.line_id
JOIN lines_databases
ON lines.line_id = lines_databases.line_id
JOIN lines_energy
ON lines.line_id = lines_energy.line_id
WHERE lines_databases.type = 'energy' AND lines_databases.db_provider = 'postgresql'
"""
cur = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
product_line_db_energy = {}
try:
    # execut sql
    cur.execute(stmt)
    rs = cur.fetchall()
    for row in rs:
        dict_row = dict(row)
        key_list = [None, None]
        value_dict = {}
        for key, value in dict_row.items():
            if key == "full_name":
                key_list[0] = value
            elif key == "line_name":
                key_list[1] = value
            else:
                value_dict = {**value_dict, key: value}
        product_line_db_energy[tuple(key_list)] = value_dict
except Exception as e:
    logger.error(f"[databases] error during get all databases information => {e}")
    raise HTTPException(
        status_code=400, detail=f"error during get all databases information"
    )

stmt = f"""
select products.product_id, products.full_name, parts.part_no, lines_parts.line_id, lines.line_name, lines_databases.line_id,
        lines_databases.db_server, lines_databases.db_port, lines_databases.db_user, lines_databases.db_pass, lines_databases.db_name, lines_databases.db_provider
FROM products
JOIN parts
ON products.product_id = parts.product_id
JOIN lines_parts
ON parts.part_no = lines_parts.part_no
JOIN lines
ON lines_parts.line_id = lines.line_id
JOIN lines_databases
ON lines.line_id = lines_databases.line_id
WHERE lines_databases.type = 'oee_cycletime'
"""
cur = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
product_line_db_oee_cycletime = {}
try:
    # execut sql
    cur.execute(stmt)
    rs = cur.fetchall()
    for row in rs:
        dict_row = dict(row)
        key_list = [None, None]
        value_dict = {}
        for key, value in dict_row.items():
            if key == "full_name":
                key_list[0] = value.strip()
            elif key == "line_name":
                key_list[1] = value.strip()
            else:
                value_dict = {**value_dict, key: value}
        product_line_db_oee_cycletime[tuple(key_list)] = value_dict
except Exception as e:
    logger.error(f"[databases] error during get all databases information => {e}")
    raise HTTPException(
        status_code=400, detail=f"error during get all databases information"
    )

stmt = f"""
select products.product_id, products.full_name, parts.part_no, lines_parts.line_id, lines.line_name,
        lines_databases.line_id, lines_databases.db_server, lines_databases.db_port, lines_databases.db_user, lines_databases.db_pass, lines_databases.db_name, lines_databases.db_provider
FROM products
JOIN parts
ON products.product_id = parts.product_id
JOIN lines_parts
ON parts.part_no = lines_parts.part_no
JOIN lines
ON lines_parts.line_id = lines.line_id
JOIN lines_databases
ON lines.line_id = lines_databases.line_id
WHERE lines_databases.type = 'oee_fault_occurrence'
"""
cur = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
product_line_db_oee_fault_occurrence = {}
try:
    # execut sql
    cur.execute(stmt)
    rs = cur.fetchall()
    for row in rs:
        dict_row = dict(row)
        key_list = [None, None]
        value_dict = {}
        for key, value in dict_row.items():
            if key == "full_name":
                key_list[0] = value.strip()
            elif key == "line_name":
                key_list[1] = value.strip()
            else:
                value_dict = {**value_dict, key: value}
        product_line_db_oee_fault_occurrence[tuple(key_list)] = value_dict
except Exception as e:
    logger.error(f"[databases] error during get all databases information => {e}")
    raise HTTPException(
        status_code=400, detail=f"error during get all databases information"
    )

stmt = f"""
select machines.machine_no, machines.machine_name, machines_breakers.breaker_id,breaker_units.breaker_name
FROM machines
JOIN machines_breakers
ON machines.machine_no = machines_breakers.machine_no
JOIN breaker_units
ON machines_breakers.breaker_id = breaker_units.id
"""
cur = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
breaker_to_machine = {}
try:
    # execut sql
    cur.execute(stmt)
    rs = cur.fetchall()
    for row in rs:
        if breaker_to_machine.get(row["breaker_id"]) is None:
            breaker_to_machine[row["breaker_id"]] = []
        breaker_to_machine[row["breaker_id"]] = [
            *breaker_to_machine[row["breaker_id"]],
            {
                "machine_no": row["machine_no"],
                "machine_name": row["machine_name"],
                "breaker_name": row["breaker_name"],
            },
        ]
except Exception as e:
    logger.error(f"[databases] error during get all databases information => {e}")
    raise HTTPException(
        status_code=400, detail=f"error during get all databases information"
    )

stmt = f"""
select machines.machine_no, machines.machine_name, machines_valves.valve_id,valve_units.valve_name
FROM machines
JOIN machines_valves
ON machines.machine_no = machines_valves.machine_no
JOIN valve_units
ON machines_valves.valve_id = valve_units.id
"""
cur = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
valve_to_machine = {}
try:
    # execut sql
    cur.execute(stmt)
    rs = cur.fetchall()
    for row in rs:
        if valve_to_machine.get(row["valve_id"]) is None:
            valve_to_machine[row["valve_id"]] = []
        valve_to_machine[row["valve_id"]] = [
            *valve_to_machine[row["valve_id"]],
            {
                "machine_no": row["machine_no"],
                "machine_name": row["machine_name"],
                "valve_name": row["valve_name"],
            },
        ]
except Exception as e:
    logger.error(f"[databases] error during get all databases information => {e}")
    raise HTTPException(
        status_code=400, detail=f"error during get all databases information"
    )

# def _create_trigger_func(connection):
#     stmt = f"""
#     CREATE or REPLACE FUNCTION {PG_TRIGGER_FUNC_NAME}()
#     RETURNS trigger
#     LANGUAGE 'plpgsql'
#     as $BODY$
#     DECLARE payload text;
#         BEGIN
#             IF (TG_OP = 'INSERT') THEN
#                 PERFORM pg_notify('{PG_NOTIFY_CHANNEL}',
#                     json_build_object(
#                         'action', 'insert',
#                         'data', NEW
#                     )::text);
#             ELSIF (TG_OP = 'UPDATE') THEN
#                 PERFORM pg_notify('{PG_NOTIFY_CHANNEL}',
#                     json_build_object(
#                         'action', 'update',
#                         'data', NEW
#                     )::text);
#             END IF;
#             RETURN NEW;
#         END
#     $BODY$;
#     """
#     cur = connection.cursor()
#     cur.execute(stmt)
#     connection.commit()

# def _create_trigger(connection):
#     stmt = f"""
#     CREATE OR REPLACE TRIGGER {PG_TRIGGER_NAME}
#         AFTER INSERT OR UPDATE ON energy_realtime
#         FOR EACH ROW
#         EXECUTE PROCEDURE {PG_TRIGGER_FUNC_NAME}();
#     """
#     cur = connection.cursor()
#     cur.execute(stmt)
#     connection.commit()

#     stmt = f"""
#     CREATE OR REPLACE TRIGGER {PG_TRIGGER_NAME}
#         AFTER INSERT OR UPDATE ON air_realtime
#         FOR EACH ROW
#         EXECUTE PROCEDURE {PG_TRIGGER_FUNC_NAME}();
#     """
#     cur.execute(stmt)
#     connection.commit()

# Ensure that all databases
#   if there are tables named energy_realtime and air_realtime
#   check about trigger functions and triggers
# for product_line, db_info in product_line_db_energy.items():
#     db_user = db_info['db_user']
#     db_pass = db_info['db_pass']
#     db_server = db_info['db_server']
#     db_port = db_info['db_port']
#     db_name = db_info['db_name']
#     # if db_server == 'localhost' or db_server == '127.0.0.1':
#     #     db_server = 'docker.for.win.localhost'
#     # connect to db
#     DSN = f'dbname={db_name} user={db_user} password={db_pass} host={db_server} port={db_port}'
#     connection = psycopg2.connect(DSN)
#     cursor = connection.cursor()
#     cursor.execute("select relname from pg_class where relkind='r' and relname !~ '^(pg_|sql_)';")
#     table_list = cursor.fetchall()

#     if ('air_realtime',) not in table_list or ('energy_realtime',) not in table_list:
#         continue

#     try:
#         _create_trigger_func(connection)
#         _create_trigger(connection)
#     except Exception as e:
#         logger.error(f'[databases] error during get all databases information => {e}')
#         raise HTTPException(status_code=400, detail=f'error during get all databases information')
#     finally:
#         connection.close()


connection.close()


async def get_pg_async_db(pg_user, pg_pass, pg_server, pg_port, pg_db):
    # a function which return asycnsession for postgresdb
    if USE_DOCKER and (pg_server == "localhost" or pg_server == "127.0.0.1"):
        pg_server = "host.docker.internal"
    # PostgreSQL async url, engine, and session
    PG_ASYNC_SQLALCHEMY_DATABASE_URL = (
        f"postgresql+asyncpg://{pg_user}:{pg_pass}@{pg_server}:{pg_port}/{pg_db}"
    )
    pg_async_engine = create_async_engine(
        PG_ASYNC_SQLALCHEMY_DATABASE_URL, echo=False, pool_size=40, max_overflow=0
    )
    pg_async_session = sessionmaker(
        pg_async_engine, expire_on_commit=False, class_=AsyncSession
    )
    # function to get pg async session
    db = pg_async_session()
    return db

from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from typing import List, Dict, Any
from app.helpers import api_key_auth
from app.crud.oee import OEECRUD
from app.exceptions import MissingSectionCode, MissingCTLine
from app.schemas.system import EnergyDashbordFilter, OEEDashbordFilter, OEEMachines, OEEOperators

import logging
logger = logging.getLogger(__name__)


def _get_connection_info(product: str, line: str, product_line_db_list: List[Dict[str, Any]]) -> tuple:
    if (product, line) not in product_line_db_list:
        logger.error(f'[get_system_setting] cannot get db information for product={product}, line={line}')
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
        logger.error(f'[system][get_connection_info] Database information is missing')
        raise HTTPException(status_code=400, detail=f'Database information is missing')


def system_router(product_line_db_energy: List[Dict[str, Any]], product_line_db_oee_cycletime: List[Dict[str, Any]], product_line_db_oee_fault_occurrence: List[Dict[str, Any]]) -> APIRouter:
    router = APIRouter()
    oee_crud = OEECRUD()

    @router.get("/energy_filter_setting", response_model=EnergyDashbordFilter,  dependencies=[Depends(api_key_auth)])
    async def get_energy_filter():
        # this endpoint will return EnergyDashbordFilter back to the frontend

        # construct dictionary that maps from a product name to list of line names
        product_line_dict = {}
        for product, line in  product_line_db_energy.keys():
            if product not in product_line_dict:
                product_line_dict[product] = [line]
            else:
                if line not in product_line_dict[product]:
                    product_line_dict[product].append(line)

        # for each list of line names
        #   sort line name desc
        for product in product_line_dict:
            product_line_dict[product].sort()

        energy_filter = EnergyDashbordFilter(product_to_line_list=product_line_dict)
        return  energy_filter

    @router.get("/oee_filter_setting", response_model=OEEDashbordFilter,  dependencies=[Depends(api_key_auth)])
    async def get_oee_filter():
        # this endpoint will return OEEDashbordFilter back to the frontend

        # construct dictionary that maps from a product name to list of line names
        product_line_dict = {}
        for product, line in  product_line_db_oee_cycletime.keys():
            if product not in product_line_dict:
                product_line_dict[product] = [line]
            else:
                if line not in product_line_dict[product]:
                    product_line_dict[product].append(line)
        for product, line in  product_line_db_oee_fault_occurrence.keys():
            if product not in product_line_dict:
                product_line_dict[product] = [line]
            else:
                if line not in product_line_dict[product]:
                    product_line_dict[product].append(line)

        # for each list of line names
        #   sort line name desc
        for product in product_line_dict:
            product_line_dict[product].sort()

        # period is a fix list which contains only Day and Night
        period_list = ['Day', 'Night']

        energy_filter = OEEDashbordFilter(product_to_line_list = product_line_dict, period_list = period_list)
        return  energy_filter

    @router.get('/oee_operators',  response_model=OEEOperators,  dependencies=[Depends(api_key_auth)])
    async def get_oee_operators(product: str, line: str):
        print(product_line_db_oee_cycletime)
        try:
            conn_info_dict = _get_connection_info(product, line, product_line_db_oee_cycletime)
            operator_list = oee_crud.get_operators(conn_info_dict)
            print('-----------------------> ', operator_list)
            return OEEOperators(operator_list=operator_list)
        except MissingCTLine:
            logger.error(f'[system][oee_operators] CT Line for product: {product} and line: {line} cannot be found')
            raise HTTPException(status_code=400, detail=f'CT Line for product: {product} and line: {line} cannot be found')
        except Exception as e:
            logger.error(f'[system][oee_operators] Cannot get operator list => {e}')
            raise HTTPException(status_code=400, detail=f'Cannot get operator list => {e}')

    @router.get('/oee_machines',  response_model=OEEMachines,  dependencies=[Depends(api_key_auth)])
    async def get_oee_machines(product: str, line: str):
        print(product_line_db_oee_fault_occurrence)
        try:
            conn_info_dict = _get_connection_info(product, line, product_line_db_oee_fault_occurrence)
            machine_list = oee_crud.get_machines(conn_info_dict)
            return OEEMachines(machine_list=machine_list)
        except MissingSectionCode:
            logger.error(f'[system][oee_machines] Section code for product: {product} and line: {line} cannot be found')
            raise HTTPException(status_code=400, detail=f'Section code for product: {product} and line: {line} cannot be found')
        except Exception as e:
            logger.error(f'[system][oee_machines] Cannot get operator list => {e}')
            raise HTTPException(status_code=400, detail=f'Cannot get machine list => {e}')

    return router
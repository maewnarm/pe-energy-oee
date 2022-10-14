import pytz
from datetime import datetime
from typing import Any, List, Dict
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from starlette import status
import asyncpg.pgproto.pgproto as pgproto
from dotenv import dotenv_values

# load config from .env to get X-API-KEY list
config = dotenv_values(".env")
api_keys = config['X_API_KEY']
X_API_KEY = APIKeyHeader(name='X-API-Key')

def convert_raw_statement_to_array_with_key(input: Any, except_column: List[str] = []) -> List[Dict[str, Any]]:
    # This function convert the input sqlalchemy raw statement to the list of dictionary
    #   which each elment of list is the dictionary with key as column name in raw statement
    #   and value is the value at the column

    # define timezone for the case that such column
    #   is datetime 
    tz = pytz.timezone("Asia/Bangkok")

    # for each row
    #   get key (column name), which will be used as the key of dictionary
    #   get value and convert to string in case of UUID or datetime
    #       or keep same data type in other data type
    rs = [
        {
            c: str(getattr(r, c))
            if isinstance(getattr(r, c), pgproto.UUID)
            else getattr(r, c)
            .replace(tzinfo=pytz.utc)
            .astimezone(tz)
            .strftime("%Y-%m-%d %H:%M:%S.%f")
            if isinstance(getattr(r, c), datetime)
            else getattr(r, c)
            for c in r.keys()
            if c not in except_column
        }
        for r in input
    ]
    return rs

def convert_array_to_dict_by_column(input: List, column: str) -> Dict[Any, Dict]:
    # this function convert array of dictionary to the dictionary by the value
    #   in the specific column
    # for example, if the input column is 'id', so the return dictionary will have
    #   the value of 'id' is a key and remaining key:value pair will be value
    #   input = [{'id':1, 'name':'tom', 'age':30}, {'id':2, 'name':'jerry', 'age':25}]
    #   column = 'id'
    #   return {1: {'name':'tom', 'age':30}, 2: {'name':'jerry', 'age':25'}}

    # ensure input is correct type
    assert isinstance(input, list), 'Error in convert_array_to_dict_by_column, input is not a list'
    assert isinstance(column, str), 'Error in convert_array_to_dict_by_column, column is not a string'

    # define output dictionary
    output = {}

    # for each dict in the input list
    for e in input:
        # if the specifc column is not
        #   in the key list of this dictionary, skip
        if column not in e:
            return

        # define value dictionary
        e_output = {}

        # for each key and value pairs
        for k, v in e.items():

            # if the key is not the column which we will make it as a key
            #   of the output dictionary, keep this key-value in the value dictionary
            if k != column:
                e_output = {**e_output, k: v}

        # set the value of the specific column as a key, 
        #   and set the value dictionary as the value of the output dict
        output = {**output, e[column]: e_output}
    return output

def convert_array_to_dict_by_composite_columns(input: List, columns: List) -> Dict[Any, Dict]:
    # this function convert array of dictionary to the dictionary by the value
    #   in the specific columns
    # the output dictionary will have a key as the tuple of value in the input columns list
    # for example, if the input columns is ['id', 'name], so the return dictionary will have
    #   the value of 'id' and 'name' (as tuple) is a key and remaining key:value pair will be value
    #   input = [{'id':1, 'name':'tom', 'age':30}, {'id':2, 'name':'jerry', 'age':25}]
    #   column = ['id', 'name']
    #   return {(1, 'tom'): {'age':30}, (2, 'jerry'): {'age':25'}}

    # define output dictionary
    output = {}

    # for each dict in the input list
    for e in input:

        # check that all column in input columns list
        #   are in the dictionary, otherwise skip
        for column in columns:
            if column not in e:
                return
        
        # define value dictionary
        e_output = {}

        # create a list to keep key value
        key_value_list = [None for _ in range(len(columns))]

        # for each key and value pairs
        for k, v in e.items():

            # if the key is not in the columns list which we will make it as a key
            #   of the output dictionary, keep this key-value in the value dictionary
            if k not in columns:
                e_output = {**e_output, k: v}
            else:
            # otherwise, set value in the key value list
                idx = columns.index(k)
                key_value_list[idx] = v
        
        # set key (as tuple) and value dict to the output dictionary
        output = {**output, tuple(key_value_list): e_output}
    return output

def api_key_auth(x_api_key: str = Depends(X_API_KEY)):
    # this function is used to validate X-API-KEY in request header
    # if the sent X-API-KEY in header is not existed in the config file
    #   reject access
    if x_api_key not in api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Forbidden"
        )
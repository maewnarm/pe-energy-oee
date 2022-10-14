from pydantic import BaseModel
from typing import Dict, List

class EnergyDashbordFilter(BaseModel):
    # schema for the response of the endpont of eneergy dashboard
    #   which returns value for filter dropdown

    # dict that map product name to list of line name
    product_to_line_list: Dict[str, List]

class OEEDashbordFilter(BaseModel):
    # schema for the response of the endpont of oee
    #   which returns value for filter dropdown

    # dict that map product name to list of line name
    product_to_line_list: Dict[str, List]

    # choide for period
    period_list: List[str]

class OEEOperators(BaseModel):

    # choice for operator
    operator_list: List[str]

class OEEMachines(BaseModel):

    # choice for machine
    machine_list: List[str]
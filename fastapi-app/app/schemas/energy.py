from pydantic import BaseModel
from typing import List, Dict, Union


class EnergyHistoryReport(BaseModel):
    # schema for the response of the endpoint
    #   which returns x-axis and y-axis for the energy report

    # x-axis is the list of label
    x_axis: List[str]

    # y-axis is the list of dictionary which is the value of the chart
    #   the dictionaryt is mapping betwen label to the data value
    y_axis: List[Dict[str, float]]

    # mapping between mc (in the format M/C{id}) to its name
    mc_map: Dict[str, str]

    # mapping between breaker id and machine name
    mc_info_map: Dict[str, List[Dict[str, str]]]


class EnergyHistoryReportWithTotal(EnergyHistoryReport):
    # this is the schema of the response of the endpoint
    #   which also return x-axis and y-axis as the schema above
    #   but also with the total value of all y_axis data

    # total value of the data in the report
    total: float


class EnergyRealtimeReport(BaseModel):
    # schema for the response of the endpoint of realtime report
    line: EnergyHistoryReport
    race: List[Dict[str, Union[str, float]]]

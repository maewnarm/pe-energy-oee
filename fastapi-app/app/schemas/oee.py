from optparse import Option
from pydantic import BaseModel
from typing import List, Dict, Optional, Union

class OEEProductionReport(BaseModel):
    # schema for the response of the endpoint of ee production data

    # numerator of the production fraction
    numerator: str

    # denominator of the production fraction
    denominator: str

    # percentage of prodcuction fraction
    percent: str

    # dekidata
    dekidaka: List[Dict[str, str]]

class OEECycleTimeReport(BaseModel):
    # schema for the cycle time chart

    # x-axis is the list of label 
    x_axis: List[str]

    # y-axis is the list float
    y_axis: List[float]

    # target
    target: Optional[float]

    # video_url
    video_url: List[Optional[str]]

    # has_video
    has_video: List[bool]

class OEEFaultOccurrenceReport(BaseModel):
    # schema for the cycle time chart

    # x-axis is the list of label 
    x_axis_top_10: List[str]
    x_axis_top_20: List[str]
    x_axis_all: List[str]

    # y-axis is the list float
    y_axis_left_top_10: List[Union[int,float]]
    y_axis_left_top_20: List[Union[int,float]]
    y_axis_left_all: List[Union[int,float]]
    y_axis_right_top_10: List[float]
    y_axis_right_top_20: List[float]
    y_axis_right_all: List[float]

    # mcnumberlist
    mc_number_list_all: List[str]
    mc_number_list_top_10: List[str]
    mc_number_list_top_20: List[str]
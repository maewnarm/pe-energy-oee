from app.routers.energy import energy_router
from app.routers.system import system_router
from app.routers.air import air_router
from app.routers.oee import oee_router
from app.routers.lineinfo import lineinfo_router
from app.routers.factory import factory_router

__all__ = [
    "air_router",
    "energy_router",
    "system_router",
    "oee_router",
    "lineinfo_router",
    "factory_router",
]

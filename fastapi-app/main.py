import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# need import models for auto create
from app.routers import energy_router, system_router, air_router, oee_router
from app.database import product_line_db_energy, product_line_db_oee_cycletime, product_line_db_oee_fault_occurrence
from app.manager import SocketClient

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socketListenerDict = {}
for product_line, db_info in product_line_db_energy.items():
    db_server = db_info['db_server']
    db_port = 54321
    socketListenerDict[product_line] = SocketClient(host=db_server, port=db_port)

app.include_router(energy_router(product_line_db_energy, socketListenerDict), prefix="/api/energy")
app.include_router(air_router(product_line_db_energy, socketListenerDict), prefix="/api/air")
app.include_router(oee_router(product_line_db_oee_cycletime, product_line_db_oee_fault_occurrence), prefix='/api/oee')
app.include_router(system_router(product_line_db_energy, product_line_db_oee_cycletime, product_line_db_oee_fault_occurrence), prefix="/api/setting")

@app.on_event("shutdown")
async def shutdown_event() -> None:
    for dbln in socketListenerDict.values():
        dbln.terminate()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

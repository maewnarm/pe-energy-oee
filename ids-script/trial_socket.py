from ids import IoTDS
import json
import asyncio
import websockets


iotds = IoTDS()

# list energy items name
energy_items: dict[str,list[str]] = {"kWh_"+str(i):["Realtime_Value"] for i in range(1,22)}

# list air items name
air_items:dict[str,list[str]] = {"AirFlow_"+str(i):["Realtime_Value"] for i in range(1,9)}

# all items
all_items = {**energy_items,**air_items}

for ctrl_name,item_name in all_items.items():
    # add controllers
    iotds.add_controllers(ctrl_name)
    # add items
    iotds.add_items(ctrl_name,item_name)

def _get_item_data(items:dict[str,list[str]]):
    data = {}
    for controller,items_name in items.items():
        for item_name in items_name:
            value = iotds.read_ids(controller,item_name)
            if controller not in data.keys():
                data[controller]= {}
            data[controller][item_name] = value
        # may be need to insert some exception ...
    return data

async def handler(websocket, path):
    while True:
        try:
            energy_values = _get_item_data(energy_items)
            air_values = _get_item_data(air_items)
            d = {'air': air_values, 'energy': energy_values}
            data_json = json.dumps(d)
            data = await websocket.recv()
            await websocket.send(data_json)
            # print(f'send {data_json}')
        except Exception as e:
            print(e)
            break

host = '192.168.8.60'
port = 54321

start_server = websockets.serve(handler, host, port)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
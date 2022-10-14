import datetime
import json
import time
import os
import asyncio
import websockets

HEADERSIZE = 10

import logging

logger = logging.getLogger(__name__)
class SocketClient:
    # This class is socket client which connect to socket server
    #   to get current air and energy data
    def __init__(self, host: str, port: str):
        # latest data for air and energy
        self.host = host
        self.port = port
        self.latest_air_data = {}
        self.latest_energy_data = {}
        self.temp_air = []
        self.temp_energy = []
        
        loop = asyncio.get_event_loop()
        task = loop.create_task(self.listen())
        try:
            loop.run_until_complete(task)
        except Exception as e:
            logger.error(str(e))

    def clean_air(self):
        now = datetime.datetime.now()
        for key in self.latest_air_data.keys():
            key_time = key[0]
            key_datetime = datetime.datetime(year=now.year, month=now.month, day=now.day, hour=now.hour, minute=now.minute)
            if key_time >= '23:55:00' and key_time <= '00:59:59':
                key_datetime = key_datetime - datetime.timedelta(days=1)
            if (now - key_datetime).seconds > 300:
                del self.latest_air_data[key]
    
    def clean_energy(self):
        now = datetime.datetime.now()
        for key in self.latest_energy_data.keys():
            key_time = key[0]
            key_datetime = datetime.datetime(year=now.year, month=now.month, day=now.day, hour=now.hour, minute=now.minute)
            if key_time >= '23:55:00' and key_time <= '00:59:59':
                key_datetime = key_datetime - datetime.timedelta(days=1)
            if (now - key_datetime).seconds > 300:
                del self.latest_energy_data[key]

    async def listen(self):
        while True:
            while True:
                try:
                    async with websockets.connect(f'ws://{self.host}:{self.port}') as websocket:
                        while True:
                            await websocket.send('{}')
                            response = await websocket.recv()
                            data_dict = json.loads(response)
                            # print('get data')
                            now_str = datetime.datetime.now().strftime('%H:%M:%S')

                            data_dict_air = data_dict['air']
                            raw_dict = {}
                            for idx in data_dict_air:
                                idx_str = idx.replace("AirFlow_", "")
                                raw_dict[(now_str, int(idx_str))] = data_dict_air[idx]['Realtime_Value']
                            if len(self.temp_air) > 30000:
                                self.temp_air.pop(0)
                            self.temp_air.append(raw_dict)
                            self.latest_air_data = {k: v for d in self.temp_air for k, v in d.items()}
                            
                            data_dict_energy = data_dict['energy']
                            raw_dict = {}
                            for idx in data_dict_energy:
                                idx_str = idx.replace("kWh_", "")
                                raw_dict[(now_str, int(idx_str))] = data_dict_energy[idx]['Realtime_Value']
                            if len(self.temp_energy) > 30000:
                                self.temp_energy.pop(0)
                            self.temp_energy.append(raw_dict)
                            self.latest_energy_data = {k: v for d in self.temp_energy for k, v in d.items()}
                            time.sleep(0.2)
                except Exception as e:
                    print('=>', str(e))

    def terminate(self):
        os._exit(0)

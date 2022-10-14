from typing import Any
import win32com.client

class IoTDS(object):
    def __init__(self):
        self.caoEng = win32com.client.Dispatch("CAO.CaoEngine")
        self.caoWss = self.caoEng.Workspaces
        self.caoWs = self.caoWss.Item(0)
        self.caoCtrls = self.caoWs.Controllers
        self.caoControllers = {}
        self.caoVars = {}
        self.ctrls = []
        self.vars = []

    def add_controllers(self, ctrl_name: str):
        if ctrl_name in self.ctrls:
            return
        
        ctrl_str = f"Controller={ctrl_name}"
        self.caoControllers[ctrl_name] = self.caoCtrls.Add(
            ctrl_name, "CaoProv.DENSO.IoTDS", "", ctrl_str
        )
        self.ctrls.append(ctrl_name)

    def add_items(self, ctrl_name: str, items_name: list[str] = []):
        for item_name in items_name:
            key = f"{ctrl_name}_{item_name}"
            self.caoVars[key] = self.caoControllers[ctrl_name].AddVariable(item_name)
            self.vars.append(key)

    def read_ids(self, ctrl_name: str, item_name: str) -> Any:
        key = f"{ctrl_name}_{item_name}"
        if key not in self.vars:
            return None
        val = self.caoVars[f"{ctrl_name}_{item_name}"].Value

        return val

    def write_ids(self, ctrl_name, item_name, value):
        key = f"{ctrl_name}_{item_name}"
        self.caoVars[key].Value = value

    def release(self):
        self.caoCtrls = None
        self.caoWs = None
        self.caoWss = None
        self.caoEng = None
        self.caoControllers = {}
        self.caoVars = {}
        self.ctrls = []
        self.vars = []

# if __name__ == '__main__' :
#     while True:
#         print(read_ids('CtlCamera_11', 'SeqNo'))
#         time.sleep(1)

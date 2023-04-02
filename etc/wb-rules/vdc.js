log("VDC");
var devices = readConfig("/etc/wb-rules/vdc.conf").devices;

function defineVirtualDevices(src) {
    src.forEach(function (device) {
        defineVirtualDevice(device.name, {
            title: device.title,
            cells: {}
        });

        device.cells.forEach(function (cell) {
			var ro = false;
			if (cell.readonly)
				ro = cell.readonly;

            var val;
			if (typeof cell.get == "string")
				val = dev[cell.get];
			else if(cell.get)
				if (cell.get.type === "whenChanged") {
					val = dev[cell.get.topic];
				}

            if (cell.type === "switch") {
                getDevice(device.name).addControl(cell.title, {
                    type: cell.type,
                    readonly: ro,
                    value: val
                });
            }
            else if (cell.type === "range") {
                getDevice(device.name).addControl(cell.title, {
                    type: cell.type,
                    readonly: ro,
                    min: cell.min,
                    max: cell.max,
                    value: val
                });

            }
            else if (cell.type === "value") {
                getDevice(device.name).addControl(cell.title, {
                    type: cell.type,
                    readonly: ro,
                    value: val,
                    units: cell.units
                });
            }
            else if (cell.type === "text") {
                getDevice(device.name).addControl(cell.title, {
                    type: cell.type,
                    value: val
                });
            }
			
        });			
        device.cells.forEach(function (cell) {			
			if ((typeof cell.get == "string") && (cell.get !== "")) {
				var srcDev;
				var srcCell;
				if (cell.get.indexOf("/",0) === -1) {
					srcDev = device.name;
					srcCell = cell.get;
				}
				else {
					srcDev = cell.get.split("/")[0];
					srcCell = cell.get.split("/")[1];
				}
				
				if ((cell.type === "range") && (getDevice(srcDev).getControl(srcCell).getType() === "switch"))
				{
					defineRule({
						whenChanged: srcDev + "/" + srcCell,
						then: function (newValue) {
							dev[device.name][cell.title] = newValue ? cell.max : cell.min;
						}
					});
				}
				else
					defineRule({
						whenChanged: srcDev + "/" + srcCell,
						then: function (newValue) {
							dev[device.name][cell.title] = newValue;
						}
					});
			}
			if ((typeof cell.set == "string") && (cell.set !== "")) {
				var dstDev;
				var dstCell;
				if (cell.set.indexOf("/",0) === -1) {
					dstDev = device.name;
					dstCell = cell.set;
				}
				else {
					dstDev = cell.set.split("/")[0];
					dstCell = cell.set.split("/")[1];
				}
				
			if ((cell.type === "switch") && (getDevice(dstDev).getControl(dstCell).getType() === "range"))
				{
					defineRule({
						whenChanged: device.name + "/" + cell.title,
						then: function (newValue) {
							dev[dstDev][dstCell] = newValue ? getDevice(dstDev).getControl(dstCell).getMax() : getDevice(dstDev).getControl(dstCell).getMin();
						}
					});
				}
				else
                defineRule({
                    whenChanged: device.name + "/" + cell.title,
                    then: function (newValue) {
                        dev[dstDev][dstCell] = newValue;
                    }
				});
			}
        });
    });
}

defineVirtualDevices(devices);

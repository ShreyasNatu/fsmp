(function() {
'use strict';

angular.module('core')
.service('SyncService', SyncService);

SyncService.$inject = ['$http'];
function SyncService($http) {
  let service = this;
  let baseUrl = 'http://localhost:8384';

  let apiKey = '';
  // let apiKey = 'LhrjDydde9XMQyHGZ6qnakyMhFvUmbfX';
  let myDeviceId = '';

  service.getApiKey = () => apiKey;
  service.setApiKey = (newApiKey) => {
    apiKey = newApiKey;
  };

  service.getMyDeviceId = () => myDeviceId;
  service.setMyDeviceId = (newDeviceId) => {
    myDeviceId = newDeviceId;
  };

  service.getCfg = (callback) => {
    var req = {
      method: 'GET',
      url : baseUrl + '/rest/system/config',
      headers : {
        'X-API-Key': apiKey
      }
    };

    $http(req).then((response) => {
      callback(response.data);
    }, (error) => {
      console.log(error);
    });
  };

  service.checkDeviceId = (deviceId, callback) => {
    let req = {
      method: 'GET',
      url : baseUrl + '/rest/svc/deviceid?id=' + deviceId,
      headers : {
        'X-API-Key': apiKey
      }
    };
    $http(req).then((response) => {
      callback(response);
    }, (error) => {
      console.log(error.status);
    });
  };

  service.updateCfg = (cfg, callback) => {
    var req = {
      method: 'POST',
      url : baseUrl + '/rest/system/config',
      headers : {
        'X-API-Key': apiKey
      },
      data: cfg
    };
    $http(req).then((response) => {
      callback(response.status)
    }, (error) => {
      console.log(error)
    })
  };

  service.removeDevice = (deviceId) => {
    service.getCfg((cfg) => {
    	let len = cfg.devices.length;
      let index = 0; // index of the default filder

    	cfg.devices = cfg.devices.filter(d => {
    		d.deviceID != deviceId;
    	});

      for (let n = cfg.folders.length; index < n; index++) {
        if (cfg.folders[index].id == 'default') break;
      }

      cfg.folders[index].devices = cfg.folders[index].devices.filter(d => {
        d.deviceID != deviceId;
      });


    	if(len == cfg.devices.length){
    		console.log("No device with id: " + deviceId);
    	} else {
    		service.updateCfg(cfg, (status) => {
    			if(status == 200){
    				console.log('Device deleted');
    			}
        })
    	}
    })
	}
}

}());

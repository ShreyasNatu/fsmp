(function() {
'use strict';

angular.module('public')
.component('contractPage', {
  templateUrl: 'app/public/contract-page/contract-page.template.html',
  controller: ContractPageController
});

ContractPageController.$inject = ['appConfig', 'Web3Service', 'AccountsService', '$scope', '$q'];
function ContractPageController(appConfig, Web3Service, AccountsService, $scope, $q) {

    var ctrl = this,
        web3, currentAccount, contractAddress, contract;

    ctrl.$onInit = onInit;//get coinbase, contract etc.

    ctrl.buyOrders = []; //all buy orders in the chain

    ctrl.sellOrders = []; //all sell orders in the chain

    ctrl.storageContracts = [];

    ctrl.createBuyOrderDisabled = false;

    ctrl.unlockAccount = unlockAccount;//?????????
    ctrl.getCurrentAccount = getCurrentAccount;
    ctrl.createBuyOrder = createBuyOrder;
    ctrl.createSellOrder = createSellOrder;
    ctrl.createStorageContract = createStorageContract;
    ctrl.getBuyOrders = getBuyOrders;
    ctrl.getSellOrders = getSellOrders;
    ctrl.getStorageContracts = getStorageContracts;
    ctrl.cancelOrder = cancelOrder;
    ctrl.manageStorageContract = manageStorageContract;

    function unlockAccount(pwd) {
      web3.personal.unlockAccount(currentAccount, pwd, 10000);
    }

    function getCurrentAccount() {
      return currentAccount;
    }

    function createBuyOrder(cbo) {
      //prevent multiple requests
      ctrl.createBuyOrderDisabled = true;

      contract.createBuyOrder.sendTransaction(
        cbo.volumeGB,
        cbo.pricePerGB,
        cbo.connectionInfo,

        {from: currentAccount,
          value: cbo.weiInitialAmount,
          gas: 1000000},
      // callback
        (err) => {
          if (err) {
            console.log(err);
          } else {
            getBuyOrders();
          }
        });
    }

    function createSellOrder(cso) {

      ctrl.createSellOrderDisabled = true;

      contract.createSellOrder.sendTransaction(
            cso.volumeGB,
            cso.pricePerGB,
            cso.connectionInfo,
            {from: currentAccount,
              value: 0,
              gas: 1000000},
            //callback
            (err, success) => {
              if (err) {
                console.log(err);
              } else {
                console.log('Created');
                getSellOrders();
              }
            });

    }

    function createStorageContract(orderIndex, orderId, orderType, connectionInfo) {
      contract.createStorageContract.sendTransaction(
        orderIndex,
        orderId,
        orderType,
        connectionInfo,
        { from: currentAccount,
          value: 0,
          gas: 1000000},

        (err) => {
          if (err) {
            console.log(err);
          } else {
            deleteOrder(orderType, orderId);

            //FIXME: gets SC next after last in the array. NOT IN END PRODUCTION
            getStorageContract(ctrl.storageContracts.length);
          }
      });
    }

    function deleteOrder(type, id) {
      console.log(type);
      if (type == 1) {
        deleteFromArray(ctrl.buyOrders, id);
      } else {
        deleteFromArray(ctrl.sellOrders, id);
      }
    }

    function deleteFromArray(arr, id) {
      for (let i = 0, n = arr.length; i < n; i++) {
        if (arr[i].id === id) {
          $scope.$apply(() => {
            arr.splice(i, 1);
          });
          return;
        }
      }
    }

    function getBuyOrder(index, boLength) {

      let promise = $q((resolve, reject) => {
        contract.getBuyOrder(index, (error, gboArr) => {
          if (error) {
            reject('No buy order because of ' + error);
          } else {
            resolve(gboArr);
          }
        });
      });

      promise.then((gboArr) => {

        let gbo = {
          id: +gboArr[0],
          DO: gboArr[1],
          volumeGB: parseFloat(gboArr[2]),
          pricePerGB: parseFloat(gboArr[3]),
          weiInitialAmount: parseFloat(gboArr[4]),
          connectionInfo: gboArr[5],
          index: index
        };

        ctrl.buyOrders.push(gbo);
        if (index === boLength - 1) ctrl.createBuyOrderDisabled = false;

      }, (error) => {
        console.log(error);
      });
    }

    function getSellOrder(index, soLength) {
      let promise = $q((resolve, reject) => {
        contract.getSellOrder(index, (err, soArr) => {
          if (err) {
            reject(err);
          } else {
            resolve(soArr);
          }
        });
      });

      promise.then((soArr) => {
        let so = {
          id: +soArr[0],
          DO: soArr[1],
          volumeGB: parseFloat(soArr[2]),
          pricePerGB: parseFloat(soArr[3]),
          connectionInfo: soArr[4],
          index: index
        };

        ctrl.sellOrders.push(so);
        if (index === soLength - 1) ctrl.createSellOrderDisabled = false;

      }, (err) => {
        console.log(err);
      });

    }

    function getStorageContract(index) {
      let promise = $q((resolve, reject) => {
        contract.getStorageContract(index, (err, scArr) => {
          if (err) {
            reject(err);
          } else {
            resolve(scArr);
          }
        });
      });

      promise.then((scArr) => {
        let sc = {
          id: +scArr[0],
          DOAddress: scArr[1],
          DSOAddress: scArr[2],
          DOConnectionInfo: scArr[3],
          DSOConnectionInfo: scArr[4],
          volumeGB: parseFloat(scArr[5]),
          startDate: parseDate(scArr[6]),
          stopDate: parseDate(scArr[7]),
          pricePerGB: parseFloat(scArr[8]),
          weiLeftToWithdraw: parseFloat(scArr[9]),
          withdrawedAtDate: parseFloat(scArr[10]),
          index: index
        };
        ctrl.storageContracts.push(sc);

      }, (err) => {
        console.log(err);
      });


    }

    function parseDate(timestamp) {
      return (!+timestamp) ? '-' : new Date(+timestamp)
    }

    function getBuyOrders() {
      ctrl.buyOrders = [];

      var boLength = +contract.buyOrdersLength();

      for (var i = 0, n = boLength; i < n; i++) {
        getBuyOrder(i, boLength);
      }
    }

    function getSellOrders() {
      ctrl.sellOrders = [];
      var soLength = +contract.sellOrdersLength();

      for (var i = 0, n = soLength; i < n; i++) {
        getSellOrder(i, soLength);
      }
    }

    function getStorageContracts() {
      ctrl.storageContracts = [];
      var scLength = +contract.storageContractsLength();

      for (var i = 0, n = scLength; i < n; i++) {
        getStorageContract(i, scLength);
      }
    }

    function cancelOrder(type, index, id) {
      if (type == 'buy') {
        contract.cancelBuyOrder(index, id);
      } else if (type == 'sell') {
        contract.cancelSellOrder(index, id);
      } else {
        throw new Error('Can\'t cancel order of type-> ' + type);
      }

      //refresh tables
      if (type == 'buy') getBuyOrders();
      else getSellOrders();
    }

    //invokes 'startStorageContract', 'stopStorageContract',
    //'withdrawFromStorageContract', 'refillStorageContract'
    function manageStorageContract(storageContractIndex, storageContractID, method, wei) {
      let methods = [
        'startStorageContract',
        'stopStorageContract',
        'withdrawFromStorageContract',
        'refillStorageContract'
      ];

      if (methods.indexOf(method) < 0) {
        throw new Error('Contract has no method -> ' + method);
      }

      contract[method].sendTransaction(
        storageContractIndex,
        storageContractID,
        {from: currentAccount,
         value: wei || 0,
         gas: 1000000}
      );

      getStorageContracts();
    }

    function onInit() {
      web3 = Web3Service.getWeb3();

      currentAccount = AccountsService.getCurrentAccount();

      contractAddress = appConfig.getContractAddress();

      if (!contractAddress) {
        alert('You didn\'t provide contract address. Provide correct contract address!');
        //redirect to main
        return;
      }

      contract = web3.eth.contract(appConfig.abi).at(contractAddress);

      getBuyOrders();
      getSellOrders();
      getStorageContracts();
    };

  }//end controller function

}());

const HDWalletProvider = require("@truffle/hdwallet-provider");
const config = require('./config.json');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    test: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(config.rinkeby_mnemonic, `https://rinkeby.infura.io/v3/${config.rinkeby_infura_api_key}`);
      },
      network_id: '4',
      gas: 10000000
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider(config.rinkeby_mnemonic, `https://goerli.infura.io/v3/${config.rinkeby_infura_api_key}`);
      },
      network_id: '5',
      gas: 10000000
    }
  }
};

const DappletRegistry = artifacts.require("DappletRegistry");

module.exports = function (deployer) {
    deployer.deploy(DappletRegistry);
};
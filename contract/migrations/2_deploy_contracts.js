const AttachmentRegistry = artifacts.require("AttachmentRegistry");

module.exports = function (deployer) {
    deployer.deploy(AttachmentRegistry);
};
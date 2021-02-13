// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract AttachmentRegistry {
    mapping(bytes32 => bytes32[]) referencesByKey;
    mapping(address => bytes32[]) referencesByAccount;

    function add(bytes32 key, bytes32 ref) public {
        referencesByKey[key].push(ref);
        referencesByAccount[msg.sender].push(ref);
    }

    function getByKey(bytes32 key) view public returns (bytes32[] memory) {
        return referencesByKey[key];
    }

    function getByAccount(address key) view public returns (bytes32[] memory) {
        return referencesByAccount[key];
    }
}

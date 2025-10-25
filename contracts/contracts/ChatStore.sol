// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChatStore {
    struct Message { address author; uint64 timestamp; bytes content; }
    mapping(bytes32 => Message[]) private logs;

    event MessageAppended(bytes32 indexed chatId, address indexed author, uint64 timestamp, bytes content);

    function append(bytes32 chatId, bytes calldata content) external {
        logs[chatId].push(Message(msg.sender, uint64(block.timestamp), content));
        emit MessageAppended(chatId, msg.sender, uint64(block.timestamp), content);
    }

    function count(bytes32 chatId) external view returns (uint256) { return logs[chatId].length; }

    function getRange(bytes32 chatId, uint256 start, uint256 end)
        external view returns (address[] memory authors, uint64[] memory timestamps, bytes[] memory contents)
    {
        require(end >= start, "bad range");
        uint256 n = end - start;
        require(start + n <= logs[chatId].length, "oob");
        authors = new address[](n); timestamps = new uint64[](n); contents = new bytes[](n);
        for (uint256 i; i < n; i++) {
            Message storage m = logs[chatId][start + i];
            authors[i] = m.author; timestamps[i] = m.timestamp; contents[i] = m.content;
        }
    }
}

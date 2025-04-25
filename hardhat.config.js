require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Disable SSL certificate verification

module.exports = {
  solidity: "0.8.18",
  networks: {
    swell: {
      url: process.env.RPC_URL || "", // Fallback to an empty string if undefined
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Fallback to an empty array if undefined
    },
  },
};
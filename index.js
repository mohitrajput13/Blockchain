const express = require("express");
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const { AbortController } = require("abort-controller");

if (typeof global.AbortController === "undefined") {
    global.AbortController = AbortController;
}

const app = express();
const port = 3000;

app.use(express.json());

const ETHEREUM_USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const ethereumProvider = new ethers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/93bd69fb4161446a9fe47ca3ded14e1e"
);
const ethereumAbi = [
    "function balanceOf(address owner) view returns (uint256)",
];

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": "af6aafac-1046-43a0-b29b-fd7421215724" }
});

function isValidEthereumAddress(address) {
    return ethers.isAddress(address);
}

function isValidTronAddress(address) {
    if (typeof address !== 'string') return false;
    if (!address.startsWith('T')) return false;
    if (address.length !== 34) return false;

    try {
        return TronWeb.isAddress(address);
    } catch (error) {
        console.error("TronWeb validation error:", error);
        return false;
    }
}

app.post("/api/usdt-balance", async (req, res) => {
    const { address } = req.body;

    if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "A valid wallet address is required." });
    }

    const normalizedAddress = address.trim();
    console.log("Checking address:", normalizedAddress);

    try {
        if (isValidTronAddress(normalizedAddress)) {
            console.log("Valid TRON address detected, fetching balance...");

            try {
                const balance = await tronWeb.trx.getBalance(normalizedAddress);
                const formattedBalance = (parseFloat(balance.toString()) / 1e6).toFixed(6);

                return res.json({
                    network: "TRON",
                    address: normalizedAddress,
                    balance: `${formattedBalance} TRX`,
                });
            } catch (tronError) {
                console.error("TRON balance fetch error:", tronError);
                return res.status(500).json({
                    error: "Failed to fetch TRON balance",
                    details: tronError.message || "Unknown error",
                });
            }
        }
        else if (isValidEthereumAddress(normalizedAddress)) {
            console.log("Valid Ethereum address detected, fetching balance...");
            const contract = new ethers.Contract(
                ETHEREUM_USDT_CONTRACT_ADDRESS,
                ethereumAbi,
                ethereumProvider
            );

            try {
                const balance = await contract.balanceOf(normalizedAddress);
                const formattedBalance = ethers.formatUnits(balance, 6);

                return res.json({
                    network: "Ethereum",
                    address: normalizedAddress,
                    balance: `${formattedBalance} USDT`,
                });
            } catch (error) {
                console.error("Ethereum balance fetch error:", error);
                return res.status(500).json({
                    error: "Failed to fetch Ethereum balance",
                    details: error.message || "Unknown error",
                });
            }
        } else {
            return res.status(400).json({
                error: "Invalid wallet address format",
                address: normalizedAddress,
            });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({
            error: "Unexpected error occurred",
            details: error.message || "Unknown error",
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

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
const TRON_USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const NETWORKS = {
    TRON: 'TRON',
    ETHEREUM: 'Ethereum'
};

const ethereumProvider = new ethers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/93bd69fb4161446a9fe47ca3ded14e1e"
);
const ethereumAbi = ["function balanceOf(address owner) view returns (uint256)"];

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": "af6aafac-1046-43a0-b29b-fd7421215724" },
    privateKey: 'D526E0AB73B3552F0B0FB85838DB364D90C1CAC4BC76294373FABA83C04914DD'
});

const tronUsdtAbi = [
    {
        "constant": true,
        "inputs": [{ "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

function isValidEthereumAddress(address) {
    return ethers.isAddress(address);
}

function isValidTronAddress(address) {
    return TronWeb.isAddress(address);
}

function normalizeNetwork(network) {
    const normalizedNetwork = network.toLowerCase();
    if (normalizedNetwork.includes('tron')) return NETWORKS.TRON;
    if (normalizedNetwork.includes('eth')) return NETWORKS.ETHEREUM;
    return null;
}

app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check USDT Balance</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f7f8fa;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
        }

        h1 {
            text-align: center;
            color: #4a90e2;
        }

        label {
            font-size: 16px;
            margin: 8px 0;
            display: block;
            color: #333;
        }

        input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            margin: 10px 0;
        }

        .radio-group {
            margin: 10px 0;
        }

        .radio-group input {
            margin-right: 10px;
        }

        button {
            width: 100%;
            padding: 12px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        button:hover {
            background-color: #357abd;
        }

        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f1f8ff;
            border-radius: 4px;
            display: none;
        }

        .result.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .result.error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .result p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Check USDT Balance</h1>
        <form id="balanceForm">
            <label for="address">Wallet Address:</label>
            <input type="text" id="address" name="address" placeholder="Enter wallet address" required>
            
            <div class="radio-group">
                <label>Select Network:</label>
                <input type="radio" id="tron" name="network" value="TRON"> TRON
                <input type="radio" id="ethereum" name="network" value="Ethereum" checked> Ethereum
            </div>
            
            <button type="submit">Check Balance</button>
        </form>

        <div id="result" class="result"></div>
    </div>

    <script>
        document.getElementById('balanceForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const address = document.getElementById('address').value;
            const network = document.querySelector('input[name="network"]:checked').value;
            
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<p>Loading...</p>';

            try {
                const response = await fetch('/api/usdt-balance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        address,
                        network 
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        <p><strong>Network:</strong> \${result.network}</p>
                        <p><strong>Address:</strong> \${result.address}</p>
                        <p><strong>Balance:</strong></p>
                        <ul>
                            \${result.network === "TRON" ? \`<li>TRX: \${result.balance.TRX}</li>\` : ""}
                            \${result.network === "Ethereum" ? \`<li>ETH: \${result.balance.ETH}</li>\` : ""}
                            <li>USDT: \${result.balance.USDT}</li>
                        </ul>\`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`
                        <p><strong>Error:</strong> \${result.error}</p>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`
                    <p><strong>Error:</strong> Failed to fetch balance. Please try again.</p>
                \`;
            }
        });
    </script>
</body>
</html>
    `);
});

app.post("/api/usdt-balance", async (req, res) => {
    const { address, network } = req.body;

    if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "A valid wallet address is required." });
    }

    if (!network) {
        return res.status(400).json({ error: "Network selection is required." });
    }

    const normalizedNetwork = normalizeNetwork(network);
    if (!normalizedNetwork) {
        return res.status(400).json({ error: "Invalid network selected." });
    }

    const normalizedAddress = address.trim();
    console.log("Checking address:", normalizedAddress, "on network:", normalizedNetwork);

    try {
        if (normalizedNetwork === NETWORKS.TRON) {
            if (!isValidTronAddress(normalizedAddress)) {
                return res.status(400).json({ error: "Invalid TRON address format" });
            }

            try {
                const trxBalance = await tronWeb.trx.getBalance(normalizedAddress);
                const formattedTrxBalance = (parseFloat(trxBalance.toString()) / 1e6).toFixed(6);

                const contract = await tronWeb.contract(tronUsdtAbi, TRON_USDT_CONTRACT_ADDRESS);
                const usdtBalance = await contract.balanceOf(normalizedAddress).call();
                const formattedUsdtBalance = (parseFloat(usdtBalance.toString()) / 1e6).toFixed(6);

                return res.json({
                    network: NETWORKS.TRON,
                    address: normalizedAddress,
                    balance: {
                        TRX: `${formattedTrxBalance} TRX`,
                        USDT: `${formattedUsdtBalance} USDT`
                    }
                });
            } catch (tronError) {
                console.error("TRON balance fetch error:", tronError);
                return res.status(500).json({
                    error: "Failed to fetch TRON balance",
                    details: tronError.message || "Unknown error",
                });
            }
        }
        else if (normalizedNetwork === NETWORKS.ETHEREUM) {
            if (!isValidEthereumAddress(normalizedAddress)) {
                return res.status(400).json({ error: "Invalid Ethereum address format" });
            }

            try {
                const ethBalance = await ethereumProvider.getBalance(normalizedAddress);
                const formattedEthBalance = ethers.formatUnits(ethBalance, 18);

                const contract = new ethers.Contract(
                    ETHEREUM_USDT_CONTRACT_ADDRESS,
                    ethereumAbi,
                    ethereumProvider
                );

                const usdtBalance = await contract.balanceOf(normalizedAddress);
                const formattedUsdtBalance = ethers.formatUnits(usdtBalance, 6);

                return res.json({
                    network: NETWORKS.ETHEREUM,
                    address: normalizedAddress,
                    balance: {
                        ETH: `${formattedEthBalance} ETH`,
                        USDT: `${formattedUsdtBalance} USDT`
                    }
                });
            } catch (error) {
                console.error("Ethereum balance fetch error:", error);
                return res.status(500).json({
                    error: "Failed to fetch Ethereum balance",
                    details: error.message || "Unknown error",
                });
            }
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
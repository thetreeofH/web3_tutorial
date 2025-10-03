const { network } = require("hardhat")
const { devlopmentChains, networkConfig, LOCKTIME, CONFIRMATIONS } = require("../helper-hardhat-config")
require("@chainlink/env-enc").config()


module.exports = async ({ getNamedAccounts, deployments }) => {
    console.log("Deploying FundMe contract...")
    const { firstAccount } = await getNamedAccounts()
    const { deploy } = deployments

    let dataFeedAddr
    let blockConfirmations
    if (devlopmentChains.includes(network.name)) {
        console.log(`Network: ${network.name}`)
        const mockV3Aggregator = await deployments.get("MockV3Aggregator")    
        dataFeedAddr = mockV3Aggregator.address
        console.log(`MockV3Aggregator address: ${dataFeedAddr}`)
        blockConfirmations = 0;
    } else {
        console.log(`Network: ${network.name}`)
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdPriceFeed
        blockConfirmations = CONFIRMATIONS
    }

    console.log(`start to deploy fundme, blockConfirmations: ${blockConfirmations}`)
    const fundMe = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCKTIME, dataFeedAddr],
        log: true,
        waitConfirmations: blockConfirmations,
    })
    console.log(`FundMe deployed to: ${fundMe.address}`)

    if (network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Verify contract on Etherscan")
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCKTIME, dataFeedAddr],
        });
    } else {
        console.log("Network is not sepolia, Skip verification")
    }

}

module.exports.tags = ["all", "fundme"]
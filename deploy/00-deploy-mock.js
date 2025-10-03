const { DECIMAL, INITIAL_ANSWER, devlopmentChains } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    console.log("Deploying MockV3Aggregator contract...")
    if (devlopmentChains.includes(network.name)) {
        const { firstAccount } = await getNamedAccounts()
        console.log(`First account: ${firstAccount}`)
        const { deploy } = deployments;

        await deploy("MockV3Aggregator", {
            from: firstAccount,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true,
        })
        console.log("MockV3Aggregator deployed")
    } else {
        console.log("environment is not local, mock contract deployment is skipped")
    }

}

module.exports.tags = ["all", "mock"]
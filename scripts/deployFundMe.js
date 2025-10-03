// import ethers.js
// create main function 
// execute main function

const { ethers } = require("hardhat")


 async function main() {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("Deploying FundMe contract...")
    const fundMe = await fundMeFactory.deploy(10)
    await fundMe.waitForDeployment()
    console.log(`FundMe deployed to ${fundMe.target}`)

    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for block confirmations...")
        await fundMe.deploymentTransaction().wait(5)
        console.log("Waited 5 blocks")

        await verifyFundMe(fundMe.target, [10])
        console.log("Verified!")
    } else {
        console.log("Skip verification")
    }


    [fitstAccount, secondAccount] = await ethers.getSigners()
    console.log(`First account: ${fitstAccount.address}`)
    console.log(`Second account: ${secondAccount.address}`)

    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.00005") })
    await fundTx.wait(1)
    console.log("Funded 0.00005 ETH")

    const balance = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of contract is ${balance}`)

    // const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.00005") })

    const firstAccountBalance = await fundMe.fundersToAmount(fitstAccount.address)
    console.log(`Balance of first account ${firstAccountBalance}`)

}

async function verifyFundMe(target, args) {
    console.log("Verifying contract...")

    await hre.run("verify:verify", {
        address: target,
        constructorArguments: args,
    });
}
main().then().catch((error) => {
    console.error(error)
    process.exit(1)
})
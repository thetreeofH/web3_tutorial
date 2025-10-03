const { task } = require("hardhat/config")

task("interact-fundme", "Interact with FundMe contract")
    .addParam("addr", "The address of FundMe contract")
    .setAction(async (taskArgs, hre) => {
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        const fundMe = await fundMeFactory.attach(taskArgs.addr);

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
    })
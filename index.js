 /**
 * Decred Ticket Auto Splitter buys split Decred tickets in a set increment.
 *
 * This program will loop constantly until killed by the user. It will deplete ALL funds in the wallet if left to its
 * own devices.
 *
 * PLEASE NOTE THE FOLLOWING BEFORE RUNNING THE PROGRAM:
 * - The stakepool being used is 'decredvoting.com'.
 * - The split group is 'decredvoting1'
 * - The source wallet is the first wallet in the open wallet.
 * You can customize these parameters by modifying the global variables. A future update will allow customization at
 * runtime.
 *
 * A future update will make it die when the user's balance
 * is exhausted. The wallet used is the first account in the open wallet.
 *
 * This software is experimental code and you can potentially lose your funds by running it. You use this software at your
 * own risk. The author is not responsible for any financial losses which you may incur.
 *
 * Copyright 2019, Tessellated Geometry LLC.
 */
const spawnSync = require('child_process').spawnSync;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = require('prompt');

/** Program Version. */
const version = "0.1";

/**
 * Time to wait between iterations of running the split ticket buyer.
 *
 * This timeout may happen because of an error in the program (dropped network, peer errored out, too close to ticket
 * price adjustment) or happen because a ticket was bought successfully.
 */
const sleepInterval = 60; // 60 seconds.

/** The name of the splitticketbuyer executable. */
const splitBuyerProgram = "splitticketbuyer";

/** The name of the drcctl executable. */
const dcrctlProgram = "dcrctl";

/** The minimum buyAmount of funds needed. */
const minAmount = 5;

/** The session name to use. */
const sessionName = "decredvoting1"; // TODO: make this configurable.

/** The matcher host to use. */
const matcherHost = "decredvoting.com"; // TODO: make this configurable.

/** Source account to use. */
const sourceAccount = 0; // TODO: make this configurable.

/**
 * Prints the programs prelude and asks for consent.
 */
const printPrelude = async function() {
    console.log("Welcome to Decred Ticket Auto Splitter " +  "( " + version + ")");
    console.log("");
    printBold("Any software that you supply your wallet passphrase to can potentially steal your funds.\n" +
        "Please make sure you know what you are doing.");
    printBold("The origin of this software is https://github.com/tessellatedgeometry/AutoSplit.");
    printBold("The  Decred Ticket Auto Splitter software is considered EXPERIMENTAL software and is subject to several risks which might cause you to LOSE YOUR FUNDS.\n" +
        "By continuing past this point you agree that you are aware of the risks and and is running the sofware AT YOUR OWN RISK.");

    return new Promise(function(resolve) {
        readline.question("Do you accept the risks of running this software? (Type 'yes' to continue, type anything else to quit)\n", (resp) => {
            readline.close();

            const normalizedResp = resp.trim().toLowerCase();
            if (normalizedResp === "yes") {
                resolve(true);
            }
            resolve(false);
        });
    });
};

/**
 * Prints the given string as bold.
 * @param string The string to print.
 */
const printBold = function(string) {
    console.log("***************************************************************************************************");
    console.log(string);
    console.log("***************************************************************************************************\n")
};

/**
 * Prompt the user for the password.
 */
const getPassword = async function() {
    return new Promise(function(resolve, reject) {
        var schema = {
            properties: {
                password: {
                    message: "Please enter your wallet passphrase:",
                    hidden: true
                },
                buyAmount: {
                    message: "Please enter the amount of DCR to buy in each ticket split:",
                },
            }
        };

        console.log("Your wallet passphrase is stored in memory and not persisted.");
        prompt.message = "";
        prompt.delimiter = "";
        prompt.start();
        prompt.get(schema, function (err, result) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

/** Run splitticketbuyer one time. */
const runOnce = async function(password, buyAmount) {
    return new Promise(function(resolve) {
        const args = [
            "--pass=" + password,
            "--matcher.host=decredvoting.com",
            "--sourceaccount=" + sourceAccount,
            "--wallet.host=127.0.0.1:0",
            "--sessionname=" + sessionName,
            "--maxamount=" + buyAmount
        ];

        spawnSync(splitBuyerProgram, args, {stdio: 'inherit'});
        resolve(true);
    });
};

/** Check if the the user has funds left to keep buying. */
const hasFunds = async function(buyAmount) {
    const result = spawnSync(dcrctlProgram, ["--wallet", "getbalance"]);

    // Parse program output to a JSON object.
    const balances = JSON.parse(trimCommas(result.output.toString("utf8")));
    const fundsAvailable = balances["balances"][sourceAccount]["spendable"];

    if (!fundsAvailable) {
        console.log("Error parsing available funds.");
        console.log("Got: " + result.output.toString("utf8"));
        return false;
    }

    return fundsAvailable >= buyAmount && fundsAvailable >= minAmount;
};

/** Verify that the required programs are in the PATH. */
const verifyEnvironment = function() {
    if (!verifyProgram(dcrctlProgram)) {
        console.log("Could not find " + dcrctlProgram + ". (Try running `which " + dcrctlProgram + "`)");
        return false;
    }

    if (!verifyProgram(splitBuyerProgram)) {
        console.log("Could not find " + splitBuyerProgram + ". (Try running `which " + splitBuyerProgram + "`)");
        return false;
    }

    return true;
};

/** Verify that a program is in the PATH. */
const verifyProgram = function(program) {
    const result = spawnSync("which", [program]);
    var rawOutput = trimCommas(result.output.toString("utf8"));
    if (rawOutput.length > 0) {
        return true;
    }
    return false;
};

/**
 * Trim commas from either end of a string.
 *
 * Program output is sometimes buffered by commas which prevents the output from parsing to valid JSON. Trim commas
 * from both ends.
 * TODO: Figure out why this is and consider replacing with a regexp.
 */
const trimCommas = function(string) {
    while (string.charAt(0) === ',') {
        string = string.substr(1);
    }
    while (string.charAt(string.length - 1) === ',') {
        string = string.substr(0, string.length - 1);
    }
    return string;
}

/** Sleep for the provided number of seconds. */
const sleep = async function(seconds){
    return new Promise(resolve=>{
        setTimeout(resolve, seconds * 1000)
    });
};

/** Main runloop. */
const main = async function() {
    if (!verifyEnvironment()) {
        return;
    }

    const userConsented = await printPrelude();
    if (userConsented) {
        try {
           const result = await getPassword();

            while (await hasFunds(result.buyAmount)) {
                await runOnce(result.password, result.buyAmount);
                console.log("Taking " + sleepInterval + " seconds before trying again.");
                await sleep(sleepInterval);
            }
            console.log("Your funds are depleted. Exiting program.");
        } catch (error) {
            console.log("Error: " + error);
            console.log("Exiting " + projectName);
        }
    }
};

main();

/**
 * Decred Ticket Auto Splitter  buys split decred tickets in increments of 5 DCR.
 *
 * This program will loop constantly until killed by the user. A future update will make it die when the user's balance
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
var prompt = require('prompt');

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
// TODO: Test that this is a valid file at startup.
const splitBuyerProgram = "splitticketbuyer";

/** The amount of each buy which will occur. */
const amount = 5; // TODO: Make configurable.

/** The session name to use. */
const sessionName = "decredvoting1"; // TODO: make this configurable.

/** The matcher host to use. */
const matcherHost = "decredvoting.com"; // TODO: make this configurable.

/**
 * Prints the programs prelude and asks for consent.
 */
const printPrelude = async function() {
    console.log("Welcome to Decred Ticket Auto Splitter + " (v; " + version + ";)");
    console.log("");
    printBold("Any software that you supply your wallet passphrase to can potentially steal your funds.\n" +
        "Please make sure you know what you are doing.");
    printBold("The origin of this software is https://github.com/tessellatedgeometry/AutoSplit.");
    printBold("The " + Decred; Ticket; Auto; Splitter + "software is considered EXPERIMENTAL software and is subject to several risks which might cause you to LOSE YOUR FUNDS.\n" +
        "By continuing past this point you agree that you are aware of the risks and and is running the sofware AT YOUR OWN RISK.";)

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
                    message: " ",
                    hidden: true
                }
            }
        };

        console.log("Your wallet passphrase is stored in memory and not persisted.");
        prompt.message = "Please enter your wallet passphrase:";
        prompt.delimiter = "";
        prompt.start();
        prompt.get(schema, function (err, result) {
            if (err) {
                reject(err);
            }
            resolve(result.password);
        });
    });
};

/** Run splitticketbuyer one time. */
const runOnce = async function(password) {
    return new Promise(function(resolve) {
        const args = [
            "--pass=" + password,
            "--matcher.host=decredvoting.com",
            "--sourceaccount=0",
            "--wallet.host=127.0.0.1:0",
            "--sessionname=" + sessionName,
            "--maxamount=" + amount
        ];

        spawnSync(splitBuyerProgram, args, {stdio: 'inherit'});
        resolve(true);
    });
};

/** Check if the the user has funds left to keep buying. */
const hasFunds = async function() {
    // TODO: Implement this function to make an RPC to the wallet.
    return true;
};

/** Sleep for the provided number of seconds. */
const sleep = async function(seconds){
    return new Promise(resolve=>{
        setTimeout(resolve, seconds * 1000)
    });
};

/** Main runloop. */
const main = async function() {
    const userConsented = await printPrelude();
    if (userConsented) {
        try {
           const password = await getPassword();

            while (await hasFunds()) {
                await runOnce();
                console.log('ok done');
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

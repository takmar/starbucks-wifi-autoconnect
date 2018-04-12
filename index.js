const {delay} = require('lodash');
const isReachable = require('is-reachable');
const puppeteer = require('puppeteer');

const CONNECTION_DELAY = 10000;

const checkConnection = async () => {
    // TODO - isReachable always returns true even when blocked
    const connected = await isReachable('google.com');
    const dateTime = new Date().toLocaleString();
    if (connected) {
        console.log(`${dateTime} | connected`);
        return scheduleCheck();
    }
    console.log(`${dateTime} | disconnected`);
    console.log('attempting to reconnect...');
    try {
        const browser = await puppeteer.launch({headless: false, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
        const page = await browser.newPage();
        await page.goto('https://service.wi2.ne.jp/wi2auth/at_STARBUCKS_Wi2/index.html');
        // A cookie warning page always appears
        page.waitForSelector('#login_btn_wi2')
            .then(login => {
                login.click();
                // Click the next page button
                page.waitForSelector('#button_next_page')
                    .then(nextPage => {
                        nextPage.click();
                        // Click the accept button
                        page.waitForSelector('#button_accept')
                            .then(async accept => {
                                accept.click();
                                console.log(`${new Date().toLocaleString()} | reconnected`);
                                scheduleCheck();
                                delay(async () => await browser.close(), 500);
                            })
                            .catch(async () => {
                                console.log('accept button never loaded');
                                scheduleCheck();
                                await browser.close();
                            });
                    })
                    .catch(async () => {
                        console.log('next page button never loaded');
                        await browser.close();
                        scheduleCheck();
                    });
            })
            .catch(async () => {
                console.log('login button never loaded');
                await browser.close();
                scheduleCheck();
            });
    } catch(error) {
        console.log('browser failed to launch');
        scheduleCheck();
    }

};

const scheduleCheck = () => delay(checkConnection, CONNECTION_DELAY);

checkConnection();

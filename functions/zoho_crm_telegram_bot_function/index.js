const express = require("express");
const app = express();
const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot('<insert ur bot token>');
var axios = require('axios');
var FormData = require('form-data');
var catalyst = require('zcatalyst-sdk-node');
app.use(express.json());

app.get('/', (req, res) => {

    res.send('in get');
})


app.get('/login', async(req, res) => {
    console.log('in redirect login in advanced io function with incoming data as : -  ');
    console.log(req.query);
    var bodyFormData = new FormData();
    var catalystApp = catalyst.initialize(req);
    bodyFormData.append('grant_type', 'authorization_code');
    bodyFormData.append('client_id', '<insert ur client id>');
    bodyFormData.append('code', req.query.code);
    bodyFormData.append('client_secret', '<insert ur client secret>');
    bodyFormData.append('redirect_uri', '<insert ur redirect uri>');
    var refresh_token = '';
    try {
        var url = "https://accounts.zoho.com/oauth/v2/token";
        const getToken = await axios.post(url, bodyFormData, {
            headers: bodyFormData.getHeaders()
        });
        refresh_token = getToken.data.refresh_token;
        console.log(getToken.data);
        console.log(getToken.status);
        console.log(getToken.statusText);
        var awaitedResult = await storeInfoToDB(req.query.state, getToken.data.access_token, getToken.data.refresh_token, catalystApp);
        res.send('You are logged in. Now close this window and go back to your Telegram Bot ');

    } catch (err) {
        console.log('Error in axios operation ');
        console.log(err.response);
        console.log(error.response.status);
        console.log(error.response.headers);

    }

})



async function storeInfoToDB(telegramid, accessToken, refreshToken, catalystApp) {
    //get the catalyst handle here and start
    console.log(' in storeInfoToDB with the following data to insert  :  ');
    try {
        //Create a json Object with the row details to be inserted
        var opResult = false;
        let rowData = {
            telegramUserID: telegramid, //need to check this
            accessToken: accessToken,
            refreshToken: refreshToken
        };
        //Use Table Meta Object to insert the row which returns a promise
        console.log(rowData);


        let datastore = catalystApp.datastore();
        let table = datastore.table('storeLoginInfo');

        //check if row already present for the telegramuser.
        //if so, do not add
        var queryString = 'select * from storeLoginInfo where telegramUserID=' + telegramid;
        console.log(queryString);
        let zcql = catalystApp.zcql();
        let zcqlPromise = zcql.executeZCQLQuery(queryString);

        zcqlPromise.then(async(queryResult) => {
            console.log('No. of rows in storeLoginInfo table for the telegramuser is ' + queryResult.length);
            if (queryResult.length > 0) {

                //drop the row and add the new entry as it may have the updated accessToken
                //Use Table Meta Object to delete a single row using ROWID which returns a promise
                let rowPromise = table.deleteRow(queryResult[0].storeLoginInfo.ROWID);
                rowPromise.then((row) => {
                    console.log('---------- DROPPED ROW -------------');
                    console.log(row);
                });

                let insertPromise = await table.insertRow(rowData);
                console.log(insertPromise);
                opResult = true;
                return opResult;
            } else {
                let insertPromise = await table.insertRow(rowData);
                console.log(insertPromise);
                console.log('---------- ROW INSERTED ------------');
                opResult = true;
                return opResult;

            }
        })

    } catch (err) {
        console.log(err);
        opResult = false;
        return opResult;
    }

}
module.exports = app;

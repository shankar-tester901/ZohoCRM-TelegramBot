const TelegramBot = require('node-telegram-bot-api')
var axios = require('axios');
var FormData = require('form-data');
var cheerio = require('cheerio');
var catalyst = require('zcatalyst-sdk-node');
const bot = new TelegramBot('put ur bot token here');
var context_global;
var got = require('got');
const util = require('util');

/**This has to be executed in Postman to set the web hook. bot is followed by the telegram token
 * 
 * https://api.telegram.org/bot1901601891:<token>/setwebhook
 * {
    "url": "<ur zohocatalyst serverless function url >"
}
 */

module.exports = (context, basicIO) => {
    var info = basicIO.getAllArguments();
    context_global = context;
    bot.processUpdate(info);
    message = info.edited_message;
    if (message == undefined) {
        message = info.message;
    }
    context.close();
};


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to the Zoho CRM-Telegram bot", {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: "Login to Zoho CRM",
                    callback_data: 'login'
                }],
            ]
        }
    });
})



bot.onText(/\/logout/, (message) => {
    console.log('in logout now ------------  ' + message.from.id);
    var catalystApp = catalyst.initialize(context_global);
    var zcql = catalystApp.zcql();
    var queryString = 'delete from storeLoginInfo where telegramUserID=' + message.from.id;
    console.log(queryString);
    let zcqlPromise = zcql.executeZCQLQuery(queryString);

    zcqlPromise.then(async(queryResult) => {
        console.log(queryResult);
        console.log('>>>>>>>>>>>>>>>> LOGGED OUT >>>>>>>>>>>>>>>');
        bot.sendMessage(message.chat.id, 'You are logged out. Type /start to login again');
    })

})


bot.onText(/\/getLeads/, async(message) => {
    console.log('in get leads now ------------  ');
    //  console.log(message);
    var url = 'https://www.zohoapis.com/crm/v2/Leads?per_page=10';
    var result = await getAccessTokenFromDB(message, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;
    console.log(dataShow);
    console.log('Row Ct ' + dataShow.data.length);
    var headers = '<b> Name     Phone </b> \n\n';
    var leadInfo = '';
    for (i = 0; i < dataShow.data.length; i++) {
        leadInfo = leadInfo + " " + dataShow.data[i].Full_Name + "     " + dataShow.data[i].Phone + " \n";
    }

    var HTML = '<pre>' + headers + leadInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})



bot.onText(/\/getContacts/, async(message) => {
    console.log('in get Contactss now ------------  ');

    var url = 'https://www.zohoapis.com/crm/v2/Contacts?per_page=10';
    var result = await getAccessTokenFromDB(message, url);
    // console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;

    console.log('Row Ct ' + dataShow.data.length);
    var headers = '<b> Name     Email </b> \n\n';
    var contactInfo = '';
    for (i = 0; i < dataShow.data.length; i++) {
        contactInfo = contactInfo + " " + dataShow.data[i].Full_Name + "     " + dataShow.data[i].Email + " \n";
    }
    var HTML = '<pre>' + headers + contactInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})




bot.onText(/\/getAccounts/, async(message) => {
    console.log('in get Accounts now ------------  ');
    var url = 'https://www.zohoapis.com/crm/v2/Accounts?per_page=10';
    var result = await getAccessTokenFromDB(message, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;
    console.log('Row Ct ' + dataShow.data.length);
    var headers = '<b> Name     Website </b> \n\n';
    var leadInfo = '';
    for (i = 0; i < dataShow.data.length; i++) {
        leadInfo = leadInfo + " " + dataShow.data[i].Account_Name + "     " + dataShow.data[i].Website + " \n";
    }

    var HTML = '<pre>' + headers + leadInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})




bot.onText(/\/getDeals/, async(message) => {
    console.log('in get Deals now ------------  ');
    var url = 'https://www.zohoapis.com/crm/v2/Deals?per_page=10';
    var result = await getAccessTokenFromDB(message, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;
    var headers = '<b> Name     Amount </b> \n\n';
    var leadInfo = '';
    for (i = 0; i < dataShow.data.length; i++) {
        leadInfo = leadInfo + " " + dataShow.data[i].Deal_Name + "     " + dataShow.data[i].Amount + " \n";
    }
    var HTML = '<pre>' + headers + leadInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})




bot.onText(/\/searchLeads (.+)/, async(msg, match) => {
    console.log('in searchLead  ------------  ');

    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    console.log(chatId);
    console.log(resp);

    var url = 'https://www.zohoapis.com/crm/v2/Leads/search?email=' + resp;
    var result = await getAccessTokenFromDB(msg, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;
    var headers = '<b> Name     Email </b> \n\n';
    var leadInfo = '';


    if (result.status == '204') {
        console.log(' in 204 ');
        leadInfo = 'No matching records found. Pls change your search term and try again';
    } else {
        for (i = 0; i < dataShow.data.length; i++) {
            leadInfo = leadInfo + " " + dataShow.data[i].Last_Name + "     " + dataShow.data[i].Email + " \n";
        }
    }

    var HTML = '<pre>' + headers + leadInfo + '</pre>';

    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})



bot.onText(/\/searchContacts (.+)/, async(msg, match) => {
    console.log('in searchContact  ------------  ');

    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    console.log(chatId);
    console.log(resp);

    var url = 'https://www.zohoapis.com/crm/v2/Contacts/search?email=' + resp;
    var headers = '<b> Name     Email </b> \n\n';
    var leadInfo = '';
    var result = await getAccessTokenFromDB(msg, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;

    if (result.status == '204') {
        console.log(' in 204 ');
        leadInfo = 'No matching records found. Pls change your search term and try again';
    } else {
        for (i = 0; i < dataShow.data.length; i++) {
            //   console.log(dataShow.data[i]);
            leadInfo = leadInfo + " " + dataShow.data[i].Full_Name + "     " + dataShow.data[i].Email + " \n";
        }
    }

    var HTML = '<pre>' + headers + leadInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})



bot.onText(/\/searchAccounts (.+)/, async(msg, match) => {
    console.log('in searchAccounts  ------------  ');

    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    console.log(chatId);
    console.log(resp);

    var url = 'https://www.zohoapis.com/crm/v2/Accounts/search?criteria=Website:starts_with:' + resp;
    var headers = '<b> Name     Website </b> \n\n';
    var leadInfo = '';
    var result = await getAccessTokenFromDB(msg, url);
    console.log('result obtained from getAccessTokenFromDB is ');
    if (result == null) {
        console.log('inside null man');
        return bot.sendMessage(message.chat.id, 'You need to login. Type /start to begin');
    }
    var dataShow = result.data;

    if (result.status == '204') {
        console.log(' in 204 ');
        leadInfo = 'No matching records found. Pls change your search term and try again';
    } else {
        for (i = 0; i < dataShow.data.length; i++) {
            //   console.log(dataShow.data[i]);
            leadInfo = leadInfo + " " + dataShow.data[i].Account_Name + "     " + dataShow.data[i].Website + " \n";
        }
    }

    var HTML = '<pre>' + headers + leadInfo + '</pre>';
    bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
})


bot.onText(/\/searchDeals (.+)/, (msg, match) => {
    console.log('in searchDeals ------------  ');

    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    console.log(chatId);
    console.log(resp);

    var catalystApp = catalyst.initialize(context_global);
    var zcql = catalystApp.zcql();
    var queryString = 'select *  from storeLoginInfo where telegramUserID=' + chatId;
    console.log(queryString);

    let zcqlPromise = zcql.executeZCQLQuery(queryString);

    zcqlPromise.then(async(queryResult) => {
        console.log(queryResult);
        console.log(queryResult.length);
        if (queryResult.length == 0) {
            bot.sendMessage(message.chat.id, 'You need to login first. Type /start ');
        }
        var axesToken = queryResult[0].storeLoginInfo.accessToken;
        var authToken = "Zoho-oauthtoken " + axesToken;
        console.log('deals *********** AUTHTOKEN ' + authToken);

        let url = 'https://www.zohoapis.com/crm/v2/coql';
        var headers = '<b> Name     Amount </b> \n\n';
        var leadInfo = '';

        try {
            const getLeads = await axios({
                method: 'post',
                url: url,
                headers: {
                    "Authorization": authToken
                },
                data: {
                    'select_query': "select Deal_Name, Amount from Deals where Amount > " + resp
                }
            });
            console.log(getLeads);
            var dataShow = await getLeads.data;

            if (getLeads.status == '204') {
                console.log(' in 204 ');
                leadInfo = 'No matching records found. Pls change your search term and try again';
            } else {
                for (i = 0; i < dataShow.data.length; i++) {
                    leadInfo = leadInfo + " " + dataShow.data[i].Deal_Name + "     " + dataShow.data[i].Amount + " \n";
                }
            }
        } catch (error) {
            console.log('error here *********** ');
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
            leadInfo = 'No matching records found. Pls change your search term and try again';
        }
        var HTML = '<pre>' + headers + leadInfo + '</pre>';
        bot.sendMessage(message.chat.id, HTML, { parse_mode: 'HTML' });
    })
});




// Handle callback 
bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    console.log('in callback query ***********************  ');
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    var telegramUserID = msg.chat.id;

    console.log('Telegram user id to be stored is ::::::::: ' + telegramUserID + '   data ' + data);

    let text;

    if (data === 'login') {
        console.log('about to login');
        text = "Authorize to set up a Zoho CRM access";

        let optionalParams = {
            parse_mode: 'Markdown',
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: 'Grant Access',
                        url: 'https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.coql.READ,ZohoCRM.modules.ALL&client_id=<enterclientid>&response_type=code&access_type=offline&state=' + telegramUserID + '&redirect_uri=<insert ur redirect url>/login'
                    }]
                ]
            })
        };
        bot.sendMessage(msg.chat.id, 'Authorize to set up a Zoho CRM access', optionalParams);
    }
});





bot.on('message', (msg) => {
    bot.sendMessage(msg.from.id, "Hi! Type /help to know how I can be of use");
});


bot.onText(/\/help/, (msg) => {

    bot.sendMessage(msg.from.id, "I am the Zoho CRM Telegram Bot. I understand the following commands - \n" +
        "1. /getLeads  [get all leads in zoho crm] \n" +
        "2. /getDeals  [get all deals] \n" +
        "3. /getContacts [get all contacts] \n" +
        "4. /getAccounts  [get all accounts] \n" +
        "5. /logout  [logout of Zoho CRM ] \n\n " +
        "6. /zohocrmapi  [links to api help docs ] \n\n " +
        " Not just this, I can also help search records with the following commands  :- \n\n" +
        "1-  /searchLeads justin@ramnath.com   [search Leads by email]\n" +
        "2-  /searchAccounts www.zebra.com [search Accounts by website name]\n" +
        "3-  /searchContacts astha@aso.com [search Contacts by email]\n" +
        "4-  /searchDeals 1000  [search Deals greater than Amount you have set (1000 in this case)] \n \n \n " +
        "Type /start to get started");
})


bot.onText(/\/zohocrmapi/, msg => {
    const vgmUrl = 'https://www.zoho.com/crm/developer/docs/api/v2/';

    got(vgmUrl).then(response => {
        const $ = cheerio.load(response.body);
        $('a').filter(isMidi).each((i, link) => {
            const href = link.attribs.href;
            //  var HTML = "<a href=https://www.zoho.com" + href + ">https://www.zoho.com" + href + '</a>';
            var texturl = 'https://www.zoho.com' + href;

            // bot.sendMessage(msg.chat.id, util.format(`<a href="https:${torrent}">${link}</a>`), {
            //     reply_to_message_id: msg.message_id,
            //     parse_mode: 'HTML'
            // });

            //    bot.sendMessage(msg.chat.id, util.format(`<a href="https://www.zoho.com"` + href + ">" + texturl + `</a>`), { parse_mode: 'HTML' });


            bot.sendMessage(msg.chat.id, "<a href='https://www.zoho.com" + href + "'>" + texturl + "</a>", { parse_mode: 'HTML' });

        });

    }).catch(err => {
        console.log(err);
    });
});


const isMidi = (i, link) => {
    // Return false if there is no href attribute.
    if (typeof link.attribs.href === 'undefined') { return false }
    return link.attribs.href.includes('.html');
};





async function getAccessTokenFromDB(message, url) {

    console.log('in getAccessTokenFromDB ' + url);
    var catalystApp = catalyst.initialize(context_global);
    var zcql = catalystApp.zcql();
    var queryString = 'select *  from storeLoginInfo where telegramUserID=' + message.from.id;
    console.log(queryString);
    var refreshToken = '';
    let queryResult = await zcql.executeZCQLQuery(queryString);

    if (queryResult.length == 0) {
        console.log('-----------------USER NOT LOGGED IN -------------------');
        return null
    } else {
        console.log('-----------------USER is LOGGED IN -------------------');
        var axesToken = await queryResult[0].storeLoginInfo.accessToken;
        refreshToken = await queryResult[0].storeLoginInfo.refreshToken;
        var authToken = "Zoho-oauthtoken " + axesToken;
        console.log('*********** AUTHTOKEN ' + authToken);

        try {
            const getInfo = await axios.get(url, {
                headers: { "Authorization": authToken }
            });
            console.log(getInfo.data);
            console.log(getInfo.status);
            console.log(getInfo.statusText);
            return getInfo;

        } catch (e) {
            console.log('eRROR here now ' + e);
            // console.log(e.stack);
            console.log('may be access_token expired ....' + message.chat.id);
            var resultHere = await generateAndStoreAccessToken(message.chat.id, refreshToken, catalystApp);
            console.log('running the api again with new accessToken .... ' + resultHere);

            const getInfo = axios.get(url, {
                headers: { "Authorization": resultHere }
            });
            console.log(getInfo.data);
            return getInfo;

        }
    }
}



async function generateAndStoreAccessToken(telegramid, refreshToken, catalystApp) {
    console.log('in generateAndStoreAccessToken  with the following data ' + telegramid + '  refreshToken   ' + refreshToken);
    var result;
    var url = "https://accounts.zoho.com/oauth/v2/token";
    var bodyFormData = new FormData();
    bodyFormData.append('grant_type', 'refresh_token');
    bodyFormData.append('client_id', '<put ur client id>');
    bodyFormData.append('refresh_token', refreshToken);
    bodyFormData.append('client_secret', '<put ur client secret');

    try {
        const getToken = await axios.post(url, bodyFormData, {
            headers: bodyFormData.getHeaders()
        });
        console.log(getToken.data);
        console.log(getToken.status);
        var accessTokenNow = getToken.data.access_token;
        console.log('REGENERATED ACCESS TOKEN  **********************            ' + accessTokenNow);
        if (accessToken == undefined) {
            console.log('TODO: CHECK why regenerated access token is undefined while the refreshtoken is ' + refreshToken);
            //This will force the user to login again
            return null;
        }
        result = await storeInfoToDB(telegramid, accessTokenNow, refreshToken, catalystApp);
        console.log(result);
    } catch (e) {
        console.log(e);
    }
    console.log('returning  ' + result);
    return result;
}

async function storeInfoToDB(telegramid, accessToken, refreshToken, catalystApp) {
    //get the catalyst handle here and start

    console.log(' in storeInfoToDB with the following data to insert  :');
    try {
        var opResult = false;
        let rowData = {
            telegramUserID: telegramid,
            accessToken: accessToken,
            refreshToken: refreshToken
        };
        console.log(rowData);
        let datastore = catalystApp.datastore();
        let table = datastore.table('storeLoginInfo');

        var queryString = 'select * from storeLoginInfo where telegramUserID=' + telegramid;
        console.log(queryString);
        let zcql = catalystApp.zcql();
        let zcqlPromise = zcql.executeZCQLQuery(queryString);

        zcqlPromise.then(async(queryResult) => {

            console.log('No. of rows in storeLoginInfo table for the telegramuser is ' + queryResult.length);
            if (queryResult.length > 0) {
                let rowPromise = table.deleteRow(queryResult[0].storeLoginInfo.ROWID);
                rowPromise.then((row) => {
                    console.log('---------- DROPPED ROW -------------');
                    console.log(row);
                });

                let insertPromise = await table.insertRow(rowData);
                console.log(insertPromise);
                console.log('---------- inserted row >>>>>>>>>>>');
                opResult = true;
                console.log('return1   ' + accessToken);
                return accessToken;
            } else {
                let insertPromise = await table.insertRow(rowData);
                console.log(insertPromise);
                console.log('---------- ROW INSERTED ------------');
                opResult = true;
                console.log('return2   ' + accessToken);
                return accessToken;

            }
        })

    } catch (err) {
        console.log(err);
        opResult = false;
        return null;
    }

}

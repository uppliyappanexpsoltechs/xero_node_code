import { XeroClient, Contact } from 'xero-node';
import express from 'express'
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
import db from '../utils/config/db.config';
const User = db.user;
var LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage('./scratch');
import jwtDecode from 'jwt-decode';
import fetch from "node-fetch";
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import { createConnection } from 'mysql';
const scopes = "offline_access openid profile email accounting.transactions accounting.transactions.read accounting.reports.read accounting.journals.read accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees payroll.payruns payroll.payslip payroll.timesheets payroll.settings";
const xero = new XeroClient({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUris: [redirectUrl],
    scopes: scopes.split(" "),
    state: "imaParam=look-at-me-go",
    httpTimeout: 2000
});
let pool = createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    port: 3306
});
exports.baseUrl = async function (req, res) {
    let constenturl = await xero.buildConsentUrl();
    try {
        let response = {
            status: "suceess",
            data: constenturl
        }
        res.send(response)
    } catch (e) {
        let response = {
            status: "failure",
            data: constenturl
        }
        res.send(response)
    }
}
exports.callbackurl = async function (req, res) {
    try {
        const tokenSet = await xero.apiCallback(req.url);
        await xero.updateTenants(false);
        xero.setTokenSet(tokenSet);
        let payload = { tokens: JSON.stringify(tokenSet), tenant: JSON.stringify(xero.tenants[0]) };
        let secret = 'xxx';
        let token = jwt.encode(payload, process.env.SECRECT_KEY);
        // res.redirect('http://localhost:8080/navbar?params=' + token)
        // res.redirect('http://localhost:8080/sidemenu?params=' + token)
        res.redirect('http://localhost:8080/bisidebar?params=' + token)
    } catch (e) {
        console.log(e)
        res.send(e);
    }
};
exports.userCredentialUpdate = function (req, res) {
    try {
        let decoded = jwt.decode(req.body.params, process.env.SECRECT_KEY);
        let user_id = jwt.decode(req.body.userId, process.env.SECRECT_KEY);
        // console.log('decoded',decoded);
        let token = JSON.parse(decoded.tokens)
        let tenent = JSON.parse(decoded.tenant)
        // console.log(token)
        User.update(
            {
                id_token: token.id_token,
                access_token: token.access_token,
                token_type: token.token_type,
                refresh_token: token.refresh_token,
                scope: token.scope,
                expires_at: token.expires_at,
                session_state: token.session_state,
                activeTenant: JSON.stringify(tenent)
            },
            {
                where: { id: user_id },
            }).then(function (record) {
                let response = {
                    status: "success",
                    data: "User updated successfully!"
                }
                // res.redirect('http://localhost:8080/contact')
                res.send(response);
            }).catch(err => {
                let response = {
                    status: "error",
                    data: err
                }
                res.status(500).send(response);
            })
    } catch (error) {
        console.log(JSON.stringify(error));
    }
};
exports.getUser = async function (req, res) {
    try {
        console.log(req.body.userId)
        let tenentId = await global(req.body.userId);
        console.log('json===>\n\n', tenentId)
        await xero.updateTenants(false);
        const getusersResponse = await xero.accountingApi.getUsers(tenentId);
        res.send(getusersResponse)
    } catch (error) {
        console.log(JSON.stringify(error));
    }
};
exports.getValue = function (req, res) {
    req.session.isAuth = true;
    console.log(req.session.name1);
    console.log(req.session.name);
    // const token = xero.readTokenSet()
    // console.log(token)
}
exports.createConatct = async function (req, res) {
    try {
        // req.session.isAuth = true;
        let paylaod = req.body;
        // const Localstorage = JSON.parse(localStorage.getItem('key'))
        // xero.setTokenSet(req.session.Tokenset)
        let tenentId = await global(req.body.userId);
        const contact = new Contact();
        const data1 = { name: paylaod.name, firstName: paylaod.firstName, lastName: paylaod.lastName, emailAddress: paylaod.emailAddress, phones: [{ phoneType: "MOBILE", phoneNumber: paylaod.mobile }] }
        contact.contacts = [data1];
        const contactCreateResponse = await xero.accountingApi.createContacts(tenentId, contact);
        res.send(contactCreateResponse);
    } catch (error) {
        console.log(JSON.stringify(error));
    }
};
exports.updateConatct = async function (req, res) {
    try {
        // req.session.isAuth = true;
        let paylaod = req.body;
        let tenentId = await global(req.body.userId);
        // const Localstorage = JSON.parse(localStorage.getItem('key'))
        // xero.setTokenSet(req.session.Tokenset)
        // let json = JSON.parse(localStorage.getItem('tenent'));
        const contact = new Contact();
        const data1 = { name: paylaod.name, firstName: paylaod.firstName, lastName: paylaod.lastName, emailAddress: paylaod.emailAddress, phones: [{ phoneType: "MOBILE", phoneNumber: paylaod.mobile }] }
        // console.log("\ndata===>>>>",paylaod.contactId)
        contact.contacts = [data1];
        const contactUpdateResponse = await xero.accountingApi.updateContact(tenentId, paylaod.contactId, contact);
        res.send(contactUpdateResponse);
    } catch (error) {
        console.log(JSON.stringify(error));
    }
};
exports.getConatcts = async function (req, res) {
    try {
        let tenentId = await global(req.body.userId);
        const contactsGetResponse = await xero.accountingApi.getContacts(tenentId);
        return res.send(contactsGetResponse);
    } catch (error) {
        res.send(error.response.statusCode)
        if(error.response.statusCode==401){
            // console.log('yes')
            // res.redirect('http://localhost:8080/login')
        }
        // console.log(JSON.stringify(error));
    }
};
exports.deleteConatct = async function (req, res) {
    try {
        // req.session.isAuth = true;
        let paylaod = req.body;
        let tenentId = await global(req.body.userId);
        // const Localstorage = JSON.parse(localStorage.getItem('key'))
        // xero.setTokenSet(req.session.Tokenset)
        // let json = JSON.parse(localStorage.getItem('tenent'));
        const contact = new Contact();
        const data1 = { contactStatus: "ARCHIVED", name: paylaod.name }
        contact.contacts = [data1];
        const contactUpdateResponse = await xero.accountingApi.updateContact(tenentId, paylaod.contactId, contact);
        res.send(contactUpdateResponse);
    } catch (error) {
        console.log(JSON.stringify(error));
    }
};
exports.signUp = function (req, res) {
    let paylaod = req.body;
    User.create({
        username: paylaod.username,
        password: bcrypt.hashSync(paylaod.password, 8),
    }).then(roles => {
        let response = {
            status: "success",
            data: "User registered successfully!"
        }
        res.send(response);
    }).catch(err => {
        let response = {
            status: "error",
            data: err
        }
        res.status(500).send(response);
    })
};
exports.signin = (req, res) => {
    console.log('valid')
    // res.send('response')
    User.findOne({
        where: {
            username: req.body.username
        }
    }).then(user => {
        if (!user) {
            let response = {
                status: "error",
                data: "User Not Found."
            }
            return res.send(response);
        }
        var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) {
            let response = {
                status: "error",
                data: "Invalid Password!"
            }
            return res.send(response);
        } else {
            // res.cookie('cookie_name' , 'cookie_value', {expire : 24 * 60 * 60 * 1000 });
            // req.session.userid=user.dataValues.id;
            let user_id = jwt.encode(user.dataValues.id, process.env.SECRECT_KEY);
            let response = {
                status: "success",
                data: user_id
            }
            // res.redirect('http://localhost:8080/home')
            res.send(response)
        }
    }).catch(err => {
        let response = {
            status: "error",
            data: err
        }
        res.status(500).send(response);
    });
}
const global = async function (userID) {
    const returnjson = await User.findOne({
        where: {
            id: jwt.decode(userID, process.env.SECRECT_KEY)
        }
    }).then(async function (user) {
        let params = JSON.parse(JSON.stringify(user))
        let tokenset = {
            id_token: params.id_token,
            access_token: params.access_token,
            token_type: params.token_type,
            refresh_token: params.refresh_token,
            scope: params.scope,
            activeTenant: JSON.parse(params.activeTenant),
            session_state: params.session_state,
            expires_at: params.expires_at
        }
        let json = await JSON.parse(params.activeTenant);
        xero.setTokenSet(tokenset);
        return json.tenantId
    }).catch(err => {
        let response = {
            status: "error",
            data: err
        }
        return response
    });
    return returnjson
}

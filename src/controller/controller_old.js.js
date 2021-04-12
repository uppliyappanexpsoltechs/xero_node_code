import { XeroClient, Contact } from 'xero-node';
import express from 'express'
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
import db from '../utils/config/db.config';
const User = db.user;
import jwtDecode from 'jwt-decode';
import fetch from "node-fetch";
import bcrypt from 'bcrypt';
import { createConnection } from 'mysql';
const session = require("express-session");
var FileStore = require('session-file-store')(session);
const scopes = "offline_access openid profile email accounting.transactions accounting.transactions.read accounting.reports.read accounting.journals.read accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees payroll.payruns payroll.payslip payroll.timesheets payroll.settings";
// const express = require('express');
const app = express();
const fileStoreOptions = {}
// app.use(session({ resave: true, secret: process.env.SECRET, saveUninitialized: true,cookie: { secure: !true } }));
// app.use('/',function(req,res){
//     req.session.firstname='uppli';
//     console.log('req.session.firstname==>',req.session.firstname)
// })
// app.use(session({
//     secret: "something crazy",
//     store: new FileStore(fileStoreOptions),
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false },
// }));
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
        let tenent = JSON.stringify(xero.tenants[0]);
        let createquery = "INSERT INTO `users`(`id_token`, `access_token`, `token_type`, `refresh_token`, `scope`, `activeTenant`,`expires_at`,`session_state`) VALUES ('" + tokenSet.id_token + "','" + tokenSet.access_token + "','" + tokenSet.token_type + "','" + tokenSet.refresh_token + "','" + tokenSet.scope + "','" + tenent + "','" + tokenSet.expires_at + "','" + tokenSet.session_state + "');";
        let selectquery = "SELECT * FROM `users` WHERE id=1";
        let updatequery = "UPDATE `users` SET `id_token`='" + tokenSet.id_token + "',`access_token`='" + tokenSet.access_token + "',`token_type`='" + tokenSet.token_type + "',`refresh_token`='" + tokenSet.refresh_token + "',`scope`='" + tokenSet.scope + "',`activeTenant`='" + tenent + "',`expires_at`='" + tokenSet.expires_at + "',`session_state`='" + tokenSet.session_state + "' WHERE id=1";
        pool.query(selectquery, function (error, results, fields) {
            if (error) {
                pool.destroy();
                console.log("error", error.code);
            } else {
                if (results.length == 0) {
                    pool.query(createquery)
                } else {
                    pool.query(updatequery);
                }
            }
        });
        res.redirect('http://localhost:8080/navbar')
    } catch (e) {
        console.log(e)
        res.send(e);
    }
};
exports.getUser = async function (req, res) {
    pool.query("select * from users where id=1", async function (error, results, fields) {
        try {
            let json = await globaldata(results[0])
            await xero.updateTenants(false);
            const getusersResponse = await xero.accountingApi.getUsers(json.tenantId);
            res.send(getusersResponse)
        } catch (error) {
            console.log(error);
        }
    });
};
exports.createConatct = function (req, res) {
    pool.query("select * from users where id=1", async function (error, results, fields) {
        try {
            let paylaod = req.body;
            let json = await globaldata(results[0])
            const contact = new Contact();
            const data1 = { name: paylaod.name, firstName: paylaod.firstName, lastName: paylaod.lastName, emailAddress: paylaod.emailAddress, phones: [{ phoneType: "MOBILE", phoneNumber: paylaod.mobile }] }
            contact.contacts = [data1];
            const contactCreateResponse = await xero.accountingApi.createContacts(json.tenantId, contact);
            res.send(contactCreateResponse);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
    });
};
exports.updateConatct = function (req, res) {
    pool.query("select * from users where id=1", async function (error, results, fields) {
        try {
            let paylaod = req.body;
            let json = await globaldata(results[0])
            const contact = new Contact();
            const data1 = { name: paylaod.name, firstName: paylaod.firstName, lastName: paylaod.lastName, emailAddress: paylaod.emailAddress, phones: [{ phoneType: "MOBILE", phoneNumber: paylaod.mobile }] }
            // console.log("\ndata===>>>>",paylaod.contactId)
            contact.contacts = [data1];
            const contactUpdateResponse = await xero.accountingApi.updateContact(json.tenantId, paylaod.contactId, contact);
            res.send(contactUpdateResponse);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
    });
};
exports.getConatcts = async function (req, res) {
    try {
        User.findOne({
            where: {
                id: 1
            }
        }).then(user => {
            get(user);
            async function get(e) {
                let json = await globaldata(user.dataValues);
                console.log('req.session.firstname==>',req.session.firstname)
                const contactsGetResponse = await xero.accountingApi.getContacts(json.activeTenant.tenantId);
                // console.log('user.dataValues', contactsGetResponse);
                res.send(contactsGetResponse);
            }

        }).catch(err => {
            let response = {
                status: "error",
                data: err
            }
            return err
        });
        // get_token=await getdata(1);
        // console.log(get_token)
        // let json = await globaldata(get_token);
        // const contactsGetResponse = await xero.accountingApi.getContacts(json.tenantId);
        // res.send(contactsGetResponse);
    } catch (error) {
        console.log(JSON.stringify(error));
    }
    // pool.query("select * from users where id=1", async function (error, results, fields) {
    //     try {
    //         let json = await globaldata(results[0])
    //         const contactsGetResponse = await xero.accountingApi.getContacts(json.tenantId);
    //         res.send(contactsGetResponse);
    //     } catch (error) {
    //         console.log(JSON.stringify(error));
    //     }
    // });
};
exports.deleteConatct = function (req, res) {
    pool.query("select * from users where id=1", async function (error, results, fields) {
        try {
            let paylaod = req.body;
            let json = await globaldata(results[0])
            const contact = new Contact();
            const data1 = { contactStatus: "ARCHIVED", name: paylaod.name }
            contact.contacts = [data1];
            const contactUpdateResponse = await xero.accountingApi.updateContact(json.tenantId, paylaod.contactId, contact);
            res.send(contactUpdateResponse);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
    });
};
exports.signUp = function (req, res) {
    // Save User to Database
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
            new Promise(function (resolve, reject) {
                console.log('1.1')
                req.session.firstname=user.dataValues.id_token
                const gettoken = globaldata(user.dataValues)
                resolve(gettoken)
            }).then(function (result) {
                return new Promise((resolve) => { // (*)
                    // console.log("req.session.activeTenant",req.session.activeTenant)
                    const newXeroClient = new XeroClient()
                    const newTokenSet = newXeroClient.
                    refreshWithRefreshToken(client_id, client_secret, result.refresh_token);
                    //  console.log(newTokenSet)
                    resolve(newTokenSet)
                    
                });
            }).then(function(newtoken) { 
                res.header("Access-Control-Allow-Headers","*");
                res.header('Access-Control-Allow-Credentials', true);
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.send(newtoken)
            });
        }
    }).catch(err => {
        let response = {
            status: "error",
            data: err
        }
        res.status(500).send(response);
    });
}
const getdata = function (param) {
    User.findOne({
        where: {
            id: param
        }
    }).then(user => {
        return user.dataValues
    }).catch(err => {
        let response = {
            status: "error",
            data: err
        }
        return err
    });
}
const refresh_token = async function (params) {
    await globaldata(params);

    // console.log('tokenSet.expires_in: ', tokenSet.expires_in, ' seconds')
    // console.log('tokenSet.expires_at: ', tokenSet.expires_at, ' milliseconds')
    // console.log('Readable expiration: ', new Date(tokenSet.expires_at * 1000).toLocaleString())
    // console.log('tokenSet.expired(): ', tokenSet.expired());
    // console.log('Tokenset',tokenSet)

    // if (tokenSet.expired()) {
    //   console.log('tokenSet is currently expired: ', tokenSet)
    // } else {
    //   console.log('tokenSet is not expired: ', tokenSet)
    // }

    //  await xero.refreshToken()

    // or if you already generated a tokenSet and have a valid (< 60 days refresh token),
    // you can initialize an empty client and refresh by passing the client, secret, and refresh_token

}
const globaldata = async function (params) {
    try {
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
        let json = JSON.parse(params.activeTenant);
        xero.setTokenSet(tokenset);
        // const token = xero.readTokenSet()
        // if (token.expired()) {
        //     const newXeroClient = new XeroClient()
        //     const newTokenSet = await newXeroClient.refreshWithRefreshToken(client_id, client_secret, tokenset.refresh_token);
        //     console.log(newTokenSet)
        // }
        return tokenset
    } catch (error) {
        console.log(error)
    }
    // return tokenset;
}

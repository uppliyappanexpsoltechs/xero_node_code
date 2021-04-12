require("dotenv").config();
import Sequelize from 'sequelize';
import usermodel from '../model/user.model';
const db = {};
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    operatorsAliases: 1,
    dialect:'mysql', //process.env.DIALECT,
    pool: {
        max: process.env.MAX,
        min: process.env.MIN,
        acquire: process.env.ACQUIRE,
        idle: process.env.IDLE
    }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = usermodel(sequelize, Sequelize);
sequelize.authenticate()
    .then(()=>{
        // console.log('connection right');
    })
    .catch(()=>{
        console.log('wrong conection');
    });

export default db;
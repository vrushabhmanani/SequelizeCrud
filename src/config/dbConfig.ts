import { Sequelize } from "sequelize";
import path from "path";

let pg: any = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: "postgres",
    logging: console.log,
    timezone: "+00:00"
}

let dbWriter: any = {
    sequelize: new Sequelize(pg.database, pg.username, pg.password, pg)
};

let DBInstance = [{
    "name": dbWriter
}];

DBInstance.forEach(ele => {
    ele.name['users'] = require(path.join(__dirname, "../model/usersModel"))(ele.name['sequelize'], Sequelize);
    ele.name['event'] = require(path.join(__dirname, "../model/eventModel"))(ele.name['sequelize'], Sequelize);

    Object.keys(ele.name).forEach(function (modelName) {
        if ('associate' in ele.name[modelName]) {
            ele.name[modelName].associate(ele.name);
        }
    });
})

dbWriter.Sequelize = Sequelize;

module.exports = dbWriter;
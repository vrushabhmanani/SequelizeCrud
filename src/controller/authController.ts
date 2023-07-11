import jwt from "jsonwebtoken";
const dbWriter = require("../config/dbConfig");

const jwtAuthnication = (req: any, res: any, next: any) => {
    const token = (req.headers.authorization) ? req.headers.authorization.split(' ') : [];
    if (token.length == 0 || token[0] != "Bearer" || token[1] == "") {
        res.json({ "res": "0", "msg": "please provide vaild accaess token." });
    } else {
        jwt.verify(token[1], process.env.JWTSCRECT as string, async (err: any, data: any) => {
            if (err) {
                res.json({ "res": '0', "msg": err.message });
            } else {
                const userTokenISActive = await dbWriter.users.findOne({
                    where: { user_id: data.user_id, token: token[1] }
                });
                if (userTokenISActive) {
                    req.body.login_user_id = data.user_id;
                    req.body.login_user_email = data.email;
                    next();
                } else {
                    res.json({ "res": '0', "msg": "Please provide vaild token." });
                }
            }
        })
    }
}

module.exports = jwtAuthnication;
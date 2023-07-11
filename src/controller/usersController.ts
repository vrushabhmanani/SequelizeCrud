import e, { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import moment from "moment";
const dbWriter = require("../config/dbConfig");
const router = Router();
const jwtAuthnication = require("../controller/authController");

router.post("/registor", async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email) {
            throw new Error("Please enter email address.");
        } else if (!password) {
            throw new Error("Please enter password.");
        } else {
            const userEmail = await dbWriter.users.findOne({
                where: { email: email },
                attributes: ['email']
            });
            if (userEmail) {
                res.json({ "res": '0', "msg": "Email address all ready extis in our system." });
            } else {
                password = await bcrypt.hash(password, 16);
                const addNewUser = await dbWriter.users.create({
                    email: email,
                    password: password
                });
                if (addNewUser) {
                    res.json({ "res": "1", "msg": "User added sucessfully.", "data": addNewUser })
                } else {
                    res.json({ "res": "0", "msg": "Something went to wrong." });
                }
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }

});

router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email) {
            throw new Error("Please enter email address.");
        } else if (!password) {
            throw new Error("Please enter password.");
        } else {
            const userEmail = await dbWriter.users.findOne({
                where: { email: email },
                attributes: ['user_id', 'email', 'password']
            });
            if (!userEmail) {
                res.json({ "res": '0', "msg": "Your email address is not registor in our system." });
            } else {
                password = await bcrypt.compare(password, userEmail.password);
                if (password) {
                    const token = jwt.sign({ user_id: userEmail.user_id, email: userEmail.email }, process.env.JWTSCRECT as string);
                    await dbWriter.users.update({
                        token: token,
                        last_update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                    }, { where: { user_id: userEmail.user_id } });
                    const userData = await dbWriter.users.findOne({
                        where: { user_id: userEmail.user_id },
                        attributes: ['user_id', 'email', 'token']
                    });
                    res.json({ "res": "1", "msg": "User login sucessfully.", "data": userData })
                } else {
                    res.json({ "res": "0", "msg": "Please provide vaild password." });
                }
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }

});

router.put("/logout", jwtAuthnication, async (req, res) => {
    try {
        let { login_user_id } = req.body;
        await dbWriter.users.update({
            token: "",
            last_update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, { where: { user_id: login_user_id } });
        res.json({ "res": "1", "msg": "Logout successful." });
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }
});

router.put("/changePassword", jwtAuthnication, async (req, res) => {
    try {
        let { old_password, password, login_user_id } = req.body;
        if (!password) {
            throw new Error("Please enter new password.");
        } else if (!old_password) {
            throw new Error("Please enter old password.");
        } else {
            const userData = await dbWriter.users.findOne({
                where: { user_id: login_user_id },
                attributes: ['user_id', 'password']
            });
            if (!userData) {
                res.json({ "res": '0', "msg": "User is not active." });
            } else {
                const vaildPassword = await bcrypt.compare(old_password, userData.password);
                if (vaildPassword) {
                    password = await bcrypt.hash(password, 16);
                    await dbWriter.users.update({
                        password: password,
                        last_update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                    }, { where: { user_id: login_user_id } });
                    res.json({ "res": "1", "msg": "Pasword has been updated successful." })
                } else {
                    res.json({ "res": "0", "msg": "Please provide vaild old password." });
                }
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }
});

router.put("/passwordReset", async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) {
            throw new Error("Please enter email address.");
        } else {
            const userIsExistance = await dbWriter.users.findOne({
                where: { email: email },
                attributes: ['user_id', 'email']
            });
            if (!userIsExistance) {
                res.json({ "res": '0', "msg": "Your email address is not registor in our system." });
            } else {
                const resetPassToken = jwt.sign({ email: userIsExistance.email, user_id: userIsExistance.user_id }, process.env.JWTSCRECT as string, { expiresIn: process.env.RESET_PASSWORD_EXPIRY_TIME as string });
                res.json({ "res": '1', "msg": "Here is rest password link.", "data": `${process.env.APP_URL}/updatePassword?resetToken=${resetPassToken}` });
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }

});

router.put("/updatePassword", async (req, res) => {
    try {
        let { new_password } = req.body;
        if (!req.query.resetToken) {
            throw new Error("Invalid reset password link.");
        } else if (!new_password) {
            throw new Error("Please provide new password.");
        } else {
            jwt.verify(req.query.resetToken as string, process.env.JWTSCRECT as string, async (err: any, data: any) => {
                if (err) {
                    res.json({ "res": '0', "msg": err.message });
                } else {
                    const userIsExistance = await dbWriter.users.findOne({
                        where: { user_id: data.user_id, email: data.email },
                        attributes: ['user_id', 'email']
                    });
                    if (!userIsExistance) {
                        res.json({ "res": '0', "msg": "User does not exist." });
                    } else {
                        const encryptPass = await bcrypt.hash(new_password, process.env.SALT as string);
                        await dbWriter.users.update({
                            password: encryptPass,
                            last_updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        },
                            { where: { user_id: userIsExistance.user_id } }
                        );
                        res.json({ "res": '1', "msg": "Password has been reset successfully." });
                    }
                }
            });
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }

});

module.exports = router;
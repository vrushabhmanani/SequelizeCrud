import { Router } from "express";
import moment from "moment";
const dbWriter = require("../config/dbConfig");
const router = Router();
const jwtAuthnication = require("../controller/authController");
import { Sequelize, Op } from "sequelize";

router.post("/addEvent", jwtAuthnication, async (req, res) => {
    try {
        let { event_name, event_details, invited, login_user_id } = req.body;
        if (!event_name) {
            throw new Error("Please provide event name.");
        } else if (!event_details) {
            throw new Error("Please provide event details.");
        } else {
            const eventIsExist = await dbWriter.event.findOne({
                where: { event_name: event_name },
                attributes: ['event_id', 'event_name']
            });
            if (eventIsExist) {
                res.json({ "res": '0', "msg": "Event is alredy exits." });
            } else {
                const addEvent = await dbWriter.event.create({
                    event_name: event_name,
                    event_details: event_details,
                    created_by: login_user_id,
                    invited: invited
                });
                if (addEvent) {
                    res.json({ "res": '1', "msg": "Event has been added sucessfully.", "data": addEvent });
                } else {
                    res.json({ "res": '0', "msg": "Something went wrong." });
                }
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }
});

router.put("/:eventId/updateEvent", jwtAuthnication, async (req, res) => {
    try {
        let { event_name, event_details, invite_email, login_user_id } = req.body;
        if (!req.params.eventId) {
            throw new Error("Please provide vaild event details.");
        } else {
            const eventIsExist = await dbWriter.event.findOne({
                where: { event_id: req.params.eventId },
                attributes: ['event_id', 'created_by', 'invited']
            });
            if (!eventIsExist) {
                res.json({ "res": '0', "msg": "No such event found." });
            } else {
                let setUpdate: any = {};
                if (event_name) {
                    setUpdate.event_name = event_name;
                }
                if (event_details) {
                    setUpdate.event_details = event_details;
                }
                if (invite_email) {
                    if (eventIsExist.invited.length > 0) {
                        if (eventIsExist.invited.includes(invite_email)) {
                            throw new Error("Already invited.");
                        } else {
                            setUpdate.invited = Sequelize.fn("array_append", Sequelize.col("invited"), invite_email)
                        }
                    } else {
                        setUpdate.invited = invite_email;
                    }
                }
                if (Object.keys(setUpdate).length > 0) {
                    setUpdate.last_updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    await dbWriter.event.update(setUpdate, {
                        where: { event_id: req.params.eventId }
                    });
                    res.json({ "res": "1", "msg": "Event is updated successfully." });
                } else {
                    res.json({ "res": "0", "msg": "Please provide update event filed." });
                }
            }
        }
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }
});

router.post("/getAllEvents", jwtAuthnication, async (req, res) => {
    try {
        let { login_user_id, login_user_email, start_date, end_date, search, pageNo, pageRecords } = req.body;

        let offset = 0, limit = 10;
        limit = (pageRecords) ? pageRecords : 10;
        offset = (pageNo) ? ((pageNo - 1) * limit) : 0;

        let dateCondidtion = Op.lte, dateValue: any = moment(new Date()).format('YYYY-MM-DD') + ' ' + '23:59:59';
        if (start_date != "" || end_date != "") {
            dateCondidtion = Op.between;
            dateValue = [`${start_date} 00:00:01`, `${end_date} 23:59:59`];
        }

        let searchCondidtion = Op.ne, searchValue = null;
        if (search == "") {
            searchCondidtion = Op.like;
            searchValue = `%${search}%`;
        }

        const eventList = await dbWriter.event.findAndCountAll({
            where: {
                created_date: {
                    [dateCondidtion]: dateValue
                },
                event_name: {
                    [searchCondidtion]: searchValue
                },
                [Op.or]: [{
                    invited: {
                        [Op.contains]: [login_user_email]
                    }
                },{
                    created_by: login_user_id 
                }]
            },
            include: [{
                model: dbWriter.users,
                attributes: ['user_id', 'email']
            }],
            order: [['created_date', 'DESC']],
            offset: offset,
            limit: limit
        });
        res.json({ "res": "0", "msg": "Success.", "data": eventList })
    } catch (error: any) {
        res.json({ "res": "0", "msg": error.message })
    }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const config = require("../config/config.json")
const getUrlPrefix = config.app.prefix;

const getAllDrNameController = require("../controller/doctor_details");
const getDoctorAvailableTimeSlot = require("../controller/getDrAvailableTime");
const bookDoctorAppointmentSlot = require("../controller/bookAppointment");

router.get(getUrlPrefix + "/ping", (req, res) => {
    res.status(200).send("pong");
});

router.get(getUrlPrefix + "/doctorlist", (req, res) => {
    getAllDrNameController.getAllDoctorList(req, res);
});

router.post(getUrlPrefix + "/getDrAvailableTime", (req, res) => {
    getDoctorAvailableTimeSlot.generateAvailableTimeSlot(req, res);
});

router.post(getUrlPrefix + "/bookAppointment", (req, res) => {
    bookDoctorAppointmentSlot.bookAppintmentSlot(req, res);
});

module.exports = router;

const { getData } = require("../services/getData");
const config = require("../config/config.json");

async function generateAvailableTimeSlot(req, res) {
    const doctor_id = req.body.dr_id;
    const date = req.body.appointment_date;
    console.log("doctor's id is", doctor_id, " and Appointment Date is", date);

    if (!(doctor_id && date)) {
        return res.status(400).send({ Status: "400", Message: "Doctor's Id and Appointment Date is Mandatory in Req Body" });
    }

    if (!isValidDateFormat(date)) {
        return res.status(400).send({ Status: "400", Message: "Invalid Date or Past Date. Date must be in YYYY-MM-DD format and a valid calender date" });
    }

    try {
        const uniqId = new Date().valueOf();
        let uniqNumber = config.moduleCode + uniqId;

        let getDoctorAppointmentPayload = {
            tableWithJoin: `doctor_data_models d LEFT JOIN doctor_appointment_data a ON d.id = a.doctor_id AND DATE(a.appointment_start_time) = "${date}"`,
            colName: [
                "d.opd_open_time",
                "d.opd_close_time",
                "a.appointment_start_time",
                "a.appointment_end_time"
            ],
            where: `d.id="${doctor_id}"`,
            uniqueNo: uniqNumber,
        };

        const doctorName = await getData(getDoctorAppointmentPayload);

        if (doctorName.body.result.length <= 0) {
            return res.status(400).send({ Status: "400", Message: "Requested Id Not Assigned To Any Doctor" });
        }
        const opd_open_time = doctorName.body.result[0].opd_open_time;
        const opd_close_time = doctorName.body.result[0].opd_close_time;

        const alreadyBookedAppointment = doctorName.body.result;
        const bookedAppointments = alreadyBookedAppointment.filter(booked => booked.appointment_start_time).map(booked => {
            const appointment_start = booked.appointment_start_time.slice(11, 19);
            const appointment_end = booked.appointment_end_time.slice(11, 19);
            return {
                start: new Date(`1970-01-01T${appointment_start}`),
                end: new Date(`1970-01-01T${appointment_end}`),
            }
        });
        const availableSlots = generateSlots(opd_open_time, opd_close_time, bookedAppointments)

        if (doctorName.body.message === "Success" && doctorName.statusCode === 200 && doctorName.result.length > 0) {
            return res.status(200).send({ Status: "200", Message: "Data Fetched Successfully", OPD_Open_Time: opd_open_time, OPD_Close_Time: opd_close_time, Slots: availableSlots });
        } else if (doctorName.body.message === "Success" && doctorName.body.statusCode === 200) {
            return res.status(200).send({ Status: "200", Message: "No data found" });
        } else {
            return res.status(400).send({ Status: "400", message: "Invalid Data" });
        }

    } catch (error) {
        console.log("Catch Block Error", error)
        return res.status(500).send({ status: "Failed", message: "Internal Server Error" });
    }
}
function generateSlots(opd_open_time, opd_close_time, bookedAppointments) {
    const slots = [];
    let startTime = new Date(`1970-01-01T${opd_open_time}`);
    let endTime = new Date(`1970-01-01T${opd_close_time}`);

    function formatTime(dateObj) {
        return dateObj.toTimeString().slice(0, 5);
    }

    while (startTime.getTime() + 60 * 60 * 1000 <= endTime.getTime()) {
        const slotStart = new Date(startTime);
        const slotEnd = new Date(startTime.getTime() + 60 * 60 * 1000);

        const isOverLapping = bookedAppointments.some(booking =>
            (slotStart < booking.end) && (booking.start < slotEnd)
        );

        if (!isOverLapping) {
            slots.push({
                opd_open_time: formatTime(slotStart),
                opd_close_time: formatTime(slotEnd)
            })
        }
        startTime = slotEnd;
    }
    console.log("Availble Slots Are ", slots);
    return slots;
}

function isValidDateFormat(dateStr) {
    // Check format: YYYY-MM-DD
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split("-").map(Number);

    const inputDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
        inputDate.getFullYear() !== year ||
        inputDate.getMonth() + 1 !== month ||
        inputDate.getDate() !== day
    ) {
        return false;
    }
    return inputDate >= today;
}

module.exports.generateAvailableTimeSlot = generateAvailableTimeSlot;
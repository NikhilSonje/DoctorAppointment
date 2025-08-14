const { getData } = require("../services/getData");
const saveData = require("../services/getData").saveData;
const config = require("../config/config.json");

async function bookAppintmentSlot(req, res) {
    const doctor_id = req.body.dr_id;
    const patient_name = req.body.patient_name;
    const appointment_book_date = req.body.appointment_date;
    const appointment_book_time = normalizeTime(req.body.appointment_time);

    if (!(doctor_id && patient_name && appointment_book_date && appointment_book_time)) {
        return res.status(400).send({ status: "400", Message: "dr_id, patient_name, appointment_date, appointment_time is Mandatory in Req Body" })
    }

    if (!isValidDateFormat(appointment_book_date)) {
        return res.status(400).send({ Status: "400", Message: "Invalid Date or Past Date. Date must be in YYYY-MM-DD format and a valid calender date" });
    }

    const appointment_book_start_time = `${appointment_book_date} ${appointment_book_time}`;
    const appointment_end_time = new Date(`1971-01-01T${appointment_book_time}`);
    appointment_end_time.setHours(appointment_end_time.getHours() + 1);
    const appointment_book_end_time = appointment_end_time.toTimeString().slice(0, 8);
    const newAppointmentTime = `${appointment_book_date} ${appointment_book_end_time}`;
    console.log("doctor's id is", doctor_id, " with patient name", patient_name, "Appointment date is", appointment_book_date, "Appointment Time is", appointment_book_time);

    try {
        const uniqId = new Date().valueOf();
        let uniqNumber = config.moduleCode + uniqId;

        let getDoctorAppointmentPayload = {
            tableWithJoin: `doctor_data_models d LEFT JOIN doctor_appointment_data a ON d.id = a.doctor_id AND DATE(a.appointment_start_time) = "${appointment_book_date}"`,
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
        console.log("Doctor Detail's are Follow:", doctorName);
        if (doctorName.body.result.length <= 0) {
            return res.status(400).send({ Status: "400", Message: "This Id Is Not Assigned To Any Doctor" });
        }

        const opd_open_time = doctorName.body.result[0].opd_open_time;
        const opd_close_time = doctorName.body.result[0].opd_close_time;

        const alreadyBookedAppointment = doctorName.body.result;
        const bookedAppointments = alreadyBookedAppointment.filter(booked => booked.appointment_start_time).map(booked => {
            const appointment_start = booked.appointment_start_time.slice(11, 19);
            const appointment_end = booked.appointment_end_time.slice(11, 19);
            return {
                start: new Date(`1971-01-01T${appointment_start}`),
                end: new Date(`1971-01-01T${appointment_end}`),
            }
        });
        const availableSlots = generateSlots(opd_open_time, opd_close_time, bookedAppointments)

        if (doctorName.body.message === "Success" && doctorName.statusCode === 200 && doctorName.result.length > 0) {
            const isSlotAvailable = availableSlots.some(slot =>
                slot.start === appointment_book_time && slot.end === appointment_book_end_time
            );

            console.log("Available Slots are", isSlotAvailable);
            if (!isSlotAvailable) {
                return res.status(400).send({ Status: "400", Message: "Requested Slot Is Already Booked" });
            }

            let dataa = {
                doctor_id: `${doctor_id}`,
                patient_name: `${patient_name}`,
                appointment_start_time: `${appointment_book_start_time}`,
                appointment_end_time: `${newAppointmentTime}`,
            }
            let appointmentBookPayload = {
                data: [dataa],
                dbName: "jct_dev",
                tableName: "doctor_appointment_data",
                uniqueNo: uniqNumber,
            };

            let bookData = await saveData(appointmentBookPayload);
            console.log("Appointment Details are Follow:", bookData);
            if (bookData.statusCode === 200 && bookData.message === "Data Inserted Successfully") {
                return res.status(200).send({ Status: "200", Message: "Appointment Booked Succesfully" });
            }
            else {
                console.log("Error While Booking Appointment");
            }
        } else if (doctorName.body.message === "Success" && doctorName.body.statusCode === 200) {
            return res.status(200).send({ Status: "200", Message: "No data found" });
        } else {
            return res.status(400).send({ Status: "400", message: "Invalid Data" });
        }

    } catch (error) {
        console.log("Catch block error", error)
        return res.status(500).send({ status: "Failed", message: "Internal Server Error" });
    }
}
function generateSlots(opd_open_time, opd_close_time, bookedAppointments) {
    const slots = [];
    let startTime = new Date(`1971-01-01T${opd_open_time}`);
    let endTime = new Date(`1971-01-01T${opd_close_time}`);

    function formatTime(dateObj) {
        return dateObj.toTimeString().slice(0, 8);
    }

    while (startTime.getTime() + 60 * 60 * 1000 <= endTime.getTime()) {
        const slotStart = new Date(startTime);
        const slotEnd = new Date(startTime.getTime() + 60 * 60 * 1000);

        const isOverLapping = bookedAppointments.some(booking =>
            (slotStart < booking.end) && (booking.start < slotEnd)
        );

        if (!isOverLapping) {
            slots.push({
                start: formatTime(slotStart),
                end: formatTime(slotEnd)
            })
        }
        startTime = slotEnd;
    }
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

function normalizeTime(timeStr) {
    if (/^\d{1,2}$/.test(timeStr)) {
        return timeStr.padStart(2, '0') + ':00:00';
    }
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return timeStr.padStart(5, '0') + ':00';
    }
    return timeStr;
}

module.exports.bookAppintmentSlot = bookAppintmentSlot;
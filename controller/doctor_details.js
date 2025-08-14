const { getData } = require("../services/getData");
const config = require("../config/config.json");

async function getAllDoctorList(req, res) {
    try {
        const uniqId = new Date().valueOf();
        let uniqNumber = config.moduleCode + uniqId;

        let getDoctorNamePayoad = {
            tableWithJoin: "doctor_data_models",
            colName: `id,doctor_name,opd_open_time,opd_close_time,available_days,specialization`,
            where: ``,
            uniqueNo: uniqNumber,
        };
        const doctorName = await getData(getDoctorNamePayoad);

        if (doctorName.body.message === "Success" && doctorName.statusCode === 200 && doctorName.result.length > 0) {
            return res.status(200).send({ Status: "200", Message: "Data Fetched Successfully", Data: doctorName.body.result });
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

module.exports.getAllDoctorList = getAllDoctorList;
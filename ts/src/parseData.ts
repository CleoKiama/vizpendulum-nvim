import csv from "csv-parser";
import { createReadStream } from "node:fs";

const filePath = "/home/cleo/pendulum-log.csv";

export const parseData = async () => {
	createReadStream(filePath)
		.pipe(csv())
		.on("data", (row) => {
			console.log(row);
		});
};


parseData()

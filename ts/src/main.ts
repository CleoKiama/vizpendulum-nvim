import { createWriteStream } from "node:fs";
import c from "ansi-colors";
import parseData from "./parseData";
import type { TrackingData } from "./types";

const filePath = "/home/cleo/pendulum-log.csv";

const getDay = (date: Date) => {
	const daysTable = {
		0: "sun",
		1: "Mon",
		2: "Tue",
		3: "web",
		4: "Thur",
		5: "Fri",
		6: "sat",
	};
	const value = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
	return daysTable[value];
};

function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

parseData(filePath).then((data: TrackingData) => {
	const outFile = createWriteStream("/tmp/testData.json");
	const stringData = JSON.stringify(data);
	outFile.write(stringData, (err) => {
		if (err) console.error(err.message);
		outFile.end();
	});
	console.log("\nTime Summary:");
	for (const project of data.projects) {
		console.log(`\nProject: ${project.name}`);
		console.log(`Total time: ${formatDuration(project.totalTime)}`);
		console.log("Branches:");
		for (const branch of project.branches) {
			console.log(`  ${branch.name}: ${formatDuration(branch.totalTime)}`);
		}
	}
	console.log(c.green("Filetypes data"));
	for (const fileType of data.fileTypes) {
		console.log(`\nFile type: ${fileType.name}`);
		console.log(fileType);
		console.log(`Total time: ${formatDuration(fileType.totalTime)}`);
	}
	//for (const item of data.dailyMetrics) {
	//	const day = getDay(new Date(item.date));
	//}
});

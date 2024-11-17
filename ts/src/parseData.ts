import csv from "csv-parser";
import { createReadStream } from "node:fs";
import { RowSchema, type Row, type TrackingData } from "./types";
import { ProjectTracker } from "./ProjectTracker";

const TIME_LENGTH = 120; // 2 minutes in seconds

type ItemTime = {
	name: string;
	time: string;
};

export type PrevRowData = {
	branch: ItemTime[];
	cwd: string;
	project: string;
	time: string;
};

export type PrevFileType = {
	totalTime: number;
	prevTime: string;
};

function calculateTimeDiff(current: Date, previous: Date): number {
	const diff = current.getTime() - previous.getTime();
	const timeInSeconds = diff / 1000;
	return timeInSeconds > 0 && timeInSeconds <= TIME_LENGTH ? timeInSeconds : 0;
}

function getPrevItemTime(
	prevRow: PrevRowData,
	key: "branch",
	name: string,
): string {
	const item = prevRow[key].find((item: ItemTime) => item.name === name);
	return item?.time ?? "";
}

export default async function parseData(
	fileDataPath: string,
): Promise<TrackingData> {
	const tracker = new ProjectTracker();

	return new Promise((resolve, reject) => {
		createReadStream(fileDataPath)
			.pipe(csv())
			.on("data", (rawRow: unknown) => {
				const row = RowSchema.parse(rawRow);
				const isActive = row.active.toLowerCase() === "true";
				if (isActive) processRow(row, tracker);
			})
			.on("end", () => {
				const projects = tracker.getAllProjects();
				const fileTypes = tracker.getAllFileTypes();
				const dailyMetrics = tracker.getAllDailyMetrics();
				resolve({
					projects,
					fileTypes,
					dailyMetrics,
				});
			})
			.on("error", reject);
	});
}

function processRow(row: Row, tracker: ProjectTracker) {
	const currentTime = new Date(row.time);
	const prevRow = tracker.getPrevRow(row.project);
	const fileType = row.filetype;
	const prevFileType = tracker.getFileType(fileType, row.time);

	if (!prevRow) {
		tracker.setPrevRow(row.project, {
			...row,
			branch: [{ name: row.branch, time: row.time }],
		});
		return;
	}

	const project = tracker.getProject(row.project);
	const branch = tracker.getBranch(project, row.branch);

	// Calculate time differences
	const prevTime = new Date(prevRow.time);
	const projectTimeDiff = calculateTimeDiff(currentTime, prevTime);
	const fileTypeTimeDiff = calculateTimeDiff(
		currentTime,
		new Date(prevFileType.prevTime),
	);
	tracker.updateDailyMetrics(row, projectTimeDiff, fileTypeTimeDiff);
	tracker.setFileType(fileType, {
		...prevFileType,
		totalTime: prevFileType.totalTime + fileTypeTimeDiff,
		prevTime: row.time,
	});

	const prevBranchTime = getPrevItemTime(prevRow, "branch", row.branch);
	const branchTimeDiff = prevBranchTime
		? calculateTimeDiff(currentTime, new Date(prevBranchTime))
		: 0;

	// Update totals
	project.totalTime += projectTimeDiff;
	branch.totalTime += branchTimeDiff;

	// Update previous row data
	tracker.setPrevRow(row.project, {
		...row,
		branch: updateItemTimes(prevRow.branch, row.branch, row.time),
	});
}

function updateItemTimes(
	items: ItemTime[],
	newName: string,
	newTime: string,
): ItemTime[] {
	const existing = items.find((item) => item.name === newName);
	if (existing) {
		existing.time = newTime;
		return items;
	}
	return [...items, { name: newName, time: newTime }];
}

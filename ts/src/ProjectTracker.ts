import { PrevRowData, PrevFileType } from "./parseData";
import type { DailyMetrics, Row, Project, Branch, FileType } from "./types";

export class ProjectTracker {
	private projectMap = new Map<string, Project>();
	private prevRowMap = new Map<string, PrevRowData>();
	private fileTypeMap = new Map<string, PrevFileType>();
	private dailyMetrics: Map<string, DailyMetrics> = new Map();

	getProject(name: string): Project {
		if (!this.projectMap.has(name)) {
			this.projectMap.set(name, {
				name,
				branches: [],
				totalTime: 0,
			});
		}
		return this.projectMap.get(name)!;
	}

	getBranch(project: Project, branchName: string): Branch {
		let branch = project.branches.find((b) => b.name === branchName);
		if (!branch) {
			branch = { name: branchName, totalTime: 0 };
			project.branches.push(branch);
		}
		return branch;
	}

	getFileType(fileType: string, timeStamp: string) {
		if (!this.fileTypeMap.has(fileType)) {
			this.fileTypeMap.set(fileType, {
				totalTime: 0,
				prevTime: timeStamp,
			});
		}
		return this.fileTypeMap.get(fileType) as PrevFileType;
	}

	setFileType(name: string, fileType: PrevFileType) {
		this.fileTypeMap.set(name, fileType);
	}

	setPrevRow(projectName: string, data: PrevRowData) {
		this.prevRowMap.set(projectName, data);
	}

	getPrevRow(projectName: string): PrevRowData | undefined {
		return this.prevRowMap.get(projectName);
	}

	private getDateKey(dateStr: string): string {
		return dateStr.split(" ")[0]; // Extract YYYY-MM-DD from the timestamp
	}

	updateDailyMetrics(
		row: Row,
		projectTimeDiff: number,
		fileTypeTimeDiff: number,
	) {
		const dateKey = this.getDateKey(row.time);
		let dailyMetric = this.dailyMetrics.get(dateKey);

		if (!dailyMetric) {
			dailyMetric = {
				date: dateKey,
				totalTime: 0,
				projects: {},
			};
			this.dailyMetrics.set(dateKey, dailyMetric);
		}

		// Only update metrics if there is actual time spent
		if (projectTimeDiff > 0) {
			// Update total time for the day
			dailyMetric.totalTime += projectTimeDiff;

			// Update project metrics for the day
			if (!dailyMetric.projects[row.project]) {
				dailyMetric.projects[row.project] = {
					totalTime: 0,
					fileTypes: {},
				};
			}

			const projectMetrics = dailyMetric.projects[row.project];
			projectMetrics.totalTime += projectTimeDiff;

			// Update file type metrics
			if (!projectMetrics.fileTypes[row.filetype]) {
				projectMetrics.fileTypes[row.filetype] = 0;
			}
			if (fileTypeTimeDiff > 0) {
				projectMetrics.fileTypes[row.filetype] += fileTypeTimeDiff;
			}
		}
	}

	getAllProjects(): Project[] {
		return Array.from(this.projectMap.values());
	}

	getAllDailyMetrics(): DailyMetrics[] {
		return Array.from(this.dailyMetrics.values());
	}

	getAllFileTypes(): FileType[] {
		return Array.from(this.fileTypeMap.entries()).map(([name, fileType]) => ({
			name: name,
			totalTime: fileType.totalTime,
		}));
	}
}

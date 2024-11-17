import parseData from "../src/parseData";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

describe("parseData", () => {
	let tempFilePath: string;

	beforeEach(() => {
		tempFilePath = join(os.tmpdir(), `test-${Date.now()}.csv`);
	});

	afterEach(() => {
		try {
			unlinkSync(tempFilePath);
		} catch (error) {
			// File might not exist, ignore
		}
	});

	test("basic time tracking", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
false,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:35:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00`;

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);
		console.log(result);
		expect(result.projects).toHaveLength(1);
		expect(result.projects[0].name).toBe("project1");
		expect(result.projects[0]).toMatchObject({
			name: "project1",
			totalTime: 60, // 1 minute
			branches: [{ name: "main", totalTime: 60 }],
		});
		expect(result.fileTypes).toHaveLength(1);
		expect(result.fileTypes[0]).toMatchObject({
			name: "typescript",
			totalTime: 60,
		});
		expect(result.projects[0].totalTime).toBe(60);
	});

	test("respects time threshold", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
false,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:35:00`;

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		expect(result.projects[0].totalTime).toBe(0); // Should be 0 as time diff > 120 seconds
	});

	test("handles branch switching", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,feature,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00
false,feature,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:30`;

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		const project = result.projects[0];
		expect(project.branches).toHaveLength(2);
		expect(project.branches.find((b) => b.name === "main")?.totalTime).toBe(90);
	});

	test("handles multiple file types", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,main,/proj1,file2.js,javascript,project1,2024-10-22 09:31:00
false,main,/proj1,file2.js,javascript,project1,2024-10-22 09:31:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:30
true,main,/proj1,file2.js,javascript,project1,2024-10-22 09:32:00
`;

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		expect(result.fileTypes).toHaveLength(2);
		expect(
			result.fileTypes.find((f) => f.name === "typescript")?.totalTime,
		).toBe(90);
		expect(
			result.fileTypes.find((f) => f.name === "javascript")?.totalTime,
		).toBe(60);
	});

	test("handles invalid data", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,invalid-date
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00`;

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		expect(result.projects).toHaveLength(1); // Should still process valid rows
	});

	test("handles empty file", async () => {
		const csvData = "active,branch,cwd,file,filetype,project,time\n";

		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		expect(result.projects).toHaveLength(0);
	});
});

describe("Daily metrics", () => {
	let tempFilePath: string;

	beforeEach(() => {
		tempFilePath = join(os.tmpdir(), `test-${Date.now()}.csv`);
	});

	afterEach(() => {
		try {
			unlinkSync(tempFilePath);
		} catch (error) {
			// File might not exist, ignore
		}
	});

	test("should correctly calculate time spent per day", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:34:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-23 09:31:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-23 09:32:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-23 09:33:00
`;
		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		// Verify the overall structure
		expect(result.dailyMetrics).toHaveLength(2); // Should have data for 2 days

		// Get metrics for each day
		const oct22Metrics = result.dailyMetrics.find((day) =>
			day.date.startsWith("2024-10-22"),
		);
		const oct23Metrics = result.dailyMetrics.find((day) =>
			day.date.startsWith("2024-10-23"),
		);

		// Verify Oct 22 data
		expect(oct22Metrics).toBeDefined();
		expect(oct22Metrics?.totalTime).toBe(60); // Only the 09:30->09:31 interval counts (09:34 exceeds threshold)
		expect(oct22Metrics?.projects.project1).toBeDefined();
		expect(oct22Metrics?.projects.project1.totalTime).toBe(60);
		expect(oct22Metrics?.projects.project1.fileTypes.typescript).toBe(60);

		// Verify Oct 23 data
		expect(oct23Metrics).toBeDefined();
		expect(oct23Metrics?.totalTime).toBe(120); // 09:31->09:32->09:33 (two 1-minute intervals)
		expect(oct23Metrics?.projects.project1).toBeDefined();
		expect(oct23Metrics?.projects.project1.totalTime).toBe(120);
		expect(oct23Metrics?.projects.project1.fileTypes.typescript).toBe(120);
	});

	test("should handle gaps exceeding time threshold", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:35:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:36:00
`;
		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		const metrics = result.dailyMetrics[0];
		expect(metrics.totalTime).toBe(60); // Only the 09:35->09:36 interval counts
		expect(metrics.projects.project1.totalTime).toBe(60);
	});

	test("should track multiple projects per day", async () => {
		const csvData = `active,branch,cwd,file,filetype,project,time
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:30:00
true,main,/proj1,file1.ts,typescript,project1,2024-10-22 09:31:00
true,main,/proj2,file2.js,javascript,project2,2024-10-22 09:32:00
true,main,/proj2,file2.js,javascript,project2,2024-10-22 09:33:00
`;
		writeFileSync(tempFilePath, csvData);
		const result = await parseData(tempFilePath);

		const metrics = result.dailyMetrics[0];
		expect(metrics.totalTime).toBe(120); // Total of both projects
		expect(metrics.projects.project1.totalTime).toBe(60);
		expect(metrics.projects.project2.totalTime).toBe(60);
		expect(metrics.projects.project1.fileTypes.typescript).toBe(60);
		expect(metrics.projects.project2.fileTypes.javascript).toBe(60);
	});
});

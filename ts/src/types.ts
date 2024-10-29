import { z } from "zod";

export const RowSchema = z.object({
	active: z.string(),
	branch: z.string(),
	cwd: z.string(),
	file: z.string(),
	filetype: z.string(),
	project: z.string(),
	time: z.string(),
});

export type Row = z.infer<typeof RowSchema>;

export type Project = {
	name: string;
	branches: Branch[];
	totalTime: number;
};

export type DailyMetrics = {
	date: string; // YYYY-MM-DD format
	totalTime: number;
	projects: {
		[projectName: string]: {
			totalTime: number;
			fileTypes: {
				[fileType: string]: number; // totalTime per file type
			};
		};
	};
};

export type FileType = {
	name: string;
	totalTime: number;
};

export type Branch = {
	name: string;
	totalTime: number;
};

export type TrackingData = {
	projects: Project[];
	fileTypes: FileType[];
	dailyMetrics: DailyMetrics[];
};

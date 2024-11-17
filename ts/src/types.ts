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

export const LineGraphsStylesSchema = z.object({
	background: z.string(),
	border_radius: z.string(),
	text: z.object({
		color: z.string(),
		font_size: z.object({
			title: z.string(),
			regular: z.string(),
		}),
	}),
	axis: z.object({
		x: z.object({
			font_size: z.string(),
			color: z.string(),
		}),
		y: z.object({
			font_size: z.string(),
			label_color: z.string(),
		}),
	}),
	line: z.object({
		gradient: z.object({
			start: z.string(),
			end: z.string(),
		}),
		stroke_width: z.number(),
	}),
	dot: z.object({
		radius: z.number(),
		fill: z.string(),
		stroke: z.string(),
		stroke_width: z.number(),
	}),
});

export type LineGraphsStyles = z.infer<typeof LineGraphsStylesSchema>;

export const PieChartOptsSchema = z.object({
	text: z.object({
		color: z.string(),
		font_size: z.string(),
		anchor: z.string(),
	}),
	slice: z.object({
		stroke: z.string(),
		stroke_width: z.string(),
		opacity: z.number(),
	}),
});

export type PieChartOpts = z.infer<typeof PieChartOptsSchema>;

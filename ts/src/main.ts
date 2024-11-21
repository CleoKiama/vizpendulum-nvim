import parseData from "./parseData";
import generateLineGraph from "./LineGraph/drawLineGraph";
import generatePieChart from "./fileTypeTime";
import fs from "fs-extra";
import { z } from "zod";

import { LineGraphsStylesSchema, PieChartOptsSchema } from "./types";
import type { TrackingData, LineGraphsStyles, PieChartOpts } from "./types";

type VisualizationType = "lineGraph" | "pieChart";

type VisualizationOptionsMap = {
	lineGraph: LineGraphsStyles;
	pieChart: PieChartOpts;
};

// Create a generic interface for visualization generators
interface VisualizationGenerator<T extends VisualizationType> {
	generate: (data: TrackingData, options: VisualizationOptionsMap[T]) => string;
	outputFile: string;
}

const OptsSchema = z.discriminatedUnion("type", [
	z.object({
		log_file: z.string(),
		type: z.literal("lineGraph"),
		options: LineGraphsStylesSchema,
	}),
	z.object({
		log_file: z.string(),
		type: z.literal("pieChart"),
		options: PieChartOptsSchema,
	}),
]);

type opts = z.infer<typeof OptsSchema>;

interface VisualizationConfig {
	outputDir: string;
	visualizations: {
		[K in VisualizationType]: VisualizationGenerator<K>;
	};
}
class VisualizationManager {
	private config: VisualizationConfig;
	private data: TrackingData | null;
	private opts: opts;

	constructor(config: VisualizationConfig, opts: opts) {
		this.config = config;
		this.data = null;
		this.opts = opts;
	}

	private async saveFile(buffer: string, path: string): Promise<string> {
		await fs.writeFile(path, buffer);
		return path;
	}
	async generateVisualization<T extends VisualizationType>(
		visualization: T,
	): Promise<string> {
		this.data = await parseData(this.opts.log_file);

		const currentVisualization = this.config.visualizations[visualization];
		const svgString = currentVisualization.generate(
			this.data,
			this.opts.options as VisualizationOptionsMap[T],
		);
		const outputPath = `${this.config.outputDir}/${Date.now()}${currentVisualization.outputFile}`;
		return this.saveFile(svgString, outputPath);
	}
}

// Configuration object
const visualizationConfig: VisualizationConfig = {
	outputDir: "/tmp",
	visualizations: {
		lineGraph: {
			generate: generateLineGraph,
			outputFile: "lineGraph.svg",
		},
		pieChart: {
			generate: generatePieChart,
			outputFile: "pieChart.svg",
		},
	},
};

async function main() {
	try {
		let opts: opts = JSON.parse(process.argv[2] || "{}");
		console.log(opts);
		opts = OptsSchema.parse(opts);
		const visualizationType = opts.type;
		const manager = new VisualizationManager(visualizationConfig, opts);
		const savedPath = await manager.generateVisualization(visualizationType);
		console.log(savedPath);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(`Error generating visualization: ${error.message}`);
		} else {
			console.log("An unknown error occurred");
		}
		process.exit(1);
	}
}

main();

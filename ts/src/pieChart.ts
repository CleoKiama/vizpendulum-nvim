import { select, schemeCategory10, arc, pie, scaleOrdinal } from "d3";
import SVGContextManager from "./svgContextManager";

import type { PieChartOpts, TrackingData } from "./types";

const DIMENSIONS = {
	WIDTH: 500,
	HEIGHT: 400,
	RADIUS_RATIO: 0.8,
	INNER_RADIUS_RATIO: 0.6,
} as const;

interface PieDataItem {
	name: string;
	time: number;
	percentage: number;
}

function formatTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

function calculateRadius(): number {
	return Math.min(DIMENSIONS.WIDTH, DIMENSIONS.HEIGHT) / 2;
}

function preparePieData(data: TrackingData): PieDataItem[] {
	const totalTime = data.fileTypes.reduce(
		(sum, type) => sum + type.totalTime,
		0,
	);

	return data.fileTypes
		.map((fileType) => ({
			name: fileType.name,
			time: fileType.totalTime,
			percentage: (fileType.totalTime / totalTime) * 100,
		}))
		.sort((a, b) => b.time - a.time)
		.filter((_, i) => i < 5); // Only show top 5 file types
}

function createArcGenerators(radius: number) {
	const mainArc = arc<d3.PieArcDatum<PieDataItem>>()
		.innerRadius(0)
		.outerRadius(radius * DIMENSIONS.RADIUS_RATIO);

	const labelArc = arc<d3.PieArcDatum<PieDataItem>>()
		.innerRadius(radius * DIMENSIONS.INNER_RADIUS_RATIO)
		.outerRadius(radius * DIMENSIONS.RADIUS_RATIO);

	return { mainArc, labelArc };
}

function generatePieChart(data: TrackingData, styles: PieChartOpts): string {
	const manager = SVGContextManager.getInstance();
	const container = manager.createContainer("p-lang-pie-chart");
	const radius = calculateRadius();
	const colors = scaleOrdinal<number, string>()
		.domain([0, 1, 2, 3, 4]) // Since we're filtering to top 5 items
		.range(schemeCategory10);

	// Create SVG element
	const svg = select(container)
		.append("svg")
		.attr("xmlns", "http://www.w3.org/2000/svg")
		.attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
		.attr("width", DIMENSIONS.WIDTH)
		.attr("height", DIMENSIONS.HEIGHT)
		.attr("viewBox", `0 0 ${DIMENSIONS.WIDTH} ${DIMENSIONS.HEIGHT}`)
		.append("g")
		.attr(
			"transform",
			`translate(${DIMENSIONS.WIDTH / 2}, ${DIMENSIONS.HEIGHT / 2})`,
		);

	const pieData = preparePieData(data);
	const pieGenerator = pie<PieDataItem>().value((d) => d.time);
	const { mainArc, labelArc } = createArcGenerators(radius);

	// Create arc groups
	const arcs = svg
		.selectAll("path")
		.data(pieGenerator(pieData))
		.enter()
		.append("g")
		.attr("class", "arc");

	// Draw pie segments
	arcs
		.append("path")
		.attr("d", (d) => mainArc(d))
		.attr("fill", (_, i) => colors(i))
		.attr("stroke", styles.slice.stroke)
		.style("stroke-width", styles.slice.stroke_width)
		.style("opacity", styles.slice.opacity);

	// Add labels
	arcs
		.append("text")
		.attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
		.attr("dy", ".35em")
		.style("text-anchor", styles.text.anchor)
		.style("font-size", styles.text.font_size)
		.style("fill", styles.text.color)
		.text((d) => {
			const percentage = d.data.percentage.toFixed(1);
			return `${d.data.name}\n${percentage}%`;
		});

	// Add tooltips
	arcs
		.append("title")
		.text(
			(d) =>
				`${d.data.name}\nTime: ${formatTime(d.data.time)}\n${d.data.percentage.toFixed(1)}%`,
		);

	let svgString = container.innerHTML;
	svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;

	return svgString;
}

export default generatePieChart;

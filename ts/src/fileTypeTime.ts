import { select, schemeCategory10, arc, pie, scaleOrdinal } from "d3";
import SVGContextManager from "./svgContextManager";
import type { PieChartOpts, TrackingData } from "./types";

const DIMENSIONS = {
	WIDTH: 800, 
	HEIGHT: 600,
	RADIUS_RATIO: 0.65, 
	LABEL_PADDING: 30, 
	MIN_ANGLE_FOR_LABEL: 0.1, 
} as const;

interface PieDataItem {
	name: string;
	time: number;
	percentage: number;
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

function midAngle(d: d3.PieArcDatum<PieDataItem>): number {
	return d.startAngle + (d.endAngle - d.startAngle) / 2;
}

function generatePieChart(data: TrackingData, styles: PieChartOpts): string {
	const manager = SVGContextManager.getInstance();
	const container = manager.createContainer("p-lang-pie-chart");
	const radius = calculateRadius();

	// Enhanced color scheme using d3.schemeCategory10
	const colors = scaleOrdinal<number, string>()
		.domain([0, 1, 2, 3, 4])
		.range(schemeCategory10);

	// Create SVG element with padding for labels
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

	// Create gradient definitions
	const defs = svg.append("defs");
	const gradients = defs
		.selectAll("linearGradient")
		.data([0, 1, 2, 3, 4])
		.enter()
		.append("linearGradient")
		.attr("id", (d) => `gradient-${d}`)
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "100%");

	gradients
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", (d) => colors(d))
		.attr("stop-opacity", 1);

	gradients
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", (d) => colors(d))
		.attr("stop-opacity", 0.8);

	const pieData = preparePieData(data);
	const pieGenerator = pie<PieDataItem>()
		.value((d) => d.time)
		.sort(null);

	// Enhanced arc generators
	const mainArc = arc<d3.PieArcDatum<PieDataItem>>()
		.innerRadius(radius * 0.2) // Added inner radius for donut style
		.outerRadius(radius * DIMENSIONS.RADIUS_RATIO)
		.cornerRadius(3); // Slightly rounded corners

	const labelArc = arc<d3.PieArcDatum<PieDataItem>>()
		.innerRadius(
			radius * DIMENSIONS.RADIUS_RATIO + DIMENSIONS.LABEL_PADDING * 1.5,
		)
		.outerRadius(
			radius * DIMENSIONS.RADIUS_RATIO + DIMENSIONS.LABEL_PADDING * 1.5,
		);

	// Create arc groups
	const arcs = svg
		.selectAll("g.slice")
		.data(pieGenerator(pieData))
		.enter()
		.append("g")
		.attr("class", "slice");

	arcs
		.append("path")
		.attr("d", mainArc)
		.attr("fill", (_, i) => colors(i))
		.attr("stroke", styles.slice.stroke)
		.style("stroke-width", styles.slice.stroke_width)
		.style("opacity", styles.slice.opacity)
		.transition()
		.duration(200)
		.attrTween("d", (d) => {
			const interpolate = arc<d3.PieArcDatum<PieDataItem>>()
				.innerRadius(radius * 0.2)
				.outerRadius(radius * DIMENSIONS.RADIUS_RATIO);
			return (_) => {
				return interpolate(d);
			};
		});

	// Enhanced labels
	const labels = arcs
		.append("text")
		.attr("transform", (d) => {
			const pos = labelArc.centroid(d);
			return `translate(${pos})`;
		})
		.style("text-anchor", (d) => {
			const midAngleVal = midAngle(d);
			return midAngleVal < Math.PI ? "start" : "end";
		})
		.style("font-size", styles.text.font_size)
		.style("font-family", "Arial, sans-serif")
		.style("fill", styles.text.color);

	// Add percentage labels
	labels
		.append("tspan")
		.text((d) => `${d.data.name}`)
		.attr("x", 0)
		.attr("dy", "0em");

	labels
		.append("tspan")
		.text((d) => `${d.data.percentage.toFixed(1)}%`)
		.attr("x", 0)
		.attr("dy", "1.2em")
		.style("font-size", "0.9em")
		.style("fill", "#666");


	let svgString = container.innerHTML;
	svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;

	return svgString;
}

export default generatePieChart;

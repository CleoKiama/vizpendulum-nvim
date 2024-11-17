import {
	select,
	scaleTime,
	scaleLinear,
	extent,
	max,
	line,
	curveMonotoneX,
	axisBottom,
	axisLeft,
	timeFormat,
} from "d3";
import fillMissingDailyMetrics from "./fillData";
import SVGContextManager from "../svgContextManager";

import type { TrackingData, LineGraphsStyles } from "../types";

const DIMENSIONS = {
	WIDTH: 720,
	HEIGHT: 500,
	MARGIN: { TOP: 40, RIGHT: 60, BOTTOM: 120, LEFT: 60 },
} as const;

function convertToHours(seconds: number): number {
	return Number((seconds / 3600).toFixed(2));
}

function setupScales(dailyData: { date: Date; hours: number }[]) {
	const xExtent = extent(dailyData, (d) => d.date) as [Date, Date];
	const xPadding = 86400000 * 2;

	const x = scaleTime()
		.domain([
			new Date(xExtent[0].getTime() - xPadding),
			new Date(xExtent[1].getTime() + xPadding),
		])
		.range([0, DIMENSIONS.WIDTH]);

	const y = scaleLinear()
		.domain([0, max(dailyData, (d) => d.hours)! * 1.1])
		.range([DIMENSIONS.HEIGHT, 0])
		.nice();

	return { x, y };
}

function generateLineGraph(
	incomingData: TrackingData,
	styles: LineGraphsStyles,
): string {
	const manager = SVGContextManager.getInstance();
	const container = manager.createContainer("line-graph");

	const svg = select(container)
		.append("svg")
		.attr("xmlns", "http://www.w3.org/2000/svg")
		.attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
		.attr(
			"width",
			DIMENSIONS.WIDTH + DIMENSIONS.MARGIN.LEFT + DIMENSIONS.MARGIN.RIGHT,
		)
		.attr(
			"height",
			DIMENSIONS.HEIGHT + DIMENSIONS.MARGIN.TOP + DIMENSIONS.MARGIN.BOTTOM,
		)
		.style("background", styles.background)
		.style("border-radius", styles.border_radius)
		.append("g")
		.attr(
			"transform",
			`translate(${DIMENSIONS.MARGIN.LEFT},${DIMENSIONS.MARGIN.TOP})`,
		);

	const data = fillMissingDailyMetrics(incomingData);
	const dailyData = data.dailyMetrics.map((day) => ({
		date: new Date(day.date),
		hours: convertToHours(day.totalTime),
	}));

	const { x, y } = setupScales(dailyData);

	svg
		.append("text")
		.attr("x", DIMENSIONS.WIDTH / 2)
		.attr("y", -DIMENSIONS.MARGIN.TOP / 2)
		.attr("text-anchor", "middle")
		.style("font-size", styles.text.font_size.title)
		.style("fill", styles.text.color)
		.style("font-weight", "bold")
		.text("Total Time Coding Per Day");

	const gradient = svg
		.append("defs")
		.append("linearGradient")
		.attr("id", "line-gradient")
		.attr("gradientUnits", "userSpaceOnUse")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%");

	gradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", styles.line.gradient.start);

	gradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", styles.line.gradient.end);

	const lineGenerator = line<{ date: Date; hours: number }>()
		.x((d) => x(d.date))
		.y((d) => y(d.hours))
		.curve(curveMonotoneX);

	svg
		.append("path")
		.datum(dailyData)
		.attr("fill", "none")
		.attr("stroke", "url(#line-gradient)")
		.attr("stroke-width", styles.line.stroke_width)
		.attr("d", lineGenerator);

	const formatDate = timeFormat("%b %d");
	const timeRange = x.domain()[1].getTime() - x.domain()[0].getTime();
	const daysInRange = timeRange / (1000 * 60 * 60 * 24);
	const tickCount = Math.min(10, Math.max(2, Math.floor(daysInRange / 7)));

	const xAxis = svg
		.append("g")
		.attr("transform", `translate(0,${DIMENSIONS.HEIGHT})`)
		.call(
			axisBottom(x)
				.ticks(tickCount)
				.tickFormat((d) => formatDate(d as Date)),
		);

	xAxis
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-2em")
		.attr("dy", "1em")
		.attr("transform", "rotate(-40)")
		.style("font-size", styles.axis.x.font_size)
		.style("fill", styles.axis.x.color);

	svg
		.append("g")
		.call(
			axisLeft(y)
				.ticks(5)
				.tickFormat((d) => `${d}h`),
		)
		.style("font-size", styles.axis.y.font_size)
		.selectAll("text")
		.style("fill", styles.axis.y.label_color);

	svg
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - DIMENSIONS.MARGIN.LEFT)
		.attr("x", 0 - DIMENSIONS.HEIGHT / 2)
		.attr("dy", "1em")
		.attr("fill", styles.text.color)
		.style("text-anchor", "middle")
		.style("font-size", styles.text.font_size.regular)
		.text("Hours Coded");

	svg
		.selectAll(".dot")
		.data(dailyData)
		.enter()
		.append("circle")
		.attr("class", "dot")
		.attr("cx", (d) => x(d.date))
		.attr("cy", (d) => y(d.hours))
		.attr("r", styles.dot.radius)
		.style("fill", styles.dot.fill)
		.style("stroke", styles.dot.stroke)
		.style("stroke-width", styles.dot.stroke_width);

	svg
		.insert("rect", "g")
		.attr("x", -DIMENSIONS.MARGIN.LEFT)
		.attr("y", DIMENSIONS.HEIGHT)
		.attr(
			"width",
			DIMENSIONS.WIDTH + DIMENSIONS.MARGIN.LEFT + DIMENSIONS.MARGIN.RIGHT,
		)
		.attr("height", DIMENSIONS.MARGIN.BOTTOM)
		.attr("fill", styles.background);

	let svgString = container.innerHTML;
	svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;

	return svgString;
}

export default generateLineGraph;

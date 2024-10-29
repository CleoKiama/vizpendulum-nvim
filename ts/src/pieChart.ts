import c from "ansi-colors";
import * as d3 from "d3";
import jsdom from "jsdom";
import path from "node:path";
import { ensureFile } from "fs-extra";
import { writeFile } from "node:fs/promises";

import { TrackingData } from "./types";

const dest = "/tmp/vizpendulum_temp/";
const { JSDOM } = jsdom;
const dom = new JSDOM(`<html><body></body></html>`);
const body = d3.select(dom.window.document).select("body");
const width = 400;
const height = 400;
const radius = Math.min(width, height) / 2;
const colors = d3.scaleOrdinal(d3.schemeCategory10);
const svg = body
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.attr("viewBox", `0 0 ${width} ${height}`)
	.append("g")
	.attr("transform", `translate(${width / 2},${height / 2})`);

async function main(data: TrackingData) {
	await ensureFile(path.join(dest, "test.svg"));

	const image = svg.node()!.outerHTML;
	await writeFile(path.join(dest, "test.svg"), image);
}

main()
	.then(() => {
		console.log(c.green("Finished writing file"));
	})
	.catch((error) => {
		console.error(c.red(`Error: ${error.message}`));
	});

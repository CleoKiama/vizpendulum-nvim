import { addDays, differenceInDays } from "date-fns";

import type { TrackingData, DailyMetrics } from "../types";

function fillMissingDailyMetrics(data: TrackingData) {
	const startDate = new Date(data.dailyMetrics[0].date);
	const endDate = new Date(
		data.dailyMetrics[data.dailyMetrics.length - 1].date,
	);

	// Create Map for O(1) lookups
	const metricsMap = new Map(
		data.dailyMetrics.map((metric) => [metric.date, metric]),
	);

	const dailyMetrics: DailyMetrics[] = [];
	const numberOfDays = differenceInDays(endDate, startDate);

	for (let i = 0; i <= numberOfDays; i++) {
		const date = addDays(startDate, i).toISOString().split("T")[0];

		dailyMetrics.push(
			metricsMap.get(date) || {
				date,
				totalTime: 0,
				projects: {},
			},
		);
	}

	data.dailyMetrics = dailyMetrics;
	return data;
}

export default fillMissingDailyMetrics;

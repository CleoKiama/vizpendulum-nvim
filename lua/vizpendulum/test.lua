local default_opts = {
	log_file = "/home/cleo/pendulum-log.csv",
	type = "pieChart",
	options = {
		text = {
			color = "white",
			font_size = "12px",
			anchor = "middle",
		},
		slice = {
			stroke = "white",
			stroke_width = "1px",
			opacity = 0.8,
		},
	},
}

local viz_type_json = vim.json.encode(default_opts)

print(viz_type_json)

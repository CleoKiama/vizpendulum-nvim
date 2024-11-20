local image_api = require("image")
local build_api = require("vizpendulum.build")
local api = vim.api

local M = {}
local viz_types = {
	lineGraph = {
		type = "lineGraph",
		config_key = "line_graph",
	},
	pieChart = {
		type = "pieChart",
		config_key = "file_types_pie_chart",
	},
}

local state = {
	current_image = nil,
	current_buffer = nil,
	current_window = nil,
}
local default_opts = {
	log_file = vim.fn.expand("$HOME/pendulum-log.csv"),
	image_width = 720,
	image_height = 500,
	line_graph = {
		background = "#ffffff",
		border_radius = "15px",
		text = {
			color = "#1f2937",
			font_size = {
				title = "18px",
				regular = "14px",
			},
		},
		axis = {
			x = {
				font_size = "12px",
				color = "#4b5563",
			},
			y = {
				font_size = "14px",
				label_color = "#4b5563",
			},
		},
		line = {
			gradient = {
				start = "#3b82f6",
				["end"] = "#60a5fa",
			},
			stroke_width = 2,
		},
		dot = {
			radius = 4,
			fill = "#3b82f6",
			stroke = "#ffffff",
			stroke_width = 2,
		},
	},
	file_types_pie_chart = {
		text = {
			color = "green",
			font_size = "16px",
			anchor = "middle",
		},
		slice = {
			stroke = "white",
			stroke_width = "1px",
			opacity = 0.8,
		},
	},
}

local viz_commands = {
	VizpendulumShowCodingTime = "lineGraph",
	VizpendulumShowFileTypes = "pieChart",
}

local plugin_opts = {}

local image_buf = require("vizpendulum.create_image_buffer")
local node_proc = require("vizpendulum.run_node_script")

local function cleanup_current_image()
	if state.current_image then
		state.current_image:clear()
		state.current_image = nil
	end
end

function M.create_visualization(viz_type)
	if not image_api then
		vim.notify("Image API not available", vim.log.levels.ERROR)
		return
	end

	cleanup_current_image()

	local image_dimensions = image_buf.open()
	state.current_buffer = image_dimensions.buf
	state.current_window = image_dimensions.win

	local viz_info = viz_types[viz_type]
	local viz_config = {
		type = viz_info.type,
		options = plugin_opts[viz_info.config_key],
		log_file = plugin_opts.log_file,
	}

	local viz_type_json = vim.json.encode(viz_config)

	node_proc.run_node_script(viz_type_json, function(parsed_paths)
		vim.schedule(function()
			if not (api.nvim_win_is_valid(state.current_window) and api.nvim_buf_is_valid(state.current_buffer)) then
				return
			end

			state.current_image = image_api.hijack_buffer(parsed_paths, state.current_window, state.current_buffer, {
				id = parsed_paths,
				buffer = 500,
				with_virtual_padding = true,
				inline = true,
				x = 1,
				y = 1,
				width = plugin_opts.image_width,
				height = plugin_opts.image_height,
			})

			if state.current_image then
				state.current_image:render()
			end
		end)
	end)
end

function M.cleanup()
	cleanup_current_image()
end

function M.setup(opts)
	plugin_opts = vim.tbl_deep_extend("force", default_opts, opts or {})

	for cmd_name, viz_type in pairs(viz_commands) do
		api.nvim_create_user_command(cmd_name, function()
			M.create_visualization(viz_type)
		end, {})
	end

	api.nvim_create_user_command("VizpendulumBuild", function()
		build_api.build()
	end, {})

	api.nvim_create_user_command("VizpendulumClose", function()
		M.cleanup()
		image_buf.close_tracker()
	end, {})
end

return M

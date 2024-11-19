-- run_node_script.lua
local Job = require("plenary.job")
local uv = vim.loop

local M = {}

local function get_plugin_root()
	-- Get the absolute path of the current Lua file
	local source = debug.getinfo(1, "S").source
	local file_path = string.sub(source, 2) -- Remove the '@' prefix
	-- Get the plugin root directory (two levels up from the current file)
	return vim.fn.fnamemodify(file_path, ":h:h:h")
end

local plugin_root = get_plugin_root()
local node_script_path = plugin_root .. "/ts/dist/plugin.js"

local function check_dist_exists()
	local dist_dir = plugin_root .. "/ts/dist"
	local stat = uv.fs_stat(dist_dir)
	local file_stat = uv.fs_stat(node_script_path)

	if not stat or not file_stat then
		vim.notify("Please run VizpendulumBuild", vim.log.levels.ERROR)
		return false
	end
	return true
end

function M.run_node_script(opts, callback)
	if not check_dist_exists() then
		return
	end

	local result
	local stderr_results = {}

	local job = Job:new({
		command = "tsx",
		args = { node_script_path, opts },
		on_stdout = function(_, data)
			result = data
		end,
		on_stderr = function(_, data)
			table.insert(stderr_results, data)
		end,
		on_exit = function(_, return_val)
			if return_val == 0 then
				callback(result)
			else
				print("Node script failed with exit code:", return_val)
				for _, err in ipairs(stderr_results) do
					print("Error:", err)
				end
			end
		end,
	})

	job:start()
end

return M

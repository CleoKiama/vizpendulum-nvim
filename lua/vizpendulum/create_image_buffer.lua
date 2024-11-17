local api = vim.api
local M = {}

-- Default options
local default_opts = {
	split_width_percent = 50,
}

-- Plugin options
local state = {
	tracker_win = nil,
	tracker_buf = nil,
}

local function create_tracker_buffer()
	local buf = api.nvim_create_buf(false, true)
	local buf_opts = {
		["buftype"] = "nofile",
		["bufhidden"] = "hide",
		["swapfile"] = false,
	}
	for opt, value in pairs(buf_opts) do
		api.nvim_set_option_value(opt, value, { buf = buf })
	end
	api.nvim_buf_set_name(buf, "Metrics Tracker")
	api.nvim_buf_set_keymap(
		buf,
		"n",
		"q",
		':lua require"vizpendulum.create_image_buffer".close_tracker()<CR>',
		{ noremap = true, silent = true }
	)
	return buf
end

local function create_tracker_window(buf)
	-- Calculate window width
	local editor_width = vim.o.columns
	local width = math.floor(editor_width * default_opts.split_width_percent / 100)
	-- Create a vertical split
	vim.cmd("vsplit")
	local win = api.nvim_get_current_win()
	-- Set the buffer for the window
	api.nvim_win_set_buf(win, buf)
	-- Resize the window
	vim.cmd(width .. "wincmd |")
	-- Set window options
	vim.api.nvim_win_set_option(win, "wrap", false)
	vim.api.nvim_win_set_option(win, "number", false)
	vim.api.nvim_win_set_option(win, "relativenumber", false)
	return win
end

local function is_tracker_buffer(buf)
	local name = api.nvim_buf_get_name(buf)
	return name:match("Metrics Tracker$") ~= nil
end

local function find_tracker_buffer()
	for _, buf in ipairs(api.nvim_list_bufs()) do
		if is_tracker_buffer(buf) then
			return buf
		end
	end
	return nil
end

local function toggle_tracker()
	local tracker_buf = find_tracker_buffer() or create_tracker_buffer()
	state.tracker_buf = tracker_buf
	state.tracker_win = create_tracker_window(tracker_buf)
	return { win = state.tracker_win, buf = state.tracker_buf }
end

local function clear_tracker_state()
	state.tracker_win = nil
	state.tracker_buf = nil
end

function M.close_tracker()
	if state.tracker_win and api.nvim_win_is_valid(state.tracker_win) then
		api.nvim_win_close(state.tracker_win, true)
	end
	clear_tracker_state()
end

function M.open()
	-- If tracker is already open, return current dimensions
	if state.tracker_win and api.nvim_win_is_valid(state.tracker_win) then
		return { win = state.tracker_win, buf = state.tracker_buf }
	end

	-- Otherwise, create new tracker
	return toggle_tracker()
end

function M.onToggleTracker()
	if state.tracker_win and api.nvim_win_is_valid(state.tracker_win) then
		M.close_tracker()
		return nil
	end
	return toggle_tracker()
end

return M

local Spinner = {}
local frames = { "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" }

function Spinner.notify_with_spinner(message, level)
	level = level or vim.log.levels.INFO
	local spinner_index = 1
	local notif_id

	-- Create the initial notification
	notif_id = vim.notify(frames[1] .. " " .. message, level, {
		replace = notif_id,
		hide_from_history = true,
	})

	-- Start the spinner animation
	local timer = vim.loop.new_timer()
	timer:start(
		0,
		100,
		vim.schedule_wrap(function()
			spinner_index = (spinner_index % #frames) + 1
			-- Update the notification with new spinner frame
			notif_id = vim.notify(frames[spinner_index] .. " " .. message, level, {
				replace = notif_id,
				hide_from_history = true,
			})
		end)
	)

	-- Return a function to stop the spinner
	return function()
		timer:stop()
		timer:close()
		-- Send final notification without spinner
		vim.notify(message .. " (Done)", level, {
			replace = notif_id,
			hide_from_history = false,
		})
	end
end

return Spinner

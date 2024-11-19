local M = {}
local Job = require("plenary.job")

function M.build()
	local root_dir = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h:h")
	local dir = root_dir .. "/ts"

	if vim.fn.executable("npm") ~= 1 then
		vim.notify("npm not found", vim.log.levels.ERROR)
		return false
	end

	vim.notify("Installing npm packages", vim.log.levels.INFO)
	Job:new({
		command = "npm",
		args = { "install" },
		cwd = dir,
		on_exit = function(_, return_val)
			if return_val ~= 0 then
				vim.notify("npm install failed", vim.log.levels.ERROR)
				return
			end

			vim.notify("Building vizpendulum.nvim...", vim.log.levels.INFO)
			Job:new({
				command = "npm",
				args = { "run", "build" },
				cwd = dir,
				on_stdout = function(_, data)
					vim.notify(data, vim.log.levels.INFO)
				end,
				on_stderr = function(_, data)
					vim.notify(data, vim.log.levels.ERROR)
				end,
				on_exit = function(_, code)
					if code == 0 then
						vim.notify("Build successful", vim.log.levels.INFO)
					else
						vim.notify("Build failed with code: " .. code, vim.log.levels.ERROR)
					end
				end,
			}):start()
		end,
	}):start()

	return true
end

return M
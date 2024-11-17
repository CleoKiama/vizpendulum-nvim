local dir = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h")
print(dir .. "/ts")

local cmd = string.format("cd %s && npm install --production && npm run build", dir)

print("building cleokiama/vizpendulum-nvim")
local result = os.execute(cmd)

if result == 0 then
	print("Build successful")
else
	print("Build failed with exit code: " .. tostring(result))
end

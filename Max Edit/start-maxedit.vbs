Set WshShell = CreateObject("WScript.Shell")
nodeExe = "C:\Program Files\nodejs\node.exe"
script  = "C:\Users\User\Downloads\Projeto Claude Code\Max Edit\frontend\serve.js"
WshShell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & script & Chr(34), 0, False

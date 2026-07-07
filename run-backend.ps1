$env:PYTHONPATH = "c:\Users\dhrum\Downloads\shoplivebharat-source\shoplivebharat\.venv\Lib\site-packages"
Set-Location "c:\Users\dhrum\Downloads\shoplivebharat-source\shoplivebharat\backend"
& "C:\Users\dhrum\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn server:app --host 127.0.0.1 --port 8000

@echo off
cd /d "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
echo Running pytest...
venv\Scripts\pytest.exe tests\test_nexus_calculator.py::test_tax_rate_not_divided_by_100 -v --tb=short
echo.
echo Test execution complete.
pause

@echo off
cd /d "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
echo Running marketplace facilitator test...
venv\Scripts\pytest.exe tests\test_nexus_calculator.py::test_marketplace_sales_excluded_from_liability -v --tb=short
echo.
echo Test execution complete.

@echo off
cd /d "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
python test_calculator_direct.py > test_output.txt 2>&1
type test_output.txt

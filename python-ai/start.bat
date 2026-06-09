@echo off
echo ============================================
echo  CVH - Microservice IA Python
echo  PyTorch + scikit-learn + FastAPI
echo ============================================
echo.

:: Vérifie si l'environnement virtuel existe
if not exist ".venv" (
    echo Creation de l'environnement virtuel...
    python -m venv .venv
)

:: Active l'environnement
call .venv\Scripts\activate.bat

:: Installe les dependances
echo Installation des dependances...
pip install -r requirements.txt --quiet

:: Lance le serveur
echo.
echo Demarrage du microservice sur http://localhost:5001
echo Documentation API : http://localhost:5001/docs
echo.
python main.py

pause

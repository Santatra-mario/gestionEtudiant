@echo off
echo Création de la table presences dans la base de données...
mysql -u root -p uniggest < create_presences_table.sql
echo.
echo Vérification si la table existe...
mysql -u root -p -e "USE uniggest; SHOW TABLES LIKE 'presences';"
echo.
echo Terminé!
pause

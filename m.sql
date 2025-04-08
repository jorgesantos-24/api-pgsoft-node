USE pgsoft;
SELECT LEFT(json, 60) AS inicio, LENGTH(json) AS tam FROM spins_inicial WHERE game_code='fortune-tiger';

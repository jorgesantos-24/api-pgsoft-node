USE pgsoft;
SET @j = (SELECT json FROM spins_inicial WHERE game_code='fortune-tiger' LIMIT 1);
UPDATE spins_inicial SET json = @j WHERE game_code <> 'fortune-tiger';
DELETE FROM spins_inicial WHERE game_code IN ('btrfly-blossom','wings-iguazu');
SELECT game_code, LENGTH(json) AS tam FROM spins_inicial ORDER BY tam;

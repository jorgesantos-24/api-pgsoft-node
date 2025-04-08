USE pgsoft;
UPDATE agents SET callbackurl='http://127.0.0.1:3000/api/pgsoft/' WHERE id=1;
SELECT id, callbackurl FROM agents;

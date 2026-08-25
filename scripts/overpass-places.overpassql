[out:json][timeout:60];
(
  node["place"~"^(city|town|village|suburb|hamlet|neighbourhood|locality)$"](59.680,30.280,59.762,30.480);
);
out body;

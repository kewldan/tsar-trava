[out:json][timeout:180];
(
  way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|unclassified|living_street)$"](59.680,30.280,59.762,30.480);
  way["railway"~"^(rail|light_rail)$"](59.680,30.280,59.762,30.480);
  way["waterway"~"^(river|canal)$"](59.680,30.280,59.762,30.480);
  way["natural"="water"](59.680,30.280,59.762,30.480);
  way["leisure"~"^(park|garden)$"](59.680,30.280,59.762,30.480);
  way["landuse"~"^(forest|grass|meadow|cemetery)$"](59.680,30.280,59.762,30.480);
);
out geom;

CREATE TABLE IF NOT EXISTS recipe (
      url TEXT PRIMARY KEY,
      image TEXT,
      description TEXT,
      title TEXT
);
CREATE TABLE IF NOT EXISTS ingredient (item TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS recipe_ingredient (
      recipe TEXT REFERENCES recipe(url),
      ingredient TEXT REFERENCES ingredient(item)
);
CREATE TABLE IF NOT EXISTS store (
      id TEXT PRIMARY KEY,
      val TEXT
);

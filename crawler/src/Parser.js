const pluralize = require('pluralize');

pluralize.addSingularRule(/cookies$/i, 'cookie')
pluralize.addSingularRule(/chilis$/i, 'chile')
pluralize.addSingularRule(/molasses$/i, 'molasses')

function Parser () {}

const getOGContent = $ => {
  const props = [
    'image',
    'title',
    'description',
    'url'
  ];

  return props.reduce((obj, prop) => {
    const content = $(`meta[property="og:${prop}"]`).prop('content');
    obj[prop] = content;
    return obj;
  }, {})
}

Parser.prototype.parse = function ($) {
  const { url, title, description } = getOGContent($); // didn't work for the image
  // console.log(`parsing ${url}`)
  let ret = [];
  let noresults = { ingredients: [], url, title, description, image: undefined }
  const ld = $('script[type="application/ld+json"]');
  let usingLD = true;
  if (!ld) {
    console.log('no structured data', url);
    return noresults;
  }
  const html = ld.html();
  if (html == undefined) {
    console.log('empty data', url);
    return noresults;
  }
  const json = html.slice(0, html.indexOf(';'))
  let schema;
  try {
    schema = JSON.parse(json);
  }
  catch (err) {
    console.log('json too long', url);
    usingLD = false;
    let ingredients = $('li[class*="ingredients"]');
     ingredients.each(function () {
       ret.push($(this).text().trim())
     })
     if (ret.length === 0) {
       // console.log('no ingredients found,  trying a different pattern');
       ingredients = $('span[itemprop="recipeIngredient"]');
       ingredients.each(function () {
         ret.push($(this).text().trim())
       })
     }
     if (ret.length === 0) {
       console.log("no ingredients found", url)
       return noresults;
     }
  }
  const recipeSchema = usingLD ? Object.values(schema).find(sch => sch['@type'] == 'Recipe') : null;
  if (recipeSchema == undefined && usingLD) {
    // console.log('no recipe here', url);
    return noresults;
  }
  const ingredientProps = [
    'recipeIngredient', // default - should be this
    'ingredient', // damndelicious.net, 
  ]
  for (let prop of ingredientProps) {
    if (!usingLD) break;
    if (prop in recipeSchema) {
      ret = [...recipeSchema[prop]];
      break;
    }
  }
  if (ret.length == 0) {
    console.log('weird schema apparently', url)
    return noresults;
  }

  let image = $("div.component .lazy-image").prop('data-src');
  if (!image) {
    image = $('.rec-photo').prop('src');
    if (!image) console.log(`still no image, ${url}`);
  }

  // console.log(ret)

  const regex = /([\u00BC-\u00BE\u2150-\u215E]\s)?(\d*\/?\d*\s)?(\d+\/\d+\s|[\u00BC-\u00BE\u2150-\u215E]\s)?(\(\d*\.?\d*\sf?l?u?i?d?\s?ounce\)\s|\(\d+\.?\d*.*\spound\)\s|\(\d+\.?\d*\sinch\)\s|\(?\d*\sliter\)?\s|\(?\d*\smilliliter\)?\s)?(cups?|tablespoons?|teaspoons?|can\sor\sbottle|f?l?u?i?d?\s?ounces?|cans?|cloves?|pounds?|packages?|bottles?|slices?d?|cubes?|containers?|fillets?|dashs?|drops?|cuts?|ears?|\S{1,}?\s?heads?|heads?|splashs?|dollops?|loaf?v?e?s?|envelopes?|stalks?|pints?|quarts?|liters?|gallons?|jars?|bars?|bunche?s?|bags?|individual\spackets?|cartons?|packets?|squares?|boxe?s?|sprigs?|pinche?s?)?(.+)/;

  const ingReg = /minced|diced|,|,?\sor\sto\staste|\bto\staste|fresh\sor\sfrozen|freshl?y?|shredded|divided|or\sa\sdesired|melted|grated|roughl?y?|chopped|cut\sinto|\d|strips|halve[ds]?|\bfor\sgarnish|u?n?peeled|deveined|-?\binch\b|pieces?d?|cubed?s?|light\sand\sdark|crumbled|skin\sand\sbones|skinless|seedless|boneless|sliced?s?|thawed|cold|\bhot\b[^sauce]|\bwarme?d?\b|lukewarm|\broom\b|temperature|w?e?l?l?\s?beaten|removed|,?\s\or\smore\s\S{2,}\sneeded|giblets\bremoved|leaves\sremoved|thinl?y?|wedges?d?|u?n?drained|rinsed|torn|\binto\b|refrigerated|finely|softened|cored|mashed|\s[-]-?\s?|cleane?d?|scrubbed|\bnew\b|small|large|fillets?|-x|horizontall?y?|verticall?y?|packed|\blightl?y?|seeded|unsalted|frozen|split|hard-cooked|lengthwise|quartered|crushed|\/|separated|degrees\s[CF]|\(|\)|tough stems|bulk|chunky?s?|meat\b|pounded|u?n?cooked|pitted|for\scoating|thickl?y?-?|toasted|juiced|medium|for\sd?e?e?p?\s?frying|trimmed|coarse-?l?y?|plus\smore|for\stopping|or\ssauce|blanched|reduced-?\s?fat|low-?\s?fat|non-?\s?fat|slivered|assorted|thirds|cut\sin|half|bite-sized?|bite\ssized?|chilled|or\sas\sneeded|or\smore|or\senough.*|with\sskin|ounce|portions|for\sdecoration|such\sas.*|e\.g\..*|white\sparts.*|heated|with\sliquid|zested|u?n?baked|with\sjuice|plain|prepared|shelled|\braw\b|with\stails.*|without\stails|sifted|squeezed\sdry|squeezed|as\sneeded|hulled|washed|distilled|boiling|bone-in\s|creamy|crunchy|your\sfavorite|coole?d?|miniature|mini|whole|spear|baby|kernels?|very|\bover|ripe|canned|mixed|cut|flaked|slender|diagonal|matchstick-?c?u?t?|\bcut\son\b|\bextra\b-?|\bat\b|\blean\b|u?n?popped|if\sneeded|strips?p?e?d?|julienned|pressed|ready-to-eat|\b\S+\sreserved|reserved|for\sgreasing\span|nonfat|low-?\s?sodium|low-?\s?fat|\blite\b|the\sliquid|firm|dissolved.*|\bor\s{2,}|\bor\s?$|for\sdusting|florets?|boiled|for\sbrushing|broken\sup|frenched|broken|marinated|in\sfreezer|for\sdredging|crosswise|granules?|slightl?y?|smooth|jumbo|russet|%/gi;

  const andReg = /^\s*and\s{1,}|\s*and\s{1,}$/gi;

  const duplicateReplacements = [
    [/Alfredo-style\spasta/, 'Alfredo'],
    [/Dijon-style/, 'Dijon'],
    [/Italian-seasoned/, 'Italian seasoned'],
    [/Italian-style/, 'Italian'],
    [/[EAGLE].*/, 'sweetened condensed milk'],
    [/Asian\sdark.*/, 'sesame oil'],
    [/BAKER'S.*/, 'semisweet chocolate'],
    [/PHILADELPHIA.*/, 'cream cheese'],
    [/Ranch-style/, 'ranch'],
    [/salt\sand\sblack\spepper|salt\sand\sground\spepper|salt\sand\sground\sblack\spepper/i, 'salt and pepper'],
    [/barbecue sauce/, 'barbeque sauce'],
    [/half--half.*|-and-\scream|^-and-$/, 'half and half'],
    [/quick-cooking\soat/, 'quick cooking oat'],
    [/taco\sseasoning\smix/, 'taco seasoning'],
    [/green\schile$/, 'green chile pepper'],
    [/all-purpose\sapple|tart\sapple/, 'apple'],
    [/dried\sbasil\sleaf/, 'dried basil'],
    [/dried\sbread\scrumb/, 'dry bread crumb'],
    [/green\schili\spepper|green\schily/, 'green chile pepper'],
    [/mozzarella\scheese/, 'mozzarella'],
    [/tomato\swith\sgreen\schily.*/, 'tomato with green chile pepper'],
    [/beef\sstew\s-/, 'beef stew meat'],
    [/chicken\sbreast\s{2,}/, 'chicken breast'],
    [/cod\sto/, 'cod'],
    [/\bsauce\b/, 'hot sauce'],
    [/chicken\sbouillon.*/, 'chicken bouillon'],
    [/seasoning\ssalt/, 'seasoned salt'],
    [/ranch$/, 'ranch dressing'],
    [/lime\sround/, 'lime'],
    [/ice\swater$|water\s{2,}/, 'water'],
    [/ginger\sroot/, 'ginger'],
    [/virgin\solive.*/, 'olive oil'],
    [/strawberry\swith.*/, 'strawberry'],
    [/heavy\swhipping\scream/, 'heavy cream'],
    [/tomato\sor\s.*/, 'tomato'],
    [/curd\scottage.*/, 'cottage cheese'],
    [/semisweet\schocolate\schip/, 'semi-sweet chocolate chip'],
    [/chickpea\sgarbanzo|garbanzo\sbean\schickpea|chickpea/, 'garbanzo bean'],
    [/kosher\ssalt\sand\sground\spepper/, 'kosher salt and ground black pepper'],
    [/spinach\sleaf/, 'spinach'],
    [/lemon\spepper\sseasoning/, 'lemon pepper'],
    [/cut\sgreen\sbean/, 'green bean']
  ]

  const badParses = [
    /^cut/,
    /^package/,
    /d\savocado/,
    /garlic\sclove\s/,
    /^-/
  ]

  const spaceNormalizer = /\s{2,}/;

  ret = ret
    .map(line => { 
      const matches = line.match(regex).slice(1);
      const ingredient = matches[matches.length - 1];
      let parsedIngredient = ingredient
        .replace(ingReg, "")
        .replace(andReg, "")
        .replace(spaceNormalizer, " ")
        .trim()
        .split(" ")
        .map(pluralize.singular)
        .join(" ");

      duplicateReplacements.forEach(([regex, replacement]) => {
        if (regex.test(parsedIngredient)) {
          parsedIngredient = replacement;
        }
      })
      
      // DEV ONLY
      if (badParses.some(reg => reg.test(parsedIngredient))) {
        console.log({ ingredient, parsedIngredient }, matches.slice(1))
      }

      if (parsedIngredient === "") {
        console.log({ ingredient, parsedIngredient }, matches.slice(1))
      }
      
      return [
        matches
          .slice(0, matches.length - 1)
          .filter(Boolean)
          .map(trim)
          .join(" "),
        parsedIngredient
      ];
    })
    .filter(([qty, ing]) => {
      return !ing.includes("optional");
    })
  // console.log('ingredients found:', ret.length);
  return {
    ingredients: ret,
    image,
    title,
    description
  };
}

const trim = str => str.trim();

module.exports = Parser;

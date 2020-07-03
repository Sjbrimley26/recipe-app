const selectedIngredients = document.getElementById('selectedIngredients');
const recipesFound = document.getElementById('recipesFound')
const selected = new Set();
const submit = document.getElementById('submit');

submit.addEventListener('click', e => {
  const ingredients = [...selected.values()].sort();
  const req = ('/search?' + ingredients.map(i => `ingredient=${encodeURIComponent(i)}`).join('&'))
  console.log({
    req,
    ingredients
  });
  fetch(req).then(res => res.json()).then(json => {
    const recipes = JSON.parse(json);
    while (recipesFound.firstChild) {
      recipesFound.removeChild(recipesFound.firstChild)
    }
    recipes.forEach(({
      url,
      image,
      description,
      title
    }) => {
      const div = document.createElement('div');
      div.classList.add('recipe')

      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      const img = document.createElement('img');
      img.src = image;
      img.alt = title;
      a.appendChild(img);

      const p1 = document.createElement('p');
      const titleText = document.createElement('strong');
      titleText.textContent = title;
      p1.appendChild(titleText);

      const p2 = document.createElement('p');
      p2.textContent = description;

      div.appendChild(a)
      div.appendChild(p1)
      div.appendChild(p2)
      recipesFound.appendChild(div)
    })
  })
})

fetch('/ingredients')
  .then(res => res.json())
  .then(json => {
    const ingredients = JSON.parse(json);
    new autoComplete({
      data: {
        src: ingredients,
        cache: true
      },
      placeHolder: "Ingredients...",
      debounce: 300,
      threshold: 2,
      onSelection: feedback => {
        const ingredient = feedback.selection.value;
        if (selected.has(ingredient)) {
          return;
        }
        const p = document.createElement('span')
        p.textContent = ingredient;
        const cancel = document.createElement('button');
        cancel.textContent = 'Remove from list';
        cancel.addEventListener('click', _ => {
          selected.delete(ingredient);
          selectedIngredients.removeChild(p);
        })
        p.appendChild(cancel);
        selectedIngredients.appendChild(p);
        selected.add(ingredient)
      },
      resultsList: {
        render: true,
        container: source => {
          source.setAttribute("id", "found_ingredients");
        },
        destination: document.querySelector("#autoComplete"),
        position: "afterend",
        element: "ul"
      },
      resultItem: {
        content: (data, source) => {
          source.innerHTML = data.match;
        },
        element: "li"
      },
      maxResults: 10,
      sort: (a, b) => {
        if (a.match < b.match) return -1;
        if (a.match > b.match) return 1;
        return 0;
      },
    })
  })
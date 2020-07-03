const body = document.getElementsByTagName('body')[0]

fetch('/ingredients')
  .then(res => res.json())
  .then(json => {
    const ingredients = JSON.parse(json);
    ingredients.forEach(i => {
      const div = document.createElement('div');
      const label = document.createElement('label')
      label.textContent = i;
      const input = document.createElement('input')
      input.setAttribute('type', 'text');

      const button = document.createElement('button');
      button.textContent = 'Rename'
      button.addEventListener('click', _ => {
        const val = encodeURIComponent(input.value);
        const req = `/rename?oldName=${encodeURIComponent(i)}&newName=${val}`;
        fetch(req, {
            method: 'POST'
          })
          .then(res => console.log(res.status))
          .catch(err => console.err(err.message))
      })

      const deleter = document.createElement('button');
      deleter.textContent = 'Delete'
      deleter.addEventListener('click', _ => {
        const item = encodeURIComponent(i);
        const req = `/item/${item}`
        fetch(req, {
            method: 'DELETE'
          })
          .then(res => console.log(res.status))
          .catch(err => console.err(err.message))
      })

      div.appendChild(label)
      div.appendChild(input)
      div.appendChild(button)
      div.appendChild(deleter)
      body.appendChild(div)
    })
  })
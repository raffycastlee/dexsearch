import {
  setLocalStorage,
  getLocalStorage
} from './data-store'

let currentDex;
let currentPoke = getLocalStorage('dexsearchPoke') || null;
let currentN = 21;
let saveScroll = 0;

// GET objects
const pokedexAPI = `https://pokeapi.co/api/v2/pokedex/`;
// GET object to grab ID for other api
const pokemonSpeciesAPI = `https://pokeapi.co/api/v2/pokemon-species/`;
// GET object to grab details of this poke
const pokemonAPI = `https://pokeapi.co/api/v2/pokemon/`;

const initDexIfEmpty = async () => {
  const dex = getLocalStorage('dexsearchDex');

  if (dex === null) {
    try {
      // placeholder '1' for region
      let response = await fetch(pokedexAPI+1);
      currentDex = await response.json();
      setLocalStorage('dexsearchDex', currentDex);
    } catch (err) {
      console.warn(err);
    }
  } else {
    currentDex = dex;
  }
}

const getPoke = async (id = null) => {
  try {
    // if no provided id, randomize
    if (id === null) {
      id = Math.floor(Math.random()*currentDex.pokemon_entries.length);
    }

    // placeholder
    let response = await fetch(pokemonAPI+id);
    currentPoke = await response.json();
    setLocalStorage('dexsearchPoke', currentPoke);
  } catch (err) {
    console.warn(err);
  }
}


const displayMainPoke = () => {
  // change title first
  const title = document.querySelector('#main-poke>h2');
  title.textContent = currentPoke.name;
  const img = document.querySelector('#main-poke>img');
  // could also show front and back
  // maybe shinies too at some point?
  img.src = currentPoke.sprites.front_default;
}

const getNFromDex = async (end, start = 1) => {
  const pokes = [];
  for (let i = start; i <= end; i++) {
    try {
      // get pokemon details
      let response = await fetch(pokemonAPI+i);
      response = await response.json();

      // extract all the needed details
      const poke = {
        id: response.id,
        name: response.name,
        types: response.types,
        sprites: response.sprites
      }
      
      // add to pokes arr
      pokes.push(poke);
    } catch (err) {
      console.warn(err);
    }
  }
  return pokes;
}

const displayRest = async (n = currentN) => {
  // makes it so that it only displays 3 per row
  n = Math.round(n/3)*3;
  // placeholder static first 20 pokemon.
  // in the future it can depend on user and/or screen dimensions
  await initDexIfEmpty(); // just to make sure we have dex
  const pokes = await getNFromDex(n);
  // hm why do i even need to reset here?
  // reset ul
  const div = document.querySelector('div#content-container');
  div.innerHTML = '';
  const ul = document.createElement('ul');
  ul.id = 'pokedex-list';
  div.append(ul);
  
  renderPokes(pokes);

  document.body.scrollTop = saveScroll; // For Safari
  document.documentElement.scrollTop = saveScroll; // For Chrome, Firefox, IE and Opera

  // toggling button visibility
  const searchButton = document.querySelector('button#search');
  searchButton.classList.remove('hidden');
  const closeButton = document.querySelector('button#close');
  closeButton.classList.add('hidden');

  
  // reappear!
  const lessButton = document.querySelector('button#show-less');
  lessButton.classList.remove('hidden');
  const moreButton = document.querySelector('button#show-more');
  moreButton.classList.remove('hidden');
  
  // listeners for shite
  document
  .querySelector('#show-less')
  .addEventListener('click', handleShowLess);
  // show more button
  document
  .querySelector('#show-more')
  .addEventListener('click', handleShowMore);
  // listener to ul
  document
  .querySelector('ul')
  .addEventListener('click', handleListClick);
  // scuffed ahh button shite
} 

const handleSearch = () => {
  const modal = document.querySelector('div#modal');
  modal.innerHTML = `
    <div class="watermark">
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
    </div>
    <div id="form-container">
      <form>
        <h2 id="form-label">Search Pokemon</h2>
        <label for="keyword">ID or Name:</label>
        <input type="text" name="keyword" id="keyword" required>
        <button type="submit">Submit</button>
      </form>
    </div>
    <div class="watermark">
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
      <p>please don't spam submit it will break</p>
    </div>
  `;
  // add listener for form submit modal
  document
  .querySelector('form')
  .addEventListener('submit', handleSubmit);


  saveScroll = window.scrollY; 
  // unhide modal
  document
  .querySelector('#modal')
  .classList.remove('hidden');

  // swap floating buttons
  document
  .querySelector('button#search')
  .classList.add('hidden');
  document
  .querySelector('button#close')
  .classList.remove('hidden');
}

const removeErrorP = () => {
  // remove error message if any
  const errorP = document.querySelector('form>p');
  if (errorP !== null) {
    const form = document.querySelector('form');
    form.removeChild(errorP);
  }
}

// there's a weird async thing if you spam submit
// while api is still retrieving data, u get unwanted behavior
const handleSubmit = async (e) => {
  e.preventDefault();
  // remove any error messages if any
  removeErrorP();
  
  let keyword = e.target.keyword.value;
  if (isNaN(keyword)) {
    try {
      // grab species api first
      let response = await fetch(pokemonSpeciesAPI+keyword);
      if (response.status === 404) {
        throw new Error('ERROR: Invalid ID/Name');
      }
      response = await response.json();
      // now we have access to new poke with currPoke
      await getPoke(response.id);
      // graceful exit.
      submitSuccess(e);
      displayMainPoke();
      displayDetails();
    } catch (err) {
      console.warn(err);
      // maybe form reset but not close modal?
      // display error id/name not found on modal

      // non-graceful exit.
      submitFail(e);
    }
  } else {
    // convert to number
    keyword = Number(keyword);
    // now we have access to new poke with currPoke
    await getPoke(keyword);
    // graceful exit.
    submitSuccess(e);
    displayMainPoke();
    displayDetails();
  }
}

const submitFail = (e) => {
  // reset form
  e.target.reset();

  // error <p>
  // check if it exists already
  const errorP = document.createElement('p');
  errorP.style.color = 'red';
  errorP.textContent = 'ERROR: Invalid ID/Name';

  // append p to form
  const form = document.querySelector('form')
  form.append(errorP);
}

const submitSuccess = (e) => {
  // go back to scroll pos
  document.body.scrollTop = saveScroll; // For Safari
  document.documentElement.scrollTop = saveScroll; // For Chrome, Firefox, IE and Opera
  // re-hide modal
  document
  .querySelector('#modal')
  .classList.add('hidden');

  // swap floating buttons
  document
  .querySelector('button#search')
  .classList.remove('hidden');
  document
  .querySelector('button#close')
  .classList.add('hidden');

  // form reset
  e.target.reset();
}

const handleShowLess = async () => {
  // save for later
  const previousN = currentN;
  // cut off 50% of currently displayed list
  // and make sure that it fits to gridcol=3
  currentN = Math.round((currentN/2)/3)*3;
  // makes sure that entries shown cannot be less than 3
  currentN = Math.max(currentN, 3);
  
  // logic to toggle button visibility
  if (currentN === 3) {
    const lessButton = document.querySelector('button#show-less');
    lessButton.classList.add('hidden');
  }
  if (currentN < currentDex.pokemon_entries.length) {
    const moreButton = document.querySelector('button#show-more');
    moreButton.classList.remove('hidden');
  }
  
  showLess(previousN);
}

const showLess = (previousN) => {
  const ul = document.querySelector('ul');
  const yeet = [...ul.childNodes].splice(0, previousN-currentN);
  ul.replaceChildren(...yeet);
}

const handleShowMore = async () => {
  const modal = document.querySelector('div#modal');
  modal.innerHTML = `
    <h1 style="color: white;">LOADING</h1>
  `;
  // sink search button
  const floatingButton = document.querySelector('.floating');
  floatingButton.style.zIndex = 9998;
  
  // unhide modal
  document
  .querySelector('#modal')
  .classList.remove('hidden');

  // save for later
  const previousN = currentN;
  if (currentN * 2 < currentDex.pokemon_entries.length) {
    currentN = Math.round((currentN*2)/3)*3;
  } else {
    currentN = currentDex.pokemon_entries.length;
  }
  
  // logic to toggle button visibility
  if (currentN > 3) {
    const lessButton = document.querySelector('button#show-less');
    lessButton.classList.remove('hidden');
  }
  if (currentN === currentDex.pokemon_entries.length) {
    const moreButton = document.querySelector('button#show-more');
    moreButton.classList.add('hidden');
  }

  const loadStart = Date.now();
  console.log(loadStart)
  
  await showMore(previousN);

  // EL O EL
  while (loadStart+250 > Date.now()) {}

  // resurface search button
  floatingButton.style.zIndex = 9999;
  // hide modal
  document
  .querySelector('#modal')
  .classList.add('hidden');
}

const renderPokes = (pokes) => {
  const ul = document.querySelector('#pokedex-list');
  for (const poke of pokes) {
    // create li
    const li = document.createElement('li');
    // might need to be refactored if displaying not from dex entry 1
    li.id = poke.id;
    li.classList.add('poke-li');
    
    // create li-div inside li
    const div = document.createElement('div');
    div.classList.add('poke-li-div');
    li.append(div);
    
    // creates name inside li-div
    const name = document.createElement('h3');
    name.textContent = `${poke.id}. ${poke.name}`;
    div.append(name);
    
    // create img inside li-div
    const img = document.createElement('img');
    img.src = poke.sprites.front_default;
    div.append(img);
    
    
    // creates types-div inside li-div
    const typesDiv = document.createElement('div');
    typesDiv.classList.add('types');
    div.append(typesDiv);
    
    // creates one or two spans inside types-div
    for (const type of poke.types) {
      const typeSpan = document.createElement('span');
      typeSpan.textContent = type.type.name;
      typesDiv.append(typeSpan);
    }
    
    // append the li to ul
    ul.append(li);
  }
}

const showMore = async (previousN) => {
  const pokes = await getNFromDex(currentN, previousN+1);
  renderPokes(pokes);
}

const handleListClick = async (e) => {
  // if no li is clicked.
  if (e.target.matches('ul') || e.target.matches('button')) return;
  
  e = e.target.closest('li');
  // now we query api using e.target.id (li has it)
  try {
    // unhide modal
    const modal = document.querySelector('div#modal');
    modal.innerHTML = `
      <h1 style="color: white;">LOADING</h1>
    `;
    document
    .querySelector('#modal')
    .classList.remove('hidden');

    const loadStart = Date.now();
    console.log(loadStart)

    let response = await fetch(pokemonAPI+e.id);
    currentPoke = await response.json();

    // EL O EL
    while (loadStart+250 > Date.now()) {}

    // hide modal
    document
    .querySelector('#modal')
    .classList.add('hidden');

    // handle render or page change here
    displayMainPoke();
    // a good fn maybe is to retain the scroll on the main page, so when you go back you don't have to scroll all the way down if the entry is like. way below and shite.
    saveScroll = window.scrollY; 
    displayDetails();
  } catch (err) {
    console.warn(err);
  }
}

const handleClose = () => {
  // since i also use close for closing modal
  const modal = document.querySelector('#modal');
  modal.classList.add('hidden');
  // remove error p if ever
  removeErrorP();
  // redisplay main view here. exit from detailed view
  displayRest();
}

const displayDetails = () => {
  // scroll to top
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  
  // toggle button visibility
  const searchButton = document.querySelector('button#search');
  searchButton.classList.add('hidden');
  const closeButton = document.querySelector('button#close');
  closeButton.classList.remove('hidden');

  // just hide the buttons again
  const lessButton = document.querySelector('button#show-less');
  lessButton.classList.add('hidden');
  const moreButton = document.querySelector('button#show-more');
  moreButton.classList.add('hidden');
  
  // wipe the content container
  const div = document.querySelector('div#content-container');
  div.innerHTML = '';
  
  // adding new details to lists
  // enclosing div
  const detailsDiv = document.createElement('div');
  detailsDiv.id = 'details-container';
  
  // div box for types
  const typesP = document.createElement('p');
  typesP.classList.add('bold');
  typesP.textContent = 'types';
  detailsDiv.append(typesP);
  const typesDiv = document.createElement('div');
  typesDiv.classList.add('details-types-div');
  // creates one or two spans inside types-div
  for (const type of currentPoke.types) {
    const typeSpan = document.createElement('span');
    typeSpan.classList.add('details-types');
    typeSpan.textContent = type.type.name;
    typesDiv.append(typeSpan);
  }
  // adds to details div
  detailsDiv.append(typesDiv);
  
  // height weight in a single p span
  const p = document.createElement('p');
  const heightSpan = document.createElement('span');
  heightSpan.id = 'details-height';
  heightSpan.textContent = currentPoke.height*10 + 'cm';
  p.append(heightSpan);
  const weightSpan = document.createElement('span');
  weightSpan.id = 'details-weight';
  weightSpan.textContent = currentPoke.weight/10 + 'kg';
  p.append(weightSpan);
  // adds to details div
  detailsDiv.append(p);
  
  // abilities
  const abilitiesP = document.createElement('p');
  abilitiesP.classList.add('bold');
  abilitiesP.textContent = 'abilities';
  detailsDiv.append(abilitiesP);
  const ulAbilities = document.createElement('ul');
  ulAbilities.id = 'abilities';
  for (const [i, ability] of currentPoke.abilities.entries()) {
    const liAbility = document.createElement('li');
    liAbility.id = i+1;
    liAbility.textContent = ability.ability.name.replaceAll(/-/g, ' ');
    ulAbilities.append(liAbility);
  }
  //append to div
  detailsDiv.append(ulAbilities);
  
  // moves
  const movesP = document.createElement('p');
  movesP.classList.add('bold');
  movesP.textContent = 'moves';
  detailsDiv.append(movesP);
  const ulMoves = document.createElement('ul');
  ulMoves.id = 'moves';
  for (const [i, move] of currentPoke.moves.entries()) {
    const liMove = document.createElement('li');
    liMove.id = i+1;
    liMove.textContent = move.move.name.replaceAll(/-/g, ' ');
    ulMoves.append(liMove);
  }
  detailsDiv.append(ulMoves);
  
  // sprites
  const spritesP = document.createElement('p');
  spritesP.classList.add('bold');
  spritesP.textContent = 'sprites';
  detailsDiv.append(spritesP);
  const ulSprites = document.createElement('ul');
  ulSprites.id = 'sprites';
  for (const [spriteName, spriteURL] of Object.entries(currentPoke.sprites)) {
    if (spriteURL === null ||
      spriteName === 'other' ||
      spriteName === 'versions'
    ) continue;
    const spriteDiv = document.createElement('div');
    spriteDiv.classList.add('sprite-div');
    spriteDiv.id = spriteName;
    
    const h3 = document.createElement('h3');
    h3.classList.add('sprite-text');
    h3.textContent = spriteName.replaceAll(/_/g, ' ');
    // add to parent
    spriteDiv.append(h3);
    
    const img = document.createElement('img');
    img.src = spriteURL;
    // add to parent
    spriteDiv.append(img);

    // adding to list
    ulSprites.append(spriteDiv);
  }
  detailsDiv.append(ulSprites);

  div.append(detailsDiv);
}

export {
  initDexIfEmpty,
  getPoke,
  displayMainPoke,
  getNFromDex,
  displayRest,
  handleShowLess,
  handleShowMore,
  handleListClick,
  handleSearch,
  handleClose,
  handleSubmit
}
const PUBLIC_KEY = '0a282c66b2c555104e44d45e8dbb73b8';
const PRIVATE_KEY = 'f9f377ac6f41ae80557bcadc1278f3979fa3ca49';
const BASE_URL = 'https://gateway.marvel.com/v1/public/';

function generateHash(ts) {
    return CryptoJS.MD5(ts + PRIVATE_KEY + PUBLIC_KEY).toString();
}

async function fetchCharacters(params) {
    try {
        const ts = Date.now();
        const response = await $.ajax({
            url: `${BASE_URL}characters`,
            data: {
                ts: ts,
                apikey: PUBLIC_KEY,
                hash: generateHash(ts),
                ...params
            }
        });
        return response.data.results;
    } catch (error) {
        showError('Error al obtener los personajes');
        return [];
    }
}

async function loadRandomCharacters() {
    showLoading();
    const characters = await fetchCharacters({ limit: 20, orderBy: '-modified' });
    displayCharacters(characters);
    loadComicFilterOptions(characters);
    hideLoading();
}

async function searchCharacter() {
    const searchTerm = $('#searchInput').val().trim();
    if (!searchTerm) return;

    showLoading();
    const characters = await fetchCharacters({ nameStartsWith: searchTerm });
    displayCharacters(characters);
    hideLoading();
}

async function loadThreeRandomCharacters() {
    showLoading();

    try {
        const allCharacters = await fetchCharacters({ limit: 100 }); 
        if (allCharacters.length < 3) {
            showError('No hay suficientes personajes disponibles.');
            hideLoading();
            return;
        }

        const randomCharacters = [];
        while (randomCharacters.length < 3) {
            const randomIndex = Math.floor(Math.random() * allCharacters.length);
            const character = allCharacters[randomIndex];

            if (!randomCharacters.includes(character)) {
                randomCharacters.push(character);
            }
        }

        displayCharacters(randomCharacters);
    } catch (error) {
        showError('Error al obtener los personajes.');
    }

    hideLoading();
}

$(document).ready(() => {
    $('#threeCharacters').click(loadThreeRandomCharacters);
});


async function filterByComic(comicId) {
    if (!comicId) return;

    showLoading();
    const characters = await fetchCharacters({ comics: comicId });

    if (characters.length === 0) {
        showError('No se encontraron personajes en este cómic.');
    } else {
        displayCharacters(characters);
    }

    hideLoading();
}


function displayCharacters(characters) {
    const grid = $('#charactersGrid');
    grid.empty();

    characters.forEach(character => {
        const imageUrl = `${character.thumbnail.path}/standard_xlarge.${character.thumbnail.extension}`;
        const comics = character.comics.items.slice(0, 5).map(c => c.name).join(', ');

        grid.append(`
            <div class="character-card">
                <img class="character-image" src="${imageUrl}" alt="${character.name}">
                <div class="character-info">
                    <h3>${character.name}</h3>
                    <p>${character.description || 'Sin descripción disponible'}</p>
                    <div class="comics-list">
                        <strong>Aparece en:</strong> ${comics || 'Ningún cómic registrado'}
                    </div>
                </div>
            </div>
        `);
    });
}

let comicsMap = {};

function loadComicFilterOptions(characters) {
    comicsMap = {}; 

    characters.forEach(character => {
        character.comics.items.forEach(comic => {
            if (comic.resourceURI) {
                let comicId = comic.resourceURI.split('/').pop(); 
                comicsMap[comicId] = comic.name; 
            }
        });
    });

    const select = $('#comicFilter');
    select.empty().append('<option value="">Filtrar por cómic</option>');

    Object.entries(comicsMap).forEach(([comicId, comicName]) => {
        select.append(`<option value="${comicId}">${comicName}</option>`);
    });

    select.on('change', function() {
        filterByComic(this.value);
    });
}

function showLoading() { $('#loading').show(); $('#error').hide(); }
function hideLoading() { $('#loading').hide(); }
function showError(message) { $('#error').text(message).show(); }

$(document).ready(() => {
    $('#randomCharacters').click(loadRandomCharacters);
    $('#searchButton').click(searchCharacter);
    loadRandomCharacters();
});

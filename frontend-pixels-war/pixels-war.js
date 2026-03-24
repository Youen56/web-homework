// using vite, we can write our code with URLs that simply read
// /api/v2/xxx
// and vite will proxy them to whichever server is configured in vite.config.js,
// which is currently set to https://pixels-war.fly.dev
// so there's essentially no need for a global variable with the server URL..

// also note that it's probably wise to start with the TEST map

document.addEventListener("DOMContentLoaded",
    async () => {

        let MAP_ID = "TEST"
        let API_KEY = undefined

        // for starters we get the list of maps from the server
        // and use that to populate the mapid input
        // so we don't have to guess the map ids

        console.log("Retrieving maps from the server...")
        const maps_response = await fetch(`/api/v2/maps`, {credentials: "include"});

        // 1. On vérifie D'ABORD si le serveur a renvoyé une erreur
        if (!maps_response.ok) {
            alert(`Error retrieving maps: ${maps_response.status} ${maps_response.statusText}`);
            return;
        }

        // 2. SEULEMENT SI tout va bien, on lit le JSON
        const maps_json = await maps_response.json();

        //SPOILER:
        // when the response is good, use the resulting JSON
        // to populate the dropdown in HTML,
        // so the user picks among actually available maps
        const select = document.getElementById("mapid-input")
        for (const {name, timeout} of maps_json) {
            const option = document.createElement("option")
            option.value = name
            const seconds = timeout / 1000000000
            option.textContent = `${name} (${seconds}s)`
            select.appendChild(option)
            console.log(`Map ${name} added to the dropdown`)
        }

        //TODO:
        // write the connect(..) function below,
        async function connect(event) {
    // Si ton bouton est dans un formulaire, cela évite le rechargement de la page
    if (event) event.preventDefault(); 
    
    // 1. Récupérer l'ID de la map depuis le menu déroulant
    const select = document.getElementById("mapid-input");
    MAP_ID = select.value;

    console.log(`Initialisation de la carte : ${MAP_ID}`);

    // 2. Envoyer la requête /init (l'URL exacte peut varier selon ton backend)
    // J'utilise ici un chemin typique d'API REST : /api/v2/maps/MAP_ID/init
    const response = await fetch(`/api/v2/${MAP_ID}/init`, {credentials: "include"});

    // 3. Vérifier le code de statut
    if (!response.ok) {
        alert(`Erreur d'initialisation : ${response.status} ${response.statusText}`);
        return;
    }

    // 4. Initialiser la carte si tout est OK
    const data = await response.json();
    console.log("Données d'initialisation reçues :", data);
    
    // On suppose que le JSON renvoie la taille (ni, nj), les pixels (data), et l'API_KEY
    // À adapter selon la structure exacte de ce que renvoie ton serveur !
    API_KEY = data.apiKey; 
    
    // On dessine la carte
    draw_map(data.ni, data.nj, data.pixels); 
}

// TODO: Attacher la fonction au bouton "Connect"
// Assure-toi que l'ID correspond à celui de ton fichier HTML
const connectBtn = document.getElementById("connect-button"); // au lieu de "connect-btn"
if (connectBtn) {
    connectBtn.addEventListener("click", connect);
}





        //TODO: and attach it to the Connect button

        //TODO:
        // write a function that draws a map inside the griv div
        // - ni is the number of rows,
        // - nj the number of columns,
        // - and data is a 3D array of size ni x nj x 3,
        //   where the last dimension contains the RGB color of each pixel
        // do not forget to clean up any previously drawn map
        // also give the child div's the 'pixel' class to leverage the default css
        // also don't forget to set the gridTemplateColumns of the grid div
        function draw_map(ni, nj, data) {
    const grid = document.getElementById("grid"); 
    
    grid.innerHTML = ""; 

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${nj}, 1fr)`;

    for (let i = 0; i < ni; i++) {
        for (let j = 0; j < nj; j++) {
            // Création de la case
            const pixel = document.createElement("div");
            pixel.classList.add("pixel");

            pixel.dataset.i = i;
            pixel.dataset.j = j;

            const [r, g, b] = data[i][j];
            pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            grid.appendChild(pixel);
        }
    }
    
    console.log(`Carte dessinée : ${ni} lignes x ${nj} colonnes.`);
}


        //TODO:
        // write a function that applies a set of color changes
        // the input is a collection of 5-tuples of the form i, j, r, g, b
        function apply_changes(ni, nj, changes) {
    // On récupère la grille et la liste de tous les pixels qu'elle contient
    const grid = document.getElementById("grid");
    const pixels = grid.children;

    // On parcourt chaque changement reçu du serveur
    for (const change of changes) {
        // change est un tableau contenant [i, j, r, g, b]
        const [i, j, r, g, b] = change;
        
        // On calcule l'index du pixel dans la liste HTML
        const index = i * nj + j;
        
        // On vérifie que le pixel existe bien, puis on change sa couleur
        if (pixels[index]) {
            pixels[index].style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
    }
}


        //TODO:
        // now that we have the JSON data that describes the map, we can
        // display the grid, and retrieve the corresponding API-KEY
        // La fonction qui communique avec le serveur
async function set_pixel(i, j, r, g, b) {
    if (!API_KEY) {
        alert("Vous n'êtes pas connecté ou l'API_KEY est manquante !");
        return;
    }

    // L'URL et la méthode (PUT ou POST) dépendent de la documentation de ton backend
    const url = `/api/v2/maps/${MAP_ID}/pixels`; 
    
    const response = await fetch(url, {
        method: "PUT", // ou POST, selon ce que ton serveur attend
        headers: {
            "Content-Type": "application/json",
            // Certains serveurs attendent la clé dans le Header, d'autres dans le body
            "Authorization": `Bearer ${API_KEY}` 
        },
        // On envoie les coordonnées et la couleur
        body: JSON.stringify({ i: parseInt(i), j: parseInt(j), r, g, b }),
        credentials: "include"
    });

    if (!response.ok) {
        alert(`Erreur lors du coloriage : ${response.status} ${response.statusText}`);
    } else {
        console.log(`Pixel en (${i}, ${j}) colorié avec succès !`);
        // Note : le serveur pourrait te renvoyer le timer ou valider le changement ici
    }
}

// On attache l'événement de clic à la grille principale
const grid = document.getElementById("grid");
grid.addEventListener("click", (event) => {
    // On vérifie que le clic a bien eu lieu sur une case ayant la classe 'pixel'
    if (event.target.classList.contains("pixel")) {
        // On récupère i et j qu'on avait stockés dans dataset
        const i = event.target.dataset.i;
        const j = event.target.dataset.j;
        
        // On utilise la fonction d'aide déjà présente en bas de ton fichier
        const [r, g, b] = getPickedColorInRGB();
        
        // On déclenche l'appel réseau
        set_pixel(i, j, r, g, b);
        
        // (Optionnel) : On peut appliquer le changement localement tout de suite pour la fluidité
        // event.target.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
});

        //TODO:
        // now that we have the API-KEY,
        // write a refresh(...) function that updates the grid
        // and attach this function to the refresh button click
        async function refresh() {
    // Si aucune carte n'est sélectionnée, on ne fait rien
    if (!MAP_ID) return; 

    try {
        // On interroge le serveur pour récupérer l'état actuel
        // (L'URL exacte dépend de ton backend, ça peut être /api/v2/maps/${MAP_ID})
        const response = await fetch(`/api/v2/maps/${MAP_ID}`, { credentials: "include" });
        
        if (!response.ok) {
            console.error(`Erreur de rafraîchissement : ${response.status}`);
            return;
        }

        const data = await response.json();

        /* * IMPORTANT : Ici, il faut t'adapter à ce que renvoie ton serveur.
         * * Option A : Le serveur renvoie toute la grille (comme dans init)
         * draw_map(data.ni, data.nj, data.pixels);
         * * Option B : Le serveur renvoie un tableau de changements
         * apply_changes(data.ni, data.nj, data.changes);
         */

    } catch (error) {
        console.error("Erreur réseau lors du rafraîchissement :", error);
    }
}

const refreshBtn = document.getElementById("refresh-button"); 
if (refreshBtn) {
    refreshBtn.addEventListener("click", refresh);
}

        //TODO:
        // to be able to color a pixel: write a set_pixel(...)
        // function that sends a request to the server to color a pixel
        // and attach this function to each pixel in the grid click
        // the color is taken from the color picker (code provided below)
        // it's up to you to find a way to get the pixel coordinates

        //TODO:
        // why not refresh the grid every 2 seconds?
        // or even refresh the grid after clicking a pixel?

        // ---- cosmetic / convenience / bonus:

        //TODO: for advanced students, make it so we can change maps from the UI
        // using e.g. the Connect button in the HTML

        // TODO: to be efficient, it would be useful to display somewhere
        // the coordinates of the pixel hovered by the mouse

        //TODO: for the quick ones: display somewhere how much time
        // you need to wait before being able to post again

        //TODO: for advanced users: it could be useful to be able to
        // choose the color from a pixel?



        // no need to change anything below
        // just little helper functions for your convenience

        // retrieve RGB color from the color picker
        function getPickedColorInRGB() {
            const colorHexa = document.getElementById("colorpicker").value

            const r = parseInt(colorHexa.substring(1, 3), 16)
            const g = parseInt(colorHexa.substring(3, 5), 16)
            const b = parseInt(colorHexa.substring(5, 7), 16)

            return [r, g, b]
        }

        // in the other direction, to put the color of a pixel in the color picker
        // (the color picker insists on having a color in hexadecimal...)
        function pickColorFrom(div) {
            // rather than taking div.style.backgroundColor
            // whose format we don't necessarily know
            // we use this which returns a 'rgb(r, g, b)'
            const bg = window.getComputedStyle(div).backgroundColor
            // we keep the 3 numbers in an array of strings
            const [r, g, b] = bg.match(/\d+/g)
            // we convert them to hexadecimal
            const rh = parseInt(r).toString(16).padStart(2, '0')
            const gh = parseInt(g).toString(16).padStart(2, '0')
            const bh = parseInt(b).toString(16).padStart(2, '0')
            const hex = `#${rh}${gh}${bh}`
            // we put the color in the color picker
            document.getElementById("colorpicker").value = hex
        }
    }
)

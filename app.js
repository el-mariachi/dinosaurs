(function (global) {

    // create reference to form
    const userForm = document.forms['dino-compare'];
    // save initial form display method (block/flex/grid/inline/etc.)
    const formDisplay = getComputedStyle(userForm).display;
    /**
     * @description adds a method to show the form on the page
     */
    userForm.show = function () {
        this.style.display = formDisplay;
    }
    /**
     * @description adds a method to hide the form
     */
    userForm.hide = function () {
        this.style.display = 'none';
    }

    // save ref to grid
    const grid = document.getElementById('grid');

    /**
     * @description creates error message div using singleton pattern
     * @returns an object with methods to show/hide the error message
     */
    const errorMessage = (function () {
        let instance;
        let message;

        function init() {
            const div = document.createElement('div');
            div.id = 'form-error';
            div.style.display = 'none';
            message = document.createElement('h3');
            message.className = 'error-text';
            div.appendChild(message);
            userForm.after(div); // append to DOM after the form
            return div;
        }
        function getInstance() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
        return {
            /**
             * 
             * @param {string} msg Error message to be displayed
             */
            show: function (msg) {
                getInstance().style.display = 'block';
                message.textContent = msg || '';
            },
            hide: function () {
                if (!instance) {
                    return; // no need to instantiate div if there was no form error earlier
                }
                message.textContent = '';
                getInstance().style.display = 'none';
            }
        }
    })();

    // come again button with singleton
    /**
     * @description creates a Start over button div and adds it to the DOM
     * @description uses singleton pattern
     * @returns {*} an object with methods to show/hide/getInstance
     */
    const startOverBtn = (function () {
        let instance;
        /**
         * @returns {HTMLDivElement} button div appended to the document
         */
        function init() {
            const div = document.createElement('div');
            div.className = 'btn';
            div.textContent = 'Start over';
            div.style.display = 'none';
            grid.after(div);
            return div;
        }
        /**
         * @returns {*} button div instance
         */
        function getInstance() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
        return {
            getInstance,
            show: function () {
                getInstance().style.display = 'block';
            },
            hide: function () {
                getInstance().style.display = 'none';
            }
        }
    })();

    /**
     * @description Resets form text and number inputs
     * @param {HTMLFormElement} form 
     */
    function resetForm(form) {
        const formInputs = Array.from(form.elements);
        formInputs.forEach(input => {
            if (input.type === 'text' || input.type === 'number') {
                input.value = '';
            }
        });
    }

    // start over function
    /**
     * @description Start over button click handler
     * @param {Event} evt Click event (not used so far)
     */
    function startOver(evt) {
        startOverBtn.hide();
        resetForm(userForm);
        userForm.show();
        grid.innerHTML = '';
    }

    // Create Dino Constructor
    /**
     * @constructor for creating Dinos
     * @param {*} {...} data from json
     * @param {*} userData form data
     */
    function Dino({ species, weight, height, diet, where, when, fact }, userData) {
        this.species = species || 'Unknown';
        this.unitSystem = userData.unitSystem;
        const weightData = parseInt(weight, 10) || 0; // data from json
        const heightData = parseInt(height, 10) || 0; // data from json
        if (this.unitSystem === 'metric') {
            this.weight = weightData / 2.20462;
            this.height = heightData / 2.54;
            this.weightUnits = 'kg';
            this.heightMainUnits = 'm';
            this.heightSubUnits = 'cm';
        } else {
            this.weight = weightData;
            this.height = heightData;
            this.weightUnits = 'lbs';
            this.heightMainUnits = 'feet';
            this.heightSubUnits = 'inces';
        }
        this.diet = diet || 'Unknown';
        // this.where = where || 'Unknown';
        // this.when = when || 'Unknown';
        this.facts = [fact || 'No fact', `The ${species}'s living area was ${where}`, `The ${species} lived in the ${when} age`];
    }

    // Create Dino Objects 
    /**
     * @description Async loads dino data from a static URL
     * @description Iterates through received data items to create Dino objects
     * @description Runs three comparators that create additional facts
     * @param {*} human An object with user data from the form
     * @returns {Promise} A promise that resolves to an array of Dinos
     */
    const fetchDinos = async (human) => {
        let dinos = await fetch('./dino.json')
            .then(resp => resp.json())
            .catch(err => {
                throw new Error(err)
            });
        return dinos.Dinos.map(data => {
            const dino = new Dino(data, human);
            dino.compareHeight(human.height);
            dino.compareWeight(human.weight);
            dino.compareDiet(human.diet);
            return dino;
        });
    };

    // Use IIFE to 
    /**
     * @description gets human data from the form
     * @returns {*} an object with methods to retrieve form values
     */
    const formData = (function () {
        const nameInput = userForm.name;
        const heightMainUnitInput = userForm.feet;
        const heightSubUnitInput = userForm.inches;
        const units = userForm.units;
        const weightInput = userForm.weight;
        const dietInput = userForm.diet;

        /**
         * @returns {string} value of name input
         */
        function getName() {
            return nameInput.value
        }
        /**
         * @returns {string} 'metric' or 'imperial'
         */
        function getUnitSystem() {
            return units.options[units.selectedIndex].value;
        }
        /**
         * @returns {number} height in inches or cm depending on getUnitSysyem()
         */
        function getHeight() {
            const mainValue = parseFloat(heightMainUnitInput.value) || 0;
            const subValue = parseFloat(heightSubUnitInput.value) || 0;
            if (getUnitSystem() === 'imperial') {
                return mainValue * 12 + subValue;
            } else {
                return (mainValue * 100 + subValue) / 2.54;
            }
        }
        /**
         * @returns {number} weight in lbs or kg depending on getUnitSysyem()
         */
        function getWeight() {
            const value = parseFloat(weightInput.value) || 0;
            return getUnitSystem() === 'imperial' ? value : value * 2.20462;
        }
        /**
         * @returns {string} the value of the Diet selector
         */
        function getDiet() {
            return dietInput.options[dietInput.selectedIndex].textContent;
        }
        return {
            getName,
            getUnitSystem,
            getHeight,
            getWeight,
            getDiet
        };
    })();



    // Create Human Object
    /**
     * @description Validates user form input and creates a Human object
     * @description which can be handled the same way as the Dino
     * @returns {*} An object with user data and two methods 
     */
    const createHuman = () => {
        const diet = formData.getDiet();
        const unitSystem = formData.getUnitSystem();
        const name = formData.getName();
        if (!name) {
            return {
                valid: false,
                errorMessage: 'Sorry, we can\'t talk to someone with no name )'
            };
        }
        const weight = formData.getWeight();
        if (weight <= 0) {
            return {
                valid: false,
                errorMessage: `${diet} diet seems to do no good for you! Get some weight!`
            };
        }
        const height = formData.getHeight();
        if (height <= 0) {
            return {
                valid: false,
                errorMessage: `To get compared to a dino you gotta be taller than 0 ${unitSystem === 'metric' ? 'cm' : 'inches'}`
            };
        }
        return {
            valid: true,
            diet,
            weight,
            height,
            unitSystem,
            species: name,
            getRandomFact: () => '',
            getImagePath: () => 'images/human.png'
        };
    }

    // Dino Compare Method 1
    /**
     * @description Compares the height parameter to produce additional fact
     * @description stores the fact in the facts array in the Dino object
     * @param {number} userHeight User height collected from user input
     */
    Dino.prototype.compareHeight = function cmpHeight(userHeight) {
        const heightDiff = this.height - userHeight;
        const tallerOrShorter = heightDiff > 0 ? 'taller' : 'shorter';
        // helper function
        /**
         * @description Generates the bulk of the output string
         * @param {*} this_ Dino instsnce
         */
        function heightReading(this_) {
            let heightString = `The ${this_.species} was `;
            const systemFactor = this_.unitSystem === 'metric' ? 100 : 12;
            const mainUnits = Math.abs(Math.floor(heightDiff / systemFactor));
            const subUnits = Math.abs(heightDiff % systemFactor);
            if (mainUnits > 0) {
                heightString += `${mainUnits} ${this_.heightMainUnits} `;
            }
            if (subUnits > 0) {
                heightString += `${subUnits.toPrecision(2)} ${this_.heightSubUnits} `;
            }
            heightString += `${tallerOrShorter} than the humanoid in front of the screen`;
            return heightString;
        }

        if (heightDiff === 0) {
            this.facts.push(`The ${this.species} was as tall as the humanoid in front of the screen`);
        } else {
            // shorter or taller
            this.facts.push(heightReading(this));
        }
    }

    // Dino Compare Method 2
    /**
     * @description Compares the weight parameter to produce additional fact
     * @description stores the fact in the facts array in the Dino object
     * @param {number} userWeight User weight collected from user input
     */
    Dino.prototype.compareWeight = function cmpWeight(userWeight) {
        const weightDiff = Math.round(this.weight - userWeight);
        const hevierOrLighter = weightDiff > 0 ? 'heavier ' : 'lighter ';
        if (weightDiff === 0) {
            this.facts.push(`The ${this.species} was as heaavy as the humanoid in front of the screen`);
        } else {
            this.facts.push(`The ${this.species} was ${Math.abs(weightDiff)} ${this.weightUnits} ${hevierOrLighter} than the humanoid in front of the screen`);
        }

    }

    // Dino Compare Method 3
    /**
     * @description Compares the diet parameter to produce additional fact
     * @description stores the fact in the facts array in the Dino object
     * @param {string} userDiet User diet collected from user input
     */
    Dino.prototype.compareDiet = function cmpDiet(userDiet) {
        if (this.diet == userDiet.toLowerCase()) {
            this.facts.push(`The ${this.species} had the same ${userDiet} diet as the humanoid in front of the screen`);
        } else {
            this.facts.push(`The ${this.species} had a different diet from that of a humanoid in front of the screen`);
        }
    }
    /**
     * @description Depending on species pulls a random fact from the array of facts
     * @returns {string} The random fact
     */
    Dino.prototype.getRandomFact = function getFact() {
        if (this.species === 'Pigeon') {
            return this.facts[0];
        }
        function randomInt(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }
        return this.facts[randomInt(6)];
    };

    /**
     * @description Returns a path to the species'image based on the species' name
     * @returns {string} A path to be used in src attribute
     */
    Dino.prototype.getImagePath = function getPath() {
        return `images/${this.species.toLowerCase()}.png`
    }

    // Generate Tiles for each Dino in Array
    /**
     * @description Generates Tiles for each Dino in
     * @param {{}[]} tilesData
     * @returns HTMLElement[] an array of HTML elements
     */
    function makeTiles(tilesData, humanData) {
        tilesData.splice(4, 0, humanData);
        return tilesData.map(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = 'grid-item';
            const tileImage = document.createElement('img');
            // tileImage.setAttribute('src', `images/${tile.species.toLowerCase()}.png`);
            tileImage.setAttribute('src', tile.getImagePath());
            tileImage.setAttribute('alt', tile.species.toLowerCase());
            const tileHeader = document.createElement('h3');
            tileHeader.textContent = tile.species;
            const tileFact = document.createElement('p');
            tileFact.textContent = tile.getRandomFact();
            tileElement.append(tileHeader, tileImage, tileFact);
            return tileElement;
        });
    }

    /**
     * @description Appends an array of elements to the DOM
     * @param {*} tileElements An array of HTML Elements
     */
    function displayTiles(tileElements) {
        const fragment = document.createDocumentFragment();
        tileElements.forEach(element => {
            fragment.append(element);
        });
        grid.append(fragment);
    }

    // On button click, prepare and display infographic
    /**
     * @description The main program flow sequence
     * @param {Event} e Click event
     */
    function showInfographic(e) {
        const user = createHuman();
        if (!user.valid) {
            errorMessage.show(user.errorMessage);
        } else {
            errorMessage.hide();
            startOverBtn.show();
            userForm.hide();
            fetchDinos(user)
                .then(dinos => makeTiles(dinos, user))
                .then(tiles => displayTiles(tiles));
        }
    }
    /**
     * @description Converts form values between metric and imperial units
     * @param {Event} evt Units selector change event
     */
    const setUnits = function (evt) {
        const system = this.options[this.selectedIndex].value;
        this.form.system.value = system;
        const weight = this.form.weight.value;
        const heightMain = this.form.feet.value;
        const heightSub = this.form.inches.value;
        if (system === 'metric') {
            this.form.querySelector('.height-main-unit').childNodes[0].textContent = 'Meters: ';
            this.form.querySelector('.height-sub-unit').childNodes[0].textContent = 'Centimeters: ';
            this.form.querySelector('.weight').childNodes[1].textContent = 'kg: ';
            this.form.weight.value = weight ? parseFloat(weight) / 2.20462 : '';
            this.form.feet.value = heightMain ? heightMain / 3.28084 : '';
            this.form.inches.value = heightSub ? heightSub * 2.54 : '';
            // TODO
            // height unit conversion must use cumulative value from feet and inches
        } else if (system === 'imperial') {
            this.form.querySelector('.height-main-unit').childNodes[0].textContent = 'Feet: ';
            this.form.querySelector('.height-sub-unit').childNodes[0].textContent = 'inches: ';
            this.form.querySelector('.weight').childNodes[1].textContent = 'lbs: ';
            this.form.weight.value = weight ? parseFloat(weight) * 2.20462 : '';
            this.form.feet.value = heightMain ? heightMain * 3.28084 : '';
            this.form.inches.value = heightSub ? heightSub / 2.54 : '';
        }
    }
    // attach event listeners to DOM elements
    document.getElementById('btn').addEventListener('click', showInfographic);
    userForm.units.addEventListener('change', setUnits);
    startOverBtn.getInstance().addEventListener('click', startOver);
})(window);

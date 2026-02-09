
// This function is called when any of the tab is clicked
// It is adapted from https://www.w3schools.com/howto/howto_js_tabs.asp

function openInfo(evt, tabName) {

	const tabcontent = document.getElementsByClassName("tabcontent");
	for (let i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	const tablinks = document.getElementsByClassName("tablinks");
	for (let i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	document.getElementById(tabName).style.display = "block";
	evt.currentTarget.className += " active";

	if (tabName === "Products") {
		populateListProductChoices("displayProduct");
	}
}

let searchInput = "";
function updateSearch(text) {
	searchInput = String(text).toLowerCase();
	populateListProductChoices('displayProduct');
}

function getPriceBounds() {
	let min = Infinity;
	let max = -Infinity;

	for (let i = 0; i < products.length; i++) {
		if (products[i].price < min) min = products[i].price;
		if (products[i].price > max) max = products[i].price;
	}

	if (!isFinite(min) || !isFinite(max)) {
		min = 0;
		max = 100;
	}

	return { min, max };
}

function updatePriceUI() {
	const minEl = document.getElementById("priceMin");
	const maxEl = document.getElementById("priceMax");
	const minText = document.getElementById("priceMinText");
	const maxText = document.getElementById("priceMaxText");

	if (!minEl || !maxEl) return;

	// ensure min <= max
	let minVal = Number(minEl.value);
	let maxVal = Number(maxEl.value);

	if (minVal > maxVal) {
		// snap the moved slider back into valid range
		minVal = maxVal;
		minEl.value = String(minVal);
	}

	if (minText) minText.textContent = "$" + minVal.toFixed(2);
	if (maxText) maxText.textContent = "$" + maxVal.toFixed(2);

	populateListProductChoices("displayProduct");
}

// generate a checkbox list from a list of products
// it makes each product name as the label for the checkbos

function populateListProductChoices(slct2) {
	let s2 = document.getElementById(slct2);
	s2.innerHTML = "";

	// get diet restrictions
	let restrictions = [];
	const dietSelect = document.getElementById("dietSelect");
	if (dietSelect && dietSelect.value && dietSelect.value !== "None") {
		restrictions.push(dietSelect.value);
	}

	// get organic preference
	let organicPref = "None";
	let radios = document.getElementsByName("organicOption");
	for (let i = 0; i < radios.length; i++) {
		if (radios[i].checked) {
			organicPref = radios[i].value;
		}
	}

	// filters based on categories
	let categories = [];
	let categoryCheckboxes = document.getElementsByName("category");
	for (let i = 0; i < categoryCheckboxes.length; i++) {
		if (categoryCheckboxes[i].checked) {
			categories.push(categoryCheckboxes[i].value);
		}
	}

	const minEl = document.getElementById("priceMin");
	const maxEl = document.getElementById("priceMax");
	const priceMin = minEl ? Number(minEl.value) : NaN;
	const priceMax = maxEl ? Number(maxEl.value) : NaN;

	// sort order
	const sortEl = document.getElementById("sortOrder");
	const sortOrder = sortEl ? sortEl.value : "asc";

	let options = restrictListProducts(products, restrictions, organicPref, categories, priceMin, priceMax, sortOrder);

	// This if statemetn is for input protection to prevent crashing
	if (searchInput !== "") {
		options = options.filter(p => p.name.toLowerCase().includes(searchInput));
	}

	for (let i = 0; i < options.length; i++) {
		let wrapper = document.createElement("div");
		wrapper.className = "product-item";

		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "product";
		checkbox.value = options[i].name;

		let label = document.createElement("label");
		label.appendChild(
			document.createTextNode(
				options[i].name + " ($" + options[i].price.toFixed(2) + ")"
			)
		);

		
		let img = document.createElement("img");
		img.className = "product-image";
		img.src = options[i].image;     
		img.alt = options[i].name;
		
		img.onerror = function () {
		console.log("Image not found:", img.src);
	    };


		wrapper.appendChild(checkbox);
		wrapper.appendChild(label);
		wrapper.appendChild(document.createElement("br"));
		wrapper.appendChild(img);

		s2.appendChild(wrapper);
	}
}

	
// This function is called when the "Add selected items to cart" button in clicked
// The purpose is to build the HTML to be displayed (a Paragraph) 
// We build a paragraph to contain the list of selected items, and the total price

function selectedItems(){
	
	var ele = document.getElementsByName("product");
	var chosenProducts = [];
	
	var c = document.getElementById('displayCart');
	c.innerHTML = "";
	
	// build list of selected item
	var para = document.createElement("P");
	para.innerHTML = "You selected : ";
	para.appendChild(document.createElement("br"));
	for (i = 0; i < ele.length; i++) { 
		if (ele[i].checked) {
			para.appendChild(document.createTextNode(ele[i].value));
			para.appendChild(document.createElement("br"));
			chosenProducts.push(ele[i].value);
		}
	}
		
	// add paragraph and total price
	c.appendChild(para);
	let total = getTotalPrice(chosenProducts);
	c.appendChild(document.createTextNode("Total Price is [CAD]: $" + total.toFixed(2)));
		
}

//https://www.w3schools.com/JSREF/event_onload.asp
// Used that and some stack overflow sites to model this logic.

window.onload = function () {
	// initialize price slider bounds based on products
	const bounds = getPriceBounds();

	const minEl = document.getElementById("priceMin");
	const maxEl = document.getElementById("priceMax");

	if (minEl && maxEl) {
		minEl.min = bounds.min.toFixed(2);
		minEl.max = bounds.max.toFixed(2);
		minEl.value = bounds.min.toFixed(2);

		maxEl.min = bounds.min.toFixed(2);
		maxEl.max = bounds.max.toFixed(2);
		maxEl.value = bounds.max.toFixed(2);

		updatePriceUI();
	}

	// open first tab by default
	const firstTab = document.querySelector(".tablinks");
	if (firstTab) firstTab.click();
};
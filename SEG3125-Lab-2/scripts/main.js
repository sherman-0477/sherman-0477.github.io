
// This function is called when any of the tab is clicked
// It is adapted from https://www.w3schools.com/howto/howto_js_tabs.asp

function openInfo(evt, tabName) {

	// Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	// Show the current tab, and add an "active" class to the button that opened the tab
	document.getElementById(tabName).style.display = "block";
	evt.currentTarget.className += " active";

}


	
// generate a checkbox list from a list of products
// it makes each product name as the label for the checkbos

function populateListProductChoices(slct2) {
	let s2 = document.getElementById(slct2);
	s2.innerHTML = "";

	// get diet restrictions
	let restrictions = [];
	let diets = document.getElementsByName("diet");
	for (let i = 0; i < diets.length; i++) {
		if (diets[i].checked) {
			restrictions.push(diets[i].value);
		}
	}

	// get organic preference
	let organicPref = "None";
	let radios = document.getElementsByName("organicOption");
	for (let i = 0; i < radios.length; i++) {
		if (radios[i].checked) {
			organicPref = radios[i].value;
		}
	}

	let options = restrictListProducts(products, restrictions, organicPref);

	for (let i = 0; i < options.length; i++) {
		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "product";
		checkbox.value = options[i].name;
		s2.appendChild(checkbox);

		let label = document.createElement("label");
		label.appendChild(
			document.createTextNode(
				options[i].name + " ($" + options[i].price.toFixed(2) + ")"
			)
		);
		s2.appendChild(label);

		s2.appendChild(document.createElement("br"));
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
	c.appendChild(document.createTextNode("Total Price is [CAD]: $" + getTotalPrice(chosenProducts)));
		
}


	
// Array of products, each product is an object with different fieldset
// A set of ingredients should be added to products		 

var products = [
  { name: "Broccoli",        vegetarian: true,  glutenFree: true,  organic: true,  category: "Vegetable", price: 4.99,  image: "images/products/1.jpg" },
  { name: "Apples (bag)",    vegetarian: true,  glutenFree: true,  organic: true,  category: "Fruits",    price: 6.99,  image: "images/products/2.jpg" },
  { name: "Rice",            vegetarian: true,  glutenFree: true,  organic: true,  category: "Vegetable", price: 9.79,  image: "images/products/3.jpg" },
  { name: "Eggs (12)",       vegetarian: true,  glutenFree: true,  organic: true,  category: "Dairy",     price: 4.19,  image: "images/products/4.jpg" },
  { name: "Chicken Breast",  vegetarian: false, glutenFree: true,  organic: true,  category: "Meat",      price: 11.99, image: "images/products/5.jpg" },
  { name: "Bread",           vegetarian: true,  glutenFree: false, organic: false, category: "Vegetable", price: 2.35,  image: "images/products/6.jpg" },
  { name: "Pasta (wheat)",   vegetarian: true,  glutenFree: false, organic: false, category: "Vegetable", price: 1.59,  image: "images/products/7.jpg" },
  { name: "Oats",            vegetarian: true,  glutenFree: false, organic: false, category: "Vegetable", price: 3.99,  image: "images/products/8.jpg" },
  { name: "Greek Yogurt",    vegetarian: true,  glutenFree: true,  organic: false, category: "Dairy",     price: 6.49,  image: "images/products/9.jpg" },
  { name: "Cheddar Cheese",  vegetarian: true,  glutenFree: true,  organic: false, category: "Dairy",     price: 4.49,  image: "images/products/10.jpg" },
  { name: "Salmon Fillet",   vegetarian: false, glutenFree: true,  organic: false, category: "Meat",      price: 15.00, image: "images/products/11.jpg" }
];
	


// given restrictions provided, make a reduced list of products
// prices should be included in this list, as well as a sort based on price

function restrictListProducts(prods, restrictions, organicPref, categories, priceMin, priceMax, sortOrder) {
	let filtered = [];


	const minP = Number(priceMin);
	const maxP = Number(priceMax);
	const hasMin = Number.isFinite(minP);
	const hasMax = Number.isFinite(maxP);

	for (let i = 0; i < prods.length; i++) {
		let ok = true;

		if (restrictions.includes("Vegetarian") && !prods[i].vegetarian) ok = false;
		if (restrictions.includes("GlutenFree") && !prods[i].glutenFree) ok = false;

		if (organicPref === "Organic" && !prods[i].organic) ok = false;
		if (organicPref === "Non-Organic" && prods[i].organic) ok = false;

		if (categories.length > 0 && !categories.includes(prods[i].category)) ok = false;


		if (hasMin && prods[i].price < minP) ok = false;
		if (hasMax && prods[i].price > maxP) ok = false;

		if (ok) filtered.push(prods[i]);
	}


	if (sortOrder === "desc") {
		filtered.sort((a, b) => b.price - a.price);
	} else {
		filtered.sort((a, b) => a.price - b.price);
	}

	return filtered;
}


// Calculate the total price of items, with received parameter being a list of products
function getTotalPrice(chosenProducts) {
	let totalPrice = 0;
	for (let i=0; i<products.length; i+=1) {
		if (chosenProducts.indexOf(products[i].name) > -1){
			totalPrice += products[i].price;
		}
	}
	return totalPrice;
}

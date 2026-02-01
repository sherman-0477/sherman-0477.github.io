	
// Array of products, each product is an object with different fieldset
// A set of ingredients should be added to products		 

var products = [
  { name: "Broccoli",        vegetarian: true,  glutenFree: true,  organic: true,  price: 4.99 },
  { name: "Apples (bag)",    vegetarian: true,  glutenFree: true,  organic: true,  price: 6.99 },
  { name: "Rice",            vegetarian: true,  glutenFree: true,  organic: true,  price: 9.79 },
  { name: "Eggs (12)",       vegetarian: true,  glutenFree: true,  organic: true,  price: 4.19 },
  { name: "Chicken Breast",  vegetarian: false, glutenFree: true,  organic: true,  price: 11.99 },

  { name: "Bread",           vegetarian: true,  glutenFree: false, organic: false, price: 2.35 },
  { name: "Pasta (wheat)",   vegetarian: true,  glutenFree: false, organic: false, price: 1.59 },
  { name: "Oats",            vegetarian: true,  glutenFree: false, organic: false, price: 3.99 },
  { name: "Greek Yogurt",    vegetarian: true,  glutenFree: true,  organic: false, price: 6.49 },
  { name: "Cheddar Cheese",  vegetarian: true,  glutenFree: true,  organic: false, price: 4.49 },
  { name: "Salmon Fillet",   vegetarian: false, glutenFree: true,  organic: false, price: 15.00 }
];
	


// given restrictions provided, make a reduced list of products
// prices should be included in this list, as well as a sort based on price

function restrictListProducts(prods, restrictions, organicPref) {
	let filtered = [];

	for (let i = 0; i < prods.length; i++) {
		let ok = true;

		if (restrictions.includes("Vegetarian") && !prods[i].vegetarian) ok = false;
		if (restrictions.includes("GlutenFree") && !prods[i].glutenFree) ok = false;

		if (organicPref === "Organic" && !prods[i].organic) ok = false;
		if (organicPref === "Non-Organic" && prods[i].organic) ok = false;

		if (ok) filtered.push(prods[i]);
	}
    
	filtered.sort((a, b) => a.price - b.price);	
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

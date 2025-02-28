const fs = require("fs");
const csv = require("csv-parser");
const readline = require("readline-sync");

// Define the demand parameter vector (theta_0)
const theta_0 = [0.9, 0.1]; // Adjusted weights for Unit Price & Rating
const eta_t = 0.01; // Fixed noise term

const inputFilePath = "converted_prices.csv";
let categories = new Set();
let products = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on("data", (row) => {
    if (row["Category"]) {
      categories.add(row["Category"].trim());
      products.push(row);
    }
  })
  .on("end", () => {
    categories = [...categories];

    // Step 1: Ask user to select a category
    console.log("\nAvailable Categories:");
    categories.forEach((cat, index) => console.log(`${index + 1}. ${cat}`));

    const categoryIndex = readline.questionInt("\nEnter category number: ") - 1;
    if (categoryIndex < 0 || categoryIndex >= categories.length) {
      console.log("Invalid category selection. Exiting...");
      return;
    }
    const selectedCategory = categories[categoryIndex];

    // Step 2: Get all products under the selected category
    const categoryProducts = products
      .filter((p) => p["Category"].trim() === selectedCategory)
      .map((p) => p["Product Name"].trim());

    if (categoryProducts.length === 0) {
      console.log("\nNo products found in this category. Exiting...");
      return;
    }

    // Step 3: Display all products in the selected category
    console.log(`\nProducts in ${selectedCategory}:`);
    categoryProducts.forEach((product, index) => console.log(`${index + 1}. ${product}`));

    // Step 4: Ask user to select a product from the list
    const productIndex = readline.questionInt("\nEnter product number: ") - 1;
    if (productIndex < 0 || productIndex >= categoryProducts.length) {
      console.log("Invalid product selection. Exiting...");
      return;
    }
    const selectedProduct = categoryProducts[productIndex];

    // Step 5: Find the selected product in the dataset
    const product = products.find(
      (p) => p["Category"].trim() === selectedCategory && p["Product Name"].trim() === selectedProduct
    );

    if (!product) {
      console.log("\nProduct not found. Exiting...");
      return;
    }

    // Step 6: Extract features and compute market value
    const unitPrice = parseFloat(product["Unit Price"].replace(/[^0-9.]/g, "")) || 0;
    const rating = parseFloat(product["Rating"]) || 0;
    const features = [unitPrice, rating];

    const marketValue = features.reduce((sum, value, index) => sum + value * theta_0[index], 0) + eta_t;

    // Step 7: Display the result
    console.log(`\nProduct: ${selectedProduct}`);
    console.log(`Category: ${selectedCategory}`);
    console.log(`Market Value: ${marketValue.toFixed(2)}\n`);
  });


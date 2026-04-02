export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  inStock: boolean;
}

export const products: Product[] = [
  { id: 1, name: "Organic Bananas", category: "Fruits", price: 1.29, unit: "bunch", inStock: true },
  { id: 2, name: "Whole Milk (1 gal)", category: "Dairy", price: 3.99, unit: "gal", inStock: true },
  { id: 3, name: "Sourdough Bread", category: "Bakery", price: 4.49, unit: "loaf", inStock: true },
  { id: 4, name: "Free-Range Eggs (12)", category: "Dairy", price: 5.99, unit: "dozen", inStock: true },
  { id: 5, name: "Chicken Breast", category: "Meat", price: 8.99, unit: "lb", inStock: true },
  { id: 6, name: "Atlantic Salmon", category: "Seafood", price: 12.99, unit: "lb", inStock: false },
  { id: 7, name: "Baby Spinach", category: "Vegetables", price: 3.49, unit: "bag", inStock: true },
  { id: 8, name: "Avocados", category: "Fruits", price: 1.99, unit: "each", inStock: true },
  { id: 9, name: "Greek Yogurt", category: "Dairy", price: 4.29, unit: "tub", inStock: true },
  { id: 10, name: "Pasta (Penne)", category: "Pantry", price: 1.79, unit: "box", inStock: true },
  { id: 11, name: "Olive Oil (Extra Virgin)", category: "Pantry", price: 7.99, unit: "bottle", inStock: true },
  { id: 12, name: "Roma Tomatoes", category: "Vegetables", price: 2.49, unit: "lb", inStock: true },
  { id: 13, name: "Cheddar Cheese", category: "Dairy", price: 5.49, unit: "block", inStock: true },
  { id: 14, name: "Orange Juice", category: "Beverages", price: 4.99, unit: "carton", inStock: true },
  { id: 15, name: "Ground Coffee", category: "Beverages", price: 9.99, unit: "bag", inStock: false },
];

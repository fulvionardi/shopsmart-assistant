export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  inStock: boolean;
  packageSize: string | null;
}

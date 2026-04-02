import { ShoppingCart } from "lucide-react";
import { products, Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductTableProps {
  onAddToCart: (product: Product) => void;
  cartItems: Map<number, number>;
}

const ProductTable = ({ onAddToCart, cartItems }: ProductTableProps) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Product</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold text-right">Price</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const qty = cartItems.get(product.id) || 0;
            return (
              <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${product.price.toFixed(2)}/{product.unit}
                </TableCell>
                <TableCell className="text-center">
                  {product.inStock ? (
                    <Badge className="bg-primary text-primary-foreground">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    onClick={() => onAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {qty > 0 ? `In Cart (${qty})` : "Add"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductTable;

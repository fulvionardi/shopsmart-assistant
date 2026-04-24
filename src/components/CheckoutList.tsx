import { Minus, Plus, Trash2 } from "lucide-react";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CheckoutListProps {
  cartItems: Map<number, number>;
  products: Product[];
  onUpdateQty: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
}

const CheckoutList = ({ cartItems, products, onUpdateQty, onRemove }: CheckoutListProps) => {
  const entries = Array.from(cartItems.entries())
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
    .filter((e) => e.product);

  const total = entries.reduce((sum, e) => sum + e.product.price * e.qty, 0);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShoppingCartEmpty />
        <p className="mt-4 text-lg">Your cart is empty</p>
        <p className="text-sm">Add products from the Products tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold text-center">Qty</TableHead>
              <TableHead className="font-semibold text-right">Unit Price</TableHead>
              <TableHead className="font-semibold text-right">Subtotal</TableHead>
              <TableHead className="font-semibold text-center">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(({ product, qty }) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-medium">{qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(product.id, 1)} disabled={qty >= product.quantity}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">${(product.price * qty).toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <div className="rounded-lg border bg-card p-4 w-64 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Items ({entries.reduce((s, e) => s + e.qty, 0)})</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button className="w-full mt-2">Proceed to Checkout</Button>
        </div>
      </div>
    </div>
  );
};

const ShoppingCartEmpty = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

export default CheckoutList;

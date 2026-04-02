import { useState, useCallback } from "react";
import { ShoppingBasket, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ProductTable from "@/components/ProductTable";
import CheckoutList from "@/components/CheckoutList";
import ChatbotWidget from "@/components/ChatbotWidget";
import { products, Product } from "@/data/products";

const Index = () => {
  const [cartItems, setCartItems] = useState<Map<number, number>>(new Map());

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      next.set(product.id, (next.get(product.id) || 0) + 1);
      return next;
    });
  }, []);

  const updateQty = useCallback((productId: number, delta: number) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      const newQty = (next.get(productId) || 0) + delta;
      if (newQty <= 0) next.delete(productId);
      else next.set(productId, newQty);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const totalItems = Array.from(cartItems.values()).reduce((s, q) => s + q, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center gap-3">
          <ShoppingBasket className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">FreshMart</h1>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBasket className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="checkout" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Checkout
              {totalItems > 0 && (
                <Badge className="ml-1 h-5 min-w-[20px] px-1.5 text-xs bg-primary text-primary-foreground">
                  {totalItems}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductTable onAddToCart={addToCart} cartItems={cartItems} />
          </TabsContent>

          <TabsContent value="checkout">
            <CheckoutList
              cartItems={cartItems}
              products={products}
              onUpdateQty={updateQty}
              onRemove={removeItem}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default Index;

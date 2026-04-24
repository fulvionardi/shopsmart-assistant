import { useState, useCallback, useEffect } from "react";
import { ShoppingBasket, ShoppingCart, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProductTable from "@/components/ProductTable";
import CheckoutList from "@/components/CheckoutList";
import ChatbotWidget from "@/components/ChatbotWidget";
import { Product } from "@/data/products";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<Map<number, number>>(new Map());
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const current = prev.get(product.id) || 0;
      if (current >= product.quantity) return prev;
      const next = new Map(prev);
      next.set(product.id, current + 1);
      return next;
    });
  }, []);

  const updateQty = useCallback((productId: number, delta: number) => {
    setCartItems((prev) => {
      const product = products.find((p) => p.id === productId);
      const newQty = (prev.get(productId) || 0) + delta;
      if (newQty <= 0) {
        const next = new Map(prev);
        next.delete(productId);
        return next;
      }
      if (product && newQty > product.quantity) return prev;
      const next = new Map(prev);
      next.set(productId, newQty);
      return next;
    });
  }, [products]);

  const removeItem = useCallback((productId: number) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);


  // Called when user confirms a recipe proposal
  const handleAddBatchToCart = useCallback(
    async (items: { product_id: number; name: string; quantity: number }[]) => {
      console.log("[batch] sending items:", items);
      const res = await fetch("/api/cart/add-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items.map((i) => ({ product_id: i.product_id, name: i.name, quantity: i.quantity }))),
      });
      const data: { results: { product_id: number; quantity: number; success: boolean }[] } = await res.json();

      // Backend returns resolved product_id and quantity — use them directly
      setCartItems((prev) => {
        const next = new Map(prev);
        data.results.forEach(({ product_id, quantity, success }) => {
          if (!success) return;
          next.set(product_id, (next.get(product_id) || 0) + quantity);
        });
        return next;
      });

      // Refresh products so displayed quantities are up to date
      fetch("/api/products").then((r) => r.json()).then(setProducts).catch(console.error);

      return data.results;
    },
    [],
  );

  const totalItems = Array.from(cartItems.values()).reduce((s, q) => s + q, 0);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center gap-3">
          <ShoppingBasket className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">FreshMart</h1>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ProductTable
              products={filteredProducts}
              onAddToCart={addToCart}
              cartItems={cartItems}
            />
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

      <ChatbotWidget onAddBatchToCart={handleAddBatchToCart} />
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Coins, Package, Star, Crown, Zap, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isAvailable: boolean;
  metadata: any;
}

interface UserPurchase {
  id: string;
  userId: string;
  itemId: string;
  purchasedAt: string;
  isActive: boolean;
  item: ShopItem;
}

interface UserInventory {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  obtainedAt: string;
  item: ShopItem;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'common': return <Star className="w-3 h-3" />;
    case 'rare': return <Sparkles className="w-3 h-3" />;
    case 'epic': return <Zap className="w-3 h-3" />;
    case 'legendary': return <Crown className="w-3 h-3" />;
    default: return <Star className="w-3 h-3" />;
  }
};

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch shop items
  const { data: shopItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/shop/items', selectedCategory],
    queryFn: () => apiRequest(`/api/shop/items${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`)
  });

  // Fetch user coins
  const { data: coinsData, isLoading: coinsLoading } = useQuery({
    queryKey: ['/api/shop/coins'],
    queryFn: () => apiRequest('/api/shop/coins')
  });

  // Fetch user purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/shop/purchases'],
    queryFn: () => apiRequest('/api/shop/purchases')
  });

  // Fetch user inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/shop/inventory'],
    queryFn: () => apiRequest('/api/shop/inventory')
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest('/api/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Purchase successful!",
        description: "Item has been added to your inventory.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/coins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/inventory'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Unable to purchase item",
        variant: "destructive"
      });
    }
  });

  const handlePurchase = (item: ShopItem) => {
    if (coinsData?.coins < item.price) {
      toast({
        title: "Insufficient coins",
        description: `You need ${item.price} coins but only have ${coinsData?.coins}.`,
        variant: "destructive"
      });
      return;
    }

    purchaseMutation.mutate(item.id);
  };

  const isPurchased = (itemId: string) => {
    return purchases.some((purchase: UserPurchase) => purchase.itemId === itemId);
  };

  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️' },
    { id: 'theme', name: 'Themes', icon: '🎨' },
    { id: 'powerup', name: 'Power-ups', icon: '⚡' },
    { id: 'cosmetic', name: 'Cosmetics', icon: '✨' },
    { id: 'upgrade', name: 'Upgrades', icon: '⬆️' },
    { id: 'special', name: 'Special', icon: '🎁' },
  ];

  if (itemsLoading || coinsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Game Shop
          </h1>
          <p className="text-gray-600 mt-1">Upgrade your gaming experience with premium items</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">
              {coinsData?.coins || 0} coins
            </span>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory ({inventory.length})
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopItems.map((item: ShopItem) => (
              <Card key={item.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getRarityColor(item.rarity)}>
                            {getRarityIcon(item.rarity)}
                            <span className="ml-1 capitalize">{item.rarity}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {item.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold text-lg">{item.price}</span>
                    </div>
                    
                    {isPurchased(item.id) ? (
                      <Button disabled size="sm" className="bg-green-500 hover:bg-green-600">
                        ✓ Owned
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedItem(item)}
                            disabled={coinsData?.coins < item.price}
                          >
                            {coinsData?.coins < item.price ? 'Not enough coins' : 'Buy Now'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <span className="text-2xl">{item.icon}</span>
                              {item.name}
                            </DialogTitle>
                            <DialogDescription>
                              {item.description}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span>Price:</span>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-yellow-600" />
                                <span className="font-semibold">{item.price} coins</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span>Your balance:</span>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-yellow-600" />
                                <span className="font-semibold">{coinsData?.coins || 0} coins</span>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between">
                              <span>After purchase:</span>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-yellow-600" />
                                <span className="font-semibold">
                                  {(coinsData?.coins || 0) - item.price} coins
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handlePurchase(item)}
                              disabled={coinsData?.coins < item.price || purchaseMutation.isPending}
                              className="w-full"
                            >
                              {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {shopItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No items found</h3>
              <p className="text-gray-500">
                {selectedCategory === 'all' 
                  ? 'The shop is currently empty. Check back later!' 
                  : `No items available in the ${selectedCategory} category.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
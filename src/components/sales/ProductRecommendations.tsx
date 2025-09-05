import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingBag } from "lucide-react";
import { useProductRecommendations } from "@/services/products/ProductReactQueryService";
type RecommendedProduct = {
  id: string;
  name: string;
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  category_name?: string;
  recommendation_type: string;
  priority: number;
};

type ProductRecommendationsProps = {
  productId: string;
  onProductAdd: (product: any) => void;
  addedProductIds: string[];
};

export function ProductRecommendations({ 
  productId, 
  onProductAdd, 
  addedProductIds 
}: ProductRecommendationsProps) {
  const { data: recommendations = [], isLoading } = useProductRecommendations(productId);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Recommended Accessories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading recommendations...</div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  // Filter out products that are already added to the sale
  const availableRecommendations = recommendations.filter(
    rec => !addedProductIds.includes(rec.id)
  );

  if (availableRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <ShoppingBag className="h-4 w-4" />
          Recommended Accessories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableRecommendations.map((product) => (
          <div 
            key={product.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{product.brand} {product.model}</h4>
                <Badge variant="secondary" className="text-xs">
                  {product.recommendation_type}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Stock: {product.stock}
              </div>
              <div className="text-xs text-green-600 font-medium">
                ${product.min_price} - ${product.max_price}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-3 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => onProductAdd(product)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
// --- Product Types ---

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  category?: string;
  imageUrl?: string;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  category?: string;
  imageUrl?: string;
}

export type ProductResponse = Product;
export type ProductListResponse = Product[];
